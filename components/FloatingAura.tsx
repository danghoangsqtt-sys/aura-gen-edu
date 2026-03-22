import React, { useState } from 'react';
import Live2DAvatar from './Live2DAvatar';
import { EyeState, AppMode } from '../types'; 
import AuraLiveChat from './AuraLiveChat';
import ChatbotPanel from './ChatbotPanel';
import { useAuraStore } from '../store/useAuraStore';
import { useAuraLocalVoice } from '../hooks/useAuraLocalVoice';

interface FloatingAuraProps {
    isCinematic?: boolean;
    onExitCinematic?: () => void;
}

/**
 * FloatingAura - The AI companion component.
 * Refactored to support a side-by-side floating chat widget.
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
    isThinking,
    interimText,
    isRecording,
    micVolume,
    startRecording,
    stopRecording
  } = useAuraLocalVoice();

  // Volume: use liveVolume if connected, otherwise use fallback ttsVolume
  const displayVolume = connected ? liveVolume : (ttsVolume / 100);
  const isActuallySpeaking = isLiveSpeaking || isStoreSpeaking;

  const handleLiveVoice = () => {
    console.info('[FloatingAura] -> [Action]: Activating Live Voice');
    setShowMenu(false);
    setIsLiveVoice(true);
    if (!connected) {
        connect("Chào bạn! Mình là Aura, gia sư tiếng Anh của bạn. Hôm nay bạn muốn luyện tập chủ đề gì? Mình có thể giúp bạn luyện nói, học từ vựng, hoặc tra cứu ngữ pháp nhé!");
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
    <div className={`fixed bottom-0 right-0 z-[900] p-4 pointer-events-none transition-all duration-700 ease-in-out flex flex-row items-end justify-end gap-6 ${
      currentMode === 'speaking_room' 
        ? 'inset-0 items-center justify-center scale-[1.5] origin-center bg-slate-900/40 backdrop-blur-md pointer-events-auto' 
        : 'origin-bottom'
    }`}>
      
      {/* 1. Nhân vật Aura (The Anchor) */}
      <div 
        className={`cursor-pointer drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)] transition-all duration-500 relative z-10 translate-y-[28%] hover:scale-105 pointer-events-auto shrink-0 w-48 h-64 md:w-56 md:h-72`}
        onClick={() => currentMode !== 'speaking_room' && setShowMenu(!showMenu)}
      >
        {/* Radial Menu - Gắn chặt với Nhân vật */}
        {showMenu && currentMode !== 'speaking_room' && (
          <div className="absolute bottom-[85%] right-0 w-[260px] h-[130px] pointer-events-none z-50">
            {/* Nút 1: Trò chuyện */}
            <button onClick={handleLiveVoice} className="absolute bottom-0 left-0 pointer-events-auto w-16 h-16 rounded-full border-2 border-[#E4C564] bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:shadow-[0_0_15px_rgba(228,197,100,0.8)] transition-all hover:scale-110 group shadow-2xl" title="Trò chuyện">
              <span className="text-2xl">🎙️</span>
              <span className="absolute -bottom-8 w-max text-xs font-bold text-[#E4C564] opacity-0 group-hover:opacity-100 transition-opacity">Trò chuyện</span>
            </button>
            {/* Nút 2: Gia sư */}
            <button 
              onClick={() => { if (connected) handleDisconnect(); setShowMenu(false); setCurrentMode('tutor'); }} 
              className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto w-16 h-16 rounded-full border-2 border-[#E4C564] bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:shadow-[0_0_15px_rgba(228,197,100,0.8)] transition-all hover:scale-110 group shadow-2xl"
              title="Gia sư"
            >
              <span className="text-2xl">💬</span>
              <span className="absolute -bottom-8 w-max text-xs font-bold text-[#E4C564] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Gia sư Aura</span>
            </button>
            {/* Nút 3: Luyện nói */}
            <button 
              onClick={() => { if (connected) handleDisconnect(); setShowMenu(false); window.dispatchEvent(new CustomEvent('NAVIGATE_TAB', { detail: 'speaking' })); }} 
              className="absolute bottom-0 right-0 pointer-events-auto w-16 h-16 rounded-full border-2 border-[#E4C564] bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center hover:shadow-[0_0_15px_rgba(228,197,100,0.8)] transition-all hover:scale-110 group shadow-2xl"
              title="Luyện nói"
            >
              <span className="text-2xl">🎓</span>
              <span className="absolute -bottom-8 right-0 w-max text-xs font-bold text-[#E4C564] opacity-0 group-hover:opacity-100 transition-opacity text-right">Luyện nói</span>
            </button>
          </div>
        )}

        {/* TTS Audio Visualizer (left side — shows when Aura is speaking) */}
        {(isLiveVoice || isStoreSpeaking) && (
          <div className="absolute top-1/2 -left-12 -translate-y-1/2 flex items-center gap-1 bg-slate-900/50 p-2 rounded-full backdrop-blur-sm z-20 pointer-events-none transition-all duration-300">
            <div className="w-1.5 bg-green-400 rounded-full animate-pulse" style={{ height: `${Math.max(10, (displayVolume * 100) || 20)}px`, transition: 'height 0.1s' }}></div>
            <div className="w-1.5 bg-green-400 rounded-full animate-pulse delay-75" style={{ height: `${Math.max(15, ((displayVolume * 100) || 30) * 0.8)}px`, transition: 'height 0.1s' }}></div>
            <div className="w-1.5 bg-green-400 rounded-full animate-pulse delay-150" style={{ height: `${Math.max(12, ((displayVolume * 100) || 25) * 0.9)}px`, transition: 'height 0.1s' }}></div>
          </div>
        )}

        {/* Mic Volume Meter (right side — shows when user is recording) */}
        {isRecording && (
          <div className="absolute top-1/4 -right-10 flex flex-col-reverse items-center gap-[2px] bg-slate-900/60 px-1.5 py-2 rounded-full backdrop-blur-sm z-20 pointer-events-none transition-all duration-300 animate-in fade-in duration-300">
            {[0.6, 0.75, 0.85, 0.95, 1.0].map((factor, i) => (
              <div 
                key={i}
                className="w-1.5 rounded-full transition-all duration-100"
                style={{ 
                  height: `${Math.max(4, micVolume * factor * 0.5)}px`,
                  backgroundColor: micVolume * factor > 50 
                    ? '#f43f5e'  // rose for loud
                    : micVolume * factor > 20 
                    ? '#fbbf24'  // amber for medium  
                    : '#22c55e', // green for quiet
                  opacity: micVolume > 2 ? 1 : 0.3
                }}
              ></div>
            ))}
            <span className="text-[7px] text-rose-400 font-black mt-1 tracking-widest">REC</span>
          </div>
        )}

        <Live2DAvatar 
          state={isActuallySpeaking ? EyeState.SPEAKING : EyeState.IDLE} 
          mode={connected ? AppMode.VOICE : AppMode.CHAT} 
          volume={displayVolume} 
        />
        
        {/* Connection Status Indicator */}
        {connected && (
          <button onClick={handleDisconnect} className="absolute top-0 right-0 w-8 h-8 bg-rose-600 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse hover:scale-110 transition-all z-20 pointer-events-auto" title="Ngắt kết nối">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}

        {/* Subtle Outer Glow */}
        <div className={`absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full z-[-1] transition-opacity duration-1000 ${isActuallySpeaking ? 'opacity-100 scale-125' : 'opacity-30'}`}></div>
      </div>

      {/* 2. Compact Chat Widget (Pushed to the RIGHT of character) */}
      {currentMode === 'tutor' && (
        <div className="pointer-events-auto pb-8 animate-in slide-in-from-left-8 fade-in duration-500 ease-out origin-bottom-left">
           <ChatbotPanel onClose={() => setCurrentMode('dashboard')} />
        </div>
      )}

      {/* 3. Transparent Bottom Bar (For Live Voice Mode — does NOT cover Aura) */}
      {(isLiveChatOpen || isLiveVoice) && (
        <AuraLiveChat 
            messages={messages} 
            isAuraSpeaking={isActuallySpeaking}
            interimText={interimText}
            isRecording={isRecording}
            onStartRecord={startRecording}
            onStopRecord={stopRecording}
            isThinking={isThinking}
            onClose={() => { if (isLiveVoice) handleDisconnect(); setIsLiveChatOpen(false); }}
        />
      )}
    </div>
  );
};

export default FloatingAura;
