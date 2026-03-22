import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Question } from '../types';
import GameFeedback from './GameFeedback';
import GameTimer, { GameTimerHandle } from './GameTimer';

interface BlitzModeProps {
  questions: Question[];
  playerName: string;
  onFinish: (score: number, streak: number) => void;
  onBack: () => void;
}

const BASE_TIME = 500; // 500 ticks at 10ms = 5 seconds

const BlitzMode: React.FC<BlitzModeProps> = ({ questions, playerName, onFinish, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [goldBolts, setGoldBolts] = useState(0);
  const [purpleBolts, setPurpleBolts] = useState(0);
  const [feedback, setFeedback] = useState<{correct: boolean, msg: string, explanation?: string} | null>(null);
  const [showBoltEffect, setShowBoltEffect] = useState<'gold' | 'purple' | null>(null);
  
  const timerRef = useRef<GameTimerHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const q = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  // Calculate effective time based on purple bolts (-6% each)
  const getEffectiveTime = useCallback((purpleCount: number) => {
    const penalty = purpleCount * 0.06; // 6% per purple bolt
    return Math.max(Math.floor(BASE_TIME * (1 - penalty)), 100); // Minimum 1 second
  }, []);

  useEffect(() => {
    console.info('[Gamification] -> [Action]: Game started (Blitz Mode).');
  }, []);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      timerRef.current?.reset(getEffectiveTime(purpleBolts));
    } else {
      onFinish(score, streak);
    }
  }, [currentIdx, questions.length, onFinish, score, streak, purpleBolts, getEffectiveTime]);

  const handleAnswer = useCallback((answer: string) => {
    if (feedback) return;
    const isCorrect = answer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
    
    const remainingTime = timerRef.current?.getValue() || 0;

    if (isCorrect) {
      const speedBonus = Math.floor(remainingTime * 2);
      const totalPoints = 200 + speedBonus;
      const newStreak = streak + 1;
      
      setScore(prev => prev + totalPoints);
      setStreak(newStreak);

      let boltMsg = '';
      if (newStreak % 3 === 0) {
        setGoldBolts(prev => prev + 1);
        boltMsg = ' | ⚡ +1 Tia Sét!';
        
        // Gold bolt: extend current timer by 2%
        const bonus = Math.floor(BASE_TIME * 0.02);
        timerRef.current?.addValue(bonus);
        setShowBoltEffect('gold');
        setTimeout(() => setShowBoltEffect(null), 800);
      }

      setFeedback({ correct: true, msg: `+${totalPoints} điểm${boltMsg}`, explanation: q.explanation });
      timerRef.current?.stop();
    } else {
      setStreak(0);
      setFeedback({ correct: false, msg: `Đáp án: ${q.correctAnswer}`, explanation: q.explanation });
      timerRef.current?.stop();
    }
  }, [feedback, q, streak]);

  // Timeout handler — purple bolt penalty
  const onTimeUp = useCallback(() => {
    if (!feedback) {
      const newPurple = purpleBolts + 1;
      setPurpleBolts(newPurple);
      setStreak(0);
      setScore(prev => Math.max(0, prev - 100));
      
      setShowBoltEffect('purple');
      setTimeout(() => setShowBoltEffect(null), 800);
      
      const nextTimePct = Math.round((1 - newPurple * 0.06) * 100);
      setFeedback({ 
        correct: false, 
        msg: `⏱️ Hết giờ! -100 điểm | 💜 Tia sét tím +1 (thời gian giảm còn ${Math.max(nextTimePct, 20)}%)`, 
        explanation: q.explanation 
      });
      timerRef.current?.stop();
    }
  }, [feedback, purpleBolts, q]);

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full py-4 relative animate-content">
      {/* Feedback Overlay */}
      {feedback && <GameFeedback isCorrect={feedback.correct} message={feedback.msg} explanation={feedback.explanation} onNext={nextQuestion} />}

      {/* Bolt Flash Effect */}
      {showBoltEffect && (
        <div className={`absolute inset-0 z-[70] pointer-events-none animate-in fade-in zoom-in duration-200 ${
          showBoltEffect === 'gold' ? 'bg-amber-400/15' : 'bg-purple-500/15'
        }`} />
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-md shadow-amber-100">
              {currentIdx + 1}
            </div>
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Câu hỏi</p>
              <span className="text-[10px] font-bold text-slate-600">{currentIdx + 1} / {questions.length}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          {/* Gold Bolts */}
          <div className="text-center" title="Tia sét vàng: +2% thời gian mỗi 3 câu đúng liên tiếp">
            <div className="flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-[10px] font-black text-amber-600 tabular-nums">{goldBolts}</span>
            </div>
          </div>

          {/* Purple Bolts */}
          <div className="text-center" title="Tia sét tím: -6% thời gian mỗi lần hết giờ">
            <div className="flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-[10px] font-black text-purple-600 tabular-nums">{purpleBolts}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-100"></div>

          {/* Score & Streak */}
          <div className="text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Điểm</p>
            <p className="text-sm font-bold text-indigo-600 tabular-nums leading-none">{score}</p>
          </div>
          <div className="text-center min-w-[28px]">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Combo</p>
            <p className={`text-sm font-bold tabular-nums leading-none ${streak >= 3 ? 'text-amber-500' : 'text-slate-600'}`}>{streak}</p>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="mb-3 px-1">
        <GameTimer 
          ref={timerRef}
          initialValue={getEffectiveTime(purpleBolts)} 
          type="time" 
          intervalMs={10} 
          decrement={1} 
          onEnd={onTimeUp}
          barColor={purpleBolts > 0 ? "bg-gradient-to-r from-purple-400 to-amber-400" : "bg-gradient-to-r from-amber-400 to-orange-500"}
          className=""
        />
        {purpleBolts > 0 && (
          <p className="text-[8px] font-bold text-purple-500 text-right mt-0.5 tabular-nums">
            Thời gian: {Math.max(Math.round((1 - purpleBolts * 0.06) * 100), 20)}%
          </p>
        )}
      </div>

      {/* Streak milestone */}
      {streak > 0 && (
        <div className="mx-4 mb-3 flex items-center justify-center gap-2">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
            streak >= 3 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'text-slate-300'
          }`}>
            {streak >= 3 
              ? `🔥 ${streak} combo! (${3 - (streak % 3) || 3} câu nữa = ⚡)`
              : `${3 - streak} câu đúng nữa → ⚡`
            }
          </span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>
      )}

      {/* Question Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 bg-white rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-3 right-3 opacity-5">
          <svg className="w-16 h-16 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        
        <div className="text-center space-y-5 relative z-10 w-full">
          <span className="inline-block px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-[8px] font-bold uppercase tracking-wider shadow-md shadow-amber-100">
            ⚡ Phản xạ tia chớp
          </span>
          <h2 className="text-base font-semibold text-slate-800 leading-relaxed">
            {q.content}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-lg mx-auto">
            {q.options?.slice(0, 4).map((o, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(o)} 
                className="bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-amber-400 hover:bg-amber-50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left flex items-center gap-3 group active:scale-95"
              >
                <span className="w-7 h-7 bg-white text-slate-400 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm border border-slate-100 group-hover:border-amber-400">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-xs font-medium text-slate-700">{o}</span>
              </button>
            )) || (
               <div className="w-full relative px-2 col-span-2 animate-in fade-in slide-in-from-bottom-2">
                  <input 
                    ref={inputRef}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleAnswer((e.target as HTMLInputElement).value)} 
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold text-center outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-200" 
                    placeholder="Nhập câu trả lời..." 
                  />
                  <p className="text-center mt-2 text-[8px] font-semibold text-slate-400 tracking-wider">
                    Nhấn <span className="text-amber-600 font-bold">Enter</span> để xác nhận
                  </p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlitzMode;
