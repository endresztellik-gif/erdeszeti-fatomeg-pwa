import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '@components/layout/MainLayout';
import VoiceInput from '@components/measurement/VoiceInput';
import LogMeasurementForm from '@components/measurement/LogMeasurementForm';
import LocationForm, { LocationData } from '@components/measurement/LocationForm';
import { logSurveyService } from '@services/surveyService';
import { textToSpeech } from '@services/textToSpeechService';
import { LogSession, LogMeasurement } from '@app-types/measurement';
import { speciesNames } from '@data/speciesSpeechPatterns';
import './LogSurveyPage.css';

/**
 * Rönkköbözés felmérés oldal
 */
export default function LogSurveyPage() {
  const [session, setSession] = useState<LogSession | null>(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(true);
  const [defaultSpecies, setDefaultSpecies] = useState('beech');
  const [defaultLength, setDefaultLength] = useState(4);

  const navigate = useNavigate();
  const location = useLocation();

  const interruptedCheckDone = useRef(false);

  // Session létrehozása vagy folytatása
  useEffect(() => {
    async function initSession() {
      try {
        const locationState = location.state as { resumeSessionId?: string } | null;

        if (locationState?.resumeSessionId) {
          const existingSession = await logSurveyService.getSession(
            locationState.resumeSessionId
          );
          if (existingSession) {
            await logSurveyService.resumeSession(existingSession.id);
            setSession(existingSession);

            // Restore defaults from session
            if (existingSession.defaultSpecies) {
              setDefaultSpecies(existingSession.defaultSpecies);
            }
            if (existingSession.defaultLengthM) {
              setDefaultLength(existingSession.defaultLengthM);
            }

            textToSpeech.speak(
              `Felmérés folytatva. ${existingSession.logs.length} rönk eddig.`
            );
            setLoading(false);
            return;
          }
        }

        // Create new session
        const newSession = await logSurveyService.createSession();
        setSession(newSession);
      } catch (error) {
        console.error('Hiba a session kezelése során:', error);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [location.state]);

  // Check for interrupted session
  useEffect(() => {
    const checkInterrupted = async () => {
      const locationState = location.state as { resumeSessionId?: string } | null;
      if (interruptedCheckDone.current || locationState?.resumeSessionId) {
        return;
      }
      interruptedCheckDone.current = true;

      const interruptedId = sessionStorage.getItem('interruptedLogSessionId');
      if (interruptedId) {
        const interrupted = await logSurveyService.getSession(interruptedId);
        if (interrupted && interrupted.isPaused && interrupted.logs.length > 0) {
          const resume = confirm(
            `Félbeszakadt rönkköbözés (${interrupted.logs.length} rönk). Folytatod?`
          );
          if (resume) {
            sessionStorage.removeItem('interruptedLogSessionId');
            navigate('/survey/log', {
              state: { resumeSessionId: interruptedId },
              replace: true,
            });
            return;
          }
        }
        sessionStorage.removeItem('interruptedLogSessionId');
      }
    };

    const timer = setTimeout(checkInterrupted, 500);
    return () => clearTimeout(timer);
  }, [navigate, location.state]);

  // Auto-save on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && session && session.logs.length > 0) {
        try {
          await logSurveyService.updateSession(session.id, {
            isPaused: true,
            defaultSpecies,
            defaultLengthM: defaultLength,
          });
          sessionStorage.setItem('interruptedLogSessionId', session.id);
        } catch (err) {
          console.error('Error auto-saving session:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session, defaultSpecies, defaultLength]);

  const handleMeasurementComplete = async () => {
    if (session) {
      const updatedSession = await logSurveyService.getSession(session.id);
      if (updatedSession) {
        setSession(updatedSession);
      }
    }
  };

  const handlePause = async () => {
    if (session) {
      await logSurveyService.updateSession(session.id, {
        isPaused: true,
        defaultSpecies,
        defaultLengthM: defaultLength,
      });
      navigate('/');
    }
  };

  const handleLocationChange = async (locationData: LocationData) => {
    if (session) {
      let locationString = '';
      if (locationData.type === 'erdoreszlet') {
        locationString = `${locationData.kozseg || ''} ${locationData.erdotag || ''}${locationData.erdoreszlet || ''}`.trim();
      } else {
        locationString = `${locationData.kozseg || ''} ${locationData.helyrajziSzam || ''}`.trim();
      }

      session.location = locationString;
      session.locationData = locationData;
      await logSurveyService.updateSession(session.id, {
        location: locationString,
        locationData: locationData,
      });
    }
  };

  const handleDefaultsChange = async (species: string, length: number) => {
    setDefaultSpecies(species);
    setDefaultLength(length);

    if (session) {
      await logSurveyService.updateSession(session.id, {
        defaultSpecies: species,
        defaultLengthM: length,
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Betöltés...</p>
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return (
      <MainLayout>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <p>Hiba a session létrehozása során!</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="log-survey-page">
        <h2 className="survey-title">Rönkköbözés</h2>

        <LocationForm
          onLocationChange={handleLocationChange}
          initialData={session.locationData}
        />

        <div className="survey-info">
          <p>
            Mért rönkök: <strong>{session.logs.length}</strong>
          </p>
        </div>

        <VoiceInput onTranscript={setTranscript} />

        <LogMeasurementForm
          sessionId={session.id}
          transcript={transcript}
          onComplete={handleMeasurementComplete}
          onClearTranscript={() => setTranscript('')}
          onNewTranscript={setTranscript}
          defaultSpecies={defaultSpecies}
          defaultLength={defaultLength}
          onDefaultsChange={handleDefaultsChange}
          onPause={handlePause}
        />

        {/* Last 5 measurements */}
        <LogMeasurementList logs={session.logs.slice(-5)} />

        {session.logs.length > 0 && (
          <div className="survey-summary">
            <h3>Összesítés</h3>
            <p>
              Összes térfogat:{' '}
              <strong>
                {session.logs.reduce((sum, l) => sum + l.volumeM3, 0).toFixed(3)} m³
              </strong>
            </p>
            <div className="export-buttons">
              <button
                onClick={() => exportLogSessionExcel(session)}
                className="export-btn excel"
              >
                Excel
              </button>
              <button
                onClick={() => exportLogSessionCSV(session)}
                className="export-btn csv"
              >
                CSV
              </button>
            </div>
            <button onClick={handlePause} className="btn-pause">
              Szünet
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

/**
 * Log mérés lista komponens
 */
function LogMeasurementList({ logs }: { logs: LogMeasurement[] }) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="log-measurement-list">
      <h4>Utolsó mérések</h4>
      <div className="log-list">
        {logs
          .slice()
          .reverse()
          .map((log, index) => (
            <div key={log.id} className="log-item">
              <span className="log-index">{logs.length - index}.</span>
              <span className="log-species">{speciesNames[log.species] || log.species}</span>
              <span className="log-diameter">{log.tipDiameterCm} cm</span>
              <span className="log-length">{log.lengthM} m</span>
              <span className="log-volume">{log.volumeM3.toFixed(3)} m³</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// Temporary export functions until exportService is extended
function exportLogSessionExcel(session: LogSession) {
  const data = session.logs.map((log, i) => ({
    sorszam: i + 1,
    fafaj: speciesNames[log.species] || log.species,
    csucsatmero_cm: log.tipDiameterCm,
    hossz_m: log.lengthM,
    terfogat_m3: log.volumeM3.toFixed(4),
    beta: log.betaValue.toFixed(6),
  }));

  const total = session.logs.reduce((sum, l) => sum + l.volumeM3, 0);

  // CSV format for now
  const headers = ['Sorszám', 'Fafaj', 'Csúcsátmérő (cm)', 'Hossz (m)', 'Térfogat (m³)', 'Béta'];
  const rows = data.map((d) =>
    [d.sorszam, d.fafaj, d.csucsatmero_cm, d.hossz_m, d.terfogat_m3, d.beta].join(';')
  );

  const csv = [headers.join(';'), ...rows, '', `Összesen:;${session.logs.length} rönk;;;${total.toFixed(3)} m³`].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ronkkobozes_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportLogSessionCSV(session: LogSession) {
  exportLogSessionExcel(session); // Same for now
}
