import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyService, logSurveyService } from '@services/surveyService';
import { exportService } from '@services/exportService';
import { SurveySession, LogSession } from '@app-types/measurement';
import MainLayout from '@components/layout/MainLayout';
import './SessionHistoryPage.css';

// Kombinált session típus
type CombinedSession = (SurveySession | LogSession) & {
  sessionType: 'standing' | 'log';
};

/**
 * Korábbi felmérések oldal
 * Session lista megjelenítése (standing + log), folytatás, export, törlés
 */
export default function SessionHistoryPage() {
  const [sessions, setSessions] = useState<CombinedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const standingSessions = await surveyService.getAllSessions();
      const logSessions = await logSurveyService.getAllSessions();

      // Kombinálás és sessionType hozzáadása
      const combined: CombinedSession[] = [
        ...standingSessions.map(s => ({ ...s, sessionType: 'standing' as const })),
        ...logSessions.map(s => ({ ...s, sessionType: 'log' as const })),
      ];

      // Rendezés időpont szerint (legfrissebb elöl)
      combined.sort((a, b) => b.startedAt - a.startedAt);

      setSessions(combined);
    } catch (error) {
      console.error('Hiba a session-ök betöltése során:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (session: CombinedSession) => {
    if (session.sessionType === 'standing') {
      await surveyService.resumeSession(session.id);
      navigate('/survey/standing', { state: { resumeSessionId: session.id } });
    } else {
      await logSurveyService.resumeSession(session.id);
      navigate('/survey/log', { state: { resumeSessionId: session.id } });
    }
  };

  const handleDelete = async (session: CombinedSession) => {
    if (confirm('Biztosan törlöd ezt a felmérést? Ez a művelet nem visszavonható!')) {
      if (session.sessionType === 'standing') {
        await surveyService.deleteSession(session.id);
      } else {
        await logSurveyService.deleteSession(session.id);
      }
      loadSessions();
    }
  };

  const handleExportExcel = (session: CombinedSession) => {
    if (session.sessionType === 'standing') {
      exportService.exportExcel(session as SurveySession);
    } else {
      exportService.exportLogExcel(session as LogSession);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSessionStatus = (session: CombinedSession) => {
    if (session.isPaused) return 'paused';
    if (session.endedAt) return 'completed';
    return 'active';
  };

  return (
    <MainLayout>
      <div className="session-history">
        <h2>Korábbi felmérések</h2>

        {loading ? (
          <div className="loading-state">
            <p>Betöltés...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <p className="no-sessions">Még nincs mentett felmérés.</p>
            <button onClick={() => navigate('/survey/standing')} className="btn-new-survey">
              Új felmérés indítása
            </button>
          </div>
        ) : (
          <div className="session-list">
            {sessions.map((session) => {
              const status = getSessionStatus(session);

              // Típus-függő adatok kinyerése
              const isStanding = session.sessionType === 'standing';
              const items = isStanding
                ? (session as SurveySession).trees
                : (session as LogSession).logs;
              const totalVolume = items.reduce((sum: number, item: any) => sum + item.volumeM3, 0);
              const itemLabel = isStanding ? 'fa' : 'rönk';

              return (
                <div
                  key={session.id}
                  className={`session-card ${status} ${session.sessionType}`}
                >
                  <div className="session-header">
                    <span className="session-date">{formatDate(session.startedAt)}</span>
                    <span className="badge badge-type">
                      {isStanding ? '🌲 Lábon álló' : '🪵 Rönkköbözés'}
                    </span>
                    {status === 'paused' && (
                      <span className="badge badge-paused">Szüneteltetve</span>
                    )}
                    {status === 'completed' && (
                      <span className="badge badge-completed">Befejezett</span>
                    )}
                    {status === 'active' && (
                      <span className="badge badge-active">Aktív</span>
                    )}
                  </div>

                  <div className="session-info">
                    <p className="session-location">
                      {session.location || 'Helyszín nincs megadva'}
                    </p>
                    <p className="session-stats">
                      {items.length} {itemLabel} | {totalVolume.toFixed(2)} m³
                    </p>
                  </div>

                  <div className="session-actions">
                    {(status === 'paused' || status === 'active') && (
                      <button
                        onClick={() => handleResume(session)}
                        className="btn-action btn-resume"
                      >
                        Folytatás
                      </button>
                    )}
                    {items.length > 0 && (
                      <button
                        onClick={() => handleExportExcel(session)}
                        className="btn-action btn-export"
                      >
                        Excel
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(session)}
                      className="btn-action btn-delete"
                    >
                      Törlés
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
