import React, { useState, useEffect } from 'react';
import { Search, Bell, AlertTriangle, Sun, Moon } from 'lucide-react';

export default function Header({ currentView, theme, setTheme }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = time.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const isDark = theme === 'dark';

    return (
        <header className="universal-header top-header">
            <div className="header-status-info">
                <div className="status-indicator-item">
                    <span className="dot green"></span>
                    <span className="status-label">Network Health:</span>
                    <span className="status-value highlight-green">98.4%</span>
                </div>

                <div className="status-indicator-item">
                    <AlertTriangle size={14} className="icon-red" />
                    <span className="status-label">Active Alerts:</span>
                    <span className="status-value highlight-red">3</span>
                </div>

                <div className="status-indicator-item time-indicator">
                    <span className="status-label">IST</span>
                    <span className="status-value">{formattedTime}</span>
                </div>
            </div>

            <div className="header-actions-right">
                {/* Theme Toggle */}
                <button
                    className="theme-toggle-btn"
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
                </button>

                <div className="icon-btn header-bell">
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </div>

                <div className="header-search-container">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search trains, stations..." className="header-search-input" />
                </div>
            </div>
        </header>
    );
}
