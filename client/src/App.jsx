import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import ResultsDashboard from './pages/ResultsDashboard.jsx';
import TestResultsDashboard from './pages/TestResultsDashboard.jsx';
import TestResultsCoinbaseDashboard from './pages/TestResultsCoinbaseDashboard.jsx';
import VisitorStats from './components/VisitorStats.jsx';
import logo from '../favicon.svg';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-main">
          <div className="app-logo-row">
            <img src={logo} alt="BTC Dashboard logo" className="app-logo" />
            <h1>BTC Prediction Dashboard</h1>
          </div>
          <p>Explore performance of your live and test prediction runs</p>
        </div>
        <div className="app-header-actions">
          <button
            type="button"
            className="goto-button"
            onClick={() => {
              window.location.href = 'https://potent-pendragonish-kayleen.ngrok-free.dev/';
            }}
          >
            <span>Go To</span>
            <span aria-hidden="true">→</span>
          </button>
          <VisitorStats />
        </div>
      </header>

      <nav className="app-nav">
        <NavLink
          to="/results"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Live Results
        </NavLink>
        <NavLink
          to="/test-results"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Test Results
        </NavLink>
        <NavLink
          to="/test-results-coinbase"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Test Results (Coinbase)
        </NavLink>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/results" replace />} />
          <Route path="/results" element={<ResultsDashboard />} />
          <Route path="/test-results" element={<TestResultsDashboard />} />
          <Route path="/test-results-coinbase" element={<TestResultsCoinbaseDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

