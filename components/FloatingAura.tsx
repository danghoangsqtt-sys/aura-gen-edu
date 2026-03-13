import React, { useState } from 'react';
import Live2DAvatar from './Live2DAvatar';
import { EyeState, AppMode } from '../types'; 
import { useGeminiLive } from '../hooks/useGeminiLive';

const FloatingAura: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { connect, disconnect, connected, volume, isSpeaking } = useGeminiLive();

  const handleConnect = async () => {
    // Requires User Gesture to satisfy AudioContext rules (this onClick event satisfies it)
    if (!(import.meta as any).env.VITE_GEMINI_API_KEY) {
      console.warn('CRITICAL: VITE_GEMINI_API_KEY is not set in .env.local! Please add it.');
      alert('Vui lòng thêm VITE_GEMINI_API_KEY vào file .env.local để sử dụng tính năng Voice.');
      return;
    }
    await connect();
    setIsMenuOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsMenuOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end">
      {isMenuOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 mb-4 border border-gray-200 dark:border-gray-700 animate-fade-in-up">
          <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 text-center">Tương tác với Aura</p>
          <div className="flex flex-col gap-2">
            {!connected && (
              <button 
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                onClick={() => { alert('Mở khung Text Chat với Gemini'); setIsMenuOpen(false); }}
              >
                💬 Text Chat
              </button>
            )}
            
            {connected ? (
              <button 
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-colors"
                onClick={handleDisconnect}
              >
                🛑 Disconnect Voice
              </button>
            ) : (
              <button 
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition-colors"
                onClick={handleConnect}
              >
                🎙️ Live Voice (Speaking/IPA)
              </button>
            )}
          </div>
        </div>
      )}
      <div 
        className="w-48 h-64 md:w-64 md:h-80 cursor-pointer drop-shadow-2xl transition-transform hover:scale-105"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Live2DAvatar 
          state={isSpeaking ? EyeState.SPEAKING : EyeState.IDLE} 
          mode={connected ? AppMode.VOICE : AppMode.CHAT} 
          volume={volume} 
        />
      </div>
    </div>
  );
};

export default FloatingAura;
