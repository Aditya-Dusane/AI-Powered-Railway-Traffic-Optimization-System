import React, { useState, useEffect } from 'react';
import { Shield, Download, Search, Filter, CheckCircle, AlertTriangle, Cpu, User, Activity, Brain, TrendingUp, RefreshCw } from 'lucide-react';

const logData = [
    { id: 'EVT-4821', ts: '19:42:08', type: 'AI_DECISION', module: 'Scheduler', source: 'AI', action: 'Rerouted 12002 via Loop Line. ETA updated to 16:15.', status: 'Applied', hash: 'a3f2c1...d9e' },
    { id: 'EVT-4820', ts: '19:40:55', type: 'OPERATOR_OVERRIDE', module: 'Platform', source: 'Operator', action: 'Manually assigned PF-03 to 12381 overriding AI suggestion of PF-06.', status: 'Logged', hash: 'f8b1a0...42c' },
    { id: 'EVT-4819', ts: '19:38:12', type: 'ALERT', module: 'Disruption', source: 'Sensor', action: 'Track obstruction detected at Sector D-14 near Palwal. Auto-alert raised.', status: 'Active', hash: '2d9f3e...a1b' },
    { id: 'EVT-4818', ts: '19:35:01', type: 'AI_DECISION', module: 'Comms', source: 'AI', action: 'Generated PA announcement in Hindi for Shatabdi delay at NDLS PF-02.', status: 'Broadcast', hash: 'c7a4f9...38d' },
    { id: 'EVT-4817', ts: '19:32:44', type: 'SYSTEM', module: 'Monitoring', source: 'System', action: 'Container platform-optimizer auto-restarted after CPU threshold breach.', status: 'Resolved', hash: '3e8b2d...f0c' },
    { id: 'EVT-4816', ts: '19:28:03', type: 'AI_DECISION', module: 'Scheduler', source: 'AI', action: 'Speed reduction advisory issued for 12301 Rajdhani through JP-NDLS.', status: 'Applied', hash: 'b9c3e7...22a' },
    { id: 'EVT-4815', ts: '19:25:18', type: 'OPERATOR_OVERRIDE', module: 'Platform', source: 'Operator', action: 'Priya Sharma rejected AI platform reassignment for 22415 Vande Bharat.', status: 'Logged', hash: '5f1a8b...99e' },
    { id: 'EVT-4814', ts: '19:20:00', type: 'SYSTEM', module: 'Monitoring', source: 'System', action: 'Kafka lag resolved on ai.recommendations.feed. Processed 4,520 events.', status: 'Info', hash: 'd4e9c3...14f' },
    { id: 'EVT-4813', ts: '19:15:33', type: 'ALERT', module: 'Disruption', source: 'Sensor', action: 'Signal failure at Junction East-2, Hazrat Nizamuddin. Manual override.', status: 'Active', hash: '7c2b5f...80a' },
    { id: 'EVT-4812', ts: '19:10:11', type: 'AI_DECISION', module: 'HITL', source: 'AI', action: 'Recommended 8-min delay for 12622 Tamil Nadu Exp — approved by operator.', status: 'Applied', hash: '1a6d3c...57b' },
    { id: 'EVT-4811', ts: '19:05:44', type: 'OPERATOR_OVERRIDE', module: 'Scheduler', source: 'Operator', action: 'Arjun Mehta manually delayed 12461 departure by 20 min due to congestion.', status: 'Logged', hash: '9e3f2a...c1d' },
    { id: 'EVT-4810', ts: '19:01:22', type: 'AI_DECISION', module: 'Comms', source: 'AI', action: 'Emergency announcement in Tamil broadcast for MAS platform change.', status: 'Broadcast', hash: '4b7d91...a0f' },
    { id: 'EVT-4809', ts: '18:58:37', type: 'SYSTEM', module: 'Monitoring', source: 'System', action: 'Model v4.3 accuracy validation complete. F1 score 0.947.', status: 'Info', hash: '82ef3c...19b' },
    { id: 'EVT-4808', ts: '18:54:01', type: 'ALERT', module: 'Platform', source: 'Sensor', action: 'PF-07 NDLS: Crowd density exceeded threshold (4.2 pax/m²). Alert raised.', status: 'Active', hash: 'd1c4b8...73e' },
    { id: 'EVT-4807', ts: '18:49:15', type: 'AI_DECISION', module: 'Scheduler', source: 'AI', action: 'Overnight priority matrix recalculated. 3 freight trains rescheduled.', status: 'Applied', hash: '6a08e2...55c' },
    { id: 'EVT-4806', ts: '18:44:28', type: 'SYSTEM', module: 'Monitoring', source: 'System', action: 'Nightly backup of audit ledger completed. 4,806 records anchored.', status: 'Info', hash: '39f7b1...92d' },
    { id: 'EVT-4805', ts: '18:40:03', type: 'OPERATOR_OVERRIDE', module: 'Disruption', source: 'Operator', action: 'Sandeep Rao approved emergency re-routing plan for Palwal blockage.', status: 'Logged', hash: 'a5c3e9...6f1' },
    { id: 'EVT-4804', ts: '18:35:56', type: 'AI_DECISION', module: 'HITL', source: 'AI', action: 'Conflict resolution for 3-way PF clash at HWH generated and queued.', status: 'Queued', hash: 'c82b4a...e3d' },
    { id: 'EVT-4803', ts: '18:31:12', type: 'ALERT', module: 'Disruption', source: 'Sensor', action: 'Engine fault: Locomotive WAP-7 #28491 at Mathura. Service halted.', status: 'Active', hash: 'f6d90c...28b' },
    { id: 'EVT-4802', ts: '18:27:44', type: 'AI_DECISION', module: 'Comms', source: 'AI', action: 'Multilingual delay message sent to 18 display screens at NDLS concourse.', status: 'Broadcast', hash: '71a3e5...9c2' },
];

const typeConfig = {
    AI_DECISION: { color: 'blue', icon: Cpu, label: 'AI Decision' },
    OPERATOR_OVERRIDE: { color: 'yellow', icon: User, label: 'Operator Override' },
    ALERT: { color: 'red', icon: AlertTriangle, label: 'Alert' },
    SYSTEM: { color: 'green', icon: Activity, label: 'System' },
};
const statusColors = { Applied: 'green', Logged: 'blue', Active: 'red', Broadcast: 'blue', Resolved: 'green', Info: 'muted', Queued: 'yellow' };

const kpis = [
    { label: 'AI Decisions Today', value: '142', icon: Cpu, color: 'blue' },
    { label: 'Operator Overrides', value: '17', icon: User, color: 'yellow' },
    { label: 'Disruptions Handled', value: '8', icon: AlertTriangle, color: 'red' },
    { label: 'System Events', value: '310', icon: Activity, color: 'green' },
];

// Mini line chart for event frequency
const freqData = [18, 24, 32, 28, 41, 37, 52, 48, 60, 55, 62, 58];
const FreqChart = () => {
    const max = Math.max(...freqData, 1), min = Math.min(...freqData);
    const range = max - min || 1;
    const pts = freqData.map((v, i) => `${(i / (freqData.length - 1)) * 260},${50 - ((v - min) / range) * 46}`).join(' ');
    return (
        <svg width="100%" height="54" viewBox="0 0 260 54" style={{ display: 'block' }}>
            <polyline points={pts} fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinejoin="round" />
            {freqData.map((v, i) => (
                <circle key={i} cx={(i / (freqData.length - 1)) * 260} cy={50 - ((v - min) / range) * 46} r="2.5" fill="var(--accent-blue)" />
            ))}
        </svg>
    );
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState(logData);
    const [selected, setSelected] = useState(logData[0]);
    const [filterType, setFilterType] = useState('ALL');
    const [search, setSearch] = useState('');
    const [kpiList, setKpiList] = useState(kpis);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/audit/logs');
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
                // Also set selected to the first if it exists and current selected is not in logs
                if (data.logs.length > 0 && (!selected || !data.logs.some(l => l.id === selected.id))) {
                    setSelected(data.logs[0]);
                }
            }
            if (data.kpis) {
                setKpiList([
                    { label: 'AI Decisions Today', value: String(data.kpis.ai_decisions), icon: Cpu, color: 'blue' },
                    { label: 'Operator Overrides', value: String(data.kpis.operator_overrides), icon: User, color: 'yellow' },
                    { label: 'Disruptions Handled', value: String(data.kpis.disruptions_handled), icon: AlertTriangle, color: 'red' },
                    { label: 'System Events', value: String(data.kpis.system_events), icon: Activity, color: 'green' }
                ]);
            }
        } catch (err) {
            console.error("Error fetching audit logs:", err);
        }
    };

    useEffect(() => {
        fetchLogs();
        const t = setInterval(fetchLogs, 4000);
        return () => clearInterval(t);
    }, []);


    const filtered = logs.filter(l =>
        (filterType === 'ALL' || l.type === filterType) &&
        (l.action.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="view-wrapper">
            <main className="page-content">

                {/* KPI Row */}
                <div className="audit-kpi-row">
                    {kpiList.map((k, i) => (
                        <div className="card audit-kpi-card" key={i}>
                            <div className="db-kpi-header"><span>{k.label}</span><k.icon size={15} className={`text-${k.color}`} /></div>
                            <div className="db-kpi-value">{k.value}</div>
                        </div>
                    ))}
                </div>

                {/* Event Frequency Chart */}
                <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
                    <div className="section-header" style={{ padding: '0 0 12px' }}>
                        <div className="header-title"><TrendingUp size={14} className="text-blue" /> EVENT FREQUENCY — LAST 12 HOURS</div>
                    </div>
                    <FreqChart />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Events per hour · 06:00 → 18:00 IST</div>
                </div>

                {/* Main Table */}
                <div className="card audit-main-card">
                    <div className="section-header space-between">
                        <div className="header-title"><Shield size={14} className="text-blue" /> IMMUTABLE AUDIT LOG — NDLS CONTROL CENTER</div>
                        <div className="audit-toolbar">
                            <div className="audit-search">
                                <Search size={13} />
                                <input className="audit-search-input" placeholder="Search by event / ID…" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <div className="audit-filter-tabs">
                                {['ALL', 'AI_DECISION', 'OPERATOR_OVERRIDE', 'ALERT', 'SYSTEM'].map(f => (
                                    <button key={f} className={`audit-filter-tab ${filterType === f ? 'active' : ''}`} onClick={() => setFilterType(f)}>
                                        {f === 'ALL' ? 'All' : typeConfig[f].label}
                                    </button>
                                ))}
                            </div>
                            <button className="audit-export-btn" onClick={fetchLogs}><RefreshCw size={13} style={{ marginRight: '4px' }} /> Refresh</button>
                        </div>
                    </div>
                    <table className="audit-table">
                        <thead>
                            <tr><th>TIMESTAMP</th><th>EVENT ID</th><th>TYPE</th><th>MODULE</th><th>SOURCE</th><th>ACTION SUMMARY</th><th>STATUS</th><th>HASH</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(log => {
                                const Cfg = typeConfig[log.type];
                                return (
                                    <tr key={log.id} className={`audit-row ${selected?.id === log.id ? 'selected' : ''}`} onClick={() => setSelected(log)}>
                                        <td className="mon-td-muted">{log.ts}</td>
                                        <td><span className="train-id-badge bg-blue-dim">{log.id}</span></td>
                                        <td><span className={`audit-type-badge ${Cfg.color}`}><Cfg.icon size={10} /> {Cfg.label}</span></td>
                                        <td className="mon-td-muted">{log.module}</td>
                                        <td><span className={`audit-source-badge ${log.source.toLowerCase()}`}>{log.source}</span></td>
                                        <td className="audit-action-cell">{log.action}</td>
                                        <td><span className={`text-${statusColors[log.status]}`} style={{ fontSize: '11px', fontWeight: '700' }}>{log.status}</span></td>
                                        <td className="audit-hash">{log.hash}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div className="card audit-detail-card">
                        <div className="section-header space-between">
                            <div className="header-title"><CheckCircle size={14} className="text-green" /> EVENT DETAIL — {selected.id}</div>
                            <div className="audit-immutable-tag"><Shield size={11} /> IMMUTABLE RECORD</div>
                        </div>
                        <div className="audit-detail-body">
                            <div className="audit-detail-grid">
                                <div className="audit-detail-block"><span className="audit-detail-label">EVENT TYPE</span><span className={`audit-type-badge ${typeConfig[selected.type].color}`} style={{ display: 'inline-flex' }}>{typeConfig[selected.type].label}</span></div>
                                <div className="audit-detail-block"><span className="audit-detail-label">TIMESTAMP</span><span className="audit-detail-val">{selected.ts}</span></div>
                                <div className="audit-detail-block"><span className="audit-detail-label">MODULE</span><span className="audit-detail-val">{selected.module}</span></div>
                                <div className="audit-detail-block"><span className="audit-detail-label">TRIGGER SOURCE</span><span className={`audit-source-badge ${selected.source.toLowerCase()}`}>{selected.source}</span></div>
                                <div className="audit-detail-block" style={{ gridColumn: '1/-1' }}><span className="audit-detail-label">FULL ACTION DESCRIPTION</span><p className="audit-detail-val">{selected.action}</p></div>
                                <div className="audit-detail-block" style={{ gridColumn: '1/-1' }}>
                                    <span className="audit-detail-label">BLOCKCHAIN HASH VERIFICATION</span>
                                    <div className="audit-hash-box"><Shield size={12} className="text-green" /><span className="font-mono">{selected.hash} — Verified ✓</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Right Sidebar */}
            <aside className="universal-right-sidebar">
                <div className="dashboard-sidebar-content">
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header blue-glow"><Brain size={16} /><h2>RAILSYNC AI ANALYSIS</h2></div>
                        <div className="tool-content">
                            <div className="tool-minor-item tool-action-box highlight">
                                <div className="tool-sub-title">AI PATTERN DETECTION</div>
                                <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: '1.5' }}>Operator overrides are 34% higher between 18:00–20:00 IST. AI recommends increasing auto-approval confidence threshold to 92% during peak hours.</p>
                                <button className="tool-action-btn primary">VIEW FULL ANALYSIS</button>
                            </div>
                            <div className="tool-minor-item">
                                <div className="tool-sub-title">ANOMALY DETECTED</div>
                                <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: '1.5' }}>3 similar platform conflicts in past 48h. Suggest scheduling model retraining on NDLS PF-02 bottleneck data.</p>
                            </div>
                        </div>
                    </div>
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header"><Filter size={16} className="text-blue" /><h2>LOG FILTERS</h2></div>
                        <div className="tool-content">
                            {['MODULE', 'OPERATOR', 'TIME RANGE'].map((label, i) => (
                                <div className="audit-filter-group" key={i}>
                                    <label className="audit-filter-label">{label}</label>
                                    <select className="comms-lang-select">
                                        {label === 'MODULE' && ['All Modules', 'Scheduler', 'Platform', 'Disruption', 'Comms', 'Monitoring'].map(o => <option key={o}>{o}</option>)}
                                        {label === 'OPERATOR' && ['All Operators', 'Rajesh Kumar', 'Priya Sharma', 'Arjun Mehta', 'Sandeep Rao'].map(o => <option key={o}>{o}</option>)}
                                        {label === 'TIME RANGE' && ['Last 1 Hour', 'Last 6 Hours', 'Today', 'Last 7 Days'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header"><Shield size={14} className="text-green" /><h2 className="text-green">SECURITY STATUS</h2></div>
                        <div className="tool-content">
                            {[['Log Integrity Check', 'VERIFIED', 'green'], ['Blockchain Anchor', 'SYNCED', 'green'], ['Audit Export', 'QUEUED', 'yellow']].map(([l, v, c], i) => (
                                <div className="mon-health-row" key={i}><div className={`mon-dot ${c}`}></div><span className="mon-health-label">{l}</span><span className={`text-${c}`} style={{ fontSize: '10px', fontWeight: '700' }}>{v}</span></div>
                            ))}
                            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(18,169,122,0.08)', border: '1px solid rgba(18,169,122,0.25)', borderRadius: '6px', fontSize: '11px', color: 'var(--color-green)' }}>
                                4,821 events logged today. Last hash anchored at 19:40 IST.
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
