import { create } from 'zustand';

/**
 * Aura System Centralized State
 * Manages view navigation, interaction status, and context legacy.
 */

interface AuraState {
  currentMode: 'dashboard' | 'tutor' | 'speaking_room';
  setCurrentMode: (mode: 'dashboard' | 'tutor' | 'speaking_room') => void;
  isLiveVoice: boolean;
  setIsLiveVoice: (status: boolean) => void;
  conversationHistory: string[]; // Last 5 messages for AI context
  addConversation: (text: string) => void;
  // TTS & Lip-Sync
  ttsVolume: number;
  setTtsVolume: (vol: number) => void;
  isAuraSpeaking: boolean;
  setIsAuraSpeaking: (status: boolean) => void;
}

export const useAuraStore = create<AuraState>((set) => ({
  currentMode: 'dashboard',
  setCurrentMode: (mode) => {
    console.info('[AuraStore] -> [ModeChange]:', mode);
    set({ currentMode: mode });
  },
  
  isLiveVoice: false,
  setIsLiveVoice: (status) => {
    console.info('[AuraStore] -> [LiveVoiceStatus]:', status);
    set({ isLiveVoice: status });
  },

  conversationHistory: [],
  addConversation: (text) => {
    set((state) => {
        const newHistory = [text, ...state.conversationHistory].slice(0, 5);
        return { conversationHistory: newHistory };
    });
  },

  ttsVolume: 0,
  setTtsVolume: (vol) => set({ ttsVolume: vol }),
  
  isAuraSpeaking: false,
  setIsAuraSpeaking: (status) => set({ isAuraSpeaking: status }),
}));
