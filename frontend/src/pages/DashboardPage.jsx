import React, { useState, useEffect, useRef } from 'react';
import { Train, LayoutGrid, Cpu, AlertTriangle, ArrowUpRight, Activity, Clock, Zap, TrendingUp } from 'lucide-react';


// ── 50 Live Train Feed entries ──
const liveTrains = [
    { id: '12301', name: 'Howrah Rajdhani', from: 'HWH', to: 'NDLS', eta: '14:55', status: 'on-time' },
    { id: '12002', name: 'Bhopal Shatabdi', from: 'NDLS', to: 'RKMP', eta: '15:10', status: 'delayed', delay: '+22m' },
    { id: '22415', name: 'New Delhi Vande Bharat', from: 'NDLS', to: 'VRNC', eta: '15:30', status: 'on-time' },
    { id: '12423', name: 'Dibrugarh Rajdhani', from: 'NDLS', to: 'DBRG', eta: '15:45', status: 'on-time' },
    { id: '12621', name: 'Tamil Nadu Express', from: 'NDLS', to: 'MAS', eta: '16:00', status: 'risk', delay: '+5m' },
    { id: '12381', name: 'Poorva Express', from: 'HWH', to: 'NDLS', eta: '16:20', status: 'on-time' },
    { id: '12001', name: 'New Bhopal Shatabdi', from: 'NDLS', to: 'RKMP', eta: '16:35', status: 'on-time' },
    { id: '12953', name: 'Mumbai Rajdhani', from: 'NDLS', to: 'MMCT', eta: '16:55', status: 'delayed', delay: '+14m' },
    { id: '12459', name: 'Rajasthan Sampark Krt', from: 'JAIT', to: 'NDLS', eta: '17:10', status: 'on-time' },
    { id: '22691', name: 'Rajdhani Premium', from: 'SBC', to: 'NDLS', eta: '17:25', status: 'risk', delay: '+8m' },
    { id: '12311', name: 'Kalka Mail', from: 'HWH', to: 'CDG', eta: '17:40', status: 'on-time' },
    { id: '12555', name: 'Gorakhdham Express', from: 'GKP', to: 'NDLS', eta: '17:55', status: 'on-time' },
    { id: '12461', name: 'Mandore Express', from: 'JU', to: 'NDLS', eta: '18:10', status: 'delayed', delay: '+31m' },
    { id: '14673', name: 'Shaheed Express', from: 'SVDK', to: 'HWH', eta: '18:30', status: 'on-time' },
    { id: '12391', name: 'Shramjeevi Express', from: 'RJPB', to: 'NDLS', eta: '18:45', status: 'on-time' },
];

const recentAlerts = [
    { time: '14:42', title: 'Track Obstruction', desc: 'Sector D-14, Near Palwal. Inspection dispatched.', severity: 'high' },
    { time: '14:38', title: 'Signal Failure', desc: 'Junction East-2, Nizamuddin. Manual override active.', severity: 'med' },
    { time: '14:29', title: 'AI Model Updated', desc: 'RailSync AI Model v4.3 deployed. Latency: 28ms.', severity: 'info' },
    { time: '14:15', title: 'Weather Warning', desc: 'High winds in Rajasthan sector. Speed limits imposed.', severity: 'med' },
    { time: '14:02', title: 'Platform Conflict', desc: 'PF-02 NDLS: Schedule overlap detected by AI.', severity: 'high' },
    { time: '13:51', title: 'Reroute Approved', desc: 'Operator Rajesh approved AI plan for 12002 rerouting.', severity: 'info' },
];

const genAiInsights = [
    { type: 'STRATEGIC REROUTE', desc: 'Divert 12301 Rajdhani to PF-4 at NDLS to avoid Shatabdi overlap. Saves 22 min.', action: true },
    { type: 'SPEED ADVISORY', desc: 'Reduce 22415 Vande Bharat speed by 8% to sync arrival at Agra Cantt (AGC).' },
    { type: 'ENERGY OPTIMIZATION', desc: 'Idle PF-12 lighting at Hazrat Nizamuddin during 20-min service gap.' },
    { type: 'DEMAND PREDICTION', desc: 'Tamil Nadu Express PF crowd: +42% above normal. Suggest extra staff deployment.' },
    { type: 'PREDICTIVE DELAY', desc: 'Mandore Express delay likely to cascade to 12 downstream services at JP.' },
];

// ── Sparkline chart component ──
const Sparkline = ({ values, color = '#00a8ff', height = 36 }) => {
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const w = 120, h = height;
    const pts = values.map((v, i) =>
        `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`
    ).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx={(values.length - 1) / (values.length - 1) * w} cy={h - ((values[values.length - 1] - min) / range) * (h - 4) - 2} r="3" fill={color} />
        </svg>
    );
};

// ── Bar chart for platform utilization ──
const BarChart = ({ data, colors }) => (
    <svg viewBox={`0 0 ${data.length * 28} 60`} style={{ width: '100%', height: '60px' }}>
        {data.map((v, i) => {
            const barH = Math.max((v / 100) * 52, 2);
            return (
                <g key={i}>
                    <rect x={i * 28 + 4} y={56 - barH} width="20" height={barH} rx="2" fill={colors ? colors[i] : '#00a8ff'} opacity="0.85" />
                    <text x={i * 28 + 14} y="59" fontSize="6" fill="#8b9bb4" textAnchor="middle">{i + 1}</text>
                </g>
            );
        })}
    </svg>
);

const kpiData = [
    { label: 'Active Trains', value: '278', sub: '+12 from yesterday', icon: Train, color: 'blue', spark: [210, 225, 240, 232, 248, 261, 258, 270, 265, 278] },
    { label: 'On-Time Performance', value: '91.4%', sub: '+2.1% this week', icon: TrendingUp, color: 'green', spark: [85, 87, 89, 86, 90, 91, 88, 91, 90, 91] },
    { label: 'Active Alerts', value: '5', sub: '2 critical, 3 warn', icon: AlertTriangle, color: 'red', spark: [3, 7, 5, 8, 4, 6, 3, 5, 4, 5] },
    { label: 'Platform Occupancy', value: '84%', sub: 'NDLS station avg.', icon: LayoutGrid, color: 'blue', spark: [70, 75, 78, 80, 82, 79, 83, 85, 84, 84] },
];

const platformUtil = [92, 78, 45, 88, 60, 95, 33, 72, 61, 80];
const platformColors = platformUtil.map(v => v > 85 ? '#ff6b6b' : v > 65 ? '#fcc419' : '#20c997');

export default function DashboardPage({ theme }) {
    const [selectedInsight, setSelectedInsight] = useState(0);
    const [kpis, setKpis] = useState(kpiData);
    const [trains, setTrains] = useState(liveTrains);
    const [platUtil, setPlatUtil] = useState(platformUtil);
    const [platColors, setPlatColors] = useState(platformColors);
    const [alerts, setAlerts] = useState(recentAlerts);
    const [insights, setInsights] = useState(genAiInsights);
    const [executing, setExecuting] = useState(false);
    const mapRef = useRef(null);
    const tileLayerRef = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        if (!window.L) return;
        const L = window.L;

        const STATIONS = {
            NDLS: { name: "New Delhi (NDLS)", coords: [28.643, 77.222] },
            HWH: { name: "Howrah (HWH)", coords: [22.583, 88.341] },
            CDG: { name: "Chandigarh (CDG)", coords: [30.702, 76.818] },
            JP: { name: "Jaipur (JP)", coords: [26.919, 75.788] },
            LKO: { name: "Lucknow (LKO)", coords: [26.831, 80.916] },
            AGC: { name: "Agra Cantt (AGC)", coords: [27.158, 77.994] },
            BPL: { name: "Bhopal (BPL)", coords: [23.259, 77.412] },
            MAS: { name: "Chennai (MAS)", coords: [13.082, 80.270] },
            RKMP: { name: "Rani Kamlapati (RKMP)", coords: [23.204, 77.452] },
            DBRG: { name: "Dibrugarh (DBRG)", coords: [27.472, 94.912] },
            PUNE: { name: "Pune Jn (PUNE)", coords: [18.528, 73.873] },
            MMCT: { name: "Mumbai (MMCT)", coords: [18.969, 72.815] },
            BSB: { name: "Varanasi (BSB)", coords: [25.326, 82.987] }
        };

        if (!mapRef.current) {
            const map = L.map('db-map-container', {
                attributionControl: false,
                zoomControl: false
            }).setView([24.5, 78.8], 5.2);

            const initialTileUrl = theme === 'light'
                ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

            tileLayerRef.current = L.tileLayer(initialTileUrl, {
                maxZoom: 18,
                minZoom: 4
            }).addTo(map);

            L.control.zoom({ position: 'bottomleft' }).addTo(map);

            const trackColor = 'rgba(64, 90, 128, 0.4)';
            const routes = [
                [STATIONS.NDLS.coords, STATIONS.AGC.coords],
                [STATIONS.AGC.coords, STATIONS.BPL.coords],
                [STATIONS.NDLS.coords, STATIONS.JP.coords],
                [STATIONS.NDLS.coords, STATIONS.LKO.coords],
                [STATIONS.LKO.coords, STATIONS.HWH.coords],
                [STATIONS.NDLS.coords, STATIONS.CDG.coords],
                [STATIONS.BPL.coords, STATIONS.MAS.coords],
                [STATIONS.BPL.coords, STATIONS.PUNE.coords],
                [STATIONS.PUNE.coords, STATIONS.MMCT.coords],
                [STATIONS.AGC.coords, STATIONS.BSB.coords],
                [STATIONS.LKO.coords, STATIONS.BSB.coords],
                [STATIONS.HWH.coords, STATIONS.DBRG.coords]
            ];

            routes.forEach(route => {
                L.polyline(route, {
                    color: trackColor,
                    weight: 2,
                    dashArray: '4, 4',
                    opacity: 0.8
                }).addTo(map);
            });

            Object.keys(STATIONS).forEach(key => {
                const s = STATIONS[key];
                L.circleMarker(s.coords, {
                    radius: 4,
                    fillColor: '#0f172a',
                    color: '#38bdf8',
                    weight: 1.5,
                    fillOpacity: 1
                }).addTo(map).bindTooltip(s.name, { permanent: false, direction: 'top' });
            });

            mapRef.current = map;
        }

        const map = mapRef.current;
        markersRef.current.forEach(marker => map.removeLayer(marker));
        markersRef.current = [];

        trains.forEach(t => {
            const fromStation = STATIONS[t.from] || STATIONS.NDLS;
            const toStation = STATIONS[t.to] || STATIONS.AGC;

            let lat, lng;
            if (t.status === 'on-time') {
                lat = fromStation.coords[0] + 0.35 * (toStation.coords[0] - fromStation.coords[0]);
                lng = fromStation.coords[1] + 0.35 * (toStation.coords[1] - fromStation.coords[1]);
            } else if (t.status === 'delayed') {
                lat = fromStation.coords[0] + 0.65 * (toStation.coords[0] - fromStation.coords[0]);
                lng = fromStation.coords[1] + 0.65 * (toStation.coords[1] - fromStation.coords[1]);
            } else {
                lat = fromStation.coords[0] + 0.15 * (toStation.coords[0] - fromStation.coords[0]);
                lng = fromStation.coords[1] + 0.15 * (toStation.coords[1] - fromStation.coords[1]);
            }

            const color = t.status === 'on-time' ? '#20c997' : t.status === 'delayed' ? '#ff6b6b' : '#fcc419';

            const pulseIcon = L.divIcon({
                className: 'custom-pulse-marker',
                html: `<div style="
                    background-color: ${color};
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${color};
                    animation: markerPulse 1.8s infinite;
                "></div>`,
                iconSize: [10, 10],
                iconAnchor: [5, 5]
            });

            const marker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map);
            marker.bindPopup(`
                <div style="font-family: Inter, sans-serif; font-size: 11px; color: var(--text-main);">
                    <strong style="color: var(--accent-blue);">${t.id} - ${t.name}</strong><br/>
                    <strong>Route:</strong> ${t.from} &rarr; ${t.to}<br/>
                    <strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${t.delay || 'ON TIME'}</span>
                </div>
            `, { closeButton: false });

            markersRef.current.push(marker);
        });
    }, [trains]);

    useEffect(() => {
        if (tileLayerRef.current) {
            const tileUrl = theme === 'light'
                ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            tileLayerRef.current.setUrl(tileUrl);
        }
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 100);
        }
    }, [theme]);


    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();
            
            if (data.kpis) {
                const iconMap = { 'Active Trains': Train, 'On-Time Performance': TrendingUp, 'Active Alerts': AlertTriangle, 'Platform Occupancy': LayoutGrid };
                const formattedKpis = data.kpis.map(k => ({
                    ...k,
                    icon: iconMap[k.label] || Train
                }));
                setKpis(formattedKpis);
            }
            if (data.live_trains) setTrains(data.live_trains);
            if (data.platform_util) setPlatUtil(data.platform_util);
            if (data.platform_colors) setPlatColors(data.platform_colors);
            if (data.alerts) setAlerts(data.alerts);
            if (data.insights) setInsights(data.insights);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        }
    };

    useEffect(() => {
        fetchDashboard();
        const t = setInterval(fetchDashboard, 4000);
        return () => clearInterval(t);
    }, []);


    const executeAction = async (insight) => {
        setExecuting(true);
        try {
            const res = await fetch('/api/dashboard/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: insight.type, desc: insight.desc })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Action executed: ${insight.type}\nPlan:\n${data.action_plan.map((s, idx) => `${idx+1}. ${s}`).join('\n')}`);
                fetchDashboard();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Error executing action:", err);
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="view-wrapper">
            <main className="page-content">

                {/* KPI Row with Sparklines */}
                <div className="db-kpi-row">
                    {kpis.map((k, i) => (
                        <div className="card db-kpi-card" key={i}>
                            <div className="db-kpi-header">
                                <span>{k.label}</span>
                                <k.icon size={16} className={`text-${k.color}`} />
                            </div>
                            <div className="db-kpi-value">{k.value}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div className="db-kpi-sub">{k.sub}</div>
                                <Sparkline values={k.spark} color={k.color === 'green' ? '#20c997' : k.color === 'red' ? '#ff6b6b' : '#00a8ff'} height={28} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Map + Live Trains */}
                <div className="db-center-grid">
                    <div className="card db-map-card">
                        <div className="section-header space-between">
                            <div className="header-title"><Activity size={14} className="text-blue" /> LIVE RAILWAY MAP — NORTHERN ZONE</div>
                            <div className="db-legend">
                                <span><span className="dot green"></span>On Time</span>
                                <span><span className="dot red"></span>Delayed</span>
                                <span><span className="dot yellow"></span>Risk</span>
                            </div>
                        </div>
                        <div className="db-map-viz" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <style>{`
                                @keyframes markerPulse {
                                    0% { transform: scale(0.8); opacity: 0.5; }
                                    50% { transform: scale(1.3); opacity: 1; }
                                    100% { transform: scale(0.8); opacity: 0.5; }
                                }
                                .leaflet-container {
                                    background: var(--bg-dark) !important;
                                }
                                .leaflet-bar {
                                    border: 1px solid var(--border) !important;
                                }
                                .leaflet-bar a {
                                    background: var(--bg-panel) !important;
                                    color: var(--text-main) !important;
                                    border-bottom: 1px solid var(--border) !important;
                                }
                                .leaflet-bar a:hover {
                                    background: var(--bg-panel-hover) !important;
                                }
                                .leaflet-popup-content-wrapper {
                                    background: var(--bg-card) !important;
                                    border: 1px solid var(--border) !important;
                                    border-radius: 6px;
                                    color: var(--text-main) !important;
                                }
                                .leaflet-popup-tip {
                                    background: var(--bg-card) !important;
                                    border: 1px solid var(--border) !important;
                                }
                            `}</style>
                            <div id="db-map-container" style={{ width: '100%', flex: 1, minHeight: '340px', borderRadius: '8px', zIndex: 1 }}></div>
                        </div>

                    </div>

                    <div className="card db-trains-card">
                        <div className="section-header"><div className="header-title"><Train size={14} className="text-blue" /> LIVE TRAIN FEED ({trains.length})</div></div>
                        <div className="db-train-list">
                            {trains.map(t => (
                                <div className="db-train-row" key={t.id}>
                                    <div className="db-train-id">{t.id}</div>
                                    <div className="db-train-info">
                                        <div className="db-train-name">{t.name}</div>
                                        <div className="db-train-route">{t.from} → {t.to}</div>
                                    </div>
                                    <div className="db-train-right">
                                        <div className="db-train-eta"><Clock size={11} /> {t.eta}</div>
                                        <span className={`status-pill-sm ${t.status}`}>{t.delay || 'ON TIME'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Platform Utilisation Chart + Bottom KPIs */}
                <div className="db-bottom-row">
                    <div className="card db-bottom-kpi">
                        <div className="db-kpi-header"><span>Active Trains</span><Train size={16} className="text-blue" /></div>
                        <div className="db-bottom-val">{trains.length + 260} <span className="positive-trend"><ArrowUpRight size={14} />5.2%</span></div>
                    </div>
                    <div className="card db-bottom-kpi">
                        <div className="db-kpi-header"><span>Platform Utilisation (PF 1–10)</span><LayoutGrid size={16} className="text-blue" /></div>
                        <BarChart data={platUtil} colors={platColors} />
                    </div>
                    <div className="card db-bottom-kpi">
                        <div className="db-kpi-header"><span>Network Health</span><Activity size={16} className="text-green" /></div>
                        <div className="db-bottom-val text-green">98.4% <span className="db-bottom-sub">Operational</span></div>
                    </div>
                </div>
            </main>

            {/* Dashboard Sidebar */}
            <aside className="universal-right-sidebar">
                <div className="dashboard-sidebar-content">
                    {/* GenAI Insight panel */}
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header blue-glow">
                            <Cpu size={16} /><h2>RAILSYNC AI INSIGHTS</h2>
                            <div className="tool-indicator blue"></div>
                        </div>
                        <div className="tool-content">
                            {insights.map((item, i) => (
                                <div
                                    key={i}
                                    className={`tool-minor-item ${selectedInsight === i ? 'tool-action-box highlight' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelectedInsight(i)}
                                >
                                    <div className="tool-sub-title">{item.type}</div>
                                    <p className="text-muted-light" style={{ fontSize: '11px', lineHeight: '1.5' }}>{item.desc}</p>
                                    {selectedInsight === i && item.action && (
                                        <button className="tool-action-btn primary" onClick={() => executeAction(item)} disabled={executing}>
                                            {executing ? 'EXECUTING...' : 'EXECUTE ACTION'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Alerts */}
                    <div className="card sidebar-tool-card">
                        <div className="sidebar-tool-header red-glow">
                            <AlertTriangle size={16} className="text-red" /><h2>LIVE ALERT FEED</h2>
                        </div>
                        <div className="tool-content" style={{ padding: 0 }}>
                            {alerts.map((a, i) => (
                                <div className={`feed-entry ${a.severity}`} key={i}>
                                    <span className="entry-time">{a.time}</span>
                                    <div className={`entry-title ${a.severity === 'high' ? 'text-red' : a.severity === 'med' ? 'text-yellow' : 'text-blue'}`}>{a.title}</div>
                                    <p className="entry-body">{a.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
