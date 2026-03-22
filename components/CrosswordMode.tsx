import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Question } from '../types';

interface CrosswordModeProps {
  questions: Question[];
  playerName: string;
  onFinish: (score: number, streak: number) => void;
  onBack: () => void;
}

interface CrosswordCell {
  letter: string;
  revealed: boolean;
  row: number;
  col: number;
  clueIdx: number;
  isKeyword: boolean;
}

const CrosswordMode: React.FC<CrosswordModeProps> = ({ questions, playerName, onFinish, onBack }) => {
  // Use first 8 questions max for crossword
  const clues = useMemo(() => questions.slice(0, 8), [questions]);
  
  // Build crossword data: vertical keyword column, horizontal answers crossing it
  const crosswordData = useMemo(() => {
    const answers = clues.map(q => q.correctAnswer.toUpperCase().replace(/[^A-ZÀ-Ỹ0-9]/gi, ''));
    // Keyword is the first letter of each answer stacked vertically
    const keyword = answers.map(a => a[0] || '?').join('');
    
    // Each answer crosses the keyword column at position 0 (first letter)
    // Place keyword in column = max(answer.length) / 2 to center
    const maxLen = Math.max(...answers.map(a => a.length), 1);
    const keyCol = Math.min(Math.floor(maxLen / 2), 6);
    
    const grid: CrosswordCell[][] = [];
    const rows = answers.length;
    const cols = Math.max(maxLen + keyCol, keyCol + 2);
    
    // Initialize empty grid
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      const answer = answers[r];
      const startCol = keyCol; // Answer starts at keyword column
      for (let c = 0; c < cols; c++) {
        const letterIdx = c - startCol;
        if (letterIdx >= 0 && letterIdx < answer.length) {
          grid[r][c] = {
            letter: answer[letterIdx],
            revealed: false,
            row: r,
            col: c,
            clueIdx: r,
            isKeyword: c === keyCol,
          };
        } else {
          grid[r][c] = { letter: '', revealed: false, row: r, col: c, clueIdx: -1, isKeyword: false };
        }
      }
    }
    
    return { grid, keyword, keyCol, answers, rows, cols };
  }, [clues]);

  const [grid, setGrid] = useState(crosswordData.grid);
  const [activeClue, setActiveClue] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [solvedClues, setSolvedClues] = useState<Set<number>>(new Set());
  const [wrongClues, setWrongClues] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeClue]);

  const submitAnswer = useCallback(() => {
    const answer = userInput.toUpperCase().replace(/[^A-ZÀ-Ỹ0-9]/gi, '');
    const correct = crosswordData.answers[activeClue];
    
    if (answer === correct) {
      // Reveal cells for this clue
      setGrid(prev => {
        const newGrid = prev.map(row => row.map(cell => ({ ...cell })));
        newGrid[activeClue] = newGrid[activeClue].map(cell => 
          cell.clueIdx === activeClue ? { ...cell, revealed: true } : cell
        );
        return newGrid;
      });
      setSolvedClues(prev => new Set([...prev, activeClue]));
      setScore(prev => prev + 150);
      setStreak(prev => prev + 1);
    } else {
      setWrongClues(prev => new Set([...prev, activeClue]));
      setStreak(0);
    }
    
    setUserInput('');
    
    // Move to next unsolved clue
    const nextIdx = findNextUnsolved(activeClue);
    if (nextIdx === -1) {
      // All clues attempted
      setGameOver(true);
    } else {
      setActiveClue(nextIdx);
    }
  }, [userInput, activeClue, crosswordData]);

  const findNextUnsolved = (fromIdx: number): number => {
    for (let i = 1; i <= clues.length; i++) {
      const idx = (fromIdx + i) % clues.length;
      if (!solvedClues.has(idx) && !wrongClues.has(idx)) return idx;
    }
    return -1;
  };

  useEffect(() => {
    if (gameOver) {
      onFinish(score, streak);
    }
  }, [gameOver]);

  // Cell size
  const cellSize = 28;

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full py-4 relative animate-content">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 bg-white p-3 px-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div>
            <p className="text-[7px] font-black text-violet-500 uppercase tracking-widest">Ô chữ</p>
            <span className="text-[10px] font-bold text-slate-600">{playerName}</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Điểm</p>
            <p className="text-sm font-bold text-violet-600 tabular-nums">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Giải</p>
            <p className="text-sm font-bold text-emerald-600 tabular-nums">{solvedClues.size}/{clues.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        {/* Crossword Grid */}
        <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start justify-center overflow-auto">
          <div className="inline-block">
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {/* Row number */}
                <div className="w-5 flex items-center justify-center text-[8px] font-black text-slate-300 mr-1">{r + 1}</div>
                {row.map((cell, c) => {
                  if (!cell.letter) {
                    return <div key={c} style={{ width: cellSize, height: cellSize }} className=""></div>;
                  }
                  const isSolved = solvedClues.has(cell.clueIdx);
                  const isWrong = wrongClues.has(cell.clueIdx);
                  const isActive = cell.clueIdx === activeClue;
                  
                  return (
                    <div 
                      key={c}
                      style={{ width: cellSize, height: cellSize }}
                      className={`border flex items-center justify-center text-[11px] font-bold transition-all ${
                        cell.isKeyword ? 'border-violet-400 bg-violet-50' : 'border-slate-200'
                      } ${isSolved ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : ''
                      } ${isWrong ? 'bg-rose-50 text-rose-400 border-rose-200' : ''
                      } ${isActive && !isSolved && !isWrong ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-300' : ''
                      }`}
                    >
                      {isSolved ? cell.letter : isWrong ? '×' : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Clues Panel */}
        <div className="w-full lg:w-64 bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          <h4 className="text-[9px] font-black text-violet-600 uppercase tracking-widest mb-2">📝 Gợi ý</h4>
          {clues.map((clue, i) => {
            const isSolved = solvedClues.has(i);
            const isWrong = wrongClues.has(i);
            const isActive = i === activeClue;
            
            return (
              <button 
                key={i}
                onClick={() => !isSolved && !isWrong && setActiveClue(i)}
                className={`w-full text-left p-2.5 rounded-lg text-[11px] font-medium transition-all ${
                  isSolved ? 'bg-emerald-50 text-emerald-600 line-through opacity-60' :
                  isWrong ? 'bg-rose-50 text-rose-400 line-through opacity-60' :
                  isActive ? 'bg-violet-50 text-violet-700 border border-violet-200 shadow-sm' :
                  'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-black text-[9px] mr-1.5">{i + 1}.</span>
                {clue.content}
                {isSolved && <span className="ml-1">✅</span>}
                {isWrong && <span className="ml-1">❌</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      {!gameOver && (
        <div className="mt-4 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-[9px] font-bold text-violet-600 mb-2">
            <span className="font-black">Câu {activeClue + 1}:</span> {clues[activeClue]?.content}
          </p>
          <div className="flex gap-2">
            <input 
              ref={inputRef}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              className="flex-1 bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl text-sm font-bold outline-none focus:border-violet-500 transition-all placeholder:text-slate-200"
              placeholder="Nhập đáp án..."
              autoFocus
            />
            <button 
              onClick={submitAnswer}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-xs hover:bg-violet-700 transition-all active:scale-95 shadow-md"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrosswordMode;
