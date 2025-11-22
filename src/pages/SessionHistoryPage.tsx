import MainLayout from '@components/layout/MainLayout';

/**
 * Korábbi felmérések oldal (placeholder)
 */
export default function SessionHistoryPage() {
  return (
    <MainLayout>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>📋 Korábbi felmérések</h2>
        <p style={{ color: '#666', marginTop: '1rem' }}>
          Ez a funkció hamarosan elérhető lesz.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '2rem' }}>
          Itt fogod látni az összes korábbi mérési session-t.
        </p>
      </div>
    </MainLayout>
  );
}
