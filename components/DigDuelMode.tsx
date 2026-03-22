import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Question } from '../types';

interface DigDuelModeProps {
  questions: Question[];
  playerName: string;
  onFinish: (score: number, streak: number) => void;
  onBack: () => void;
}

const P1_KEYS: Record<string, number> = { 'a': 0, 's': 1, 'd': 2, 'f': 3 };
const P2_KEYS: Record<string, number> = { 'k': 0, 'l': 1, ';': 2, "'": 3 };
const KEY_LABELS_P1 = ['A', 'S', 'D', 'F'];
const KEY_LABELS_P2 = ['K', 'L', ';', "'"];
const MAX_DEPTH = 100;

const DigDuelMode: React.FC<DigDuelModeProps> = ({ questions, playerName, onFinish, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [p1Depth, setP1Depth] = useState(0);
  const [p2Depth, setP2Depth] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Answer, setP1Answer] = useState<number | null>(null);
  const [p2Answer, setP2Answer] = useState<number | null>(null);
  const [p1Time, setP1Time] = useState<number>(0);
  const [p2Time, setP2Time] = useState<number>(0);
  const [phase, setPhase] = useState<'answering' | 'result'>('answering');
  const [resultMsg, setResultMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(12);
  const roundStartRef = useRef(Date.now());
  const timerRef = useRef<number | null>(null);
  const lockRef = useRef(false);

  const q = useMemo(() => questions[currentIdx], [questions, currentIdx]);
  const options = useMemo(() => q.options?.slice(0, 4) || [], [q]);
  const correctIdx = useMemo(() => options.findIndex(o => o.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()), [options, q]);
  const depthPerQ = MAX_DEPTH / questions.length;

  // Reset round
  useEffect(() => {
    setP1Answer(null);
    setP2Answer(null);
    setP1Time(0);
    setP2Time(0);
    setPhase('answering');
    setResultMsg('');
    setTimeLeft(12);
    roundStartRef.current = Date.now();
    lockRef.current = false;

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx]);

  const resolveRound = useCallback((a1: number | null, a2: number | null) => {
    if (lockRef.current) return;
    lockRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const p1Correct = a1 === correctIdx;
    const p2Correct = a2 === correctIdx;
    let msg = '';

    if (p1Correct) {
      setP1Depth(prev => Math.min(MAX_DEPTH, prev + depthPerQ));
      setP1Score(prev => prev + 200);
    }
    if (p2Correct) {
      setP2Depth(prev => Math.min(MAX_DEPTH, prev + depthPerQ));
      setP2Score(prev => prev + 200);
    }

    if (p1Correct && !p2Correct) msg = '🟢 Đội 1 đào sâu hơn! 💪';
    else if (!p1Correct && p2Correct) msg = '🔵 Đội 2 đào sâu hơn! 💪';
    else if (p1Correct && p2Correct) msg = '⛏️ Cả hai cùng đào! Neck & neck! 🤝';
    else msg = '😅 Cả hai đều trượt! Đất quá cứng!';

    setResultMsg(msg);
    setPhase('result');
  }, [correctIdx, depthPerQ]);

  // Check both answered
  useEffect(() => {
    if (phase !== 'answering') return;
    if (p1Answer !== null && p2Answer !== null) {
      setTimeout(() => resolveRound(p1Answer, p2Answer), 300);
    }
  }, [p1Answer, p2Answer, phase]);

  // Timeout
  useEffect(() => {
    if (timeLeft === 0 && phase === 'answering') {
      resolveRound(p1Answer, p2Answer);
    }
  }, [timeLeft, phase]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase === 'result') {
        if (e.code === 'Space') nextQuestion();
        return;
      }
      const key = e.key.toLowerCase();
      const now = Date.now() - roundStartRef.current;

      if (key in P1_KEYS && p1Answer === null) {
        e.preventDefault();
        setP1Answer(P1_KEYS[key]);
        setP1Time(now);
      }
      if (key in P2_KEYS && p2Answer === null) {
        e.preventDefault();
        setP2Answer(P2_KEYS[key]);
        setP2Time(now);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, p1Answer, p2Answer]);

  const handleP1Touch = (idx: number) => {
    if (phase !== 'answering' || p1Answer !== null) return;
    setP1Answer(idx);
    setP1Time(Date.now() - roundStartRef.current);
  };

  const handleP2Touch = (idx: number) => {
    if (phase !== 'answering' || p2Answer !== null) return;
    setP2Answer(idx);
    setP2Time(Date.now() - roundStartRef.current);
  };

  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      const bonus = p1Depth > p2Depth ? 500 : 0;
      onFinish(p1Score + bonus, 0);
    }
  }, [currentIdx, questions.length, p1Score, p1Depth, p2Depth, onFinish]);

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full py-3 relative animate-content">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 bg-white p-2.5 px-4 rounded-xl border border-slate-100 shadow-sm">
        <button onClick={onBack} className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors" title="Thoát">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-center">
          <p className="text-[7px] font-black text-orange-600 uppercase tracking-widest">⛏️ Đào hố — 2 Đội</p>
          <span className="text-[10px] font-bold text-slate-600">Câu {currentIdx + 1}/{questions.length}</span>
        </div>
        <div className={`bg-orange-50 px-3 py-1 rounded-full`}>
          <span className={`text-[10px] font-bold ${timeLeft <= 3 ? 'text-rose-600 animate-pulse' : 'text-orange-600'}`}>⏱️ {timeLeft}s</span>
        </div>
      </div>

      {/* Dig Visualization */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 mb-3">
        <div className="flex gap-4 justify-center items-end" style={{ height: 120 }}>
          {/* P1 Pit */}
          <div className="flex flex-col items-center flex-1 max-w-[100px]">
            <span className="text-[8px] font-black text-emerald-600 mb-1">🟢 ĐỘI 1</span>
            <div className="w-full bg-slate-100 rounded-b-xl relative overflow-hidden" style={{ height: 90 }}>
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-amber-800 via-amber-600 to-amber-400 rounded-b-xl transition-all duration-700" style={{ height: `${p1Depth}%` }}>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px]">⛏️</div>
              </div>
              {[25, 50, 75].map(d => (
                <div key={d} className="absolute w-full border-t border-dashed border-slate-200" style={{ bottom: `${d}%` }}></div>
              ))}
            </div>
            <span className="text-[9px] font-black text-amber-700 mt-1 tabular-nums">{Math.round(p1Depth)}m | {p1Score}pts</span>
          </div>

          <div className="flex flex-col items-center justify-center pb-8">
            <span className="text-[7px] font-black text-slate-300 uppercase">vs</span>
          </div>

          {/* P2 Pit */}
          <div className="flex flex-col items-center flex-1 max-w-[100px]">
            <span className="text-[8px] font-black text-blue-600 mb-1">🔵 ĐỘI 2</span>
            <div className="w-full bg-slate-100 rounded-b-xl relative overflow-hidden" style={{ height: 90 }}>
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-800 via-blue-600 to-blue-400 rounded-b-xl transition-all duration-700" style={{ height: `${p2Depth}%` }}>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px]">⛏️</div>
              </div>
              {[25, 50, 75].map(d => (
                <div key={d} className="absolute w-full border-t border-dashed border-slate-200" style={{ bottom: `${d}%` }}></div>
              ))}
            </div>
            <span className="text-[9px] font-black text-blue-700 mt-1 tabular-nums">{Math.round(p2Depth)}m | {p2Score}pts</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 mb-3 text-center shadow-sm">
        <span className="inline-block px-3 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[8px] font-bold uppercase tracking-wider mb-1">Câu hỏi</span>
        <h2 className="text-sm font-semibold text-slate-800 leading-relaxed">{q.content}</h2>
      </div>

      {/* Split Answer Panels */}
      <div className="flex-1 grid grid-cols-2 gap-3">
        {/* P1 Panel */}
        <div className={`rounded-xl border-2 p-3 transition-all ${p1Answer !== null ? 'border-emerald-300 bg-emerald-50/50' : 'border-emerald-200 bg-white'}`}>
          <div className="text-center mb-2">
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">🟢 Đội 1</span>
            <p className="text-[7px] font-bold text-slate-400 mt-0.5">Phím: A S D F</p>
            {p1Answer !== null && <span className="text-[8px] font-bold text-emerald-500">✓ Đã chọn!</span>}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {options.map((o, i) => (
              <button key={i} onClick={() => handleP1Touch(i)} disabled={p1Answer !== null || phase !== 'answering'}
                className={`p-2 rounded-lg text-left flex items-center gap-2 transition-all text-[11px] font-medium active:scale-95 ${
                  p1Answer === i
                    ? (phase === 'result' ? (i === correctIdx ? 'bg-emerald-200 border-emerald-400 border-2' : 'bg-rose-200 border-rose-400 border-2') : 'bg-emerald-100 border-emerald-300 border-2')
                    : p1Answer !== null ? 'opacity-40 bg-slate-50 border border-slate-100' : 'bg-emerald-50 border border-emerald-100 hover:border-emerald-400 hover:bg-emerald-100'
                }`}>
                <span className="w-5 h-5 bg-white text-emerald-600 rounded flex items-center justify-center font-black text-[9px] shrink-0 border border-emerald-200">{KEY_LABELS_P1[i]}</span>
                <span className="text-slate-700 line-clamp-1">{o}</span>
              </button>
            ))}
          </div>
        </div>

        {/* P2 Panel */}
        <div className={`rounded-xl border-2 p-3 transition-all ${p2Answer !== null ? 'border-blue-300 bg-blue-50/50' : 'border-blue-200 bg-white'}`}>
          <div className="text-center mb-2">
            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">🔵 Đội 2</span>
            <p className="text-[7px] font-bold text-slate-400 mt-0.5">Phím: K L ; '</p>
            {p2Answer !== null && <span className="text-[8px] font-bold text-blue-500">✓ Đã chọn!</span>}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {options.map((o, i) => (
              <button key={i} onClick={() => handleP2Touch(i)} disabled={p2Answer !== null || phase !== 'answering'}
                className={`p-2 rounded-lg text-left flex items-center gap-2 transition-all text-[11px] font-medium active:scale-95 ${
                  p2Answer === i
                    ? (phase === 'result' ? (i === correctIdx ? 'bg-blue-200 border-blue-400 border-2' : 'bg-rose-200 border-rose-400 border-2') : 'bg-blue-100 border-blue-300 border-2')
                    : p2Answer !== null ? 'opacity-40 bg-slate-50 border border-slate-100' : 'bg-blue-50 border border-blue-100 hover:border-blue-400 hover:bg-blue-100'
                }`}>
                <span className="w-5 h-5 bg-white text-blue-600 rounded flex items-center justify-center font-black text-[9px] shrink-0 border border-blue-200">{KEY_LABELS_P2[i]}</span>
                <span className="text-slate-700 line-clamp-1">{o}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      {phase === 'result' && (
        <div className="mt-3 bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm font-bold text-slate-800 mb-1">{resultMsg}</p>
          <p className="text-[9px] text-slate-400 mb-2">Đáp án đúng: <span className="font-bold text-emerald-600">{q.correctAnswer}</span></p>
          {q.explanation && <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">{q.explanation}</p>}
          <button onClick={nextQuestion} className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-orange-700 transition-all active:scale-95 shadow-md">
            {currentIdx < questions.length - 1 ? 'Câu tiếp theo (Space)' : 'Xem kết quả'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DigDuelMode;
