/**
 * Offline Text-to-Speech Service using Web Speech API
 * Includes a lip-sync hack for Live2D volume simulation
 */

export class OfflineTTSService {
  private static instance: OfflineTTSService;
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private lipSyncInterval: any = null;

  private constructor() {
    this.synth = window.speechSynthesis;
    this.initVoices();
    // Some browsers need this event to populate voices
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.initVoices();
    }
  }

  public static getInstance(): OfflineTTSService {
    if (!OfflineTTSService.instance) {
      OfflineTTSService.instance = new OfflineTTSService();
    }
    return OfflineTTSService.instance;
  }

  private initVoices() {
    this.voices = this.synth.getVoices();
  }

  private getBestVoice(lang: 'en' | 'vi'): SpeechSynthesisVoice | null {
    const voices = this.voices.filter(v => v.lang.startsWith(lang));
    if (voices.length === 0) return null;

    // Priority for female-sounding voices in EN
    if (lang === 'en') {
      const preferred = voices.find(v => 
        v.name.includes('Zira') || 
        v.name.includes('Female') || 
        v.name.includes('UK English Female') ||
        v.name.includes('Google US English')
      );
      return preferred || voices[0];
    }

    // Priority for female-sounding voices in VI
    if (lang === 'vi') {
      const preferred = voices.find(v => v.name.includes('HoaiMy') || v.name.includes('Female'));
      return preferred || voices[0];
    }

    return voices[0];
  }

  public stop() {
    this.synth.cancel();
    if (this.lipSyncInterval) {
      clearInterval(this.lipSyncInterval);
      this.lipSyncInterval = null;
    }
  }

  public speak(
    text: string, 
    onVolumeChange: (vol: number) => void, 
    onEnd: () => void
  ) {
    this.stop();

    if (!text.trim()) {
      onEnd();
      return;
    }

    // Detect language (simple check: if contains Vietnamese chars)
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    const voice = this.getBestVoice(isVietnamese ? 'vi' : 'en');

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Slightly higher for "Sensei" feel

    utterance.onstart = () => {
      // Lip-sync hack: random volume every 100ms
      this.lipSyncInterval = setInterval(() => {
        const fakeVol = Math.floor(Math.random() * 60) + 20; // 20 to 80
        onVolumeChange(fakeVol);
      }, 100);
    };

    utterance.onend = () => {
      if (this.lipSyncInterval) {
        clearInterval(this.lipSyncInterval);
        this.lipSyncInterval = null;
      }
      onVolumeChange(0);
      onEnd();
    };

    utterance.onerror = (err) => {
      console.error('TTS Error:', err);
      this.stop();
      onVolumeChange(0);
      onEnd();
    };

    this.synth.speak(utterance);
  }
}
