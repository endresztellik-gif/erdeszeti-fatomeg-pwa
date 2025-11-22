/**
 * Alkalmazás beállítások (LocalStorage)
 */
export interface AppSettings {
  /** Beszéd sebesség (0.1 - 10) */
  speechRate: number;

  /** Visszamondás engedélyezve */
  autoSpeakConfirmation: boolean;

  /** Automatikus szüneteltetés telefonhívás esetén */
  autoPauseOnPhoneCall: boolean;

  /** Alapértelmezett magasság mód */
  defaultHeightMode: 'average' | 'perTree';

  /** Sötét mód (opcionális) */
  darkMode?: boolean;

  /** Cloud sync beállítások */
  cloudSync?: {
    enabled: boolean;
    provider: 'googleDrive' | 'iCloud' | 'nextcloud';
    lastSyncAt?: number;
  };
}

/**
 * Alapértelmezett beállítások
 */
export const defaultSettings: AppSettings = {
  speechRate: 1.0,
  autoSpeakConfirmation: true,
  autoPauseOnPhoneCall: true,
  defaultHeightMode: 'perTree',
  darkMode: false,
};
