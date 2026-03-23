import React, { useState, useCallback, useMemo } from 'react';
import { ipaSounds, IPASound } from '../data/ipaData';
import { ipaPracticeMap } from '../data/ipaPracticeData';
import { analyzePronunciation, PronunciationFeedback } from '../services/geminiService';
import PracticeItem from './PracticeItem';
import { BookOpen, MessageSquare, ChevronDown, Search } from 'lucide-react';

// ═══════════════════════════════════════════════
// IPAClinic — Record & Analyze Architecture
// ═══════════════════════════════════════════════

type TabType = 'words' | 'sentences';
type SoundType = 'all' | 'monophthong' | 'diphthong' | 'consonant';

const IPAClinic: React.FC = () => {
  const [selectedSound, setSelectedSound] = useState<IPASound | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('words');
  const [filterType, setFilterType] = useState<SoundType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sounds
  const filteredSounds = useMemo(() => {
    let result = ipaSounds;
    if (filterType !== 'all') result = result.filter(s => s.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.symbol.includes(q) ||
        s.examples.some(e => e.toLowerCase().includes(q)) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [filterType, searchQuery]);

  // Get practice data for selected sound
  const practiceData = useMemo(() => {
    if (!selectedSound) return null;
    return ipaPracticeMap[selectedSound.symbol] || null;
  }, [selectedSound]);

  // AI Evaluation handler
  const handleAnalyze = useCallback(async (audioBlob: Blob, targetText: string): Promise<PronunciationFeedback> => {
    return analyzePronunciation(audioBlob, targetText);
  }, []);

  const typeLabels: Record<SoundType, string> = {
    all: 'Tất cả',
    monophthong: 'Nguyên âm đơn',
    diphthong: 'Nguyên âm đôi',
    consonant: 'Phụ âm',
  };

  const typeColors: Record<string, string> = {
    monophthong: 'bg-teal-100 text-teal-700 border-teal-200',
    diphthong: 'bg-violet-100 text-violet-700 border-violet-200',
    consonant: 'bg-sky-100 text-sky-700 border-sky-200',
  };

  // ═══ RENDER ═══
  return (
    <div className="h-full flex flex-col animate-content">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
            <span className="text-lg">🔬</span>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">Phòng Luyện Phát Âm IPA</h2>
            <p className="text-[10px] text-slate-400 font-medium">Thu âm → Đánh giá AI → Cải thiện phát âm tiếng Anh</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* ═══ Left: Sound Selector ═══ */}
        <div className="w-64 border-r bg-slate-50 flex flex-col shrink-0">
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm âm IPA..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
            </div>
          </div>

          {/* Type filter */}
          <div className="flex gap-1 px-3 pt-2 pb-1 flex-wrap">
            {(Object.keys(typeLabels) as SoundType[]).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border ${
                  filterType === t
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>

          {/* Sound list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSounds.map(sound => (
              <button
                key={sound.symbol}
                onClick={() => setSelectedSound(sound)}
                className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-2.5 group ${
                  selectedSound?.symbol === sound.symbol
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
                    : 'hover:bg-white hover:shadow-sm'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border shrink-0 ${
                  selectedSound?.symbol === sound.symbol
                    ? 'bg-white/20 border-white/30 text-white'
                    : typeColors[sound.type] || 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {sound.symbol}
                </span>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold truncate ${
                    selectedSound?.symbol === sound.symbol ? 'text-white' : 'text-slate-700'
                  }`}>
                    /{sound.symbol}/
                  </p>
                  <p className={`text-[9px] truncate ${
                    selectedSound?.symbol === sound.symbol ? 'text-white/70' : 'text-slate-400'
                  }`}>
                    {sound.examples.slice(0, 3).join(', ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Right: Practice Area ═══ */}
        <div className="flex-1 overflow-y-auto">
          {!selectedSound ? (
            /* Empty state */
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-xs">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👈</span>
                </div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">Chọn một âm IPA</h3>
                <p className="text-xs text-slate-400">Chọn âm từ danh sách bên trái để bắt đầu luyện phát âm</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Sound header */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black border ${typeColors[selectedSound.type]}`}>
                    {selectedSound.symbol}
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">/{selectedSound.symbol}/</h3>
                    <p className="text-xs text-slate-500">{selectedSound.description}</p>
                  </div>
                </div>
                {selectedSound.minimalPairs && selectedSound.minimalPairs.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Minimal pairs:</span>
                    {selectedSound.minimalPairs.map((p, i) => (
                      <span key={i} className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.word1} ↔ {p.word2}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('words')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'words'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Luyện Từ Vựng
                  {practiceData && <span className="text-[9px] opacity-60">({practiceData.words.length})</span>}
                </button>
                <button
                  onClick={() => setActiveTab('sentences')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'sentences'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Luyện Câu
                  {practiceData && <span className="text-[9px] opacity-60">({practiceData.sentences.length})</span>}
                </button>
              </div>

              {/* Practice items */}
              {practiceData ? (
                <div className="space-y-2">
                  {activeTab === 'words'
                    ? practiceData.words.map((w, i) => (
                        <PracticeItem key={`${selectedSound.symbol}-w-${i}`} text={w.word} ipa={w.ipa} onAnalyze={handleAnalyze} />
                      ))
                    : practiceData.sentences.map((s, i) => (
                        <PracticeItem key={`${selectedSound.symbol}-s-${i}`} text={s.sentence} ipa={s.ipa} onAnalyze={handleAnalyze} />
                      ))
                  }
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm font-medium">Chưa có dữ liệu luyện tập cho âm này</p>
                  <p className="text-xs mt-1">Dữ liệu sẽ được bổ sung sớm</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPAClinic;
