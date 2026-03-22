
import React, { useState, useEffect, useCallback } from 'react';
import { ExamConfig, ExamPaper as ExamPaperType, Question, StudyDocument, DocumentFolder } from './types';
import { ExamGeneratorService } from './services/examGeneratorService';
import { LocalFileService } from './services/localFileService';
import { FileStorageService } from './services/fileStorageService';
import { storage, STORAGE_KEYS } from './services/storageAdapter';
import ConfigPanel from './components/ConfigPanel';
import ExamPaper from './components/ExamPaper';
import AnswerSheet from './components/AnswerSheet';
import GameCenter from './components/GameCenter';
import SettingsPanel from './components/SettingsPanel';
import LibraryPanel from './components/LibraryPanel';
import ChatbotPanel from './components/ChatbotPanel';
import DictionaryPanel from './components/DictionaryPanel';
import SpeakingArena from './components/SpeakingArena';
import FloatingAura from './components/FloatingAura';
import MacaronicStory from './components/MacaronicStory';
import IPAMaster from './components/IPA/IPAMaster';
import GearSidebar from './components/GearSidebar';
import WritingMaster from './components/Writing/WritingMaster';
import SetupWizard from './components/Onboarding/SetupWizard';
import WelcomePage from './components/WelcomePage';
import BootScreen from './components/BootScreen';
import { useAuraStore } from './store/useAuraStore';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'create' | 'library' | 'game' | 'chatbot' | 'settings' | 'dictionary' | 'speaking' | 'story' | 'ipa' | 'writing'>('home');
  const [examList, setExamList] = useState<ExamPaperType[]>([]);
  const [studyDocs, setStudyDocs] = useState<StudyDocument[]>([]);
  const [docFolders, setDocFolders] = useState<DocumentFolder[]>([]);
  const [currentExamIndex, setCurrentExamIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [viewMode, setViewMode] = useState<'exam' | 'answer' | 'both'>('exam');
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [isCinematicSpeaking, setIsCinematicSpeaking] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [isSystemBooting, setIsSystemBooting] = useState(true);
  
  const { currentMode, setCurrentMode, isLiveVoice } = useAuraStore();

  // Resizable sidebar for exam creation
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      const newW = Math.min(560, Math.max(300, startWidth + ev.clientX - startX));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  const currentExam = currentExamIndex >= 0 ? examList[currentExamIndex] : null;

  useEffect(() => {
    const initApp = async () => {
      console.info('[App] -> [Action]: Initializing App (Local AI Offline Mode)...');
      
      // Check first run
      const hasInit = localStorage.getItem('aura_initialized');
      setIsFirstRun(!hasInit);

      try {
        const savedExams = await LocalFileService.loadAllExams();
        setExamList(savedExams);
      } catch (err) {
        console.error('[App] -> [ERROR]: Failed to load local data:', err);
      }

      // Load study documents & folders
      try {
        const savedDocs = await storage.get<StudyDocument[]>(STORAGE_KEYS.STUDY_DOCUMENTS, []);
        const savedFolders = await storage.get<DocumentFolder[]>(STORAGE_KEYS.DOCUMENT_FOLDERS, []);
        setStudyDocs(savedDocs);
        setDocFolders(savedFolders);
      } catch (err) {
        console.error('[App] -> [ERROR]: Failed to load study documents:', err);
      }
    };
    initApp();

    // Event Listeners for Aura Radial Menu
    const handleOpenTutor = () => setCurrentMode('tutor');
    const handleOpenSpeaking = () => {
        setCurrentMode('speaking_room');
        setIsCinematicSpeaking(true);
    };

    // Exam Generation status events (rate limit waits, etc.)
    const handleExamGenStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        setToast({ msg: detail.message, type: detail.type === 'warning' ? 'warning' : 'success' });
        setTimeout(() => setToast(null), 10000);
      }
    };

    // Navigation from Aura radial menu
    const handleNavigateTab = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab) setActiveTab(tab);
    };

    window.addEventListener('OPEN_TUTOR_MODAL', handleOpenTutor);
    window.addEventListener('OPEN_SPEAKING_MODE', handleOpenSpeaking);
    window.addEventListener('EXAM_GEN_STATUS', handleExamGenStatus);
    window.addEventListener('NAVIGATE_TAB', handleNavigateTab);

    return () => {
        window.removeEventListener('OPEN_TUTOR_MODAL', handleOpenTutor);
        window.removeEventListener('OPEN_SPEAKING_MODE', handleOpenSpeaking);
        window.removeEventListener('EXAM_GEN_STATUS', handleExamGenStatus);
        window.removeEventListener('NAVIGATE_TAB', handleNavigateTab);
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === 'error' ? 6000 : type === 'warning' ? 10000 : 3000);
  };

  const handleGenerate = async (config: ExamConfig) => {
    setIsGenerating(true);
    try {
      const questions = await ExamGeneratorService.generateQuiz(config);
      const newExam: ExamPaperType = {
        id: `EXAM-${Date.now()}`,
        config,
        questions,
        createdAt: new Date().toISOString(),
        version: config.examCode
      };
      
      // Lưu file riêng biệt xuống ổ cứng
      const result = await LocalFileService.saveExamFile(newExam);
      
      setExamList(prev => [newExam, ...prev]);
      setCurrentExamIndex(0);
      setActiveTab('library');
      
      if (result.success) {
        showToast(`✅ Đã lưu đề thi vào ổ cứng${result.path ? ': ' + result.path : ''}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi không xác định khi sinh đề thi.', 'error');
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
    await LocalFileService.saveExamFile(updatedExam);
  };

  const deleteExam = async (id: string) => {
    if (!window.confirm("Xác nhận xóa đề thi?")) return;
    const newList = examList.filter(e => e.id !== id);
    setExamList(newList);
    await LocalFileService.deleteExamFile(id);
    
    if (currentExam?.id === id) setCurrentExamIndex(-1);
    showToast('🗑️ Đã xóa đề thi khỏi ổ cứng.');
  };

  // ===== STUDY DOCUMENTS HANDLERS =====
  const persistDocs = async (docs: StudyDocument[]) => {
    setStudyDocs(docs);
    await storage.set(STORAGE_KEYS.STUDY_DOCUMENTS, docs);
  };
  const persistFolders = async (flds: DocumentFolder[]) => {
    setDocFolders(flds);
    await storage.set(STORAGE_KEYS.DOCUMENT_FOLDERS, flds);
  };

  const handleAddDocument = async (doc: Omit<StudyDocument, 'id' | 'createdAt' | 'updatedAt'>, file?: File) => {
    const now = new Date().toISOString();
    const docId = `DOC-${Date.now()}`;
    let fileStorageKey: string | undefined;

    // Save file blob to IndexedDB if provided
    if (file) {
      fileStorageKey = `file_${docId}`;
      try {
        await FileStorageService.saveFile(fileStorageKey, file);
      } catch (err) {
        console.error('[App] -> [ERROR]: Failed to save file to IndexedDB:', err);
        showToast('Lỗi khi lưu file. File quá lớn hoặc bộ nhớ đầy.', 'error');
        return;
      }
    }

    const newDoc: StudyDocument = {
      ...doc,
      id: docId,
      fileStorageKey,
      createdAt: now,
      updatedAt: now
    };
    await persistDocs([newDoc, ...studyDocs]);
    showToast('📄 Đã thêm tài liệu mới.');
  };

  const handleUpdateDocument = async (doc: StudyDocument) => {
    await persistDocs(studyDocs.map(d => d.id === doc.id ? doc : d));
    showToast('✅ Đã cập nhật tài liệu.');
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Xác nhận xóa tài liệu này?')) return;
    // Clean up file blob from IndexedDB
    const doc = studyDocs.find(d => d.id === id);
    if (doc?.fileStorageKey) {
      try { await FileStorageService.deleteFile(doc.fileStorageKey); } catch (_) {}
    }
    await persistDocs(studyDocs.filter(d => d.id !== id));
    showToast('🗑️ Đã xóa tài liệu.');
  };

  const handleAddFolder = async (name: string, color: string, icon?: string) => {
    const newFolder: DocumentFolder = { id: `FOLD-${Date.now()}`, name, color, icon, createdAt: new Date().toISOString() };
    await persistFolders([...docFolders, newFolder]);
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    await persistFolders(docFolders.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const handleDeleteFolder = async (id: string) => {
    if (!window.confirm('Xóa thư mục? Tài liệu bên trong sẽ chuyển về Inbox.')) return;
    await persistFolders(docFolders.filter(f => f.id !== id));
    // Move docs inside this folder to inbox
    await persistDocs(studyDocs.map(d => d.folderId === id ? { ...d, folderId: null } : d));
  };

  const handlePrint = (mode: 'exam' | 'answer' | 'both') => {
    setViewMode(mode);
    setShowPrintMenu(false);
    setTimeout(() => window.print(), 500);
  };

  // Skip desktop update checks and window controls as we migrated to web

  if (isFirstRun === null) return null; // Loading state

  if (isFirstRun) {
    return <SetupWizard onComplete={() => {
      localStorage.setItem('aura_initialized', 'true');
      setIsFirstRun(false);
    }} />;
  }

  if (isSystemBooting) {
    return <BootScreen onReady={() => setIsSystemBooting(false)} />;
  }

  return (
    <div className="desktop-window">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-2.5 rounded-xl shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-lg text-center ${
          toast.type === 'error'
            ? 'bg-rose-600 text-white'
            : toast.type === 'warning'
            ? 'bg-amber-500 text-white'
            : 'bg-slate-900 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
      <div className="h-12 bg-white border-b px-4 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
             <span className="text-[10px] text-white font-black italic">A</span>
           </div>
           <span className="text-xs font-black text-slate-800 uppercase tracking-[3px]">Aura Edu Studio</span>
        </div>
      </div>

      <div className="app-body" style={{ height: 'calc(100vh - 48px)' }}>

        <main className="main-workspace flex-1" style={{ marginLeft: '56px' }}>
          {currentMode === 'speaking_room' ? (
             <div className="h-full animate-in zoom-in-95 duration-700">
                <SpeakingArena onExit={() => {
                    setCurrentMode('dashboard');
                    setIsCinematicSpeaking(false);
                }} />
             </div>
          ) : isLiveVoice ? (
             <div className="h-full flex flex-col items-center justify-center bg-slate-50/30">
                <div className="text-center animate-pulse">
                   <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-200">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                   </div>
                   <h2 className="text-xl font-black text-slate-800 uppercase tracking-[8px]">Aura đang lắng nghe...</h2>
                   <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-widest uppercase">Hãy nói điều gì đó với Aura</p>
                </div>
             </div>
          ) : (
            <>
              {activeTab === 'home' && <WelcomePage onNavigate={(tab) => { setActiveTab(tab); setCurrentMode('dashboard'); }} />}
              
              {activeTab === 'create' && (
                <div className="flex h-full animate-content">
                  <aside 
                    className="border-r bg-white overflow-y-auto no-print flex flex-col shrink-0 relative"
                    style={{ width: `${sidebarWidth}px`, minWidth: '300px', maxWidth: '560px' }}
                  >
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                      <ConfigPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
                    </div>
                    {/* Resize Handle */}
                    <div 
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-400/40 active:bg-indigo-500/50 transition-colors group z-20"
                      onMouseDown={startResize}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-8 bg-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </aside>
                  <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                    {isGenerating ? (
                      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                        <div className="h-8 bg-slate-200 rounded-xl w-3/4"></div>
                        <div className="space-y-3">
                          <div className="h-4 bg-slate-200 rounded-lg w-full"></div>
                          <div className="h-4 bg-slate-200 rounded-lg w-5/6"></div>
                          <div className="h-4 bg-slate-200 rounded-lg w-2/3"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-8">
                          <div className="h-28 bg-slate-200 rounded-xl"></div>
                          <div className="h-28 bg-slate-200 rounded-xl"></div>
                          <div className="h-28 bg-slate-200 rounded-xl"></div>
                          <div className="h-28 bg-slate-200 rounded-xl"></div>
                        </div>
                        <div className="flex flex-col items-center pt-8">
                          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Aura is weaving knowledge...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center grayscale opacity-10 text-center">
                        <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        <h2 className="text-xl font-black uppercase tracking-[8px]">Thiết lập đề thi</h2>
                        <p className="text-[10px] font-bold mt-1 tracking-widest text-slate-400">SỬ DỤNG BẢNG CẤU HÌNH BÊN TRÁI</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'library' && !currentExam && (
                <LibraryPanel
                  exams={examList}
                  onSelect={(id) => setCurrentExamIndex(examList.findIndex(e => e.id === id))}
                  onDelete={deleteExam}
                  documents={studyDocs}
                  folders={docFolders}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onAddFolder={handleAddFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                />
              )}
              {activeTab === 'story' && <MacaronicStory />}
              {activeTab === 'speaking' && <div className="h-full animate-content"><SpeakingArena /></div>}
              {activeTab === 'ipa' && <IPAMaster />}
              {activeTab === 'writing' && <div className="h-full animate-content"><WritingMaster /></div>}
              {activeTab === 'dictionary' && <div className="h-full p-4 animate-content max-w-5xl mx-auto"><DictionaryPanel /></div>}
              {activeTab === 'game' && <div className="h-full animate-content"><GameCenter initialQuestions={currentExam?.questions || []} initialExamTitle={currentExam?.config.title || ""} examList={examList} /></div>}
              {activeTab === 'settings' && <div className="h-full animate-content"><SettingsPanel /></div>}
            </>
          )}

          {isGenerating && (
            <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-sm font-black text-slate-600 uppercase tracking-[6px] animate-pulse">AI đang phân tích kiến thức...</p>
            </div>
          )}

          {currentExam && (activeTab === 'library' || activeTab === 'create') && (
            <div className="flex-1 flex flex-col h-full overflow-hidden animate-content">
              <div className="h-12 bg-white border-b px-6 flex justify-between items-center no-print shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentExamIndex(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg></button>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setViewMode('exam')} className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewMode === 'exam' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>ĐỀ THI</button>
                    <button onClick={() => setViewMode('answer')} className={`px-5 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewMode === 'answer' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>ĐÁP ÁN</button>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowPrintMenu(!showPrintMenu)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-[10px] tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100/50"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>XUẤT BẢN PDF</button>
                  {showPrintMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                      <button onClick={() => handlePrint('exam')} className="w-full px-5 py-3 text-left text-[11px] font-bold hover:bg-indigo-50 transition-colors">In đề thi chuẩn</button>
                      <button onClick={() => handlePrint('answer')} className="w-full px-5 py-3 text-left text-[11px] font-bold hover:bg-indigo-50 transition-colors">In đáp án chi tiết</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100/20 p-4"><div className="a4-wrapper mx-auto drop-shadow-sm">{viewMode === 'exam' ? <ExamPaper data={currentExam} onUpdateQuestion={handleUpdateQuestion} /> : <AnswerSheet data={currentExam} />}</div></div>
            </div>
          )}
        </main>
      </div>
      <FloatingAura 
        isCinematic={isCinematicSpeaking} 
        onExitCinematic={() => setIsCinematicSpeaking(false)} 
      />
      <GearSidebar activeTab={activeTab as any} onTabChange={(tab: any) => { 
          console.info('[App] -> [Routing]: Switching to tab:', tab);
          setActiveTab(tab); 
          setCurrentMode('dashboard');
          if (tab === 'library') setCurrentExamIndex(-1); 
      }} />
    </div>
  );
};

export default App;
