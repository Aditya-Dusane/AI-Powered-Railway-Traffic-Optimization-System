"""
Monitoring Agent — AI-driven telemetry diagnostics and anomaly detection.
Called by Express server with JSON input via stdin, outputs JSON to stdout.
"""

import sys
import json
import os
import random
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.groq_client import call_groq_json
from shared.data_store import get_live_metrics, add_audit_log, CONTAINERS, save_state

SYSTEM_PROMPT = """You are RailSync AI Diagnostics. You analyze real-time container metrics, Kafka broker lags, and logs to identify anomalies and provide diagnostics.
You respond only with valid JSON."""

# Baseline Kafka Topics
KAFKA_TOPICS = [
    {"topic": "train.positions.live", "lag": 12, "rate": "8.4k/s", "status": "active"},
    {"topic": "ai.recommendations.feed", "lag": 0, "rate": "420/s", "status": "active"},
    {"topic": "disruption.alerts", "lag": 3, "rate": "82/s", "status": "active"},
    {"topic": "passenger.comms.out", "lag": 0, "rate": "210/s", "status": "active"},
    {"topic": "platform.events.raw", "lag": 189, "rate": "1.2k/s", "status": "lagging"},
    {"topic": "audit.ledger.immutable", "lag": 0, "rate": "96/s", "status": "active"},
    {"topic": "model.telemetry", "lag": 0, "rate": "640/s", "status": "active"},
    {"topic": "simulation.results", "lag": 0, "rate": "28/s", "status": "active"},
]

# Baseline Logs
RAW_LOGS = [
    {"time": "19:42:08", "level": "INFO", "service": "ai-scheduler", "msg": "Reroute recommendation generated for 12002. Confidence: 94%."},
    {"time": "19:41:55", "level": "WARN", "service": "disruption-engine", "msg": "Memory usage at 82%. Consider scaling up container."},
    {"time": "19:41:22", "level": "ERROR", "service": "data-ingest", "msg": "Connection to IRCTC stream lost. Retrying (7/10)."},
    {"time": "19:40:10", "level": "INFO", "service": "platform-optimizer", "msg": "Platform 02 conflict resolved. Train 12221 reassigned."},
    {"time": "19:39:55", "level": "INFO", "service": "model-inference-v4", "msg": "Batch inference complete. 1,240 predictions in 128ms."},
    {"time": "19:39:12", "level": "WARN", "service": "kafka-broker-01", "msg": "Consumer lag on platform.events.raw: 189 messages."},
    {"time": "19:38:44", "level": "INFO", "service": "audit-ledger", "msg": "Event EVT-4819 recorded. Hash: 2d9f3e...a1b"},
    {"time": "19:38:01", "level": "INFO", "service": "passenger-comms", "msg": "Hindi PA announcement broadcast to 24 speakers at NDLS."},
    {"time": "19:37:30", "level": "INFO", "service": "geo-tracker", "msg": "12 trains updated position. Avg GPS accuracy: 4.2m."},
    {"time": "19:36:58", "level": "ERROR", "service": "data-ingest", "msg": "Timeout on zone-D sensor cluster. Auto-alert raised."},
    {"time": "19:36:15", "level": "INFO", "service": "hitl-approval-svc", "msg": "Decision #HIL-0421 approved by operator Rajesh Kumar."},
    {"time": "19:35:44", "level": "INFO", "service": "simulation-core", "msg": "Scenario BKD-14 run complete. Recovery time: 18 min."},
]


def get_diagnostics():
    """Fetch live data and invoke Groq for anomaly prediction and diagnostic advisories."""
    containers = get_live_metrics()
    
    # Introduce small random variation to Kafka lag
    topics = []
    for t in KAFKA_TOPICS:
        t_copy = t.copy()
        if t_copy["status"] == "lagging":
            t_copy["lag"] = max(50, t_copy["lag"] + random.randint(-20, 20))
        elif random.random() < 0.3:
            t_copy["lag"] = max(0, t_copy["lag"] + random.randint(0, 5))
        topics.append(t_copy)
        
    # Build description of active issues
    issues = []
    for c in containers:
        if c["status"] in ("error", "warning"):
            issues.append(f"Container '{c['name']}' status is {c['status'].upper()} (CPU: {c['cpu']}%, MEM: {c['mem']}%, restarts: {c['restarts']})")
    for t in topics:
        if t["lag"] > 50:
            issues.append(f"Kafka topic '{t['topic']}' is lagging with {t['lag']} messages (rate: {t['rate']})")
            
    issue_desc = "\n".join(issues) if issues else "All systems normal."
    
    prompt = f"""Current System Telemetry Issues:
{issue_desc}

Generate system diagnostics containing:
1. anomaly_prediction: specific warning about likely failures (e.g. data-ingest-pipeline exhaustion)
2. scaling_advisory: recommendations for GPU/CPU resources (e.g. model-inference-v4 GPU utilization)
3. kafka_optimization: suggestions to resolve topic lag (e.g. platform.events.raw lag)

Respond with JSON in this format:
{{
  "anomaly_prediction": "AI diagnostic prediction text",
  "scaling_advisory": "AI scaling advisory text",
  "kafka_optimization": "AI kafka optimization text"
}}"""

    raw = call_groq_json(prompt, system_prompt=SYSTEM_PROMPT)
    try:
        diagnostics = json.loads(raw)
    except json.JSONDecodeError:
        diagnostics = {
            "anomaly_prediction": "data-ingest-pipeline has failed 7 times in 12 minutes. AI predicts full memory exhaustion in ~18 min. Recommend container restart + scale-up.",
            "scaling_advisory": "model-inference-v4 at 93% GPU. AI recommends adding 1 replica to handle peak traffic load until 21:00 IST.",
            "kafka_optimization": "platform.events.raw partition lag: 189. Increase consumer group from 2 to 4 threads to clear backlog."
        }
        
    # Append dynamic log entry
    now = datetime.now().strftime("%H:%M:%S")
    new_log = {
        "time": now,
        "level": "INFO",
        "service": "diagnostics-agent",
        "msg": f"Telemetry diagnostics generated. Avg CPU: {round(sum(c['cpu'] for c in containers)/len(containers))}%."
    }
    
    return {
        "containers": containers,
        "kafka_topics": topics,
        "logs": [new_log] + RAW_LOGS[:14],
        "diagnostics": diagnostics
    }


def restart_container(name: str):
    """Simulate container restart."""
    for c in CONTAINERS:
        if c["name"] == name:
            c["status"] = "healthy"
            c["cpu"] = random.randint(5, 20)
            c["mem"] = random.randint(15, 35)
            c["uptime"] = "0h 01m"
            c["restarts"] += 1
            break
    add_audit_log("SYSTEM", "Monitoring", "Operator", f"Restarted container: {name}", "Resolved")
    save_state()
    return {"success": True, "message": f"Container {name} has been queued for restart."}


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        action = input_data.get("action", "status")
        
        if action == "status":
            result = get_diagnostics()
        elif action == "restart":
            result = restart_container(input_data.get("name", "data-ingest-pipeline"))
        else:
            result = {"error": f"Unknown action: {action}"}
            
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
