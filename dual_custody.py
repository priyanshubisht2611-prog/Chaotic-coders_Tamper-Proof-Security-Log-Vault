"""
Sentinel Vault — Dual Custody Framework

Sensitive actions require approval from TWO different admins before they
are executed. This prevents a single compromised admin from silently
wiping evidence.

Sensitive actions:
  DELETE_LOGS, PURGE_WINDOWS, DISABLE_SECURITY, MODIFY_AUDIT,
  CHANGE_API_KEYS, EXPORT_DATA
"""
import json
import os
import uuid
from datetime import datetime

PENDING_FILE = "pending_approvals.json"

SENSITIVE_ACTIONS = [
    "DELETE_LOGS",
    "PURGE_WINDOWS",
    "DISABLE_SECURITY",
    "MODIFY_AUDIT",
    "CHANGE_API_KEYS",
    "EXPORT_DATA",
]


def _load_pending():
    if os.path.exists(PENDING_FILE):
        with open(PENDING_FILE, "r") as f:
            return json.load(f)
    return []


def _save_pending(pending):
    with open(PENDING_FILE, "w") as f:
        json.dump(pending, f, indent=2)


def is_sensitive(action):
    """Check if action requires dual custody."""
    return action.upper() in SENSITIVE_ACTIONS


def request_approval(requester_id, action, details=None):
    """Create an approval request. Returns the request object."""
    if not is_sensitive(action):
        return {"requires_approval": False, "message": "Not a sensitive action"}

    approval_id = str(uuid.uuid4())[:8]
    request_obj = {
        "id": approval_id,
        "requester": requester_id,
        "action": action.upper(),
        "details": details or {},
        "status": "PENDING",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    pending = _load_pending()
    pending.append(request_obj)
    _save_pending(pending)

    return {
        "requires_approval": True,
        "approval_id": approval_id,
        "status": "PENDING",
        "message": f"Action '{action}' needs a second admin to approve.",
    }


def approve_action(approval_id, approver_id):
    """Second admin approves a pending action."""
    pending = _load_pending()

    target = None
    for i, item in enumerate(pending):
        if item["id"] == approval_id:
            target = pending.pop(i)
            break

    if target is None:
        return {"error": "Approval ID not found"}

    if target["requester"] == approver_id:
        pending.append(target)  # put it back
        _save_pending(pending)
        return {"error": "Cannot approve your own request — need a DIFFERENT admin"}

    target["status"] = "APPROVED"
    target["approver"] = approver_id
    target["approved_at"] = datetime.utcnow().isoformat() + "Z"

    _save_pending(pending)  # remove from pending list

    return {
        "status": "APPROVED",
        "action": target["action"],
        "requester": target["requester"],
        "approver": approver_id,
        "message": f"Action '{target['action']}' approved and executed.",
    }


def reject_action(approval_id, rejector_id):
    """Reject a pending action."""
    pending = _load_pending()

    for i, item in enumerate(pending):
        if item["id"] == approval_id:
            item["status"] = "REJECTED"
            item["rejector"] = rejector_id
            item["rejected_at"] = datetime.utcnow().isoformat() + "Z"
            pending.pop(i)
            _save_pending(pending)
            return {"status": "REJECTED", "action": item["action"]}

    return {"error": "Approval ID not found"}


def get_pending():
    """List all pending approvals."""
    pending = _load_pending()
    return [p for p in pending if p.get("status") == "PENDING"]
