"""
Disruption Agent — Dynamic recovery strategy generation using Groq LLM.
Called by Express server with JSON input via stdin, outputs JSON to stdout.
"""

import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.groq_client import call_groq_json
from shared.data_store import TRAINS, add_audit_log, save_state


SYSTEM_PROMPT = """You are RailSync Disruption Management AI — an expert in railway operations, crisis mitigation, and contingency routing for Indian Railways.
You respond only with valid JSON. Keep responses concise and focused on actionable recovery plans."""


def get_recovery_plans(scenario_id: str):
    """Generate AI-powered recovery plans for a specific disruption scenario."""
    scenario_map = {
        "breakdown": "Engine failure of 12002 Bhopal Shatabdi on Sector B-4 (Palwal-Agra section), blocking the up-line.",
        "weather": "Heavy smog and poor visibility (less than 50m) in NCR region, causing speed restrictions (30km/h max).",
        "blockage": "Track obstruction (fallen boulder) detected in Tunnel 4 near Gwalior section.",
        "signal": "Main electronic interlocking switching unit malfunction at Hazrat Nizamuddin Junction."
    }

    details = scenario_map.get(scenario_id, f"Unknown disruption scenario: {scenario_id}")

    prompt = f"""Analyze this active disruption on Indian Railways network:
DISRUPTION DETAILS: {details}

Generate exactly 3 recovery plans (e.g., Aggressive Rerouting, Balanced Scheduling, Buffer Absorption, or Speed Advisory).
For each plan, specify:
1. title (short name)
2. description (brief action details)
3. reduction (expected percentage of delay reduction, as integer, e.g. 65)
4. time (estimated recovery time in minutes, as integer, e.g. 15)
5. impact_summary (brief statement on passengers/trains affected)

Respond with JSON in this format:
{{
  "scenario_id": "{scenario_id}",
  "impacted_trains": 12,
  "est_total_delay_min": 145,
  "plans": [
    {{
      "id": "aggressive",
      "title": "Aggressive Reroute",
      "description": "Reroute 4 affected express trains via loop lines, bypassing Sector B-4 entirely.",
      "reduction": 65,
      "time": 15,
      "impact_summary": "Saves 95 mins total delay; minor platform path changes."
    }}
  ]
}}"""

    raw = call_groq_json(prompt, system_prompt=SYSTEM_PROMPT)
    try:
        result = json.loads(raw)
        return result
    except json.JSONDecodeError:
        # Fallback plans in case Groq call fails
        fallbacks = {
            "breakdown": [
                {"id": "aggressive", "title": "Aggressive Reroute", "description": "Reroute Shatabdi via Loop-Line C. Overrides low-priority goods trains.", "reduction": 65, "time": 15, "impact_summary": "Bypasses block; minor passenger delay."},
                {"id": "balanced", "title": "Balanced Allocation", "description": "Reschedule trailing trains by 10-15 mins; dispatch relief loco from Agra.", "reduction": 42, "time": 25, "impact_summary": "Steady recovery with low conflict risk."}
            ],
            "weather": [
                {"id": "aggressive", "title": "Fog-Safe Speed Boost", "description": "Use GPS-enabled fog-safe devices to run at 60 km/h where signaling permits.", "reduction": 35, "time": 40, "impact_summary": "Slight delay reduction, increases fuel efficiency."},
                {"id": "balanced", "title": "Phased Delay Absorber", "description": "Space departures by additional 10 min buffers to prevent choke points.", "reduction": 20, "time": 60, "impact_summary": "High safety, uniform slow speeds."}
            ],
            "blockage": [
                {"id": "aggressive", "title": "Tunnel Bypass routing", "description": "Divert all passenger trains via Jhansi-Etawah section. Shuttle buses at Gwalior.", "reduction": 50, "time": 30, "impact_summary": "Bypasses Tunnel 4. 20km extra travel."},
                {"id": "balanced", "title": "Controlled Staging", "description": "Stage trains at adjacent stations. Deploy heavy clearing crew.", "reduction": 30, "time": 50, "impact_summary": "Awaiting clearance. Passengers remain on board."}
            ],
            "signal": [
                {"id": "aggressive", "title": "Manual Interlocking Override", "description": "Deploy cabin-level manual pilot guides at NZM to hand-signal trains through.", "reduction": 55, "time": 20, "impact_summary": "Requires ground crew; restores 70% traffic flow."},
                {"id": "balanced", "title": "Reduced Frequency Loop", "description": "Cancel local suburban services, prioritize long-distance express routes.", "reduction": 45, "time": 35, "impact_summary": "Minimizes complexity; local passengers impacted."}
            ]
        }
        
        return {
            "scenario_id": scenario_id,
            "impacted_trains": 12 if scenario_id == "breakdown" else 8,
            "est_total_delay_min": 145 if scenario_id == "breakdown" else 90,
            "plans": fallbacks.get(scenario_id, fallbacks["breakdown"])
        }


def approve_plan(scenario_id: str, plan_title: str):
    """Approve a recovery plan, update train delays accordingly, and log it."""
    train_id = None
    if scenario_id == "breakdown":
        train_id = "12002"  # Bhopal Shatabdi
    elif scenario_id == "weather":
        train_id = "12621"  # Tamil Nadu Express
    elif scenario_id == "blockage":
        train_id = "12461"  # Mandore Express
        
    reduced_text = ""
    if train_id:
        for train in TRAINS:
            if train["id"] == train_id:
                old_delay = train["delay"]
                train["delay"] = max(0, int(old_delay * 0.35))
                if train["delay"] == 0:
                    train["status"] = "on-time"
                else:
                    train["status"] = "delayed"
                reduced_text = f" Train {train_id} delay reduced from {old_delay}m to {train['delay']}m."
                break
                
    action_text = f"Approved recovery plan '{plan_title}' for scenario: {scenario_id.replace('_', ' ').title()}.{reduced_text}"
    entry = add_audit_log("AI_DECISION", "Disruption", "Operator", action_text, "Applied")
    save_state()
    return {"success": True, "logged_event": entry}



def main():
    try:
        input_data = json.loads(sys.stdin.read())
        action = input_data.get("action", "get_plans")
        scenario = input_data.get("scenario", "breakdown")

        if action == "get_plans":
            result = get_recovery_plans(scenario)
        elif action == "approve":
            result = approve_plan(scenario, input_data.get("plan_title", "Aggressive Reroute"))
        else:
            result = {"error": f"Unknown action: {action}"}

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
