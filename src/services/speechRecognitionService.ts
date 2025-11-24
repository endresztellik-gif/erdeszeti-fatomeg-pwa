import { SpeechRecognitionResult } from '@app-types/volumeTable';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as CapacitorSpeechRecognition } from '@capacitor-community/speech-recognition';

// Web Speech API típusdefiníciók (globális interface-ek kiegészítése)
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

/**
 * Platform típus
 */
type Platform = 'web' | 'ios' | 'android';

/**
 * Beszédfelismerés szolgáltatás
 * Magyar nyelv támogatással
 * - Web: Web Speech API (Chrome/Edge desktop)
 * - iOS/Android: Capacitor Speech Recognition plugin (natív)
 */
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private platform: Platform;

  constructor() {
    // Platform detektálás
    this.platform = Capacitor.getPlatform() as Platform;

    // Web Speech API inicializálás (csak web platformon)
    if (this.platform === 'web' && 'webkitSpeechRecognition' in window) {
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
  async start(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    // Natív platform (iOS/Android)
    if (this.platform === 'ios' || this.platform === 'android') {
      try {
        // Engedély kérése
        const { available } = await CapacitorSpeechRecognition.available();
        if (!available) {
          onError('Beszédfelismerés nem elérhető ezen az eszközön');
          return;
        }

        const { speechRecognition: permissionGranted } = await CapacitorSpeechRecognition.requestPermissions();
        if (!permissionGranted) {
          onError('Mikrofon engedély megtagadva');
          return;
        }

        // Beszédfelismerés indítása
        this.isListening = true;

        CapacitorSpeechRecognition.start({
          language: 'hu-HU',
          maxResults: 1,
          prompt: 'Mondj be egy mérést',
          partialResults: false,
          popup: false,
        });

        // Eredmény figyelése
        CapacitorSpeechRecognition.addListener('partialResults', (data: any) => {
          if (data.matches && data.matches.length > 0) {
            onResult({
              transcript: data.matches[0],
              confidence: 1.0,
              isFinal: false,
            });
          }
        });

        CapacitorSpeechRecognition.addListener('listeningState', (state: any) => {
          if (!state.isListening) {
            this.isListening = false;
          }
        });

      } catch (error: any) {
        console.error('Capacitor Speech Recognition error:', error);
        onError(error.message || 'Hiba történt a beszédfelismerés során');
        this.isListening = false;
      }
      return;
    }

    // Web platform (Web Speech API)
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
  async stop(): Promise<void> {
    if (this.platform === 'ios' || this.platform === 'android') {
      try {
        await CapacitorSpeechRecognition.stop();
        this.isListening = false;
      } catch (error) {
        console.error('Error stopping Capacitor speech recognition:', error);
      }
      return;
    }

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
    if (this.platform === 'ios' || this.platform === 'android') {
      return true; // Natív platformokon mindig támogatott (permission check later)
    }
    return this.recognition !== null; // Web: csak ha Web Speech API elérhető
  }

  /**
   * Platform lekérdezése
   */
  getPlatform(): Platform {
    return this.platform;
  }
}

// Singleton instance export
export const speechRecognition = new SpeechRecognitionService();
