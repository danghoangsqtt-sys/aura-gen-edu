
import { GoogleGenAI, Type } from "@google/genai";
import { SpeakingQuestion, SpeakingFeedback } from "../types";
import { AIConfigService } from "./aiConfigService";

const getApiKey = (): string => {
  return AIConfigService.getGeminiApiKey() || '';
};

const cleanJsonResponse = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

/**
 * Tạo câu hỏi phỏng vấn dựa trên chủ đề và trình độ (Topic Mode — không phụ thuộc Vocab Bank)
 */
export const generateSpeakingQuestions = async (topic: string, level: string): Promise<SpeakingQuestion[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chưa cấu hình API Key.");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    You are an expert IELTS Speaking examiner.
    Generate 5 speaking interview questions (Part 1 & 2) about the topic: "${topic}".
    The questions MUST be appropriate for CEFR level: ${level}.
    
    Level guidelines:
    - A1-A2 (Beginner): Simple, personal questions. Use common vocabulary. Short expected answers.
    - B1-B2 (Intermediate): Opinion-based questions. Use topic-specific vocabulary. Expect detailed answers.
    - C1-C2 (Advanced): Abstract, analytical questions. Use sophisticated vocabulary. Expect complex argumentation.
    
    For each question, provide:
    - "question": The speaking question text.
    - "sampleAnswer": A natural, well-structured model answer (2-4 sentences) matching the level.
    - "difficulty": The CEFR level tag (e.g. "B1" or "B2").
    
    Return a JSON array of question objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              sampleAnswer: { type: Type.STRING },
              difficulty: { type: Type.STRING },
            },
            required: ["question", "sampleAnswer"]
          }
        }
      }
    });
    
    const rawQuestions = JSON.parse(cleanJsonResponse(response.text));
    return rawQuestions.map((q: any, idx: number) => ({
      ...q,
      id: `ai-speak-${Date.now()}-${idx}`,
      topic: topic
    }));
  } catch (error) {
    console.error("Gen Speaking Error:", error);
    throw error;
  }
};

/**
 * Đánh giá bài nói (Audio) của học sinh
 */
export const evaluateSpeakingSession = async (
  question: string, 
  audioBase64: string, 
  sampleAnswer?: string
): Promise<SpeakingFeedback> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chưa cấu hình API Key.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Xây dựng prompt — STRICT Rubric-based Scoring
  let promptText = `You are a STRICT and PROFESSIONAL English speaking examiner.
Your task is to evaluate the student's spoken answer from the audio provided.

THE QUESTION WAS: "${question}"
`;
  
  if (sampleAnswer) {
    promptText += `\nMODEL ANSWER (for reference): "${sampleAnswer}"\n`;
  }

  promptText += `
CRITICAL SCORING RULES (YOU MUST FOLLOW EXACTLY):

1. SILENCE/NOISE DETECTION: If the audio contains ONLY silence, background noise, breathing, 
   or sounds that are NOT recognizable English speech, you MUST:
   - Set score to 0
   - Set transcription to "[Không nghe được nội dung]"
   - Set pronunciation to "Không có nội dung để đánh giá."
   - Set grammar to "Không có nội dung để đánh giá."
   - Set betterVersion to ""

2. IRRELEVANT ANSWER: If the student says something completely unrelated to the question, 
   score MUST be between 0-20 maximum.

3. DO NOT HALLUCINATE: Only transcribe words you ACTUALLY HEAR clearly. 
   If you're unsure about a word, mark it as [unclear]. 
   NEVER invent or add words the student did not say.

4. SCORING RUBRIC (0-100):
   - 0: Silence, noise, or no speech detected
   - 1-20: Mostly unintelligible, or completely off-topic
   - 21-40: Very poor — many pronunciation errors, limited vocabulary, broken grammar
   - 41-60: Below average — noticeable errors but partially understandable
   - 61-75: Good — some errors but communicates the idea adequately
   - 76-85: Very good — minor errors, natural flow, relevant vocabulary
   - 86-100: Excellent — near-native fluency, rich vocabulary, perfect grammar

5. FEEDBACK MUST BE IN VIETNAMESE (for pronunciation, grammar fields).

Return a JSON object with these exact fields:
- transcription: Exactly what you heard (do NOT add words not spoken)
- score: Integer 0-100 following the rubric above
- pronunciation: Detailed pronunciation feedback (mention specific errors by word)
- grammar: Grammar and vocabulary assessment
- betterVersion: A natural, native-speaker version of the answer (in English)
`;


  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: promptText },
        { inlineData: { mimeType: 'audio/webm', data: audioBase64 } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            score: { type: Type.NUMBER },
            pronunciation: { type: Type.STRING },
            grammar: { type: Type.STRING },
            betterVersion: { type: Type.STRING }
          },
          required: ["score", "pronunciation", "grammar", "betterVersion", "transcription"]
        }
      }
    });

    return JSON.parse(cleanJsonResponse(response.text)) as SpeakingFeedback;
  } catch (error) {
    console.error("Evaluate Speaking Error:", error);
    throw error;
  }
};
