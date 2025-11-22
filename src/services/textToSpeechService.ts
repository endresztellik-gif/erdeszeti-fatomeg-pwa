import { TTSOptions } from '@app-types/volumeTable';

/**
 * Szövegfelolvasás szolgáltatás
 * Web Speech Synthesis API wrapper magyar nyelv támogatással
 */
export class TextToSpeechService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
  }

  /**
   * Magyar hang betöltése
   */
  private loadVoices(): void {
    const loadVoiceList = () => {
      const voices = this.synth.getVoices();
      // Magyar hang keresése
      this.voice = voices.find((v) => v.lang === 'hu-HU') || voices[0];
    };

    loadVoiceList();

    // Safari-ban később töltődnek be a hangok
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoiceList;
    }
  }

  /**
   * Szöveg felolvasása
   */
  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject('Szövegfelolvasás nem támogatott');
        return;
      }

      // Ha már beszél, állítsuk le
      if (this.synth.speaking) {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hu-HU';
      utterance.voice = this.voice;
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synth.speak(utterance);
    });
  }

  /**
   * Felolvasás leállítása
   */
  stop(): void {
    this.synth.cancel();
  }

  /**
   * Beszél-e éppen
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  /**
   * Támogatott-e a szövegfelolvasás
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Elérhető hangok listája
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }
}

// Singleton instance export
export const textToSpeech = new TextToSpeechService();
