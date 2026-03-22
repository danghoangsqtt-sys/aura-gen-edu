
import React, { useState, useEffect, useCallback } from 'react';
import { SavedWord, PersonalVocabData, VocabFolder } from '../../types';
import { canvasStorage } from '../../services/localDataService';
import { OllamaService } from '../../services/ollamaService';
import { Volume2, Trash2, FolderPlus, Folder, FolderOpen, Search, Inbox, BookOpen, X, Check, Edit3 } from 'lucide-react';

const VocabBankCanvas: React.FC = () => {
  const [data, setData] = useState<PersonalVocabData>({ inbox: [], folders: [] });
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Inline input states (replaces prompt/confirm which aren't supported in Electron)
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // Load data
  useEffect(() => {
    const load = async () => {
      const savedData = await canvasStorage.get();
      setData(savedData);
      setLoading(false);
    };
    load();
  }, []);

  // Persist
  const persist = useCallback(async (newData: PersonalVocabData) => {
    setData(newData);
    await canvasStorage.save(newData);
  }, []);

  // Folder management — no prompt(), uses inline inputs
  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: VocabFolder = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      words: [],
      color: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)],
    };
    persist({ ...data, folders: [...(data.folders || []), folder] });
    setNewFolderName('');
    setShowNewFolder(false);
    showToast(`Đã tạo thư mục "${folder.name}"`);
  };

  const confirmRename = (id: string) => {
    if (!renameValue.trim()) return;
    const updated = (data.folders || []).map(f => f.id === id ? { ...f, name: renameValue.trim() } : f);
    persist({ ...data, folders: updated });
    setRenamingFolderId(null);
    setRenameValue('');
  };

  const confirmDeleteFolder = (id: string) => {
    const folder = (data.folders || []).find(f => f.id === id);
    const wordsToInbox = folder?.words || [];
    const newFolders = (data.folders || []).filter(f => f.id !== id);
    persist({ ...data, folders: newFolders, inbox: [...wordsToInbox, ...data.inbox] });
    if (activeFolder === id) setActiveFolder(null);
    setDeletingFolderId(null);
    showToast(`Đã xóa thư mục, từ vựng chuyển về Inbox`);
  };

  const deleteWord = (wordId: string) => {
    if (activeFolder) {
      const updated = (data.folders || []).map(f => {
        if (f.id === activeFolder) return { ...f, words: f.words.filter(w => w.id !== wordId) };
        return f;
      });
      persist({ ...data, folders: updated });
    } else {
      persist({ ...data, inbox: data.inbox.filter(w => w.id !== wordId) });
    }
  };

  const moveWordToFolder = (wordId: string, targetFolderId: string | null) => {
    let word: SavedWord | undefined;
    let newInbox = [...data.inbox];
    let newFolders = (data.folders || []).map(f => ({ ...f, words: [...f.words] }));

    const inboxIdx = newInbox.findIndex(w => w.id === wordId);
    if (inboxIdx >= 0) {
      word = newInbox[inboxIdx];
      newInbox.splice(inboxIdx, 1);
    } else {
      for (const f of newFolders) {
        const idx = f.words.findIndex(w => w.id === wordId);
        if (idx >= 0) {
          word = f.words[idx];
          f.words.splice(idx, 1);
          break;
        }
      }
    }
    if (!word) return;

    if (targetFolderId === null) {
      newInbox = [word, ...newInbox];
    } else {
      newFolders = newFolders.map(f => {
        if (f.id === targetFolderId) return { ...f, words: [word!, ...f.words] };
        return f;
      });
    }
    persist({ ...data, inbox: newInbox, folders: newFolders });
    const targetName = targetFolderId ? newFolders.find(f => f.id === targetFolderId)?.name || '' : 'Inbox';
    showToast(`Đã di chuyển đến ${targetName}`);
  };

  // AI Scanner
  const handleScan = async () => {
    if (!scannedText.trim()) return;
    setIsScanning(true);
    try {
      const extracted = await OllamaService.extractVocabulary(scannedText);
      const newWords: SavedWord[] = extracted.map((item: any) => ({
        id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        word: item.word,
        meaning: item.meaning,
        ipa: item.ipa,
        partOfSpeech: item.pos,
        pronunciation: item.ipa
      }));
      persist({ ...data, inbox: [...newWords, ...data.inbox] });
      setScannedText('');
      showToast(`Đã trích xuất ${newWords.length} từ vựng`);
    } catch (e: any) {
      showToast(e.message || "Lỗi AI");
    } finally {
      setIsScanning(false);
    }
  };

  // Get active words
  const activeWords: SavedWord[] = activeFolder
    ? ((data.folders || []).find(f => f.id === activeFolder)?.words || [])
    : data.inbox;

  const filteredWords = searchQuery
    ? activeWords.filter(w => w.word.toLowerCase().includes(searchQuery.toLowerCase()) || w.meaning.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeWords;

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeFolderObj = (data.folders || []).find(f => f.id === activeFolder);
  const totalWords = data.inbox.length + (data.folders || []).reduce((sum, f) => sum + f.words.length, 0);

  return (
    <div className="flex h-full bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-lg relative">
      
      {/* Left: Word List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {activeFolder ? (
                <>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: activeFolderObj?.color || '#6366f1' }}>
                    <FolderOpen className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">{activeFolderObj?.name}</h3>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Inbox className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">Hộp thư (Inbox)</h3>
                </>
              )}
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{activeWords.length} từ</span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm từ vựng..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-400 transition-all" />
          </div>
        </div>

        {/* AI Scanner (collapsible) */}
        <details className="border-b border-slate-100">
          <summary className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-50 select-none flex items-center gap-2">
            ✨ Quét văn bản AI
          </summary>
          <div className="px-4 pb-3">
            <textarea value={scannedText} onChange={e => setScannedText(e.target.value)}
              placeholder="Dán văn bản tiếng Anh vào đây..."
              className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 outline-none focus:border-indigo-400 resize-none mb-2" />
            <button onClick={handleScan} disabled={isScanning || !scannedText.trim()}
              className={`w-full py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isScanning ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
              {isScanning ? "Đang xử lý..." : "Trích xuất từ vựng"}
            </button>
          </div>
        </details>

        {/* Word List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredWords.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-[11px] font-bold text-slate-300">
                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có từ vựng nào'}
              </p>
            </div>
          ) : (
            filteredWords.map(w => (
              <div key={w.id} className="group bg-white border border-slate-100 rounded-xl p-3 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-slate-800">{w.word}</span>
                      {w.partOfSpeech && (
                        <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{w.partOfSpeech}</span>
                      )}
                      <button onClick={() => speak(w.word)} className="opacity-0 group-hover:opacity-100 w-5 h-5 bg-slate-100 hover:bg-indigo-600 text-slate-400 hover:text-white rounded flex items-center justify-center transition-all" title="Nghe phát âm">
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] font-serif italic text-indigo-400 mb-0.5">{w.ipa}</p>
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{w.meaning}</p>
                    {w.example && (
                      <p className="text-[10px] text-slate-400 italic mt-1 border-l-2 border-slate-100 pl-2">"{w.example}"</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <select className="text-[8px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none cursor-pointer hover:border-indigo-300" value=""
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__inbox__') moveWordToFolder(w.id, null);
                        else if (val) moveWordToFolder(w.id, val);
                      }} title="Di chuyển đến thư mục">
                      <option value="">📁 Di chuyển</option>
                      {activeFolder !== null && <option value="__inbox__">📥 Hộp thư</option>}
                      {(data.folders || []).filter(f => f.id !== activeFolder).map(f => (
                        <option key={f.id} value={f.id}>📂 {f.name}</option>
                      ))}
                    </select>
                    <button onClick={() => deleteWord(w.id)} className="w-full text-[8px] font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded px-1 py-0.5 transition-all flex items-center justify-center gap-0.5" title="Xóa">
                      <Trash2 className="w-2.5 h-2.5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Folder Tree */}
      <div className="w-[200px] border-l border-slate-100 bg-slate-50/30 flex flex-col">
        <div className="p-3 border-b border-slate-100">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">📂 Thư mục</h4>
          
          {showNewFolder ? (
            <div className="flex items-center gap-1">
              <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                placeholder="Tên thư mục..."
                autoFocus
                className="flex-1 px-2 py-1.5 border border-indigo-300 rounded-lg text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100" />
              <button onClick={createFolder} className="w-6 h-6 bg-indigo-600 text-white rounded-md flex items-center justify-center hover:bg-indigo-700 transition-all" title="Tạo">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="w-6 h-6 bg-slate-200 text-slate-500 rounded-md flex items-center justify-center hover:bg-slate-300 transition-all" title="Hủy">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowNewFolder(true)}
              className="w-full py-2 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5">
              <FolderPlus className="w-3 h-3" /> Tạo thư mục
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {/* Inbox */}
          <button onClick={() => { setActiveFolder(null); setSearchQuery(''); }}
            className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-all text-left ${
              !activeFolder ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-white text-slate-600'
            }`}>
            <Inbox className="w-3.5 h-3.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black block truncate">Hộp thư</span>
              <span className={`text-[8px] font-bold ${!activeFolder ? 'text-indigo-200' : 'text-slate-400'}`}>{data.inbox.length} từ</span>
            </div>
          </button>

          {/* Folders */}
          {(data.folders || []).map(folder => (
            <div key={folder.id} className="group relative">
              {/* Delete confirmation overlay */}
              {deletingFolderId === folder.id && (
                <div className="absolute inset-0 z-10 bg-white/95 rounded-lg flex flex-col items-center justify-center p-2 border border-rose-200">
                  <p className="text-[8px] font-bold text-rose-600 text-center mb-1.5">Xóa thư mục này?</p>
                  <div className="flex gap-1">
                    <button onClick={() => confirmDeleteFolder(folder.id)} className="px-2 py-1 bg-rose-500 text-white rounded text-[8px] font-bold hover:bg-rose-600" title="Xác nhận xóa">Xóa</button>
                    <button onClick={() => setDeletingFolderId(null)} className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[8px] font-bold hover:bg-slate-300" title="Hủy">Hủy</button>
                  </div>
                </div>
              )}

              {/* Rename mode */}
              {renamingFolderId === folder.id ? (
                <div className="flex items-center gap-1 p-1.5">
                  <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmRename(folder.id); if (e.key === 'Escape') setRenamingFolderId(null); }}
                    autoFocus
                    className="flex-1 px-1.5 py-1 border border-indigo-300 rounded text-[9px] font-bold text-slate-700 outline-none min-w-0" />
                  <button onClick={() => confirmRename(folder.id)} className="w-5 h-5 bg-indigo-600 text-white rounded flex items-center justify-center" title="Lưu">
                    <Check className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => setRenamingFolderId(null)} className="w-5 h-5 bg-slate-200 text-slate-500 rounded flex items-center justify-center" title="Hủy">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setActiveFolder(folder.id); setSearchQuery(''); }}
                  className={`w-full p-2.5 rounded-lg flex items-center gap-2 transition-all text-left ${
                    activeFolder === folder.id ? 'bg-white shadow-md border border-slate-200' : 'hover:bg-white text-slate-600'
                  }`}>
                  <div className="w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center" style={{ background: folder.color || '#6366f1' }}>
                    {activeFolder === folder.id ? <FolderOpen className="w-2.5 h-2.5 text-white" /> : <Folder className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-black block truncate ${activeFolder === folder.id ? 'text-slate-800' : ''}`}>{folder.name}</span>
                    <span className="text-[8px] font-bold text-slate-400">{folder.words.length} từ</span>
                  </div>
                </button>
              )}

              {/* Actions */}
              {renamingFolderId !== folder.id && deletingFolderId !== folder.id && (
                <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setRenamingFolderId(folder.id); setRenameValue(folder.name); }}
                    className="w-5 h-5 text-slate-300 hover:text-indigo-600 rounded flex items-center justify-center transition-all" title="Đổi tên">
                    <Edit3 className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => setDeletingFolderId(folder.id)}
                    className="w-5 h-5 text-slate-300 hover:text-rose-600 rounded flex items-center justify-center transition-all" title="Xóa">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="p-3 border-t border-slate-100 text-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
            {totalWords} từ tổng cộng
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2 rounded-full shadow-2xl z-50 animate-in slide-in-from-bottom-3 duration-200">
          <span className="text-[10px] font-bold">✅ {toast}</span>
        </div>
      )}
    </div>
  );
};

export default VocabBankCanvas;
