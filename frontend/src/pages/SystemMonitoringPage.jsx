import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Database, AlertTriangle, CheckCircle, Clock, Brain, TrendingDown } from 'lucide-react';

const containers = [
    { name: 'platform-optimizer', status: 'healthy', cpu: 38, mem: 52, uptime: '14d 6h', restarts: 0 },
    { name: 'ai-scheduler', status: 'healthy', cpu: 61, mem: 68, uptime: '14d 6h', restarts: 0 },
    { name: 'disruption-engine', status: 'warning', cpu: 78, mem: 82, uptime: '3d 14h', restarts: 2 },
    { name: 'passenger-comms-agent', status: 'healthy', cpu: 22, mem: 39, uptime: '14d 6h', restarts: 0 },
    { name: 'hitl-approval-svc', status: 'healthy', cpu: 18, mem: 31, uptime: '14d 6h', restarts: 0 },
    { name: 'audit-ledger', status: 'healthy', cpu: 9, mem: 24, uptime: '14d 6h', restarts: 0 },
    { name: 'kafka-broker-01', status: 'healthy', cpu: 44, mem: 61, uptime: '14d 6h', restarts: 0 },
    { name: 'kafka-broker-02', status: 'healthy', cpu: 41, mem: 59, uptime: '14d 6h', restarts: 0 },
    { name: 'model-inference-v4', status: 'healthy', cpu: 85, mem: 91, uptime: '1d 2h', restarts: 1 },
    { name: 'data-ingest-pipeline', status: 'error', cpu: 100, mem: 97, uptime: '0h 12m', restarts: 7 },
    { name: 'simulation-core', status: 'healthy', cpu: 28, mem: 44, uptime: '14d 6h', restarts: 0 },
    { name: 'geo-tracker', status: 'healthy', cpu: 15, mem: 29, uptime: '14d 6h', restarts: 0 },
];

const kafkaTopics = [
    { topic: 'train.positions.live', lag: 12, rate: '8.4k/s', status: 'active' },
    { topic: 'ai.recommendations.feed', lag: 0, rate: '420/s', status: 'active' },
    { topic: 'disruption.alerts', lag: 3, rate: '82/s', status: 'active' },
    { topic: 'passenger.comms.out', lag: 0, rate: '210/s', status: 'active' },
    { topic: 'platform.events.raw', lag: 189, rate: '1.2k/s', status: 'lagging' },
    { topic: 'audit.ledger.immutable', lag: 0, rate: '96/s', status: 'active' },
    { topic: 'model.telemetry', lag: 0, rate: '640/s', status: 'active' },
    { topic: 'simulation.results', lag: 0, rate: '28/s', status: 'active' },
];

const rawLogs = [
    { time: '19:42:08', level: 'INFO', service: 'ai-scheduler', msg: 'Reroute recommendation generated for 12002. Confidence: 94%.' },
    { time: '19:41:55', level: 'WARN', service: 'disruption-engine', msg: 'Memory usage at 82%. Consider scaling up container.' },
    { time: '19:41:22', level: 'ERROR', service: 'data-ingest', msg: 'Connection to IRCTC stream lost. Retrying (7/10).' },
    { time: '19:40:10', level: 'INFO', service: 'platform-optimizer', msg: 'Platform 02 conflict resolved. Train 12221 reassigned.' },
    { time: '19:39:55', level: 'INFO', service: 'model-inference-v4', msg: 'Batch inference complete. 1,240 predictions in 128ms.' },
    { time: '19:39:12', level: 'WARN', service: 'kafka-broker-01', msg: 'Consumer lag on platform.events.raw: 189 messages.' },
    { time: '19:38:44', level: 'INFO', service: 'audit-ledger', msg: 'Event EVT-4819 recorded. Hash: 2d9f3e...a1b' },
    { time: '19:38:01', level: 'INFO', service: 'passenger-comms', msg: 'Hindi PA announcement broadcast to 24 speakers at NDLS.' },
    { time: '19:37:30', level: 'INFO', service: 'geo-tracker', msg: '12 trains updated position. Avg GPS accuracy: 4.2m.' },
    { time: '19:36:58', level: 'ERROR', service: 'data-ingest', msg: 'Timeout on zone-D sensor cluster. Auto-alert raised.' },
    { time: '19:36:15', level: 'INFO', service: 'hitl-approval-svc', msg: 'Decision #HIL-0421 approved by operator Rajesh Kumar.' },
    { time: '19:35:44', level: 'INFO', service: 'simulation-core', msg: 'Scenario BKD-14 run complete. Recovery time: 18 min.' },
    { time: '19:35:20', level: 'WARN', service: 'model-inference-v4', msg: 'GPU utilization at 93%. Inference latency increased to 41ms.' },
    { time: '19:34:50', level: 'INFO', service: 'ai-scheduler', msg: 'Traffic plan approved for Northern Zone. 278 trains synced.' },
    { time: '19:34:11', level: 'INFO', service: 'audit-ledger', msg: 'Blockchain anchor confirmed at block #148922.' },
];

// CPU history sparkline data
const cpuHistory = [28, 35, 42, 38, 55, 61, 58, 62, 70, 65, 71, 68];
const memHistory = [45, 48, 52, 50, 58, 62, 60, 65, 70, 68, 72, 70];

const LineChart = ({ data, color, label }) => {
    const max = Math.max(...data, 1), min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * 240},${46 - ((v - min) / range) * 42}`).join(' ');
    return (
        <div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
            <svg width="240" height="50" viewBox="0 0 240 50" style={{ display: 'block' }}>
                <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
                <circle cx={(data.length - 1) / (data.length - 1) * 240} cy={46 - ((data[data.length - 1] - min) / range) * 42} r="3" fill={color} />
            </svg>
        </div>
    );
};

export default function SystemMonitoringPage() {
    const [logs, setLogs] = useState(rawLogs);
    const [containersState, setContainersState] = useState(containers);
    const [kafkaTopicsState, setKafkaTopicsState] = useState(kafkaTopics);
    const [diagnostics, setDiagnostics] = useState({
        anomaly_prediction: 'data-ingest-pipeline has failed 7 times in 12 minutes. AI predicts full memory exhaustion in ~18 min. Recommend container restart + scale-up.',
        scaling_advisory: 'model-inference-v4 at 93% GPU. AI recommends adding 1 replica to handle peak traffic load until 21:00 IST.',
        kafka_optimization: 'platform.events.raw partition lag: 189. Increase consumer group from 2 to 4 threads to clear backlog.'
    });
    const [restarting, setRestarting] = useState(false);

    const fetchTelemetry = async () => {
        try {
            const res = await fetch('/api/monitoring');
            const data = await res.json();
            if (data.containers) setContainersState(data.containers);
            if (data.kafka_topics) setKafkaTopicsState(data.kafka_topics);
            if (data.logs) setLogs(data.logs);
            if (data.diagnostics) setDiagnostics(data.diagnostics);
        } catch (err) {
            console.error("Error fetching telemetry data:", err);
        }
    };

    useEffect(() => {
        // Fetch immediately and poll every 4 seconds
        fetchTelemetry();
        const t = setInterval(fetchTelemetry, 4000);
        return () => clearInterval(t);
    }, []);

    const handleRestartContainer = async (name) => {
        setRestarting(true);
        try {
            const res = await fetch('/api/monitoring/restart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Command executed: ${data.message}`);
                fetchTelemetry();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Error restarting container:", err);
        } finally {
            setRestarting(false);
        }
    };

    const statusColor = s => s === 'healthy' ? 'green' : s === 'warning' ? 'yellow' : 'red';

    // Calculate metrics
    const totalContainers = containersState.length;
    const healthyCount = containersState.filter(c => c.status === 'healthy').length;
    const avgCpu = Math.round(containersState.reduce((sum, c) => sum + c.cpu, 0) / totalContainers) || 44;
    const modelContainer = containersState.find(c => c.name === 'model-inference-v4');
    const modelLatency = modelContainer ? `${modelContainer.cpu > 80 ? 41 : 28}ms` : '41ms';
    const totalKafkaLag = kafkaTopicsState.reduce((sum, t) => sum + t.lag, 0);

    const healthyContainersCount = containersState.filter(c => c.status === 'healthy').length;
    const warningContainersCount = containersState.filter(c => c.status === 'warning').length;
    const errorContainersCount = containersState.filter(c => c.status === 'error').length;
    const activeKafkaTopicsCount = kafkaTopicsState.filter(t => t.status === 'active').length;
    const laggingTopicsCount = kafkaTopicsState.filter(t => t.status === 'lagging').length;

    return (
        <div className="view-wrapper">
            <main className="page-content">

                {/* KPI Row */}
                <div className="audit-kpi-row" style={{ marginBottom: '16px' }}>
                    {[
                        { label: 'Containers Running', value: `${healthyCount}/${totalContainers}`, icon: Server, color: 'green' },
                        { label: 'Avg. CPU Usage', value: `${avgCpu}%`, icon: Cpu, color: 'blue' },
                        { label: 'Model Latency', value: modelLatency, icon: Activity, color: 'yellow' },
                        { label: 'Kafka Lag Total', value: String(totalKafkaLag), icon: Database, color: 'red' },
                    ].map((k, i) => (
                        <div className="card" key={i} style={{ padding: '16px 20px' }}>
                            <div className="db-kpi-header"><span>{k.label}</span><k.icon size={15} className={`text-${k.color}`} /></div>
                            <div className="db-kpi-value">{k.value}</div>
                        </div>
                    ))}
                </div>

                {/* CPU + Memory Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="card" style={{ padding: '16px 20px' }}>
                        <div className="section-header" style={{ padding: '0 0 12px' }}>
                            <div className="header-title"><Cpu size={14} className="text-blue" /> SYSTEM CPU LOAD HISTORY (12h)</div>
                        </div>
                        <LineChart data={cpuHistory} color="#00a8ff" label="CPU % → Time" />
                    </div>
                    <div className="card" style={{ padding: '16px 20px' }}>
                        <div className="section-header" style={{ padding: '0 0 12px' }}>
                            <div className="header-title"><Database size={14} className="text-yellow" /> MEMORY USAGE HISTORY (12h)</div>
                        </div>
                        <LineChart data={memHistory} color="#fcc419" label="Memory % → Time" />
                    </div>
                </div>

                {/* Container Health Table */}
                <div className="card" style={{ marginBottom: '16px' }}>
                    <div className="section-header"><div className="header-title"><Server size={14} className="text-blue" /> CONTAINER HEALTH — {containersState.length} SERVICES</div></div>
                    <table className="audit-table">
                        <thead><tr><th>CONTAINER</th><th>STATUS</th><th>CPU %</th><th>MEM %</th><th>UPTIME</th><th>RESTARTS</th></tr></thead>
                        <tbody>
                            {containersState.map((c, i) => (
                                <tr key={i} className="audit-row">
                                    <td className="mon-container-name">{c.name}</td>
                                    <td><span className={`audit-source-badge ${c.status === 'healthy' ? 'ai' : c.status === 'warning' ? 'operator' : 'sensor'}`}>{c.status.toUpperCase()}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '5px', background: 'var(--border-color)', borderRadius: '3px' }}>
                                                <div style={{ width: `${c.cpu}%`, height: '100%', background: c.cpu > 80 ? '#ff6b6b' : '#00a8ff', borderRadius: '3px' }}></div>
                                            </div>
                                            <span className="mon-td-muted">{c.cpu}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '5px', background: 'var(--border-color)', borderRadius: '3px' }}>
                                                <div style={{ width: `${c.mem}%`, height: '100%', background: c.mem > 80 ? '#ff6b6b' : '#fcc419', borderRadius: '3px' }}></div>
                                            </div>
                                            <span className="mon-td-muted">{c.mem}%</span>
                                        </div>
                                    </td>
                                    <td className="mon-td-muted">{c.uptime}</td>
                                    <td><span className={c.restarts > 0 ? 'text-red' : 'text-green'} style={{ fontWeight: '700', fontSize: '11px' }}>{c.restarts}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Kafka Topics */}
                <div className="card" style={{ marginBottom: '16px' }}>
                    <div className="section-header"><div className="header-title"><Activity size={14} className="text-blue" /> KAFKA DATA BUS — {kafkaTopicsState.length} TOPICS</div></div>
                    <table className="audit-table">
                        <thead><tr><th>TOPIC</th><th>STATUS</th><th>LAG</th><th>THROUGHPUT</th></tr></thead>
                        <tbody>
                            {kafkaTopicsState.map((t, i) => (
                                <tr key={i} className="audit-row">
                                    <td className="mon-kafka-topic">{t.topic}</td>
                                    <td><span className={`audit-type-badge ${t.status === 'active' ? 'green' : 'yellow'}`}>{t.status.toUpperCase()}</span></td>
                                    <td><span className={t.lag > 50 ? 'text-red' : t.lag > 0 ? 'text-yellow' : 'text-green'} style={{ fontWeight: '700', fontSize: '11px' }}>{t.lag}</span></td>
                                    <td className="mon-td-muted">{t.rate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Realtime Logs */}
                <div className="card">
                    <div className="section-header space-between">
                        <div className="header-title"><Clock size={14} className="text-blue" /> REAL-TIME SYSTEM LOGS</div>
                        <div><span className="dot green" style={{ marginRight: '6px' }}></span><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LIVE STREAM</span></div>
                    </div>
                    <div className="mon-log-list" style={{ maxHeight: '220px', overflowY: 'auto', padding: '8px 0' }}>
                        {logs.map((l, i) => (
                            <div key={i} className="mon-log-row" style={{ display: 'flex', gap: '12px', padding: '5px 16px', borderBottom: '1px solid rgba(42,58,82,0.2)', fontSize: '11px' }}>
                                <span className="mon-log-time" style={{ minWidth: '58px', color: 'var(--text-muted)' }}>{l.time}</span>
                                <span className={`mon-log-level ${l.level.toLowerCase()}`} style={{ minWidth: '42px', fontWeight: '700', fontSize: '9px', color: l.level === 'INFO' ? 'var(--accent-blue)' : l.level === 'WARN' ? 'var(--color-yellow)' : 'var(--color-red)' }}>{l.level}</span>
                                <span className="text-muted" style={{ minWidth: '140px', fontSize: '10px' }}>{l.service}</span>
                                <span className="mon-log-msg">{l.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Right Sidebar */}
            <aside className="universal-right-sidebar">
                <div className="dashboard-sidebar-content">
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header blue-glow"><Brain size={16} /><h2>RAILSYNC AI DIAGNOSTICS</h2></div>
                        <div className="tool-content">
                            <div className="tool-minor-item tool-action-box highlight">
                                <div className="tool-sub-title">ANOMALY PREDICTION</div>
                                <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: '1.5' }}>{diagnostics.anomaly_prediction}</p>
                                <button className="tool-action-btn primary" onClick={() => handleRestartContainer('data-ingest-pipeline')} disabled={restarting}>
                                    {restarting ? 'RESTARTING...' : 'RESTART CONTAINER'}
                                </button>
                            </div>
                            <div className="tool-minor-item">
                                <div className="tool-sub-title">SCALING ADVISORY</div>
                                <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: '1.5' }}>{diagnostics.scaling_advisory}</p>
                            </div>
                            <div className="tool-minor-item">
                                <div className="tool-sub-title">KAFKA OPTIMIZATION</div>
                                <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: '1.5' }}>{diagnostics.kafka_optimization}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header"><Server size={14} className="text-blue" /><h2>HEALTH SUMMARY</h2></div>
                        <div className="tool-content">
                            {[
                                ['Healthy Containers', String(healthyContainersCount), 'green'],
                                ['Warning Containers', String(warningContainersCount), 'yellow'],
                                ['Error Containers', String(errorContainersCount), 'red'],
                                ['Active Kafka Topics', String(activeKafkaTopicsCount), 'green'],
                                ['Lagging Topics', String(laggingTopicsCount), 'yellow']
                            ].map(([l, v, c], i) => (
                                <div className="mon-health-row" key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-color)', fontSize: '11px' }}>
                                    <span className="mon-health-label">{l}</span>
                                    <span className={`text-${c}`} style={{ fontWeight: '700' }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header"><TrendingDown size={14} className="text-red" /><h2 className="text-red">CRITICAL ALERTS</h2></div>
                        <div className="tool-content" style={{ padding: '0' }}>
                            {containersState.filter(c => c.status === 'error' || c.status === 'warning').map((c, i) => (
                                <div className="feed-entry high" key={i}>
                                    <div className="entry-title text-red">{c.name}</div>
                                    <p className="entry-body">{c.status === 'error' ? 'Status: CRITICAL. Container requires immediate restart.' : 'Status: WARNING. Performance thresholds exceeded.'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
