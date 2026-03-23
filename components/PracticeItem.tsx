import React, { useState, useRef, useCallback } from 'react';
import { Volume2, Mic, MicOff, Headphones, Sparkles, Loader2, RotateCcw } from 'lucide-react';

export interface PronunciationFeedback {
  score: number;
  transcription: string;
  errors: string[];
  advice: string;
}

interface PracticeItemProps {
  text: string;
  ipa: string;
  onAnalyze: (audioBlob: Blob, targetText: string) => Promise<PronunciationFeedback>;
}

const PracticeItem: React.FC<PracticeItemProps> = ({ text, ipa, onAnalyze }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 🔊 Model pronunciation via Web Speech API
  const handleListen = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }, [text]);

  // 🎙️ Start recording
  const handleStartRecord = useCallback(async () => {
    try {
      // Cleanup previous
      if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
      setAudioBlob(null);
      setFeedback(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop()); // Release mic
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setBlobUrl(url);
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('[PracticeItem] Mic Error:', err);
      setIsRecording(false);
    }
  }, [blobUrl]);

  // Stop recording
  const handleStopRecord = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // 🎧 Playback
  const handlePlayback = useCallback(() => {
    if (!blobUrl) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const audio = new Audio(blobUrl);
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
    audioRef.current = audio;
  }, [blobUrl]);

  // ✨ AI Evaluate
  const handleEvaluate = useCallback(async () => {
    if (!audioBlob) return;
    setIsAnalyzing(true);
    setFeedback(null);
    try {
      const result = await onAnalyze(audioBlob, text);
      setFeedback(result);
    } catch (err: any) {
      setFeedback({ score: 0, transcription: '', errors: [err.message || 'Lỗi phân tích'], advice: 'Thử lại sau.' });
    }
    setIsAnalyzing(false);
  }, [audioBlob, text, onAnalyze]);

  // Reset
  const handleReset = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setAudioBlob(null);
    setBlobUrl(null);
    setFeedback(null);
    setIsPlaying(false);
    setIsRecording(false);
  }, [blobUrl]);

  // Score color
  const scoreColor = feedback
    ? feedback.score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : feedback.score >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-rose-600 bg-rose-50 border-rose-200'
    : '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Word + IPA */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-bold text-slate-800">{text}</span>
          <span className="text-xs text-teal-600 ml-2 font-mono">{ipa}</span>
        </div>
        {feedback && (
          <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${scoreColor}`}>
            {feedback.score}/100
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Listen */}
        <button onClick={handleListen} className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 transition-all" title="Nghe mẫu">
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Record */}
        {!isRecording ? (
          <button onClick={handleStartRecord} className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 transition-all" title="Thu âm">
            <Mic className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleStopRecord} className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 transition-all animate-pulse" title="Dừng thu">
            <MicOff className="w-4 h-4" />
          </button>
        )}

        {/* Playback */}
        <button onClick={handlePlayback} disabled={!blobUrl || isPlaying} className="p-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="Nghe lại">
          <Headphones className="w-4 h-4" />
        </button>

        {/* AI Evaluate */}
        <button onClick={handleEvaluate} disabled={!audioBlob || isAnalyzing} className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed" title="AI Đánh giá">
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </button>

        {/* Reset */}
        {(audioBlob || feedback) && (
          <button onClick={handleReset} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 transition-all ml-auto" title="Xóa">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Feedback card */}
      {feedback && feedback.score > 0 && (
        <div className={`mt-3 rounded-lg border p-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${scoreColor}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl font-black">{feedback.score}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">/100 điểm</span>
          </div>
          {feedback.transcription && (
            <p className="text-xs mb-1"><span className="font-bold">🎤 AI nghe:</span> <span className="font-mono">{feedback.transcription}</span></p>
          )}
          {feedback.errors.length > 0 && (
            <div className="text-xs mb-1">
              <span className="font-bold">❌ Sai:</span>
              {feedback.errors.map((e, i) => <span key={i} className="ml-1 px-1.5 py-0.5 bg-white/60 rounded text-[10px]">{e}</span>)}
            </div>
          )}
          {feedback.advice && (
            <p className="text-xs"><span className="font-bold">💡 Gợi ý:</span> {feedback.advice}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PracticeItem;
