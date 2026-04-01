import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import ResultsDashboard from './pages/ResultsDashboard.jsx';
import TestResultsDashboard from './pages/TestResultsDashboard.jsx';
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
        <VisitorStats />
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
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/results" replace />} />
          <Route path="/results" element={<ResultsDashboard />} />
          <Route path="/test-results" element={<TestResultsDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

