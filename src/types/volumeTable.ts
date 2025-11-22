/**
 * Egy fafajhoz tartozó fatömegtábla
 */
export interface VolumeTable {
  /** Fafaj neve magyarul */
  species: string;

  /** Fafaj kódja (pl. "B" - Bükk) */
  speciesCode: string;

  /** Táblázatban szereplő átmérők (cm) */
  diameters: number[];

  /** Táblázatban szereplő magasságok (m) */
  heights: number[];

  /** Fatömeg értékek mátrix formában */
  values: {
    [diameter: string]: {
      [height: string]: number; // m³
    };
  };
}

/**
 * Beszédfelismerés eredménye
 */
export interface SpeechRecognitionResult {
  /** Felismert szöveg */
  transcript: string;

  /** Felismerés pontossága (0-1 között) */
  confidence: number;

  /** Végleges eredmény-e (nem interim) */
  isFinal: boolean;
}

/**
 * Szövegfelolvasás beállításai
 */
export interface TTSOptions {
  /** Beszéd sebessége (0.1 - 10, alapértelmezett: 1) */
  rate?: number;

  /** Hangmagasság (0 - 2, alapértelmezett: 1) */
  pitch?: number;

  /** Hangerő (0 - 1, alapértelmezett: 1) */
  volume?: number;

  /** Hang kiválasztása (opcionális) */
  voice?: SpeechSynthesisVoice;
}

/**
 * Fatömeg számítás eredménye
 */
export interface CalculationResult {
  /** Kiszámított fatömeg (m³) */
  volumeM3: number;

  /** Táblázat tartományán belül van-e */
  isInRange: boolean;

  /** Figyelmeztetés (opcionális) */
  warning?: string;

  /** Interpolálva van-e (későbbi funkció) */
  interpolated?: boolean;
}

/**
 * Input validáció eredménye
 */
export interface ValidationResult {
  /** Érvényes-e az input */
  isValid: boolean;

  /** Hibaüzenet (ha nem érvényes) */
  error?: string;

  /** Figyelmeztetés (érvényes, de gyanús érték) */
  warning?: string;
}
