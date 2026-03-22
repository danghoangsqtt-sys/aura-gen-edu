import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Question } from '../types';

interface GoldMinerModeProps {
  questions: Question[];
  playerName: string;
  onFinish: (score: number, streak: number) => void;
  onBack: () => void;
}

interface Nugget {
  id: number;
  text: string;
  isCorrect: boolean;
  x: number; // percentage position
  state: 'gold' | 'stone' | 'grabbed' | 'idle';
}

const GoldMinerMode: React.FC<GoldMinerModeProps> = ({ questions, playerName, onFinish, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [grenades, setGrenades] = useState(0);
  const [clawX, setClawX] = useState(50); // horizontal position %
  const [clawY, setClawY] = useState(0); // vertical arc offset px
  const [clawState, setClawState] = useState<'swinging' | 'dropping' | 'result'>('swinging');
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [grabbedNugget, setGrabbedNugget] = useState<Nugget | null>(null);
  const [resultMsg, setResultMsg] = useState<{text: string, correct: boolean} | null>(null);
  const [canUseGrenade, setCanUseGrenade] = useState(false);
  const animRef = useRef<number | null>(null);
  const angleRef = useRef(0); // Pendulum angle in radians
  const containerRef = useRef<HTMLDivElement>(null);

  const q = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  // Generate nuggets for current question
  useEffect(() => {
    if (!q.options || q.options.length === 0) {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        onFinish(score, streak);
      }
      return;
    }

    const opts = q.options.slice(0, 4);
    const spacing = 100 / (opts.length + 1);
    const newNuggets: Nugget[] = opts.map((opt, i) => ({
      id: i,
      text: opt,
      isCorrect: opt.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim(),
      x: spacing * (i + 1),
      state: 'idle' as const,
    }));
    setNuggets(newNuggets);
    setClawState('swinging');
    setGrabbedNugget(null);
    setResultMsg(null);
    setCanUseGrenade(false);
  }, [currentIdx, q]);

  // Claw arc/pendulum animation — smooth sine wave from right to left
  useEffect(() => {
    if (clawState !== 'swinging') return;
    
    const speed = 0.018; // Angular speed (radians per frame)
    const arcRadius = 38; // Horizontal swing range (% from center)
    const arcDepth = 30; // Vertical arc depth (px)
    
    const animate = () => {
      angleRef.current += speed;
      const sin = Math.sin(angleRef.current);
      const cos = Math.cos(angleRef.current);
      
      // X follows sine: swings left-right centered at 50%
      const x = 50 + sin * arcRadius;
      // Y follows arc: lowest at edges, highest at center (inverted cosine)
      const y = (1 - Math.abs(cos)) * arcDepth;
      
      setClawX(x);
      setClawY(y);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [clawState]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (clawState === 'swinging') dropClaw();
        else if (canUseGrenade && grenades > 0) useGrenade();
        else if (clawState === 'result') nextQuestion();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [clawState, canUseGrenade, grenades]);

  const dropClaw = useCallback(() => {
    if (clawState !== 'swinging') return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setClawState('dropping');

    // Find closest nugget
    let closest: Nugget | null = null;
    let minDist = Infinity;
    for (const n of nuggets) {
      if (n.state !== 'idle') continue;
      const dist = Math.abs(n.x - clawX);
      if (dist < minDist && dist < 12) { // Must be within 12% to grab
        minDist = dist;
        closest = n;
      }
    }

    setTimeout(() => {
      if (closest) {
        setGrabbedNugget(closest);
        
        if (closest.isCorrect) {
          // Gold!
          setNuggets(prev => prev.map(n => n.id === closest!.id ? { ...n, state: 'grabbed' } : n));
          setScore(prev => prev + 300);
          const newStreak = streak + 1;
          setStreak(newStreak);
          setResultMsg({ text: `🥇 Vàng thật! +300 điểm!`, correct: true });
          
          // Earn grenade every 2 correct in a row
          if (newStreak % 2 === 0) {
            setGrenades(prev => prev + 1);
            setResultMsg({ text: `🥇 Vàng thật! +300 | 🧨 +1 Lựu đạn!`, correct: true });
          }
        } else {
          // Stone!
          setNuggets(prev => prev.map(n => n.id === closest!.id ? { ...n, state: 'stone' } : n));
          setStreak(0);
          setResultMsg({ text: `🪨 Đá! Đáp án sai!`, correct: false });
          
          // Allow grenade use if available
          if (grenades > 0) {
            setCanUseGrenade(true);
          }
        }
      } else {
        setResultMsg({ text: `🫧 Hụt! Không gắp được gì!`, correct: false });
        setStreak(0);
      }
      
      setClawState('result');
    }, 600);
  }, [clawState, clawX, nuggets, streak, grenades]);

  const useGrenade = useCallback(() => {
    if (grenades <= 0 || !canUseGrenade) return;
    setGrenades(prev => prev - 1);
    setCanUseGrenade(false);
    
    // Reset the wrong nugget — remove it and allow re-grab
    if (grabbedNugget) {
      setNuggets(prev => prev.map(n => n.id === grabbedNugget.id ? { ...n, state: 'idle' } : n));
    }
    setGrabbedNugget(null);
    setResultMsg(null);
    setClawState('swinging');
  }, [grenades, canUseGrenade, grabbedNugget]);

  const nextQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onFinish(score, streak);
    }
  }, [currentIdx, questions.length, onFinish, score, streak]);

  const handleContainerClick = () => {
    if (clawState === 'swinging') dropClaw();
    else if (clawState === 'result' && !canUseGrenade) nextQuestion();
  };

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full py-4 relative animate-content">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div>
            <p className="text-[7px] font-black text-yellow-600 uppercase tracking-widest">⛏️ Đào vàng</p>
            <span className="text-[10px] font-bold text-slate-600">Câu {currentIdx + 1}/{questions.length}</span>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <div className="text-center" title="Lựu đạn">
            <div className="flex items-center gap-1">
              <span className="text-sm">🧨</span>
              <span className="text-[10px] font-black text-orange-600 tabular-nums">{grenades}</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-100"></div>
          <div className="text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Điểm</p>
            <p className="text-sm font-bold text-yellow-600 tabular-nums">{score}</p>
          </div>
          <div className="text-center min-w-[28px]">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Combo</p>
            <p className={`text-sm font-bold tabular-nums ${streak >= 2 ? 'text-amber-500' : 'text-slate-600'}`}>{streak}</p>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 mb-3 text-center">
        <span className="inline-block px-3 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-[8px] font-bold uppercase tracking-wider mb-1.5">Câu hỏi</span>
        <h2 className="text-sm font-semibold text-slate-800 leading-relaxed">{q.content}</h2>
      </div>

      {/* Game Area */}
      <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className="flex-1 bg-gradient-to-b from-sky-100 via-sky-50 to-amber-100 rounded-xl border border-slate-200 relative overflow-hidden cursor-pointer select-none min-h-[260px]"
      >
        {/* Arc Track Guide */}
        <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 50" preserveAspectRatio="none">
            <path d="M 48 8 Q 200 45, 352 8" fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>
        {/* Pivot point */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-400 rounded-full z-30 border-2 border-slate-300 shadow-sm"></div>

        {/* Claw — follows arc path */}
        <div 
          className="absolute z-20"
          style={{ left: `${clawX}%`, top: `${8 + clawY}px`, transform: 'translateX(-50%)' }}
        >
          {/* Cable from pivot */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-px bg-slate-300" style={{ height: `${8 + clawY}px` }}></div>
          {/* Cable extending down */}
          <div className={`w-0.5 bg-slate-400 mx-auto transition-all duration-500 ${clawState === 'dropping' ? 'h-28' : 'h-4'}`}></div>
          {/* Claw arm */}
          <div className="relative flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 4 L16 12 L10 20 L8 18 L14 12 Z" />
              <path d="M16 4 L16 12 L22 20 L24 18 L18 12 Z" />
              <rect x="14" y="2" width="4" height="4" rx="1" />
            </svg>
          </div>
        </div>

        {/* Nuggets */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-around px-6">
          {nuggets.map(nugget => (
            <div 
              key={nugget.id}
              className={`flex flex-col items-center transition-all duration-300 ${
                nugget.state === 'grabbed' ? 'opacity-30 scale-75' : 
                nugget.state === 'stone' ? '' : 
                'hover:scale-105'
              }`}
              style={{ position: 'relative' }}
            >
              {/* Nugget visual */}
              <div className={`w-14 h-12 rounded-lg flex items-center justify-center text-2xl shadow-md transition-all ${
                nugget.state === 'stone' ? 'bg-slate-300 border-2 border-slate-400' :
                nugget.state === 'grabbed' ? 'bg-amber-200 border-2 border-amber-300' :
                'bg-gradient-to-br from-yellow-400 to-amber-500 border-2 border-amber-600 hover:shadow-lg'
              }`}>
                {nugget.state === 'stone' ? '🪨' : '🥇'}
              </div>
              {/* Label */}
              <div className={`mt-1.5 px-2 py-1 rounded-lg text-[9px] font-bold text-center max-w-[80px] leading-tight ${
                nugget.state === 'stone' ? 'bg-slate-200 text-slate-500 line-through' :
                nugget.state === 'grabbed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-white/80 text-slate-700 border border-slate-200'
              }`}>
                {nugget.text}
              </div>
            </div>
          ))}
        </div>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-300 to-amber-200"></div>

        {/* Result overlay */}
        {resultMsg && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className={`px-6 py-4 rounded-2xl shadow-xl text-center ${
              resultMsg.correct ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'
            } animate-in zoom-in duration-200`}>
              <p className="text-sm font-bold">{resultMsg.text}</p>
              {canUseGrenade && grenades > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); useGrenade(); }}
                  className="mt-2 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-[10px] font-bold hover:bg-orange-600 transition-all active:scale-95 animate-pulse"
                >
                  🧨 Dùng lựu đạn để gắp lại!
                </button>
              )}
              {(!canUseGrenade || grenades === 0) && (
                <p className="text-[8px] mt-2 opacity-70">Nhấn Space hoặc Click để tiếp tục</p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {clawState === 'swinging' && !resultMsg && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <div className="px-4 py-2 bg-white/90 rounded-full shadow-md text-[9px] font-bold text-slate-600 animate-pulse">
              Nhấn <span className="text-amber-600">Space</span> hoặc <span className="text-amber-600">Click</span> để thả móc!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldMinerMode;
