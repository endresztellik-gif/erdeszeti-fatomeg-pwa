import { SpeechRecognitionResult } from '@app-types/volumeTable';

// Web Speech API típusdefiníciók (globális interface-ek kiegészítése)
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

/**
 * Beszédfelismerés szolgáltatás
 * Magyar nyelv támogatással, Web Speech API wrapper
 */
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    // Böngésző kompatibilitás ellenőrzése
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition();
      this.recognition.lang = 'hu-HU';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }
  }

  /**
   * Beszédfelismerés indítása
   */
  start(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError('Beszédfelismerés nem támogatott ebben a böngészőben');
      return;
    }

    this.recognition.onresult = (event) => {
      const result = event.results[0][0];
      onResult({
        transcript: result.transcript,
        confidence: result.confidence,
        isFinal: event.results[0].isFinal,
      });
    };

    this.recognition.onerror = (event) => {
      let errorMessage = 'Hiba történt a beszédfelismerés során';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Nem észleltünk beszédet';
          break;
        case 'audio-capture':
          errorMessage = 'Nincs mikrofon vagy nem engedélyezett';
          break;
        case 'not-allowed':
          errorMessage = 'Mikrofon hozzáférés megtagadva';
          break;
        case 'network':
          errorMessage = 'Nincs internetkapcsolat (beszédfelismeréshez szükséges)';
          break;
      }

      onError(errorMessage);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      onError('A beszédfelismerés már fut');
      this.isListening = false;
    }
  }

  /**
   * Beszédfelismerés leállítása
   */
  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Aktuális állapot lekérdezése
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Támogatott-e a beszédfelismerés
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }
}

// Singleton instance export
export const speechRecognition = new SpeechRecognitionService();
