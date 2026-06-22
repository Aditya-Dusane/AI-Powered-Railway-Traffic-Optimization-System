"""
Passenger Agent — AI-generated multilingual passenger announcements.
Called by Express server with JSON input via stdin, outputs JSON to stdout.
"""

import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared.groq_client import call_groq
from shared.data_store import add_audit_log

SYSTEM_PROMPT = """You are RailSync Passenger Communications AI. You generate formal, clear, and polite passenger announcements for Indian Railways.
Translate the draft prompt details into a realistic announcement in the requested language (Hindi, English, Tamil, Telugu, Kannada, Marathi).
Do not add any preamble, explanation, or notes. Respond with only the final announcement text."""


def generate_announcement(prompt_text: str, language: str):
    """Generate announcement text using Groq LLM."""
    query = f"""Draft Event: {prompt_text}
Requested Language: {language}

Generate a realistic, formal, and helpful announcement for the railway station PA system/displays in {language}."""
    
    announcement = call_groq(query, system_prompt=SYSTEM_PROMPT)
    
    # Clean output from potential quotes
    announcement = announcement.strip().strip('"').strip("'")
    
    return {
        "prompt": prompt_text,
        "language": language,
        "announcement": announcement
    }


def broadcast_announcement(prompt_text: str, announcement: str, language: str, channels: list):
    """Log the broadcast action to the audit logs."""
    channel_str = ", ".join(channels) if channels else "None"
    action_text = f"Broadcast announcement in {language} via [{channel_str}]: {announcement[:60]}..."
    entry = add_audit_log("AI_DECISION", "Comms", "AI", action_text, "Broadcast")
    return {"success": True, "logged_event": entry}


def main():
    try:
        input_data = json.loads(sys.stdin.read())
        action = input_data.get("action", "generate")
        
        if action == "generate":
            result = generate_announcement(
                input_data.get("prompt", "Platform change for Shatabdi Exp"),
                input_data.get("language", "English")
            )
        elif action == "broadcast":
            result = broadcast_announcement(
                input_data.get("prompt", ""),
                input_data.get("announcement", ""),
                input_data.get("language", "English"),
                input_data.get("channels", [])
            )
        else:
            result = {"error": f"Unknown action: {action}"}
            
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
