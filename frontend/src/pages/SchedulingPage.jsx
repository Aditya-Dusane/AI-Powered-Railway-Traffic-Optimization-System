import React, { useState, useEffect } from 'react';
import { AlertTriangle, Rocket, CheckCircle, Settings, Zap, Brain } from 'lucide-react';

// ── 50 trains ──
const trainData = [
    { id: '12423', name: 'Dibrugarh Rajdhani', from: 'New Delhi (NDLS)', to: 'Dibrugarh (DBRG)', time: '10:05', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12002', name: 'Bhopal Shatabdi', from: 'New Delhi (NDLS)', to: 'Rani Kamlapati (RKMP)', time: '10:15', status: '+22m DELAY', statusClass: 'delayed', conflict: { label: 'OVERLAP PF-02', class: 'danger' } },
    { id: '12221', name: 'Pune Duronto', from: 'Howrah (HWH)', to: 'Pune Jn (PUNE)', time: '10:28', status: '+5m ALERT', statusClass: 'risk', conflict: { label: 'CLEARANCE RISK', class: 'warn' } },
    { id: '12381', name: 'Kolkata Rajdhani', from: 'Howrah (HWH)', to: 'New Delhi (NDLS)', time: '11:10', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12301', name: 'Howrah Rajdhani', from: 'Howrah (HWH)', to: 'New Delhi (NDLS)', time: '11:20', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '22415', name: 'Vande Bharat Express', from: 'New Delhi (NDLS)', to: 'Varanasi (BSB)', time: '12:00', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12621', name: 'Tamil Nadu Express', from: 'New Delhi (NDLS)', to: 'Chennai (MAS)', time: '12:30', status: '+18m DELAY', statusClass: 'delayed', conflict: null },
    { id: '12953', name: 'Mumbai Rajdhani', from: 'New Delhi (NDLS)', to: 'Mumbai (MMCT)', time: '13:00', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12311', name: 'Kalka Mail', from: 'Howrah (HWH)', to: 'Kalka (CDG)', time: '13:25', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12555', name: 'Gorakhdham Express', from: 'Gorakhpur (GKP)', to: 'New Delhi (NDLS)', time: '13:50', status: '+9m ALERT', statusClass: 'risk', conflict: { label: 'BUFFER RISK', class: 'warn' } },
    { id: '14673', name: 'Shaheed Express', from: 'Svdk Mata Vaishno (SVDK)', to: 'Howrah (HWH)', time: '14:10', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12461', name: 'Mandore Express', from: 'Jodhpur (JU)', to: 'New Delhi (NDLS)', time: '14:35', status: '+31m DELAY', statusClass: 'delayed', conflict: { label: 'PLATFORM WAIT', class: 'danger' } },
    { id: '12391', name: 'Shramjeevi Express', from: 'Rajendra Nagar (RJPB)', to: 'New Delhi (NDLS)', time: '15:00', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '22691', name: 'Rajdhani Premium', from: 'Bangalore (SBC)', to: 'New Delhi (NDLS)', time: '15:20', status: '+8m ALERT', statusClass: 'risk', conflict: null },
    { id: '12459', name: 'Rajasthan Sampark Krt', from: 'Jaipur (JP)', to: 'New Delhi (NDLS)', time: '15:45', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12001', name: 'New Bhopal Shatabdi', from: 'New Delhi (NDLS)', to: 'Rani Kamlapati (RKMP)', time: '16:05', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12019', name: 'Howrah Shatabdi', from: 'Howrah (HWH)', to: 'New Delhi (NDLS)', time: '16:30', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12263', name: 'Pune Duronto', from: 'Pune (PUNE)', to: 'New Delhi (NDLS)', time: '16:55', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12616', name: 'Grand Trunk Express', from: 'Chennai (MAS)', to: 'New Delhi (NDLS)', time: '17:20', status: '+12m DELAY', statusClass: 'delayed', conflict: null },
    { id: '12402', name: 'Magadh Express', from: 'Islampur (IMP)', to: 'New Delhi (NDLS)', time: '17:45', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12560', name: 'Shiv Ganga Express', from: 'Varanasi (BSB)', to: 'New Delhi (NDLS)', time: '18:05', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12724', name: 'AP Express', from: 'Hyderabad (HYB)', to: 'New Delhi (NDLS)', time: '18:30', status: '+6m ALERT', statusClass: 'risk', conflict: null },
    { id: '12544', name: 'Karnataka Express', from: 'KSR Bangalore (SBC)', to: 'New Delhi (NDLS)', time: '18:55', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12651', name: 'Tamil Nadu Sampark Krt', from: 'Chennai (MAS)', to: 'New Delhi (NDLS)', time: '19:15', status: 'ON TIME', statusClass: '', conflict: null },
    { id: '12246', name: 'Yuva Express', from: 'Haora (HWH)', to: 'Anand Vihar (ANVT)', time: '19:40', status: 'ON TIME', statusClass: '', conflict: null },
];

const timelineTracks = [
    { label: 'PF 01', blocks: [{ label: '12423 DIBRUGARH RAJ', start: 3, width: 18, class: 'green' }, { label: '12001 BHOPAL SHATABDI', start: 55, width: 16, class: 'green' }] },
    { label: 'PF 02', blocks: [{ label: '12002 SHATABDI (C)', start: 25, width: 18, class: 'red' }, { label: '12221 DURONTO (C)', start: 44, width: 18, class: 'orange' }] },
    { label: 'PF 03', blocks: [{ label: '12381 HWH RAJ', start: 65, width: 16, class: 'blue' }, { label: '12311 KALKA MAIL', start: 10, width: 14, class: 'green' }] },
    { label: 'PF 04', blocks: [{ label: 'YARD SHUNTING', start: 3, width: 12, class: 'gray' }, { label: '22415 VANDE BHARAT', start: 28, width: 15, class: 'blue' }] },
    { label: 'PF 05', blocks: [{ label: '12621 TN EXPRESS', start: 48, width: 17, class: 'orange' }, { label: '12953 MUM RAJ', start: 72, width: 15, class: 'green' }] },
    { label: 'PF 06', blocks: [{ label: '12461 MANDORE (D)', start: 6, width: 20, class: 'red' }] },
];

const timeSlots = ['10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45'];

// Delay distribution bar chart
const delayBuckets = [
    { label: '0', val: 40 }, { label: '1-5', val: 25 }, { label: '6-15', val: 14 },
    { label: '16-30', val: 9 }, { label: '>30', val: 3 },
];

const DelayChart = () => (
    <div className="sched-delay-chart">
        <div className="sched-delay-title">DELAY DISTRIBUTION (min)</div>
        <div className="sched-delay-bars">
            {delayBuckets.map((b, i) => (
                <div key={i} className="sched-delay-bar-item">
                    <div className="sched-delay-bar-wrap">
                        <div className="sched-delay-bar-fill"
                            style={{ height: `${b.val * 1.6}px`, background: i === 0 ? '#20c997' : i < 3 ? '#00a8ff' : i === 3 ? '#fcc419' : '#ff6b6b' }}
                        ></div>
                    </div>
                    <div className="sched-delay-bar-label">{b.label}</div>
                    <div className="sched-delay-bar-val">{b.val}</div>
                </div>
            ))}
        </div>
    </div>
);

const aiRecs = [
    { title: 'Reroute 12002 → PF-06', train_id: '12002', action: 'Move Bhopal Shatabdi to Platform 6 to resolve PF-02 conflict', impact: '−22 min', confidence: 94 },
    { title: 'Speed-reduce 12221 at Mathura', train_id: '12221', action: 'Reduce Duronto speed by 12% through Mathura-Agra sector', impact: '−8 min', confidence: 87 },
    { title: 'Stage 12461 at yard loop', train_id: '12461', action: 'Hold Mandore Express at yard loop until PF-06 is clear', impact: '−14 min', confidence: 91 },
];

export default function SchedulingPage() {
    const [buffer, setBuffer] = useState(2.5);
    const [trains, setTrains] = useState(trainData);
    const [recs, setRecs] = useState(aiRecs);
    const [optimizing, setOptimizing] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/scheduling');
                const data = await res.json();
                if (data.conflicts) {
                    setTrains(prev => prev.map(t => {
                        const conf = data.conflicts.find(c => c.train_id === t.id);
                        if (conf) {
                            return {
                                ...t,
                                status: `+${conf.delay}m ${conf.status.toUpperCase()}`,
                                statusClass: conf.status,
                                conflict: { label: `OVERLAP ${conf.platform}`, class: conf.status === 'delayed' ? 'danger' : 'warn' }
                            };
                        }
                        return t;
                    }));
                }
            } catch (err) {
                console.error("Error fetching scheduling status:", err);
            }
        };
        fetchStatus();
        const t = setInterval(fetchStatus, 5000);
        return () => clearInterval(t);
    }, []);


    const runOptimization = async () => {
        setOptimizing(true);
        try {
            const res = await fetch('/api/scheduling/optimize', { method: 'POST' });
            const data = await res.json();
            if (data.recommendations) {
                // Format the suggestions properly for frontend
                const formatted = data.recommendations.map(r => ({
                    title: r.title,
                    train_id: r.train_id,
                    action: r.action,
                    impact: r.impact,
                    confidence: r.confidence
                }));
                setRecs(formatted);
            }
        } catch (err) {
            console.error("Error running optimization:", err);
        } finally {
            setOptimizing(false);
        }
    };

    const applyRec = async (r) => {
        try {
            const res = await fetch('/api/scheduling/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ train_id: r.train_id, action_text: r.action })
            });
            const data = await res.json();
            if (data.success) {
                // Update local train state
                setTrains(prev => prev.map(t => {
                    if (t.id === r.train_id) {
                        return { ...t, status: 'ON TIME', statusClass: '', conflict: null };
                    }
                    return t;
                }));
                // Remove applied rec
                setRecs(prev => prev.filter(item => item.train_id !== r.train_id));
                alert(`Successfully applied recommendation: ${r.title}`);
            } else {
                alert(`Error applying: ${data.error}`);
            }
        } catch (err) {
            console.error("Error applying recommendation:", err);
        }
    };

    return (
        <div className="view-wrapper">
            <main className="page-content">
                <div className="sched-layout">

                    {/* Timeline */}
                    <div className="card sched-timeline-card">
                        <div className="section-header space-between">
                            <div className="header-title"><Zap size={14} className="text-blue" /> STATION YARD TIMELINE — PLATFORM ALLOCATION</div>
                            <div><span className="sub-text">6 Platforms · {trains.length} Trains Today</span></div>
                        </div>
                        <div className="sched-timeline-grid">
                            <div className="tl-header-row">
                                <div className="tl-pf-col">PF / ID</div>
                                {timeSlots.map(t => <div className="tl-time-label" key={t}>{t}</div>)}
                            </div>
                            {timelineTracks.map((track, i) => (
                                <div className="tl-track-row" key={i}>
                                    <div className="tl-pf-label">{track.label}</div>
                                    <div className="tl-track-area">
                                        {track.blocks.map((b, j) => (
                                            <div key={j} className={`tl-block ${b.class}`} style={{ left: `${b.start}%`, width: `${b.width}%` }}>{b.label}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delay chart */}
                    <div className="card" style={{ padding: '16px 20px' }}>
                        <DelayChart />
                    </div>

                    {/* Table — 25 trains shown */}
                    <div className="card sched-table-card">
                        <div className="section-header space-between">
                            <div className="header-title">TRAIN SCHEDULE DATA — INDIAN SECTOR</div>
                            <div className="sub-text">Monitoring {trains.length} trains today</div>
                        </div>
                        <table className="schedule-table">
                            <thead>
                                <tr>
                                    <th>TRAIN ID / NAME</th><th>ORIGIN</th><th>DESTINATION</th>
                                    <th>SCHEDULED</th><th>STATUS</th><th>AI CONFLICT FLAG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trains.map((t, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="train-id-badge bg-blue-dim">{t.id}</div>
                                            <div className="schedule-train-name">{t.name}</div>
                                        </td>
                                        <td>{t.from}</td><td>{t.to}</td><td>{t.time}</td>
                                        <td>
                                            <span className={`status-pill ${t.statusClass || 'on-time'}`}>
                                                {!t.statusClass && <span className="dot green" style={{ marginRight: '4px' }}></span>}
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            {t.conflict
                                                ? <span className={`conflict-badge ${t.conflict.class}`}><AlertTriangle size={11} /> {t.conflict.label}</span>
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Sidebar */}
            <aside className="universal-right-sidebar">
                <div className="scheduling-sidebar">
                    <div className="sidebar-sec-title"><Zap size={16} className="text-blue" /> INTELLIGENT CONTROL</div>

                    <div className="sched-action-buttons">
                        <button className="sched-action-btn blue-fill" onClick={runOptimization} disabled={optimizing}>
                            {optimizing ? 'Optimizing...' : 'Run AI Optimization'} <Rocket size={15} />
                        </button>
                        <button className="sched-action-btn blue-outline">Approve Traffic Plan <CheckCircle size={15} /></button>
                        <button className="sched-action-btn gray-outline">Run Yard Simulation <Settings size={15} /></button>
                    </div>

                    {/* GenAI Recommendations */}
                    <div className="sched-params-section">
                        <div className="sched-param-title"><Brain size={12} style={{ marginRight: '4px' }} />GENAI RECOMMENDATIONS</div>
                        {recs.map((r, i) => (
                            <div key={i} className="sched-ai-rec-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '3px' }}>
                                    <span>{r.title}</span>
                                    <span className="text-green">{r.impact}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Confidence: {r.confidence}%
                                    <span style={{ float: 'right' }}>
                                        <button onClick={() => applyRec(r)} style={{ fontSize: '9px', background: 'rgba(32,201,151,0.15)', border: '1px solid rgba(32,201,151,0.4)', color: 'var(--color-green)', borderRadius: '3px', padding: '1px 6px', cursor: 'pointer' }}>APPLY</button>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="sched-params-section">
                        <div className="sched-param-title">NEURAL PARAMETERS</div>
                        <div className="sched-param-row">
                            <div className="sched-param-label">
                                <span>CONFLICT BUFFER</span><span className="text-blue">{buffer} min</span>
                            </div>
                            <input type="range" className="range-slider" min="0" max="10" step="0.5" value={buffer} onChange={e => setBuffer(e.target.value)} />
                        </div>
                        <div className="sched-toggle-row">
                            <label className="toggle-switch"><input type="checkbox" defaultChecked /><span className="toggle-knob"></span></label>
                            <span>Prioritize Duronto/Rajdhani</span>
                        </div>
                        <div className="sched-toggle-row">
                            <label className="toggle-switch"><input type="checkbox" /><span className="toggle-knob"></span></label>
                            <span>Auto-resolve Station Holds</span>
                        </div>
                        <div className="sched-toggle-row">
                            <label className="toggle-switch"><input type="checkbox" defaultChecked /><span className="toggle-knob"></span></label>
                            <span>Dynamic Platform Allocation</span>
                        </div>
                    </div>

                    <div className="conflict-critical-box">
                        <div className="critical-title"><AlertTriangle size={13} className="text-red" /> CRITICAL CONFLICT</div>
                        <p>NDLS PF-02: Shatabdi and Duronto overlap at 10:15–10:33. Rerouting Duronto to PF-06 saves 22 min.</p>
                    </div>
                </div>
            </aside>
        </div>
    );
}
