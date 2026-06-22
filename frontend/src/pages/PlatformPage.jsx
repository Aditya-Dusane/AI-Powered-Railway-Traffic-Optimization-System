import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, Clock, Activity, CheckCircle } from 'lucide-react';

const platformsMock = [
    { num: '01', status: 'occupied', train: '12301 Howrah Rajdhani', route: 'ROUTE: HWH → NDLS', arrival: '14:20', delay: '+10m', departure: '14:50', crowd: 72 },
    { num: '02', status: 'occupied', train: '12002 Bhopal Shatabdi', route: 'ROUTE: NDLS → RKMP', arrival: '14:05', departure: '15:15', crowd: 91 },
    { num: '03', status: 'free', nextExp: '15:30', lastExit: '13:45', crowd: 12 },
    { num: '04', status: 'reserved', train: '22415 Vande Bharat Express', eta: '5M (IN-TRANSIT)', scheduled: '14:50', duration: '10m Turnaround', crowd: 35 },
    { num: '05', status: 'free', note: 'CLEANING IN PROGRESS', nextExp: '15:45', lastExit: '14:00', crowd: 5 },
    { num: '06', status: 'occupied', train: '12002 Bhopal Shatabdi', route: 'ROUTE: NDLS → RKMP', arrival: '14:05', departure: 'DEPARTING IN 2M', crowd: 88 },
    { num: '07', status: 'free', nextExp: '16:00', lastExit: '14:10', crowd: 8 },
    { num: '08', status: 'free', nextExp: '16:15', lastExit: '14:20', crowd: 3 },
    { num: '09', status: 'reserved', train: '12424 NDLS-DBRG Rajdhani', eta: '12M', scheduled: '15:10', duration: '8m Turnaround', crowd: 28 },
    { num: '10', status: 'occupied', train: '12621 Tamil Nadu Express', route: 'ROUTE: NDLS → MAS', arrival: '14:15', departure: '16:00', crowd: 65 },
];

const availableTrains = [
    { id: '12423', name: 'Dibrugarh Rajdhani' },
    { id: '12002', name: 'Bhopal Shatabdi' },
    { id: '12221', name: 'Pune Duronto' },
    { id: '12381', name: 'Kolkata Rajdhani' },
    { id: '12301', name: 'Howrah Rajdhani' },
    { id: '22415', name: 'Vande Bharat Exp' },
    { id: '12621', name: 'Tamil Nadu Express' },
    { id: '12953', name: 'Mumbai Rajdhani' },
    { id: '12311', name: 'Kalka Mail' },
    { id: '12461', name: 'Mandore Express' },
];

const statusLabel = { occupied: 'OCCUPIED', free: 'FREE', reserved: 'RESERVED' };

const getTrainRoute = (trainName) => {
    if (!trainName) return "";
    const match = trainName.match(/\d+/);
    if (match) {
        const trainId = match[0];
        if (trainId === '12301') return 'ROUTE: HWH → NDLS';
        if (trainId === '12423') return 'ROUTE: NDLS → DBRG';
        if (trainId === '12002') return 'ROUTE: NDLS → RKMP';
        if (trainId === '12221') return 'ROUTE: HWH → PUNE';
        if (trainId === '12381') return 'ROUTE: HWH → NDLS';
        if (trainId === '22415') return 'ROUTE: NDLS → BSB';
        if (trainId === '12621') return 'ROUTE: NDLS → MAS';
        if (trainId === '12953') return 'ROUTE: NDLS → MMCT';
        if (trainId === '12311') return 'ROUTE: HWH → CDG';
        if (trainId === '12461') return 'ROUTE: JU → NDLS';
        if (trainId === '12424') return 'ROUTE: NDLS → DBRG';
    }
    return "";
};

export default function PlatformPage() {
    const [focused, setFocused] = useState(null);
    const [platforms, setPlatforms] = useState(platformsMock);
    const [recommendations, setRecommendations] = useState([]);
    const [eventLogs, setEventLogs] = useState([]);
    const [optimizing, setOptimizing] = useState(false);
    const [applying, setApplying] = useState(false);
    const [selectedTrainForManual, setSelectedTrainForManual] = useState('');
    const [showManualOverride, setShowManualOverride] = useState(false);

    const fetchPlatforms = async () => {
        try {
            const res = await fetch('/api/platform');
            const data = await res.json();
            if (data.platforms) {
                const merged = data.platforms.map(p => {
                    const mockItem = platformsMock.find(m => m.num === p.num) || {};
                    return {
                        ...mockItem,
                        ...p
                    };
                });
                setPlatforms(merged);
            }
        } catch (err) {
            console.error("Error fetching platforms:", err);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/audit/logs');
            const data = await res.json();
            if (data.logs) {
                const platformLogs = data.logs.filter(l => l.module && l.module.toLowerCase() === 'platform');
                if (platformLogs.length > 0) {
                    setEventLogs(platformLogs.slice(0, 5));
                } else {
                    setEventLogs([
                        { ts: '14:42:08', action: 'PF-01 Status updated to Occupied' },
                        { ts: '14:38:12', action: 'AI-Core Optimized PF-07 Schedule' },
                        { ts: '14:35:01', action: 'Train 12301 entered block sector A-14' },
                    ]);
                }
            }
        } catch (err) {
            console.error("Error fetching audit logs:", err);
        }
    };

    const runPlatformOptimization = async () => {
        setOptimizing(true);
        try {
            const res = await fetch('/api/platform/optimize', { method: 'POST' });
            const data = await res.json();
            if (data.assignments) {
                setRecommendations(data.assignments);
            }
        } catch (err) {
            console.error("Error running platform optimization:", err);
        } finally {
            setOptimizing(false);
        }
    };

    const handleAcceptAssignment = async (rec) => {
        setApplying(true);
        try {
            const platformDigits = rec.recommended_platform.replace(/\D/g, '');
            const res = await fetch('/api/platform/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    train_id: rec.train_id,
                    platform: platformDigits
                })
            });
            const data = await res.json();
            if (data.success) {
                await fetchPlatforms();
                await fetchLogs();
                setRecommendations(prev => prev.filter(r => r.train_id !== rec.train_id));
            } else {
                alert("Error: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Error assigning platform:", err);
        } finally {
            setApplying(false);
        }
    };

    const handleManualAssign = async () => {
        const selectEl = document.getElementById('manual-platform-select');
        const targetPlatform = selectEl ? selectEl.value : '01';
        if (!selectedTrainForManual) {
            alert("Please select a train first.");
            return;
        }
        setApplying(true);
        try {
            const res = await fetch('/api/platform/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    train_id: selectedTrainForManual,
                    platform: targetPlatform.replace(/\D/g, '')
                })
            });
            const data = await res.json();
            if (data.success) {
                await fetchPlatforms();
                await fetchLogs();
                setShowManualOverride(false);
                setSelectedTrainForManual('');
            } else {
                alert("Error: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Error manual assigning:", err);
        } finally {
            setApplying(false);
        }
    };

    useEffect(() => {
        fetchPlatforms();
        fetchLogs();
        runPlatformOptimization();
        const t = setInterval(() => {
            fetchPlatforms();
            fetchLogs();
        }, 5000);
        return () => clearInterval(t);
    }, []);


    const pfStatus = platforms.map(p => p.status);

    return (
        <div className="view-wrapper">
            <main className="page-content">
                {/* Station Focus Bar */}
                <div className="pf-station-focus">
                    <div className="station-focus-label">STATION FOCUS</div>
                    <div className="station-name">NDLS — NEW DELHI CENTRAL <span className="station-arrow">▾</span></div>
                    <div className="station-meta"><span className="dot green"></span> SYSTEM READY</div>
                    <div className="station-time"><Clock size={12} /> 20 MAR 2024 | 14:45:22 IST</div>
                    <button className="simulate-btn" onClick={async () => {
                        await fetchPlatforms();
                        await runPlatformOptimization();
                        await fetchLogs();
                    }}><Activity size={14} /> SIMULATE ARRIVAL</button>
                </div>

                {/* Live Platform Map Bar */}
                <div className="card pf-map-card">
                    <div className="section-header space-between">
                        <div className="header-title">LIVE STATION MAP</div>
                        <div className="pf-legend">
                            <span><span className="dot free"></span>FREE</span>
                            <span><span className="dot reserved"></span>RESERVED</span>
                            <span><span className="dot occupied"></span>OCCUPIED</span>
                        </div>
                    </div>
                    <div className="pf-strip-row">
                        {pfStatus.map((s, i) => (
                            <div
                                key={i}
                                className={`pf-strip ${s} ${focused === i ? 'focused' : ''}`}
                                onClick={() => setFocused(i === focused ? null : i)}
                            >
                                PF {String(i + 1).padStart(2, '0')}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform Cards Grid */}
                <div className="pf-cards-grid">
                    {platforms.map((p, i) => (
                        <div
                            key={i}
                            className={`card pf-card ${p.status} ${focused === i ? 'selected' : ''}`}
                            onClick={() => setFocused(i === focused ? null : i)}
                        >
                            <div className="pf-card-header">
                                <span className="pf-num">{p.num}</span>
                                <span className={`pf-status-badge ${p.status}`}>{statusLabel[p.status]}</span>
                            </div>
                            {p.train ? (
                                <>
                                    <div className="pf-train-name">{p.train}</div>
                                    <div className="pf-route">{p.route || getTrainRoute(p.train)}</div>
                                    {p.eta && <div className="pf-route">ETA: {p.eta}</div>}
                                    <div className="pf-time-row">
                                        <div className="pf-time-block">
                                            <span className="label">ARRIVAL</span>
                                            <span className="value">{p.arrival || p.scheduled} {p.delay && <span className="text-red">{p.delay}</span>}</span>
                                        </div>
                                        <div className="pf-time-block">
                                            <span className="label">DEPARTURE</span>
                                            <span className="value">{p.departure || p.duration}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="pf-no-train">No Train Assigned</div>
                                    {p.note && <div className="pf-note">{p.note}</div>}
                                    <div className="pf-time-row">
                                        <div className="pf-time-block"><span className="label">NEXT EXPECTED</span><span className="value">{p.nextExp || '—'}</span></div>
                                        <div className="pf-time-block"><span className="label">LAST EXIT</span><span className="value">{p.lastExit || '—'}</span></div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </main>

            {/* Fixed Platform Sidebar */}
            <aside className="universal-right-sidebar">
                <div className="platform-sidebar">
                    {/* AI Assignment Engine */}
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header blue-glow">
                            <Cpu size={16} />
                            <h2>AI ASSIGNMENT ENGINE</h2>
                        </div>
                        <div className="tool-content">
                            <div className="pf-incoming-label">INCOMING OPTIMIZATION</div>
                            {recommendations.length > 0 ? (
                                <div className="pf-best-box">
                                    <div className="pf-best-header">
                                        <span className="pill blue">BEST PLATFORM: {recommendations[0].recommended_platform}</span>
                                        <span className="pf-train-id">#{recommendations[0].train_id}</span>
                                    </div>
                                    <div className="pf-best-name">{recommendations[0].train_name}</div>
                                    <p className="text-muted-light" style={{ fontSize: '11px', marginTop: '6px' }}>
                                        {recommendations[0].reason} ({recommendations[0].benefit})
                                    </p>
                                    {!showManualOverride ? (
                                        <>
                                            <button 
                                                className="tool-action-btn primary" 
                                                style={{ marginTop: '12px' }}
                                                onClick={() => handleAcceptAssignment(recommendations[0])}
                                                disabled={applying}
                                            >
                                                {applying ? 'APPLYING...' : 'ACCEPT AI ASSIGNMENT'}
                                            </button>
                                            <button 
                                                className="tool-action-btn secondary" 
                                                style={{ marginTop: '6px' }}
                                                onClick={() => setShowManualOverride(true)}
                                            >
                                                MANUAL OVERRIDE
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>MANUAL ASSIGNMENT</div>
                                            <div style={{ marginBottom: '8px' }}>
                                                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SELECT TRAIN</label>
                                                <select
                                                    value={selectedTrainForManual}
                                                    onChange={e => setSelectedTrainForManual(e.target.value)}
                                                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '11px' }}
                                                >
                                                    <option value="">-- Choose Train --</option>
                                                    {availableTrains.map(t => (
                                                        <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PLATFORM</label>
                                                <select
                                                    id="manual-platform-select"
                                                    defaultValue={focused !== null ? String(focused + 1).padStart(2, '0') : '01'}
                                                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '11px' }}
                                                >
                                                    {platforms.map(p => (
                                                        <option key={p.num} value={p.num}>PF {p.num}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="tool-action-btn primary"
                                                    style={{ margin: 0, flex: 1 }}
                                                    onClick={handleManualAssign}
                                                    disabled={applying}
                                                >
                                                    {applying ? 'ASSIGNING...' : 'CONFIRM'}
                                                </button>
                                                <button
                                                    className="tool-action-btn secondary"
                                                    style={{ margin: 0, width: '70px' }}
                                                    onClick={() => setShowManualOverride(false)}
                                                >
                                                    CANCEL
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="pf-best-box" style={{ textAlign: 'center', padding: '16px 0' }}>
                                    <p className="text-muted-light" style={{ fontSize: '11px' }}>
                                        {optimizing ? 'Calculating optimal flow...' : 'No suggestions available or already applied.'}
                                    </p>
                                    {!showManualOverride ? (
                                        <>
                                            <button 
                                                className="tool-action-btn primary" 
                                                style={{ marginTop: '12px' }}
                                                onClick={runPlatformOptimization}
                                                disabled={optimizing}
                                            >
                                                {optimizing ? 'RUNNING AI...' : 'RUN AI OPTIMIZATION'}
                                            </button>
                                            <button 
                                                className="tool-action-btn secondary" 
                                                style={{ marginTop: '6px' }}
                                                onClick={() => setShowManualOverride(true)}
                                            >
                                                MANUAL OVERRIDE
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>MANUAL ASSIGNMENT</div>
                                            <div style={{ marginBottom: '8px' }}>
                                                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SELECT TRAIN</label>
                                                <select
                                                    value={selectedTrainForManual}
                                                    onChange={e => setSelectedTrainForManual(e.target.value)}
                                                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '11px' }}
                                                >
                                                    <option value="">-- Choose Train --</option>
                                                    {availableTrains.map(t => (
                                                        <option key={t.id} value={t.id}>{t.id} - {t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>PLATFORM</label>
                                                <select
                                                    id="manual-platform-select"
                                                    defaultValue={focused !== null ? String(focused + 1).padStart(2, '0') : '01'}
                                                    style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '11px' }}
                                                >
                                                    {platforms.map(p => (
                                                        <option key={p.num} value={p.num}>PF {p.num}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="tool-action-btn primary"
                                                    style={{ margin: 0, flex: 1 }}
                                                    onClick={handleManualAssign}
                                                    disabled={applying}
                                                >
                                                    {applying ? 'ASSIGNING...' : 'CONFIRM'}
                                                </button>
                                                <button
                                                    className="tool-action-btn secondary"
                                                    style={{ margin: 0, width: '70px' }}
                                                    onClick={() => setShowManualOverride(false)}
                                                >
                                                    CANCEL
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header red-glow-h">
                            <AlertTriangle size={16} className="text-red" />
                            <h2 className="text-red">SYSTEM HEALTH</h2>
                        </div>
                        <div className="tool-content">
                            {recommendations.length > 0 ? (
                                <div className="pf-conflict-alert">
                                    <div className="conflict-title"><AlertTriangle size={12} /> CONFLICT DETECTED</div>
                                    <p>PF-{recommendations[0].current_platform.replace(/\D/g, '')} Reservation overlaps with Delayed Arrival of <span className="link-text">{recommendations[0].train_name}</span>.</p>
                                    <button className="link-btn" onClick={() => {
                                        const pfIdx = parseInt(recommendations[0].current_platform.replace(/\D/g, '')) - 1;
                                        if (!isNaN(pfIdx)) setFocused(pfIdx);
                                    }}>VIEW MITIGATION STRATEGY ›</button>
                                </div>
                            ) : (
                                <div className="pf-conflict-alert" style={{ background: 'rgba(32,201,151,0.08)', border: '1px solid rgba(32,201,151,0.2)' }}>
                                    <div className="conflict-title" style={{ color: 'var(--color-green)' }}><CheckCircle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> ALL CLEAR</div>
                                    <p style={{ color: 'var(--text-muted)' }}>No platform assignment conflicts detected at this station.</p>
                                </div>
                            )}
                            <div className="pf-stats-row">
                                <div className="pf-stat">
                                    <span className="pf-stat-label">ASSIGNED</span>
                                    <span className="pf-stat-val">{platforms.filter(p => p.status === 'occupied' || p.status === 'reserved').length}</span>
                                </div>
                                <div className="pf-stat">
                                    <span className="pf-stat-label">EFFICIENCY</span>
                                    <span className="pf-stat-val text-green">94%</span>
                                </div>
                            </div>
                        </div>
                        <div className="pf-engine-status">
                            <span>ENGINE STATUS</span>
                            <span className="text-blue">OPERATIONAL</span>
                        </div>
                    </div>

                    {/* Event Log */}
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header">
                            <Clock size={14} className="text-muted" />
                            <h2 className="text-muted">EVENT LOG</h2>
                        </div>
                        <div className="tool-content" style={{ padding: '12px 16px' }}>
                            {eventLogs.map((e, i) => (
                                <div className="event-log-row" key={i}>
                                    <span className="event-log-time">{e.ts ? e.ts.slice(0, 5) : '14:00'}</span>
                                    <span className="event-log-msg">{e.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
