export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;

  async start(onAudioData: (base64Data: string) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    
    // ScriptProcessorNode is deprecated but widely supported for simple PCM conversion
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16Data = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; ++i) {
        pcm16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      
      const buffer = pcm16Data.buffer;
      const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      onAudioData(base64);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class AudioPlayer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private isProcessing = false;
  private queue: Float32Array[] = [];
  private onVolumeChange?: (volume: number) => void;

  constructor(onVolumeChange?: (volume: number) => void) {
    this.audioContext = new AudioContext({ sampleRate: 24000 }); // Gemini output is typically 24kHz
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.5;
    this.analyser.connect(this.audioContext.destination);
    this.onVolumeChange = onVolumeChange;
    this.loopAnalysys();
  }

  private loopAnalysys = () => {
    if (this.audioContext.state !== 'closed' && this.onVolumeChange) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalize roughly to 0-1
      const normalizedVolume = Math.min(1.0, average / 100.0);
      this.onVolumeChange(normalizedVolume);
    }
    requestAnimationFrame(this.loopAnalysys);
  };

  playPcm16Base64(base64: string) {
    const raw = atob(base64);
    const int16Array = new Int16Array(raw.length / 2);
    for (let i = 0; i < int16Array.length; i++) {
      int16Array[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
      // Handle sign expansion for 16-bit
      if (int16Array[i] & 0x8000) {
        int16Array[i] |= 0xFFFF0000;
      }
    }

    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    this.queue.push(float32Array);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    this.isProcessing = true;
    const float32Array = this.queue.shift()!;
    
    if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);
    
    source.onended = () => {
      this.processQueue();
    };
    source.start();
  }

  stop() {
    this.queue = [];
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
