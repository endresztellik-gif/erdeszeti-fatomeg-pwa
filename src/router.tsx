import { createBrowserRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StandingTreeSurveyPage from './pages/StandingTreeSurveyPage';
import SessionHistoryPage from './pages/SessionHistoryPage';
import SettingsPage from './pages/SettingsPage';

/**
 * Alkalmazás routing konfiguráció
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/survey/standing',
    element: <StandingTreeSurveyPage />,
  },
  {
    path: '/history',
    element: <SessionHistoryPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
]);
