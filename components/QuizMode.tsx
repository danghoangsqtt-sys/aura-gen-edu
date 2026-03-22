import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Question } from '../types';
import GameFeedback from './GameFeedback';
import GameTimer, { GameTimerHandle } from './GameTimer';

interface QuizModeProps {
  questions: Question[];
  playerName: string;
  onFinish: (score: number, streak: number) => void;
  onBack: () => void;
}

const QuizMode: React.FC<QuizModeProps> = ({ questions, playerName, onFinish, onBack }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{correct: boolean, msg: string, explanation?: string} | null>(null);
  
  const timerRef = useRef<GameTimerHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  useEffect(() => {
    console.info('[Gamification] -> [Action]: Game started (Quiz Mode). Timer initialized.');
  }, []);

  const nextQuestion = useCallback(() => {
    setFeedback(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      timerRef.current?.reset(15);
    } else {
      onFinish(score, streak);
    }
  }, [currentIdx, questions.length, onFinish, score, streak]);

  const handleAnswer = useCallback((answer: string) => {
    if (feedback) return;
    const isCorrect = answer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
    
    const remainingTime = timerRef.current?.getValue() || 0;

    if (isCorrect) {
      const bonus = Math.floor(remainingTime * 10 + streak * 20);
      setScore(prev => prev + 100 + bonus);
      setStreak(prev => prev + 1);
      setFeedback({ correct: true, msg: "Bạn làm rất tốt!", explanation: q.explanation });
      // No auto-advance — let user read explanation and click "Tiếp tục ngay"
      timerRef.current?.stop();
    } else {
      setStreak(0);
      setFeedback({ correct: false, msg: `Đáp án: ${q.correctAnswer}`, explanation: q.explanation });
      timerRef.current?.stop();
    }
  }, [feedback, q, nextQuestion, streak]);

  const onTimeUp = useCallback(() => {
    if (!feedback) {
        handleAnswer("");
    }
  }, [feedback, handleAnswer]);

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full py-4 relative animate-content">
      {feedback && <GameFeedback isCorrect={feedback.correct} message={feedback.msg} explanation={feedback.explanation} onNext={nextQuestion} />}
      
      <div className="flex justify-between items-center mb-4 bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors mr-1">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
          </button>
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-slate-200">{currentIdx + 1}</div>
          <div className="hidden sm:block">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Chiến binh</p>
            <span className="text-[10px] font-black text-slate-700">{playerName}</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SCORE</p>
            <p className="text-base font-bold text-indigo-600 tabular-nums">{score}</p>
          </div>
          <GameTimer 
            ref={timerRef}
            initialValue={15}
            type="time"
            intervalMs={1000}
            decrement={1}
            onEnd={onTimeUp}
            className="w-24"
            barColor="bg-indigo-500"
            showSeconds={true}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl text-center w-full border-b-4 border-slate-100 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white rounded-full text-[8px] font-bold uppercase tracking-wider shadow-md shadow-indigo-100">QUIZ ARENA</span>
          <p className="text-base font-bold text-slate-800 leading-snug">{q.content}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full">
          {q.options?.map((o, i) => (
            <button key={i} onClick={() => handleAnswer(o)} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left flex items-center gap-3 group active:scale-95 shadow-sm">
              <span className="w-7 h-7 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">{String.fromCharCode(65 + i)}</span>
              <span className="text-xs font-semibold text-slate-700">{o}</span>
            </button>
          )) || (
            <div className="w-full animate-in fade-in slide-in-from-bottom-2">
              <input 
                ref={inputRef}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAnswer((e.target as HTMLInputElement).value)} 
                className="w-full bg-white border-2 border-slate-100 p-3 rounded-xl text-sm font-bold text-center outline-none focus:border-indigo-500 shadow-sm transition-all uppercase placeholder:text-slate-200" 
                placeholder="Câu trả lời của bạn..." 
              />
              <p className="text-center mt-2 text-[8px] font-semibold text-slate-400 uppercase tracking-wider">Nhấn <span className="text-indigo-600">Enter</span> để xác nhận</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizMode;
