
import React, { useState, useEffect } from 'react';
import { SpeakingQuestion, SpeakingExamConfig } from '../types';
import { OllamaService } from '../services/ollamaService';
import { AIConfigService } from '../services/aiConfigService';
import { generateSpeakingQuestions as geminiGenerateSpeaking } from '../services/speakingService';
import { SpeakingImageService } from '../services/speakingImageService';
import SpeakingExamPrint from './SpeakingExamPrint';
import { storage, STORAGE_KEYS } from '../services/storageAdapter';
import { defaultSpeakingPart1 } from '../data/speakingPart1Data';
import { defaultTopicBank } from '../data/speakingTopicData';

interface Props {
  onBack: () => void;
  initialManualQuestions: SpeakingQuestion[];
}

type SourceTab = 'basic' | 'topic' | 'ai';

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

const SpeakingExamCreator: React.FC<Props> = ({ onBack, initialManualQuestions }) => {
  const [view, setView] = useState<'selection' | 'preview'>('selection');
  const [printMode, setPrintMode] = useState<'student' | 'teacher'>('student');
  const [activeTab, setActiveTab] = useState<SourceTab>('basic');
  
  // Data Sources
  const [basicQuestions, setBasicQuestions] = useState<SpeakingQuestion[]>(initialManualQuestions);
  const [topicQuestions, setTopicQuestions] = useState<SpeakingQuestion[]>([]);
  const [aiGeneratedQs, setAiGeneratedQs] = useState<SpeakingQuestion[]>([]);
  
  // Filters
  const [filterTopic, setFilterTopic] = useState('all');
  
  // AI Generator
  const [selectedGenTopic, setSelectedGenTopic] = useState('');
  const [selectedGenLevel, setSelectedGenLevel] = useState('B1-B2');
  const [isGenerating, setIsGenerating] = useState(false);

  // Selected for Exam
  const [examQuestions, setExamQuestions] = useState<SpeakingQuestion[]>([]);
  const [config, setConfig] = useState<SpeakingExamConfig>({
    schoolName: '',
    teacherName: '',
    examName: 'KIỂM TRA NÓI (SPEAKING TEST)',
    examDate: new Date().toLocaleDateString('vi-VN'),
    className: '',
    duration: 10
  });

  // Image URL cache for file-based images (must be after all question states)
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const resolveAll = async () => {
      const allQs = [...basicQuestions, ...topicQuestions, ...aiGeneratedQs, ...examQuestions];
      const toResolve = allQs.filter(q => q.imageUrl && SpeakingImageService.isFilePath(q.imageUrl) && !resolvedImages[q.imageUrl]);
      if (toResolve.length === 0) return;
      const newResolved = { ...resolvedImages };
      for (const q of toResolve) {
        if (q.imageUrl) newResolved[q.imageUrl] = await SpeakingImageService.resolveImageUrl(q.imageUrl);
      }
      setResolvedImages(newResolved);
    };
    resolveAll();
  }, [basicQuestions, topicQuestions, aiGeneratedQs, examQuestions]);

  const getImageSrc = (imageUrl?: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return imageUrl;
    return resolvedImages[imageUrl] || '';
  };

  useEffect(() => {
    const initData = async () => {
      // Settings
      const s = await storage.get(STORAGE_KEYS.SETTINGS, { schoolName: '', teacherName: '' });
      setConfig(prev => ({
        ...prev,
        schoolName: s.schoolName || '',
        teacherName: s.teacherName || ''
      }));

      // Basic Interview questions
      if (initialManualQuestions.length === 0) {
        const storedManual = await storage.get<SpeakingQuestion[]>(STORAGE_KEYS.SPEAKING_MANUAL, []);
        setBasicQuestions(storedManual && storedManual.length > 0 ? storedManual : defaultSpeakingPart1);
      }

      // Topic Challenge questions
      const savedBank = await storage.get<SpeakingQuestion[]>(STORAGE_KEYS.SPEAKING_TOPIC_BANK, []);
      setTopicQuestions(savedBank && savedBank.length > 0 ? savedBank : [...defaultTopicBank]);
    };
    initData();
  }, []);

  // Derived topics for filter chips
  const basicTopics = Array.from(new Set(basicQuestions.map(q => q.topic || 'Chung').filter(Boolean)));
  const topicBankTopics = Array.from(new Set(topicQuestions.map(q => q.topic || 'Chung').filter(Boolean)));

  // Filtered lists
  const filteredBasic = filterTopic === 'all' ? basicQuestions : basicQuestions.filter(q => (q.topic || 'Chung') === filterTopic);
  const filteredTopic = filterTopic === 'all' ? topicQuestions : topicQuestions.filter(q => (q.topic || 'Chung') === filterTopic);

  // --- AI Generator ---
  const handleGenerate = async () => {
    if (!selectedGenTopic) return;
    setIsGenerating(true);
    setAiGeneratedQs([]);
    try {
      const provider = AIConfigService.getProvider();
      let qs: SpeakingQuestion[];
      if (provider === 'gemini') {
        qs = await geminiGenerateSpeaking(selectedGenTopic, selectedGenLevel);
      } else {
        const raw = await OllamaService.generateSpeakingQuestions(selectedGenTopic, selectedGenLevel);
        qs = raw.map((q: any, idx: number) => ({
          id: `ai-exam-${Date.now()}-${idx}`,
          question: q.question || '',
          sampleAnswer: q.sampleAnswer || q.answer || '',
          topic: selectedGenTopic,
          difficulty: q.difficulty || selectedGenLevel,
        }));
      }
      setAiGeneratedQs(qs.filter(q => q.question?.trim()));
    } catch (e) {
      console.error('[ExamCreator] AI Generate Error:', e);
      alert('Lỗi kết nối AI. Kiểm tra cấu hình trong Settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Selection ---
  const toggleQuestion = (q: SpeakingQuestion) => {
    const exists = examQuestions.find(ex => ex.id === q.id);
    if (exists) {
      setExamQuestions(prev => prev.filter(ex => ex.id !== q.id));
    } else {
      if (examQuestions.length >= 10) {
        alert('Đề thi tối đa 10 câu hỏi.');
        return;
      }
      setExamQuestions(prev => [...prev, q]);
    }
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= examQuestions.length) return;
    const updated = [...examQuestions];
    [updated[index], updated[newIdx]] = [updated[newIdx], updated[index]];
    setExamQuestions(updated);
  };

  const isSelected = (id: string) => !!examQuestions.find(e => e.id === id);

  const handlePrint = (mode: 'student' | 'teacher') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 300);
  };

  // --- PREVIEW VIEW ---
  if (view === 'preview') {
    return (
      <div className="flex flex-col h-full bg-slate-100">
        <div className="bg-white border-b px-6 py-3 flex justify-between items-center no-print shadow-sm z-10">
          <button onClick={() => setView('selection')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại chỉnh sửa
          </button>
          <div className="flex gap-3">
             <button onClick={() => handlePrint('student')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg">🖨️ In Đề thi</button>
             <button onClick={() => handlePrint('teacher')} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg">📕 In Đáp án</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="a4-wrapper mx-auto shadow-2xl">
            <SpeakingExamPrint config={config} questions={examQuestions.map(q => ({
              ...q,
              imageUrl: q.imageUrl ? getImageSrc(q.imageUrl) || q.imageUrl : undefined,
            }))} mode={printMode} />
          </div>
        </div>
      </div>
    );
  }

  // --- Question Card Component ---
  const colorMap: Record<string, {sel: string, check: string, hover: string}> = {
    indigo: { sel: 'border-indigo-300 bg-indigo-50', check: 'bg-indigo-600 border-indigo-600 text-white', hover: 'hover:border-indigo-200 hover:bg-indigo-50/50' },
    emerald: { sel: 'border-emerald-300 bg-emerald-50', check: 'bg-emerald-600 border-emerald-600 text-white', hover: 'hover:border-emerald-200 hover:bg-emerald-50/50' },
    amber: { sel: 'border-amber-300 bg-amber-50', check: 'bg-amber-600 border-amber-600 text-white', hover: 'hover:border-amber-200 hover:bg-amber-50/50' },
  };

  const QuestionCard = ({ q, color }: { q: SpeakingQuestion; color: string }) => {
    const c = colorMap[color] || colorMap.indigo;
    return (
      <div 
        className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
          isSelected(q.id) ? c.sel : `border-slate-100 ${c.hover}`
        }`}
        onClick={() => toggleQuestion(q)}
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
          isSelected(q.id) ? c.check : 'bg-white border-slate-300'
        }`}>
          {isSelected(q.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 mb-1 flex-wrap">
            {q.topic && <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{q.topic}</span>}
            {q.difficulty && <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded uppercase">{q.difficulty}</span>}
            {q.imageUrl && <span className="text-[8px] font-black bg-violet-50 text-violet-500 px-1.5 py-0.5 rounded">🖼️</span>}
          </div>
          {q.imageUrl && getImageSrc(q.imageUrl) && <img src={getImageSrc(q.imageUrl)} alt="Q" className="w-24 h-16 object-cover rounded-lg border border-slate-200 mb-1" />}
          <p className="text-[13px] font-medium text-slate-700 leading-snug">{q.question}</p>
          {q.sampleAnswer && <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">💡 {q.sampleAnswer}</p>}
        </div>
      </div>
    );
  };

  // Current topics for filter based on active tab
  const currentTopics = activeTab === 'basic' ? basicTopics : activeTab === 'topic' ? topicBankTopics : [];
  const currentQuestions = activeTab === 'basic' ? filteredBasic : activeTab === 'topic' ? filteredTopic : aiGeneratedQs;

  // --- MAIN SELECTION VIEW ---
  return (
    <div className="h-full flex flex-col bg-slate-50 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-50 border rounded-xl hover:bg-slate-100" title="Quay lại">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tạo Đề Thi Nói <span className="text-indigo-600">Pro</span></h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Basic Interview + Topic Challenge + AI Generator</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
            {examQuestions.length} câu đã chọn
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: SOURCES (65%) */}
        <div className="w-[62%] flex flex-col border-r border-slate-200">
          
          {/* Config Row */}
          <div className="bg-white border-b px-4 py-3 flex gap-3 shrink-0">
            <div className="flex-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Tên bài thi</label>
              <input value={config.examName} onChange={e => setConfig({...config, examName: e.target.value})} className="w-full bg-slate-50 border p-1.5 rounded-lg text-xs font-bold" />
            </div>
            <div className="w-28">
              <label className="text-[8px] font-black text-slate-400 uppercase">Lớp / Khối</label>
              <input value={config.className || ''} onChange={e => setConfig({...config, className: e.target.value})} placeholder="VD: 11A1" className="w-full bg-slate-50 border p-1.5 rounded-lg text-xs font-bold" />
            </div>
            <div className="w-20">
              <label className="text-[8px] font-black text-slate-400 uppercase">Thời lượng</label>
              <input type="number" value={config.duration} onChange={e => setConfig({...config, duration: parseInt(e.target.value) || 10})} className="w-full bg-slate-50 border p-1.5 rounded-lg text-xs font-bold text-center" />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="bg-white border-b px-4 py-2 flex gap-1 shrink-0">
            {([
              { key: 'basic' as SourceTab, label: '📋 Basic Interview', count: basicQuestions.length, activeClass: 'bg-indigo-600 text-white shadow-md' },
              { key: 'topic' as SourceTab, label: '🤖 Topic Challenge', count: topicQuestions.length, activeClass: 'bg-emerald-600 text-white shadow-md' },
              { key: 'ai' as SourceTab, label: '⚡ AI Generator', count: aiGeneratedQs.length, activeClass: 'bg-amber-500 text-white shadow-md' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setFilterTopic('all'); }}
                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeTab === tab.key ? tab.activeClass : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Filter Chips (for basic/topic tabs) */}
          {activeTab !== 'ai' && currentTopics.length > 1 && (
            <div className="bg-slate-50 border-b px-4 py-2 flex gap-1.5 flex-wrap shrink-0">
              <button onClick={() => setFilterTopic('all')} className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all ${filterTopic === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-500 hover:bg-slate-100'}`}>
                Tất cả
              </button>
              {currentTopics.map(t => (
                <button key={t} onClick={() => setFilterTopic(t)} className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all ${filterTopic === t ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-500 hover:bg-slate-100'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Question List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {/* AI Generator Controls (only in AI tab) */}
            {activeTab === 'ai' && (
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm mb-4 space-y-3">
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none focus:border-amber-500" 
                    value={selectedGenTopic} 
                    onChange={e => setSelectedGenTopic(e.target.value)}
                    title="Chọn chủ đề"
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    {GENERATOR_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select 
                    className="w-36 bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none focus:border-amber-500" 
                    value={selectedGenLevel} 
                    onChange={e => setSelectedGenLevel(e.target.value)}
                    title="Chọn trình độ CEFR"
                  >
                    {CEFR_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedGenTopic || isGenerating}
                  className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md disabled:opacity-50"
                >
                  {isGenerating ? '⏳ AI Đang tạo...' : '⚡ Tạo câu hỏi mới'}
                </button>
              </div>
            )}

            {/* Questions */}
            {currentQuestions.length === 0 ? (
              <div className="h-40 flex items-center justify-center opacity-40">
                <p className="text-xs font-bold text-slate-400 uppercase">
                  {activeTab === 'ai' ? 'Chọn chủ đề và nhấn Tạo để lấy câu hỏi từ AI.' : 'Không có câu hỏi nào.'}
                </p>
              </div>
            ) : (
              currentQuestions.map(q => (
                <QuestionCard key={q.id} q={q} color={activeTab === 'basic' ? 'indigo' : activeTab === 'topic' ? 'emerald' : 'amber'} />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: SELECTED PREVIEW (38%) */}
        <div className="w-[38%] flex flex-col bg-white">
          <div className="border-b px-4 py-3 flex items-center justify-between shrink-0 bg-indigo-50/50">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
              📄 Đề thi ({examQuestions.length} câu)
            </h3>
            {examQuestions.length > 0 && (
              <button onClick={() => setExamQuestions([])} className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase">Xóa hết</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {examQuestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <svg className="w-12 h-12 text-indigo-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <p className="text-[10px] font-bold uppercase text-indigo-400">Nhấn vào câu hỏi bên trái để thêm</p>
              </div>
            ) : (
              examQuestions.map((q, i) => (
                <div key={q.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative group animate-in fade-in slide-in-from-right-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase">Part {i + 1}</span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20" title="Di chuyển lên">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button onClick={() => moveQuestion(i, 1)} disabled={i === examQuestions.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20" title="Di chuyển xuống">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button onClick={() => toggleQuestion(q)} className="p-1 text-slate-300 hover:text-rose-500" title="Xóa câu hỏi">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 leading-snug">{q.question}</p>
                  {q.sampleAnswer && (
                    <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 italic bg-white p-1.5 rounded border border-slate-100">Đáp án: {q.sampleAnswer}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Action Bar */}
          <div className="p-3 border-t shrink-0 space-y-2">
            <button 
              disabled={examQuestions.length === 0}
              onClick={() => setView('preview')}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all disabled:opacity-40 disabled:shadow-none"
            >
              XEM TRƯỚC & IN ẤN →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingExamCreator;
