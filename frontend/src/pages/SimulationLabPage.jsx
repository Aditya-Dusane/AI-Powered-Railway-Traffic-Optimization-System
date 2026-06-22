import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Zap, AlertTriangle, CheckCircle, Clock, TrendingDown, Activity, Wrench, CloudLightning, TrafficCone, Users, Ban } from 'lucide-react';

const scenarios = [
    { id: 'breakdown', label: 'Train Breakdown', icon: Wrench, desc: 'Locomotive failure causing service halt.' },
    { id: 'weather', label: 'Weather Delay', icon: CloudLightning, desc: 'High wind advisory in Rajasthan sector.' },
    { id: 'signal', label: 'Signal Failure', icon: TrafficCone, desc: 'Junction East-2 signal system offline.' },
    { id: 'platform', label: 'Platform Congestion', icon: Users, desc: 'PF-02 overcrowded — delayed clearance.' },
    { id: 'blockage', label: 'Track Blockage', icon: Ban, desc: 'Obstruction at Sector D-14 near Palwal.' },
];

const trainsList = ['12002 Bhopal Shatabdi', '12301 Howrah Rajdhani', '12423 Dibrugarh Rajdhani', '22415 Vande Bharat', '12221 Pune Duronto'];
const stationsList = ['New Delhi (NDLS)', 'Hazrat Nizamuddin', 'Agra Cantt (AGC)', 'Mathura Jn (MTJ)', 'Palwal (PWL)'];

const aiStrategies = [
    { label: 'Reroute via Loop Line', delayReduction: '22 min', confidence: 94, passengers: 'Low Impact' },
    { label: 'Priority Overtake at Agra Cantt', delayReduction: '14 min', confidence: 81, passengers: 'Medium Impact' },
    { label: 'Hold at Mathura for Gap Creation', delayReduction: '9 min', confidence: 76, passengers: 'High Impact' },
];

const networkNodes = [
    { id: 'NDLS', label: 'NDLS', x: 300, y: 170, major: true },
    { id: 'HWH', label: 'HWH', x: 60, y: 170 },
    { id: 'LKO', label: 'LKO', x: 180, y: 80 },
    { id: 'AGC', label: 'AGC', x: 180, y: 250 },
    { id: 'JP', label: 'JP', x: 420, y: 80 },
    { id: 'BPL', label: 'BPL', x: 300, y: 310 },
    { id: 'PWL', label: 'PWL', x: 220, y: 210 },
];

const networkEdges = [
    { from: 'HWH', to: 'NDLS' }, { from: 'LKO', to: 'NDLS' },
    { from: 'AGC', to: 'NDLS' }, { from: 'JP', to: 'NDLS' },
    { from: 'BPL', to: 'NDLS' }, { from: 'AGC', to: 'BPL' },
    { from: 'PWL', to: 'NDLS' },
];

const getNodePos = (id) => networkNodes.find(n => n.id === id) || { x: 0, y: 0 };

export default function SimulationLabPage({ theme }) {
    const [selectedScenario, setSelectedScenario] = useState('breakdown');
    const [affectedTrain, setAffectedTrain] = useState(trainsList[0]);
    const [affectedStation, setAffectedStation] = useState(stationsList[3]);
    const [delay, setDelay] = useState(25);
    const [priority, setPriority] = useState('HIGH');
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState(0);
    const [trainPos, setTrainPos] = useState({ x: 60, y: 170 });
    const [strategies, setStrategies] = useState(aiStrategies);
    const [delayPropagation, setDelayPropagation] = useState(25);
    const [trainsAffected, setTrainsAffected] = useState(4);
    const animRef = useRef(null);

    const simMapRef = useRef(null);
    const tileLayerRef = useRef(null);
    const simTrainMarkerRef = useRef(null);
    const simDisruptionCircleRef = useRef(null);

    const STATIONS = {
        NDLS: [28.643, 77.222],
        HWH: [22.583, 88.341],
        LKO: [26.831, 80.916],
        AGC: [27.158, 77.994],
        JP: [26.919, 75.788],
        BPL: [23.259, 77.412],
        PWL: [28.143, 77.327],
        MTJ: [27.492, 77.673],
        NZM: [28.585, 77.251]
    };

    const STATION_MAPPING = {
        'New Delhi (NDLS)': STATIONS.NDLS,
        'Hazrat Nizamuddin': STATIONS.NZM,
        'Agra Cantt (AGC)': STATIONS.AGC,
        'Mathura Jn (MTJ)': STATIONS.MTJ,
        'Palwal (PWL)': STATIONS.PWL
    };

    useEffect(() => {
        if (!window.L) return;
        const L = window.L;

        if (!simMapRef.current) {
            const map = L.map('sim-map-container', {
                attributionControl: false,
                zoomControl: false
            }).setView([26.0, 80.5], 5.2);

            const initialTileUrl = theme === 'light'
                ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

            tileLayerRef.current = L.tileLayer(initialTileUrl, {
                maxZoom: 18,
                minZoom: 4
            }).addTo(map);

            L.control.zoom({ position: 'bottomleft' }).addTo(map);

            const edges = [
                [STATIONS.HWH, STATIONS.NDLS],
                [STATIONS.LKO, STATIONS.NDLS],
                [STATIONS.AGC, STATIONS.NDLS],
                [STATIONS.JP, STATIONS.NDLS],
                [STATIONS.BPL, STATIONS.NDLS],
                [STATIONS.AGC, STATIONS.BPL],
                [STATIONS.PWL, STATIONS.NDLS]
            ];

            edges.forEach(route => {
                L.polyline(route, {
                    color: 'rgba(64, 90, 128, 0.4)',
                    weight: 2,
                    dashArray: '4, 4'
                }).addTo(map);
            });

            Object.keys(STATIONS).forEach(k => {
                L.circleMarker(STATIONS[k], {
                    radius: 4,
                    fillColor: '#0f172a',
                    color: '#38bdf8',
                    weight: 1.5,
                    fillOpacity: 1
                }).addTo(map).bindTooltip(k, { permanent: false, direction: 'top' });
            });

            const color = '#20c997';
            const pulseIcon = L.divIcon({
                className: 'sim-pulse-marker',
                html: `<div id="sim-train-dot" style="
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

            simTrainMarkerRef.current = L.marker(STATIONS.HWH, { icon: pulseIcon }).addTo(map);

            simMapRef.current = map;
        }

        return () => {};
    }, []);

    useEffect(() => {
        if (tileLayerRef.current) {
            const tileUrl = theme === 'light'
                ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            tileLayerRef.current.setUrl(tileUrl);
        }
        if (simMapRef.current) {
            setTimeout(() => {
                simMapRef.current.invalidateSize();
            }, 100);
        }
    }, [theme]);

    useEffect(() => {
        return () => {
            if (simMapRef.current) {
                simMapRef.current.remove();
                simMapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!simTrainMarkerRef.current) return;
        const startCoords = STATIONS.HWH;
        const endCoords = STATIONS.NDLS;
        
        const t = Math.min(1.0, Math.max(0.0, (trainPos.x - 60) / 240));
        
        const lat = startCoords[0] + t * (endCoords[0] - startCoords[0]);
        const lng = startCoords[1] + t * (endCoords[1] - startCoords[1]);
        
        simTrainMarkerRef.current.setLatLng([lat, lng]);
        
        const color = running ? '#fcc419' : done ? '#ff6b6b' : '#20c997';
        const trainDotEl = document.getElementById('sim-train-dot');
        if (trainDotEl) {
            trainDotEl.style.backgroundColor = color;
            trainDotEl.style.boxShadow = `0 0 10px ${color}`;
        }
    }, [trainPos, running, done]);

    useEffect(() => {
        if (!simMapRef.current) return;
        const map = simMapRef.current;
        
        if (simDisruptionCircleRef.current) {
            map.removeLayer(simDisruptionCircleRef.current);
            simDisruptionCircleRef.current = null;
        }
        
        if (done) {
            const stationCoords = STATION_MAPPING[affectedStation] || STATIONS.PWL;
            simDisruptionCircleRef.current = window.L.circleMarker(stationCoords, {
                radius: 18,
                fillColor: '#ff6b6b',
                color: '#ff6b6b',
                weight: 1.5,
                fillOpacity: 0.15
            }).addTo(map);

            map.panTo(stationCoords);
        }
    }, [done, affectedStation]);


    const runSimulation = () => {
        setRunning(true);
        setDone(false);
        
        let apiData = null;
        fetch('/api/simulation/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                scenario: selectedScenario,
                train: affectedTrain,
                station: affectedStation,
                delay,
                priority
            })
        })
        .then(res => res.json())
        .then(data => {
            apiData = data;
        })
        .catch(err => {
            console.error("Simulation API failed:", err);
            apiData = {
                delay_propagation_min: delay + 10,
                trains_affected: 3,
                strategies: aiStrategies
            };
        });

        let progress = 0;
        const startX = 60, startY = 170, endX = 300, endY = 170;
        
        const step = () => {
            progress += 1.5;
            if (progress >= 100) {
                if (apiData) {
                    setTrainPos({ x: endX, y: endY });
                    setRunning(false);
                    setDone(true);
                    if (apiData.strategies) {
                        setStrategies(apiData.strategies);
                    }
                    if (apiData.delay_propagation_min) {
                        setDelayPropagation(apiData.delay_propagation_min);
                    }
                    if (apiData.trains_affected) {
                        setTrainsAffected(apiData.trains_affected);
                    }
                } else {
                    setTimeout(step, 50);
                }
                return;
            }
            const t = progress / 100;
            setTrainPos({ x: startX + (endX - startX) * t, y: startY + (endY - startY) * t });
            animRef.current = requestAnimationFrame(step);
        };
        
        animRef.current = requestAnimationFrame(step);
    };

    const reset = () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        setRunning(false);
        setDone(false);
        setTrainPos({ x: 60, y: 170 });
        setStrategies(aiStrategies);
    };

    const disruptionNode = networkNodes.find(n => n.label === affectedStation.split(' ')[0] || n.id === 'PWL');

    return (
        <div className="view-wrapper">
            <main className="page-content" style={{ overflow: 'hidden' }}>
                <div className="sim-layout">

                    {/* Scenario Builder */}
                    <div className="sim-builder-col">
                        <div className="card sim-section">
                            <div className="section-header"><div className="header-title"><Zap size={14} className="text-blue" /> SCENARIO BUILDER</div></div>
                            <div className="sim-body">
                                <div className="sim-scenarios-grid">
                                    {scenarios.map(s => {
                                        const IconComponent = s.icon;
                                        return (
                                            <div
                                                key={s.id}
                                                className={`sim-scenario-card ${selectedScenario === s.id ? 'active' : ''}`}
                                                onClick={() => setSelectedScenario(s.id)}
                                            >
                                                <span className="sim-scenario-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <IconComponent size={16} />
                                                </span>
                                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                    <div className="sim-scenario-label">{s.label}</div>
                                                    <div className="sim-scenario-desc">{s.desc}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="sim-inputs">
                                    <div className="sim-input-group">
                                        <label className="sim-input-label">AFFECTED TRAIN</label>
                                        <select className="comms-lang-select" value={affectedTrain} onChange={e => setAffectedTrain(e.target.value)}>
                                            {trainsList.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="sim-input-group">
                                        <label className="sim-input-label">AFFECTED STATION</label>
                                        <select className="comms-lang-select" value={affectedStation} onChange={e => setAffectedStation(e.target.value)}>
                                            {stationsList.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="sim-input-group">
                                        <label className="sim-input-label">DELAY DURATION — <span className="text-yellow">{delay} min</span></label>
                                        <input type="range" className="range-slider" min="5" max="120" step="5" value={delay} onChange={e => setDelay(+e.target.value)} />
                                    </div>
                                    <div className="sim-input-group">
                                        <label className="sim-input-label">PRIORITY LEVEL</label>
                                        <div className="sim-priority-row">
                                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                                                <button key={p} className={`sim-priority-btn ${priority === p ? 'active' : ''} ${p.toLowerCase()}`} onClick={() => setPriority(p)}>{p}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="sim-control-btns">
                                    <button className="sim-run-btn" onClick={runSimulation} disabled={running}>
                                        <Play size={14} /> {running ? 'SIMULATING…' : 'RUN SIMULATION'}
                                    </button>
                                    <button className="sim-reset-btn" onClick={reset}>
                                        <RotateCcw size={14} /> RESET
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Network Visualization */}
                    <div className="sim-center-col">
                        <div className="card sim-network-card">
                            <div className="section-header space-between">
                                <div className="header-title"><Activity size={14} className="text-blue" /> RAILWAY NETWORK SIMULATION — NORTHERN ZONE</div>
                                <div className="sim-status-pill">
                                    <div className={`mon-dot ${running ? 'yellow' : done ? 'green' : 'green'}`}></div>
                                    {running ? 'SIMULATING' : done ? 'COMPLETE' : 'STANDBY'}
                                </div>
                            </div>
                            <div className="sim-map-wrapper" style={{ padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <style>{`
                                    .leaflet-container {
                                        background: var(--bg-dark) !important;
                                    }
                                `}</style>
                                <div id="sim-map-container" style={{ width: '100%', flex: 1, minHeight: '300px', borderRadius: '8px', zIndex: 1 }}></div>
                                <div className="sim-map-legend" style={{ zIndex: 2, position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(15,23,42,0.85)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span><span className="dot green"></span>Normal</span>
                                    <span><span className="dot yellow"></span>Risk</span>
                                    <span><span className="dot red"></span>Disruption</span>
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        {done && (
                            <div className="card sim-results-card">
                                <div className="section-header"><div className="header-title"><CheckCircle size={14} className="text-green" /> SIMULATION RESULTS</div></div>
                                <div className="sim-results-grid">
                                    <div className="sim-result-item">
                                        <span className="sim-result-label">Delay Propagation</span>
                                        <div className="sim-result-bar-wrap">
                                            <div className="sim-result-bar red" style={{ width: '65%' }}></div>
                                        </div>
                                        <span className="sim-result-val text-red">+{delayPropagation} min cascade</span>
                                    </div>
                                    <div className="sim-result-item">
                                        <span className="sim-result-label">AI Recovery Effectiveness</span>
                                        <div className="sim-result-bar-wrap">
                                            <div className="sim-result-bar green" style={{ width: `${strategies[selectedStrategy]?.confidence || 80}%` }}></div>
                                        </div>
                                        <span className="sim-result-val text-green">{strategies[selectedStrategy]?.confidence || 80}%</span>
                                    </div>
                                    <div className="sim-result-item">
                                        <span className="sim-result-label">Trains Affected</span>
                                        <div className="sim-result-bar-wrap">
                                            <div className="sim-result-bar yellow" style={{ width: '40%' }}></div>
                                        </div>
                                        <span className="sim-result-val text-yellow">{trainsAffected} trains impacted</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Recovery Panel */}
                    <div className="sim-ai-col">
                        <div className="card sim-ai-card">
                            <div className="section-header"><div className="header-title"><Zap size={14} className="text-blue" /> AI RECOVERY STRATEGIES</div></div>
                            <div className="sim-body">
                                {strategies.map((s, i) => (
                                    <div
                                        key={i}
                                        className={`sim-strategy-card ${selectedStrategy === i ? 'active' : ''}`}
                                        onClick={() => setSelectedStrategy(i)}
                                    >
                                        <div className="sim-strategy-header">
                                            <span className="sim-strategy-label">{s.label}</span>
                                            <span className="sim-conf">{s.confidence}%</span>
                                        </div>
                                        <div className="sim-strategy-metrics">
                                            <div className="sim-metric-item">
                                                <TrendingDown size={11} className="text-green" />
                                                <span className="text-green">−{s.delayReduction}</span>
                                            </div>
                                            <div className="sim-metric-item">
                                                <span className={`sim-impact-badge ${s.passengers?.includes('Low') ? 'green' : s.passengers?.includes('Medium') ? 'yellow' : 'red'}`}>
                                                    {s.passengers}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="sim-ai-footer">
                                    <button className="comms-broadcast-btn" style={{ marginTop: '0' }} onClick={() => {
                                        if (strategies[selectedStrategy]) {
                                            alert(`Applied Plan: ${strategies[selectedStrategy].label} via dynamic dispatching.`);
                                        }
                                    }}>
                                        <CheckCircle size={14} /> APPLY AI PLAN
                                    </button>
                                    <button className="sched-action-btn gray-outline" style={{ marginTop: '8px' }}>
                                        Compare All Strategies
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card sim-ai-card" style={{ marginTop: '16px' }}>
                            <div className="section-header"><div className="header-title"><Clock size={14} className="text-blue" /> PREDICTED RECOVERY</div></div>
                            <div className="sim-body">
                                <div className="sim-recovery-stats">
                                    <div className="sim-recovery-item">
                                        <span className="sim-result-label">Recovery Time</span>
                                        <span className="sim-recovery-val">~{Math.max(5, delay - parseInt(strategies[selectedStrategy]?.delayReduction || '0'))} min</span>
                                    </div>
                                    <div className="sim-recovery-item">
                                        <span className="sim-result-label">Delay Reduction</span>
                                        <span className="sim-recovery-val text-green">−{strategies[selectedStrategy]?.delayReduction || '0 min'}</span>
                                    </div>
                                    <div className="sim-recovery-item">
                                        <span className="sim-result-label">Passenger Impact</span>
                                        <span className="sim-recovery-val">{strategies[selectedStrategy]?.passengers || 'Low Impact'}</span>
                                    </div>
                                    <div className="sim-recovery-item">
                                        <span className="sim-result-label">Confidence</span>
                                        <span className="sim-recovery-val text-blue">{strategies[selectedStrategy]?.confidence || 80}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
