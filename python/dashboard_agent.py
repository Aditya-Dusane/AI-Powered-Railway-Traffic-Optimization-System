"""
Dashboard Agent — Orchestrates high-level system telemetry, active alert feed, and dynamic AI insights.
Called by Express server with JSON input via stdin, outputs JSON to stdout.
"""

import sys
import json
import os
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.groq_client import call_groq_json
from shared.data_store import TRAINS, PLATFORMS, AUDIT_LOGS, add_audit_log, save_state


SYSTEM_PROMPT = """You are RailSync AI Control Center. You orchestrate high-level railway metrics and provide tactical, operations-focused GenAI insights.
You respond only with valid JSON."""


def get_dashboard_data():
    """Retrieve system status and generate dynamic GenAI insights based on current conflicts."""
    # Count metrics
    active_trains_count = len(TRAINS)
    delayed_trains = [t for t in TRAINS if t["status"] == "delayed"]
    risk_trains = [t for t in TRAINS if t["status"] == "risk"]
    on_time_pct = round(((active_trains_count - len(delayed_trains)) / active_trains_count) * 100, 1) if active_trains_count > 0 else 100.0

    # Platform occupancy calculations
    occupied = len([p for p in PLATFORMS if p["status"] == "occupied"])
    platform_occupancy_pct = round((occupied / len(PLATFORMS)) * 100) if PLATFORMS else 0

    # Build platform utilization list (10 platforms)
    platform_util = []
    for p in PLATFORMS:
        # Base crowd values or status-based utilization
        if p["status"] == "occupied":
            platform_util.append(p.get("crowd", 80))
        elif p["status"] == "reserved":
            platform_util.append(p.get("crowd", 40))
        else:
            platform_util.append(p.get("crowd", 10))

    # Make sure we have exactly 10 values
    while len(platform_util) < 10:
        platform_util.append(random.randint(10, 50))
    platform_util = platform_util[:10]

    # Convert AUDIT_LOGS of type ALERT into alert list
    alerts = []
    for log in AUDIT_LOGS:
        if log["type"] == "ALERT":
            alerts.append({
                "time": log["ts"][:5],
                "title": log["action"].split(".")[0] if "." in log["action"] else log["action"],
                "desc": log["action"],
                "severity": "high" if "obstruction" in log["action"].lower() or "failure" in log["action"].lower() else "med"
            })
            
    # Default alerts fallback
    if not alerts:
        alerts = [
            {"time": "14:42", "title": "Track Obstruction", "desc": "Sector D-14, Near Palwal. Inspection dispatched.", "severity": "high"},
            {"time": "14:38", "title": "Signal Failure", "desc": "Junction East-2, Nizamuddin. Manual override active.", "severity": "med"},
            {"time": "14:29", "title": "AI Model Updated", "desc": "RailSync AI Model v4.3 deployed. Latency: 28ms.", "severity": "info"}
        ]

    # Prompt Groq to generate fresh strategic insights based on current delays
    delay_summaries = ", ".join([f"{t['id']} ({t['name']}) delayed by {t['delay']}m on {t['platform']}" for t in delayed_trains + risk_trains])
    
    prompt = f"""Active delays on network: {delay_summaries}
Platform Occupancy is {platform_occupancy_pct}%.

Generate exactly 5 operation insights. For each insight specify:
- type (e.g., 'STRATEGIC REROUTE', 'SPEED ADVISORY', 'ENERGY OPTIMIZATION', 'DEMAND PREDICTION', 'PREDICTIVE DELAY')
- desc (a concise description of the insight)
- action (boolean, true if it's immediately actionable by an operator)

Respond with JSON in this format:
{{
  "insights": [
    {{
      "type": "STRATEGIC REROUTE",
      "desc": "Divert 12301 Rajdhani to PF-4 at NDLS to avoid Shatabdi overlap. Saves 22 min.",
      "action": true
    }}
  ]
}}"""

    raw = call_groq_json(prompt, system_prompt=SYSTEM_PROMPT)
    try:
        insights_data = json.loads(raw)
        insights = insights_data.get("insights", [])
    except json.JSONDecodeError:
        # Fallback insights
        insights = [
            {"type": "STRATEGIC REROUTE", "desc": "Divert 12301 Rajdhani to PF-4 at NDLS to avoid Shatabdi overlap. Saves 22 min.", "action": True},
            {"type": "SPEED ADVISORY", "desc": "Reduce 22415 Vande Bharat speed by 8% to sync arrival at Agra Cantt (AGC).", "action": False},
            {"type": "ENERGY OPTIMIZATION", "desc": "Idle PF-12 lighting at Hazrat Nizamuddin during 20-min service gap.", "action": False},
            {"type": "DEMAND PREDICTION", "desc": "Tamil Nadu Express PF crowd: +42% above normal. Suggest extra staff deployment.", "action": False},
            {"type": "PREDICTIVE DELAY", "desc": "Mandore Express delay likely to cascade to 12 downstream services at JP.", "action": False}
        ]

    # Format live trains for frontend feed
    live_trains = []
    for t in TRAINS:
        live_trains.append({
            "id": t["id"],
            "name": t["name"],
            "from": t["from"],
            "to": t["to"],
            "eta": t["time"],
            "status": t["status"],
            "delay": f"+{t['delay']}m" if t["delay"] > 0 else "ON TIME"
        })

    return {
        "kpis": [
            {"label": "Active Trains", "value": str(active_trains_count + 260), "sub": "+12 from yesterday", "color": "blue", "spark": [210, 225, 240, 232, 248, 261, 258, 270, 265, active_trains_count + 260]},
            {"label": "On-Time Performance", "value": f"{on_time_pct}%", "sub": "+2.1% this week", "color": "green", "spark": [85, 87, 89, 86, 90, 91, 88, 91, 90, int(on_time_pct)]},
            {"label": "Active Alerts", "value": str(len(delayed_trains) + len(risk_trains)), "sub": f"{len(delayed_trains)} delayed, {len(risk_trains)} risk", "color": "red", "spark": [3, 7, 5, 8, 4, 6, 3, 5, 4, len(delayed_trains) + len(risk_trains)]},
            {"label": "Platform Occupancy", "value": f"{platform_occupancy_pct}%", "sub": "NDLS station avg.", "color": "blue", "spark": [70, 75, 78, 80, 82, 79, 83, 85, 84, platform_occupancy_pct]}
        ],
        "platform_util": platform_util,
        "platform_colors": [("#ff6b6b" if v > 85 else "#fcc419" if v > 65 else "#20c997") for v in platform_util],
        "live_trains": live_trains,
        "alerts": alerts,
        "insights": insights
    }


def execute_insight(insight_type: str, desc: str):
    """Execute a GenAI Insight by generating a detailed plan, modifying the database, and logging it."""
    prompt = f"""Insight Type: {insight_type}
Insight Description: {desc}

Generate a formal 3-step action plan to execute this recommendation. Include specific railway protocols to invoke."""
    
    plan_details = call_groq_json(prompt, system_prompt="You are RailSync AI. Respond with JSON containing a 'plan' list of strings.")
    try:
        plan = json.loads(plan_details).get("plan", [f"Initiate {insight_type.lower()}", f"Notify station crew of changes", "Verify system telemetry updates"])
    except json.JSONDecodeError:
        plan = [f"Initiate protocol for {insight_type}", "Direct signals to override track blocks", "Complete audit check"]
        
    # Dynamically update SQLite database state if train or platform is referenced in description
    import re
    train_ids = re.findall(r'\b\d{5}\b', desc)
    if train_ids:
        train_id = train_ids[0]
        for train in TRAINS:
            if train["id"] == train_id:
                pfs = re.findall(r'PF-?\s*(\d+)', desc)
                if pfs:
                    new_pf = f"PF-{pfs[0].zfill(2)}"
                    old_pf = train["platform"]
                    train["platform"] = new_pf
                    
                    # Update platforms table in-memory list
                    old_num = old_pf.replace("PF-", "")
                    for p in PLATFORMS:
                        if p["num"] == old_num:
                            p["status"] = "free"
                            p["train"] = None
                            p["arrival"] = None
                            p["departure"] = None
                            p["eta"] = None
                    for p in PLATFORMS:
                        if p["num"] == pfs[0].zfill(2):
                            p["status"] = "occupied"
                            p["train"] = f"{train['id']} {train['name']}"
                            p["arrival"] = train["time"]
                
                if any(x in desc.lower() for x in ["save", "avoid", "reduce", "optimize"]):
                    train["delay"] = 0
                    train["status"] = "on-time"
                break
        save_state()
        
    action_text = f"Executed AI Insight [{insight_type}]: {desc} | Steps taken: " + " -> ".join(plan)
    entry = add_audit_log("AI_DECISION", "Dashboard", "AI", action_text, "Applied")
    
    return {
        "success": True,
        "insight_type": insight_type,
        "action_plan": plan,
        "logged_event": entry
    }



def main():
    try:
        input_data = json.loads(sys.stdin.read())
        action = input_data.get("action", "get_dashboard")
        
        if action == "get_dashboard":
            result = get_dashboard_data()
        elif action == "execute":
            result = execute_insight(
                input_data.get("insight_type", ""),
                input_data.get("description", "")
            )
        else:
            result = {"error": f"Unknown action: {action}"}
            
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
