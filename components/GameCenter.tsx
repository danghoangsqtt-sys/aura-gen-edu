
import React, { useState, useEffect } from 'react';
import { Question, LeaderboardEntry, ExamPaper } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageAdapter';
import QuizMode from './QuizMode';
import GameRules from './GameRules';
import ScrambleMode from './ScrambleMode';
import BlitzMode from './BlitzMode';
import SurvivalMode from './SurvivalMode';
import TugOfWarMode from './TugOfWarMode';
import CrosswordMode from './CrosswordMode';
import DigDuelMode from './DigDuelMode';
import GoldMinerMode from './GoldMinerMode';

type GameMode = 'quiz' | 'scramble' | 'blitz' | 'survival' | 'tugofwar' | 'crossword' | 'digduel' | 'goldminer';

interface GameCenterProps {
  initialQuestions: Question[];
  initialExamTitle: string;
  examList: ExamPaper[];
}

const GameCenter: React.FC<GameCenterProps> = ({ initialQuestions, initialExamTitle, examList }) => {
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(initialQuestions);
  const [activeTitle, setActiveTitle] = useState(initialExamTitle);
  const [gameState, setGameState] = useState<'selection' | 'lobby' | 'rules' | 'playing' | 'result'>('selection');
  const [selectedMode, setSelectedMode] = useState<GameMode>('quiz');
  const [playerName, setPlayerName] = useState('');
  const [lastGameResult, setLastGameResult] = useState<{score: number, streak: number} | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nameError, setNameError] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (initialQuestions?.length > 0) {
      setActiveQuestions(initialQuestions);
      setActiveTitle(initialExamTitle);
      setGameState('lobby');
    }
  }, [initialQuestions, initialExamTitle]);

  useEffect(() => {
    // Load Leaderboard Async
    const loadData = async () => {
        const savedLB = await storage.get<LeaderboardEntry[]>(STORAGE_KEYS.LEADERBOARD, []);
        setLeaderboard(savedLB);

        const savedSettings = await storage.get(STORAGE_KEYS.SETTINGS, { teacherName: '' });
        if (savedSettings.teacherName) setPlayerName(savedSettings.teacherName);
    };
    loadData();
  }, []);

  const handleFinish = async (score: number, streak: number) => {
    setLastGameResult({ score: Math.round(score), streak });
    const entry: LeaderboardEntry = { playerName, score: Math.round(score), time: new Date().toLocaleTimeString(), topic: activeTitle };
    const newLB = [entry, ...leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);
    setLeaderboard(newLB);
    
    // Save Leaderboard Async
    await storage.set(STORAGE_KEYS.LEADERBOARD, newLB);
    
    setGameState('result');
  };

  const triggerExitConfirm = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    setGameState('lobby');
  };

  const startWithMode = (mode: GameMode) => {
    if (!playerName.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 2000);
      return;
    }
    setSelectedMode(mode);
    setGameState('rules');
  };

  if (gameState === 'rules') {
    return (
      <GameRules 
        mode={selectedMode} 
        onStart={() => setGameState('playing')} 
        onBack={() => setGameState('lobby')} 
      />
    );
  }

  if (gameState === 'selection') {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-5 border border-slate-100 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-6">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">CHỌN NỘI DUNG THI ĐẤU</h2>
            <div className="h-1 w-10 bg-indigo-600 mx-auto mt-2 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {examList.length === 0 ? (
              <div className="flex flex-col items-center py-10 opacity-30">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <p className="text-[10px] font-black uppercase tracking-widest">Thư viện chưa có đề thi</p>
              </div>
            ) : (
              examList.map(exam => (
                <button key={exam.id} onClick={() => { setActiveQuestions(exam.questions); setActiveTitle(exam.config.title); setGameState('lobby'); }} className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-slate-800 truncate text-[11px]">{exam.config.title}</h4>
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{exam.config.subject}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-5 border border-slate-100 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 z-0 opacity-50"></div>
          <button onClick={() => setGameState('selection')} className="relative z-10 p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors mb-4 flex items-center gap-2 group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Đổi đề</span>
          </button>
          
          <div className="relative z-10 text-center mb-5">
            <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2.5">Thông tin thí sinh</h3>
            <div className={`max-w-xs mx-auto transition-all ${nameError ? 'animate-bounce' : ''}`}>
              <input 
                type="text" 
                className={`w-full bg-slate-50 border-2 p-2.5 rounded-xl text-sm font-bold text-center text-slate-700 outline-none transition-all shadow-inner ${nameError ? 'border-rose-500 bg-rose-50 placeholder-rose-300' : 'border-slate-100 focus:border-indigo-500 focus:bg-white'}`} 
                value={playerName} 
                onChange={e => { setPlayerName(e.target.value); if(nameError) setNameError(false); }} 
                placeholder={nameError ? "Hãy nhập tên!" : "Tên của bạn..."} 
                autoFocus
              />
              {nameError && <p className="text-rose-500 text-[8px] font-bold uppercase mt-1.5 animate-pulse">Vui lòng nhập danh tính trước khi xuất trận!</p>}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3">
            <GameModeBtn title="Quiz" icon="🏆" onClick={() => startWithMode('quiz')} color="bg-indigo-600" desc="Thử thách tri thức" />
            <GameModeBtn title="Scramble" icon="🧩" onClick={() => startWithMode('scramble')} color="bg-emerald-600" desc="Giải mã từ vựng" />
            <GameModeBtn title="Blitz" icon="⚡" onClick={() => startWithMode('blitz')} color="bg-amber-500" desc="Phản xạ tia chớp" />
            <GameModeBtn title="Survival" icon="❤️" onClick={() => startWithMode('survival')} color="bg-rose-600" desc="Đấu trường sinh tồn" />
            <GameModeBtn title="Kéo co" icon="🪢" onClick={() => startWithMode('tugofwar')} color="bg-blue-600" desc="Đối kháng cùng Bot" />
            <GameModeBtn title="Ô chữ" icon="🔤" onClick={() => startWithMode('crossword')} color="bg-violet-600" desc="Giải ô chữ kinh điển" />
            <GameModeBtn title="Đào hố" icon="⛏️" onClick={() => startWithMode('digduel')} color="bg-orange-600" desc="Đào sâu hơn Bot" />
            <GameModeBtn title="Đào vàng" icon="🥇" onClick={() => startWithMode('goldminer')} color="bg-yellow-500" desc="Gắp vàng trúng đáp án" />
          </div>

          <div className="relative z-10 mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Bảng Vàng Danh Dự
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {leaderboard.length > 0 ? leaderboard.slice(0, 4).map((e, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                  <span className="text-[9px] font-bold text-slate-600 truncate">{e.playerName}</span>
                  <span className="text-[9px] font-black text-indigo-600">{e.score}</span>
                </div>
              )) : <p className="text-[8px] italic text-slate-300">Chưa có dữ liệu thi đấu</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border-t-8 border-rose-500 animate-in zoom-in duration-200">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">DỪNG TRẬN ĐẤU?</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Mọi điểm số và tiến trình hiện tại sẽ không được lưu lại. Bạn có chắc chắn muốn rời đi?
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-3">
                  <button 
                    onClick={() => setShowExitConfirm(false)} 
                    className="py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Ở LẠI
                  </button>
                  <button 
                    onClick={confirmExit} 
                    className="py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-md shadow-rose-200 active:scale-95"
                  >
                    RỜI ĐI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedMode === 'scramble' && <ScrambleMode questions={activeQuestions} playerName={playerName} onFinish={handleFinish} onBack={triggerExitConfirm} />}
        {selectedMode === 'blitz' && <BlitzMode questions={activeQuestions} playerName={playerName} onFinish={handleFinish} onBack={triggerExitConfirm} />}
        {selectedMode === 'survival' && <SurvivalMode questions={activeQuestions} playerName={playerName} onFinish={handleFinish} onBack={triggerExitConfirm} />}
        {selectedMode === 'quiz' && <QuizMode questions={activeQuestions} playerName={playerName} onFinish={handleFinish} onBack={triggerExitConfirm} />}
        {selectedMode === 'tugofwar' && <TugOfWarMode questions={activeQuestions} playerName={playerName} onFinish={handleFinish} onBack={triggerExitConfirm} />}
        {selectedMode === 'crossword' && <CrosswordMode questions={activeQuestions} playerName={playerName} onFinish={handleFinish} onBack={triggerExitConfirm} />}
        {selectedMode === 'digduel' && <DigDuelMode questions={activeQuestions} playerName={playerName} onFinish={handleFinish} onBack={triggerExitConfirm} />}
        {selectedMode === 'goldminer' && <GoldMinerMode questions={activeQuestions} playerName={playerName} onFinish={handleFinish} onBack={triggerExitConfirm} />}
      </>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-5 rounded-xl shadow-md text-center space-y-3 max-w-sm w-full border border-slate-100 relative overflow-hidden animate-in zoom-in duration-500">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500"></div>
        <div className="text-2xl animate-bounce">🎊</div>
        <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight">TRẬN ĐẤU KẾT THÚC</h1>
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{playerName}</p>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-3 rounded-xl border-b-2 border-slate-100">
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">TỔNG ĐIỂM</p>
            <p className="text-lg font-bold text-indigo-600">{lastGameResult?.score || 0}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border-b-2 border-slate-100">
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">CHUỖI</p>
            <p className="text-lg font-bold text-emerald-500">{lastGameResult?.streak || 0}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={() => setGameState('lobby')} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-md">CHƠI TIẾP</button>
          <button onClick={() => setGameState('selection')} className="w-full py-1.5 text-slate-400 font-semibold text-[9px] uppercase tracking-wider">CHỌN CHỦ ĐỀ KHÁC</button>
        </div>
      </div>
    </div>
  );
};

const GameModeBtn: React.FC<{title: string, icon: string, onClick: () => void, color: string, desc: string}> = ({ title, icon, onClick, color, desc }) => (
  <button onClick={onClick} className={`${color} p-3.5 rounded-xl text-white text-left transition-all flex flex-col gap-1 group shadow-md active:scale-95 border border-white/10 hover:shadow-lg`}>
    <div className="bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center text-base mb-1">{icon}</div>
    <h4 className="font-bold uppercase text-[11px] tracking-tight">{title}</h4>
    <p className="text-[8px] font-bold opacity-70 uppercase leading-none">{desc}</p>
  </button>
);

export default GameCenter;
