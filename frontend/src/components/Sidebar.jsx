import React from 'react';
import {
    Train, LayoutDashboard, Calendar, MapPin, AlertTriangle,
    MessageSquare, MonitorPlay, Activity, FileText, ShieldCheck, LogOut
} from 'lucide-react';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scheduling', label: 'Train Scheduling', icon: Calendar },
    { id: 'platform', label: 'Platform Assignment', icon: MapPin },
    { id: 'disruption', label: 'Disruption Recovery', icon: AlertTriangle },
    { id: 'passenger', label: 'Passenger Communication', icon: MessageSquare },
    { id: 'simulation', label: 'Simulation Lab', icon: MonitorPlay },
    { id: 'monitoring', label: 'System Monitoring', icon: Activity },
    { id: 'hitl', label: 'Human-in-the-Loop', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
];

export default function Sidebar({ currentView, setCurrentView, currentUser, allowedViews = [], onLogout }) {
    // Filter navigation items based on user's authorized views
    const filteredNavItems = navItems.filter(item => allowedViews.includes(item.id));

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="app-logo">
                    <Train size={24} color="#00a8ff" />
                </div>
                <div>
                    <h1 className="app-title">RailSync</h1>
                    <p className="app-subtitle">AI OPERATIONS</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                {filteredNavItems.map(({ id, label, icon: Icon }) => (
                    <a
                        key={id}
                        href="#"
                        className={`nav-item ${currentView === id ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); setCurrentView(id); }}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                    </a>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar"></div>
                    <div className="user-info" style={{ flex: 1, marginRight: '8px' }}>
                        <span className="user-name" title={currentUser?.name}>{currentUser?.name || 'Officer'}</span>
                        <span className="user-role" title={currentUser?.roleTitle}>{currentUser?.roleTitle || 'Operator'}</span>
                    </div>
                    <button 
                        className="logout-btn-sidebar" 
                        onClick={onLogout}
                        title="Log Out of System"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}

