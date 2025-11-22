import { useNavigate } from 'react-router-dom';
import './Header.css';

/**
 * Alkalmazás fejléc
 */
export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <button className="back-button" onClick={() => navigate(-1)}>
        ←
      </button>
      <h1 className="app-title">🌲 Fatömegbecslő</h1>
      <div className="header-spacer"></div>
    </header>
  );
}
