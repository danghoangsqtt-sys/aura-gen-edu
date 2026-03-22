/**
 * ExamGeneratorService — Dedicated service for AI exam generation
 * Extracted from ollamaService.ts for separation of concerns.
 * Uses English-only Few-Shot prompts optimized for small Local LLMs.
 */

import { ExamConfig, Question } from "../types";
import { OllamaService } from "./ollamaService";
import { AIConfigService } from "./aiConfigService";
import { GoogleGenAI } from "@google/genai";

export class ExamGeneratorService {
  private static readonly GENERATE_ENDPOINT = 'http://localhost:11434/api/generate';
  private static readonly FETCH_TIMEOUT = 120000; // 120s for slow CPUs
  private static readonly MAX_PER_CALL = 8; // 8 questions per Ollama call (balanced for 1b-7b models)

  // ===== UTILITIES =====

  private static async fetchWithTimeout(url: string, options: any): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  /**
   * Re-use OllamaService model picking — it already has priority logic
   */
  private static async pickBestModel(): Promise<string> {
    const models = await OllamaService.fetchModels();
    const priority = ['qwen2.5:7b', 'qwen2.5:3b', 'llama3:8b', 'gemma2:9b', 'gemma2:2b', 'llama3.2:3b', 'llama3.2:1b'];
    for (const preferred of priority) {
      const [name, tag] = preferred.split(':');
      const found = models.find(m => m.startsWith(name) && m.includes(tag));
      if (found) return found;
    }
    return models[0] || 'llama3.2:1b';
  }

  /**
   * Extract clean JSON from LLM response (strips markdown fences, etc.)
   */
  private static extractJSON(raw: string): string {
    if (!raw) throw new Error('Empty response');
    let text = raw.trim();
    // Strip markdown code fences
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    // Find JSON boundaries
    const startObj = text.indexOf('{');
    const startArr = text.indexOf('[');
    if (startObj === -1 && startArr === -1) throw new Error('No JSON found in response');
    const start = (startObj >= 0 && startArr >= 0) ? Math.min(startObj, startArr) : Math.max(startObj, startArr);
    const isArray = text[start] === '[';
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === (isArray ? '[' : '{')) depth++;
      if (ch === (isArray ? ']' : '}')) depth--;
      if (depth === 0) return text.substring(start, i + 1);
    }
    return text.substring(start);
  }

  /**
   * Extract array from parsed JSON — handles both {questions:[...]} and [...]
   */
  private static extractArray(parsed: any): any[] {
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      for (const key of ['questions', 'data', 'items', 'results']) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
      // Try first array-valued key
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    }
    throw new Error('Response is not an array and has no array property');
  }

  // ===== POST-PROCESSING =====

  private static sanitizeQuestions(questions: any[]): Question[] {
    const prefixRegex = /^[A-Da-d][.)]\s*/;
    const numberPrefixRegex = /^[0-9]+[.)]\s*/;

    return questions.map((q, idx) => {
      // Strip letter/number prefixes from options
      if (Array.isArray(q.options)) {
        q.options = q.options.map((opt: string) => {
          if (typeof opt !== 'string') return String(opt);
          return opt.replace(prefixRegex, '').replace(numberPrefixRegex, '').trim();
        });
      }

      // Strip prefix from correctAnswer
      if (typeof q.correctAnswer === 'string') {
        q.correctAnswer = q.correctAnswer.replace(prefixRegex, '').replace(numberPrefixRegex, '').trim();
      }

      return {
        id: q.id || `auto_q${idx + 1}`,
        type: q.type || 'Trắc nghiệm',
        content: q.content || '',
        options: q.options,
        matchingLeft: q.matchingLeft,
        matchingRight: q.matchingRight,
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        bloomLevel: q.bloomLevel || 'Nhận biết',
        points: q.points
      } as Question;
    });
  }

  // ===== PROMPT BUILDER (English Few-Shot) =====

  private static buildPrompt(
    config: ExamConfig,
    section: ExamConfig['sections'][0],
    sectionIdx: number,
    batchCount: number,
    lastError?: string
  ): string {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const retryNote = lastError
      ? `\n[RETRY] Your previous response had this error: "${lastError}". Fix it.\n`
      : '';

    const focusTopic = config.customRequirement || config.topic;

    // Type-specific few-shot example
    const example = section.type === 'Trắc nghiệm'
      ? `{
  "questions": [
    {
      "id": "q1",
      "type": "Trắc nghiệm",
      "content": "She usually ___ to the library on weekends.",
      "options": ["go", "goes", "going", "gone"],
      "correctAnswer": "goes",
      "explanation": "Chủ ngữ 'She' là ngôi thứ 3 số ít nên động từ 'go' phải thêm 'es' trong thì hiện tại đơn.",
      "bloomLevel": "Nhận biết",
      "points": ${section.pointsPerQuestion}
    }
  ]
}`
      : section.type === 'Nối từ'
      ? `{
  "questions": [
    {
      "id": "q1",
      "type": "Nối từ",
      "content": "Match each word with its correct definition.",
      "matchingLeft": ["1. Abundant", "2. Scarce"],
      "matchingRight": ["a. Very few or not enough", "b. Existing in large quantities"],
      "correctAnswer": "1-b, 2-a",
      "explanation": "Abundant nghĩa là dồi dào, nhiều. Scarce nghĩa là khan hiếm, thiếu.",
      "bloomLevel": "Nhận biết",
      "points": ${section.pointsPerQuestion}
    }
  ]
}`
      : `{
  "questions": [
    {
      "id": "q1",
      "type": "${section.type}",
      "content": "Rewrite the sentence using the Present Simple tense: 'They (play) football every Saturday.'",
      "correctAnswer": "They play football every Saturday.",
      "explanation": "Chủ ngữ 'They' là số nhiều nên động từ 'play' giữ nguyên dạng gốc trong thì hiện tại đơn.",
      "bloomLevel": "Vận dụng",
      "points": ${section.pointsPerQuestion}
    }
  ]
}`;

    return `[Session: ${sessionId}] ${retryNote}
System: You are an expert English Teacher creating a test for Vietnamese students.
Your job is to generate exam questions that TEST English proficiency.

[MANDATORY FOCUS — ALL QUESTIONS MUST BE ABOUT THIS]:
"${focusTopic}"
WARNING: If ANY question is off-topic or does not relate to "${focusTopic}", the system will REJECT your entire response. You will need to redo it.

REQUIREMENTS:
- Subject: ${config.subject}
- General Topic: ${config.topic}${config.customRequirement ? `\n- Specific Requirement: ${config.customRequirement}` : ''}
- Difficulty: ${config.difficulty}
- Question Type: ${section.type}
- Bloom Levels: ${section.bloomLevels.join(', ')}
- Generate EXACTLY ${batchCount} questions.

CRITICAL RULES:
1. Question "content" must be in ENGLISH (testing English grammar/vocabulary/skills).
2. DO NOT write questions in Vietnamese. The test checks ENGLISH proficiency.
3. The "explanation" field MUST be in VIETNAMESE so students understand the grammar rule.
4. Each question must be UNIQUE and use a DIFFERENT context (school, work, travel, daily life, food, sports...).
5. For "options": write ONLY the text. NEVER add "A." "B." "C." "D." prefixes.
6. "correctAnswer" must EXACTLY match one item from "options".
7. Set "points" to ${section.pointsPerQuestion}.
8. Return ONLY a raw JSON object. No markdown, no extra text.

EXAMPLE OF A PERFECT RESPONSE (DO NOT COPY THIS — write NEW content about "${focusTopic}"):
${example}

Now generate ${batchCount} NEW, UNIQUE questions. Remember: every question MUST test "${focusTopic}".`;
  }

  // ===== MAIN ENTRY POINT (Factory Pattern) =====

  static async generateQuiz(config: ExamConfig): Promise<Question[]> {
    // Always read fresh from localStorage to respect latest user selection
    const freshConfig = AIConfigService.getFreshConfig();
    const provider = freshConfig.provider;
    console.info(`[ExamGen] Using provider: ${provider} (fresh read)`);

    if (provider === 'gemini') {
      try {
        return await this.generateViaGemini(config);
      } catch (err: any) {
        const msg = err.message || '';
        // Auto-fallback to Ollama if Gemini quota is exhausted
        if (msg.includes('hết hạn mức') || msg.includes('limit: 0') || msg.includes('liên tục bị giới hạn')) {
          console.warn('[ExamGen] Gemini quota exhausted — falling back to Ollama...');
          this.emitStatus('⚠️ Gemini hết hạn mức. Tự động chuyển sang AI Nội bộ (Ollama)...', 'warning');
          try {
            return await this.generateViaOllama(config);
          } catch (ollamaErr: any) {
            // If Ollama also fails, throw the original Gemini error + Ollama error
            throw new Error(`Gemini: ${msg}\nOllama fallback cũng thất bại: ${ollamaErr.message}`);
          }
        }
        throw err; // Re-throw non-quota errors
      }
    }
    return this.generateViaOllama(config);
  }

  // ===== GEMINI CLOUD PATH =====

  /** Parse retryDelay from Google error message */
  private static parseRetryDelay(errorMsg: string): number | null {
    // Format 1: "retryDelay":"24s"  (from RetryInfo object)
    const match1 = errorMsg.match(/retryDelay["\s:]*["']?(\d+)s/i);
    if (match1) return parseInt(match1[1], 10) * 1000;
    // Format 2: "Please retry in 24.847822339s."  (from error message)
    const match2 = errorMsg.match(/retry in (\d+(?:\.\d+)?)s/i);
    if (match2) return Math.ceil(parseFloat(match2[1]) * 1000);
    return null;
  }

  /** Detect if the 429 is a DAILY quota exhaustion (not just per-minute rate limit) */
  private static isDailyQuotaExhausted(errorMsg: string): boolean {
    // Google returns "PerDay" in quotaId when daily limit is hit
    if (errorMsg.includes('PerDay')) return true;
    // Google returns "limit: 0" when quota is fully consumed
    if (/limit:\s*0\b/.test(errorMsg)) return true;
    return false;
  }

  /** Dispatch status event → App.tsx listens and shows toast */
  private static emitStatus(message: string, type: 'info' | 'warning' = 'info') {
    window.dispatchEvent(new CustomEvent('EXAM_GEN_STATUS', { detail: { message, type } }));
  }

  /**
   * Build a COMBINED prompt for Gemini that includes ALL sections at once.
   * Gemini 2.0 Flash can handle large JSON arrays — no need to chunk.
   */
  private static buildGeminiMegaPrompt(config: ExamConfig, sections: ExamConfig['sections']): string {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const focusTopic = config.customRequirement || config.topic;

    const sectionDescriptions = sections.map((sec, i) => {
      return `  Section ${i + 1}: ${sec.count} questions | Type: ${sec.type} | Bloom: ${sec.bloomLevels.join(', ')} | Points/Q: ${sec.pointsPerQuestion}`;
    }).join('\n');

    const totalQ = sections.reduce((sum, s) => sum + s.count, 0);

    return `[Session: ${sessionId}]
System: You are an expert English Teacher creating a test for Vietnamese students.

[MANDATORY FOCUS — ALL QUESTIONS MUST BE ABOUT THIS]:
"${focusTopic}"

EXAM CONFIGURATION:
- Subject: ${config.subject}
- Topic: ${config.topic}${config.customRequirement ? `\n- Specific Requirement: ${config.customRequirement}` : ''}
- Difficulty: ${config.difficulty}
- Total questions: ${totalQ}

SECTIONS:
${sectionDescriptions}

CRITICAL RULES:
1. Question "content" must be in ENGLISH (testing English grammar/vocabulary/skills).
2. DO NOT write questions in Vietnamese.
3. "explanation" field MUST be in VIETNAMESE.
4. Each question MUST be UNIQUE with DIFFERENT contexts.
5. For "options": write ONLY the text, NO "A." "B." "C." "D." prefixes.
6. "correctAnswer" must EXACTLY match one item from "options".
7. Return a flat JSON array of ALL ${totalQ} questions from ALL sections combined.
8. Each question must have: id, type, content, options (for Trắc nghiệm), matchingLeft+matchingRight (for Nối từ), correctAnswer, explanation, bloomLevel, points.
9. Return ONLY a raw JSON array. No markdown, no wrapping object, no extra text.

Now generate ${totalQ} NEW, UNIQUE questions covering all sections above. Every question MUST test "${focusTopic}".`;
  }

  private static async generateViaGemini(config: ExamConfig): Promise<Question[]> {
    const apiKey = AIConfigService.getFreshConfig().geminiApiKey;
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API Key không hợp lệ hoặc chưa được thiết lập. Vào Cài đặt → Cấu hình AI để nhập Gemini API Key.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const totalQuestions = config.sections.reduce((sum, s) => sum + s.count, 0);

    // === STRATEGY: Minimize API calls to save RPM ===
    // Split into chunks only if >40 questions (rare), otherwise 1 call
    const GEMINI_MAX_PER_CALL = 40;
    const chunks: ExamConfig['sections'][] = [];

    if (totalQuestions <= GEMINI_MAX_PER_CALL) {
      chunks.push(config.sections);
    } else {
      // Split sections into groups with ~40 questions each
      let currentChunk: ExamConfig['sections'] = [];
      let currentCount = 0;
      for (const sec of config.sections) {
        if (currentCount + sec.count > GEMINI_MAX_PER_CALL && currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = [];
          currentCount = 0;
        }
        currentChunk.push(sec);
        currentCount += sec.count;
      }
      if (currentChunk.length > 0) chunks.push(currentChunk);
    }

    console.info(`[ExamGen/Gemini] Total: ${totalQuestions}Q | API calls planned: ${chunks.length}`);

    const allQuestions: Question[] = [];
    const MAX_429_RETRIES = 3;
    const BACKOFF_BASE = 15000; // 15s base backoff

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunkSections = chunks[chunkIdx];
      const chunkTotal = chunkSections.reduce((sum, s) => sum + s.count, 0);
      const prompt = this.buildGeminiMegaPrompt(config, chunkSections);

      let rateLimitRetries = 0;
      let success = false;

      while (!success) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.9,
              topP: 0.95,
              responseMimeType: 'application/json',
            }
          });

          const text = response.text || '';
          const cleaned = this.extractJSON(text);
          const parsed = JSON.parse(cleaned);
          const rawQuestions = this.extractArray(parsed);
          const sanitized = this.sanitizeQuestions(rawQuestions);
          allQuestions.push(...sanitized);
          console.info(`[ExamGen/Gemini] ✅ Chunk ${chunkIdx + 1}/${chunks.length}: ${sanitized.length}/${chunkTotal} questions`);
          success = true;

        } catch (err: any) {
          const msg = err.message || String(err);
          console.warn(`[ExamGen/Gemini] Error:`, msg);

          // === 429 / RESOURCE_EXHAUSTED ===
          if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {

            // FAST FAIL: Daily quota fully exhausted → no point retrying
            if (this.isDailyQuotaExhausted(msg)) {
              console.error('[ExamGen/Gemini] ❌ Daily quota exhausted — failing immediately.');
              throw new Error(
                'Tài khoản Google của bạn đã hết hạn mức miễn phí (limit: 0) cho mô hình này. ' +
                'Giải pháp: Tạo API Key từ một tài khoản Google (Gmail) mới tại ai.google.dev, ' +
                'hoặc vào Cài đặt → chuyển sang AI Nội bộ (Ollama) để tiếp tục không giới hạn.'
              );
            }

            // SMART RETRY: Per-minute rate limit → wait and retry
            rateLimitRetries++;

            if (rateLimitRetries > MAX_429_RETRIES) {
              throw new Error(
                'Google AI liên tục bị giới hạn sau nhiều lần thử lại. ' +
                'Vui lòng vào Cài đặt chuyển sang dùng AI Nội bộ (Ollama) để tiếp tục, hoặc đợi vài phút rồi thử lại.'
              );
            }

            // Try to parse Google's retryDelay
            const parsedDelay = this.parseRetryDelay(msg);
            const waitMs = parsedDelay || (BACKOFF_BASE * Math.pow(2, rateLimitRetries - 1)); // 15s, 30s, 60s
            const waitSec = Math.ceil(waitMs / 1000);

            console.info(`[ExamGen/Gemini] ⏳ Rate limited (per-minute). Waiting ${waitSec}s (attempt ${rateLimitRetries}/${MAX_429_RETRIES})...`);
            this.emitStatus(
              `⏳ Google AI đang quá tải. Tự động thử lại sau ${waitSec} giây... (Lần ${rateLimitRetries}/${MAX_429_RETRIES})`,
              'warning'
            );

            await new Promise(resolve => setTimeout(resolve, waitMs));
            continue; // Retry the same chunk
          }

          // === API Key invalid ===
          if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
            throw new Error('API Key không hợp lệ. Kiểm tra lại trong Cài đặt → Cấu hình AI.');
          }

          // === Other errors: retry up to 2 times ===
          throw new Error(`Lỗi sinh đề qua Gemini: ${msg}`);
        }
      }
    }

    // Overwrite IDs
    const stamp = Date.now();
    return allQuestions.map((q, i) => ({ ...q, id: `q_${stamp}_${i}` }));
  }

  // ===== OLLAMA LOCAL PATH =====

  private static async generateViaOllama(config: ExamConfig): Promise<Question[]> {
    const cfgModel = AIConfigService.getModel();
    const model = cfgModel || await this.pickBestModel();
    const totalQuestions = config.sections.reduce((sum, s) => sum + s.count, 0);
    console.info(`[ExamGen/Ollama] Model: ${model} | Total: ${totalQuestions}Q | Sections: ${config.sections.length}`);

    const allQuestions: Question[] = [];

    for (let secIdx = 0; secIdx < config.sections.length; secIdx++) {
      const section = config.sections[secIdx];
      let remaining = section.count;

      while (remaining > 0) {
        const batchSize = Math.min(remaining, this.MAX_PER_CALL);
        console.info(`[ExamGen/Ollama] Section ${secIdx + 1} | Batch: ${batchSize}Q`);

        let lastError: string | undefined;
        let batchSuccess = false;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const prompt = this.buildPrompt(config, section, secIdx, batchSize, attempt > 0 ? lastError : undefined);

            const response = await this.fetchWithTimeout(this.GENERATE_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model,
                prompt,
                stream: false,
                format: "json",
                options: { temperature: 0.7, top_p: 0.9, num_ctx: 4096, num_thread: 4 }
              })
            });

            if (response.status === 404) {
              throw new Error(`Mô hình AI '${model}' chưa được tải xuống máy tính. Vui lòng mở Terminal và chạy lệnh: ollama pull ${model}`);
            }
            if (!response.ok) {
              const errBody = await response.text().catch(() => '');
              throw new Error(`Lỗi Ollama (${response.status}): ${errBody || response.statusText}`);
            }
            const data = await response.json();
            const cleaned = this.extractJSON(data.response);
            const parsed = JSON.parse(cleaned);
            const rawQuestions = this.extractArray(parsed);
            const sanitized = this.sanitizeQuestions(rawQuestions);

            allQuestions.push(...sanitized);
            console.info(`[ExamGen/Ollama] ✅ Batch OK: ${sanitized.length} questions`);
            batchSuccess = true;
            break;
          } catch (err: any) {
            lastError = err.message;
            console.warn(`[ExamGen/Ollama] Attempt ${attempt + 1} failed:`, err.message);
            if (attempt === 2) throw new Error(`Không thể sinh câu hỏi phần ${secIdx + 1} sau 3 lần thử. Lỗi: ${err.message}`);
          }
        }

        if (batchSuccess) {
          remaining -= batchSize;
        }
      }
    }

    // Overwrite IDs — never trust LLM-generated IDs
    const stamp = Date.now();
    const finalQuestions = allQuestions.map((q, index) => ({
      ...q,
      id: `q_${stamp}_${index}`
    }));

    console.info(`[ExamGen/Ollama] ✅ Complete: ${finalQuestions.length}/${totalQuestions} questions generated.`);
    return finalQuestions;
  }
}
