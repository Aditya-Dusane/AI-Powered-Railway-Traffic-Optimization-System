"""
Platform Agent — Dynamic platform assignment automation for RailSync AI.
Called by Express server with JSON input via stdin, outputs JSON to stdout.
"""

import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.groq_client import call_groq_json
from shared.data_store import PLATFORMS, TRAINS, add_audit_log, save_state


SYSTEM_PROMPT = """You are RailSync Platform Manager AI — an expert in dynamic platform assignment for Indian Railways.
You optimize platform allocation considering passenger flow, train priority, and dwell times.
You respond only with valid JSON."""


def get_platforms():
    """Return current platform status."""
    occupied = len([p for p in PLATFORMS if p["status"] == "occupied"])
    free = len([p for p in PLATFORMS if p["status"] == "free"])
    reserved = len([p for p in PLATFORMS if p["status"] == "reserved"])
    return {
        "platforms": PLATFORMS,
        "summary": {
            "total": len(PLATFORMS),
            "occupied": occupied,
            "free": free,
            "reserved": reserved,
            "utilization_pct": round((occupied / len(PLATFORMS)) * 100, 1)
        }
    }


def optimize_assignment():
    """Use Groq to suggest optimal platform assignments."""
    platform_summary = "\n".join([
        f"- PF-{p['num']}: {p['status'].upper()}" + 
        (f", train: {p.get('train', 'N/A')}, crowd: {p.get('crowd', 0)}%" if p['status'] != 'free' else f", next expected: {p.get('nextExp', 'N/A')}")
        for p in PLATFORMS
    ])

    conflicts = [t for t in TRAINS if t["status"] in ("delayed", "risk")]
    conflict_text = "\n".join([f"- {t['id']} {t['name']}: {t['delay']}min delay on {t['platform']}" for t in conflicts])

    prompt = f"""Current platform status at New Delhi (NDLS):
{platform_summary}

Trains with conflicts needing platform reassignment:
{conflict_text}

Generate optimal platform assignments. Respond with JSON:
{{
  "assignments": [
    {{
      "train_id": "12002",
      "train_name": "Bhopal Shatabdi",
      "current_platform": "PF-02",
      "recommended_platform": "PF-06",
      "reason": "brief reason",
      "benefit": "-22 min delay"
    }}
  ],
  "overall_improvement": "X platforms freed, Y min total delay reduction"
}}"""

    raw = call_groq_json(prompt, system_prompt=SYSTEM_PROMPT)
    try:
        result = json.loads(raw)
        add_audit_log("AI_DECISION", "Platform", "AI",
                      f"Platform optimization computed: {result.get('overall_improvement', 'N/A')}",
                      "Applied")
        return result
    except json.JSONDecodeError:
        return {
            "assignments": [
                {"train_id": "12002", "train_name": "Bhopal Shatabdi", "current_platform": "PF-02", "recommended_platform": "PF-06", "reason": "PF-02 conflict with Duronto — PF-06 has 20min free window", "benefit": "-22 min delay"},
                {"train_id": "22415", "train_name": "Vande Bharat", "current_platform": "PF-04", "recommended_platform": "PF-04", "reason": "PF-04 is optimal for high-speed train — no change needed", "benefit": "0 min"},
            ],
            "overall_improvement": "1 platform freed, 22 min total delay reduction"
        }


def assign_platform(train_id: str, platform_num: str):
    """Manually assign a train to a platform."""
    import random
    target_train = None
    for train in TRAINS:
        if train["id"] == train_id:
            target_train = train
            break
            
    if not target_train:
        return {"success": False, "error": f"Train {train_id} not found"}
        
    old_platform = target_train["platform"]
    target_train["platform"] = f"PF-{platform_num.zfill(2)}"
    
    # 1. Update the old platform to be free
    old_num = old_platform.replace("PF-", "")
    for p in PLATFORMS:
        if p["num"] == old_num:
            p["status"] = "free"
            p["train"] = None
            p["arrival"] = None
            p["departure"] = None
            p["eta"] = None
            p["nextExp"] = "16:15"
            p["crowd"] = random.randint(5, 15)
            
    # 2. Update the new platform to occupy this train
    new_num = platform_num.zfill(2)
    for p in PLATFORMS:
        if p["num"] == new_num:
            p["status"] = "occupied"
            p["train"] = f"{target_train['id']} {target_train['name']}"
            p["arrival"] = target_train["time"]
            try:
                hr, mn = map(int, target_train["time"].split(":"))
                dep_min = (mn + 30) % 60
                dep_hr = (hr + (mn + 30) // 60) % 24
                p["departure"] = f"{str(dep_hr).zfill(2)}:{str(dep_min).zfill(2)}"
            except Exception:
                p["departure"] = "15:45"
            p["crowd"] = random.randint(60, 95)
            
    add_audit_log("OPERATOR_OVERRIDE", "Platform", "Operator",
                  f"Platform reassigned: {train_id} {target_train['name']} from {old_platform} to PF-{platform_num}",
                  "Logged")
    save_state()
    return {"success": True, "train_id": train_id, "old_platform": old_platform, "new_platform": target_train["platform"]}



def main():
    try:
        input_data = json.loads(sys.stdin.read())
        action = input_data.get("action", "status")

        if action == "status":
            result = get_platforms()
        elif action == "optimize":
            result = optimize_assignment()
        elif action == "assign":
            result = assign_platform(
                input_data.get("train_id", ""),
                input_data.get("platform", "01")
            )
        else:
            result = {"error": f"Unknown action: {action}"}

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
