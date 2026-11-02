from functools import wraps
from flask import request, jsonify
import json
import os

KEYS_FILE = "api_keys.json"

def load_api_keys():
    return {
        "sk_demo_sec_999": {"owner": "SOC Administrator", "role": "ADMIN"},
        "sk_operator_111": {"owner": "Security Operator", "role": "OPERATOR"}
    }

def require_api_key(f_route):
    @wraps(f_route)
    def decorated_function(*args, **kwargs):
        api_keys = load_api_keys()
        
        # Check header X-API-Key or Bearer token or query param
        auth_header = request.headers.get("X-API-Key") or request.headers.get("Authorization")
        if not auth_header:
            auth_header = request.args.get("api_key")
            
        if not auth_header:
            return jsonify({"success": False, "error": "Missing API Key. Provide X-API-Key header."}), 401
            
        token = auth_header.replace("Bearer ", "").strip()
        if token not in api_keys:
            return jsonify({"success": False, "error": "Invalid or revoked API Key."}), 401
            
        # Attach user/role to request context if needed
        request.current_operator = api_keys[token]
        return f_route(*args, **kwargs)
    return decorated_function
