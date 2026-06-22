import React, { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';

// Pages
import DashboardPage from './pages/DashboardPage';
import SchedulingPage from './pages/SchedulingPage';
import PlatformPage from './pages/PlatformPage';
import DisruptionPage from './pages/DisruptionPage';
import PassengerCommsPage from './pages/PassengerCommsPage';
import SimulationLabPage from './pages/SimulationLabPage';
import SystemMonitoringPage from './pages/SystemMonitoringPage';
import HumanInLoopPage from './pages/HumanInLoopPage';
import AuditLogsPage from './pages/AuditLogsPage';

const ROLE_ACCESS = {
  'Admin': ['dashboard', 'scheduling', 'platform', 'disruption', 'passenger', 'simulation', 'monitoring', 'hitl', 'audit'],
  'Traffic Controller': ['dashboard', 'scheduling', 'disruption', 'hitl'],
  'Station Master': ['dashboard', 'platform', 'passenger', 'simulation', 'monitoring', 'audit']
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState('dark');

  // States used by different pages
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('aggressive');

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 3000);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    // Set default view on login (which is dashboard, since all roles have dashboard access)
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // If not logged in, render the login page
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Get accessible views for current role (fallback to empty)
  const allowedViews = ROLE_ACCESS[currentUser.role] || [];

  return (
    <div className={`layout-container ${theme}-theme`}>
      {/* Universal Navigation Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser} 
        allowedViews={allowedViews}
        onLogout={handleLogout}
      />

      <div className="content-wrapper">
        {/* Universal Top Header */}
        <Header
          currentView={currentView}
          theme={theme}
          setTheme={setTheme}
          currentUser={currentUser}
        />

        <div className="view-container" style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Dynamic View Content restricted by role */}
          {currentView === 'dashboard' && allowedViews.includes('dashboard') && <DashboardPage theme={theme} />}
          {currentView === 'scheduling' && allowedViews.includes('scheduling') && <SchedulingPage />}
          {currentView === 'platform' && allowedViews.includes('platform') && <PlatformPage />}
          {currentView === 'disruption' && allowedViews.includes('disruption') && (
            <DisruptionPage
              isSimulating={isSimulating}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              theme={theme}
            />
          )}
          {currentView === 'passenger' && allowedViews.includes('passenger') && <PassengerCommsPage />}
          {currentView === 'simulation' && allowedViews.includes('simulation') && <SimulationLabPage theme={theme} />}
          {currentView === 'monitoring' && allowedViews.includes('monitoring') && <SystemMonitoringPage />}
          {currentView === 'hitl' && allowedViews.includes('hitl') && <HumanInLoopPage />}
          {currentView === 'audit' && allowedViews.includes('audit') && <AuditLogsPage />}
        </div>
      </div>
    </div>
  );
}

export default App;


