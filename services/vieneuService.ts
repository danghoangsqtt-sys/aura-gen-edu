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
      this.currentAudio.src = ""; // Clear source to free memory
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

  public speak(
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

      const url = `http://127.0.0.1:8001/stream?text=${encodeURIComponent(text)}`;
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
        console.error('VieNeu TTS Error:', err);
        this.stop();
        onVolumeChange(0);
        onEnd();
      };

      audio.play().catch(err => {
        console.error('Failed to play VieNeu stream:', err);
        onEnd();
      });
    } catch (err) {
      console.error('VieNeu Service Critical Error:', err);
      onEnd();
    }
  }
}
