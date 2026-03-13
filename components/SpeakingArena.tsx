
import React, { useState, useEffect } from 'react';
import SpeakingExamCreator from './SpeakingExamCreator';
import SpeakingBasicMode from './SpeakingBasicMode';
import SpeakingTopicMode from './SpeakingTopicMode';
import { useGeminiLive } from '../hooks/useGeminiLive';

const aptisExaminerInstruction = `You are a formal, professional English examiner conducting an Aptis ESOL speaking test. The user is aiming for a B2 level. 
Conduct the test in parts:
1. Start by asking 3 short questions about everyday life, their work, or hobbies (Part 1). Wait for the user to answer each.
2. Ask the user to describe a specific situation, person, or object (Part 2).
3. Provide brief, constructive feedback on their fluency, vocabulary, and grammar after they finish.
Do not break character. Speak formally but clearly. Keep your questions concise.`;

const SpeakingArena: React.FC = () => {
  const [mode, setMode] = useState<'lobby' | 'basic' | 'topic' | 'exam-creator' | 'aura-exam'>('lobby');
  const { connect, disconnect, connected, isSpeaking } = useGeminiLive();

  // Cleanup on unmount or when leaving aura-exam mode
  useEffect(() => {
    return () => { disconnect(); };
  }, []);

  const handleStartAuraExam = async () => {
    setMode('aura-exam');
    await connect(aptisExaminerInstruction);
  };

  const handleStopAuraExam = () => {
    disconnect();
    setMode('lobby');
  };

  // --- ROUTER ---
  if (mode === 'exam-creator') {
    const savedManual = localStorage.getItem('edugen_speaking_manual');
    const initialManual = savedManual ? JSON.parse(savedManual) : [];
    return <SpeakingExamCreator onBack={() => setMode('lobby')} initialManualQuestions={initialManual} />;
  }

  if (mode === 'basic') {
    return <SpeakingBasicMode onBack={() => setMode('lobby')} />;
  }

  if (mode === 'topic') {
    return <SpeakingTopicMode onBack={() => setMode('lobby')} />;
  }

  // --- AURA AI EXAM MODE ---
  if (mode === 'aura-exam') {
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-300">
        {/* Header */}
        <div className="bg-white border-b px-8 py-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
              <span className="text-lg">🎓</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Aptis Speaking Exam</h2>
              <p className="text-[11px] text-slate-400 font-medium">Thi thử B2 ESOL cùng giám khảo Aura</p>
            </div>
          </div>
          <button
            onClick={handleStopAuraExam}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-200"
          >
            🛑 Kết thúc bài thi
          </button>
        </div>

        {/* Exam Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          {connected ? (
            <>
              <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeaking ? 'bg-orange-100 ring-4 ring-orange-400 scale-110' : 'bg-amber-100 ring-4 ring-amber-300 animate-pulse'}`}>
                <span className="text-5xl">{isSpeaking ? '🔊' : '🎤'}</span>
              </div>
              <div className="text-center max-w-md">
                <p className="text-lg font-bold text-slate-700">
                  {isSpeaking ? 'Giám khảo Aura đang nói...' : 'Aura đang lắng nghe bạn...'}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {isSpeaking ? 'Hãy lắng nghe câu hỏi và chuẩn bị câu trả lời.' : 'Hãy trả lời rõ ràng, tự nhiên bằng tiếng Anh.'}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Exam in progress</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-sm font-bold text-slate-400">Đang kết nối đến giám khảo Aura...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- LOBBY ---
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50/50 space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center">
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter mb-2">Speaking <span className="text-indigo-600">Lab</span></h2>
        <p className="text-slate-400 font-bold uppercase tracking-[4px] text-xs">Phòng luyện phản xạ & phát âm</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        <button onClick={() => setMode('basic')} className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-indigo-200 transition-all text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <span className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg shadow-indigo-200">🎤</span>
            <h3 className="text-lg font-black text-slate-800 uppercase mb-2">Basic Interview</h3>
            <p className="text-[11px] text-slate-500 font-medium">Luyện tập với bộ câu hỏi cơ bản do giáo viên biên soạn.</p>
          </div>
        </button>

        <button onClick={() => setMode('topic')} className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-emerald-200 transition-all text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <span className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg shadow-emerald-200">🤖</span>
            <h3 className="text-lg font-black text-slate-800 uppercase mb-2">Topic Challenge</h3>
            <p className="text-[11px] text-slate-500 font-medium">Thử thách nói ngẫu nhiên cùng AI theo chủ đề.</p>
          </div>
        </button>

        <button onClick={() => setMode('exam-creator')} className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-rose-200 transition-all text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <span className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg shadow-rose-200">📄</span>
            <h3 className="text-lg font-black text-slate-800 uppercase mb-2">Tạo Đề Thi Nói</h3>
            <p className="text-[11px] text-slate-500 font-medium">Ghép câu hỏi thành đề thi PDF & Đáp án chấm thi.</p>
          </div>
        </button>

        <button onClick={handleStartAuraExam} className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-amber-200 transition-all text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <span className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg shadow-amber-200">🎓</span>
            <h3 className="text-lg font-black text-slate-800 uppercase mb-2">Thi Thử cùng Aura</h3>
            <p className="text-[11px] text-slate-500 font-medium">Mô phỏng bài thi Aptis ESOL B2 Speaking với giám khảo AI.</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SpeakingArena;
