import React, { useState } from 'react';
import { Train, ShieldCheck, Activity, Users, Lock, LogIn, Eye, EyeOff, CheckCircle } from 'lucide-react';

const credentials = [
  {
    role: 'Admin',
    name: 'Aravind Swamy',
    roleTitle: 'System Administrator',
    username: 'admin',
    password: 'admin',
    icon: ShieldCheck,
    color: '#00a8ff',
    glow: 'rgba(0, 168, 255, 0.25)',
    description: 'Full Platform Access & Audit Control',
    pages: ['All 9 Modules Available']
  },
  {
    role: 'Traffic Controller',
    name: 'Rajesh Kumar',
    roleTitle: 'Chief Traffic Controller',
    username: 'controller',
    password: 'controller',
    icon: Activity,
    color: '#20c997',
    glow: 'rgba(32, 201, 151, 0.25)',
    description: 'Active Train Scheduling, Disruption & HITL',
    pages: ['Scheduling', 'Disruption', 'HITL Queue']
  },
  {
    role: 'Station Master',
    name: 'Sunita Deshmukh',
    roleTitle: 'Station Master · NDLS',
    username: 'master',
    password: 'master',
    icon: Users,
    color: '#fcc419',
    glow: 'rgba(252, 196, 25, 0.25)',
    description: 'Platforms, Comms, Monitoring & Audit',
    pages: ['Platform Assign', 'Passenger Comms', 'System Monitor', 'Audit Logs']
  }
];

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  const handleManualLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const matchedUser = credentials.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setError('Invalid username or password. Check credentials below.');
    }
  };

  const handleQuickLogin = (user) => {
    setSelectedRole(user.role);
    setTimeout(() => {
      onLogin(user);
    }, 400); // Small delay for visual click feedback
  };

  return (
    <div className="login-page-container">
      {/* Background Graphic Grid */}
      <div className="login-bg-overlay"></div>
      <div className="login-bg-glow-orange"></div>
      <div className="login-bg-glow-blue"></div>

      <div className="login-card-wrapper">
        {/* Portal Header */}
        <div className="login-portal-header">
          <div className="login-logo-circle">
            <Train size={36} color="#00a8ff" className="pulse-icon" />
          </div>
          <h1 className="login-title">RailSync AI</h1>
          <p className="login-subtitle">INTELLIGENT RAILWAY OPERATIONS PORTAL</p>
        </div>

        {/* Quick Official login section */}
        <div className="quick-login-section">
          <h2 className="section-title-login">Quick Official Login</h2>
          <p className="section-desc-login">Click a profile card to instantly log in as that officer</p>
          
          <div className="quick-cards-grid">
            {credentials.map((user) => {
              const Icon = user.icon;
              const isSelected = selectedRole === user.role;
              return (
                <button
                  key={user.role}
                  className={`quick-login-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleQuickLogin(user)}
                  style={{
                    '--card-glow': user.glow,
                    '--card-border': isSelected ? user.color : 'var(--border)'
                  }}
                >
                  <div className="quick-card-icon-wrapper" style={{ backgroundColor: `${user.color}15`, border: `1px solid ${user.color}35` }}>
                    <Icon size={20} color={user.color} />
                  </div>
                  <div className="quick-card-info">
                    <span className="quick-role-badge" style={{ color: user.color }}>{user.role}</span>
                    <h3 className="quick-name">{user.name}</h3>
                    <p className="quick-desc">{user.description}</p>
                    <div className="quick-pages-list">
                      {user.pages.map((p, idx) => (
                        <span key={idx} className="quick-page-tag">{p}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <span>OR MANUALLY ENTER CREDENTIALS</span>
        </div>

        {/* Manual login Form */}
        <form onSubmit={handleManualLogin} className="login-manual-form">
          {error && <div className="login-error-alert">{error}</div>}
          
          <div className="form-group-login">
            <label className="form-label-login">Username</label>
            <input
              type="text"
              className="form-input-login"
              placeholder="e.g. admin, controller, master"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
            />
          </div>

          <div className="form-group-login">
            <label className="form-label-login">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input-login password-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn">
            <LogIn size={16} style={{ marginRight: '8px' }} />
            Authenticate Official
          </button>
        </form>

        <div className="login-footer-credits">
          Secure Multi-Role Railway Automation System · Powered by RailSync AI Platform
        </div>
      </div>
    </div>
  );
}
