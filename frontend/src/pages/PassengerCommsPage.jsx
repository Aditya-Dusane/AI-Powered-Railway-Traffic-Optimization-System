import React, { useState } from 'react';
import { MessageSquare, Radio, Monitor, Smartphone, CheckCircle, AlertTriangle, Zap, Clock, RefreshCw, ShieldAlert } from 'lucide-react';

const templates = [
    { icon: Clock, color: 'yellow', title: 'Delay Alert', desc: 'Standard message for 15m, 30m, 1h+ delays.' },
    { icon: RefreshCw, color: 'blue', title: 'Platform Change', desc: 'Directional guidance for station platforms.' },
    { icon: ShieldAlert, color: 'red', title: 'Emergency', desc: 'Evacuation or safety critical protocols.' },
];

const recentTransmissions = [
    { msg: 'Bhopal Exp Delay', subtitle: 'PF-3 + 4 Displays', status: 'active' },
    { msg: 'Platform 3 Clear', subtitle: 'Audio + Display Only', status: 'active' },
    { msg: '12301 Coach Update', subtitle: 'Mobile App Push', status: 'pending' },
];

const stationDisplays = [
    { id: 'ICE 822', dest: 'BERLIN', status: 'ON TIME', color: 'green' },
    { id: 'S0', dest: 'SPANDAU', status: '12 MIN', color: 'yellow' },
];

export default function PassengerCommsPage() {
    const [prompt, setPrompt] = useState('Platform change for Shatabdi Exp');
    const [language, setLanguage] = useState('Hindi');
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [displayEnabled, setDisplayEnabled] = useState(true);
    const [mobileEnabled, setMobileEnabled] = useState(false);
    const [preview, setPreview] = useState(
        'यात्रियों का ध्यान, नई दिल्ली से आ रही शताब्दी एक्सप्रेस को प्लेटफ़ॉर्म 4 पर रूट किया गया है। कृपया ओवरहेड ब्रिज से प्लेटफ़ॉर्म 4 की ओर जाएं। असुविधा के लिए खेद है।'
    );
    const [loading, setLoading] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/passenger/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, language })
            });
            const data = await res.json();
            if (data.announcement) {
                setPreview(data.announcement);
            } else if (data.error) {
                setPreview(`Error: ${data.error}`);
            }
        } catch (err) {
            setPreview(`Network error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async () => {
        setBroadcasting(true);
        try {
            const channels = [];
            if (voiceEnabled) channels.push('voice');
            if (displayEnabled) channels.push('display');
            if (mobileEnabled) channels.push('mobile');

            const res = await fetch('/api/passenger/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, announcement: preview, language, channels })
            });
            const data = await res.json();
            if (data.success) {
                alert('Broadcast executed successfully and logged in audit trails.');
            } else if (data.error) {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            alert(`Network error: ${err.message}`);
        } finally {
            setBroadcasting(false);
        }
    };

    return (
        <div className="view-wrapper">
            <main className="page-content">
                <div className="comms-layout">

                    {/* AI Announcement Generator */}
                    <div className="card comms-generator-card">
                        <div className="comms-gen-header">
                            <MessageSquare size={18} className="text-blue" />
                            <h2>AI Announcement Generator</h2>
                            <span className="model-badge">MODEL V4.2</span>
                        </div>

                        <div className="comms-gen-body">
                            {/* Left: Input */}
                            <div className="comms-input-side">
                                <div className="comms-field-label">DRAFT PROMPT / EVENT</div>
                                <div className="comms-prompt-row">
                                    <input
                                        className="comms-prompt-input"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        placeholder="e.g. Platform change for 12002 Shatabdi..."
                                    />
                                    <button className="comms-gen-btn" onClick={handleGenerate} disabled={loading}>
                                        {loading ? 'GENERATING...' : 'GENERATE'}
                                    </button>
                                </div>

                                <div className="comms-lang-preview-row">
                                    <div className="comms-lang-block">
                                        <div className="comms-field-label">PRIMARY LANGUAGE</div>
                                        <select className="comms-lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
                                            <option>Hindi</option>
                                            <option>English</option>
                                            <option>Tamil</option>
                                            <option>Telugu</option>
                                            <option>Kannada</option>
                                            <option>Marathi</option>
                                        </select>
                                    </div>
                                    <div className="comms-preview-block">
                                        <div className="comms-field-label">MESSAGE PREVIEW</div>
                                        <div className="comms-preview-text">{preview}</div>
                                    </div>
                                </div>

                                {/* Channel toggles */}
                                <div className="comms-channels-row">
                                    <div className="comms-channel-card">
                                        <Radio size={16} className="text-blue" />
                                        <span>Voice Announcement</span>
                                        <span className="comms-label-sub">Automated PA System</span>
                                        <div className="comms-toggle-row">
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={voiceEnabled} onChange={e => setVoiceEnabled(e.target.checked)} />
                                                <span className="toggle-knob"></span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="comms-channel-card">
                                        <Monitor size={16} className="text-blue" />
                                        <span>Station Displays</span>
                                        <span className="comms-label-sub">FHD + LED Panels</span>
                                        <div className="comms-toggle-row">
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={displayEnabled} onChange={e => setDisplayEnabled(e.target.checked)} />
                                                <span className="toggle-knob"></span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="comms-channel-card">
                                        <Smartphone size={16} className="text-blue" />
                                        <span>Mobile App</span>
                                        <span className="comms-label-sub">Push Notifications</span>
                                        <div className="comms-toggle-row">
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={mobileEnabled} onChange={e => setMobileEnabled(e.target.checked)} />
                                                <span className="toggle-knob"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <button className="comms-broadcast-btn" onClick={handleBroadcast} disabled={broadcasting}>
                                    <Zap size={16} /> {broadcasting ? 'BROADCASTING...' : 'EXECUTE BROADCAST'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Templates */}
                        <div className="comms-templates-section">
                            <div className="comms-field-label" style={{ marginBottom: '12px' }}>QUICK TEMPLATES</div>
                            <div className="comms-templates-row">
                                {templates.map((t, i) => {
                                    const IconComponent = t.icon;
                                    return (
                                        <div
                                            className={`comms-template-card ${t.color}`}
                                            key={i}
                                            onClick={() => setPrompt(t.title + ' — ' + t.desc.split(' ').slice(0, 3).join(' '))}
                                        >
                                            <span className="template-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IconComponent size={16} />
                                            </span>
                                            <div>
                                                <div className="template-title">{t.title}</div>
                                                <div className="template-desc">{t.desc}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Fixed Right Sidebar */}
            <aside className="universal-right-sidebar">
                <div className="dashboard-sidebar-content">

                    {/* Broadcast Status */}
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header blue-glow">
                            <CheckCircle size={16} />
                            <h2>BROADCAST STATUS</h2>
                        </div>
                        <div className="tool-content">
                            <div className="comms-progress-item">
                                <div className="comms-progress-label"><span>Audio Synthesis</span><span className="text-green">100%</span></div>
                                <div className="comms-progress-bar"><div style={{ width: '100%', background: '#20c997', height: '6px', borderRadius: '3px' }}></div></div>
                            </div>
                            <div className="comms-progress-item">
                                <div className="comms-progress-label"><span>Station Display Sync</span><span className="text-yellow">88%</span></div>
                                <div className="comms-progress-bar"><div style={{ width: '88%', background: '#fcc419', height: '6px', borderRadius: '3px' }}></div></div>
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <div className="comms-field-label" style={{ marginBottom: '8px' }}>RECENT TRANSMISSIONS</div>
                                {recentTransmissions.map((t, i) => (
                                    <div className="comms-transmission-item" key={i}>
                                        <CheckCircle size={13} className="text-green" />
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '600' }}>{t.msg}</div>
                                            <div className="text-muted-light" style={{ fontSize: '10px' }}>{t.subtitle}</div>
                                        </div>
                                        <span className={`comms-tx-status ${t.status}`}>{t.status.toUpperCase()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Live Station Displays */}
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header">
                            <Monitor size={16} className="text-blue" />
                            <h2 className="text-theme">LIVE STATION DISPLAYS</h2>
                        </div>
                        <div className="tool-content">
                            <div className="comms-display-list">
                                <div className="comms-display-header">
                                    <span>TRAIN ID</span><span>DESTINATION</span><span>STATUS</span>
                                </div>
                                {stationDisplays.map((d, i) => (
                                    <div className="comms-display-row" key={i}>
                                        <span className="train-id-badge bg-blue-dim">{d.id}</span>
                                        <span>{d.dest}</span>
                                        <span className={`text-${d.color}`}>{d.status}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="comms-display-screens" style={{ marginTop: '16px' }}>
                                <div className="comms-screen-item">
                                    <div className="comms-screen-label">South Hub Display #54</div>
                                    <div className="comms-screen-msg">Now Showing: Platform 4 Reroute Message</div>
                                </div>
                                <div className="comms-screen-item">
                                    <div className="comms-screen-label">Central Hall Main Screen</div>
                                    <div className="comms-screen-msg">Now Showing: Current Schedule</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Header indicator */}
                    <div className="comms-server-status card" style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span className="text-muted">COMM SERVER STATUS</span>
                            <span className="text-green">ACTIVE</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                            <span className="text-muted">Live Broadcasts</span>
                            <span className="text-blue">12</span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
