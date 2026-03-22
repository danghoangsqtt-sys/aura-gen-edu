import React, { useState, useEffect } from 'react';
import { OllamaService } from '../services/ollamaService';
import { generateMacaronicStory as geminiMacaronicStory } from '../services/geminiService';
import { AIConfigService } from '../services/aiConfigService';
import { canvasStorage } from '../services/localDataService';
import { PersonalVocabData } from '../types';

interface VocabItem {
  word: string;
  meaning: string;
  pos?: string;
  ipa?: string;
  example?: string;
  synonyms?: string[];
}

const MacaronicStory: React.FC = () => {
  const [words, setWords] = useState('');
  const [topic, setTopic] = useState('');
  const [viewTab, setViewTab] = useState<'vi' | 'en'>('vi');
  const [resultVi, setResultVi] = useState<{story: string, vocabulary: VocabItem[]} | null>(null);
  const [resultEn, setResultEn] = useState<{story: string, vocabulary: VocabItem[]} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<VocabItem | null>(null);

  // Vocab Folder integration
  const [vocabData, setVocabData] = useState<PersonalVocabData>({ inbox: [], folders: [] });
  const [selectedFolderId, setSelectedFolderId] = useState<string>('__inbox__');

  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const data = await canvasStorage.get();
        setVocabData(data);
      } catch (e) {
        console.warn('Could not load vocab data:', e);
      }
    };
    loadFolders();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load words from selected folder
  const loadFromFolder = () => {
    let sourceWords: string[] = [];

    if (selectedFolderId === '__inbox__') {
      sourceWords = vocabData.inbox.map(w => w.word);
    } else if (selectedFolderId === '__all__') {
      sourceWords = [
        ...vocabData.inbox.map(w => w.word),
        ...(vocabData.folders || []).flatMap(f => f.words.map(w => w.word))
      ];
    } else {
      const folder = (vocabData.folders || []).find(f => f.id === selectedFolderId);
      if (folder) {
        sourceWords = folder.words.map(w => w.word);
      }
    }

    const unique = Array.from(new Set(sourceWords)).filter(w => w && w.trim());
    if (unique.length === 0) {
      showToast("Thư mục này chưa có từ vựng!");
      return;
    }

    setWords(unique.join(', '));
    const folderName = selectedFolderId === '__inbox__' ? 'Hộp thư' :
      selectedFolderId === '__all__' ? 'Tất cả' :
      (vocabData.folders || []).find(f => f.id === selectedFolderId)?.name || '';
    showToast(`Đã nạp ${unique.length} từ từ "${folderName}"`);
  };

  // Random pick from selected folder
  const randomPick = () => {
    let sourceWords: string[] = [];

    if (selectedFolderId === '__inbox__') {
      sourceWords = vocabData.inbox.map(w => w.word);
    } else if (selectedFolderId === '__all__') {
      sourceWords = [
        ...vocabData.inbox.map(w => w.word),
        ...(vocabData.folders || []).flatMap(f => f.words.map(w => w.word))
      ];
    } else {
      const folder = (vocabData.folders || []).find(f => f.id === selectedFolderId);
      if (folder) sourceWords = folder.words.map(w => w.word);
    }

    const unique = Array.from(new Set(sourceWords)).filter(w => w && w.trim());
    if (unique.length === 0) {
      showToast("Ngân hàng từ vựng đang trống!");
      return;
    }

    const shuffled = unique.sort(() => 0.5 - Math.random());
    const count = Math.min(unique.length, Math.floor(Math.random() * 3) + 5);
    const selected = shuffled.slice(0, count);
    setWords(selected.join(', '));
    showToast(`Đã chọn ngẫu nhiên ${selected.length} từ!`);
  };

  const handleGenerate = async () => {
    if (!words.trim()) { setError('Vui lòng nhập danh sách từ vựng.'); return; }
    if (!topic.trim()) { setError('Vui lòng nhập chủ đề cho câu chuyện.'); return; }
    setError('');
    setResultVi(null);
    setResultEn(null);
    setIsGenerating(true);
    try {
      const provider = AIConfigService.getFreshConfig().provider;
      const callApi = (lang: 'vi' | 'en') => {
        if (provider === 'gemini') {
          return geminiMacaronicStory(words.trim(), topic.trim(), lang);
        } else {
          return OllamaService.generateMacaronicStory(words.trim(), topic.trim(), lang);
        }
      };

      console.log(`[MacaronicStory] Generating BOTH Vi-En & En-Vi using ${provider}`);
      const [viResult, enResult] = await Promise.allSettled([callApi('vi'), callApi('en')]);

      if (viResult.status === 'fulfilled') setResultVi(viResult.value as any);
      if (enResult.status === 'fulfilled') setResultEn(enResult.value as any);

      if (viResult.status === 'rejected' && enResult.status === 'rejected') {
        throw new Error((viResult.reason as any)?.message || 'Đã xảy ra lỗi khi tạo truyện.');
      }
      if (viResult.status === 'rejected') {
        setViewTab('en');
        showToast('Phiên bản Vi-En gặp lỗi, hiển thị phiên bản En-Vi.');
      } else if (enResult.status === 'rejected') {
        setViewTab('vi');
        showToast('Phiên bản En-Vi gặp lỗi, hiển thị phiên bản Vi-En.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo truyện.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeResult = viewTab === 'vi' ? resultVi : resultEn;

  const folderOptions = [
    { id: '__inbox__', name: '📥 Hộp thư (Inbox)', count: vocabData.inbox.length },
    { id: '__all__', name: '📚 Tất cả từ vựng', count: vocabData.inbox.length + (vocabData.folders || []).reduce((s, f) => s + f.words.length, 0) },
    ...(vocabData.folders || []).map(f => ({ id: f.id, name: `📂 ${f.name}`, count: f.words.length }))
  ];

  return (
    <div className="h-full flex flex-col animate-content bg-slate-50/50 relative z-[50]">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-8 py-6 shrink-0 sticky top-0 z-[60]">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-200/50 rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Truyện Chêm Thông Minh</h2>
              <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5 uppercase tracking-widest">
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Language Immersion v2.5
              </p>
            </div>
          </div>
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
            <button onClick={() => setViewTab('vi')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewTab === 'vi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              🇻🇳 Vi-En
            </button>
            <button onClick={() => setViewTab('en')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewTab === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              🇺🇸 En-Vi
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative z-30">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Input Panel */}
          <div className="bg-white/95 backdrop-blur-md rounded-[2rem] border border-slate-200/80 p-8 shadow-2xl shadow-slate-200/40 relative overflow-hidden group mb-10">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-50"></div>
             
             {/* Vocab Folder Selector */}
             <div className="relative z-10 mb-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
               <label className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
                 <span className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">📦</span>
                 Chọn Hộp từ vựng
               </label>
               <div className="flex items-center gap-2 flex-wrap">
                 <select value={selectedFolderId} onChange={e => setSelectedFolderId(e.target.value)}
                   title="Chọn hộp từ vựng"
                   className="flex-1 min-w-[180px] border-2 border-indigo-200 rounded-xl px-4 py-2.5 text-[12px] font-bold text-slate-700 bg-white outline-none focus:border-indigo-500 transition-all cursor-pointer">
                   {folderOptions.map(opt => (
                     <option key={opt.id} value={opt.id}>{opt.name} ({opt.count} từ)</option>
                   ))}
                 </select>
                 <button onClick={loadFromFolder}
                   className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 flex items-center gap-1.5">
                   📥 Nạp từ vựng
                 </button>
                 <button onClick={randomPick}
                   className="px-4 py-2.5 bg-white border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5">
                   🎲 Ngẫu nhiên
                 </button>
               </div>
               <p className="text-[9px] text-indigo-400 italic mt-2 px-1">Chọn thư mục từ vựng → Nạp toàn bộ hoặc chọn ngẫu nhiên 5-7 từ.</p>
             </div>

             <div className="relative z-10 grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[11px] font-black text-indigo-600 uppercase tracking-widest pl-1">
                    <span className="w-5 h-5 bg-indigo-50 rounded-lg flex items-center justify-center">🔤</span>
                    Từ vựng Tiếng Anh
                  </label>
                  <textarea value={words} onChange={(e) => setWords(e.target.value)}
                    placeholder="resilient, mitigate, ubiquitous..."
                    className="w-full border-2 border-slate-100/80 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all resize-none bg-slate-50/50 hover:bg-white"
                    rows={3} />
                  <p className="text-[10px] text-slate-400 italic px-1">Nhập thủ công hoặc dùng nút "Nạp từ vựng" ở trên.</p>
               </div>

               <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[11px] font-black text-pink-600 uppercase tracking-widest pl-1">
                     <span className="w-5 h-5 bg-pink-50 rounded-lg flex items-center justify-center">🎯</span>
                     Chủ đề câu chuyện
                  </label>
                  <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ví dụ: Du hành vũ trụ, Buổi phỏng vấn..."
                    className="w-full border-2 border-slate-100/80 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all bg-slate-50/50 hover:bg-white" />
                  <p className="text-[10px] text-slate-400 italic px-1">Gợi ý chủ đề để AI sáng tác sát ý hơn.</p>
               </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="flex-1 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-black/20 group/btn">
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang dệt nên câu chuyện...</span>
                    </>
                  ) : (
                    <>
                      <span className="group-hover/btn:scale-125 transition-transform duration-300">✨</span>
                      <span>Sáng tác ngay</span>
                    </>
                  )}
                </button>
             </div>

            {error && (
              <div className="mt-6 bg-rose-50 border-l-4 border-rose-500 rounded-xl px-6 py-4 flex items-center gap-4 text-rose-700 animate-shake">
                <span className="text-xl">🛑</span>
                <span className="text-[12px] font-bold">{error}</span>
              </div>
            )}
          </div>

          {/* Result */}
          {(activeResult || isGenerating) && (
            <div className="space-y-8 animate-slide-up pb-20">
              <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-slate-200/80 shadow-2xl overflow-hidden transition-all duration-500 border-b-8 border-indigo-600">
                <div className="bg-slate-900 px-8 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                      Macaronic Reader — {viewTab === 'vi' ? '🇻🇳 Vi-En' : '🇺🇸 En-Vi'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Tab switch inside reader */}
                    <div className="flex bg-white/10 rounded-lg p-0.5">
                      <button onClick={() => setViewTab('vi')} disabled={!resultVi}
                        className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${viewTab === 'vi' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'} ${!resultVi ? 'opacity-30 cursor-not-allowed' : ''}`}>
                        Vi-En
                      </button>
                      <button onClick={() => setViewTab('en')} disabled={!resultEn}
                        className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${viewTab === 'en' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'} ${!resultEn ? 'opacity-30 cursor-not-allowed' : ''}`}>
                        En-Vi
                      </button>
                    </div>
                    {activeResult && !isGenerating && (
                      <button onClick={() => { navigator.clipboard.writeText(activeResult.story); showToast('Đã sao chép!'); }}
                        className="text-slate-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        📎 COPY
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar-thin bg-white/50">
                  {isGenerating ? (
                    <div className="space-y-6">
                      <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse delay-75"></div>
                      <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse delay-150"></div>
                      <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse delay-200"></div>
                    </div>
                  ) : activeResult ? (
                    <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-[1.8] font-medium story-content"
                      dangerouslySetInnerHTML={{ __html: activeResult.story }} />
                  ) : (
                    <p className="text-center text-slate-400 italic text-sm py-8">Phiên bản này chưa sẵn sàng.</p>
                  )}
                </div>
              </div>

              {activeResult && !isGenerating && activeResult.vocabulary && (
                <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-slate-200/80 p-8 shadow-xl relative">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">词</span>
                    <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Danh mục từ vựng đã chêm</h3>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">Nhấn vào từ để xem chi tiết</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeResult.vocabulary.map((v: VocabItem, i: number) => (
                      <button key={i} onClick={() => setSelectedVocab(v)}
                        className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md transition-all group text-left cursor-pointer">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-indigo-600 font-black text-sm group-hover:scale-105 transition-transform origin-left">{v.word}</span>
                          {v.pos && <span className="text-[7px] font-black text-white bg-indigo-500 px-1.5 py-0.5 rounded uppercase shrink-0">{v.pos}</span>}
                        </div>
                        {v.ipa && <p className="text-[10px] font-serif italic text-indigo-400 mb-1">{v.ipa}</p>}
                        <p className="text-slate-500 text-[11px] font-medium">{v.meaning}</p>
                      </button>
                    ))}
                  </div>

                  {/* Mini Dictionary Popup */}
                  {selectedVocab && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSelectedVocab(null)}>
                      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-[420px] max-w-[90vw] max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-t-3xl flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-black text-lg">{selectedVocab.word}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {selectedVocab.pos && <span className="text-[8px] font-black text-indigo-200 bg-white/20 px-2 py-0.5 rounded-full uppercase">{selectedVocab.pos}</span>}
                              {selectedVocab.ipa && <span className="text-[11px] font-serif italic text-indigo-200">{selectedVocab.ipa}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { if (window.speechSynthesis) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(selectedVocab.word); u.lang = 'en-US'; u.rate = 0.9; window.speechSynthesis.speak(u); } }}
                              title="Nghe phát âm" className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
                              🔊
                            </button>
                            <button onClick={() => setSelectedVocab(null)} title="Đóng"
                              className="w-8 h-8 bg-white/20 hover:bg-rose-500 rounded-full flex items-center justify-center text-white transition-all font-bold text-sm">✕</button>
                          </div>
                        </div>
                        {/* Body */}
                        <div className="p-5 space-y-4">
                          {/* Meaning */}
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nghĩa tiếng Việt</label>
                            <p className="text-slate-800 font-bold text-sm mt-1">{selectedVocab.meaning}</p>
                          </div>
                          {/* Example */}
                          {selectedVocab.example && (
                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ví dụ</label>
                              <p className="text-slate-600 text-[12px] italic mt-1 bg-slate-50 rounded-xl p-3 border-l-4 border-indigo-300">"{selectedVocab.example}"</p>
                            </div>
                          )}
                          {/* Synonyms */}
                          {selectedVocab.synonyms && selectedVocab.synonyms.length > 0 && (
                            <div>
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Từ đồng nghĩa</label>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {selectedVocab.synonyms.map((s, si) => (
                                  <span key={si} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100">
                          <button onClick={() => setSelectedVocab(null)}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Đóng từ điển</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
            <span className="text-[11px] font-black uppercase tracking-widest">{toast}</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .story-content b {
          color: #4f46e5;
          background: #eef2ff;
          padding: 0 4px;
          border-radius: 6px;
          font-weight: 800;
          font-style: italic;
          border-bottom: 2px solid #c7d2fe;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out 0s 2; }
        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default MacaronicStory;
