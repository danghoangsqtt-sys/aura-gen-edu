
import React, { useState, useEffect, useRef } from 'react';
import { SpeakingQuestion, SpeakingFeedback } from '../types';
import { OllamaService } from '../services/ollamaService';
import { AIConfigService } from '../services/aiConfigService';
import { evaluateSpeakingSession, generateSpeakingQuestions as geminiGenerateSpeaking } from '../services/speakingService';
import { SpeakingImageService } from '../services/speakingImageService';
import { storage, STORAGE_KEYS } from '../services/storageAdapter';
import { defaultTopicBank } from '../data/speakingTopicData';

interface Props {
  onBack: () => void;
}

type ViewMode = 'menu' | 'generator' | 'library' | 'practice';

const GENERATOR_TOPICS = [
  'Technology & Innovation', 'Environment & Nature', 'Education & Learning',
  'Health & Wellbeing', 'Work & Career', 'Travel & Tourism',
  'Culture & Traditions', 'Society & Lifestyle', 'Entertainment & Media',
  'Science & Discovery', 'Family & Relationships', 'Food & Cooking',
  'Sports & Fitness', 'Art & Design', 'Economy & Business',
];

const CEFR_LEVELS = [
  { value: 'A1-A2', label: 'Beginner (A1-A2)' },
  { value: 'B1-B2', label: 'Intermediate (B1-B2)' },
  { value: 'C1-C2', label: 'Advanced (C1-C2)' },
];

const SpeakingTopicMode: React.FC<Props> = ({ onBack }) => {
  const [view, setView] = useState<ViewMode>('menu');
  
  // Data
  const [topicBank, setTopicBank] = useState<SpeakingQuestion[]>([]);
  
  // Generator State
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('B1-B2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQs, setGeneratedQs] = useState<SpeakingQuestion[]>([]);

  // Library State
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Practice State
  const [practiceQs, setPracticeQs] = useState<SpeakingQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  
  // Manual Add Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQ, setNewQ] = useState({ question: '', sampleAnswer: '', topic: '', imageUrl: '' });
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Image URL cache: maps relative paths to resolved base64 data URLs
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

  // Resolve image URLs whenever topicBank or practiceQs change
  useEffect(() => {
    const resolveAll = async () => {
      const allQs = [...topicBank, ...practiceQs];
      const toResolve = allQs.filter(q => q.imageUrl && SpeakingImageService.isFilePath(q.imageUrl) && !resolvedImages[q.imageUrl]);
      if (toResolve.length === 0) return;
      const newResolved = { ...resolvedImages };
      for (const q of toResolve) {
        if (q.imageUrl) {
          newResolved[q.imageUrl] = await SpeakingImageService.resolveImageUrl(q.imageUrl);
        }
      }
      setResolvedImages(newResolved);
    };
    resolveAll();
  }, [topicBank, practiceQs]);

  // Helper: get renderable image URL (resolved or raw)
  const getImageSrc = (imageUrl?: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    return resolvedImages[imageUrl] || '';
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    const initData = async () => {
      // Load Topic Bank (with default seed)
      let savedBank = await storage.get<SpeakingQuestion[]>(STORAGE_KEYS.SPEAKING_TOPIC_BANK, []);
      
      if (!savedBank || savedBank.length === 0) {
        const seeded = await storage.get<boolean>(STORAGE_KEYS.SPEAKING_TOPIC_BANK_SEEDED, false);
        if (!seeded) {
          savedBank = [...defaultTopicBank];
          await storage.set(STORAGE_KEYS.SPEAKING_TOPIC_BANK, savedBank);
          await storage.set(STORAGE_KEYS.SPEAKING_TOPIC_BANK_SEEDED, true);
        }
      }
      setTopicBank(savedBank);
    };
    initData();
  }, []);

  const bankTopics = Array.from(new Set(topicBank.map(q => q.topic || 'Chung').filter(Boolean)));

  // Persist helper
  const saveTopicBank = async (updated: SpeakingQuestion[]) => {
    setTopicBank(updated);
    await storage.set(STORAGE_KEYS.SPEAKING_TOPIC_BANK, updated);
  };

  // --- GENERATOR ACTIONS (AI Router + Auto-save) ---
  const handleGenerate = async () => {
    if (!selectedTopic) return;
    setIsGenerating(true);
    setGeneratedQs([]);
    try {
      const provider = AIConfigService.getProvider();
      let qs: SpeakingQuestion[];

      if (provider === 'gemini') {
        qs = await geminiGenerateSpeaking(selectedTopic, selectedLevel);
      } else {
        const raw = await OllamaService.generateSpeakingQuestions(selectedTopic, selectedLevel);
        qs = raw.map((q: any, idx: number) => ({
          id: `ai-speak-${Date.now()}-${idx}`,
          question: q.question || '',
          sampleAnswer: q.sampleAnswer || q.answer || '',
          topic: selectedTopic,
          difficulty: q.difficulty || selectedLevel,
        }));
      }

      // Auto-save to bank
      const validQs = qs.filter(q => q.question?.trim());
      if (validQs.length > 0) {
        await saveTopicBank([...topicBank, ...validQs]);
        setGeneratedQs(validQs);
      } else {
        alert('AI không trả về câu hỏi hợp lệ. Thử lại.');
      }
    } catch (e) {
      console.error('Generate Speaking Error:', e);
      alert('Lỗi kết nối AI. Kiểm tra cấu hình trong Settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- LIBRARY ACTIONS ---
  const handleDeleteQ = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;
    const newBank = topicBank.filter(q => q.id !== id);
    await saveTopicBank(newBank);
  };

  // --- ADD MANUAL QUESTION (with image support) ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Chỉ chấp nhận file hình ảnh.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Hình ảnh quá lớn (tối đa 5MB).'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewQ(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddManualQ = async () => {
    if (!newQ.question.trim()) { alert('Vui lòng nhập câu hỏi.'); return; }
    
    // Save image to file system if present
    let savedImageUrl: string | undefined;
    if (newQ.imageUrl) {
      savedImageUrl = await SpeakingImageService.saveImage(newQ.imageUrl, `question_${Date.now()}`);
    }
    
    const q: SpeakingQuestion = {
      id: `manual-topic-${Date.now()}`,
      question: newQ.question.trim(),
      sampleAnswer: newQ.sampleAnswer.trim() || undefined,
      topic: newQ.topic.trim() || 'Picture Description',
      difficulty: 'Manual',
      imageUrl: savedImageUrl,
    };
    await saveTopicBank([...topicBank, q]);
    setNewQ({ question: '', sampleAnswer: '', topic: '', imageUrl: '' });
    setShowAddForm(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const startPractice = (questions: SpeakingQuestion[]) => {
    if (questions.length === 0) return;
    setPracticeQs(questions);
    setCurrentQIndex(0);
    setFeedback(null);
    setView('practice');
  };

  // --- BATCH IMPORT ---
  const handleBatchImport = async () => {
    if (!batchText.trim()) return;
    const text = batchText.trim();
    let newQuestions: SpeakingQuestion[] = [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        newQuestions = parsed.map((item: any, idx: number) => ({
          id: `topic-import-${Date.now()}-${idx}`,
          question: item.question || item.q || '',
          sampleAnswer: item.sampleAnswer || item.answer || item.a || '',
          topic: item.topic || '',
          difficulty: item.difficulty || 'Imported',
        })).filter(q => q.question.trim());
      }
    } catch {
      const lines = text.split('\n').filter(l => l.trim());
      newQuestions = lines.map((line, idx) => {
        let parts: string[];
        if (line.includes('|')) {
          parts = line.split('|').map(p => p.trim());
        } else if (line.includes('\t')) {
          parts = line.split('\t').map(p => p.trim());
        } else {
          parts = [line.trim()];
        }
        return {
          id: `topic-batch-${Date.now()}-${idx}`,
          question: parts[0] || '',
          sampleAnswer: parts[1] || '',
          topic: parts[2] || '',
          difficulty: 'Imported',
        };
      }).filter(q => q.question.trim());
    }

    if (newQuestions.length === 0) {
      alert('Không tìm thấy câu hỏi hợp lệ.');
      return;
    }

    await saveTopicBank([...topicBank, ...newQuestions]);
    setBatchText('');
    setShowBatchImport(false);
    alert(`✅ Đã import ${newQuestions.length} câu hỏi!`);
  };

  // --- IMPORT / EXPORT JSON ---
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(topicBank, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speaking_topic_bank_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) { alert('File JSON phải chứa một array câu hỏi.'); return; }
      const imported: SpeakingQuestion[] = parsed.map((item: any, idx: number) => ({
        id: item.id || `json-topic-${Date.now()}-${idx}`,
        question: item.question || '',
        sampleAnswer: item.sampleAnswer || '',
        topic: item.topic || '',
        difficulty: item.difficulty || 'Imported',
      })).filter((q: SpeakingQuestion) => q.question.trim());
      await saveTopicBank([...topicBank, ...imported]);
      alert(`✅ Đã import ${imported.length} câu hỏi từ file!`);
    } catch {
      alert('Lỗi đọc file JSON.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- RESTORE DEFAULTS ---
  const handleRestoreDefaults = async () => {
    if (!confirm('⚠️ Thao tác này sẽ THAY THẾ toàn bộ kho câu hỏi bằng bộ dữ liệu mặc định (48 câu). Bạn có chắc chắn?')) return;
    await saveTopicBank([...defaultTopicBank]);
  };

  // --- PRACTICE ACTIONS (RECORDING) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - recordingStartRef.current;
        if (duration < 1500) {
          alert('⏱️ Bạn cần nói ít nhất 2 giây. Hãy thử lại.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const currentQ = practiceQs[currentQIndex];
            const provider = AIConfigService.getProvider();

            let result: SpeakingFeedback;
            if (provider === 'gemini') {
              // Gemini: gửi audio trực tiếp, bypass STT
              result = await evaluateSpeakingSession(currentQ.question, base64Audio, currentQ.sampleAnswer);
            } else {
              // Ollama: STT trước → evaluate bằng text
              const transcription = await OllamaService.speechToText(base64Audio);
              result = await OllamaService.evaluateSpeaking(currentQ.question, transcription);
            }
            setFeedback(result);
          } catch (err: any) {
            console.error('[SpeakingTopic] Evaluation error:', err);
            alert('⚠️ Lỗi phân tích AI. Vui lòng nói to và rõ ràng hơn, sau đó thử lại.');
          } finally {
            setIsProcessing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      alert("Không thể truy cập Microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const nextQuestion = () => {
    if (currentQIndex < practiceQs.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setFeedback(null);
    } else {
      alert("Bạn đã hoàn thành bài luyện tập!");
      setView('library');
    }
  };

  // Filtered and grouped data
  const filteredBank = filterTopic === 'all' ? topicBank : topicBank.filter(q => (q.topic || 'Chung') === filterTopic);
  const groupedBank: Record<string, SpeakingQuestion[]> = {};
  filteredBank.forEach(q => {
    const topic = q.topic || 'Chung';
    if (!groupedBank[topic]) groupedBank[topic] = [];
    groupedBank[topic].push(q);
  });

  // --- RENDER ---
  // === MENU ===
  if (view === 'menu') {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-slate-50 border-b px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white border rounded-xl hover:bg-slate-100" title="Quay lại"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase">Topic Challenge</h2>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{topicBank.length} câu hỏi · {bankTopics.length} chủ đề</p>
          </div>
        </div>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            <button onClick={() => setView('generator')} className="group bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-100 p-6 rounded-2xl text-left transition-all shadow-lg active:scale-95">
               <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-xl shadow-emerald-200 group-hover:scale-110 transition-transform">⚡</div>
               <h3 className="text-xl font-black text-emerald-900 uppercase mb-1">AI Generator</h3>
               <p className="text-xs font-medium text-emerald-700">Tạo câu hỏi mới từ chủ đề & trình độ CEFR.</p>
            </button>
            <button onClick={() => setView('library')} className="group bg-indigo-50 border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-100 p-6 rounded-2xl text-left transition-all shadow-lg active:scale-95 relative">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">📂</div>
               <h3 className="text-xl font-black text-indigo-900 uppercase mb-1">Question Bank</h3>
               <p className="text-xs font-medium text-indigo-700">Kho lưu trữ câu hỏi chủ đề. Luyện tập lại bất cứ lúc nào.</p>
               {topicBank.length > 0 && (
                 <span className="absolute top-3 right-3 px-2 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full">{topicBank.length}</span>
               )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === GENERATOR ===
  if (view === 'generator') {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => { setView('menu'); setGeneratedQs([]); }} className="p-2 bg-white border rounded-xl hover:bg-slate-100" title="Quay lại"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
             <h2 className="text-lg font-black text-slate-800 uppercase">Tạo câu hỏi AI</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-100 space-y-4">
                 {/* Topic dropdown */}
                 <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Chọn chủ đề</label>
                   <select 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                      value={selectedTopic}
                      onChange={e => setSelectedTopic(e.target.value)}
                   >
                      <option value="">-- Chọn chủ đề --</option>
                      {GENERATOR_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>

                 {/* Level dropdown */}
                 <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Trình độ CEFR</label>
                   <select 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                      value={selectedLevel}
                      onChange={e => setSelectedLevel(e.target.value)}
                      title="Chọn trình độ CEFR"
                   >
                      {CEFR_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                   </select>
                 </div>

                 <button 
                    disabled={!selectedTopic || isGenerating}
                    onClick={handleGenerate}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50"
                 >
                    {isGenerating ? 'AI Đang suy nghĩ...' : '⚡ Tạo & Lưu tự động'}
                 </button>
              </div>

              {generatedQs.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-black text-emerald-700 uppercase">✅ Đã tạo & lưu {generatedQs.length} câu hỏi</h3>
                     <button onClick={() => setView('library')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md">Xem kho →</button>
                  </div>
                  {generatedQs.map((q, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm">
                       <p className="font-bold text-slate-800">{q.question}</p>
                       <p className="text-xs text-slate-500 mt-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">Gợi ý: {q.sampleAnswer}</p>
                       <div className="flex items-center gap-2 mt-2">
                         <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">{q.difficulty}</span>
                         <span className="text-[9px] font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded">{q.topic}</span>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  // === LIBRARY ===
  if (view === 'library') {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setView('menu')} className="p-2 bg-white border rounded-xl hover:bg-slate-100" title="Quay lại"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
             <div>
               <h2 className="text-lg font-black text-slate-800 uppercase">Kho câu hỏi chủ đề</h2>
               <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{topicBank.length} câu · {bankTopics.length} chủ đề</p>
             </div>
          </div>
          <button onClick={() => startPractice(filteredBank)} disabled={filteredBank.length === 0} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md flex items-center gap-2 disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Luyện tập {filterTopic !== 'all' ? `(${filteredBank.length})` : 'tất cả'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setShowAddForm(!showAddForm)} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm">🖼️ Thêm câu hỏi</button>
              <button onClick={() => setShowBatchImport(!showBatchImport)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-1.5">📋 Dán hàng loạt</button>
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center gap-1.5">📥 Import JSON</button>
              <button onClick={handleExportJSON} disabled={topicBank.length === 0} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all flex items-center gap-1.5 disabled:opacity-40">📤 Export JSON</button>
              <button onClick={handleRestoreDefaults} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-amber-300 hover:text-amber-600 transition-all flex items-center gap-1.5">🔄 Mặc định</button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} title="Chọn file JSON để import" />
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} title="Chọn hình ảnh" />
            </div>

            {/* Add Manual Question Form */}
            {showAddForm && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-200 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">🖼️ Thêm câu hỏi mới (có thể kèm hình)</h3>
                  <button onClick={() => { setShowAddForm(false); setNewQ({ question: '', sampleAnswer: '', topic: '', imageUrl: '' }); }} className="text-slate-400 hover:text-rose-500" title="Đóng">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <input
                  className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                  placeholder="Câu hỏi (VD: Describe the picture below...)"
                  value={newQ.question}
                  onChange={e => setNewQ(p => ({ ...p, question: e.target.value }))}
                />
                <input
                  className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                  placeholder="Gợi ý trả lời (không bắt buộc)"
                  value={newQ.sampleAnswer}
                  onChange={e => setNewQ(p => ({ ...p, sampleAnswer: e.target.value }))}
                />
                <div className="flex gap-2">
                  <input
                    className="flex-1 p-3 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                    placeholder="Chủ đề (VD: Picture Description)"
                    value={newQ.topic}
                    onChange={e => setNewQ(p => ({ ...p, topic: e.target.value }))}
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] font-black text-indigo-600 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                  >
                    📷 {newQ.imageUrl ? 'Đổi ảnh' : 'Thêm ảnh'}
                  </button>
                </div>
                {newQ.imageUrl && (
                  <div className="relative inline-block">
                    <img src={newQ.imageUrl} alt="Preview" className="w-40 h-28 object-cover rounded-xl border border-emerald-200 shadow-sm" />
                    <button
                      onClick={() => { setNewQ(p => ({ ...p, imageUrl: '' })); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow hover:bg-rose-600"
                      title="Xóa ảnh"
                    >✕</button>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowAddForm(false); setNewQ({ question: '', sampleAnswer: '', topic: '', imageUrl: '' }); }} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase">Hủy</button>
                  <button onClick={handleAddManualQ} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all">✅ Lưu câu hỏi</button>
                </div>
              </div>
            )}

            {/* Batch Import Panel */}
            {showBatchImport && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Nhập hàng loạt</h3>
                  <button onClick={() => setShowBatchImport(false)} className="text-slate-400 hover:text-rose-500" title="Đóng">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Dán nhiều câu: <code className="bg-slate-100 px-1 rounded text-[9px]">Question | Answer | Topic</code> hoặc JSON array
                </p>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 min-h-[120px] font-mono"
                  placeholder={`What are the effects of pollution? | Pollution causes health issues... | Environment\nShould education be free? | Yes, because... | Education`}
                  value={batchText}
                  onChange={e => setBatchText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setBatchText(''); setShowBatchImport(false); }} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase">Hủy</button>
                  <button onClick={handleBatchImport} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all">Import</button>
                </div>
              </div>
            )}

            {/* Topic Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setFilterTopic('all')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filterTopic === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200'}`}
              >
                Tất cả ({topicBank.length})
              </button>
              {bankTopics.map(topic => {
                const count = topicBank.filter(q => (q.topic || 'Chung') === topic).length;
                return (
                  <button 
                    key={topic}
                    onClick={() => setFilterTopic(topic)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filterTopic === topic ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200'}`}
                  >
                    {topic} ({count})
                  </button>
                );
              })}
            </div>

            {/* Questions grouped by topic */}
            {topicBank.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center opacity-40">
                 <p className="text-xs font-black uppercase tracking-widest">Kho trống</p>
                 <p className="text-[10px] mt-1">Nhấn "🔄 Mặc định" hoặc sang Generator để tạo câu hỏi</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedBank).map(([topic, topicQs]) => (
                  <div key={topic} className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider">{topic}</h4>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{topicQs.length}</span>
                      <button 
                        onClick={() => startPractice(topicQs)} 
                        className="ml-auto text-[9px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1"
                        title="Luyện tập chủ đề này"
                      >
                        ▶ Luyện tập
                      </button>
                    </div>
                    {topicQs.map((q, idx) => (
                      <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 group hover:border-indigo-200 transition-all">
                        <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          {q.imageUrl && getImageSrc(q.imageUrl) && (
                            <img src={getImageSrc(q.imageUrl)} alt="Question" className="w-full max-w-xs h-32 object-cover rounded-xl border border-slate-200 mb-2" />
                          )}
                          <p className="font-bold text-slate-800 text-sm">{q.question}</p>
                          {q.sampleAnswer && <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">Sample: {q.sampleAnswer}</p>}
                          <div className="flex items-center gap-1.5 mt-1">
                            {q.difficulty && <span className="text-[9px] font-bold bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded">{q.difficulty}</span>}
                            {q.imageUrl && <span className="text-[9px] font-bold bg-violet-50 text-violet-500 px-1.5 py-0.5 rounded">🖼️ Có hình</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startPractice([q])} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Luyện tập câu này"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg></button>
                          <button onClick={() => handleDeleteQ(q.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100" title="Xóa câu hỏi"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === PRACTICE MODE ===
  if (view === 'practice') {
     const currentQ = practiceQs[currentQIndex];
     return (
        <div className="h-full flex flex-col bg-white">
          <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between">
            <button onClick={() => setView('library')} className="p-2 bg-white border rounded-xl hover:bg-slate-100" title="Quay lại"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
            <h2 className="text-lg font-black text-slate-800 uppercase">Luyện tập ({currentQIndex + 1}/{practiceQs.length})</h2>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/30">
            <div className="w-full max-w-2xl space-y-8 animate-in zoom-in duration-300">
               <div className="text-center space-y-4">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">{currentQ.topic || 'Chủ đề'}</span>
                  {currentQ.imageUrl && (
                    <div className="flex justify-center">
                      <img src={getImageSrc(currentQ.imageUrl)} alt="Question" className="max-w-md max-h-72 object-contain rounded-2xl border-2 border-slate-200 shadow-lg" />
                    </div>
                  )}
                  <h3 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight">{currentQ.question}</h3>
                  {currentQ.sampleAnswer && (
                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 inline-block max-w-lg">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Gợi ý</p>
                      <p className="text-sm text-indigo-800 italic">"{currentQ.sampleAnswer}"</p>
                    </div>
                  )}
               </div>

               {feedback && (
                  <div className="bg-white rounded-2xl p-6 shadow-2xl border border-indigo-50 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg ${feedback.score >= 80 ? 'bg-emerald-500 shadow-emerald-200' : feedback.score >= 50 ? 'bg-amber-500 shadow-amber-200' : 'bg-rose-500 shadow-rose-200'}`}>{feedback.score}</div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đánh giá</p>
                          <h4 className="text-xl font-bold text-slate-800">{feedback.score >= 80 ? 'Tuyệt vời!' : feedback.score >= 50 ? 'Khá tốt!' : 'Cần cố gắng!'}</h4>
                        </div>
                    </div>
                    <div className="space-y-3">
                       <div className="bg-slate-50 p-3 rounded-xl">
                         <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Nghe được</p>
                         <p className="text-sm text-slate-600 italic">"{feedback.transcription}"</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                           <p className="text-[9px] font-black text-rose-500 uppercase mb-0.5">Phát âm</p>
                           <p className="text-xs text-slate-600">{feedback.pronunciation}</p>
                         </div>
                         <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                           <p className="text-[9px] font-black text-amber-600 uppercase mb-0.5">Ngữ pháp</p>
                           <p className="text-xs text-slate-600">{feedback.grammar}</p>
                         </div>
                       </div>
                       <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                         <p className="text-[9px] font-black text-emerald-600 uppercase mb-0.5">Phiên bản tốt hơn</p>
                         <p className="text-sm text-emerald-800 italic font-bold">"{feedback.betterVersion}"</p>
                       </div>
                    </div>
                    <button onClick={nextQuestion} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">Câu tiếp theo</button>
                  </div>
               )}

               {!feedback && (
                  <div className="flex flex-col items-center gap-6">
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                        isRecording 
                        ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.6)] scale-110' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200'
                      }`}
                      title={isRecording ? 'Nhấn để dừng' : 'Nhấn để nói'}
                    >
                      {isRecording && <div className="absolute inset-0 rounded-full border-4 border-white opacity-30 animate-ping"></div>}
                      {isProcessing ? (
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      )}
                    </button>
                    <p className={`text-xs font-black uppercase tracking-[2px] ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                      {isProcessing ? 'AI đang chấm điểm...' : isRecording ? 'Đang ghi âm...' : 'Nhấn để trả lời'}
                    </p>
                  </div>
               )}
            </div>
          </div>
        </div>
     );
  }

  return null;
};

export default SpeakingTopicMode;
