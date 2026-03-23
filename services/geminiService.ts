
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ExamConfig, Question, QuestionType, BloomLevel, VocabularyItem } from "../types";
import { storage, STORAGE_KEYS } from "./storageAdapter";
import { AIConfigService } from "./aiConfigService";

// Priority: AIConfigService (settings panel) → storageAdapter fallback → env var
const getApiKey = async (): Promise<string> => {
  // 1. Check AIConfigService first (where Settings panel saves)
  const configKey = AIConfigService.getFreshConfig().geminiApiKey;
  if (configKey) return configKey;
  // 2. Fallback to old storage key for backward compatibility
  const manualKey = await storage.get<string>(STORAGE_KEYS.API_KEY, '');
  return manualKey || process.env.API_KEY || '';
};

const cleanJsonResponse = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error:", error);
  
  // Kiểm tra lỗi 429 (Too Many Requests) hoặc RESOURCE_EXHAUSTED
  if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
    let retryMsg = "Bạn đã hết lượt gọi AI miễn phí trong phút này. Vui lòng thử lại sau 1 phút.";
    
    // Thử trích xuất retryDelay từ chi tiết lỗi (thường nằm trong error.details)
    const retryDelay = error?.details?.[0]?.retryDelay;
    if (retryDelay) {
      // Chuyển đổi từ giây (ví dụ "60s") hoặc số sang giây
      const seconds = typeof retryDelay === 'string' ? retryDelay.replace('s', '') : Math.ceil(retryDelay / 1000);
      retryMsg = `Hệ thống đang quá tải. Vui lòng thử lại sau ${seconds} giây.`;
    }
    
    throw new Error(retryMsg);
  }

  if (error?.message?.includes("API key not valid")) {
    throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại trong phần Cài đặt.");
  }
  throw new Error(error?.message || "Hệ thống AI gặp sự cố. Vui lòng thử lại sau.");
};

/**
 * Sinh ảnh minh họa cho từ vựng (Sử dụng cho game Vision Linker)
 */
export const generateVocabImage = async (word: string, meaning: string): Promise<string> => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("Cần API Key để sinh ảnh.");
  
  const ai = new GoogleGenAI({ apiKey });
  // Sử dụng gemini-2.5-flash-image cho tốc độ và chất lượng tốt
  const prompt = `A clear, simple, and high-quality educational illustration for the vocabulary word: "${word}" (meaning: ${meaning}). Style: Flat design, bright colors, white background, no text inside.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Không tìm thấy dữ liệu ảnh.");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

/**
 * Trích xuất từ vựng trực tiếp từ File (PDF hoặc Image)
 */
export const extractVocabularyFromFile = async (base64Data: string, mimeType: string, topic: string): Promise<VocabularyItem[]> => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("Chưa cấu hình API Key trong phần Cài đặt.");
  
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash'; // Bản 2.5 Flash ổn định — Free Tier quota cao nhất

  const prompt = `
    Đóng vai trò là một chuyên gia ngôn ngữ học và số hóa tài liệu.
    Nhiệm vụ: Phân tích hình ảnh/tài liệu đính kèm để trích xuất danh sách từ vựng tiếng Anh.
    Chủ đề gán cho các từ này là: "${topic}".
    
    Yêu cầu xử lý:
    1. Tìm tất cả các từ vựng tiếng Anh có trong tài liệu.
    2. Nếu tài liệu có cột phiên âm (IPA), hãy lấy chính xác. Nếu không, hãy tự động tạo IPA chuẩn Mỹ.
    3. Nếu tài liệu có nghĩa tiếng Việt, hãy lấy nó. Nếu không, hãy dịch nghĩa phù hợp với ngữ cảnh phổ thông.
    4. Xác định từ loại (n., v., adj., adv., v.v.).
    5. Tạo một câu ví dụ ngắn gọn (example) chứa từ đó (nếu trong ảnh không có).
    6. Bỏ qua các tiêu đề, số trang, hoặc rác. Chỉ lấy từ vựng.

    Output format: JSON Array only.
    Schema:
    [
      {
        "id": "tạo_id_ngẫu_nhiên",
        "word": "từ_gốc",
        "pronunciation": "/ipa/",
        "partOfSpeech": "từ_loại",
        "meaning": "nghĩa_tiếng_việt",
        "example": "Câu ví dụ.",
        "topic": "${topic}"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType: mimeType } }] }],
      config: { responseMimeType: "application/json" }
    });
    
    const parsedData = JSON.parse(cleanJsonResponse(response.text));
    
    // Validate và chuẩn hóa dữ liệu trả về
    return parsedData.map((item: any) => ({
      ...item,
      id: `vocab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic: topic
    })) as VocabularyItem[];

  } catch (error: any) {
    console.error("Extract Error:", error);
    throw new Error(error?.message || "Lỗi AI không thể đọc file.");
  }
};

/**
 * Trích xuất từ vựng từ văn bản thô
 */
export const extractVocabFromText = async (text: string): Promise<any[]> => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("Chưa cấu hình API Key.");
  
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Đóng vai trò là một chuyên gia ngôn ngữ học. 
    Nhiệm vụ: Phân tích đoạn văn bản sau và trích xuất khoảng 10-15 từ vựng quan trọng/học thuật nhất.
    Yêu cầu:
    1. Trả về đúng định dạng JSON Array.
    2. Mỗi đối tượng gồm: { "word": "từ", "ipa": "/phiên_âm/", "meaning": "nghĩa_tiếng_việt", "pos": "n/v/adj/adv thối" }.
    3. Ưu tiên các từ vựng học thuật phù hợp với ngữ cảnh.

    Văn bản: "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        temperature: 0.7 
      }
    });
    
    return JSON.parse(cleanJsonResponse(response.text));
  } catch (error: any) {
    handleGeminiError(error);
  }
};


export const generateExamContent = async (config: ExamConfig): Promise<Question[]> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const retryHeader = lastError ? `ĐÃ XẢY RA LỖI Ở LẦN THỬ TRƯỚC: ${lastError}\nHãy chắc chắn bạn trả về đúng JSON array hợp lệ theo schema.` : "";
    
    const prompt = `
      ${retryHeader}
      Đóng vai trò là một giáo viên bộ môn: ${config.subject}.
      Nhiệm vụ: Tạo một đề thi trắc nghiệm/tự luận dưới dạng JSON.
      
      Thông tin đề thi:
      - Chủ đề chính: ${config.topic}
      - Môn học: ${config.subject}
      - Tiêu đề: ${config.title}
      
      YÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG (PROMPT):
      "${config.customRequirement || "Tạo đề thi tổng hợp kiến thức tiêu chuẩn."}"
      
      Cấu trúc ma trận câu hỏi mong muốn (nếu Prompt không ghi đè):
      ${JSON.stringify(config.sections)}

      Yêu cầu đầu ra (Quan trọng):
      1. Nội dung câu hỏi phải mới mẻ, sáng tạo, KHÔNG lặp lại các câu hỏi phổ thông nhàm chán.
      2. Nếu môn học là Tiếng Anh, nội dung bằng tiếng Anh. Nếu là môn khác (Văn, Sử, Địa...), nội dung bằng Tiếng Việt.
      3. Trả về đúng định dạng JSON Schema bên dưới.
      4. "matchingLeft" và "matchingRight" chỉ dùng cho dạng câu hỏi MATCHING (Nối từ), để trống nếu là trắc nghiệm.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 1.0, 
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                content: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                matchingLeft: { type: Type.ARRAY, items: { type: Type.STRING } },
                matchingRight: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                bloomLevel: { type: Type.STRING },
                points: { type: Type.NUMBER }
              },
              required: ["id", "content", "correctAnswer", "type", "bloomLevel"]
            }
          }
        }
      });
      return JSON.parse(cleanJsonResponse(response.text)) as Question[];
    } catch (error: any) { 
      console.warn(`[Gemini Retry] Thất bại lần ${attempt}:`, error.message);
      lastError = error.message;
      if (attempt === 3) {
        console.error("Generate Exam Error after 3 attempts:", error);
        throw error;
      }
    }
  }
  throw new Error("Không thể tạo nội dung đề thi sau nhiều lần thử.");
};

export const regenerateSingleQuestion = async (config: ExamConfig, oldQuestion: Question): Promise<Question> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const retryPrefix = lastError ? `LỖI LẦN TRƯỚC: ${lastError}. Hãy thử lại và chỉ trả về 1 JSON object duy nhất.\n` : "";
    const prompt = `${retryPrefix}Tạo một câu hỏi ${config.subject} mới thay thế cho câu hỏi cũ này: "${oldQuestion.content}".
      Yêu cầu:
      - Loại câu hỏi: ${oldQuestion.type}
      - Mức độ Bloom: ${oldQuestion.bloomLevel}
      - Chủ đề chính: ${config.topic}
      - Yêu cầu bổ sung: ${config.customRequirement}
      Trả về một đối tượng JSON câu hỏi duy nhất.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 1.0,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              content: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              matchingLeft: { type: Type.ARRAY, items: { type: Type.STRING } },
              matchingRight: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              bloomLevel: { type: Type.STRING },
              points: { type: Type.NUMBER }
            },
            required: ["id", "content", "correctAnswer", "type", "bloomLevel"]
          }
        }
      });
      return JSON.parse(cleanJsonResponse(response.text)) as Question;
    } catch (error: any) {
      console.warn(`[Gemini Regenerate Retry] Lần ${attempt}:`, error.message);
      lastError = error.message;
      if (attempt === 3) throw error;
    }
  }
  throw new Error("Không thể tái tạo câu hỏi.");
};

export const analyzeLanguage = async (text: string): Promise<DictionaryResponse> => {
  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Phân tích từ/câu: "${text}"`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJsonResponse(response.text)) as DictionaryResponse;
};

export interface DictionaryResponse {
  type: 'word' | 'phrase' | 'sentence' | 'not_found';
  word?: string;
  ipa?: string;
  meanings?: { partOfSpeech: string; def: string; example: string }[];
  translation?: string;
  correction?: string;
  grammarAnalysis?: { error: string; fix: string; explanation: string }[];
  structure?: string;
  usageNotes?: string;
}

export const generateMacaronicStory = async (wordList: string, topic: string, baseLanguage: 'vi' | 'en' = 'vi'): Promise<{story: string, vocabulary: {word: string, meaning: string, pos?: string, ipa?: string, example?: string, synonyms?: string[]}[]}> => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("Chưa cấu hình API Key. Vui lòng kiểm tra lại trong phần Cài đặt.");

  const ai = new GoogleGenAI({ apiKey });
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        temperature: 0.8,
        topP: 0.9
      }
    });

    if (!response || !response.text) {
      throw new Error("Dữ liệu trả về không hợp lệ.");
    }
    
    return JSON.parse(cleanJsonResponse(response.text)) as {story: string, vocabulary: {word: string, meaning: string, pos?: string, ipa?: string, example?: string, synonyms?: string[]}[]};
  } catch (error: any) {
    console.error("Internal Macaronic Story Error:", error);
    throw new Error(error?.message || "Hệ thống đang quá tải hoặc gặp sự cố kỹ thuật. Vui lòng thử lại sau giây lát.");
  }
};

/**
 * Phòng Luyện Viết (Writing Master) - JSON structured evaluation
 */
export interface WritingEvaluation {
  cefrLevel: string;       // A1, A2, B1, B2, C1, C2
  bandScore: number;       // 0-100
  overallFeedback: string; // Nhận xét chung
  grammarErrors: { error: string; fix: string; explanation: string }[];
  vocabUpgrades: { original: string; upgraded: string; example: string }[];
  structureFeedback: string;
  modelEssay: string;      // Bài viết mẫu cấp độ cao hơn
  advancedVocab: { word: string; meaning: string; pos: string; example: string }[];
  advancedSentences: { pattern: string; example: string }[];
}

const WRITING_EVAL_PROMPT = (text: string) => `You are an expert IELTS/CEFR Writing Examiner. Evaluate this English text and return a STRICT JSON object.

USER TEXT:
"""
${text}
"""

Return EXACTLY this JSON schema (no markdown, no explanation):
{
  "cefrLevel": "<A1|A2|B1|B2|C1|C2>",
  "bandScore": <0-100>,
  "overallFeedback": "<2-3 sentence overall assessment in Vietnamese>",
  "grammarErrors": [
    {"error": "<exact wrong text>", "fix": "<corrected text>", "explanation": "<brief explanation in Vietnamese>"}
  ],
  "vocabUpgrades": [
    {"original": "<basic word used>", "upgraded": "<advanced alternative>", "example": "<sentence using the upgraded word>"}
  ],
  "structureFeedback": "<feedback on essay structure, coherence, paragraphing in Vietnamese>",
  "modelEssay": "<rewrite the user's text at ONE CEFR LEVEL HIGHER. Use more sophisticated vocabulary, better transitions, and more complex sentence structures. Keep the same topic and ideas.>",
  "advancedVocab": [
    {"word": "<advanced word>", "meaning": "<Vietnamese meaning>", "pos": "<noun/verb/adj/adv>", "example": "<English sentence>"}
  ],
  "advancedSentences": [
    {"pattern": "<sentence pattern name>", "example": "<example using the pattern>"}
  ]
}

RULES:
- grammarErrors: List ALL grammar/spelling mistakes found (max 10)
- vocabUpgrades: Suggest 5-8 vocabulary upgrades from basic to advanced
- modelEssay: Must be the SAME topic but written at one level higher (e.g., if user is B1, write at B2)
- advancedVocab: List 8-12 useful advanced words related to the topic
- advancedSentences: List 5-8 advanced sentence patterns the user can use
- All explanations and meanings in Vietnamese
- Return ONLY raw JSON`;

export const evaluateWritingStructured = async (textInput: string): Promise<WritingEvaluation> => {
  const apiKey = await getApiKey();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: WRITING_EVAL_PROMPT(textInput),
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
      return JSON.parse(cleanJsonResponse(response.text || '')) as WritingEvaluation;
    } catch (err: any) {
      console.error('[Gemini Writing Eval] Error:', err);
      // Fallthrough to Ollama
    }
  }

  // Ollama fallback
  try {
    const { OllamaService } = await import('./ollamaService');
    const history = [{ role: 'system' as const, content: 'You are an English writing examiner. Return ONLY valid JSON.' }];
    const result = await OllamaService.sendChatMessage(history, WRITING_EVAL_PROMPT(textInput));
    const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as WritingEvaluation;
    throw new Error('Invalid Ollama response');
  } catch (err: any) {
    console.error('[Ollama Writing Eval] Error:', err);
    throw new Error('Không thể chấm bài. Kiểm tra kết nối AI.');
  }
};

/**
 * AI sinh 10 đề luyện viết hàng tuần — đa dạng thể loại và CEFR level
 */
import { WritingTopic } from '../types';

const WRITING_TOPICS_PROMPT = `You are an expert IELTS/CEFR writing topic designer. Generate EXACTLY 10 diverse English writing practice topics for a weekly practice session.

REQUIREMENTS:
- Mix task types: 2 essays, 2 letters, 2 emails, 2 reports, 2 reviews
- Mix CEFR levels: 2×A2, 2×B1, 3×B2, 2×C1, 1×C2
- Topics should be practical, modern, and interesting (technology, environment, education, work, travel, health, culture, social issues)
- Each topic must have 3 useful tips in Vietnamese
- Word count hints should match the CEFR level

Return ONLY a JSON array with EXACTLY this schema:
[
  {
    "id": "topic_1",
    "prompt": "<the full writing prompt in English, 2-3 sentences>",
    "taskType": "<essay|letter|email|report|review>",
    "cefrTarget": "<A2|B1|B2|C1|C2>",
    "wordCountHint": "<e.g. 80-120 words>",
    "tips": ["<tip in Vietnamese>", "<tip in Vietnamese>", "<tip in Vietnamese>"]
  }
]

RULES:
- id must be "topic_1" through "topic_10"
- Prompts must be clear and specific, giving students a clear direction
- Tips should be practical writing advice in Vietnamese
- Word count hints: A2=80-120, B1=120-180, B2=180-250, C1=250-350, C2=300-400
- NO duplicate topics or themes
- Return ONLY raw JSON array`;

export const generateWritingTopics = async (): Promise<WritingTopic[]> => {
  const apiKey = await getApiKey();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: WRITING_TOPICS_PROMPT,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.9
        }
      });
      const topics = JSON.parse(cleanJsonResponse(response.text || '')) as WritingTopic[];
      if (Array.isArray(topics) && topics.length >= 5) return topics;
      throw new Error('Invalid topic count');
    } catch (err: any) {
      console.error('[Gemini Writing Topics] Error:', err);
      // Fallthrough to Ollama
    }
  }

  // Ollama fallback
  try {
    const { OllamaService } = await import('./ollamaService');
    const history = [{ role: 'system' as const, content: 'You are a writing topic generator. Return ONLY valid JSON array.' }];
    const result = await OllamaService.sendChatMessage(history, WRITING_TOPICS_PROMPT);
    const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      const topics = JSON.parse(match[0]) as WritingTopic[];
      if (Array.isArray(topics) && topics.length >= 5) return topics;
    }
    throw new Error('Invalid Ollama response');
  } catch (err: any) {
    console.error('[Ollama Writing Topics] Error:', err);
    throw new Error('Không thể tạo đề luyện viết. Kiểm tra kết nối AI.');
  }
};

/**
 * Phân tích cấu tạo từ (Word Formation) - Tiền tố, Gốc từ, Hậu tố
 */
export const analyzeWordFormation = async (word: string): Promise<WordFormationResponse> => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("Chưa cấu hình API Key trong phần Cài đặt.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Act as an expert linguist. Analyze the word: '${word}'. 
  Break it down into prefix, root, and suffix. If a part doesn't exist, return null.
  Provide 3 related words in the same word family.
  Must return strictly in JSON format matching this schema:
  {
    "word": "string",
    "prefix": { "morpheme": "string", "meaning": "string" } | null,
    "root": { "morpheme": "string", "meaning": "string" },
    "suffix": { "morpheme": "string", "meaning": "string" } | null,
    "family": ["string", "string", "string"]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        temperature: 0.1 
      }
    });
    
    return JSON.parse(cleanJsonResponse(response.text)) as WordFormationResponse;
  } catch (error: any) {
    console.error("Word Formation Error:", error);
    throw new Error(error?.message || "Hệ thống AI gặp sự cố khi phân tích cấu tạo từ.");
  }
};

export interface WordFormationResponse {
  word: string;
  prefix: { morpheme: string; meaning: string } | null;
  root: { morpheme: string; meaning: string };
  suffix: { morpheme: string; meaning: string } | null;
  family: string[];
}

/**
 * Sinh Sơ đồ tư duy từ vựng (Vocab Mind Map)
 */
export const generateVocabMindMap = async (topic: string): Promise<VocabMindMapResponse> => {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("Chưa cấu hình API Key trong phần Cài đặt.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Act as an English vocabulary expert. Generate a mind map for the topic: '${topic}'.
  Categorize the vocabulary into 3 to 4 branches (e.g., Types, Causes, Solutions, Adjectives).
  Each branch should have 3 to 5 related English words with their Vietnamese meanings and a fitting emoji.
  Must return STRICTLY in JSON format matching this schema:
  {
    "centralTopic": "string",
    "centralEmoji": "string",
    "branches": [
      {
        "categoryName": "string",
        "words": [
          { "word": "string", "meaning": "string", "emoji": "string" }
        ]
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        temperature: 0.7 
      }
    });
    
    return JSON.parse(cleanJsonResponse(response.text)) as VocabMindMapResponse;
  } catch (error: any) {
    console.error("Vocab Mind Map Error:", error);
    throw new Error(error?.message || "Hệ thống AI gặp sự cố khi sinh sơ đồ tư duy.");
  }
};

export interface VocabMindMapResponse {
  centralTopic: string;
  centralEmoji: string;
  branches: {
    categoryName: string;
    words: { word: string; meaning: string; emoji: string }[];
  }[];
}

// ═══════════════════════════════════════════════
// Pronunciation Analysis — IPA Clinic (Record & Analyze)
// ═══════════════════════════════════════════════

export interface PronunciationFeedback {
  score: number;
  transcription: string;
  errors: string[];
  advice: string;
}

/**
 * Phân tích phát âm từ audio blob — dùng Gemini REST API (KHÔNG WebSocket)
 * Fallback: Ollama STT → text comparison
 */
export const analyzePronunciation = async (
  audioBlob: Blob,
  targetText: string
): Promise<PronunciationFeedback> => {
  const apiKey = await getApiKey();

  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const mimeType = audioBlob.type || 'audio/webm';

  if (apiKey) {
    // ═══ Gemini Path ═══
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert English pronunciation coach. Listen to the attached audio carefully.
The user is trying to say: "${targetText}".

Evaluate their pronunciation and return a JSON object EXACTLY like this:
{
  "score": <number 0-100>,
  "transcription": "<what you actually heard the user say>",
  "errors": ["<specific error 1>", "<specific error 2>"],
  "advice": "<one clear tip on how to improve>"
}

Scoring guide:
- 90-100: Native-like, perfect
- 70-89: Good, minor issues
- 50-69: Understandable but noticeable errors
- 30-49: Difficult to understand
- 0-29: Very poor or unintelligible

If no audio is detected or too short, give score 0.
Return ONLY raw JSON. No markdown, no explanation.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType } }
          ]
        }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const cleaned = cleanJsonResponse(response.text || '');
      return JSON.parse(cleaned) as PronunciationFeedback;
    } catch (err: any) {
      console.error('[Gemini Pronunciation] Error:', err);
      // Fallthrough to Ollama
    }
  }

  // ═══ Ollama Fallback: STT → text comparison ═══
  try {
    const { OllamaService } = await import('./ollamaService');
    const transcription = await OllamaService.speechToText(base64);

    if (!transcription.trim()) {
      return { score: 0, transcription: '', errors: ['Không nghe thấy giọng nói'], advice: 'Hãy nói to và rõ hơn.' };
    }

    // Use Ollama to compare
    const comparePrompt = `Compare these two texts and score pronunciation accuracy as JSON:
Target: "${targetText}"
Heard: "${transcription}"
Return: {"score": <0-100>, "transcription": "${transcription}", "errors": ["..."], "advice": "..."}
Raw JSON only.`;

    const history = [{ role: 'system' as const, content: 'You are a pronunciation evaluator. Return only JSON.' }];
    const result = await OllamaService.sendChatMessage(history, comparePrompt);
    const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as PronunciationFeedback;

    // Simple fallback
    const similarity = targetText.toLowerCase().trim() === transcription.toLowerCase().trim() ? 90 : 40;
    return { score: similarity, transcription, errors: similarity < 90 ? ['Phát âm chưa khớp'] : [], advice: 'Nghe mẫu và thử lại.' };
  } catch (err: any) {
    console.error('[Ollama Pronunciation Fallback] Error:', err);
    throw new Error('Không thể phân tích phát âm. Kiểm tra kết nối AI.');
  }
};
