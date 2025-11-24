import { useState, useEffect } from 'react';
import MainLayout from '@components/layout/MainLayout';
import VoiceInput from '@components/measurement/VoiceInput';
import MeasurementForm from '@components/measurement/MeasurementForm';
import MeasurementList from '@components/measurement/MeasurementList';
import LocationForm, { LocationData } from '@components/measurement/LocationForm';
import { surveyService } from '@services/surveyService';
import { SurveySession } from '@app-types/measurement';
import './StandingTreeSurveyPage.css';

/**
 * Lábon álló erdő felmérése oldal
 */
export default function StandingTreeSurveyPage() {
  const [session, setSession] = useState<SurveySession | null>(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(true);

  // Session létrehozása oldal betöltéskor
  useEffect(() => {
    async function initSession() {
      try {
        const newSession = await surveyService.createSession('standing');
        setSession(newSession);
      } catch (error) {
        console.error('Hiba a session létrehozása során:', error);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  // Session frissítése mérés után
  const handleMeasurementComplete = async () => {
    if (session) {
      const updatedSession = await surveyService.getSession(session.id);
      if (updatedSession) {
        setSession(updatedSession);
      }
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
        <h2 className="survey-title">🌲 Lábon álló erdő felmérése</h2>

        <LocationForm
          onLocationChange={handleLocationChange}
          initialData={session.locationData}
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
          </div>
        )}
      </div>
    </MainLayout>
  );
}
