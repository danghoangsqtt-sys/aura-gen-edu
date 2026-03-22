import { useState, useRef, useCallback } from 'react';
import { STTService } from '../services/sttService';
import { OllamaService, ChatMessage as OllamaChatMessage } from '../services/ollamaService';
import { VieneuService } from '../services/vieneuService';
import { useAuraStore } from '../store/useAuraStore';

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export const useAuraLocalVoice = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  const { 
    setTtsVolume, 
    setIsAuraSpeaking, 
    isAuraSpeaking,
    ttsVolume 
  } = useAuraStore();

  const isActiveRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep ref in sync with state for async closures
  const updateMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setMessages(prev => {
      const next = updater(prev);
      messagesRef.current = next;
      return next;
    });
  }, []);

  // Helper to add messages
  const addMessage = useCallback((role: 'user' | 'model', text: string) => {
    updateMessages(prev => [...prev, {
        id: `${role}-${Date.now()}`,
        role,
        text,
        timestamp: Date.now()
    }]);
  }, [updateMessages]);

  // === PRESS-TO-RECORD: Start recording ===
  const startRecording = useCallback(() => {
    if (!isActiveRef.current || isRecording) return;

    setIsRecording(true);
    setInterimText('');
    console.log("[useAuraLocalVoice] -> Starting recording (press-to-record)...");

    STTService.getInstance().startListening(
      (text, isFinal) => {
        if (isFinal) {
          setInterimText('');
          setIsRecording(false);
          setMicVolume(0);
          processUserVoice(text);
        } else {
          setInterimText(text);
        }
      },
      () => {
        console.log("[useAuraLocalVoice] -> STT ended.");
        setIsRecording(false);
        setMicVolume(0);
      },
      (err: any) => {
        console.error("[useAuraLocalVoice] -> STT Error:", err);
        setIsRecording(false);
        setMicVolume(0);
        setIsAuraSpeaking(false);
      },
      // Mic volume callback
      (vol: number) => {
        setMicVolume(vol);
      }
    );
  }, [isRecording]);

  // === PRESS-TO-RECORD: Stop recording ===
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    console.log("[useAuraLocalVoice] -> Stopping recording...");
    STTService.getInstance().stopListening();
    // isRecording will be set to false by onEnd/onResult callbacks
  }, [isRecording]);

  const processUserVoice = async (text: string) => {
    if (!text.trim()) return;

    addMessage('user', text);
    setIsThinking(true);

    try {
      // Prepare history for Ollama
      const history: OllamaChatMessage[] = messagesRef.current.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const responseText = await OllamaService.sendChatMessage(history, text);
      setIsThinking(false);
      addMessage('model', responseText);

      // Speak result
      speakAura(responseText);

    } catch (err) {
      console.error("[useAuraLocalVoice] -> Ollama Error:", err);
      setIsThinking(false);
    }
  };

  const speakAura = (text: string) => {
    if (!isActiveRef.current) return;

    setIsAuraSpeaking(true);
    // Strip markdown thoroughly for clean TTS
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')   // code blocks
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1')     // italic
      .replace(/__([^_]+)__/g, '$1')     // bold alt
      .replace(/_([^_]+)_/g, '$1')       // italic alt
      .replace(/`([^`]+)`/g, '$1')       // inline code
      .replace(/^#{1,6}\s+/gm, '')       // headers
      .replace(/^[-*+]\s+/gm, '')        // unordered lists
      .replace(/^\d+\.\s+/gm, '')        // ordered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/\n{2,}/g, '. ')           // double newlines → pause
      .trim();

    VieneuService.getInstance().speak(
      cleanText,
      (vol) => setTtsVolume(vol),
      () => {
        setIsAuraSpeaking(false);
        setTtsVolume(0);
        // After Aura finishes speaking, user can press Record again
      }
    );
  };

  const connect = async (initialGreeting?: string) => {
    isActiveRef.current = true;
    setConnected(true);
    setMessages([]);
    messagesRef.current = [];

    if (initialGreeting) {
       addMessage('model', initialGreeting);
       speakAura(initialGreeting);
    }
    // No auto-listen — user presses Record button when ready
  };

  const disconnect = () => {
    isActiveRef.current = false;
    setConnected(false);
    setIsRecording(false);
    setMicVolume(0);
    STTService.getInstance().stopListening();
    VieneuService.getInstance().stop();
    setIsAuraSpeaking(false);
    setTtsVolume(0);
    setIsThinking(false);
  };

  return { 
    connect, 
    disconnect, 
    connected, 
    volume: ttsVolume / 100, 
    isSpeaking: isAuraSpeaking, 
    messages, 
    isThinking,
    interimText,
    isRecording,
    micVolume,
    startRecording,
    stopRecording
  };
};
