import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Question } from '../types';
import GameFeedback from './GameFeedback';

interface SurvivalModeProps {
  questions: Question[];
  playerName: string;
  onFinish: (score: number, streak: number) => void;
  onBack: () => void;
}

type PowerUp = 'star' | 'potion' | null;

const SurvivalMode: React.FC<SurvivalModeProps> = ({ questions, playerName, onFinish, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hp, setHp] = useState(100);
  const [feedback, setFeedback] = useState<{correct: boolean, msg: string, explanation?: string} | null>(null);
  
  // Power-up system
  const [showPowerUpChoice, setShowPowerUpChoice] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<PowerUp>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const q = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  useEffect(() => {
    console.info('[Gamification] -> [Action]: Game started (Survival Mode). HP: 100');
  }, []);

  // Check if it's time for a power-up (every 3 questions, before showing next question)
  const maybeShowPowerUp = useCallback((answered: number) => {
    if (answered > 0 && answered % 3 === 0) {
      setShowPowerUpChoice(true);
    }
  }, []);

  const selectPowerUp = (choice: PowerUp) => {
    setActivePowerUp(choice);
    setShowPowerUpChoice(false);
  };

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onFinish(score, streak);
    }
  }, [currentIdx, questions.length, onFinish, score, streak]);

  const handleAnswer = useCallback((answer: string) => {
    if (feedback || showPowerUpChoice) return;
    const isCorrect = answer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
    const newAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newAnswered);
    
    if (isCorrect) {
      let pointsGained = 250;
      let feedbackMsg = '+250 🎯';

      // Apply active power-up
      if (activePowerUp === 'star') {
        // x2 current score
        const bonus = score; // Double current total
        setScore(prev => prev + pointsGained + bonus);
        feedbackMsg = `⭐ x2 SCORE! +${pointsGained + bonus}`;
      } else if (activePowerUp === 'potion') {
        // +30 HP restored
        setHp(prev => Math.min(100, prev + 30));
        setScore(prev => prev + pointsGained);
        feedbackMsg = `🧪 +30HP & +${pointsGained}`;
      } else {
        setScore(prev => prev + pointsGained);
      }

      setStreak(prev => prev + 1);
      setActivePowerUp(null);
      setFeedback({ correct: true, msg: feedbackMsg, explanation: q.explanation });

      // Schedule power-up check after feedback is dismissed
      if (newAnswered % 3 === 0) {
        // Will show power-up after user clicks "Tiếp tục"
      }
    } else {
      const newHp = hp - 30;
      setHp(Math.max(0, newHp));
      setStreak(0);
      setActivePowerUp(null); // Lose power-up on wrong answer
      
      if (newHp <= 0) {
        setFeedback({ correct: false, msg: '💀 HP = 0 — GAME OVER!', explanation: q.explanation });
      } else {
        setFeedback({ correct: false, msg: `-30HP 💔 (còn ${Math.max(0, newHp)} HP)`, explanation: q.explanation });
      }
    }
  }, [feedback, showPowerUpChoice, q, score, hp, activePowerUp, questionsAnswered]);

  // Override nextQuestion to check for game over and power-ups
  const handleNext = useCallback(() => {
    if (hp <= 0) {
      onFinish(score, streak);
      return;
    }
    setFeedback(null);
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      // Show power-up choice every 3 questions
      if (questionsAnswered > 0 && questionsAnswered % 3 === 0 && !activePowerUp) {
        setShowPowerUpChoice(true);
      }
    } else {
      onFinish(score, streak);
    }
  }, [hp, currentIdx, questions.length, onFinish, score, streak, questionsAnswered, activePowerUp]);

  // HP bar color
  const hpColor = hp > 60 ? 'bg-emerald-500' : hp > 30 ? 'bg-amber-500' : 'bg-rose-500';
  const hpGlow = hp > 60 ? 'shadow-emerald-200' : hp > 30 ? 'shadow-amber-200' : 'shadow-rose-200';

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full py-4 relative animate-content">
      {/* Game Feedback Overlay */}
      {feedback && <GameFeedback isCorrect={feedback.correct} message={feedback.msg} explanation={feedback.explanation} onNext={handleNext} />}
      
      {/* Power-Up Choice Modal */}
      {showPowerUpChoice && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="max-w-sm w-full p-6 rounded-3xl shadow-2xl bg-white border-t-8 border-amber-400">
            <div className="text-center mb-5">
              <div className="text-3xl mb-2 animate-bounce">🎁</div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Phần thưởng đặc biệt!</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Chọn 1 buff cho câu tiếp theo</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Star of Hope */}
              <button 
                onClick={() => selectPowerUp('star')}
                className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100 transition-all active:scale-95 group text-center"
              >
                <div className="text-3xl mb-2 group-hover:scale-125 transition-transform">⭐</div>
                <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Ngôi Sao Hy Vọng</h4>
                <p className="text-[8px] font-bold text-amber-500 mt-1 leading-tight">x2 tổng điểm hiện tại nếu trả lời đúng</p>
              </button>
              {/* HP Potion */}
              <button 
                onClick={() => selectPowerUp('potion')}
                className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100 transition-all active:scale-95 group text-center"
              >
                <div className="text-3xl mb-2 group-hover:scale-125 transition-transform">🧪</div>
                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Bình Hồi HP</h4>
                <p className="text-[8px] font-bold text-emerald-500 mt-1 leading-tight">+30 HP nếu trả lời đúng câu này</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-4 mb-4">
         <button onClick={onBack} className="p-2 hover:bg-rose-50 rounded-xl text-rose-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
         <div className="text-center flex flex-col">
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Sinh mệnh chiến binh</span>
            <span className="text-[10px] font-black text-slate-700">{playerName}</span>
         </div>
         <div className="text-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Câu</span>
            <span className="text-sm font-black text-slate-700 block">{currentIdx + 1}/{questions.length}</span>
         </div>
      </div>

      {/* HP Bar — Static 100 HP, no auto-decay */}
      <div className="mb-4 px-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            HP
          </span>
          <span className="text-[10px] font-black text-slate-600 tabular-nums">{hp}/100</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
          <div 
            className={`h-full ${hpColor} rounded-full transition-all duration-500 ease-out shadow-md ${hpGlow}`}
            style={{ width: `${hp}%` }}
          ></div>
          {/* HP segments (25% markers) */}
          <div className="absolute inset-0 flex">
            {[25, 50, 75].map(pct => (
              <div key={pct} className="h-full border-r border-white/30" style={{ width: '25%' }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Power-up Indicator */}
      {activePowerUp && (
        <div className={`mx-4 mb-3 px-3 py-2 rounded-xl text-center text-[9px] font-black uppercase tracking-widest animate-pulse ${
          activePowerUp === 'star' 
            ? 'bg-amber-50 text-amber-600 border border-amber-200' 
            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
        }`}>
          {activePowerUp === 'star' ? '⭐ NGÔI SAO HY VỌNG đang kích hoạt — x2 điểm nếu đúng!' : '🧪 BÌNH HỒI HP đang kích hoạt — +30 HP nếu đúng!'}
        </div>
      )}

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-md shadow-rose-100/20 border border-rose-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
           <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
        </div>
        
        <div className="text-center space-y-4 relative z-10 w-full">
          <span className="inline-block px-4 py-1 bg-rose-600 text-white rounded-full text-[9px] font-bold uppercase tracking-wider shadow-md shadow-rose-200">LAST STAND</span>
          <h2 className="text-base font-bold text-slate-800 leading-tight animate-in slide-in-from-top-4">
            {q.content}
          </h2>

          <div className="grid grid-cols-1 gap-2.5 w-full max-w-md mx-auto">
            {q.options?.map((o, i) => (
              <button key={i} onClick={() => handleAnswer(o)} className="bg-white p-3 rounded-xl border-2 border-slate-50 hover:border-rose-500 hover:bg-rose-50 transition-all text-left flex items-center gap-3 group active:scale-95 shadow-sm">
                <span className="w-7 h-7 bg-slate-50 text-rose-500 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">{i + 1}</span>
                <span className="text-xs font-semibold text-slate-700">{o}</span>
              </button>
            )) || (
               <div className="w-full relative px-2 animate-in fade-in slide-in-from-bottom-2">
                 <input 
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAnswer((e.target as HTMLInputElement).value)} 
                  className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl text-sm font-bold text-center focus:border-rose-500 focus:bg-white transition-all outline-none shadow-inner" 
                  placeholder="NHẬP NGAY ĐỂ SỐNG..." 
                />
                <p className="text-center mt-2 text-[8px] font-semibold text-rose-400 uppercase tracking-wider">Cảnh báo: Sai lầm sẽ phải trả giá bằng HP!</p>
               </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Score Footer */}
      <div className="mt-4 flex justify-center gap-6">
         <div className="text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Thành tích</p>
            <p className="text-lg font-bold text-slate-800 tabular-nums">{score}</p>
         </div>
         <div className="text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Combo</p>
            <p className="text-lg font-bold text-rose-600 tabular-nums">{streak}</p>
         </div>
         <div className="text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Đã trả lời</p>
            <p className="text-lg font-bold text-indigo-600 tabular-nums">{questionsAnswered}</p>
         </div>
      </div>
    </div>
  );
};

export default SurvivalMode;
