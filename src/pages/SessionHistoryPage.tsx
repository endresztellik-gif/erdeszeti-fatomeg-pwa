import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyService } from '@services/surveyService';
import { exportService } from '@services/exportService';
import { SurveySession } from '@app-types/measurement';
import MainLayout from '@components/layout/MainLayout';
import './SessionHistoryPage.css';

/**
 * Korábbi felmérések oldal
 * Session lista megjelenítése, folytatás, export, törlés
 */
export default function SessionHistoryPage() {
  const [sessions, setSessions] = useState<SurveySession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const allSessions = await surveyService.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Hiba a session-ök betöltése során:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (sessionId: string) => {
    await surveyService.resumeSession(sessionId);
    navigate('/survey/standing', { state: { resumeSessionId: sessionId } });
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm('Biztosan törlöd ezt a felmérést? Ez a művelet nem visszavonható!')) {
      await surveyService.deleteSession(sessionId);
      loadSessions();
    }
  };

  const handleExportExcel = (session: SurveySession) => {
    exportService.exportExcel(session);
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

  const getSessionStatus = (session: SurveySession) => {
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
              const totalVolume = session.trees.reduce((sum, t) => sum + t.volumeM3, 0);

              return (
                <div
                  key={session.id}
                  className={`session-card ${status}`}
                >
                  <div className="session-header">
                    <span className="session-date">{formatDate(session.startedAt)}</span>
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
                      {session.trees.length} fa | {totalVolume.toFixed(2)} m³
                    </p>
                  </div>

                  <div className="session-actions">
                    {(status === 'paused' || status === 'active') && (
                      <button
                        onClick={() => handleResume(session.id)}
                        className="btn-action btn-resume"
                      >
                        Folytatás
                      </button>
                    )}
                    {session.trees.length > 0 && (
                      <button
                        onClick={() => handleExportExcel(session)}
                        className="btn-action btn-export"
                      >
                        Excel
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(session.id)}
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
