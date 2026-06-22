import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Edit3, AlertTriangle, Brain, Clock, TrendingUp } from 'lucide-react';

const recommendations = [
    { id: 'HIL-0431', type: 'REROUTE', priority: 'CRITICAL', train: '12002 Bhopal Shatabdi', action: 'Reroute to PF-06 NDLS — avoids 22-min conflict with Duronto.', confidence: 94, trainCount: 840, delay: '−22 min' },
    { id: 'HIL-0430', type: 'SCHEDULE', priority: 'HIGH', train: '12221 Pune Duronto', action: 'Delay departure by 8 min to create buffer at NDLS yard.', confidence: 87, trainCount: 520, delay: '−8 min' },
    { id: 'HIL-0429', type: 'PLATFORM', priority: 'HIGH', train: '22415 Vande Bharat', action: 'Reassign platform PF-02 → PF-04 for better passenger access.', confidence: 91, trainCount: 640, delay: '0 min' },
    { id: 'HIL-0428', type: 'SPEED', priority: 'MEDIUM', train: '12301 Howrah Rajdhani', action: 'Maintain 95 km/h through Mathura-Agra sector (wave effect buffer).', confidence: 79, trainCount: 720, delay: '−5 min' },
    { id: 'HIL-0427', type: 'COMMS', priority: 'MEDIUM', train: '12461 Mandore Express', action: 'Broadcast 30-min delay in Hindi + Rajasthani to PF-08 screens.', confidence: 100, trainCount: 380, delay: '0 min' },
    { id: 'HIL-0426', type: 'REROUTE', priority: 'HIGH', train: '12953 Mumbai Rajdhani', action: 'Loop via Mathura Jn to bypass congested Agra Cantt throat.', confidence: 83, trainCount: 890, delay: '−14 min' },
    { id: 'HIL-0425', type: 'SCHEDULE', priority: 'LOW', train: '12555 Gorakhdham Express', action: 'Advance departure by 5 min from NDLS to avoid peak PF congestion.', confidence: 76, trainCount: 430, delay: '+5 min' },
    { id: 'HIL-0424', type: 'ENERGY', priority: 'LOW', train: '—', action: 'Idle PF-12 lighting at Nizamuddin during 20-min service gap.', confidence: 100, trainCount: 0, delay: '0 min' },
    { id: 'HIL-0423', type: 'PLATFORM', priority: 'MEDIUM', train: '12381 Kolkata Rajdhani', action: 'Combine PF-03 and PF-03A coaches to reduce dwell time.', confidence: 82, trainCount: 610, delay: '−6 min' },
    { id: 'HIL-0422', type: 'SPEED', priority: 'CRITICAL', train: '12621 Tamil Nadu Express', action: 'Emergency speed advisory: reduce to 80 km/h at Junction East-2.', confidence: 99, trainCount: 760, delay: 'Prevent' },
];

const decisions = [
    { id: 'HIL-0421', action: 'Approved', train: '12311 Kalka Mail', type: 'REROUTE', operator: 'Rajesh Kumar', ts: '19:35' },
    { id: 'HIL-0420', action: 'Rejected', train: '12459 Raj. Sampark Krt', type: 'PLATFORM', operator: 'Priya Sharma', ts: '19:28' },
    { id: 'HIL-0419', action: 'Approved', train: '12001 New Bhopal Shatabdi', type: 'SCHEDULE', operator: 'Arjun Mehta', ts: '19:21' },
    { id: 'HIL-0418', action: 'Modified', train: '12263 Pune Duronto', type: 'SPEED', operator: 'Sandeep Rao', ts: '19:14' },
    { id: 'HIL-0417', action: 'Approved', train: '22691 Rajdhani Premium', type: 'REROUTE', operator: 'Rajesh Kumar', ts: '19:08' },
];

const typeColors = { REROUTE: 'blue', SCHEDULE: 'yellow', PLATFORM: 'green', SPEED: 'red', COMMS: 'blue', ENERGY: 'green' };
const priorityColors = { CRITICAL: 'red', HIGH: 'yellow', MEDIUM: 'blue', LOW: 'green' };

// Approval rate donut
const DonutChart = ({ pct, color }) => {
    const r = 28, circ = 2 * Math.PI * r;
    return (
        <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border-color)" strokeWidth="7" />
            <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
                strokeDasharray={`${pct / 100 * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
            <text x="36" y="40" fontSize="12" fontWeight="700" fill={color} textAnchor="middle">{pct}%</text>
        </svg>
    );
};

export default function HumanInLoopPage() {
    const [pendingRecs, setPendingRecs] = useState(recommendations);
    const [decisionLog, setDecisionLog] = useState(decisions);
    const [selected, setSelected] = useState(recommendations[0]);
    const [reasoning, setReasoning] = useState('RailSync AI analysed 14 days of historical conflict data at NDLS. This recommendation reduces cascade delay probability by 67%.');
    const [loadingReasoning, setLoadingReasoning] = useState(false);

    const fetchList = async () => {
        try {
            const res = await fetch('/api/hitl');
            const data = await res.json();
            if (data.pending) {
                setPendingRecs(data.pending);
                // maintain selection if available
                if (data.pending.length > 0) {
                    const found = data.pending.find(p => p.id === selected?.id);
                    setSelected(found || data.pending[0]);
                } else {
                    setSelected(null);
                }
            }
            if (data.decisions) {
                setDecisionLog(data.decisions);
            }
        } catch (err) {
            console.error("Error fetching HITL lists:", err);
        }
    };

    useEffect(() => {
        fetchList();
        const t = setInterval(fetchList, 5000);
        return () => clearInterval(t);
    }, []);


    useEffect(() => {
        if (!selected) return;
        
        const fetchReasoning = async () => {
            setLoadingReasoning(true);
            try {
                const res = await fetch(`/api/hitl/reasoning/${selected.id}`);
                const data = await res.json();
                if (data.reasoning) {
                    setReasoning(data.reasoning);
                }
            } catch (err) {
                console.error("Error fetching reasoning:", err);
            } finally {
                setLoadingReasoning(false);
            }
        };
        fetchReasoning();
    }, [selected?.id]);

    const takeAction = async (action) => {
        if (!selected) return;
        try {
            const res = await fetch('/api/hitl/decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selected.id, decision: action, operator: 'Rajesh Kumar' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully recorded ${action} for decision ${selected.id}.`);
                // Move selection forward locally first
                const idx = pendingRecs.findIndex(r => r.id === selected.id);
                if (pendingRecs[idx + 1]) {
                    setSelected(pendingRecs[idx + 1]);
                } else {
                    setSelected(null);
                }
                // Refetch backend data
                fetchList();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Error submitting decision:", err);
        }
    };

    return (
        <div className="view-wrapper">
            <main className="page-content">

                {/* KPI Row */}
                <div className="audit-kpi-row" style={{ marginBottom: '16px' }}>
                    {[
                        { label: 'Pending Decisions', value: pendingRecs.length, color: 'blue' },
                        { label: 'Approved Today', value: 34, color: 'green' },
                        { label: 'Rejected Today', value: 8, color: 'red' },
                        { label: 'Auto-Resolved', value: 61, color: 'yellow' },
                    ].map((k, i) => (
                        <div className="card" key={i} style={{ padding: '16px 20px' }}>
                            <div className="db-kpi-header"><span>{k.label}</span></div>
                            <div className="db-kpi-value">{k.value}</div>
                        </div>
                    ))}
                </div>

                <div className="hil-layout">
                    {/* Recommendations List */}
                    <div className="hil-list-col">
                        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className="section-header"><div className="header-title"><Brain size={14} className="text-blue" /> AI RECOMMENDATIONS — {pendingRecs.length} PENDING</div></div>
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {pendingRecs.map(r => (
                                    <div
                                        key={r.id}
                                        className={`hil-rec-card ${selected?.id === r.id ? 'active' : ''}`}
                                        onClick={() => setSelected(r)}
                                    >
                                        <div className="hil-rec-header">
                                            <span className="train-id-badge bg-blue-dim" style={{ fontSize: '9px' }}>{r.id}</span>
                                            <span className={`hil-priority-badge ${priorityColors[r.priority]}`}>{r.priority}</span>
                                        </div>
                                        <div className="hil-issue-text">{r.train}</div>
                                        <div className="hil-action-preview">{r.action.slice(0, 60)}…</div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                            <span className={`audit-type-badge ${typeColors[r.type]}`} style={{ fontSize: '8px' }}>{r.type}</span>
                                            <span className="text-green" style={{ fontSize: '10px', fontWeight: '700' }}>{r.delay}</span>
                                            <span className="text-muted" style={{ fontSize: '10px', marginLeft: 'auto' }}>{r.confidence}% conf.</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detail Panel */}
                    {selected ? (
                        <div className="hil-detail-col">
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className="section-header space-between">
                                    <div className="header-title"><Brain size={14} className="text-blue" /> DECISION — {selected.id}</div>
                                    <span className={`hil-priority-badge ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                                </div>
                                <div className="hil-detail-body" style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                                    <div className="hil-detail-grid">
                                        <div className="hil-detail-block"><div className="hil-detail-label">TRAIN</div><div className="hil-issue-text">{selected.train}</div></div>
                                        <div className="hil-detail-block"><div className="hil-detail-label">AI CONFIDENCE</div><div className="db-kpi-value" style={{ fontSize: '22px' }}>{selected.confidence}%</div></div>
                                        <div className="hil-detail-block"><div className="hil-detail-label">PASSENGERS AFFECTED</div><div className="db-kpi-value" style={{ fontSize: '22px' }}>{(selected.trainCount ?? selected.passengers ?? 0).toLocaleString()}</div></div>
                                        <div className="hil-detail-block"><div className="hil-detail-label">DELAY IMPACT</div><div className="db-kpi-value text-green" style={{ fontSize: '22px' }}>{selected.delay}</div></div>
                                    </div>

                                    <div style={{ marginTop: '20px' }}>
                                        <div className="hil-detail-label">RECOMMENDED ACTION</div>
                                        <div className="hil-reasoning-box" style={{ marginTop: '8px', fontSize: '12px', lineHeight: '1.6' }}>{selected.action}</div>
                                    </div>

                                    <div style={{ marginTop: '16px' }}>
                                        <div className="hil-detail-label">GENAI REASONING</div>
                                        <div className="hil-reasoning-box" style={{ marginTop: '8px', fontSize: '11px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                                            {loadingReasoning ? 'Generating AI Reasoning explanation...' : reasoning}
                                        </div>
                                    </div>

                                    <div className="hil-action-buttons" style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                        <button className="hil-approve-btn" onClick={() => takeAction('Approved')}><CheckCircle size={14} /> APPROVE</button>
                                        <button className="hil-reject-btn" onClick={() => takeAction('Rejected')}><XCircle size={14} /> REJECT</button>
                                        <button className="hil-modify-btn" onClick={() => takeAction('Modified')}><Edit3 size={14} /> MODIFY</button>
                                    </div>

                                    {/* Recent Decisions */}
                                    <div style={{ marginTop: '20px' }}>
                                        <div className="hil-detail-label"><Clock size={11} style={{ marginRight: '4px' }} />RECENT DECISIONS</div>
                                        {decisionLog.slice(0, 5).map((d, i) => (
                                            <div className="hil-summary-row" key={i}>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.ts} · {d.id}</span>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.train}</span>
                                                <span className={`text-${d.action === 'Approved' ? 'green' : d.action === 'Rejected' ? 'red' : 'yellow'}`} style={{ fontSize: '10px', fontWeight: '700' }}>{d.action}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="hil-detail-col">
                            <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                All recommendations cleared!
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Right Sidebar */}
            <aside className="universal-right-sidebar">
                <div className="dashboard-sidebar-content">
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header blue-glow"><TrendingUp size={16} /><h2>APPROVAL ANALYTICS</h2></div>
                        <div className="tool-content" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <DonutChart pct={81} color="#20c997" />
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>81% Approval Rate</div>
                                <div className="text-muted" style={{ fontSize: '10px', lineHeight: '1.6' }}>34 approved · 8 rejected<br />61 auto-resolved today</div>
                            </div>
                        </div>
                    </div>
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header blue-glow"><Brain size={16} /><h2>RAILSYNC AI SUMMARY</h2></div>
                        <div className="tool-content">
                            <div className="tool-minor-item tool-action-box highlight">
                                <div className="tool-sub-title">GENAI BATCH INSIGHT</div>
                                <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: '1.5' }}>6 of today's 10 CRITICAL decisions involve NDLS PF-02 bottleneck. AI recommends a platform-policy review meeting before tomorrow's peak.</p>
                                <button className="tool-action-btn primary">SCHEDULE REVIEW</button>
                            </div>
                            <div className="tool-minor-item">
                                <div className="tool-sub-title">OPERATOR PERFORMANCE</div>
                                <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: '1.5' }}>Rajesh Kumar avg. decision time: 42s. AI recommendations accepted 88% of the time — highest in team.</p>
                            </div>
                        </div>
                    </div>
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header"><AlertTriangle size={14} className="text-yellow" /><h2 className="text-yellow">OPERATOR GUIDE</h2></div>
                        <div className="tool-content">
                            <p className="text-muted" style={{ fontSize: '11px', lineHeight: '1.6' }}>
                                <b>APPROVE</b> — Executes AI plan immediately.<br />
                                <b>REJECT</b> — Logs override; status quo maintained.<br />
                                <b>MODIFY</b> — Opens parameter editor for custom plan.<br /><br />
                                All decisions are immutably logged on the audit ledger.
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
