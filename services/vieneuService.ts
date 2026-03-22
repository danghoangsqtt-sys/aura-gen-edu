/**
 * VieNeu TTS Service
 * Connects to local VieNeu server (http://127.0.0.1:8001)
 * Extracts real-time Audio RMS (Volume) for high-fidelity Lip-sync
 */

export class VieneuService {
  private static instance: VieneuService;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private animationFrame: number | null = null;

  private constructor() {}

  public static getInstance(): VieneuService {
    if (!VieneuService.instance) {
      VieneuService.instance = new VieneuService();
    }
    return VieneuService.instance;
  }

  private initAudioContext(audio: HTMLAudioElement) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Config analyser
    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256; // Smaller for real-time RMS
    }

    // Connect source
    if (this.source) {
        this.source.disconnect();
    }
    this.source = this.audioContext.createMediaElementSource(audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.removeAttribute('src'); // Thay thế để tránh lỗi fetch nhầm 5173
      this.currentAudio = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    // We keep the AudioContext/Analyser alive for reuse in Singleton
  }

  public async speak(
    text: string,
    onVolumeChange: (vol: number) => void,
    onEnd: () => void
  ) {
    try {
      this.stop();

      if (!text.trim()) {
        onEnd();
        return;
      }

      const safeText = text.replace(/[*#_]/g, '').trim();
      if (!safeText) {
        onEnd();
        return;
      }
      const voiceId = 'Ly (nữ miền Bắc)';
      const url = `http://127.0.0.1:8001/stream?text=${encodeURIComponent(safeText)}&voice_id=${encodeURIComponent(voiceId)}`;
      
      // Ping server with retry logic (Backend can take 30-60s to load TTS+STT models on CPU)
      const MAX_PING_ATTEMPTS = 15;
      const PING_INTERVAL_MS = 3000;
      let serverAlive = false;
      for (let attempt = 1; attempt <= MAX_PING_ATTEMPTS; attempt++) {
        try {
          const ping = await fetch('http://127.0.0.1:8001/', { method: 'GET' });
          if (ping && ping.ok) {
            serverAlive = true;
            console.info(`[VieNeu TTS] ✅ Server is ready (attempt ${attempt}/${MAX_PING_ATTEMPTS})`);
            break;
          }
        } catch {
          // ignore fetch error
        }
        if (attempt < MAX_PING_ATTEMPTS) {
          console.warn(`[VieNeu TTS] Server ping attempt ${attempt}/${MAX_PING_ATTEMPTS} failed, retrying in ${PING_INTERVAL_MS / 1000}s...`);
          await new Promise(r => setTimeout(r, PING_INTERVAL_MS));
        }
      }
      if (!serverAlive) {
        console.error("[VieNeu TTS] Server is not responding after 45 seconds. TTS backend may have crashed.");
        onEnd(); 
        return;
      }
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      this.currentAudio = audio;

      this.initAudioContext(audio);

      const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);

      const updateVolume = () => {
        if (!this.analyser) return;
        
        this.analyser.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) for Volume
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
          sumSquares += normalized * normalized;
        }
        
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const volume = Math.min(100, Math.floor(rms * 400)); // Amplify for UI (range 0-100)
        
        onVolumeChange(volume);
        this.animationFrame = requestAnimationFrame(updateVolume);
      };

      audio.onplay = () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume();
        }
        updateVolume();
      };

      audio.onended = () => {
        this.stop();
        onVolumeChange(0);
        onEnd();
      };

      audio.onerror = (err) => {
        console.error('[VieNeu TTS] URL Failed:', audio.src);
        console.error('[VieNeu TTS] Error details:', err);
        this.stop();
        onVolumeChange(0);
        onEnd(); // Bắt buộc gọi onEnd để giải phóng UI
      };

      audio.play().catch(err => {
        if (err.name === 'AbortError') {
          console.log('[VieNeu TTS] Playback aborted intentionally.');
        } else {
          console.error('[VieNeu TTS] Playback failed:', err);
          onEnd();
        }
      });
    } catch (err) {
      console.error('VieNeu Service Critical Error:', err);
      onEnd();
    }
  }
}
