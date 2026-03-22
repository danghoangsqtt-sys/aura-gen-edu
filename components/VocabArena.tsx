
import React, { useState, useEffect, useMemo } from 'react';
import { VocabularyItem } from '../types';

interface VocabArenaProps {
  vocabList: VocabularyItem[];
  onClose: () => void;
}

type VocabGameMode = 'match' | 'pairing' | 'cloze' | 'spelling';

interface PairItem {
  id: string;
  text: string;
  type: 'word' | 'meaning';
  matchId: string;
}

const VocabArena: React.FC<VocabArenaProps> = ({ vocabList, onClose }) => {
  const [mode, setMode] = useState<VocabGameMode | null>(null);
  const [score, setScore] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; msg: string; sub?: string } | null>(null);
  const [options, setOptions] = useState<string[]>([]);

  // States cho trò chơi Pairing (Ghép đôi)
  const [pairingItems, setPairingItems] = useState<PairItem[]>([]);
  const [selectedPair, setSelectedPair] = useState<PairItem | null>(null);
  const [solvedPairs, setSolvedPairs] = useState<string[]>([]);
  const [pairingError, setPairingError] = useState<string | null>(null);

  // Chọn ngẫu nhiên 10 từ để luyện tập trong 1 session
  const sessionVocab = useMemo(() => {
    return [...vocabList].sort(() => Math.random() - 0.5).slice(0, 10);
  }, [vocabList]);

  const currentWord = sessionVocab[currentIdx];

  // --- LOGIC TẠO CÂU HỎI ---

  const setupGame = async (gameMode: VocabGameMode) => {
    setLoading(true);
    setFeedback(null);
    setUserInput('');

    if (gameMode === 'pairing') {
      // Lấy 5 từ ngẫu nhiên để làm bảng ghép đôi
      const batch = [...vocabList].sort(() => Math.random() - 0.5).slice(0, 5);
      const items: PairItem[] = [];
      batch.forEach(v => {
        items.push({ id: `w-${v.id}`, text: v.word, type: 'word', matchId: v.id });
        items.push({ id: `m-${v.id}`, text: v.meaning, type: 'meaning', matchId: v.id });
      });
      setPairingItems(items.sort(() => Math.random() - 0.5));
      setSolvedPairs([]);
      setSelectedPair(null);
    } else if (gameMode === 'match') {
      const correct = currentWord.meaning;
      const distractors = vocabList
        .filter(v => v.meaning !== correct)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => v.meaning);
      setOptions([correct, ...distractors].sort(() => Math.random() - 0.5));
    } else if (gameMode === 'spelling') {
      speakWord(currentWord.word);
    }

    setMode(gameMode);
    setLoading(false);
  };

  // --- TIỆN ÍCH ---

  const speakWord = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'en-US';
    // Giảm tốc độ đọc từ 0.8 xuống 0.6 để người dùng nghe rõ từng âm tiết hơn
    ut.rate = 0.6; 
    ut.pitch = 1;
    ut.volume = 1;
    window.speechSynthesis.speak(ut);
  };

  const maskWord = (sentence: string, word: string) => {
    const regex = new RegExp(word, 'gi');
    return sentence.replace(regex, '____');
  };

  const handleCheck = (answer: string) => {
    if (feedback) return;
    
    const isCorrect = answer.toLowerCase().trim() === currentWord.word.toLowerCase().trim() || 
                      answer === currentWord.meaning;

    if (isCorrect) {
      setScore(s => s + 100);
      setFeedback({ 
        isCorrect: true, 
        msg: "🎯 CHÍNH XÁC!", 
        sub: `${currentWord.word} [${currentWord.pronunciation}]` 
      });
      if (mode === 'spelling') speakWord(currentWord.word);
    } else {
      setFeedback({ 
        isCorrect: false, 
        msg: "💡 CỐ GẮNG LÊN!", 
        sub: `Đáp án đúng: ${mode === 'match' ? currentWord.meaning : currentWord.word}` 
      });
    }
  };

  const handlePairSelection = (item: PairItem) => {
    if (solvedPairs.includes(item.matchId)) return;
    setPairingError(null);

    if (!selectedPair) {
      setSelectedPair(item);
    } else {
      if (selectedPair.id === item.id) {
        setSelectedPair(null);
        return;
      }

      if (selectedPair.matchId === item.matchId && selectedPair.type !== item.type) {
        // Đúng cặp
        setSolvedPairs(prev => [...prev, item.matchId]);
        setScore(s => s + 50);
        setSelectedPair(null);
        
        // Kiểm tra hoàn thành bảng
        if (solvedPairs.length + 1 === 5) {
          setFeedback({ isCorrect: true, msg: "🔥 BẠN ĐÃ GHÉP ĐÚNG TẤT CẢ!", sub: "Tuyệt vời, tiếp tục thôi!" });
        }
      } else {
        // Sai cặp
        setPairingError(item.id);
        setTimeout(() => {
          setSelectedPair(null);
          setPairingError(null);
        }, 500);
      }
    }
  };

  const nextQuestion = () => {
    if (mode === 'pairing') {
       setupGame('pairing'); // Reset board pairing mới
       return;
    }

    if (currentIdx < sessionVocab.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      alert(`🎉 CHÚC MỪNG! Bạn đã hoàn thành đấu trường với ${score} điểm.`);
      onClose();
    }
  };

  useEffect(() => {
    if (mode && mode !== 'pairing') setupGame(mode);
  }, [currentIdx]);

  if (!mode) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-1">Vocab <span className="text-indigo-500 italic">Arena</span></h2>
          <p className="text-indigo-300 font-semibold uppercase tracking-wider text-[10px]">Đấu trường tri thức DHsystem</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
          <ModeCard title="Pairing Master" desc="Ghép đôi từ và nghĩa" icon="🔗" color="from-indigo-600 to-violet-600" onClick={() => setupGame('pairing')} />
          <ModeCard title="Meaning Matcher" desc="Trắc nghiệm nghĩa từ" icon="🧩" color="from-emerald-500 to-teal-600" onClick={() => setupGame('match')} />
          <ModeCard title="Context Hero" desc="Điền từ vào câu ví dụ" icon="⚡" color="from-rose-500 to-pink-600" onClick={() => setupGame('cloze')} />
          <ModeCard title="Spelling Bee" desc="Nghe âm chuẩn, gõ từ đúng" icon="🐝" color="from-amber-500 to-orange-600" onClick={() => setupGame('spelling')} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
      {/* Game Header */}
      <div className="w-full bg-slate-50 border-b px-5 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">{currentIdx + 1}</div>
          <div className="hidden sm:block">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
            <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((currentIdx + 1) / sessionVocab.length) * 100}%` }}></div>
            </div>
          </div>
        </div>
        <div className="text-center">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score</p>
           <p className="text-base font-bold text-indigo-600 tabular-nums">{score}</p>
        </div>
        <button onClick={() => setMode(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 w-full max-w-2xl p-4 md:p-6 flex flex-col items-center justify-center space-y-4">
        
        {loading && (
          <div className="text-center space-y-4 py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Đang chuẩn bị...</p>
          </div>
        )}

        {!loading && (
          <div className="w-full space-y-5 animate-in zoom-in duration-300">
            
            {/* Chế độ Ghép đôi (Pairing Master) */}
            {mode === 'pairing' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Ghép đôi tương ứng</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1 italic">Nối từ tiếng Anh với nghĩa tiếng Việt chính xác</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {pairingItems.map((item) => {
                    const isSelected = selectedPair?.id === item.id;
                    const isSolved = solvedPairs.includes(item.matchId);
                    const isError = pairingError === item.id;

                    return (
                      <button
                        key={item.id}
                        disabled={isSolved}
                        onClick={() => handlePairSelection(item)}
                        className={`p-3 h-24 rounded-xl border-2 font-semibold text-xs transition-all flex items-center justify-center text-center shadow-sm relative overflow-hidden ${
                          isSolved 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 opacity-60' 
                            : isError
                            ? 'bg-rose-50 border-rose-500 text-rose-700 animate-shake'
                            : isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white scale-105 shadow-xl rotate-1'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        {isSolved && (
                          <div className="absolute top-1 right-1">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                          </div>
                        )}
                        {item.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {mode === 'match' && (
              <div className="text-center space-y-4">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Từ này có nghĩa là gì?</span>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">{currentWord.word}</h3>
              </div>
            )}

            {mode === 'cloze' && (
              <div className="bg-slate-50 p-4 rounded-xl border-b-4 border-slate-100 text-center space-y-3">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Điền từ còn thiếu vào câu</span>
                <p className="text-base font-semibold text-slate-700 leading-relaxed italic">
                  "{maskWord(currentWord.example || "I like to study ____ every day.", currentWord.word)}"
                </p>
                <p className="text-xs font-medium text-slate-400">Gợi ý: {currentWord.meaning}</p>
              </div>
            )}

            {mode === 'spelling' && (
              <div className="text-center space-y-4">
                 <button onClick={() => speakWord(currentWord.word)} className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center hover:bg-amber-100 transition-all shadow-md mx-auto active:scale-90 border-2 border-white">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                 </button>
                 <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Nghe và viết lại từ vừa nghe</p>
              </div>
            )}

            {/* Input / Options Area (Không hiển thị cho pairing trừ khi xong) */}
            {mode !== 'pairing' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                {mode === 'match' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {options.map((opt, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleCheck(opt)}
                        disabled={!!feedback}
                        className={`p-3 rounded-xl border-2 text-left font-semibold text-sm transition-all active:scale-[0.98] ${feedback && opt === currentWord.meaning ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : feedback && opt !== currentWord.meaning ? 'opacity-50 border-slate-100' : 'bg-white border-slate-100 hover:border-indigo-500 shadow-sm'}`}
                      >
                        <span className="text-xs text-slate-300 mr-2">{String.fromCharCode(65+idx)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <input 
                      autoFocus
                      className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold text-center focus:border-indigo-600 outline-none transition-all uppercase placeholder:text-slate-200"
                      placeholder="Nhập đáp án..."
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCheck(userInput)}
                    />
                    {!feedback && (
                      <p className="text-center mt-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Nhấn Enter để kiểm tra</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Feedback & Next Button */}
            {feedback && (
              <div className={`p-4 rounded-xl border-2 animate-in slide-in-from-bottom-4 shadow-md max-w-xl mx-auto ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${feedback.isCorrect ? 'bg-white text-emerald-500' : 'bg-white text-rose-500'}`}>
                    {feedback.isCorrect ? '✓' : '✗'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider leading-none">{feedback.msg}</h4>
                    <p className="text-xs font-medium mt-1 opacity-80">{feedback.sub}</p>
                  </div>
                </div>
                <button onClick={nextQuestion} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-sm active:scale-95">
                  {(mode !== 'pairing' && currentIdx === sessionVocab.length - 1) ? 'Xem kết quả' : 'Tiếp tục'}
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

const ModeCard: React.FC<{title: string; desc: string; icon: string; color: string; onClick: () => void}> = ({ title, desc, icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`bg-gradient-to-br ${color} p-4 rounded-xl text-white text-left hover:scale-[1.02] transition-all group shadow-md relative overflow-hidden active:scale-95`}
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform"></div>
    <div className="text-xl mb-3 group-hover:rotate-12 transition-transform">{icon}</div>
    <h4 className="text-sm font-bold uppercase tracking-tight mb-0.5"> {title}</h4>
    <p className="text-[10px] font-medium opacity-70 uppercase tracking-wider">{desc}</p>
  </button>
);

export default VocabArena;
