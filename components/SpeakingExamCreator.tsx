
import React, { useState, useEffect } from 'react';
import { SpeakingQuestion, SpeakingExamConfig, VocabularyItem } from '../types';
import { OllamaService } from '../services/ollamaService';
import SpeakingExamPrint from './SpeakingExamPrint';
import { storage, STORAGE_KEYS } from '../services/storageAdapter';
import { vocabStorage } from '../services/localDataService';

interface Props {
  onBack: () => void;
  initialManualQuestions: SpeakingQuestion[];
}

const SpeakingExamCreator: React.FC<Props> = ({ onBack, initialManualQuestions }) => {
  const [view, setView] = useState<'selection' | 'preview'>('selection');
  const [printMode, setPrintMode] = useState<'student' | 'teacher'>('student');
  
  // Data Sources
  const [manualQuestions, setManualQuestions] = useState<SpeakingQuestion[]>(initialManualQuestions);
  const [topicQuestions, setTopicQuestions] = useState<SpeakingQuestion[]>([]);
  const [savedTopicQuestions, setSavedTopicQuestions] = useState<SpeakingQuestion[]>([]); // New Source
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Selected for Exam
  const [examQuestions, setExamQuestions] = useState<SpeakingQuestion[]>([]);
  const [config, setConfig] = useState<SpeakingExamConfig>({
    schoolName: '',
    teacherName: '',
    examName: 'KIỂM TRA NÓI (SPEAKING TEST)',
    examDate: new Date().toLocaleDateString('vi-VN'),
    duration: 10
  });

  useEffect(() => {
    // ASYNC DATA LOADING
    const initData = async () => {
        // Settings
        const s = await storage.get(STORAGE_KEYS.SETTINGS, { schoolName: '', teacherName: '' });
        setConfig(prev => ({
            ...prev,
            schoolName: s.schoolName || '',
            teacherName: s.teacherName || ''
        }));

        // Vocab
        const vocabs = await vocabStorage.getAll();
        setVocabList(vocabs);

        // Saved Topic Questions
        const savedBank = await storage.get<SpeakingQuestion[]>(STORAGE_KEYS.SPEAKING_TOPIC_BANK, []);
        setSavedTopicQuestions(savedBank);
    };
    initData();
  }, []);

  const topics = Array.from(new Set(vocabList.map(v => v.topic || 'Chung')));

  const handleGenerateTopic = async () => {
    if (!selectedTopic) return;
    setIsGenerating(true);
    try {
      const topicVocab = vocabList.filter(v => v.topic === selectedTopic);
      const qs = await OllamaService.generateSpeakingQuestions(selectedTopic, topicVocab);
      setTopicQuestions(qs);
    } catch (e) {
      alert("Lỗi kết nối AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestion = (q: SpeakingQuestion) => {
    const exists = examQuestions.find(ex => ex.id === q.id);
    if (exists) {
      setExamQuestions(prev => prev.filter(ex => ex.id !== q.id));
    } else {
      if (examQuestions.length >= 2) {
        alert("Đề thi tiêu chuẩn chỉ nên gồm 2 câu hỏi (Part 1 & Part 2) để tối ưu thời gian.");
        return;
      }
      setExamQuestions(prev => [...prev, q]);
    }
  };

  const handlePrint = (mode: 'student' | 'teacher') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 300);
  };

  if (view === 'preview') {
    return (
      <div className="flex flex-col h-full bg-slate-100">
        <div className="bg-white border-b px-6 py-3 flex justify-between items-center no-print shadow-sm z-10">
          <button onClick={() => setView('selection')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại chỉnh sửa
          </button>
          <div className="flex gap-3">
             <button onClick={() => handlePrint('student')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg">In Đề thi</button>
             <button onClick={() => handlePrint('teacher')} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg">In Đáp án</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="a4-wrapper mx-auto shadow-2xl">
            <SpeakingExamPrint config={config} questions={examQuestions} mode={printMode} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 p-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Tạo Đề Thi Nói <span className="text-indigo-600">Pro</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Kết hợp câu hỏi thủ công & AI</p>
        </div>
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* LEFT: SOURCES */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 overflow-hidden">
          
          {/* Config Quick View */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Tên bài thi</label>
              <input value={config.examName} onChange={e => setConfig({...config, examName: e.target.value})} className="w-full bg-slate-50 border p-2 rounded-lg text-xs font-bold" />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Thời lượng</label>
              <input type="number" value={config.duration} onChange={e => setConfig({...config, duration: parseInt(e.target.value) || 10})} className="w-full bg-slate-50 border p-2 rounded-lg text-xs font-bold text-center" />
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="border-b bg-slate-50 px-4 py-2 flex gap-4">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest py-2">Nguồn câu hỏi</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Source 1: Manual */}
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-black text-indigo-700 uppercase mb-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Kho câu hỏi giáo viên ({manualQuestions.length})
                  </h4>
                  <div className="space-y-2">
                    {manualQuestions.length === 0 && <p className="text-xs text-slate-400 italic">Chưa có câu hỏi nào. Hãy tạo ở mục "Basic Interview".</p>}
                    {manualQuestions.map(q => (
                      <div key={q.id} className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer" onClick={() => toggleQuestion(q)}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${examQuestions.find(e => e.id === q.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                          {examQuestions.find(e => e.id === q.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{q.question}</p>
                          {q.sampleAnswer && <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">Sample: {q.sampleAnswer}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source 2: Saved Topic Bank (NEW) */}
                <div className="pt-4 border-t border-dashed">
                  <h4 className="flex items-center gap-2 text-xs font-black text-indigo-700 uppercase mb-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    Kho câu hỏi chủ đề đã lưu ({savedTopicQuestions.length})
                  </h4>
                  <div className="space-y-2">
                    {savedTopicQuestions.length === 0 && <p className="text-xs text-slate-400 italic">Chưa có câu hỏi nào trong kho chủ đề.</p>}
                    {savedTopicQuestions.map(q => (
                       <div key={q.id} className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer" onClick={() => toggleQuestion(q)}>
                         <div className={`w-5 h-5 rounded flex items-center justify-center border ${examQuestions.find(e => e.id === q.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                          {examQuestions.find(e => e.id === q.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2 mb-1">
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 rounded uppercase">{q.topic}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-700">{q.question}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source 3: AI Generator */}
                <div className="pt-4 border-t border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      AI Topic Generator (Tạo ngay)
                    </h4>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <select 
                      className="flex-1 bg-slate-50 border p-2 rounded-lg text-xs font-bold outline-none"
                      value={selectedTopic}
                      onChange={e => setSelectedTopic(e.target.value)}
                    >
                      <option value="">-- Chọn chủ đề --</option>
                      {topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select 
                       className="w-32 bg-slate-50 border p-2 rounded-lg text-xs font-bold outline-none"
                    >
                       <option value="A1">A1</option>
                       <option value="A2">A2</option>
                       <option value="B1">B1</option>
                       <option value="B2">B2</option>
                       <option value="C1">C1</option>
                    </select>
                    <button 
                      onClick={handleGenerateTopic}
                      disabled={!selectedTopic || isGenerating}
                      className="px-3 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isGenerating ? '...' : 'Tạo mới'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {topicQuestions.map(q => (
                      <div key={q.id} className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer" onClick={() => toggleQuestion(q)}>
                         <div className={`w-5 h-5 rounded flex items-center justify-center border ${examQuestions.find(e => e.id === q.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                          {examQuestions.find(e => e.id === q.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{q.question}</p>
                          {q.sampleAnswer && <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">AI Idea: {q.sampleAnswer}</p>}
                        </div>
                      </div>
                    ))}
                    {topicQuestions.length === 0 && !isGenerating && <p className="text-xs text-slate-400 italic">Chọn chủ đề và nhấn tạo để lấy câu hỏi từ AI.</p>}
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT: SELECTED PREVIEW */}
        <div className="col-span-12 lg:col-span-5 flex flex-col h-full bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-200 p-4">
           <h3 className="text-center text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 bg-white px-3 py-1 rounded-full self-center shadow-sm">
             Đề thi đang chọn ({examQuestions.length}/2)
           </h3>

           <div className="flex-1 space-y-3 overflow-y-auto pr-1">
             {examQuestions.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-40">
                 <svg className="w-12 h-12 text-indigo-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                 <p className="text-[10px] font-bold uppercase text-indigo-400">Chưa có câu hỏi</p>
               </div>
             ) : (
               examQuestions.map((q, i) => (
                 <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 relative group animate-in slide-in-from-right-4">
                    <button onClick={() => toggleQuestion(q)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase">Câu hỏi {i + 1}</span>
                    <p className="mt-2 text-sm font-bold text-slate-800">{q.question}</p>
                    {q.sampleAnswer && (
                      <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Đáp án gợi ý:</p>
                        <p className="text-[11px] text-slate-600 italic line-clamp-3">{q.sampleAnswer}</p>
                      </div>
                    )}
                 </div>
               ))
             )}
           </div>

           <div className="mt-4 pt-4 border-t border-indigo-200">
             <button 
               disabled={examQuestions.length === 0}
               onClick={() => setView('preview')}
               className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none"
             >
               XEM TRƯỚC & IN ẤN
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingExamCreator;
