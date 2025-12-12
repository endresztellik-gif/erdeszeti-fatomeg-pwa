import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '@components/layout/MainLayout';
import VoiceInput from '@components/measurement/VoiceInput';
import MeasurementForm from '@components/measurement/MeasurementForm';
import MeasurementList from '@components/measurement/MeasurementList';
import LocationForm, { LocationData } from '@components/measurement/LocationForm';
import AverageHeightSettings from '@components/measurement/AverageHeightSettings';
import { surveyService } from '@services/surveyService';
import { exportService } from '@services/exportService';
import { textToSpeech } from '@services/textToSpeechService';
import { SurveySession } from '@app-types/measurement';
import './StandingTreeSurveyPage.css';

/**
 * Lábon álló erdő felmérése oldal
 */
export default function StandingTreeSurveyPage() {
  const [session, setSession] = useState<SurveySession | null>(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(true);
  const [averageHeights, setAverageHeights] = useState<Map<string, number>>(new Map());

  const navigate = useNavigate();
  const location = useLocation();

  // Ref to track if we already checked for interrupted session
  const interruptedCheckDone = useRef(false);

  // Session létrehozása vagy folytatása oldal betöltéskor
  useEffect(() => {
    async function initSession() {
      try {
        const locationState = location.state as { resumeSessionId?: string } | null;

        // Check if resuming an existing session
        if (locationState?.resumeSessionId) {
          const existingSession = await surveyService.getSession(locationState.resumeSessionId);
          if (existingSession) {
            await surveyService.resumeSession(existingSession.id);
            setSession(existingSession);

            // Restore average heights from session
            if (existingSession.averageHeights) {
              setAverageHeights(new Map(Object.entries(existingSession.averageHeights)));
            }

            textToSpeech.speak(`Felmérés folytatva. ${existingSession.trees.length} fa eddig.`);
            setLoading(false);
            return;
          }
        }

        // Create new session
        const newSession = await surveyService.createSession('standing');
        setSession(newSession);
      } catch (error) {
        console.error('Hiba a session kezelése során:', error);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [location.state]);

  // Check for interrupted session on mount
  useEffect(() => {
    const checkInterrupted = async () => {
      // Skip if already checked or if we're resuming a session
      const locationState = location.state as { resumeSessionId?: string } | null;
      if (interruptedCheckDone.current || locationState?.resumeSessionId) {
        return;
      }
      interruptedCheckDone.current = true;

      const interruptedId = sessionStorage.getItem('interruptedSessionId');
      if (interruptedId) {
        const interrupted = await surveyService.getSession(interruptedId);
        if (interrupted && interrupted.isPaused && interrupted.trees.length > 0) {
          const resume = confirm(
            `Félbeszakadt felmérés található (${interrupted.trees.length} fa, ${interrupted.location || 'helyszín nélkül'}). Folytatod?`
          );
          if (resume) {
            sessionStorage.removeItem('interruptedSessionId');
            navigate('/survey/standing', {
              state: { resumeSessionId: interruptedId },
              replace: true,
            });
            return;
          }
        }
        // Clear the interrupted session ID if not resuming
        sessionStorage.removeItem('interruptedSessionId');
      }
    };

    // Small delay to ensure session is loaded first
    const timer = setTimeout(checkInterrupted, 500);
    return () => clearTimeout(timer);
  }, [navigate, location.state]);

  // Page Visibility API - auto-save on hide (phone call, etc.)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && session && session.trees.length > 0) {
        console.log('App going to background - auto-saving session...');
        try {
          await surveyService.updateSession(session.id, {
            isPaused: true,
            averageHeights: Object.fromEntries(averageHeights),
          });
          sessionStorage.setItem('interruptedSessionId', session.id);
          console.log('Session auto-saved:', session.id);
        } catch (err) {
          console.error('Error auto-saving session:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session, averageHeights]);

  // Session frissítése mérés után
  const handleMeasurementComplete = async () => {
    if (session) {
      const updatedSession = await surveyService.getSession(session.id);
      if (updatedSession) {
        setSession(updatedSession);
      }
    }
  };

  // Szünet kezelése
  const handlePause = async () => {
    if (session) {
      await surveyService.updateSession(session.id, {
        isPaused: true,
        averageHeights: Object.fromEntries(averageHeights),
      });
      navigate('/');
    }
  };

  // Helyszín frissítése
  const handleLocationChange = async (locationData: LocationData) => {
    if (session) {
      // Generálunk egy szöveges location string-et is
      let locationString = '';
      if (locationData.type === 'erdoreszlet') {
        // Formátum: "Sopron 16A"
        locationString = `${locationData.kozseg || ''} ${locationData.erdotag || ''}${locationData.erdoreszlet || ''}`.trim();
      } else {
        // Formátum: "Sopron 025/2b"
        locationString = `${locationData.kozseg || ''} ${locationData.helyrajziSzam || ''}`.trim();
      }

      // Frissítjük a session-t
      session.location = locationString;
      session.locationData = locationData;
      await surveyService.updateSession(session.id, {
        location: locationString,
        locationData: locationData,
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
      <div className="survey-page">
        <h2 className="survey-title">Lábon álló erdő felmérése</h2>

        <LocationForm
          onLocationChange={handleLocationChange}
          initialData={session.locationData}
        />

        <AverageHeightSettings
          averageHeights={averageHeights}
          onUpdate={setAverageHeights}
        />

        <div className="survey-info">
          <p>Mért fák száma: <strong>{session.trees.length}</strong></p>
        </div>

        <VoiceInput onTranscript={setTranscript} />

        <MeasurementForm
          sessionId={session.id}
          transcript={transcript}
          onComplete={handleMeasurementComplete}
          onClearTranscript={() => setTranscript('')}
          onNewTranscript={setTranscript}
          averageHeights={averageHeights}
          onPause={handlePause}
        />

        <MeasurementList trees={session.trees.slice(-5)} />

        {session.trees.length > 0 && (
          <div className="survey-summary">
            <h3>Összesítés</h3>
            <p>
              Összes fatömeg:{' '}
              <strong>
                {session.trees.reduce((sum, t) => sum + t.volumeM3, 0).toFixed(2)} m³
              </strong>
            </p>
            <div className="export-buttons">
              <button
                onClick={() => exportService.exportExcel(session)}
                className="export-btn excel"
              >
                Excel
              </button>
              <button
                onClick={() => exportService.exportCSV(session)}
                className="export-btn csv"
              >
                CSV
              </button>
              <button
                onClick={() => exportService.exportPDF(session)}
                className="export-btn pdf"
              >
                PDF
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
