import type { AppSettings } from '@/types/settings';
import { defaultSettings } from '@/types/settings';

/**
 * Beállítások szolgáltatás - LocalStorage wrapper
 * Terepi erdészeti mérések beállításainak kezelése
 */
class SettingsService {
  private readonly STORAGE_KEY = 'erdeszeti-fatomeg-settings';
  private currentSettings: AppSettings;
  private listeners: Set<(settings: AppSettings) => void> = new Set();

  constructor() {
    this.currentSettings = this.loadSettings();
  }

  /**
   * Beállítások betöltése LocalStorage-ből
   */
  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return { ...defaultSettings };

      const parsed = JSON.parse(stored) as Partial<AppSettings>;

      // Merge with defaults to ensure all properties exist
      return {
        ...defaultSettings,
        ...parsed,
        // Validate speechRate bounds
        speechRate: Math.max(0.1, Math.min(10, parsed.speechRate ?? 1.0)),
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return { ...defaultSettings };
    }
  }

  /**
   * Beállítások mentése LocalStorage-be
   */
  private saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      this.notifyListeners(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Nem sikerült menteni a beállításokat');
    }
  }

  /**
   * Listener értesítése változásról
   */
  private notifyListeners(settings: AppSettings): void {
    this.listeners.forEach(listener => listener(settings));
  }

  /**
   * Összes beállítás lekérése
   */
  getSettings(): AppSettings {
    return { ...this.currentSettings };
  }

  /**
   * Beállítások frissítése (partial update)
   */
  updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.currentSettings = {
      ...this.currentSettings,
      ...updates,
    };

    // Validate speechRate
    if (updates.speechRate !== undefined) {
      this.currentSettings.speechRate = Math.max(
        0.1,
        Math.min(10, updates.speechRate)
      );
    }

    this.saveSettings(this.currentSettings);
    return this.getSettings();
  }

  /**
   * Egyedi beállítás lekérése
   */
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.currentSettings[key];
  }

  /**
   * Egyedi beállítás frissítése
   */
  setSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): void {
    this.updateSettings({ [key]: value } as Partial<AppSettings>);
  }

  /**
   * Beállítások visszaállítása alapértelmezettre
   */
  resetToDefaults(): AppSettings {
    this.currentSettings = { ...defaultSettings };
    this.saveSettings(this.currentSettings);
    return this.getSettings();
  }

  /**
   * Listener hozzáadása (változás figyelés)
   */
  addListener(listener: (settings: AppSettings) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dark mode alkalmazása (document root)
   */
  applyDarkMode(enabled: boolean): void {
    if (enabled) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }

  /**
   * Beállítások exportálása (backup)
   */
  exportSettings(): string {
    return JSON.stringify(this.currentSettings, null, 2);
  }

  /**
   * Beállítások importálása (restore)
   */
  importSettings(json: string): AppSettings {
    try {
      const parsed = JSON.parse(json) as Partial<AppSettings>;
      return this.updateSettings(parsed);
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw new Error('Érvénytelen beállítás formátum');
    }
  }
}

// Singleton instance
export const settingsService = new SettingsService();
