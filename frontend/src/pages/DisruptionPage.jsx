import React, { useState, useEffect, useRef } from 'react';
import {
    Settings, Wind, ShieldAlert, Zap, Activity, AlertTriangle, BarChart3, RefreshCw, ArrowRight, CheckCircle
} from 'lucide-react';

const ScenarioCard = ({ type, title, desc, icon: Icon, active, onClick }) => (
    <div className={`scenario-card card ${active ? 'active' : ''}`} onClick={onClick}>
        <div className={`scenario-icon ${type}`}>
            <Icon size={20} />
        </div>
        <div className="scenario-info">
            <h4>{title}</h4>
            <p>{desc}</p>
        </div>
        <div className={`active-indicator ${active ? 'visible' : ''}`}>
            <div className="dot"></div>
            <span>ACTIVE</span>
        </div>
    </div>
);

const RecoveryPlan = ({ title, reduction, time, selected, onSelect }) => (
    <div className={`recovery-plan-box card ${selected ? 'selected' : ''}`} onClick={onSelect}>
        <div className="plan-header">
            <span className="plan-title">{title}</span>
            {selected && <CheckCircle size={16} className="text-blue" />}
        </div>
        <div className="plan-metrics">
            <div className="plan-metric">
                <span className="label">DELAY REDUCTION</span>
                <span className="value text-green">-{reduction}%</span>
            </div>
            <div className="plan-metric">
                <span className="label">REC. TIME</span>
                <span className="value">{time}m</span>
            </div>
        </div>
    </div>
);

export default function DisruptionPage({ isSimulating, selectedPlan, setSelectedPlan, theme }) {
    const [activeScenario, setActiveScenario] = useState('breakdown');
    const [plans, setPlans] = useState([
        { id: 'aggressive', title: 'Aggressive Reroute', reduction: 65, time: 15 },
        { id: 'balanced', title: 'Balanced Allocation', reduction: 42, time: 25 }
    ]);
    const [impactedTrains, setImpactedTrains] = useState(12);
    const [totalDelay, setTotalDelay] = useState(145);
    const [loading, setLoading] = useState(false);

    const mapRef = useRef(null);
    const tileLayerRef = useRef(null);
    const markerRef = useRef(null);
    const tracksRef = useRef([]);

    useEffect(() => {
        if (!window.L) return;
        const L = window.L;

        const STATIONS = {
            NDLS: [28.643, 77.222],
            NZM: [28.585, 77.251],
            PWL: [28.143, 77.327],
            MTJ: [27.492, 77.673],
            AGC: [27.158, 77.994],
            GWL: [26.218, 78.178]
        };

        if (!mapRef.current) {
            const map = L.map('disruption-map-container', {
                attributionControl: false,
                zoomControl: false
            }).setView([27.6, 77.7], 7.0);

            const initialTileUrl = theme === 'light'
                ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

            tileLayerRef.current = L.tileLayer(initialTileUrl, {
                maxZoom: 18,
                minZoom: 4
            }).addTo(map);

            L.control.zoom({ position: 'bottomleft' }).addTo(map);

            L.polyline([STATIONS.NDLS, STATIONS.NZM, STATIONS.PWL, STATIONS.MTJ, STATIONS.GWL], {
                color: 'rgba(64, 90, 128, 0.4)',
                weight: 2,
                dashArray: '4, 4'
            }).addTo(map);

            Object.keys(STATIONS).forEach(k => {
                L.circleMarker(STATIONS[k], {
                    radius: 4,
                    fillColor: '#0f172a',
                    color: '#38bdf8',
                    weight: 1.5,
                    fillOpacity: 1
                }).addTo(map).bindTooltip(k, { permanent: false, direction: 'top' });
            });

            mapRef.current = map;
        }

        const map = mapRef.current;

        if (markerRef.current) {
            map.removeLayer(markerRef.current);
            markerRef.current = null;
        }

        tracksRef.current.forEach(layer => map.removeLayer(layer));
        tracksRef.current = [];

        let alertCoords = STATIONS.PWL;
        let scenarioName = "Sector B-4 Train Breakdown";
        
        if (activeScenario === 'weather') {
            alertCoords = STATIONS.NDLS;
            scenarioName = "NCR Smog Region";
        } else if (activeScenario === 'blockage') {
            alertCoords = STATIONS.GWL;
            scenarioName = "Gwalior Tunnel Blockage";
        } else if (activeScenario === 'signal') {
            alertCoords = STATIONS.NZM;
            scenarioName = "NZM Junction Signal Malfunction";
        }

        const alertIcon = L.divIcon({
            className: 'disruption-alert-marker',
            html: `<div style="
                background-color: #ff6b6b;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 14px #ff6b6b;
                animation: markerPulse 1.2s infinite;
            "></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        markerRef.current = L.marker(alertCoords, { icon: alertIcon })
            .addTo(map)
            .bindPopup(`<strong style="color: #ff6b6b; font-size: 11px;">DISRUPTION: ${scenarioName}</strong>`, { closeButton: false })
            .openPopup();

        if (activeScenario === 'breakdown') {
            const blockedSegment = L.polyline([STATIONS.NZM, STATIONS.PWL], {
                color: '#ff6b6b',
                weight: 3.5,
                opacity: 0.85
            }).addTo(map);
            tracksRef.current.push(blockedSegment);

            const reroutePath = L.polyline([STATIONS.NZM, [28.4, 77.8], [27.9, 77.8], STATIONS.MTJ], {
                color: '#20c997',
                weight: 3.5,
                dashArray: '6, 4',
                opacity: 0.95
            }).addTo(map).bindTooltip("AI Recommended Reroute", { permanent: false });
            tracksRef.current.push(reroutePath);
        } else if (activeScenario === 'blockage') {
            const blockedSegment = L.polyline([STATIONS.MTJ, STATIONS.GWL], {
                color: '#ff6b6b',
                weight: 3.5,
                opacity: 0.85
            }).addTo(map);
            tracksRef.current.push(blockedSegment);

            const reroutePath = L.polyline([STATIONS.MTJ, [27.0, 77.2], [26.3, 77.4], STATIONS.GWL], {
                color: '#20c997',
                weight: 3.5,
                dashArray: '6, 4',
                opacity: 0.95
            }).addTo(map);
            tracksRef.current.push(reroutePath);
        }

        map.panTo(alertCoords);
    }, [activeScenario]);

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

    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);


    const scenarios = [
        { id: 'breakdown', title: 'Train Breakdown', desc: 'Engine failure on Sector B-4', icon: Settings, type: 'red' },
        { id: 'weather', title: 'Weather Delay', desc: 'Heavy snow affecting visibility', icon: Wind, type: 'blue' },
        { id: 'blockage', title: 'Track Blockage', desc: 'Obstruction detected in Tunnel 4', icon: ShieldAlert, type: 'orange' },
        { id: 'signal', title: 'Signal Failure', desc: 'Main switching unit malfunction', icon: Zap, type: 'purple' },
    ];

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/disruption/plans?scenario=${activeScenario}`);
                const data = await res.json();
                if (data.plans) {
                    setPlans(data.plans);
                    setImpactedTrains(data.impacted_trains);
                    setTotalDelay(data.est_total_delay_min);
                    if (data.plans.length > 0 && !data.plans.some(p => p.id === selectedPlan)) {
                        setSelectedPlan(data.plans[0].id);
                    }
                }
            } catch (err) {
                console.error("Error fetching disruption plans:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, [activeScenario]);

    const handleApprove = async () => {
        const currentPlanObj = plans.find(p => p.id === selectedPlan);
        if (!currentPlanObj) return;
        try {
            const res = await fetch('/api/disruption/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: activeScenario, plan_title: currentPlanObj.title })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Approved Plan: ${currentPlanObj.title} for ${activeScenario.toUpperCase()} disruption.`);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            console.error("Error approving recovery plan:", err);
        }
    };

    return (
        <div className="view-wrapper">
            {/* Main scrollable content area */}
            <main className="page-content" style={{ overflow: 'hidden' }}>
                <div className="disruption-grid">
                    {/* Scenarios Selection */}
                    <div className="disruption-left-panel">
                        <div className="section-title">ACTIVE SCENARIO SELECTION</div>
                        <div className="scenarios-list">
                            {scenarios.map(s => (
                                <ScenarioCard
                                    key={s.id}
                                    {...s}
                                    active={activeScenario === s.id}
                                    onClick={() => setActiveScenario(s.id)}
                                />
                            ))}
                        </div>

                        <div className="disruption-stats card">
                            <div className="stat-row">
                                <span className="label">IMPACTED TRAINS</span>
                                <span className="value text-red">{impactedTrains}</span>
                            </div>
                            <div className="stat-row">
                                <span className="label">EST. TOTAL DELAY</span>
                                <span className="value text-orange">+{totalDelay}m</span>
                            </div>
                        </div>
                    </div>

                    {/* Network Simulation */}
                    <div className="disruption-main-view">
                        <div className="card network-card">
                            <div className="section-header">
                                <div className="header-title">
                                    <Activity size={16} className="text-blue" />
                                    RAILWAY NETWORK SIMULATION VIEW
                                </div>
                            </div>

                            <div className="simulation-canvas" style={{ padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <style>{`
                                    .leaflet-container {
                                        background: var(--bg-dark) !important;
                                    }
                                `}</style>
                                <div id="disruption-map-container" style={{ width: '100%', flex: 1, minHeight: '340px', borderRadius: '8px', zIndex: 1 }}></div>
                            </div>

                            <div className="simulation-ticker">
                                <div className="ticker-item">AUTO-REROUTE ICE-522 via Sector D-1</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Non-scrollable Disruption Sidebar */}
            <aside className="universal-right-sidebar">
                <div className="disruption-right-panel card">
                    <div className="sidebar-header-title">
                        <BarChart3 size={18} className="text-blue" />
                        AI RECOVERY STRATEGIES
                    </div>
                    <div className="plans-list">
                        {loading ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading AI strategies...</div> :
                         plans.map(p => (
                            <RecoveryPlan
                                key={p.id}
                                title={p.title}
                                reduction={p.reduction}
                                time={p.time}
                                selected={selectedPlan === p.id}
                                onSelect={() => setSelectedPlan(p.id)}
                            />
                        ))}
                    </div>
                    <div className="spacer"></div>
                    <div className="action-footer">
                        <button className="action-btn-large blue-fill" onClick={handleApprove}>
                            APPROVE RECOVERY PLAN <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
