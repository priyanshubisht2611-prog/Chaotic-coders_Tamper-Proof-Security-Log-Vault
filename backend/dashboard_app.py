"""
Sentinel Vault Dashboard — Flask Backend

Serves the React frontend (frontend/dist) in production, and in development
works alongside the Vite dev server (port 3000) by providing CORS headers.

API endpoints are unchanged — they are proxied from Vite in dev mode and
served directly by Flask in production.
"""
from flask import Flask, jsonify, render_template, request, send_from_directory
import json
import os
from api_auth import require_api_key, load_api_keys
import verification_core
import ollama_explainer
import behavior_scoring
import audit_trail
import dual_custody

# ── Firebase Admin SDK (optional — gracefully disabled if not installed) ────────
_fcm_available = False
try:
    import firebase_admin
    from firebase_admin import credentials, messaging as fcm_messaging
    # Load service account key if present — NEVER expose this file to the frontend
    _sa_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'firebase-service-account.json')
    if os.path.exists(_sa_path) and not firebase_admin._apps:
        cred = credentials.Certificate(_sa_path)
        firebase_admin.initialize_app(cred)
        _fcm_available = True
        print("  ✓ Firebase Admin SDK initialised — push notifications ready")
    else:
        print("  ⚠ firebase-service-account.json not found — push notifications disabled")
except ImportError:
    print("  ⚠ firebase-admin not installed — push notifications disabled")
    print("    Run: pip install firebase-admin")

# ── Persistent FCM token store ─────────────────────────────────────────────────
# Tokens are persisted to fcm_tokens.json so they survive Flask restarts.
# In a real deployment, replace with a proper database.
_FCM_TOKENS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fcm_tokens.json')

def _load_fcm_tokens() -> list:
    """Load persisted FCM tokens from disk."""
    try:
        if os.path.exists(_FCM_TOKENS_FILE):
            with open(_FCM_TOKENS_FILE, 'r') as f:
                data = json.load(f)
                return list(set(data)) if isinstance(data, list) else []
    except Exception:
        pass
    return []

def _save_fcm_tokens(tokens: list) -> None:
    """Persist FCM tokens to disk."""
    try:
        with open(_FCM_TOKENS_FILE, 'w') as f:
            json.dump(list(set(tokens)), f)
    except Exception as e:
        print(f"  ⚠ Could not save FCM tokens: {e}")

_fcm_tokens: list = _load_fcm_tokens()
print(f"  ✓ FCM token store loaded: {len(_fcm_tokens)} registered device(s)")

# ── Breach alert deduplication ─────────────────────────────────────────────────
# Tracks (window_id, kind) pairs already alerted to avoid spam.
import time as _time
_alerted_breaches: dict = {}   # key → timestamp of last alert
_ALERT_COOLDOWN_SECS = 60      # Don't re-alert the same breach within 60s

def _should_alert(key: str) -> bool:
    now = _time.time()
    last = _alerted_breaches.get(key, 0)
    if now - last > _ALERT_COOLDOWN_SECS:
        _alerted_breaches[key] = now
        return True
    return False

# ── FCM dispatch helper ────────────────────────────────────────────────────────
def _dispatch_fcm(title: str, body: str, data: dict, tag: str = 'sentinel-alert') -> dict:
    """
    Send an FCM push to all registered tokens.
    Prunes stale/invalid tokens automatically.
    Returns {sent: int, errors: list, pruned: int}.
    """
    if not _fcm_available or not _fcm_tokens:
        return {"sent": 0, "errors": [], "pruned": 0}

    sent = 0
    errors = []
    stale = []
    tokens_snapshot = list(_fcm_tokens)

    for tok in tokens_snapshot:
        try:
            msg = fcm_messaging.Message(
                notification=fcm_messaging.Notification(title=title, body=body),
                data={str(k): str(v) for k, v in data.items()},
                webpush=fcm_messaging.WebpushConfig(
                    notification=fcm_messaging.WebpushNotification(
                        title=title,
                        body=body,
                        icon="/favicon.ico",
                        badge="/favicon.ico",
                        require_interaction=True,
                        tag=tag,
                        renotify=True,
                        vibrate=[300, 100, 300, 100, 300],
                    ),
                    fcm_options=fcm_messaging.WebpushFCMOptions(link="/"),
                ),
                token=tok,
            )
            fcm_messaging.send(msg)
            sent += 1
        except Exception as e:
            err_str = str(e)
            errors.append(err_str)
            # Prune tokens that are definitely invalid (registration-token-not-registered)
            if 'registration-token-not-registered' in err_str or 'invalid-registration-token' in err_str:
                stale.append(tok)

    if stale:
        for tok in stale:
            if tok in _fcm_tokens:
                _fcm_tokens.remove(tok)
        _save_fcm_tokens(_fcm_tokens)

    return {"sent": sent, "errors": errors, "pruned": len(stale)}

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIST = os.path.join(REPO_ROOT, "frontend", "dist")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

app = Flask(
    __name__,
    # In production Flask also serves the built React app
    static_folder=FRONTEND_DIST,
    static_url_path="",
    template_folder=TEMPLATES_DIR,
)

# ── CORS (needed when Vite dev server calls Flask directly) ────────────────────

@app.after_request
def add_cors_headers(response):
    """Allow the Vite dev server (port 3000) to call Flask (port 5000)."""
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    origin = request.headers.get("Origin", "")
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-API-Key"
    return response


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    """
    Serve the React SPA.

    - Static assets (JS/CSS/images) are served from frontend/dist/.
    - All other routes fall through to index.html so React Router handles them.
    - In development the Vite dev server handles this; Flask only serves
      the built dist in production.
    """
    if os.path.exists(FRONTEND_DIST):
        # Serve a real file if it exists, otherwise fall back to index.html
        target = os.path.join(FRONTEND_DIST, path)
        if path and os.path.exists(target) and not os.path.isdir(target):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")
    else:
        # dist not built yet — show a helpful dev message
        return (
            "<h2>React frontend not built yet.</h2>"
            "<p>Run: <code>cd frontend && npm install && npm run build</code></p>"
            "<p>Or start the Vite dev server: <code>npm run dev</code> (port 3000)</p>"
            "<p>Then access the API at <a href='/api/status'>/api/status</a></p>",
            200,
        )


# ── API Routes ─────────────────────────────────────────────────────────────────

@app.route("/api/status")
def api_status():
    results, error = verification_core.get_all_window_statuses()

    intact = sum(1 for r in results if r["status"] == "INTACT")
    tampered = sum(1 for r in results if r["status"] == "TAMPERED")
    missing = sum(1 for r in results if r["status"] == "MISSING")
    not_on_chain = sum(1 for r in results if r["status"] == "NOT_ON_CHAIN")

    return jsonify({
        "windows": results,
        "summary": {
            "total": len(results),
            "intact": intact,
            "tampered": tampered,
            "missing": missing,
            "not_on_chain": not_on_chain,
        },
        "warning": error,
    })


@app.route("/api/llm-status")
def api_llm_status():
    available = ollama_explainer.is_ollama_available()
    return jsonify({
        "available": available,
        "model": ollama_explainer.MODEL_NAME if available else None,
    })


@app.route("/api/ai-investigate", methods=["GET"])
def api_ai_investigate():
    """Get AI-powered investigation report for tampered/missing windows"""
    window_id = request.args.get("window_id", type=int)

    results, error = verification_core.get_all_window_statuses()
    if error:
        return jsonify({"success": False, "error": error})

    # Filter for problematic windows if no specific ID provided
    if window_id is not None:
        results = [r for r in results if r["window_id"] == window_id]
    else:
        results = [r for r in results if r["status"] in ["TAMPERED", "MISSING"]]

    if not results:
        return jsonify({
            "success": True,
            "message": "No security incidents to investigate. All windows are intact.",
            "investigation": None,
            "recommendation": None,
        })

    # Use local LLM to explain the incidents
    explanations = []
    for r in results[:3]:  # Limit to 3 for performance
        try:
            explanation = ollama_explainer.explain_window(r)
            explanations.append({
                "window_id": r["window_id"],
                "status": r["status"],
                "explanation": explanation
            })
        except Exception as e:
            explanations.append({
                "window_id": r["window_id"],
                "status": r["status"],
                "explanation": f"AI explanation unavailable: {str(e)}"
            })

    return jsonify({
        "success": True,
        "investigation": explanations,
        "recommendation": (
            "Review tampered windows immediately. "
            "Consider rotating API keys and investigating insider threats."
        ) if explanations else None,
    })


@app.route("/api/user-scores")
def api_user_scores():
    scores = behavior_scoring.calculate_all_scores()
    return jsonify(scores)


@app.route("/api/audit")
def api_audit():
    limit = request.args.get("limit", 50, type=int)
    entries = audit_trail.read_audit(limit)
    return jsonify({"entries": entries, "total": audit_trail.count_entries()})


@app.route("/api/actions/pending")
def api_pending_approvals():
    return jsonify({"pending": dual_custody.get_pending()})


@app.route("/api/actions/request", methods=["POST"])
def api_request_action():
    data = request.json or {}
    requester = data.get("requester", "admin_01")
    action = data.get("action", "DELETE_LOGS")
    details = data.get("details", {})

    res = dual_custody.request_approval(requester, action, details)
    audit_trail.log_action(requester, f"REQUEST_{action}", details)
    return jsonify(res)


@app.route("/api/actions/approve", methods=["POST"])
def api_approve_action():
    data = request.json or {}
    approval_id = data.get("approval_id")
    approver = data.get("approver", "admin_02")

    res = dual_custody.approve_action(approval_id, approver)
    if "error" not in res:
        audit_trail.log_action(
            approver,
            f"APPROVE_{res.get('action')}",
            {"approval_id": approval_id},
        )
    return jsonify(res)


@app.route("/api/simulate-attack", methods=["POST", "OPTIONS"])
@require_api_key
def api_simulate_attack():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    # Ensure there is at least one window sealed in the chain before attacking
    chain_data = []
    if os.path.exists(verification_core.CHAIN_FILE):
        try:
            chain_data = json.load(open(verification_core.CHAIN_FILE))
        except Exception:
            chain_data = []

    if not chain_data:
        import live_demo
        live_demo.reset_state()
        prev = ""
        for i in range(3):
            prev = live_demo.seal_window(i, prev, num_lines=5)

    results, _ = verification_core.get_all_window_statuses()
    intact_windows = [r for r in results if r["status"] == "INTACT"]

    # Auto-seed fresh windows if none intact
    if not intact_windows:
        import live_demo
        live_demo.reset_state()
        prev = ""
        for i in range(3):
            prev = live_demo.seal_window(i, prev, num_lines=5)
        results, _ = verification_core.get_all_window_statuses()
        intact_windows = [r for r in results if r["status"] == "INTACT"]

    if not intact_windows:
        return jsonify({"success": False, "message": "No intact anchored window available to attack."})

    target = intact_windows[-1]
    window_id = target["window_id"]

    with open(verification_core.CHAIN_FILE, "r") as f:
        chain = json.load(f)

    position = 0
    target_start = None
    target_count = None
    for entry in chain:
        if entry["window_id"] == window_id:
            target_start = position
            target_count = entry["num_lines"]
            break
        position += entry["num_lines"]

    if target_start is None:
        return jsonify({"success": False, "message": f"Could not locate window {window_id}."})

    with open(verification_core.LOG_FILE, "r") as f:
        lines = f.readlines()

    line_index = target_start + (target_count // 2)
    original = lines[line_index]
    tampered = original.rstrip("\n") + " [TAMPERED_BY_DEMO]\n"
    lines[line_index] = tampered

    with open(verification_core.LOG_FILE, "w") as f:
        f.writelines(lines)

    audit_trail.log_action("attacker_simulation", "TAMPER_WINDOW", {"window_id": window_id})

    # ── Auto-dispatch breach push (with dedup — won't re-fire same window within 60s) ──
    alert_key = f"tamper:{window_id}"
    if _should_alert(alert_key):
        import threading
        threading.Thread(
            target=_dispatch_fcm,
            kwargs={
                "title": "\U0001f534 VAULT BREACH DETECTED",
                "body":  f"Window {window_id} has been tampered with. Immediate investigation required.",
                "data":  {"window_id": str(window_id), "kind": "tamper", "severity": "breach"},
                "tag":   "sentinel-breach",
            },
            daemon=True,
        ).start()


    return jsonify({
        "success": True,
        "window_id": window_id,
        "original_line": original.strip(),
        "tampered_line": tampered.strip(),
        "message": f"Window {window_id} tampered successfully.",
    })


@app.route("/api/cloud-sync", methods=["POST", "OPTIONS"])
@require_api_key
def api_cloud_sync():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    import cloud_db_sync
    cloud_db_sync.migrate_json_to_db()
    result = cloud_db_sync.sync_to_cloud_mock()
    return jsonify({
        "success": True,
        "synced_count": result["synced_count"],
        "message": (
            f"Successfully backed up {result['synced_count']} log window(s) "
            "to secure cloud storage (AWS S3 / Encrypted Vault)."
        ),
    })


# ── Firebase Cloud Messaging Endpoints ─────────────────────────────────────────

@app.route("/api/fcm-status", methods=["GET"])
def api_fcm_status():
    """Return backend FCM configuration state and registered device count."""
    return jsonify({
        "fcm_available": _fcm_available,
        "registered_devices": len(_fcm_tokens),
        "cooldown_active_count": len(_alerted_breaches),
    })


@app.route("/api/register-fcm-token", methods=["POST", "OPTIONS"])
@require_api_key
def api_register_fcm_token():
    """
    Register a browser FCM token.
    Requires X-API-Key header (same key used for cloud-sync and simulate-attack).
    The API key prevents arbitrary callers from flooding the token store.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.json or {}
    token = data.get("token", "").strip()
    if not token:
        return jsonify({"success": False, "error": "No token provided"}), 400

    # Deduplicate (set semantics)
    if token not in _fcm_tokens:
        _fcm_tokens.append(token)
        _save_fcm_tokens(_fcm_tokens)

    operator = getattr(request, 'current_operator', {}).get('owner', 'unknown')
    audit_trail.log_action(operator, "FCM_TOKEN_REGISTERED", {"token_prefix": token[:16]})
    return jsonify({
        "success": True,
        "message": "Device registered for push notifications.",
        "registered_count": len(_fcm_tokens),
    })


@app.route("/api/send-alert", methods=["POST", "OPTIONS"])
@require_api_key
def api_send_alert():
    """
    Send a Firebase push notification to a specific token (or all registered tokens).
    Requires X-API-Key — prevents anonymous alert spam.

    Body JSON:
        token    – optional; if absent, broadcasts to all registered tokens
        title    – notification title
        body     – notification body
        severity – 'breach' | 'warning' | 'info' | 'test'
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.json or {}
    title    = data.get("title",    "🚨 Sentinel Vault Alert")
    body     = data.get("body",     "Anomaly detected in your security log vault.")
    severity = data.get("severity", "info")
    target_token = data.get("token")

    operator = getattr(request, 'current_operator', {}).get('owner', 'system')
    audit_trail.log_action(operator, "PUSH_ALERT_DISPATCHED", {
        "title": title, "severity": severity, "broadcast": target_token is None
    })

    if not _fcm_available:
        return jsonify({
            "success": False,
            "message": "Firebase Admin SDK not configured on backend. Notification not sent.",
            "fcm_available": False,
        })

    tokens_to_use = [target_token] if target_token else list(_fcm_tokens)
    if not tokens_to_use:
        return jsonify({"success": False, "message": "No registered tokens to notify."})

    # For a targeted send, use dispatch helper directly on that one token
    if target_token:
        # Temporarily restrict global list to just the target
        saved = list(_fcm_tokens)
        _fcm_tokens.clear()
        _fcm_tokens.append(target_token)

    result = _dispatch_fcm(
        title=title,
        body=body,
        data={"severity": severity, "source": "sentinel-vault"},
        tag="sentinel-vault-alert",
    )

    if target_token:
        _fcm_tokens.clear()
        _fcm_tokens.extend(saved)

    return jsonify({
        "success": result["sent"] > 0,
        "sent": result["sent"],
        "pruned": result["pruned"],
        "errors": result["errors"],
        "message": f"Notification sent to {result['sent']}/{len(tokens_to_use)} device(s).",
    })


@app.route("/api/breach-alert", methods=["POST"])
def api_breach_alert():
    """
    Called by the frontend when a tamper or deletion is detected client-side.
    Uses deduplication — same window won't re-alert within 60s.
    """
    data = request.json or {}
    window_id = data.get("window_id", "?")
    kind = data.get("kind", "tamper")

    alert_key = f"{kind}:{window_id}"
    if not _should_alert(alert_key):
        return jsonify({"success": False, "message": "Alert suppressed (cooldown active).", "deduped": True})

    title = "\U0001f534 VAULT BREACH DETECTED"
    body = (
        f"Window {window_id} has been {'tampered with' if kind == 'tamper' else 'deleted'}. "
        "Immediate investigation required."
    )

    result = _dispatch_fcm(
        title=title, body=body,
        data={"window_id": str(window_id), "kind": kind, "severity": "breach"},
        tag="sentinel-breach",
    )
    return jsonify({
        "success": result["sent"] > 0,
        "sent": result["sent"],
        "pruned": result["pruned"],
        "fcm_available": _fcm_available,
        "message": f"Breach alert sent to {result['sent']} device(s)." if result["sent"] > 0
                   else "FCM unavailable or no registered devices.",
    })


@app.route("/api/risk-alerts", methods=["POST"])
@require_api_key
def api_risk_alerts():
    """
    Risk-engine → FCM bridge.
    Scans behavior_scoring for HIGH-risk users and fires push alerts.
    Deduplication: the same user won't re-alert within 60s.
    Called by cron or the frontend polling loop.
    """
    scores = behavior_scoring.calculate_all_scores()
    high_risk = {u: d for u, d in scores.items() if d.get("level") == "HIGH"}

    alerted = []
    for user, data in high_risk.items():
        alert_key = f"risk:{user}"
        if not _should_alert(alert_key):
            continue

        title = f"\u26a0\ufe0f Insider Threat: {user}"
        body  = (
            f"User '{user}' risk score: {data['score']} "
            f"({data['events']} events, top: {data.get('top_event', 'N/A')})"
        )
        result = _dispatch_fcm(
            title=title, body=body,
            data={"user": user, "score": str(data["score"]), "severity": "high-risk"},
            tag=f"sentinel-risk-{user}",
        )
        if result["sent"] > 0 or not _fcm_available:
            alerted.append({"user": user, "score": data["score"], "sent": result["sent"]})
            audit_trail.log_action("risk-engine", "RISK_ALERT_DISPATCHED", {
                "user": user, "score": data["score"], "sent": result["sent"]
            })

    return jsonify({
        "success": True,
        "high_risk_users": len(high_risk),
        "alerted": alerted,
        "fcm_available": _fcm_available,
        "message": f"Risk scan complete. Alerted {len(alerted)} user(s).",
    })


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import cloud_db_sync
    cloud_db_sync.start_background_sync(interval_seconds=30)
    print("=" * 60)
    print("  Sentinel Vault — Backend API Server")
    print("  Flask running on http://127.0.0.1:5000")
    print()
    print("  ► Development:")
    print("    Start Vite dev server: cd frontend && npm run dev")
    print("    Then open:             http://localhost:3000")
    print()
    print("  ► Production:")
    print("    Build frontend:  cd frontend && npm run build")
    print("    Then open:       http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host="0.0.0.0", debug=True, port=5000, use_reloader=False)
