import React, { useState, useEffect } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { EyeState } from '../types';

const IPAClinic: React.FC = () => {
  const [targetWord, setTargetWord] = useState('');
  const { connect, disconnect, connected, isSpeaking } = useGeminiLive();

  // Disconnect when leaving the component
  useEffect(() => {
    return () => { disconnect(); };
  }, []);

  const handleStartExam = async () => {
    if (!targetWord.trim()) return;

    const ipaInstruction = `You are a strict and highly accurate English phonetician and pronunciation examiner. The user is practicing the pronunciation of the word/phrase: "${targetWord.trim()}". Listen carefully to their pronunciation. Respond by: 1. Transcribing EXACTLY what you heard them say in IPA format. 2. Providing the correct dictionary IPA transcription for "${targetWord.trim()}". 3. Briefly explaining which specific vowels or consonants they mispronounced and how to fix mouth/tongue placement. Speak your feedback clearly.`;

    await connect(ipaInstruction);
  };

  return (
    <div className="h-full flex flex-col animate-content">
      {/* Header */}
      <div className="bg-white border-b px-8 py-5 shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
            <span className="text-lg">🔬</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Phòng Khám Phát Âm IPA</h2>
            <p className="text-[11px] text-slate-400 font-medium">Kiểm tra và cải thiện phát âm tiếng Anh cùng Aura</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Input Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Từ vựng hoặc câu cần luyện tập
            </label>
            <input
              type="text"
              value={targetWord}
              onChange={(e) => setTargetWord(e.target.value)}
              placeholder='Ví dụ: "ubiquitous", "I thoroughly enjoyed it"...'
              disabled={connected}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all disabled:bg-slate-50 disabled:text-slate-400"
            />

            {!connected ? (
              <button
                onClick={handleStartExam}
                disabled={!targetWord.trim()}
                className="mt-5 w-full bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-200"
              >
                🎙️ Bắt đầu kiểm tra phát âm
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="mt-5 w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200"
              >
                🛑 Dừng kiểm tra
              </button>
            )}
          </div>

          {/* Status Display */}
          {connected && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col items-center gap-4 py-4">
                {/* Pulsing Mic Indicator */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-orange-100 ring-4 ring-orange-300 animate-pulse' : 'bg-teal-100 ring-4 ring-teal-300 animate-pulse'}`}>
                  <span className="text-3xl">{isSpeaking ? '🔊' : '🎤'}</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">
                    {isSpeaking ? 'Aura đang phản hồi...' : 'Đang nghe... Hãy nói từ:'}
                  </p>
                  <p className="text-xl font-black text-teal-600 mt-1">"{targetWord}"</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {isSpeaking ? 'Lắng nghe phản hồi phát âm từ Aura' : 'Hãy phát âm rõ ràng vào microphone'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions when not connected */}
          {!connected && (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Hướng dẫn sử dụng</h3>
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>Nhập từ vựng hoặc câu tiếng Anh bạn muốn luyện phát âm.</li>
                <li>Nhấn <strong>"Bắt đầu kiểm tra"</strong> để kết nối với Aura.</li>
                <li>Nói rõ ràng vào microphone. Aura sẽ phân tích phiên âm IPA.</li>
                <li>Lắng nghe phản hồi về các lỗi phát âm cụ thể và cách sửa.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPAClinic;
