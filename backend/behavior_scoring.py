"""
Sentinel Vault — User Behavior Scoring Engine

Scans logs.txt and assigns a numeric risk score to each user based on
rule-based pattern matching. The dashboard polls /api/user-scores to
show a live insider-threat heat map.

Score thresholds:
    0-24  → LOW   (green)
   25-49  → MEDIUM (amber)
   50+    → HIGH  (red)
"""
import re
from datetime import datetime

LOG_FILE = "logs.txt"

# ── scoring rules (action substring → points) ─────────────────────
SCORING_RULES = {
    "DB_BULK_DELETE": 30,
    "FILE_DELETE": 15,
    "DB_DELETE": 15,
    "AUTH_FAILURE": 5,
    "AUTH_LOCKOUT": 20,
    "PRIVILEGE_ESCALATION": 35,
    "PERMISSION_CHANGE": 10,
    "SECURITY_ALERT": 25,
    "MALWARE_DETECTED": 40,
    "INTRUSION_ATTEMPT": 40,
    "PORT_SCAN_DETECTED": 25,
    "SERVICE_CRASH": 15,
    "FILE_MODIFIED": 5,
}

# off-hours bonus (23:00–06:00)
OFF_HOURS_BONUS = 20

# regex to pull fields from a log line
LINE_RE = re.compile(
    r"\[(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]"
    r"\s+\[\w+\]\s+"
    r"(?P<event>\S+)"
    r"\s+user=(?P<user>\S+)"
    r"\s+ip=(?P<ip>\S+)"
)

# also handle old-format lines (without severity tag)
LINE_RE_OLD = re.compile(
    r"\[(?P<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]"
    r"\s+(?P<event>\S+)"
    r"\s+user=(?P<user>\S+)"
    r"\s+ip=(?P<ip>\S+)"
)


def _parse_line(line):
    m = LINE_RE.match(line)
    if not m:
        m = LINE_RE_OLD.match(line)
    return m


def calculate_all_scores():
    """Returns {username: {"score": int, "level": str, "events": int, "top_event": str}}"""
    scores = {}

    try:
        with open(LOG_FILE, "r") as f:
            for line in f:
                m = _parse_line(line.strip())
                if not m:
                    continue

                user = m.group("user")
                event = m.group("event")
                ts_str = m.group("ts")

                if user not in scores:
                    scores[user] = {"score": 0, "events": 0, "top_event": None, "top_score": 0}

                scores[user]["events"] += 1

                # rule-based scoring
                points = 0
                for pattern, pts in SCORING_RULES.items():
                    if pattern in event:
                        points += pts
                        break

                # off-hours check
                try:
                    hour = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S").hour
                    if hour >= 23 or hour < 6:
                        points += OFF_HOURS_BONUS
                except ValueError:
                    pass

                scores[user]["score"] += points
                if points > scores[user]["top_score"]:
                    scores[user]["top_score"] = points
                    scores[user]["top_event"] = event

    except FileNotFoundError:
        pass

    # compute alert levels
    result = {}
    for user, data in scores.items():
        score = data["score"]
        if score >= 50:
            level = "HIGH"
        elif score >= 25:
            level = "MEDIUM"
        else:
            level = "LOW"

        result[user] = {
            "score": score,
            "level": level,
            "events": data["events"],
            "top_event": data["top_event"],
        }

    return result


def get_user_score(user_id):
    """Get score for a single user."""
    all_scores = calculate_all_scores()
    return all_scores.get(user_id, {"score": 0, "level": "LOW", "events": 0, "top_event": None})
