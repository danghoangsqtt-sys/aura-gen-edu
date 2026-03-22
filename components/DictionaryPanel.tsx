
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OllamaService, DictionaryResponse } from '../services/ollamaService';
import WordFormationGuide from './Dictionary/WordFormationGuide';
import PartsOfSpeechGuide from './Dictionary/PartsOfSpeechGuide';
import WordStressGuide from './Dictionary/WordStressGuide';
import GrammarArena from './Dictionary/GrammarArena';
import VocabBankCanvas from './Dictionary/VocabBankCanvas';
import { canvasStorage } from '../services/localDataService';
import { SavedWord, HybridDictEntry } from '../types';
import { searchOfflineDictionary } from '../services/localDictService';
import { getLearnedWord, saveLearnedWord } from '../services/learnedDictService';
import { enrichWithExternalData } from '../services/externalDictionaryService';
import { analyzeWordMorphology } from '../services/morphologyService';
import { 
  BookOpen, 
  Volume2, 
  Search, 
  Sparkles, 
  Bookmark, 
  ChevronRight, 
  Type, 
  Layers, 
  Zap, 
  Brain, 
  Quote, 
  Tag, 
  Dna 
} from 'lucide-react';

type DictionaryTab = 'lookup' | 'formation' | 'pos' | 'stress' | 'vocab-canvas' | 'adv-game';

const DictionaryPanel: React.FC = () => {
  const [viewMode, setViewMode] = useState<DictionaryTab>('lookup');
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [aiData, setAiData] = useState<DictionaryResponse | null>(null);
  const [offlineData, setOfflineData] = useState<HybridDictEntry | null>(null);
  const [isNotFoundOffline, setIsNotFoundOffline] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});
  const [enrichment, setEnrichment] = useState<{
    wordForms: { pos: string; form: string }[];
    allSynonyms: string[];
    allAntonyms: string[];
    extraMeanings: { pos: string; definition: string; example?: string; synonyms: string[]; antonyms: string[] }[];
    ukPhonetic?: string;
    usPhonetic?: string;
    ukAudioUrl?: string;
    usAudioUrl?: string;
  } | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const block1Ref = useRef<HTMLDivElement>(null);
  const block2Ref = useRef<HTMLDivElement>(null);
  const block3Ref = useRef<HTMLDivElement>(null);

  // Autocomplete gợi ý từ
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 2 || trimmedQuery.includes(' ')) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(trimmedQuery)}&max=6`);
        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.map((item: any) => item.word));
          setShowSuggestions(true);
        }
      } catch (e) { setSuggestions([]); }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Đóng gợi ý khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const harmonizeAiData = (result: DictionaryResponse): HybridDictEntry => {
    return {
      vocabulary: result.vocabulary,
      ipa: result.phonetics?.uk || "/.../",
      phonetics: result.phonetics,
      wordFamily: result.wordFamily,
      usageNotes: result.usageNotes,
      idiomsAndPhrasals: result.idiomsAndPhrasals,
      specializedMeanings: result.specializedMeanings?.map(spec => ({
        field: spec.field,
        meanings: spec.meanings.map(m => ({
          mean: m.meaning,
          example: m.example
        }))
      })),
      compoundWords: result.compoundWords,
      details: result.details.map(d => ({
        pos: d.pos,
        means: d.meanings.map(m => ({
          mean: m.meaning,
          examples: m.examples,
          example: m.examples?.[0] || "",
          synonyms: m.synonyms,
          antonyms: m.antonyms,
          context: m.context
        }))
      }))
    };
  };

  const handleSearch = async (textInput: string = query) => {
    const text = textInput.trim();
    if (!text) return;

    setAiLoading(false);
    setShowSuggestions(false);
    setAiData(null);
    setOfflineData(null);
    setIsNotFoundOffline(false);
    setError(null);
    setEnrichment(null);

    // TIER 1: Core Offline (Từ điển chuẩn)
    const localResult = await searchOfflineDictionary(text);
    if (localResult) {
      setOfflineData(localResult);
      // Auto-enrich from external API in background
      enrichWithExternalData(text).then(data => {
        if (data) setEnrichment(data);
      }).catch(() => {});
      return;
    }

    // TIER 2: Learned Dictionary (Trí nhớ AI)
    const learnedResult = getLearnedWord(text);
    if (learnedResult) {
      const hData = harmonizeAiData(learnedResult);
      setAiData(learnedResult);
      setOfflineData(hData);
      // Also enrich learned results
      enrichWithExternalData(text).then(data => {
        if (data) setEnrichment(data);
      }).catch(() => {});
      return;
    }

    // TIER 3: AI Fallback (Nếu không tìm thấy ở 2 lớp trên)
    // But first try external API for basic data
    const externalData = await enrichWithExternalData(text);
    if (externalData && externalData.extraMeanings.length > 0) {
      // Build a HybridDictEntry from external data
      const grouped: Record<string, typeof externalData.extraMeanings> = {};
      for (const m of externalData.extraMeanings) {
        if (!grouped[m.pos]) grouped[m.pos] = [];
        grouped[m.pos].push(m);
      }
      const builtEntry: HybridDictEntry = {
        vocabulary: text,
        ipa: externalData.ukPhonetic || externalData.usPhonetic || '/.../  ',
        details: Object.entries(grouped).map(([pos, means]) => ({
          pos,
          means: means.map(m => ({
            mean: m.definition,
            example: m.example || '',
            examples: m.example ? [m.example] : [],
            synonyms: m.synonyms.length > 0 ? m.synonyms : undefined,
            antonyms: m.antonyms.length > 0 ? m.antonyms : undefined,
          }))
        })),
        wordFamily: externalData.wordForms.map(wf => `${wf.pos}: ${wf.form}`),
      };
      setOfflineData(builtEntry);
      setEnrichment(externalData);
      return;
    }

    setIsNotFoundOffline(true);
  };

  const handleAiAnalyze = async () => {
    if (!query) return;
    setAiLoading(true);
    setIsNotFoundOffline(false);
    setError(null);
    try {
      const result = await OllamaService.analyzeWordWithAI(query);
      
      // Tự động lưu vào "Trí nhớ cục bộ" (Learned Dictionary)
      saveLearnedWord(query, result);
      
      // Chuyển đổi và hiển thị
      const harmonizedData = harmonizeAiData(result);
      setAiData(result); 
      setOfflineData(harmonizedData); 
    } catch (err: any) {
      console.error("[Dictionary] AI Search failed:", err);
      setError('Không thể kết nối với trí tuệ nhân tạo Aura lúc này.');
    } finally {
      setAiLoading(false);
    }
  };

  const scrollToBlock = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const speak = (text: string, lang: string = 'en-US') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Folder picker state for save flow
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [pendingSaveWord, setPendingSaveWord] = useState<SavedWord | null>(null);
  const [foldersList, setFoldersList] = useState<{id: string; name: string; color?: string; words: SavedWord[]}[]>([]);

  const handleSaveToCanvas = async (word: string, meaning: string, ipa: string, pos?: string, example?: string) => {
    const newWord: SavedWord = {
      id: `word_${Date.now()}`,
      word,
      meaning,
      ipa,
      partOfSpeech: pos,
      example,
      pronunciation: ipa
    };
    setPendingSaveWord(newWord);
    // Load latest folders
    const currentData = await canvasStorage.get();
    setFoldersList(currentData.folders || []);
    setShowFolderPicker(true);
  };

  const confirmSaveToFolder = async (folderId: string | null) => {
    if (!pendingSaveWord) return;
    try {
      const currentData = await canvasStorage.get();
      if (folderId === null) {
        // Save to inbox
        await canvasStorage.save({
          ...currentData,
          inbox: [pendingSaveWord, ...currentData.inbox]
        });
      } else {
        // Save to specific folder
        const updatedFolders = (currentData.folders || []).map(f => {
          if (f.id === folderId) return { ...f, words: [pendingSaveWord!, ...f.words] };
          return f;
        });
        await canvasStorage.save({ ...currentData, folders: updatedFolders });
      }
      const folderName = folderId ? (currentData.folders || []).find(f => f.id === folderId)?.name || 'thư mục' : 'Hộp thư';
      setShowToast({ show: true, msg: `Đã lưu "${pendingSaveWord.word}" vào ${folderName}!` });
      setTimeout(() => setShowToast({ show: false, msg: '' }), 3000);
    } catch (e) {
      setShowToast({ show: true, msg: 'Lỗi khi lưu từ vựng.' });
      setTimeout(() => setShowToast({ show: false, msg: '' }), 3000);
    }
    setShowFolderPicker(false);
    setPendingSaveWord(null);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex flex-col h-full animate-in fade-in duration-500 overflow-hidden relative" ref={wrapperRef}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
             <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none italic uppercase">Aura Gen <span className="text-indigo-600">Lexicon</span></h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[4px] mt-1.5">Local AI Powered Dictionary</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0 overflow-x-auto no-scrollbar gap-1">
          {[
            { id: 'lookup', label: 'Tra từ', icon: <Search className="w-3.5 h-3.5" /> },
            { id: 'formation', label: 'Cấu tạo từ', icon: <Dna className="w-3.5 h-3.5" /> },
            { id: 'pos', label: 'Từ loại', icon: <Type className="w-3.5 h-3.5" /> },
            { id: 'stress', label: 'Trọng âm', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'vocab-canvas', label: 'Hộp từ vựng', icon: <Bookmark className="w-3.5 h-3.5" /> },
            { id: 'adv-game', label: 'Luyện tập', icon: <Brain className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => {
                const targetId = tab.id as DictionaryTab;
                setViewMode(targetId);
                if (targetId === 'formation') scrollToBlock(block3Ref);
                if (targetId === 'pos') scrollToBlock(block1Ref);
                if (targetId === 'stress') scrollToBlock(block1Ref);
              }}
              className={`px-4 py-2 text-[10px] whitespace-nowrap font-black rounded-xl transition-all flex items-center gap-2 ${
                viewMode === tab.id ? 'bg-white shadow-lg text-indigo-600 scale-105' : 'text-slate-500 hover:text-indigo-500 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span className="uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lookup view elements (Search & Results) */}
      {viewMode === 'lookup' && (
        <>
          {/* Search Input Area */}
          <div className="relative mb-6 shrink-0 z-50 animate-in slide-in-from-top-4 duration-500">
            <div className="group relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nhập từ vựng hoặc câu văn..."
                className="w-full pl-5 pr-14 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
              />
              <button
                onClick={() => handleSearch()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {aiLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search className="w-5 h-5" />}
              </button>
            </div>

            {/* Autocomplete */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                {suggestions.map((s, idx) => (
                  <button key={idx} onClick={() => { setQuery(s); handleSearch(s); }} className="w-full px-6 py-3 text-left text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-b border-slate-50 last:border-0">{s}</button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-sm font-bold text-rose-600">{error}</p>
            </div>
          )}

          {/* Jump Navigation (Sticky) */}
          {offlineData && (
             <div className="sticky top-0 z-40 flex items-center gap-2 py-2 bg-white/80 backdrop-blur-md overflow-x-auto no-scrollbar border-b border-slate-100 mb-2">
                <button onClick={() => scrollToBlock(block1Ref)} className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg whitespace-nowrap transition-all">🏠 Nghĩa chung</button>
                {offlineData.specializedMeanings && (
                   <button onClick={() => scrollToBlock(block2Ref)} className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg whitespace-nowrap transition-all">🔬 Chuyên ngành</button>
                )}
                {offlineData.compoundWords && (
                   <button onClick={() => scrollToBlock(block3Ref)} className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg whitespace-nowrap transition-all">📚 Từ ghép</button>
                )}
             </div>
          )}

          {/* Main Results Content Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
            {/* 2. LOADING STATE OVERLAY (PHÍA TRÊN) */}
            {aiLoading && (
              <div className="bg-slate-50/50 h-32 rounded-[35px] p-8 flex items-center justify-center animate-pulse">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
                 </div>
              </div>
            )}

            {/* 3. KẾT QUẢ HIỂN THỊ CHÍNH (PROFESSIONAL DICTIONARY UI) */}
            {offlineData && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                {/* Premium Header */}
                <div className="bg-white border-b border-slate-100 pb-5 relative">
                   <div className="flex justify-between items-start mb-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none break-words">
                            {offlineData.vocabulary}
                          </h1>
                        </div>
                        
                        {/* Phonetics — Always show UK & US clearly */}
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                           {/* UK Pronunciation */}
                           <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 group/uk hover:border-blue-300 transition-all">
                              <div className="flex flex-col">
                                 <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">🇬🇧 Anh – Anh</span>
                                 <span className="text-sm text-blue-600 font-serif italic leading-tight">{offlineData.phonetics?.uk || enrichment?.ukPhonetic || offlineData.ipa}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  if (enrichment?.ukAudioUrl) {
                                    new Audio(enrichment.ukAudioUrl).play().catch(() => speak(offlineData.vocabulary, 'en-GB'));
                                  } else {
                                    speak(offlineData.vocabulary, 'en-GB');
                                  }
                                }} 
                                title="Nghe phát âm Anh – Anh (UK)"
                                className="w-8 h-8 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-all border border-blue-200 shadow-sm group-hover/uk:shadow-md"
                              >
                                 <Volume2 className="w-4 h-4" />
                              </button>
                           </div>

                           {/* US Pronunciation */}
                           <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 group/us hover:border-indigo-300 transition-all">
                              <div className="flex flex-col">
                                 <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">🇺🇸 Anh – Mỹ</span>
                                 <span className="text-sm text-indigo-600 font-serif italic leading-tight">{offlineData.phonetics?.us || enrichment?.usPhonetic || offlineData.ipa}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  if (enrichment?.usAudioUrl) {
                                    new Audio(enrichment.usAudioUrl).play().catch(() => speak(offlineData.vocabulary, 'en-US'));
                                  } else {
                                    speak(offlineData.vocabulary, 'en-US');
                                  }
                                }} 
                                title="Nghe phát âm Anh – Mỹ (US)"
                                className="w-8 h-8 bg-indigo-100 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg flex items-center justify-center transition-all border border-indigo-200 shadow-sm group-hover/us:shadow-md"
                              >
                                 <Volume2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                      </div>
                      
                    <button 
                      onClick={() => handleSaveToCanvas(
                        offlineData.vocabulary, 
                        offlineData.details[0]?.means[0]?.mean || "", 
                        offlineData.ipa, 
                        offlineData.details[0]?.pos,
                        offlineData.details[0]?.means?.[0]?.examples?.[0] || offlineData.details[0]?.means?.[0]?.example
                      )}
                      title="Lưu sổ tay"
                      className={`p-3 rounded-xl transition-all shadow-xl shadow-slate-200 flex items-center gap-2 group ${
                        showToast.show && showToast.msg.includes(offlineData.vocabulary)
                        ? 'bg-yellow-400 text-white' 
                        : 'bg-slate-900 hover:bg-yellow-500 text-white'
                      }`}
                    >
                       <Bookmark className={`w-5 h-5 ${showToast.show ? 'fill-white' : 'fill-none'} transition-all`} />
                       <span className="text-[11px] font-black uppercase tracking-widest hidden md:inline">Lưu sổ tay</span>
                    </button>
                   </div>

                   {/* Word Family Chips Early */}
                   {offlineData.wordFamily && offlineData.wordFamily.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">📐 Các dạng từ loại</p>
                        <div className="flex flex-wrap gap-2">
                          {offlineData.wordFamily.map((wf, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg border border-slate-200 tracking-tight">
                               {wf}
                            </span>
                          ))}
                        </div>
                      </div>
                   )}

                   {/* Enrichment: Global Synonyms & Antonyms */}
                   {enrichment && (enrichment.allSynonyms.length > 0 || enrichment.allAntonyms.length > 0) && (
                     <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                       {enrichment.allSynonyms.length > 0 && (
                         <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
                           <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                             <span className="w-4 h-4 bg-emerald-500 text-white rounded flex items-center justify-center text-[7px]">≈</span>
                             Từ đồng nghĩa
                           </p>
                           <div className="flex flex-wrap gap-1.5">
                             {enrichment.allSynonyms.map(s => (
                               <button key={s} onClick={() => { setQuery(s); handleSearch(s); }}
                                 className="px-2.5 py-1 bg-white text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm">
                                 {s}
                               </button>
                             ))}
                           </div>
                         </div>
                       )}
                       {enrichment.allAntonyms.length > 0 && (
                         <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                           <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                             <span className="w-4 h-4 bg-rose-500 text-white rounded flex items-center justify-center text-[7px]">≠</span>
                             Từ trái nghĩa
                           </p>
                           <div className="flex flex-wrap gap-1.5">
                             {enrichment.allAntonyms.map(a => (
                               <button key={a} onClick={() => { setQuery(a); handleSearch(a); }}
                                 className="px-2.5 py-1 bg-white text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">
                                 {a}
                               </button>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   )}

                </div>

                {/* Usage Notes Warning Box */}
                {offlineData.usageNotes && (
                   <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex gap-3 items-start animate-in zoom-in-95 duration-500">
                      <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-100">
                         <Zap className="w-5 h-5 fill-white" />
                      </div>
                      <div>
                         <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-0.5">Lưu ý ngữ pháp</h4>
                         <p className="text-[12px] font-bold text-slate-800 leading-relaxed italic">
                           {offlineData.usageNotes}
                         </p>
                      </div>
                   </div>
                )}

                {/* Word Morphology Breakdown */}
                {(() => {
                  const morph = analyzeWordMorphology(offlineData.vocabulary);
                  if (!morph) return null;
                  const typeColors = {
                    prefix: { bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-700', label: 'text-orange-500', badge: 'bg-orange-500' },
                    root: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', label: 'text-slate-500', badge: 'bg-slate-700' },
                    suffix: { bg: 'bg-violet-100', border: 'border-violet-200', text: 'text-violet-700', label: 'text-violet-500', badge: 'bg-violet-500' },
                  };
                  const typeLabels = { prefix: 'Tiền tố', root: 'Gốc từ', suffix: 'Hậu tố' };
                  return (
                    <div className="bg-gradient-to-r from-orange-50/50 via-slate-50/50 to-violet-50/50 border border-slate-100 rounded-2xl p-4 animate-in fade-in duration-500">
                      <div className="flex items-center gap-2 mb-3">
                        <Dna className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Phân tích cấu tạo từ</h4>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mb-3">
                        {morph.parts.map((p, i) => {
                          const c = typeColors[p.type];
                          return (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-slate-300 font-bold text-lg mx-0.5">+</span>}
                              <div className={`${c.bg} ${c.border} border rounded-xl px-3 py-2 text-center`}>
                                <span className={`block text-[7px] font-black ${c.label} uppercase tracking-widest mb-0.5`}>{typeLabels[p.type]}</span>
                                <span className={`block text-sm font-black ${c.text}`}>
                                  {p.type === 'prefix' ? `${p.morpheme}-` : p.type === 'suffix' ? `-${p.morpheme}` : p.morpheme}
                                </span>
                                <span className="block text-[9px] font-bold text-slate-500 mt-0.5 italic">{p.meaning}</span>
                              </div>
                            </React.Fragment>
                          );
                        })}
                        <span className="text-slate-300 font-bold text-lg mx-1">=</span>
                        <div className="bg-indigo-100 border border-indigo-200 rounded-xl px-3 py-2 text-center">
                          <span className="block text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Kết quả</span>
                          <span className="block text-sm font-black text-indigo-700">{offlineData.vocabulary}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 italic leading-relaxed bg-white/60 rounded-lg px-3 py-1.5 border border-slate-50">
                        💡 {morph.summary}
                      </p>
                    </div>
                  );
                })()}

                {/* Main meanings content */}
                <div className="space-y-6" ref={block1Ref}>
                  {offlineData.details?.map((detail, idx) => (
                    <div key={idx} className="space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white rounded-lg px-4 py-1.5 text-[10px] uppercase font-black tracking-[1.5px] shadow-lg shadow-slate-200 rotate-[-0.5deg]">
                          {detail.pos}
                        </span>
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                      </div>
                      
                      <div className="space-y-6 pr-2">
                        {detail.means?.map((m, mIdx) => (
                          <div key={mIdx} className="group relative">
                            <div className="space-y-3">
                              <h3 className="text-base font-black text-slate-800 leading-snug flex items-start gap-3">
                                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 text-[10px] flex items-center justify-center shrink-0 border border-blue-100 font-serif italic">
                                   {mIdx + 1}
                                </span>
                                {m.mean}
                              </h3>
                              
                              {/* Multiple Examples with translation */}
                              <div className="space-y-1.5 pl-9">
                                {(m.examples || [m.example]).filter(Boolean).map((ex, exIdx) => (
                                  <div key={exIdx} className="border-l-2 border-slate-50 pl-3 py-0.5 transition-all group-hover:border-indigo-100">
                                    <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
                                      {ex}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Synonyms & Antonyms */}
                              {(m.synonyms || m.antonyms) && (
                                <div className="flex flex-wrap gap-3 pl-10 mt-2">
                                   {m.synonyms && m.synonyms.length > 0 && (
                                     <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Syn:</span>
                                        <div className="flex flex-wrap gap-1">
                                           {m.synonyms.map(s => (
                                             <button 
                                               key={s} 
                                               onClick={() => { setQuery(s); handleSearch(s); }}
                                               className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                                             >
                                                {s}
                                             </button>
                                           ))}
                                        </div>
                                     </div>
                                   )}
                                   {m.antonyms && m.antonyms.length > 0 && (
                                     <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Ant:</span>
                                        <div className="flex flex-wrap gap-1">
                                           {m.antonyms.map(a => (
                                             <button 
                                               key={a}
                                               onClick={() => { setQuery(a); handleSearch(a); }} 
                                               className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-black rounded-md border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"
                                             >
                                                {a}
                                             </button>
                                           ))}
                                        </div>
                                     </div>
                                   )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Specialized Meanings section */}
                {offlineData.specializedMeanings && offlineData.specializedMeanings.length > 0 && (
                   <div className="space-y-6" ref={block2Ref}>
                      <div className="flex items-center gap-4">
                        <span className="bg-indigo-100 text-indigo-700 rounded-xl px-4 py-1.5 text-[11px] uppercase font-black tracking-[2px]">
                          Tra cứu Chuyên ngành
                        </span>
                        <div className="h-[1px] flex-1 bg-indigo-100"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {offlineData.specializedMeanings.map((spec, sIdx) => (
                           <div key={sIdx} className="bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100 rounded-xl p-4 hover:border-indigo-300 transition-all group">
                              <div className="flex items-center gap-1.5 mb-2">
                                 <Tag className="w-3 h-3 text-indigo-500" />
                                 <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{spec.field}</span>
                              </div>
                              <div className="space-y-3">
                                 {spec.meanings.map((sm, smIdx) => (
                                    <div key={smIdx} className="space-y-1.5">
                                       <p className="text-[14px] font-bold text-slate-800 leading-tight">{sm.mean}</p>
                                       {sm.example && (
                                          <p className="text-[12px] text-slate-500 italic leading-relaxed pl-3 border-l-2 border-indigo-50 group-hover:border-indigo-200 transition-all">
                                             {sm.example}
                                          </p>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                )}

                {/* Compound Words section */}
                {offlineData.compoundWords && offlineData.compoundWords.length > 0 && (
                   <div className="bg-slate-900 rounded-3xl p-6 space-y-4 text-white overflow-hidden relative" ref={block3Ref}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                      <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 relative z-10">
                         <Layers className="w-5 h-5 text-indigo-400" />
                         Từ ghép & Phái sinh
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative z-10">
                        {offlineData.compoundWords.map((cw, idx) => (
                           <button 
                             key={idx} 
                             onClick={() => { setQuery(cw.word); handleSearch(cw.word); }}
                             className="text-left p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group/cw"
                           >
                              <div className="flex justify-between items-center mb-0.5">
                                 <span className="text-[14px] font-black text-indigo-300 group-hover/cw:text-white transition-all underline decoration-indigo-500/20 underline-offset-4">{cw.word}</span>
                                 <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover/cw:translate-x-1 transition-all" />
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 leading-snug">{cw.meaning}</p>
                           </button>
                        ))}
                      </div>
                   </div>
                )}

                {/* Idioms & Phrasals section */}
                {offlineData.idiomsAndPhrasals && offlineData.idiomsAndPhrasals.length > 0 && (
                   <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 gap-5 flex flex-col">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                         <Quote className="w-5 h-5 text-indigo-600" />
                         Thành ngữ & Cụm động từ
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                         {offlineData.idiomsAndPhrasals.map((item, idx) => (
                           <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                              <p className="text-[15px] font-black text-indigo-700 mb-1 border-b border-transparent group-hover:border-indigo-50 inline-block transition-all">{item.phrase}</p>
                              <p className="text-[13px] font-bold text-slate-700 mb-2">{item.meaning}</p>
                              <div className="bg-slate-50/80 p-2.5 rounded-lg border-l-3 border-indigo-400">
                                 <p className="text-[11px] text-slate-600 italic">"{item.example}"</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* AI Boost Link (If offline data is from simple source) */}
                {!aiData && (
                  <div className="mt-12 pt-8 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-6">Bạn cần phân tích chuyên khảo chi tiết hơn?</p>
                    <button 
                      onClick={handleAiAnalyze} 
                      className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-5 rounded-[24px] transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] hover:shadow-blue-300 active:scale-95 overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                       <Sparkles className="w-6 h-6 animate-pulse relative z-10" />
                       <div className="text-left relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-[2px] leading-none mb-1 opacity-80">Siêu trí tuệ Aura</p>
                          <p className="text-[13px] font-bold">Kích hoạt phân tích ngôn ngữ sâu</p>
                       </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. TRẠNG THÁI KHÔNG TÌM THẤY */}
            {isNotFoundOffline && !aiLoading && (
               <div className="text-center py-20 animate-in zoom-in-95 duration-500 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 text-slate-300 rotate-6">
                     <Search className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-3 uppercase tracking-tight">KHOA MỤC CHƯA CẬP NHẬT</h3>
                  <p className="text-[13px] font-semibold text-slate-500 mb-12 max-w-xs mx-auto leading-relaxed px-4">
                    Không tìm thấy <span className="text-blue-600 font-black">"{query}"</span> trong từ điển chuẩn. <br/> Đây có thể là một từ lóng, cụm từ ghép, hoặc từ vựng tiếng Việt.
                  </p>
                  
                  <button 
                    onClick={handleAiAnalyze} 
                    className="group relative flex items-center gap-5 bg-slate-900 hover:bg-blue-600 text-white px-12 py-6 rounded-3xl mx-auto transition-all shadow-2xl active:scale-95"
                  >
                     <Sparkles className="w-7 h-7 text-yellow-400 group-hover:rotate-12 transition-transform" />
                     <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-[3px] leading-none mb-1 opacity-70">Nhờ Aura trợ giúp</p>
                        <p className="text-[15px] font-black tracking-tight">✨ Nhờ Aura phân tích sâu</p>
                     </div>
                  </button>
               </div>
            )}
          </div>
        </>
      )}

      {/* Guide & Game Content View */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === 'lookup' ? 'hidden' : 'block'}`}>
        {/* Word Formation Guide Mode */}
        {viewMode === 'formation' && (
          <div className="h-full animate-in slide-in-from-right duration-500">
            <WordFormationGuide />
          </div>
        )}

        {/* Parts of Speech Guide Mode */}
        {viewMode === 'pos' && (
          <div className="h-full animate-in slide-in-from-right duration-500">
            <PartsOfSpeechGuide />
          </div>
        )}

        {/* Word Stress Guide Mode */}
        {viewMode === 'stress' && (
          <div className="h-full animate-in slide-in-from-right duration-500">
            <WordStressGuide />
          </div>
        )}

        {/* Personal Vocab Canvas Mode */}
        {viewMode === 'vocab-canvas' && (
          <div className="h-full animate-in slide-in-from-right duration-500">
            <VocabBankCanvas />
          </div>
        )}

        {/* Advanced Grammar Game Mode (Grammar Arena) */}
        {viewMode === 'adv-game' && (
          <div className="h-full animate-in slide-in-from-right duration-500">
            <GrammarArena />
          </div>
        )}
      </div>

      {/* Loading States Overlay - Redesigned */}
      {aiLoading && viewMode === 'lookup' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-indigo-100 px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="relative">
             <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping"></div>
             <div className="absolute inset-0 w-3 h-3 bg-indigo-400 rounded-full opacity-50"></div>
          </div>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
            Aura is Thinking...
          </span>
        </div>
      )}

      
      {/* Footer Status */}
      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[8px] font-black text-slate-300 uppercase tracking-widest shrink-0">
        <div className="flex gap-4">
           <span className="text-indigo-500 font-bold">Ollama Architecture</span>
           <span className="bg-indigo-100 rounded-md px-2 text-indigo-700">Aura Gen Lexicon v2.0</span>
        </div>
        <span>DHsystem Engine 2026</span>
      </div>

      {/* Folder Picker Modal */}
      {showFolderPicker && pendingSaveWord && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200 rounded-2xl">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 w-[300px] max-h-[400px] animate-in zoom-in-95 duration-300">
            <h3 className="text-sm font-black text-slate-800 mb-1">📂 Lưu từ vựng</h3>
            <p className="text-[10px] text-slate-400 font-bold mb-4">Chọn nơi lưu "<span className="text-indigo-600">{pendingSaveWord.word}</span>"</p>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar mb-4">
              <button onClick={() => confirmSaveToFolder(null)} className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-300 transition-all text-left">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0"><BookOpen className="w-3.5 h-3.5 text-white" /></div>
                <div><p className="text-[11px] font-black text-slate-700">📥 Hộp thư (Inbox)</p><p className="text-[9px] text-slate-400">Mặc định</p></div>
              </button>
              {foldersList.map((f: any) => (
                <button key={f.id} onClick={() => confirmSaveToFolder(f.id)} className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all text-left">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: f.color || '#6366f1' }}><Bookmark className="w-3.5 h-3.5 text-white" /></div>
                  <div><p className="text-[11px] font-black text-slate-700">📂 {f.name}</p><p className="text-[9px] text-slate-400">{f.words?.length || 0} từ</p></div>
                </button>
              ))}
            </div>
            <button onClick={() => { setShowFolderPicker(false); setPendingSaveWord(null); }} className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-all">
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast.show && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl z-[200] animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-2">
          <span className="text-[10px] font-bold">✅ {showToast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default DictionaryPanel;
