
import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import GameFeedback from './GameFeedback';

interface ScrambleModeProps {
  questions: Question[];
  playerName: string;
  onFinish: (score: number, streak: number) => void;
  onBack: () => void;
}

const ScrambleMode: React.FC<ScrambleModeProps> = ({ questions, playerName, onFinish, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [feedback, setFeedback] = useState<{correct: boolean, msg: string, explanation?: string} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const rawQ = questions[currentIdx];
  // Sử dụng useMemo hoặc state để tránh xáo trộn lại mỗi khi gõ phím
  const [scrambled, setScrambled] = useState('');

  useEffect(() => {
    if (rawQ) {
      setScrambled(rawQ.correctAnswer.split('').sort(() => Math.random() - 0.5).join(''));
    }
  }, [currentIdx, rawQ]);

  useEffect(() => {
    let timer: number;
    if (timeLeft > 0 && !feedback) {
      timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !feedback) {
      handleAnswer("");
    }
    return () => clearInterval(timer);
  }, [timeLeft, feedback]);

  const handleAnswer = (answer: string) => {
    if (feedback) return;
    const isCorrect = answer.toLowerCase().trim() === rawQ.correctAnswer.toLowerCase().trim();
    if (isCorrect) {
      setScore(prev => prev + 150 + timeLeft * 5);
      setStreak(prev => prev + 1);
      setFeedback({ correct: true, msg: "Giải mã thành công!", explanation: rawQ.explanation });
    } else {
      setStreak(0);
      setFeedback({ correct: false, msg: `Gợi ý: ${rawQ.correctAnswer}`, explanation: rawQ.explanation });
    }
  };

  const nextQuestion = () => {
    setFeedback(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setTimeLeft(20);
    } else {
      onFinish(score, streak);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full py-4 relative animate-content">
      {feedback && <GameFeedback isCorrect={feedback.correct} message={feedback.msg} explanation={feedback.explanation} onNext={nextQuestion} />}
      
      <div className="flex justify-between items-center mb-4 bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors mr-1">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
          </button>
          <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-100">{currentIdx + 1}</div>
          <div className="hidden sm:block">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Cipher Hunter</p>
            <span className="text-[10px] font-black text-slate-700">{playerName}</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SCORE</p>
            <p className="text-base font-bold text-slate-900 tabular-nums">{score}</p>
          </div>
          <div className="w-10 h-10 rounded-xl border-2 border-emerald-500 text-emerald-600 flex items-center justify-center font-black text-sm">{timeLeft}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="bg-emerald-50 p-4 rounded-xl text-center w-full border-b-4 border-emerald-100 relative shadow-sm">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white rounded-full text-[8px] font-bold uppercase tracking-wider shadow-md shadow-emerald-100">PUZZLE QUEST</span>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Mật mã gốc:</p>
          <p className="text-base font-semibold text-slate-700 italic leading-snug mb-4">{rawQ.content}</p>
          
          <div className="flex flex-wrap justify-center gap-2">
            {scrambled.split('').map((c, i) => (
              <div key={i} className="w-7 h-9 bg-white rounded-lg flex items-center justify-center text-base font-bold text-emerald-600 border border-emerald-100 shadow-sm uppercase animate-in zoom-in duration-300" style={{ animationDelay: `${i * 50}ms` }}>{c}</div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2">
          <input 
            ref={inputRef}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAnswer((e.target as HTMLInputElement).value)} 
            className="w-full bg-white border-2 border-slate-100 p-3 rounded-xl text-sm font-bold text-center outline-none focus:border-emerald-500 shadow-sm transition-all uppercase tracking-wider placeholder:text-slate-100" 
            placeholder="Giải mật mã..." 
          />
          <p className="text-center mt-2 text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Gợi ý: Kiểm tra kỹ các ký tự ở trên!</p>
        </div>
      </div>
    </div>
  );
};

export default ScrambleMode;
