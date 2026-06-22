"""
Simulation Agent — Runs predictive simulations on the railway network using Groq LLM.
Called by Express server with JSON input via stdin, outputs JSON to stdout.
"""

import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.groq_client import call_groq_json
from shared.data_store import add_audit_log

SYSTEM_PROMPT = """You are RailSync Simulation Core AI. You run predictive physics-based and schedule-based simulations of Indian Railways networks.
Analyze the disruption scenario and return cascading delay propagation, number of trains affected, and 3 recovery strategies.
You respond only with valid JSON. Keep descriptions data-focused."""


def run_simulation(scenario: str, train: str, station: str, delay: int, priority: str):
    """Call Groq to simulate delay propagation and recovery options."""
    prompt = f"""Run a network simulation for the following scenario:
Scenario Type: {scenario}
Affected Train: {train}
Affected Location/Station: {station}
Initial Delay: {delay} minutes
Priority Level: {priority}

Simulate the cascading effects across the Northern Zone (NDLS, AGC, PWL, MTJ).
Calculate:
1. Delay Propagation (how many minutes of cascade delay will propagate to other trains if no action is taken)
2. Number of trains affected
3. Generate exactly 3 customized AI Recovery Strategies for this specific scenario.
   For each strategy, specify:
   - label (short name, e.g. 'Reroute via Loop Line', 'Hold at station')
   - delayReduction (e.g. '22 min' or '15 min')
   - confidence (integer percentage, e.g. 94)
   - passengers (impact level, e.g. 'Low Impact', 'Medium Impact', 'High Impact')
   - reasoning (short explanation)

Respond with JSON in this format:
{{
  "delay_propagation_min": 45,
  "trains_affected": 4,
  "strategies": [
    {{
      "label": "Reroute via Loop Line",
      "delayReduction": "22 min",
      "confidence": 94,
      "passengers": "Low Impact",
      "reasoning": "Reroute Shatabdi around Nizamuddin track blockage to save 22m."
    }}
  ]
}}"""

    raw = call_groq_json(prompt, system_prompt=SYSTEM_PROMPT)
    try:
        result = json.loads(raw)
        
        # Log to audit
        add_audit_log("SYSTEM", "Simulation", "AI",
                      f"Simulated {scenario} for {train} at {station}. Predicted {result.get('delay_propagation_min', 0)}m cascade, {result.get('trains_affected', 0)} trains affected.",
                      "Resolved")
        return result
    except json.JSONDecodeError:
        # Fallback response
        reduction = min(delay - 5, 20)
        return {
            "delay_propagation_min": delay + 10,
            "trains_affected": 3,
            "strategies": [
                {"label": "Reroute via Loop Line", "delayReduction": f"{reduction} min", "confidence": 92, "passengers": "Low Impact", "reasoning": "Bypass blocked tracks"},
                {"label": "Hold at station for Gap Creation", "delayReduction": "10 min", "confidence": 78, "passengers": "High Impact", "reasoning": "Hold minor trains to clear path"},
                {"label": "Priority Overtake", "delayReduction": "5 min", "confidence": 84, "passengers": "Medium Impact", "reasoning": "Overtake slow freight train"}
            ]
        }


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        action = input_data.get("action", "run")
        
        if action == "run":
            result = run_simulation(
                input_data.get("scenario", "breakdown"),
                input_data.get("train", "12002 Bhopal Shatabdi"),
                input_data.get("station", "Mathura Jn (MTJ)"),
                int(input_data.get("delay", 25)),
                input_data.get("priority", "HIGH")
            )
        else:
            result = {"error": f"Unknown action: {action}"}
            
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
