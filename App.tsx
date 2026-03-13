
import React, { useState, useEffect } from 'react';
import { ExamConfig, ExamPaper as ExamPaperType, Question } from './types';
import { generateExamContent } from './services/geminiService';
import { checkAppUpdate } from './services/updateService';
import { storage, STORAGE_KEYS } from './services/storageAdapter'; // Sử dụng adapter mới
import ConfigPanel from './components/ConfigPanel';
import ExamPaper from './components/ExamPaper';
import AnswerSheet from './components/AnswerSheet';
import GameCenter from './components/GameCenter';
import SettingsPanel from './components/SettingsPanel';
import LibraryPanel from './components/LibraryPanel';
import ChatbotPanel from './components/ChatbotPanel';
import DictionaryPanel from './components/DictionaryPanel';
import VocabBankPanel from './components/VocabBankPanel';
import SpeakingArena from './components/SpeakingArena';
import FloatingAura from './components/FloatingAura';
import MacaronicStory from './components/MacaronicStory';
import IPAClinic from './components/IPAClinic';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'game' | 'chatbot' | 'settings' | 'dictionary' | 'vocab' | 'speaking' | 'story' | 'ipa'>('create');
  const [examList, setExamList] = useState<ExamPaperType[]>([]);
  const [currentExamIndex, setCurrentExamIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'exam' | 'answer' | 'both'>('exam');
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [newUpdateAvailable, setNewUpdateAvailable] = useState(false);

  const currentExam = currentExamIndex >= 0 ? examList[currentExamIndex] : null;

  const handleWindowControl = (action: 'window-minimize' | 'window-maximize' | 'window-close') => {
    try {
      // @ts-ignore
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send(action);
    } catch (e) {
      console.warn("Desktop feature only.");
    }
  };

  useEffect(() => {
    // LOAD DỮ LIỆU TỪ Ổ CỨNG (ASYNC)
    const loadData = async () => {
      const savedExams = await storage.get<ExamPaperType[]>(STORAGE_KEYS.EXAMS, []);
      setExamList(savedExams);
    };
    loadData();

    const checkUpdates = async () => {
      try {
        const update = await checkAppUpdate();
        if (update.hasUpdate) setNewUpdateAvailable(true);
      } catch (err) {}
    };
    checkUpdates();
  }, []);

  const handleGenerate = async (config: ExamConfig) => {
    setIsGenerating(true);
    try {
      const questions = await generateExamContent(config);
      const newExam: ExamPaperType = {
        id: `EXAM-${Date.now()}`,
        config,
        questions,
        createdAt: new Date().toISOString(),
        version: config.examCode
      };
      const newList = [newExam, ...examList];
      setExamList(newList);
      
      // LƯU XUỐNG Ổ CỨNG
      await storage.set(STORAGE_KEYS.EXAMS, newList);
      
      setCurrentExamIndex(0);
      setActiveTab('library');
    } catch (err: any) {
      alert(err.message || 'Lỗi không xác định.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateQuestion = async (index: number, updated: Question) => {
    if (currentExamIndex < 0) return;
    const updatedExamList = [...examList];
    const updatedExam = { ...updatedExamList[currentExamIndex] };
    const updatedQuestions = [...updatedExam.questions];
    updatedQuestions[index] = updated;
    updatedExam.questions = updatedQuestions;
    updatedExamList[currentExamIndex] = updatedExam;
    
    setExamList(updatedExamList);
    // LƯU XUỐNG Ổ CỨNG
    await storage.set(STORAGE_KEYS.EXAMS, updatedExamList);
  };

  const deleteExam = async (id: string) => {
    if (!window.confirm("Xác nhận xóa đề thi?")) return;
    const newList = examList.filter(e => e.id !== id);
    setExamList(newList);
    // LƯU XUỐNG Ổ CỨNG
    await storage.set(STORAGE_KEYS.EXAMS, newList);
    
    if (currentExam?.id === id) setCurrentExamIndex(-1);
  };

  const handlePrint = (mode: 'exam' | 'answer' | 'both') => {
    setViewMode(mode);
    setShowPrintMenu(false);
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="desktop-window">
      <div className="title-bar no-print" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-3">
           <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
             <span className="text-[10px] text-white font-black">E</span>
           </div>
           <span className="text-[10px] font-black text-slate-700 uppercase tracking-[2px]">EduGen Studio Pro</span>
        </div>
        <div className="flex-1"></div>
        <div className="window-controls" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div onClick={() => handleWindowControl('window-minimize')} className="control-btn"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" /></svg></div>
          <div onClick={() => handleWindowControl('window-maximize')} className="control-btn"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg></div>
          <div onClick={() => handleWindowControl('window-close')} className="control-btn close-btn"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></div>
        </div>
      </div>

      <div className="app-body">
        <nav className="nav-rail no-print">
          <RailItem icon="plus" active={activeTab === 'create'} onClick={() => setActiveTab('create')} label="Soạn đề" />
          <RailItem icon="library" active={activeTab === 'library'} onClick={() => { setActiveTab('library'); setCurrentExamIndex(-1); }} label="Thư viện" />
          <RailItem icon="vocab" active={activeTab === 'vocab'} onClick={() => setActiveTab('vocab')} label="Từ vựng" />
          <RailItem icon="story" active={activeTab === 'story'} onClick={() => setActiveTab('story')} label="Truyện Chêm" />
          <RailItem icon="dictionary" active={activeTab === 'dictionary'} onClick={() => setActiveTab('dictionary')} label="Từ điển" />
          <RailItem icon="speaking" active={activeTab === 'speaking'} onClick={() => setActiveTab('speaking')} label="Speaking" />
          <RailItem icon="ipa" active={activeTab === 'ipa'} onClick={() => setActiveTab('ipa')} label="IPA Clinic" />
          <RailItem icon="chatbot" active={activeTab === 'chatbot'} onClick={() => setActiveTab('chatbot')} label="Gia sư AI" />
          <RailItem icon="game" active={activeTab === 'game'} onClick={() => setActiveTab('game')} label="Arena" />
          
          <div className="mt-auto pt-4 flex flex-col items-center gap-4">
            <div className="relative">
              <RailItem icon="settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Cài đặt" />
              {newUpdateAvailable && <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-bounce"></div>}
            </div>
          </div>
        </nav>

        <main className="main-workspace">
          {activeTab === 'create' && (
            <div className="flex h-full animate-content">
              <aside className="w-[320px] border-r bg-white p-4 overflow-y-auto no-print flex flex-col">
                <ConfigPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
              </aside>
              <div className="flex-1 flex flex-col items-center justify-center grayscale opacity-10 p-10 text-center">
                <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <h2 className="text-2xl font-black uppercase tracking-[12px]">Thiết lập đề thi</h2>
                <p className="text-xs font-bold mt-2 tracking-widest">SỬ DỤNG BẢNG CẤU HÌNH BÊN TRÁI</p>
              </div>
            </div>
          )}

          {activeTab === 'library' && !currentExam && <LibraryPanel exams={examList} onSelect={(id) => setCurrentExamIndex(examList.findIndex(e => e.id === id))} onDelete={deleteExam} />}
          {activeTab === 'vocab' && <VocabBankPanel />}
          {activeTab === 'story' && <MacaronicStory />}
          {activeTab === 'speaking' && <div className="h-full animate-content"><SpeakingArena /></div>}
          {activeTab === 'ipa' && <IPAClinic />}
          {activeTab === 'dictionary' && <div className="h-full p-6 animate-content"><DictionaryPanel /></div>}
          {activeTab === 'chatbot' && <div className="h-full animate-content"><ChatbotPanel /></div>}
          {activeTab === 'game' && <div className="h-full animate-content"><GameCenter initialQuestions={currentExam?.questions || []} initialExamTitle={currentExam?.config.title || ""} examList={examList} /></div>}
          {activeTab === 'settings' && <div className="h-full animate-content"><SettingsPanel /></div>}

          {isGenerating && (
            <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-sm font-black text-slate-600 uppercase tracking-[6px] animate-pulse">AI đang phân tích kiến thức...</p>
            </div>
          )}

          {currentExam && (activeTab === 'library' || activeTab === 'create') && (
            <div className="flex-1 flex flex-col h-full overflow-hidden animate-content">
              <div className="h-14 bg-white border-b px-8 flex justify-between items-center no-print shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentExamIndex(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg></button>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('exam')} className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewMode === 'exam' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>ĐỀ THI</button>
                    <button onClick={() => setViewMode('answer')} className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewMode === 'answer' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>ĐÁP ÁN</button>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowPrintMenu(!showPrintMenu)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>XUẤT BẢN PDF</button>
                  {showPrintMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                      <button onClick={() => handlePrint('exam')} className="w-full px-5 py-3 text-left text-[11px] font-bold hover:bg-indigo-50 transition-colors">In đề thi chuẩn</button>
                      <button onClick={() => handlePrint('answer')} className="w-full px-5 py-3 text-left text-[11px] font-bold hover:bg-indigo-50 transition-colors">In đáp án chi tiết</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100/30 p-8"><div className="a4-wrapper">{viewMode === 'exam' ? <ExamPaper data={currentExam} onUpdateQuestion={handleUpdateQuestion} /> : <AnswerSheet data={currentExam} />}</div></div>
            </div>
          )}
        </main>
      </div>
      <FloatingAura />
    </div>
  );
};

const RailItem: React.FC<{ icon: string; active: boolean; onClick: () => void; label: string }> = ({ icon, active, onClick, label }) => {
  const getIcon = () => {
    switch (icon) {
      case 'plus': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>;
      case 'library': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
      case 'vocab': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'speaking': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
      case 'chatbot': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h.01M15 9h.01M8 12h8" /></svg>;
      case 'dictionary': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>;
      case 'game': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'story': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'ipa': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
      case 'settings': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      default: return null;
    }
  };
  return (
    <div className="flex flex-col items-center">
      <div onClick={onClick} className={`rail-item ${active ? 'active' : ''}`}>{getIcon()}</div>
      <span className={`text-[8px] font-black uppercase mt-1 tracking-wider ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
};

export default App;
