import { Link } from 'react-router-dom';
import MainLayout from '@components/layout/MainLayout';
import './HomePage.css';

/**
 * Főoldal - Főmenü
 */
export default function HomePage() {
  return (
    <MainLayout>
      <div className="home-page">
        <h2 className="home-subtitle">Válassz funkciót:</h2>

        <div className="menu-buttons">
          <Link to="/survey/standing" className="menu-button primary">
            <span className="menu-icon">🌲</span>
            <span className="menu-text">Lábon álló erdő felmérése</span>
          </Link>

          <Link to="/history" className="menu-button">
            <span className="menu-icon">📋</span>
            <span className="menu-text">Korábbi felmérések</span>
          </Link>

          <Link to="/settings" className="menu-button">
            <span className="menu-icon">⚙️</span>
            <span className="menu-text">Beállítások</span>
          </Link>
        </div>

        <div className="home-info">
          <p>
            Ez az alkalmazás hangalapú bevitellel támogatja a terepi fatömegbecslést.
          </p>
          <p className="info-note">
            💡 A hangfelismeréshez internetkapcsolat szükséges!
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
