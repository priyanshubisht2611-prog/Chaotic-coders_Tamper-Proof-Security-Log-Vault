"""
Sentinel Vault — Immutable Audit Trail

Logs every system action (API calls, attacks, verifications, admin actions)
to an append-only JSONL file. This is SEPARATE from the security event
logs — it tracks what the SYSTEM and its OPERATORS did, not what the
monitored infrastructure reported.

The audit file is never edited or truncated — only appended. This gives
judges a clear "who did what when" evidence chain.
"""
import json
import os
from datetime import datetime

AUDIT_FILE = "audit_log.jsonl"


def log_action(actor, action, details=None, source_ip=None):
    """Append one audit entry. Never edits or overwrites."""
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "actor": actor,
        "action": action,
        "details": details or {},
    }
    if source_ip:
        entry["source_ip"] = source_ip

    with open(AUDIT_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")


def read_audit(limit=100):
    """Read last N audit entries (newest first)."""
    entries = []
    if not os.path.exists(AUDIT_FILE):
        return entries

    with open(AUDIT_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    return list(reversed(entries[-limit:]))


def get_actor_actions(actor, limit=50):
    """Get all actions by specific actor."""
    all_entries = read_audit(limit * 10)
    return [e for e in all_entries if e.get("actor") == actor][:limit]


def count_entries():
    """Total audit entries."""
    if not os.path.exists(AUDIT_FILE):
        return 0
    with open(AUDIT_FILE, "r") as f:
        return sum(1 for line in f if line.strip())
