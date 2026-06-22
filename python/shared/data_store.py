"""
SQLite shared data store for RailSync AI.
Provides baseline data that Python agents read from and write to.
"""

import os
import sys
import sqlite3
import random
import time
from datetime import datetime, timedelta
import hashlib

# Database file located in the root workspace directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "railsync.db")

# Global variables (populated dynamically by load_state)
TRAINS = []
PLATFORMS = []
AUDIT_LOGS = []
HITL_PENDING = []
CONTAINERS = []
_next_event_id = 4822

# ── Baseline Seeding Data ───────────────────────────────────────────────────

TRAINS_INIT = [
    {"id": "12423", "name": "Dibrugarh Rajdhani", "from": "NDLS", "to": "DBRG", "time": "10:05", "status": "on-time", "delay": 0, "platform": "PF-01"},
    {"id": "12002", "name": "Bhopal Shatabdi",    "from": "NDLS", "to": "RKMP", "time": "10:15", "status": "delayed", "delay": 22, "platform": "PF-02"},
    {"id": "12221", "name": "Pune Duronto",        "from": "HWH",  "to": "PUNE", "time": "10:28", "status": "risk",    "delay": 5,  "platform": "PF-02"},
    {"id": "12381", "name": "Kolkata Rajdhani",    "from": "HWH",  "to": "NDLS", "time": "11:10", "status": "on-time", "delay": 0,  "platform": "PF-03"},
    {"id": "12301", "name": "Howrah Rajdhani",     "from": "HWH",  "to": "NDLS", "time": "11:20", "status": "on-time", "delay": 0,  "platform": "PF-04"},
    {"id": "22415", "name": "Vande Bharat Exp",    "from": "NDLS", "to": "BSB",  "time": "12:00", "status": "on-time", "delay": 0,  "platform": "PF-04"},
    {"id": "12621", "name": "Tamil Nadu Express",  "from": "NDLS", "to": "MAS",  "time": "12:30", "status": "delayed", "delay": 18, "platform": "PF-05"},
    {"id": "12953", "name": "Mumbai Rajdhani",     "from": "NDLS", "to": "MMCT", "time": "13:00", "status": "on-time", "delay": 0,  "platform": "PF-05"},
    {"id": "12311", "name": "Kalka Mail",          "from": "HWH",  "to": "CDG",  "time": "13:25", "status": "on-time", "delay": 0,  "platform": "PF-03"},
    {"id": "12461", "name": "Mandore Express",     "from": "JU",   "to": "NDLS", "time": "14:35", "status": "delayed", "delay": 31, "platform": "PF-06"},
    {"id": "12555", "name": "Gorakhdham Express", "from": "GKP",  "to": "NDLS", "time": "13:50", "status": "risk",    "delay": 9,  "platform": "PF-07"},
    {"id": "14673", "name": "Shaheed Express",     "from": "SVDK", "to": "HWH",  "time": "14:10", "status": "on-time", "delay": 0,  "platform": "PF-08"},
]

PLATFORMS_INIT = [
    {"num": "01", "status": "occupied", "train": "12301 Howrah Rajdhani", "arrival": "14:20", "departure": "14:50", "crowd": 72},
    {"num": "02", "status": "occupied", "train": "12002 Bhopal Shatabdi", "arrival": "14:05", "departure": "15:15", "crowd": 91},
    {"num": "03", "status": "free",     "nextExp": "15:30", "crowd": 12},
    {"num": "04", "status": "reserved", "train": "22415 Vande Bharat Exp", "eta": "5M", "crowd": 35},
    {"num": "05", "status": "free",     "note": "CLEANING", "nextExp": "15:45", "crowd": 5},
    {"num": "06", "status": "occupied", "train": "12461 Mandore Express", "departure": "DEPARTING IN 2M", "crowd": 88},
    {"num": "07", "status": "free",     "nextExp": "16:00", "crowd": 8},
    {"num": "08", "status": "free",     "nextExp": "16:15", "crowd": 3},
    {"num": "09", "status": "reserved", "train": "12423 Dibrugarh Rajdhani", "eta": "12M", "crowd": 28},
    {"num": "10", "status": "occupied", "train": "12621 Tamil Nadu Express", "arrival": "14:15", "departure": "16:00", "crowd": 65},
]

HITL_PENDING_INIT = [
    {"id": "HIL-0431", "type": "REROUTE",   "priority": "CRITICAL", "train": "12002 Bhopal Shatabdi",   "action": "Reroute to PF-06 NDLS — avoids 22-min conflict with Duronto.",                     "confidence": 94, "passengers": 840,  "delay": "-22 min"},
    {"id": "HIL-0430", "type": "SCHEDULE",  "priority": "HIGH",     "train": "12221 Pune Duronto",       "action": "Delay departure by 8 min to create buffer at NDLS yard.",                           "confidence": 87, "passengers": 520,  "delay": "-8 min"},
    {"id": "HIL-0429", "type": "PLATFORM",  "priority": "HIGH",     "train": "22415 Vande Bharat Exp",   "action": "Reassign platform PF-02 to PF-04 for better passenger access.",                    "confidence": 91, "passengers": 640,  "delay": "0 min"},
    {"id": "HIL-0428", "type": "SPEED",     "priority": "MEDIUM",   "train": "12301 Howrah Rajdhani",    "action": "Maintain 95 km/h through Mathura-Agra sector (wave effect buffer).",                "confidence": 79, "passengers": 720,  "delay": "-5 min"},
    {"id": "HIL-0427", "type": "COMMS",     "priority": "MEDIUM",   "train": "12461 Mandore Express",    "action": "Broadcast 30-min delay in Hindi + Rajasthani to PF-08 screens.",                   "confidence": 100, "passengers": 380, "delay": "0 min"},
    {"id": "HIL-0426", "type": "REROUTE",   "priority": "HIGH",     "train": "12953 Mumbai Rajdhani",    "action": "Loop via Mathura Jn to bypass congested Agra Cantt throat.",                        "confidence": 83, "passengers": 890,  "delay": "-14 min"},
    {"id": "HIL-0425", "type": "SCHEDULE",  "priority": "LOW",      "train": "12555 Gorakhdham Express", "action": "Advance departure by 5 min from NDLS to avoid peak PF congestion.",                 "confidence": 76, "passengers": 430,  "delay": "+5 min"},
    {"id": "HIL-0424", "type": "ENERGY",    "priority": "LOW",      "train": "—",                        "action": "Idle PF-12 lighting at Nizamuddin during 20-min service gap.",                      "confidence": 100, "passengers": 0,   "delay": "0 min"},
    {"id": "HIL-0423", "type": "PLATFORM",  "priority": "MEDIUM",   "train": "12381 Kolkata Rajdhani",   "action": "Combine PF-03 and PF-03A coaches to reduce dwell time.",                           "confidence": 82, "passengers": 610,  "delay": "-6 min"},
    {"id": "HIL-0422", "type": "SPEED",     "priority": "CRITICAL", "train": "12621 Tamil Nadu Express", "action": "Emergency speed advisory: reduce to 80 km/h at Junction East-2.",                   "confidence": 99, "passengers": 760,  "delay": "Prevent"},
]

CONTAINERS_INIT = [
    {"name": "platform-optimizer",    "status": "healthy", "cpu": 38, "mem": 52, "uptime": "14d 6h",  "restarts": 0},
    {"name": "ai-scheduler",          "status": "healthy", "cpu": 61, "mem": 68, "uptime": "14d 6h",  "restarts": 0},
    {"name": "disruption-engine",     "status": "warning", "cpu": 78, "mem": 82, "uptime": "3d 14h",  "restarts": 2},
    {"name": "passenger-comms-agent", "status": "healthy", "cpu": 22, "mem": 39, "uptime": "14d 6h",  "restarts": 0},
    {"name": "hitl-approval-svc",     "status": "healthy", "cpu": 18, "mem": 31, "uptime": "14d 6h",  "restarts": 0},
    {"name": "audit-ledger",          "status": "healthy", "cpu": 9,  "mem": 24, "uptime": "14d 6h",  "restarts": 0},
    {"name": "kafka-broker-01",       "status": "healthy", "cpu": 44, "mem": 61, "uptime": "14d 6h",  "restarts": 0},
    {"name": "kafka-broker-02",       "status": "healthy", "cpu": 41, "mem": 59, "uptime": "14d 6h",  "restarts": 0},
    {"name": "model-inference-v4",    "status": "healthy", "cpu": 85, "mem": 91, "uptime": "1d 2h",   "restarts": 1},
    {"name": "data-ingest-pipeline",  "status": "error",   "cpu": 100,"mem": 97, "uptime": "0h 12m",  "restarts": 7},
    {"name": "simulation-core",       "status": "healthy", "cpu": 28, "mem": 44, "uptime": "14d 6h",  "restarts": 0},
    {"name": "geo-tracker",           "status": "healthy", "cpu": 15, "mem": 29, "uptime": "14d 6h",  "restarts": 0},
]


def seed_database(cursor):
    """Seed SQLite database with initial entries, generating over 100 entries in total."""
    # Seed Trains
    for t in TRAINS_INIT:
        cursor.execute(
            "INSERT INTO trains (id, name, from_station, to_station, time_val, status, delay, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (t["id"], t["name"], t["from"], t["to"], t["time"], t["status"], t["delay"], t["platform"])
        )
        
    # Seed Platforms
    for p in PLATFORMS_INIT:
        cursor.execute(
            "INSERT INTO platforms (num, status, train, arrival, departure, eta, nextExp, note, crowd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (p["num"], p["status"], p.get("train"), p.get("arrival"), p.get("departure"), p.get("eta"), p.get("nextExp"), p.get("note"), p.get("crowd", 0))
        )
        
    # Seed HITL Pending Decisions
    for h in HITL_PENDING_INIT:
        cursor.execute(
            "INSERT INTO hitl_pending (id, type, priority, train, action, confidence, passengers, delay) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (h["id"], h["type"], h["priority"], h["train"], h["action"], h["confidence"], h["passengers"], h["delay"])
        )
        
    # Seed Containers
    for c in CONTAINERS_INIT:
        cursor.execute(
            "INSERT INTO containers (name, status, cpu, mem, uptime, restarts) VALUES (?, ?, ?, ?, ?, ?)",
            (c["name"], c["status"], c["cpu"], c["mem"], c["uptime"], c["restarts"])
        )
        
    # Seed Audit Logs (10 Core + 70 generated to guarantee 80+ entries in audit logs alone)
    core_logs = [
        {"id": "EVT-4821", "ts": "19:42:08", "type": "AI_DECISION",      "module": "Scheduler",  "source": "AI",       "action": "Rerouted 12002 via Loop Line. ETA updated to 16:15.",                      "status": "Applied"},
        {"id": "EVT-4820", "ts": "19:40:55", "type": "OPERATOR_OVERRIDE","module": "Platform",   "source": "Operator", "action": "Manually assigned PF-03 to 12381 overriding AI suggestion of PF-06.",     "status": "Logged"},
        {"id": "EVT-4819", "ts": "19:38:12", "type": "ALERT",            "module": "Disruption", "source": "Sensor",   "action": "Track obstruction detected at Sector D-14 near Palwal. Auto-alert raised.", "status": "Active"},
        {"id": "EVT-4818", "ts": "19:35:01", "type": "AI_DECISION",      "module": "Comms",      "source": "AI",       "action": "Generated PA announcement in Hindi for Shatabdi delay at NDLS PF-02.",     "status": "Broadcast"},
        {"id": "EVT-4817", "ts": "19:32:44", "type": "SYSTEM",           "module": "Monitoring", "source": "System",   "action": "Container platform-optimizer auto-restarted after CPU threshold breach.",    "status": "Resolved"},
        {"id": "EVT-4816", "ts": "19:28:03", "type": "AI_DECISION",      "module": "Scheduler",  "source": "AI",       "action": "Speed reduction advisory issued for 12301 Rajdhani through JP-NDLS.",       "status": "Applied"},
        {"id": "EVT-4815", "ts": "19:25:18", "type": "OPERATOR_OVERRIDE","module": "Platform",   "source": "Operator", "action": "Priya Sharma rejected AI platform reassignment for 22415 Vande Bharat.",    "status": "Logged"},
        {"id": "EVT-4814", "ts": "19:20:00", "type": "SYSTEM",           "module": "Monitoring", "source": "System",   "action": "Kafka lag resolved on ai.recommendations.feed. Processed 4,520 events.",   "status": "Info"},
        {"id": "EVT-4813", "ts": "19:15:33", "type": "ALERT",            "module": "Disruption", "source": "Sensor",   "action": "Signal failure at Junction East-2, Hazrat Nizamuddin. Manual override.",   "status": "Active"},
        {"id": "EVT-4812", "ts": "19:10:11", "type": "AI_DECISION",      "module": "HITL",       "source": "AI",       "action": "Recommended 8-min delay for 12622 Tamil Nadu Exp — approved by operator.", "status": "Applied"},
    ]
    
    for log in core_logs:
        raw_hash = hashlib.sha256(f"{log['id']}-{log['ts']}-{log['action']}".encode()).hexdigest()
        log_hash = f"{raw_hash[:6]}...{raw_hash[-3:]}"
        cursor.execute(
            "INSERT INTO audit_logs (id, ts, type, module, source, action, status, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (log["id"], log["ts"], log["type"], log["module"], log["source"], log["action"], log["status"], log_hash)
        )
        
    # Generate 70 historical logs going back in time
    train_names = ["12002 Bhopal Shatabdi", "12301 Howrah Rajdhani", "12221 Pune Duronto", "22415 Vande Bharat Exp", "12621 Tamil Nadu Express", "12953 Mumbai Rajdhani"]
    operators = ["Rajesh Kumar", "Priya Sharma", "Arjun Mehta", "Sandeep Rao"]
    platforms_list = ["PF-01", "PF-02", "PF-03", "PF-04", "PF-05", "PF-06"]
    sectors = ["Sector D-14", "Sector A-2", "Sector C-9", "Sector B-12"]
    stations = ["Palwal", "Hazrat Nizamuddin", "Mathura Jn", "Agra Cantt"]
    containers_list = ["platform-optimizer", "ai-scheduler", "disruption-engine", "passenger-comms-agent", "data-ingest-pipeline", "model-inference-v4"]
    junctions = ["Junction East-2", "Junction West-1", "Junction South-4"]
    
    templates = [
        ("AI_DECISION", "Scheduler", "AI", "Rerouted train {train} via Loop Line to avoid conflict on {platform}. ETA updated.", "Applied"),
        ("OPERATOR_OVERRIDE", "Platform", "Operator", "Operator {operator} manually assigned {platform} to train {train}.", "Logged"),
        ("ALERT", "Disruption", "Sensor", "Track obstruction detected at sector {sector} near {station}. Auto-alert raised.", "Active"),
        ("AI_DECISION", "Comms", "AI", "Generated multilingual PA announcement for delay of train {train} at platform {platform}.", "Broadcast"),
        ("SYSTEM", "Monitoring", "System", "Container {container} auto-restarted after memory utilization threshold breach.", "Resolved"),
        ("AI_DECISION", "Scheduler", "AI", "Speed reduction advisory issued for train {train} through {sector}.", "Applied"),
        ("OPERATOR_OVERRIDE", "Platform", "Operator", "Operator {operator} rejected AI suggested platform swap for train {train}.", "Logged"),
        ("ALERT", "Disruption", "Sensor", "Signal failure at junction {junction} near {station}. Manual fallback active.", "Active"),
        ("AI_DECISION", "HITL", "AI", "Recommended speed buffer change for train {train} to avoid overlap.", "Applied"),
        ("SYSTEM", "Monitoring", "System", "Model validation for {container} completed. Metrics verified.", "Info"),
    ]
    
    start_time = datetime.strptime("19:05:00", "%H:%M:%S")
    for idx in range(70):
        start_time -= timedelta(minutes=random.randint(5, 25), seconds=random.randint(0, 59))
        ts_str = start_time.strftime("%H:%M:%S")
        evt_id = f"EVT-{4811 - idx}"
        
        tpl = random.choice(templates)
        event_type, module, source, action_template, status = tpl
        
        action_text = action_template.format(
            train=random.choice(train_names),
            operator=random.choice(operators),
            platform=random.choice(platforms_list),
            sector=random.choice(sectors),
            station=random.choice(stations),
            container=random.choice(containers_list),
            junction=random.choice(junctions)
        )
        
        raw_hash = hashlib.sha256(f"{evt_id}-{ts_str}-{action_text}".encode()).hexdigest()
        log_hash = f"{raw_hash[:6]}...{raw_hash[-3:]}"
        
        cursor.execute(
            "INSERT INTO audit_logs (id, ts, type, module, source, action, status, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (evt_id, ts_str, event_type, module, source, action_text, status, log_hash)
        )
        
    # Seed metadata
    cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", ("_next_event_id", "4822"))
    cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", ("last_simulation_time", "0.0"))


def simulate_realtime_activity(conn):
    """Simulates real-time activities inside SQLite by checking time since last simulation."""
    cursor = conn.cursor()
    
    cursor.execute("SELECT value FROM metadata WHERE key='last_simulation_time'")
    row = cursor.fetchone()
    current_time = time.time()
    
    if row is not None:
        last_sim_time = float(row[0])
    else:
        last_sim_time = 0.0
        
    # Run simulation updates every 8 seconds
    if current_time - last_sim_time > 8.0:
        cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_simulation_time', ?)", (str(current_time),))
        
        # 1. Fluctuating container stats
        cursor.execute("SELECT name, cpu, mem, restarts FROM containers")
        containers_rows = cursor.fetchall()
        for name, cpu, mem, restarts in containers_rows:
            if name == "data-ingest-pipeline" and restarts > 5:
                continue  # leave error state container
            new_cpu = min(99, max(5, cpu + random.randint(-8, 8)))
            new_mem = min(99, max(10, mem + random.randint(-4, 4)))
            cursor.execute("UPDATE containers SET cpu=?, mem=? WHERE name=?", (new_cpu, new_mem, name))
            
        # 2. Fluctuating platform crowd density
        cursor.execute("SELECT num, crowd FROM platforms")
        platforms_rows = cursor.fetchall()
        for num, crowd in platforms_rows:
            new_crowd = min(100, max(0, crowd + random.randint(-12, 12)))
            cursor.execute("UPDATE platforms SET crowd=? WHERE num=?", (new_crowd, num))
            
        # 3. Create a new audit log / alert (35% chance)
        if random.random() < 0.35:
            cursor.execute("SELECT value FROM metadata WHERE key='_next_event_id'")
            id_row = cursor.fetchone()
            next_id = int(id_row[0]) if id_row else 4822
            
            train_names = ["12002 Bhopal Shatabdi", "12301 Howrah Rajdhani", "12221 Pune Duronto", "22415 Vande Bharat Exp", "12621 Tamil Nadu Express", "12953 Mumbai Rajdhani"]
            operators = ["Rajesh Kumar", "Priya Sharma", "Arjun Mehta", "Sandeep Rao"]
            platforms_list = ["PF-01", "PF-02", "PF-03", "PF-04", "PF-05", "PF-06"]
            
            events = [
                ("AI_DECISION", "Scheduler", "AI", f"AI conflict check complete. Platform adjustments optimized for {random.choice(train_names)}.", "Applied"),
                ("SYSTEM", "Monitoring", "System", f"Kafka positions feed throughput: {random.randint(6, 12)}k messages/sec.", "Info"),
                ("ALERT", "Disruption", "Sensor", f"Temporary power fluctuation detected at Hazrat Nizamuddin Yard. Backup active.", "Resolved"),
                ("OPERATOR_OVERRIDE", "Platform", "Operator", f"Operator queried platform utilization trends for peak hours.", "Logged"),
                ("AI_DECISION", "Comms", "AI", f"Automatically generated PA announcement for {random.choice(train_names)} in Hindi.", "Broadcast"),
                ("ALERT", "Disruption", "Sensor", f"Signal overlap detection alarm checked near sector B-12.", "Info")
            ]
            
            event_type, module, source, action_text, status = random.choice(events)
            ts_str = datetime.now().strftime("%H:%M:%S")
            evt_id = f"EVT-{next_id}"
            
            raw_hash = hashlib.sha256(f"{evt_id}-{ts_str}-{action_text}".encode()).hexdigest()
            log_hash = f"{raw_hash[:6]}...{raw_hash[-3:]}"
            
            cursor.execute(
                "INSERT INTO audit_logs (id, ts, type, module, source, action, status, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (evt_id, ts_str, event_type, module, source, action_text, status, log_hash)
            )
            
            cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('_next_event_id', ?)", (str(next_id + 1),))
            
        # 4. Add a new HITL pending decision (20% chance)
        if random.random() < 0.20:
            cursor.execute("SELECT COUNT(*) FROM hitl_pending")
            hitl_count = cursor.fetchone()[0]
            if hitl_count < 14:
                new_id_num = random.randint(450, 999)
                new_id = f"HIL-0{new_id_num}"
                train = random.choice(["12002 Bhopal Shatabdi", "12301 Howrah Rajdhani", "12221 Pune Duronto", "12461 Mandore Express"])
                action = f"Optimize {train} arrival via alternative platform."
                cursor.execute(
                    "INSERT INTO hitl_pending (id, type, priority, train, action, confidence, passengers, delay) VALUES (?, 'PLATFORM', 'MEDIUM', ?, ?, ?, ?, '-6 min')",
                    (new_id, train, action, random.randint(80, 97), random.randint(450, 850))
                )


def add_audit_log(event_type, module, source, action, status="Applied"):
    """Add a new entry to the audit log in SQLite and update global variables."""
    global _next_event_id
    now = datetime.now().strftime("%H:%M:%S")
    evt_id = f"EVT-{_next_event_id}"
    
    # Calculate hash
    raw_hash = hashlib.sha256(f"{evt_id}-{now}-{action}".encode()).hexdigest()
    log_hash = f"{raw_hash[:6]}...{raw_hash[-3:]}"
    
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10.0)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO audit_logs (id, ts, type, module, source, action, status, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (evt_id, now, event_type, module, source, action, status, log_hash)
        )
        _next_event_id += 1
        cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('_next_event_id', ?)", (str(_next_event_id),))
        conn.commit()
        conn.close()
    except Exception as e:
        sys.stderr.write(f"Error adding audit log: {str(e)}\n")
        
    # Reload state to keep lists in sync
    load_state()
    
    return {
        "id": evt_id,
        "ts": now,
        "type": event_type,
        "module": module,
        "source": source,
        "action": action,
        "status": status,
        "hash": log_hash
    }


def get_live_metrics():
    """Returns container metrics with small random variation to simulate live data."""
    import copy
    result = copy.deepcopy(CONTAINERS)
    for c in result:
        if c["status"] != "error":
            c["cpu"] = min(99, max(1, c["cpu"] + random.randint(-5, 5)))
            c["mem"] = min(99, max(1, c["mem"] + random.randint(-3, 3)))
    return result


def save_state():
    """Serialize current lists and variables to the SQLite database."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10.0)
        cursor = conn.cursor()
        
        # Save Trains
        cursor.execute("DELETE FROM trains")
        for t in TRAINS:
            cursor.execute(
                "INSERT INTO trains (id, name, from_station, to_station, time_val, status, delay, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (t["id"], t["name"], t["from"], t["to"], t["time"], t["status"], t["delay"], t["platform"])
            )
            
        # Save Platforms
        cursor.execute("DELETE FROM platforms")
        for p in PLATFORMS:
            cursor.execute(
                "INSERT INTO platforms (num, status, train, arrival, departure, eta, nextExp, note, crowd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (p["num"], p["status"], p.get("train"), p.get("arrival"), p.get("departure"), p.get("eta"), p.get("nextExp"), p.get("note"), p.get("crowd", 0))
            )
            
        # Save Audit Logs
        cursor.execute("DELETE FROM audit_logs")
        for log in AUDIT_LOGS:
            log_hash = log.get("hash")
            if not log_hash:
                raw_hash = hashlib.sha256(f"{log['id']}-{log['ts']}-{log['action']}".encode()).hexdigest()
                log_hash = f"{raw_hash[:6]}...{raw_hash[-3:]}"
            cursor.execute(
                "INSERT INTO audit_logs (id, ts, type, module, source, action, status, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (log["id"], log["ts"], log["type"], log["module"], log["source"], log["action"], log["status"], log_hash)
            )
            
        # Save HITL Pending
        cursor.execute("DELETE FROM hitl_pending")
        for h in HITL_PENDING:
            cursor.execute(
                "INSERT INTO hitl_pending (id, type, priority, train, action, confidence, passengers, delay) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (h["id"], h["type"], h["priority"], h["train"], h["action"], h["confidence"], h["passengers"], h["delay"])
            )
            
        # Save Containers
        cursor.execute("DELETE FROM containers")
        for c in CONTAINERS:
            cursor.execute(
                "INSERT INTO containers (name, status, cpu, mem, uptime, restarts) VALUES (?, ?, ?, ?, ?, ?)",
                (c["name"], c["status"], c["cpu"], c["mem"], c["uptime"], c["restarts"])
            )
            
        # Save next event ID to metadata
        cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", ("_next_event_id", str(_next_event_id)))
        
        conn.commit()
        conn.close()
    except Exception as e:
        sys.stderr.write(f"Error saving state to SQLite: {str(e)}\n")


def load_state():
    """Load lists and variables from SQLite database."""
    global TRAINS, PLATFORMS, AUDIT_LOGS, HITL_PENDING, CONTAINERS, _next_event_id
    
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10.0)
        cursor = conn.cursor()
        
        # Check if trains table exists to determine if initialization is required
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='trains'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            # Create Schema
            cursor.execute("""
                CREATE TABLE trains (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    from_station TEXT,
                    to_station TEXT,
                    time_val TEXT,
                    status TEXT,
                    delay INTEGER,
                    platform TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE platforms (
                    num TEXT PRIMARY KEY,
                    status TEXT,
                    train TEXT,
                    arrival TEXT,
                    departure TEXT,
                    eta TEXT,
                    nextExp TEXT,
                    note TEXT,
                    crowd INTEGER
                )
            """)
            cursor.execute("""
                CREATE TABLE audit_logs (
                    id TEXT PRIMARY KEY,
                    ts TEXT,
                    type TEXT,
                    module TEXT,
                    source TEXT,
                    action TEXT,
                    status TEXT,
                    hash TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE hitl_pending (
                    id TEXT PRIMARY KEY,
                    type TEXT,
                    priority TEXT,
                    train TEXT,
                    action TEXT,
                    confidence INTEGER,
                    passengers INTEGER,
                    delay TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE containers (
                    name TEXT PRIMARY KEY,
                    status TEXT,
                    cpu INTEGER,
                    mem INTEGER,
                    uptime TEXT,
                    restarts INTEGER
                )
            """)
            cursor.execute("""
                CREATE TABLE metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            """)
            
            # Seed Initial Data (100+ items)
            seed_database(cursor)
            conn.commit()
            
        # Simulate real-time activity
        simulate_realtime_activity(conn)
        conn.commit()
        
        # Read into global lists in-place to preserve external module imports
        TRAINS.clear()
        cursor.execute("SELECT id, name, from_station, to_station, time_val, status, delay, platform FROM trains")
        for row in cursor.fetchall():
            TRAINS.append({
                "id": row[0],
                "name": row[1],
                "from": row[2],
                "to": row[3],
                "time": row[4],
                "status": row[5],
                "delay": row[6],
                "platform": row[7]
            })
            
        PLATFORMS.clear()
        cursor.execute("SELECT num, status, train, arrival, departure, eta, nextExp, note, crowd FROM platforms")
        for row in cursor.fetchall():
            PLATFORMS.append({
                "num": row[0],
                "status": row[1],
                "train": row[2],
                "arrival": row[3],
                "departure": row[4],
                "eta": row[5],
                "nextExp": row[6],
                "note": row[7],
                "crowd": row[8]
            })
            
        AUDIT_LOGS.clear()
        cursor.execute("SELECT id, ts, type, module, source, action, status, hash FROM audit_logs ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC")
        for row in cursor.fetchall():
            AUDIT_LOGS.append({
                "id": row[0],
                "ts": row[1],
                "type": row[2],
                "module": row[3],
                "source": row[4],
                "action": row[5],
                "status": row[6],
                "hash": row[7]
            })
            
        HITL_PENDING.clear()
        cursor.execute("SELECT id, type, priority, train, action, confidence, passengers, delay FROM hitl_pending")
        for row in cursor.fetchall():
            HITL_PENDING.append({
                "id": row[0],
                "type": row[1],
                "priority": row[2],
                "train": row[3],
                "action": row[4],
                "confidence": row[5],
                "passengers": row[6],
                "delay": row[7]
            })
            
        CONTAINERS.clear()
        cursor.execute("SELECT name, status, cpu, mem, uptime, restarts FROM containers")
        for row in cursor.fetchall():
            CONTAINERS.append({
                "name": row[0],
                "status": row[1],
                "cpu": row[2],
                "mem": row[3],
                "uptime": row[4],
                "restarts": row[5]
            })
            
        # Read next event ID
        cursor.execute("SELECT value FROM metadata WHERE key='_next_event_id'")
        id_row = cursor.fetchone()
        if id_row:
            _next_event_id = int(id_row[0])
        else:
            _next_event_id = 4822
            
        conn.close()
    except Exception as e:
        sys.stderr.write(f"Error loading state from SQLite: {str(e)}\n")

# Auto-initialize state on import
load_state()
