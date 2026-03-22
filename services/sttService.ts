/**
 * STT Service (Speech to Text) — OFFLINE
 * Uses MediaRecorder + local faster-whisper backend (POST /stt)
 * Includes real-time mic volume metering via AudioContext/AnalyserNode.
 * No internet required.
 */

export class STTService {
  private static instance: STTService;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  private onVolumeCallback: ((volume: number) => void) | null = null;

  // Mic volume metering
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeAnimFrame: number | null = null;

  private readonly STT_URL = 'http://127.0.0.1:8001/stt';

  private constructor() {}

  public static getInstance(): STTService {
    if (!STTService.instance) {
      STTService.instance = new STTService();
    }
    return STTService.instance;
  }

  public setLanguage(_lang: string) {
    // Language is configured server-side (default: vi)
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError?: (err: any) => void,
    onVolume?: (volume: number) => void
  ) {
    if (this.isListening) return;

    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError || null;
    this.onVolumeCallback = onVolume || null;
    this.chunks = [];

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.audioStream = stream;
        this.isListening = true;

        // Setup mic volume metering
        this.setupVolumeMeter(stream);

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        this.mediaRecorder = new MediaRecorder(stream, { mimeType });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.chunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          this.stopVolumeMeter();
          this.processAudio();
        };

        this.mediaRecorder.onerror = (event: any) => {
          console.error('[STT Offline] MediaRecorder error:', event);
          this.cleanup();
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error || 'MediaRecorder error');
          }
        };

        this.mediaRecorder.start();
        console.log('[STT Offline] Recording started...');
      })
      .catch((err) => {
        console.error('[STT Offline] Microphone access denied:', err);
        this.isListening = false;
        if (onError) {
          onError('microphone_denied');
        }
      });
  }

  private setupVolumeMeter(stream: MediaStream) {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const measureVolume = () => {
        if (!this.analyser || !this.onVolumeCallback) return;

        this.analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const volume = Math.min(100, Math.floor(rms * 500)); // Amplified for UI

        this.onVolumeCallback(volume);
        this.volumeAnimFrame = requestAnimationFrame(measureVolume);
      };

      measureVolume();
    } catch (e) {
      console.warn('[STT] Volume metering not available:', e);
    }
  }

  private stopVolumeMeter() {
    if (this.volumeAnimFrame) {
      cancelAnimationFrame(this.volumeAnimFrame);
      this.volumeAnimFrame = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    if (this.onVolumeCallback) {
      this.onVolumeCallback(0);
    }
  }

  public stopListening() {
    if (this.mediaRecorder && this.isListening) {
      console.log('[STT Offline] Stopping recording...');
      try {
        this.mediaRecorder.stop();
      } catch {
        this.stopVolumeMeter();
        this.cleanup();
      }
    }
  }

  private async processAudio() {
    if (this.chunks.length === 0) {
      console.warn('[STT Offline] No audio data captured.');
      this.cleanup();
      if (this.onEndCallback) this.onEndCallback();
      return;
    }

    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    this.chunks = [];

    if (this.onResultCallback) {
      this.onResultCallback('Đang nhận diện...', false);
    }

    try {
      // Ping check Backend trước khi gửi Audio
      const ping = await fetch('http://127.0.0.1:8001/').catch(() => null);
      if (!ping || !ping.ok) {
        throw new Error("Backend chưa sẵn sàng hoặc model STT chưa load xong.");
      }

      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const response = await fetch(this.STT_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 503) {
        throw new Error('Lỗi Server Backend: Thiếu FFmpeg hoặc model chưa load');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = (data.text || '').trim();

      if (text && this.onResultCallback) {
        console.log(`[STT Offline] Result: "${text}"`);
        this.onResultCallback(text, true);
      } else {
        console.log('[STT Offline] No speech detected.');
      }
    } catch (err: any) {
      console.error('[STT Offline] Transcription request failed:', err);
      if (this.onErrorCallback) {
        this.onErrorCallback(err.message || err);
      }
    } finally {
      this.cleanup();
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    }
  }

  private cleanup() {
    this.isListening = false;
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    this.mediaRecorder = null;
  }
}
