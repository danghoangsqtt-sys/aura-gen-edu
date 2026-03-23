
export enum Difficulty {
  A1 = 'A1 (Cơ bản)',
  A2 = 'A2 (Sơ cấp)',
  B1 = 'B1 (Trung cấp)',
  B2 = 'B2 (Trên trung cấp)',
  C1 = 'C1 (Cao cấp)',
  C2 = 'C2 (Thành thạo)'
}

export enum BloomLevel {
  REMEMBER = 'Nhận biết',
  UNDERSTAND = 'Thông hiểu',
  APPLY = 'Vận dụng',
  ANALYZE_CREATE = 'Vận dụng cao'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'Trắc nghiệm',
  SPELLING = 'Chính tả',
  ESSAY = 'Tự luận',
  FILL_BLANKS = 'Điền từ',
  MATCHING = 'Nối từ',
  WORD_ORDER = 'Sắp xếp câu'
}

export interface VocabularyItem {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example?: string;
  topic: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[]; 
  matchingLeft?: string[]; 
  matchingRight?: string[]; 
  correctAnswer: string;
  explanation: string;
  bloomLevel: BloomLevel;
  points?: number;
  questionImage?: string;
  optionImages?: Record<number, string>;
}

export interface ExamConfig {
  title: string;
  subject: string;
  topic: string;
  duration: number;
  difficulty: Difficulty;
  schoolName: string;
  teacherName?: string;
  department?: string;
  examCode: string;
  customRequirement: string;
  sections: {
    type: QuestionType;
    count: number;
    bloomLevels: BloomLevel[];
    pointsPerQuestion: number;
  }[];
}

export interface ExamPaper {
  id: string;
  config: ExamConfig;
  questions: Question[];
  createdAt: string;
  version?: string;
}

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  time: string;
  topic: string;
}

export interface AppUpdate {
  version: string;
  changelog: string[];
  downloadUrl: string;
  hasUpdate: boolean;
}

// --- NEW TYPES FOR SPEAKING LAB ---
export interface SpeakingQuestion {
  id: string;
  question: string;
  sampleAnswer?: string; // Cho chế độ cơ bản & AI suggestion
  topic?: string;       // Cho chế độ nâng cao
  difficulty?: string;
}

export interface SpeakingFeedback {
  score: number;
  pronunciation: string; // Nhận xét phát âm
  grammar: string;       // Nhận xét ngữ pháp
  betterVersion: string; // Phiên bản tốt hơn
  transcription: string; // Nội dung AI nghe được
}

export interface SpeakingExamConfig {
  schoolName: string;
  teacherName: string;
  examName: string;
  examDate: string;
  studentName?: string;
  className?: string;
  duration: number; // minutes
}

export enum EyeState {
  IDLE = 'idle',
  SPEAKING = 'speaking',
  BLINKING = 'blinking'
}

export enum AppMode {
  CHAT = 'chat',
  VOICE = 'voice',
  IDLE = 'idle'
}

// --- PERSONAL VOCAB CANVAS TYPES ---
export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  ipa: string;
  pronunciation?: string;
  partOfSpeech?: string;
  example?: string;
}

// --- HYBRID LEXICON TYPES ---
export interface DictMeaning {
  mean: string;
  example: string;
  examples?: string[]; // Multiple examples support
  synonyms?: string[]; // Meaning-specific synonyms
  antonyms?: string[]; // Meaning-specific antonyms
  context?: string;    // e.g. "Music", "Mathematics", "Colloquial"
}

export interface SpecializedMeaning {
  field: string; // e.g. "Kỹ thuật", "Âm nhạc"
  meanings: DictMeaning[];
}

export interface CompoundWord {
  word: string;
  meaning: string;
  example?: string;
}

export interface DictDetail {
  pos: string;
  means: DictMeaning[];
}

export interface HybridDictEntry {
  vocabulary: string;
  ipa: string; // fallback
  phonetics?: { uk: string; us: string };
  details: {
    pos: string;
    means: DictMeaning[];
  }[];
  domain?: string;
  etymology?: string;
  collocations?: string[];
  wordFamily?: string[];
  specializedMeanings?: SpecializedMeaning[];
  compoundWords?: CompoundWord[];
  idiomsAndPhrasals?: { phrase: string; meaning: string; example: string }[];
  usageNotes?: string;
}

export interface HybridDictionary {
  [letter: string]: {
    [word: string]: HybridDictEntry;
  };
}

export interface VocabFolder {
  id: string;
  name: string;
  words: SavedWord[];
  color?: string;
  position?: { x: number; y: number };
}

export interface MindMapData {
  nodes: any[];
  edges: any[];
}

export interface MindMapTopic {
  id: string;
  name: string;
  data: MindMapData;
}

export interface PersonalVocabData {
  inbox: SavedWord[];
  folders: VocabFolder[];
  topics?: MindMapTopic[];
}

// --- STUDY DOCUMENT TYPES ---
export type DocFileType = 'text' | 'pdf' | 'docx' | 'pptx' | 'video';

export interface StudyDocument {
  id: string;
  title: string;
  description?: string;
  content: string;
  folderId: string | null;
  tags?: string[];
  fileType: DocFileType;
  fileName?: string;
  fileSize?: number;
  fileStorageKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

// --- WRITING PRACTICE TYPES ---
export interface WritingTopic {
  id: string;                  // "topic_1", "topic_2", ...
  prompt: string;              // Đề bài tiếng Anh
  taskType: string;            // "essay", "letter", "report", "email", "review"
  cefrTarget: string;          // CEFR level target (A2-C2)
  wordCountHint: string;       // e.g. "150-200 words"
  tips: string[];              // Gợi ý viết bài
}

export interface WritingSubmission {
  topicId: string;
  userText: string;
  evaluation: any | null;      // WritingEvaluation from geminiService
  submittedAt: string;
  wordCount: number;
}

export interface WritingWeekData {
  weekId: string;              // "w4_m3_y26"
  weekLabel: string;           // "Tuần 4, Tháng 3, 2026"
  generatedAt: string;         // ISO timestamp
  mondayDate: string;          // ISO date of the Monday
  topics: WritingTopic[];      // 10 topics
  submissions: Record<string, WritingSubmission>; // topicId → submission
}
