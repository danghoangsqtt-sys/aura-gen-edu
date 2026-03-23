import { ExamConfig, Question, SpeakingFeedback, VocabularyItem } from "../types";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DictionaryResponse {
  vocabulary: string;
  phonetics: { uk: string; us: string };
  wordFamily: string[];
  details: {
    pos: string;
    meanings: {
      meaning: string;
      examples: string[];
      synonyms: string[];
      antonyms: string[];
      context?: string;
    }[];
  }[];
  specializedMeanings?: {
     field: string;
     meanings: { meaning: string; example: string }[];
  }[];
  compoundWords?: {
     word: string;
     meaning: string;
     example: string;
  }[];
  idiomsAndPhrasals: {
    phrase: string;
    meaning: string;
    example: string;
  }[];
  usageNotes: string;
}

export interface WordFormationResponse {
  word: string;
  prefix: { morpheme: string; meaning: string } | null;
  root: { morpheme: string; meaning: string };
  suffix: { morpheme: string; meaning: string } | null;
  family: string[];
}

export class OllamaService {
  private static readonly CHAT_ENDPOINT = 'http://localhost:11434/api/chat';
  private static readonly GENERATE_ENDPOINT = 'http://localhost:11434/api/generate';
  private static readonly LIST_ENDPOINT = 'http://localhost:11434/api/tags';
  private static readonly STT_ENDPOINT = 'http://127.0.0.1:8001/stt';
  private static readonly DEFAULT_MODEL = 'llama3.2:1b';
  private static readonly FETCH_TIMEOUT = 60000; // 60 seconds for slow CPU processing
  private static abortController: AbortController | null = null;

  /**
   * Helper to fetch with timeout
   */
  private static async fetchWithTimeout(url: string, options: any): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(id);
    }
  }

  /**
   * Ngắt tiến trình sinh chữ hiện tại
   */
  static cancelGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('[Ollama] Generation canceled.');
    }
  }

  /**
   * Lấy danh sách model hiện có trong Ollama
   */
  static async fetchModels(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(this.LIST_ENDPOINT, { method: 'GET' });
      if (!response.ok) return [this.DEFAULT_MODEL];
      const data = await response.json();
      return data.models.map((m: any) => m.name);
    } catch {
      return [this.DEFAULT_MODEL];
    }
  }

  /**
   * Bóc tách JSON thuần khiết từ phản hồi của AI (loại bỏ markdown, text thừa)
   * Hỗ trợ cả Array [...] và Object {...}
   */
  private static extractJSON(text: string): string {
    try {
      // Bước 1: Loại bỏ markdown code blocks (```json ... ``` hoặc ``` ... ```)
      let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      
      // Bước 2: Tìm Array [...] trước (ưu tiên array vì generateQuiz cần array)
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return arrayMatch[0].trim();
      }
      
      // Bước 3: Tìm Object {...}
      const objectMatch = cleaned.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return objectMatch[0].trim();
      }
      
      return cleaned;
    } catch (e) {
      return text.trim();
    }
  }

  /**
   * Trích xuất mảng câu hỏi từ response đã parse — xử lý mọi format Ollama có thể trả về
   */
  private static extractArray(parsed: any): any[] {
    // Case 1: Đã là array trực tiếp
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    // Case 2: Object chứa array với key phổ biến
    if (parsed && typeof parsed === 'object') {
      // Các key thường gặp mà Ollama hay dùng
      const knownKeys = ['questions', 'quiz', 'data', 'items', 'exam', 'results', 'content'];
      for (const key of knownKeys) {
        if (Array.isArray(parsed[key])) {
          console.info(`[Ollama] Auto-extracted array from key: "${key}"`);
          return parsed[key];
        }
      }
      
      // Fallback: tìm BẤT KỲ property nào là array
      const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
      if (arrayKey) {
        console.info(`[Ollama] Auto-extracted array from unknown key: "${arrayKey}"`);
        return parsed[arrayKey];
      }
    }
    
    throw new Error('AI response is not an array and no array found inside the object.');
  }

  /**
   * Hàm helper chung để gọi Ollama và parse JSON với Retry
   */
  private static async generateJSON<T>(prompt: string, retries: number = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
       try {
          const availableModels = await this.fetchModels();
          const model = availableModels.includes('llama3.2:1b') ? 'llama3.2:1b' : availableModels[0] || this.DEFAULT_MODEL;

          console.info(`[Ollama] Requesting JSON from ${model} (Attempt ${i+1})`);
          
          const response = await this.fetchWithTimeout(this.GENERATE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: model,
              prompt: prompt,
              stream: false,
              format: "json", // Yêu cầu Ollama xuất mode JSON
              options: {
                temperature: 0.1,
                num_ctx: 2048,
                num_thread: 4
              }
            })
          });

          if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
          const data = await response.json();
          
          // BẮT BUỘC: Đi qua bộ lọc bóc tách JSON thuần
          const cleanedText = this.extractJSON(data.response);
          
          try {
            return JSON.parse(cleanedText) as T;
          } catch (parseError) {
            console.error("[Ollama] Core JSON Parse Error at cleanedText:", cleanedText);
            throw parseError;
          }
       } catch (error) {
          console.warn(`[Ollama Retry ${i+1}] Process failed:`, error);
          if (i === retries - 1) throw error;
       }
    }
    throw new Error("Failed to generate valid JSON after retries.");
  }

  private static readonly TUTOR_SYSTEM_PROMPT = `You are Aura, a warm, patient, and encouraging English tutor. You are speaking with a Vietnamese student who is learning English, possibly a beginner.

IMPORTANT — THIS IS A VOICE CONVERSATION:
- Your replies will be READ ALOUD by a TTS engine. Do NOT use markdown, bullet points, bold, asterisks, or special formatting.
- Keep sentences short and natural (max 2-3 sentences per turn).
- Speak clearly and use simple vocabulary.

TEACHING STRATEGY FOR BEGINNERS:
1. Always start with a brief encouragement in Vietnamese, e.g. "Tốt lắm!" or "Câu trả lời hay đó!"
2. If the user writes in Vietnamese, gently switch to English by translating what they said, then teach the English version.
3. If the user makes a grammar mistake, correct it kindly: say the correct version, then briefly explain in Vietnamese why.
4. After correcting, give ONE simple example sentence using the same structure.
5. End each turn with a short, easy follow-up question to keep the conversation going.

BILINGUAL SCAFFOLDING:
- For A1-A2 learners: Use 70% Vietnamese + 30% English. Introduce new words with pronunciation hints in parentheses.
- For B1+ learners: Use 70% English + 30% Vietnamese. Only explain complex grammar in Vietnamese.
- Example: "The word 'beautiful' (đọc là: biu-ti-phồ) có nghĩa là 'đẹp'. You can say: 'The weather is beautiful today.' Bạn thử đặt một câu với từ này nhé?"

PRONUNCIATION HELP:
- When teaching a new word, always include a Vietnamese phonetic approximation in parentheses.
- Example: "'Comfortable' (đọc là: kâm-phơ-tờ-bồ) nghĩa là 'thoải mái'."

PERSONALITY:
- Be like a friendly older sister or brother, not a strict teacher.
- Celebrate small wins: "Wow, bạn dùng đúng thì quá khứ rồi đó! Great job!"
- If the user seems stuck, offer choices: "Bạn muốn mình dạy về 'greetings' hay 'asking for directions'?"
- Never make the user feel embarrassed about mistakes.

REMEMBER: Keep responses SHORT (2-4 sentences max) because this is a voice conversation, not a text chat.`;

  /**
   * 1. Trò chuyện chính (Chat / Voice) - Đã nâng cấp nhân cách Sư phạm
   */
  static async sendChatMessage(history: ChatMessage[], currentMessage: string): Promise<string> {
    this.cancelGeneration();
    this.abortController = new AbortController();

    try {
      const model = await this.pickBestModel();

      // Slice history: Giữ 6 tin nhắn gần nhất (3 lượt trao đổi) để tránh tràn bộ nhớ
      const recentHistory = history.slice(-6);
      
      const payloadMessages = [
        { role: 'system', content: this.TUTOR_SYSTEM_PROMPT },
        ...recentHistory,
        { role: 'user', content: currentMessage }
      ];

      console.info(`[Ollama Tutor] Model: ${model} | History size: ${recentHistory.length}`);

      const response = await fetch(this.CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.abortController.signal,
        body: JSON.stringify({
          model: model,
          messages: payloadMessages,
          stream: false,
          options: {
            temperature: 0.6,   // Natural conversation tone
            top_p: 0.85,        // Balanced creativity
            num_ctx: 2048,
            num_thread: 4
          }
        }),
      });

      if (!response.ok) throw new Error("Ollama connection failed.");
      const data = await response.json();
      return data.message.content;
    } catch (error: any) {
      if (error.name === 'AbortError') return '[Timeout/Canceled] System processing took too long or was interrupted.';
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Chọn model tốt nhất có sẵn (ưu tiên model lớn hơn cho chất lượng)
   */
  private static async pickBestModel(): Promise<string> {
    const models = await this.fetchModels();
    // Thứ tự ưu tiên: model lớn → nhỏ
    const priority = ['qwen2.5:7b', 'qwen2.5:3b', 'llama3:8b', 'gemma2:9b', 'gemma2:2b', 'llama3.2:3b', 'llama3.2:1b'];
    for (const preferred of priority) {
      if (models.some(m => m.startsWith(preferred.split(':')[0]) && m.includes(preferred.split(':')[1]))) {
        const found = models.find(m => m.startsWith(preferred.split(':')[0]) && m.includes(preferred.split(':')[1]));
        if (found) return found;
      }
    }
    // Fallback: dùng model đầu tiên hoặc default
    return models[0] || this.DEFAULT_MODEL;
  }

  /**
   * Tạo prompt cho 1 batch nhỏ câu hỏi (tối đa MAX_PER_CALL câu)
   */
  private static buildSectionPrompt(
    config: ExamConfig,
    section: ExamConfig['sections'][0],
    sectionIdx: number,
    batchCount: number,
    startId: number,
    lastError?: string
  ): string {
    const isEnglish = config.subject.toLowerCase().includes('anh') || config.subject.toLowerCase().includes('english');
    const contentLang = isEnglish ? 'English' : 'Vietnamese';
    const retryHeader = lastError
      ? `[WARNING] Your previous response had this error: "${lastError}". Fix it this time.\n\n`
      : '';

    // TASK 1: Entropy injection — mỗi lần prompt sẽ khác chuỗi ký tự
    const randomSeed = Math.random().toString(36).substring(7);
    const sessionTag = `[Session: ${Date.now()}-${randomSeed}]`;

    // Ví dụ THỰC TẾ về một chủ đề KHÁC HẲN để AI hiểu cấu trúc nhưng không copy nội dung
    const concreteExample = section.type === 'Trắc nghiệm'
      ? `{
  "questions": [
    {
      "id": "(auto)",
      "type": "Trắc nghiệm",
      "content": "What is the largest planet in our solar system?",
      "options": ["Jupiter", "Saturn", "Neptune", "Mars"],
      "correctAnswer": "Jupiter",
      "explanation": "Jupiter is the largest planet with a diameter of 139,820 km.",
      "bloomLevel": "Nhận biết",
      "points": 0.5
    }
  ]
}`
      : section.type === 'Nối từ'
      ? `{
  "questions": [
    {
      "id": "(auto)",
      "type": "Nối từ",
      "content": "Match column A with column B",
      "matchingLeft": ["1. H2O", "2. CO2"],
      "matchingRight": ["a. Carbon dioxide", "b. Water"],
      "correctAnswer": "1-b, 2-a",
      "explanation": "H2O is the chemical formula for water.",
      "bloomLevel": "Nhận biết",
      "points": 1
    }
  ]
}`
      : `{
  "questions": [
    {
      "id": "(auto)",
      "type": "${section.type}",
      "content": "Explain the water cycle process in detail.",
      "correctAnswer": "The water cycle consists of evaporation, condensation, and precipitation.",
      "explanation": "Understanding the water cycle is fundamental to environmental science.",
      "bloomLevel": "Nhận biết",
      "points": 2
    }
  ]
}`;

    // TASK 2: Elevate customRequirement — ALWAYS present, triple-reinforced
    const focusTarget = config.customRequirement || config.topic;
    const hasCustomReq = !!config.customRequirement;
    const criticalFocus = hasCustomReq
      ? `\n[YÊU CẦU TRỌNG TÂM BẮT BUỘC TỪ GIÁO VIÊN (MANDATORY TEACHER REQUIREMENT)]:
"${config.customRequirement}"
⚠️ TẤT CẢ ${batchCount} câu hỏi PHẢI xoay quanh và tập trung 100% vào yêu cầu trên. Câu hỏi nào KHÔNG liên quan sẽ bị hệ thống TỰ ĐỘNG XÓA và bạn sẽ phải làm lại.\n`
      : `\n[CHỦ ĐỀ TRỌNG TÂM]: "${config.topic}"
Tất cả câu hỏi phải liên quan trực tiếp đến chủ đề này.\n`;

    // Reinforcement at the end (small LLMs attend to both start AND end)
    const tailReminder = hasCustomReq
      ? `\n\n⚠️ REMINDER: Every question MUST be about "${config.customRequirement}". Off-topic = system error.`
      : '';

    return `${sessionTag} ${retryHeader}Đóng vai trò giáo viên chuyên môn cao. Bạn ĐANG BỊ KIỂM TRA năng lực ra đề.
${criticalFocus}
THÔNG TIN ĐỀ THI:
- Môn học: ${config.subject}
- Chủ đề chung: ${config.topic}
- Trình độ: ${config.difficulty}
- Phần ${sectionIdx + 1}: ${batchCount} câu ${section.type}, ${section.pointsPerQuestion} điểm/câu
- Mức Bloom: ${section.bloomLevels.join(', ')}
- Viết nội dung bằng ${contentLang}.

REQUIRED JSON FORMAT (this example is about "Solar System" — you must write about "${focusTarget}" instead):
${concreteExample}

STRICT RULES:
1. Return a JSON object: {"questions": [...]}.
2. Nội dung câu hỏi phải RẤT ĐA DẠNG, sử dụng nhiều ngữ cảnh khác nhau (trường học, công việc, đời sống). TUYỆT ĐỐI KHÔNG lặp lại câu hỏi của các lần trước.
3. Generate EXACTLY ${batchCount} questions. Set "id" to any value (it will be overwritten).
4. For "options" array: write ONLY the answer text. NEVER add letter prefixes like "A." or "B." or "C." or "D." — the UI adds them automatically.
5. "correctAnswer" must exactly match one item from the "options" array (without any letter prefix).
6. The example above is just a FORMAT reference. DO NOT copy its content. Write original questions.
7. DO NOT output markdown. Output raw JSON only.
8. Set "points" to ${section.pointsPerQuestion} for every question.${tailReminder}`;
  }

  /**
   * Hậu xử lý: loại bỏ tiền tố kép và placeholder text
   */
  private static sanitizeQuestions(questions: any[]): Question[] {
    const prefixRegex = /^[A-Da-d][.)]\s*/;
    const numberPrefixRegex = /^[0-9]+[.)]\s*/;
    const placeholderPatterns = ['<TỰ VIẾT', '<đáp án', '<answer', '<option', '<tự viết', 'Nội dung câu hỏi', 'Content of'];

    return questions.map((q, idx) => {
      // Clean options: strip "A. " / "B. " / "1. " prefixes
      if (Array.isArray(q.options)) {
        q.options = q.options.map((opt: string) => {
          if (typeof opt !== 'string') return String(opt);
          return opt.replace(prefixRegex, '').replace(numberPrefixRegex, '').trim();
        });
      }

      // Clean correctAnswer prefix
      if (typeof q.correctAnswer === 'string') {
        q.correctAnswer = q.correctAnswer.replace(prefixRegex, '').replace(numberPrefixRegex, '').trim();
      }

      // Detect placeholder content — mark as invalid
      const contentStr = JSON.stringify(q);
      const hasPlaceholder = placeholderPatterns.some(p => contentStr.includes(p));
      if (hasPlaceholder) {
        console.warn(`[Ollama Sanitize] Question ${q.id} contains placeholder text, marking for regeneration.`);
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

  // Số câu hỏi tối đa mỗi lần gọi API — giữ nhỏ cho Local LLM
  private static readonly MAX_PER_CALL = 3;

  /**
   * 2. Tạo đề thi — Chunked Generation Engine
   * Luôn chia nhỏ: mỗi lần gọi API tối đa MAX_PER_CALL câu, sau đó ghép lại.
   */
  static async generateQuiz(config: ExamConfig): Promise<Question[]> {
    const model = await this.pickBestModel();
    const totalQuestions = config.sections.reduce((sum, s) => sum + s.count, 0);
    console.info(`[Ollama ExamGen] Model: ${model} | Total: ${totalQuestions}Q | Sections: ${config.sections.length}`);

    const allQuestions: Question[] = [];

    for (let secIdx = 0; secIdx < config.sections.length; secIdx++) {
      const section = config.sections[secIdx];
      let remaining = section.count;
      let questionNum = 1;

      while (remaining > 0) {
        const batchSize = Math.min(remaining, this.MAX_PER_CALL);
        console.info(`[Ollama ExamGen] Section ${secIdx + 1} | Batch: ${batchSize}Q (${questionNum}-${questionNum + batchSize - 1})`);

        let lastError: string | undefined;
        let batchSuccess = false;

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const prompt = this.buildSectionPrompt(config, section, secIdx, batchSize, questionNum, attempt > 0 ? lastError : undefined);

            const response = await this.fetchWithTimeout(this.GENERATE_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model,
                prompt,
                stream: false,
                format: "json",
                options: { temperature: 0.8, top_p: 0.9, num_ctx: 4096, num_thread: 4 }
              })
            });

            if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
            const data = await response.json();
            const cleaned = this.extractJSON(data.response);
            const parsed = JSON.parse(cleaned);
            const rawQuestions = this.extractArray(parsed);
            const sanitized = this.sanitizeQuestions(rawQuestions);

            allQuestions.push(...sanitized);
            console.info(`[Ollama ExamGen] Batch OK: ${sanitized.length} questions added.`);
            batchSuccess = true;
            break;
          } catch (err: any) {
            lastError = err.message;
            console.warn(`[Ollama ExamGen] Batch attempt ${attempt + 1} failed:`, err.message);
            if (attempt === 2) throw new Error(`Không thể sinh câu hỏi phần ${secIdx + 1} sau 3 lần thử. Lỗi: ${err.message}`);
          }
        }

        if (batchSuccess) {
          remaining -= batchSize;
          questionNum += batchSize;
        }
      }
    }

    // GHI ĐÈ ID — không bao giờ tin LLM quản lý ID
    const stamp = Date.now();
    const finalQuestions = allQuestions.map((q, index) => ({
      ...q,
      id: `q_${stamp}_${index}`
    }));

    console.info(`[Ollama ExamGen] ✅ Complete: ${finalQuestions.length}/${totalQuestions} questions generated.`);
    return finalQuestions;
  }

  /**
   * 3. Tạo Truyện Chêm (JSON Output)
   */
  static async generateMacaronicStory(wordList: string, topic: string, baseLanguage: 'vi' | 'en' = 'vi'): Promise<{story: string, vocabulary: {word: string, meaning: string, pos?: string, ipa?: string, example?: string, synonyms?: string[]}[]}> {
    const isViBase = baseLanguage === 'vi';
    const prompt = `
Bạn là chuyên gia viết "Truyện Chêm" (Macaronic Story) để giúp người học ngôn ngữ.

NHIỆM VỤ: Viết câu chuyện ngắn 200-300 từ về chủ đề "${topic}".

DANH SÁCH TỪ VỰNG BẮT BUỘC PHẢI CHÊM: ${wordList}

QUY TẮC QUAN TRỌNG NHẤT:
${isViBase ? `
- Viết câu chuyện bằng TIẾNG VIỆT, nhưng CHÊM các từ TIẾNG ANH ở trên vào thay thế cho từ tiếng Việt tương ứng.
- Mỗi từ tiếng Anh phải được bọc trong thẻ <b>...</b>.
- KHÔNG dịch các từ tiếng Anh ra tiếng Việt trong truyện. Giữ nguyên từ tiếng Anh.

VÍ DỤ MẪU (nếu từ vựng là: resilient, journey, discover):
"Minh là một chàng trai rất <b>resilient</b>, dù gặp bao khó khăn anh vẫn không bỏ cuộc. Một ngày nọ, anh bắt đầu một <b>journey</b> dài đến vùng đất mới. Tại đó, anh <b>discover</b> ra những điều kỳ diệu mà mình chưa từng biết."
` : `
- Viết câu chuyện bằng TIẾNG ANH, nhưng CHÊM nghĩa TIẾNG VIỆT của các từ vào thay thế cho từ tiếng Anh tương ứng.
- Mỗi từ tiếng Việt được chêm phải được bọc trong thẻ <b>...</b>.

VÍ DỤ MẪU (nếu từ vựng là: kiên cường, hành trình, khám phá):
"Minh was a very <b>kiên cường</b> young man who never gave up. One day, he started a long <b>hành trình</b> to a new land. There, he would <b>khám phá</b> wonderful things he had never known."
`}

BẮT BUỘC:
1. Sử dụng TẤT CẢ các từ trong danh sách, KHÔNG bỏ sót từ nào.
2. Các từ chêm phải nằm TỰ NHIÊN trong câu, có ngữ cảnh rõ ràng để người đọc đoán được nghĩa.
3. KHÔNG giải thích nghĩa của từ trong truyện.
4. BẮT BUỘC bọc từ chêm trong thẻ <b>...</b>.

Trả về JSON với ĐÚNG format sau:
{
  "story": "Nội dung câu chuyện có chêm từ trong thẻ <b>...</b>",
  "vocabulary": [
    {
      "word": "từ_tiếng_anh",
      "meaning": "nghĩa_tiếng_việt",
      "pos": "noun/verb/adj/adv",
      "ipa": "/phiên_âm_IPA/",
      "example": "Một câu ví dụ sử dụng từ này trong tiếng Anh",
      "synonyms": ["từ_đồng_nghĩa_1", "từ_đồng_nghĩa_2"]
    }
  ]
}

Trường "vocabulary" BẮT BUỘC liệt kê TẤT CẢ các từ với đầy đủ thông tin: word, meaning, pos, ipa, example, synonyms.
`;
    
    return this.generateJSON<{story: string, vocabulary: {word: string, meaning: string, pos?: string, ipa?: string, example?: string, synonyms?: string[]}[]}>(prompt);
  }

  /**
   * 4. Đánh giá phát âm (Text comparison)
   */
  static async evaluateSpeaking(targetText: string, userSpokenText: string): Promise<SpeakingFeedback> {
    const prompt = `So sánh và đánh giá phát âm. Trả về JSON: { "score": number, "pronunciation": "string", "transcription": "${userSpokenText}" }`;
    return this.generateJSON<SpeakingFeedback>(prompt);
  }

  /**
   * 5. Tạo câu hỏi luyện nói (Speaking Lab)
   */
  static async generateSpeakingQuestions(topic: string, level: string): Promise<any[]> {
    const prompt = `Create 5 speaking interview questions for topic: "${topic}" at CEFR level ${level}. Each question must have: "question", "sampleAnswer" (2-4 sentences, natural), "difficulty" (e.g. "B1"). Output JSON Array.`;
    return this.generateJSON<any[]>(prompt);
  }

  /**
   * 6. Trích xuất từ vựng từ văn bản
   */
  static async extractVocabulary(text: string): Promise<VocabularyItem[]> {
    const prompt = `Extract 10 key English vocabulary items from text. Return JSON Array.`;
    const data = await this.generateJSON<any[]>(prompt);
    return data.map((item, idx) => ({
      ...item,
      id: `local-vocab-${Date.now()}-${idx}`,
      topic: 'Extracted'
    })) as VocabularyItem[];
  }
  /**
   * 7. Chấm điểm bài viết (Writing Master)
   */
  static async evaluateWriting(textInput: string): Promise<string> {
    const prompt = `Evaluate this English writing. Determine the CEFR level (A1-C2) and provide detailed feedback on grammar, vocabulary, and coherence. User text: "${textInput}"`;
    const response = await this.fetchWithTimeout(this.GENERATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.DEFAULT_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          num_ctx: 2048,
          num_thread: 4
        }
      })
    });
    const data = await response.json();
    return data.response;
  }

  /**
   * 8. Phân tích ngôn ngữ / Từ điển - NÂNG CẤP AURA GEN LEXICON (Anti-Hallucination & Laban-Grade)
   */
  static async analyzeWordWithAI(keyword: string): Promise<DictionaryResponse> {
    const prompt = `
      [SYSTEM CONTEXT]: Note that 'Aura Gen' is the name of this intelligent English learning platform, and 'Aura' is your name (an AI English Tutor).
      
      Analyze the English word or phrase: "${keyword}".
      Return a STRICT JSON object as a PROFESSIONAL ACADEMIC DICTIONARY (like Laban or Cambridge).
      
      STRICT FACTUALITY: You are a STRICT academic dictionary. DO NOT HALLUCINATE or invent definitions. 
      If the keyword is a proper noun, brand name, made-up word, or you are not 100% sure of its definition in a standard dictionary, 
      YOU MUST use the following fallback definition for the first meaning: 
      "Đây là một tên riêng, thương hiệu hoặc từ không có trong từ điển chuẩn. Không có định nghĩa học thuật chính thức."
      
      Requirements:
      1. 'phonetics': Provide BOTH British (UK) and American (US) IPA.
      2. 'wordFamily': List related word forms (Noun, Verb, Adj, Adv) with their labels.
      3. 'details': Group by 'pos' (Part of Speech). Each meaning MUST have 2+ examples (English with Vietnamese translation in brackets), synonyms, and antonyms.
      4. 'specializedMeanings': If the word has technical meanings in fields like Music, Math, Medical, Law, v.v., list them here. FORMAT: { "field": "Field Name", "meanings": [{ "meaning": "...", "example": "..." }] }.
      5. 'compoundWords': List 3-5 common compound words or derivatives (e.g., for 'flat', list 'flatmate', 'flatfish').
      6. 'idiomsAndPhrasals': List 2-3 idioms or phrasal verbs containing the word.
      7. "usageNotes": "A short, expert advice (in Vietnamese). Focus on: Common mistakes, Register, or context. DO NOT leave empty."

      Output Schema:
      {
        "vocabulary": "${keyword}",
        "phonetics": { "uk": "/.../", "us": "/.../" },
        "wordFamily": ["Noun: ...", "Verb: ..."],
        "details": [
          {
            "pos": "Noun",
            "meanings": [
              {
                "meaning": "Nghĩa chung...",
                "examples": ["Eng sentence (Dịch Việt)"],
                "synonyms": ["syn1"],
                "antonyms": ["ant1"],
                "context": "Context information"
              }
            ]
          }
        ],
        "specializedMeanings": [
          { "field": "Music", "meanings": [{ "meaning": "Dấu giáng", "example": "..." }] }
        ],
        "compoundWords": [
          { "word": "...", "meaning": "...", "example": "..." }
        ],
        "idiomsAndPhrasals": [
          { "phrase": "...", "meaning": "...", "example": "..." }
        ],
        "usageNotes": "Lưu ý ngữ pháp..."
      }

      CRITICAL: Output ONLY the raw JSON object starting with { and ending with }. 
      DO NOT wrap in markdown code blocks. DO NOT use backticks.
    `;
    return this.generateJSON<DictionaryResponse>(prompt);
  }

  /**
   * 9. Chuyển đổi giọng nói thành văn bản (Proxy tới STT Backend)
   */
  static async speechToText(base64Audio: string): Promise<string> {
    try {
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const response = await this.fetchWithTimeout(this.STT_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("STT Backend failed.");
      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error("[OllamaService] STT Error:", error);
      throw error;
    }
  }
}
