import MainLayout from '@components/layout/MainLayout';

/**
 * Beállítások oldal (placeholder)
 */
export default function SettingsPage() {
  return (
    <MainLayout>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>⚙️ Beállítások</h2>
        <p style={{ color: '#666', marginTop: '1rem' }}>
          Ez a funkció hamarosan elérhető lesz.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '2rem' }}>
          Itt beállíthatod majd a beszéd sebességét, visszamondást, stb.
        </p>
      </div>
    </MainLayout>
  );
}
