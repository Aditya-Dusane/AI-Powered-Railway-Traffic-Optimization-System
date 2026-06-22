"""
Human-in-the-Loop (HITL) Agent — Generates reasoning for operator decisions and records inputs.
Called by Express server with JSON input via stdin, outputs JSON to stdout.
"""

import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.groq_client import call_groq
from shared.data_store import HITL_PENDING, AUDIT_LOGS, add_audit_log, save_state


SYSTEM_PROMPT = """You are RailSync HITL Coordinator AI. You generate concise, data-driven rationales explaining why a specific dispatching decision (reroute, platform swap, delay, speed change) is recommended.
Do not add any greeting or generic intro. Respond with 2-3 sentences max explaining the mathematical/operational benefit of the choice."""


def get_recommendations():
    """Retrieve pending recommendations and historical decisions."""
    # Build historical decisions from Audit Logs of type AI_DECISION/OPERATOR_OVERRIDE
    decisions = []
    for log in AUDIT_LOGS:
        if log["type"] in ("AI_DECISION", "OPERATOR_OVERRIDE") and log["module"] in ("Scheduler", "Platform", "Disruption", "HITL"):
            decisions.append({
                "id": log["id"].replace("EVT-", "HIL-0"),
                "action": "Approved" if log["type"] == "AI_DECISION" else "Modified" if "Priya" in log["action"] else "Modified",
                "train": log["action"].split(":")[1].strip().split(" ")[0] if ":" in log["action"] else "Train",
                "type": log["module"].upper(),
                "operator": log["source"],
                "ts": log["ts"][:5]
            })
            
    # Default fallback decisions if empty
    if not decisions:
        decisions = [
            {"id": "HIL-0421", "action": "Approved", "train": "12311 Kalka Mail", "type": "REROUTE", "operator": "Rajesh Kumar", "ts": "19:35"},
            {"id": "HIL-0420", "action": "Rejected", "train": "12459 Raj. Sampark Krt", "type": "PLATFORM", "operator": "Priya Sharma", "ts": "19:28"}
        ]
        
    return {
        "pending": HITL_PENDING,
        "decisions": decisions
    }


def generate_reasoning(recommendation_id: str):
    """Generate detailed AI reasoning for a recommendation using Groq."""
    item = next((r for r in HITL_PENDING if r["id"] == recommendation_id), None)
    if not item:
        return {"reasoning": "Recommendation details not found in active queue."}
        
    prompt = f"""Recommendation ID: {item['id']}
Type: {item['type']}
Priority: {item['priority']}
Train: {item['train']}
Proposed Action: {item['action']}
Confidence: {item['confidence']}%
Delay reduction: {item['delay']}

Provide a solid operational and safety reasoning for this recommendation."""

    reasoning = call_groq(prompt, system_prompt=SYSTEM_PROMPT)
    return {
        "id": recommendation_id,
        "reasoning": reasoning.strip()
    }


def record_decision(rec_id: str, action: str, operator: str = "Rajesh Kumar"):
    """Record a decision (Approve/Reject/Modify). Removes from pending and adds to audit logs."""
    item = next((r for r in HITL_PENDING if r["id"] == rec_id), None)
    
    if item:
        # Remove from pending queue to simulate progression
        HITL_PENDING.remove(item)
        
        # Log to audit log
        action_text = f"HITL Operator {operator} marked decision {rec_id} ({item['train']}) as {action.upper()}. Recommendation was: {item['action']}"
        entry = add_audit_log("OPERATOR_OVERRIDE" if action == "Rejected" or action == "Modified" else "AI_DECISION",
                              "HITL", operator, action_text, "Logged" if action != "Approved" else "Applied")
        save_state()
        return {"success": True, "rec_id": rec_id, "action": action, "logged_event": entry}
        
    return {"success": False, "error": f"Recommendation {rec_id} not found."}


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        action = input_data.get("action", "list")
        
        if action == "list":
            result = get_recommendations()
        elif action == "reasoning":
            result = generate_reasoning(input_data.get("id", ""))
        elif action == "decision":
            result = record_decision(
                input_data.get("id", ""),
                input_data.get("decision", "Approved"),
                input_data.get("operator", "Rajesh Kumar")
            )
        else:
            result = {"error": f"Unknown action: {action}"}
            
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
