import React, { useState } from 'react';
import Live2DAvatar from './Live2DAvatar';
import { EyeState, AppMode } from '../types'; 
import AuraLiveChat from './AuraLiveChat';
import { useAuraStore } from '../store/useAuraStore';
import { useAuraLocalVoice } from '../hooks/useAuraLocalVoice';

interface FloatingAuraProps {
    isCinematic?: boolean;
    onExitCinematic?: () => void;
}

/**
 * FloatingAura - The AI companion component.
 * Features a refined Genshin Impact inspired Radial Menu.
 */
const FloatingAura: React.FC<FloatingAuraProps> = ({ isCinematic, onExitCinematic }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);
  
  const { 
    currentMode, 
    setCurrentMode, 
    isLiveVoice, 
    setIsLiveVoice,
    ttsVolume,
    isAuraSpeaking: isStoreSpeaking
  } = useAuraStore();

  const { 
    connect, 
    disconnect, 
    connected, 
    volume: liveVolume, 
    isSpeaking: isLiveSpeaking, 
    messages,
    isThinking
  } = useAuraLocalVoice();

  // Volume: use liveVolume if connected, otherwise use fallback ttsVolume
  const displayVolume = connected ? liveVolume : (ttsVolume / 100);
  const isActuallySpeaking = isLiveSpeaking || isStoreSpeaking;

  const handleLiveVoice = () => {
    console.info('[FloatingAura] -> [Action]: Activating Live Voice');
    setShowMenu(false);
    setIsLiveVoice(true);
    if (!connected) {
        connect("Xin chào, mình là Aura, bạn muốn trao đổi gì hôm nay?");
    }
    setIsLiveChatOpen(true);
  };

  const handleDisconnect = () => {
    console.info('[FloatingAura] -> [Action]: Disconnecting...');
    disconnect();
    setIsLiveVoice(false);
    setIsLiveChatOpen(false);
    if (isCinematic && onExitCinematic) onExitCinematic();
  };

  return (
    <div className={`fixed z-[9999] transition-all duration-700 ease-in-out ${
      currentMode === 'speaking_room' 
        ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5] w-64 h-80 origin-center' 
        : 'bottom-0 right-4 w-48 h-56 md:w-56 md:h-72 origin-bottom' // Đưa sát đáy, bóp chiều cao lại
    }`}>
      
      {/* Radial Menu - Đã fix lỗi tràn viền (Neo sang phải: right-0) */}
      {showMenu && currentMode !== 'speaking_room' && (
        <div className="absolute bottom-[85%] right-0 w-[260px] h-[130px] pointer-events-none z-50">
          
          {/* Nút 1: Trò chuyện (Góc trái) */}
          <button onClick={handleLiveVoice} className="absolute bottom-0 left-0 pointer-events-auto w-16 h-16 rounded-full border-2 border-[#E4C564] bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:shadow-[0_0_15px_rgba(228,197,100,0.8)] transition-all hover:scale-110 group shadow-2xl">
            <span className="text-2xl">🎙️</span>
            {/* Chữ căn giữa bình thường */}
            <span className="absolute -bottom-8 w-max text-xs font-bold text-[#E4C564] opacity-0 group-hover:opacity-100 transition-opacity">Trò chuyện cùng Aura</span>
          </button>
          
          {/* Nút 2: Gia sư (Đỉnh giữa) */}
          <button 
            onClick={() => { 
                if (connected) handleDisconnect();
                setShowMenu(false); 
                setCurrentMode('tutor'); 
            }} 
            className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto w-16 h-16 rounded-full border-2 border-[#E4C564] bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:shadow-[0_0_15px_rgba(228,197,100,0.8)] transition-all hover:scale-110 group shadow-2xl"
          >
            <span className="text-2xl">💬</span>
            <span className="absolute -bottom-8 w-max text-xs font-bold text-[#E4C564] opacity-0 group-hover:opacity-100 transition-opacity">Gia sư Aura</span>
          </button>

          {/* Nút 3: Luyện nói (Góc phải) */}
          <button 
            onClick={() => { 
                if (connected) handleDisconnect();
                setShowMenu(false); 
                setCurrentMode('speaking_room'); 
            }} 
            className="absolute bottom-0 right-0 pointer-events-auto w-16 h-16 rounded-full border-2 border-[#E4C564] bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:shadow-[0_0_15px_rgba(228,197,100,0.8)] transition-all hover:scale-110 group shadow-2xl"
          >
            <span className="text-2xl">🎓</span>
            {/* QUAN TRỌNG: right-0 để chữ mọc ngược về bên trái, không bị tràn ra ngoài màn hình */}
            <span className="absolute -bottom-8 right-0 w-max text-xs font-bold text-[#E4C564] opacity-0 group-hover:opacity-100 transition-opacity text-right">Luyện nói theo chủ đề</span>
          </button>
        </div>
      )}

      {/* Avatar Aura */}
      <div 
        className="w-full h-full cursor-pointer drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform relative z-10" 
        onClick={() => currentMode !== 'speaking_room' && setShowMenu(!showMenu)}
      >
        {/* Audio Visualizer */}
        {(isLiveVoice || isStoreSpeaking) && (
          <div className="absolute top-1/2 -left-12 -translate-y-1/2 flex items-center gap-1 bg-slate-900/50 p-2 rounded-full backdrop-blur-sm z-20 pointer-events-none transition-all duration-300">
            <div className="w-1.5 bg-green-400 rounded-full animate-pulse" style={{ height: `${Math.max(10, (displayVolume * 100) || 20)}px`, transition: 'height 0.1s' }}></div>
            <div className="w-1.5 bg-green-400 rounded-full animate-pulse delay-75" style={{ height: `${Math.max(15, ((displayVolume * 100) || 30) * 0.8)}px`, transition: 'height 0.1s' }}></div>
            <div className="w-1.5 bg-green-400 rounded-full animate-pulse delay-150" style={{ height: `${Math.max(12, ((displayVolume * 100) || 25) * 0.9)}px`, transition: 'height 0.1s' }}></div>
          </div>
        )}

        <Live2DAvatar 
          state={isActuallySpeaking ? EyeState.SPEAKING : EyeState.IDLE} 
          mode={connected ? AppMode.VOICE : AppMode.CHAT} 
          volume={displayVolume} 
        />
        
        {/* Subtle Outer Glow */}
        <div className={`absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full z-[-1] transition-opacity duration-1000 ${isActuallySpeaking ? 'opacity-100 scale-125' : 'opacity-30'}`}></div>
      </div>

      {/* Disconnect Button (Visible when connected) */}
      {connected && (
        <button 
          onClick={handleDisconnect}
          className="absolute top-0 right-0 w-10 h-10 bg-rose-600/90 text-white rounded-full border-2 border-white/50 shadow-2xl flex items-center justify-center animate-pulse hover:scale-110 transition-transform z-[110]"
          title="Ngắt kết nối"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}

      {/* Transcript Overlay - Now enabled during Live Voice for feedback */}
      {(isLiveChatOpen || isLiveVoice) && (
        <AuraLiveChat 
            messages={messages} 
            isAuraSpeaking={isActuallySpeaking}
            onClose={() => {
                if (isLiveVoice) handleDisconnect();
                setIsLiveChatOpen(false);
            }}
        />
      )}
    </div>
  );
};

export default FloatingAura;
