import { useState, useEffect } from 'react';
import MainLayout from '@components/layout/MainLayout';
import { settingsService } from '@services/settingsService';
import type { AppSettings } from '@/types/settings';
import './SettingsPage.css';

/**
 * Beállítások oldal - Forest Engineering aesthetic
 * Erdészeti terepi mérések beállításai
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(
    settingsService.getSettings()
  );
  const [saveIndicator, setSaveIndicator] = useState(false);

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = settingsService.addListener((newSettings) => {
      setSettings(newSettings);
      showSaveIndicator();
    });

    // Apply dark mode on mount
    settingsService.applyDarkMode(settings.darkMode ?? false);

    return unsubscribe;
  }, []);

  const showSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };

  const handleSpeechRateChange = (value: number) => {
    settingsService.updateSettings({ speechRate: value });
  };

  const handleToggle = (key: keyof AppSettings, value: boolean) => {
    settingsService.updateSettings({ [key]: value } as Partial<AppSettings>);

    // Apply dark mode immediately
    if (key === 'darkMode') {
      settingsService.applyDarkMode(value);
    }
  };

  const handleHeightModeChange = (mode: 'average' | 'perTree') => {
    settingsService.updateSettings({ defaultHeightMode: mode });
  };

  const handleReset = () => {
    if (
      confirm(
        'Biztosan visszaállítod az alapértelmezett beállításokat?\n\nEz nem érinti a mentett méréseket.'
      )
    ) {
      const defaults = settingsService.resetToDefaults();
      setSettings(defaults);
      settingsService.applyDarkMode(defaults.darkMode ?? false);
    }
  };

  return (
    <MainLayout>
      <div className="settings-page">
        {/* Header */}
        <header className="settings-header">
          <h1 className="settings-title">Beállítások</h1>
          <p className="settings-subtitle">
            Terepi mérési preferenciák személyre szabása
          </p>
          {saveIndicator && (
            <div className="save-indicator">
              <span className="save-icon">✓</span>
              Mentve
            </div>
          )}
        </header>

        {/* Settings Grid */}
        <div className="settings-grid">
          {/* Voice Settings Card */}
          <section className="settings-card" style={{ animationDelay: '0.1s' }}>
            <div className="card-header">
              <span className="card-icon">🎙️</span>
              <h2 className="card-title">Hangvezérlés</h2>
            </div>

            <div className="settings-group">
              {/* Speech Rate Slider */}
              <div className="setting-item">
                <label className="setting-label">
                  <span className="label-text">Beszéd sebesség</span>
                  <span className="label-value">{settings.speechRate.toFixed(1)}x</span>
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.speechRate}
                    onChange={(e) =>
                      handleSpeechRateChange(parseFloat(e.target.value))
                    }
                    className="speech-rate-slider"
                  />
                  <div className="slider-track-fill" style={{ width: `${((settings.speechRate - 0.5) / 1.5) * 100}%` }} />
                </div>
                <div className="slider-labels">
                  <span>Lassú</span>
                  <span>Gyors</span>
                </div>
              </div>

              {/* Auto Speak Confirmation Toggle */}
              <div className="setting-item">
                <label className="setting-label">
                  <span className="label-text">Automatikus visszamondás</span>
                  <span className="label-description">
                    A mérés visszamondása hangosan
                  </span>
                </label>
                <button
                  className={`forest-toggle ${settings.autoSpeakConfirmation ? 'active' : ''}`}
                  onClick={() =>
                    handleToggle(
                      'autoSpeakConfirmation',
                      !settings.autoSpeakConfirmation
                    )
                  }
                  aria-label="Automatikus visszamondás kapcsoló"
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </button>
              </div>

              {/* Auto Pause Toggle */}
              <div className="setting-item">
                <label className="setting-label">
                  <span className="label-text">Auto szünet híváskor</span>
                  <span className="label-description">
                    Mérés szüneteltetése telefonhívás esetén
                  </span>
                </label>
                <button
                  className={`forest-toggle ${settings.autoPauseOnPhoneCall ? 'active' : ''}`}
                  onClick={() =>
                    handleToggle(
                      'autoPauseOnPhoneCall',
                      !settings.autoPauseOnPhoneCall
                    )
                  }
                  aria-label="Auto szünet kapcsoló"
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Measurement Settings Card */}
          <section className="settings-card" style={{ animationDelay: '0.2s' }}>
            <div className="card-header">
              <span className="card-icon">📏</span>
              <h2 className="card-title">Mérési Preferenciák</h2>
            </div>

            <div className="settings-group">
              {/* Height Mode Selector */}
              <div className="setting-item">
                <label className="setting-label">
                  <span className="label-text">Alapértelmezett magasság mód</span>
                  <span className="label-description">
                    Hogyan kezeljük a famagasságokat
                  </span>
                </label>
                <div className="segmented-control">
                  <button
                    className={`segment ${settings.defaultHeightMode === 'average' ? 'active' : ''}`}
                    onClick={() => handleHeightModeChange('average')}
                  >
                    <span className="segment-icon">📊</span>
                    <span className="segment-text">Átlagmagasság</span>
                  </button>
                  <button
                    className={`segment ${settings.defaultHeightMode === 'perTree' ? 'active' : ''}`}
                    onClick={() => handleHeightModeChange('perTree')}
                  >
                    <span className="segment-icon">🌲</span>
                    <span className="segment-text">Fánként</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Appearance Settings Card */}
          <section className="settings-card" style={{ animationDelay: '0.3s' }}>
            <div className="card-header">
              <span className="card-icon">🎨</span>
              <h2 className="card-title">Megjelenés</h2>
            </div>

            <div className="settings-group">
              {/* Dark Mode Toggle */}
              <div className="setting-item">
                <label className="setting-label">
                  <span className="label-text">Sötét mód</span>
                  <span className="label-description">
                    Éjszakai terepi használathoz
                  </span>
                </label>
                <button
                  className={`forest-toggle ${settings.darkMode ? 'active' : ''}`}
                  onClick={() => handleToggle('darkMode', !settings.darkMode)}
                  aria-label="Sötét mód kapcsoló"
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* Cloud Sync Card (Future) */}
          <section className="settings-card settings-card-disabled" style={{ animationDelay: '0.4s' }}>
            <div className="card-header">
              <span className="card-icon">☁️</span>
              <h2 className="card-title">Cloud Szinkronizálás</h2>
              <span className="badge-soon">Hamarosan</span>
            </div>

            <div className="settings-group">
              <p className="coming-soon-text">
                Google Drive, iCloud és NextCloud integráció fejlesztés alatt.
              </p>
            </div>
          </section>
        </div>

        {/* Reset Section */}
        <footer className="settings-footer">
          <button className="reset-button" onClick={handleReset}>
            <span className="reset-icon">↻</span>
            <span>Alapértelmezett beállítások visszaállítása</span>
          </button>

          <p className="settings-info">
            A beállítások automatikusan mentésre kerülnek az eszközön.
            <br />A mentett mérések nem érintettek.
          </p>
        </footer>
      </div>
    </MainLayout>
  );
}
