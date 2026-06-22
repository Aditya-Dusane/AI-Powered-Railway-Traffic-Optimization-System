"""
Shared Groq LLM client for RailSync AI.
All Python agents import this module to access the Groq API.
"""

import os
from groq import Groq

# Load Groq API Key from environment variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"

_client = None

def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY or "dummy_key_placeholder")
    return _client


def call_groq(prompt: str, system_prompt: str = None, temperature: float = 0.7, max_tokens: int = 1024, response_format: dict = None) -> str:
    """
    Call the Groq LLM with a prompt and return the text response.
    
    Args:
        prompt: User message
        system_prompt: Optional system context
        temperature: Sampling temperature
        max_tokens: Max response tokens
        response_format: Optional dict for response formatting (e.g. {"type": "json_object"})
    
    Returns:
        String response from the model
    """
    client = get_client()

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        kwargs = {
            "model": MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            kwargs["response_format"] = response_format
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"ERROR: Groq API call failed: {str(e)}"


def call_groq_json(prompt: str, system_prompt: str = None) -> str:
    """
    Call Groq expecting a JSON string response. Wraps the prompt to enforce JSON output.
    """
    json_system = (system_prompt or "") + "\nYou MUST respond with valid JSON only."
    raw = call_groq(prompt, system_prompt=json_system, temperature=0.3, max_tokens=2048, response_format={"type": "json_object"})
    
    # Strip markdown formatting just in case
    cleaned = raw.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

