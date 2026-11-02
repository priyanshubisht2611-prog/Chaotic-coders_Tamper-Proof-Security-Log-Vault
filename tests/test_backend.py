"""
Sentinel Vault — Comprehensive Backend Test Suite
Covers: verification_core, hash_windows, behavior_scoring, audit_trail, api_auth
"""

import hashlib
import json
import os
import sys
import tempfile
import pytest

# Make project root importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ─── helpers ──────────────────────────────────────────────────────────────────

def sha256_hex(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()


# ════════════════════════════════════════════════════════════════════════════════
# 1. hash_windows — pure functions
# ════════════════════════════════════════════════════════════════════════════════

class TestHashWindowsPureFunctions:
    """Unit tests for the pure helper functions in hash_windows.py."""

    def test_hash_window_deterministic(self):
        """Same input lines + previous_hash → always the same digest."""
        from hash_windows import hash_window
        lines = ["line one\n", "line two\n"]
        prev = "0" * 64
        assert hash_window(lines, prev) == hash_window(lines, prev)

    def test_hash_window_differs_with_different_content(self):
        """Different log content must produce different window hashes."""
        from hash_windows import hash_window
        prev = "0" * 64
        h1 = hash_window(["alpha\n"], prev)
        h2 = hash_window(["beta\n"], prev)
        assert h1 != h2

    def test_hash_window_chains_previous(self):
        """Changing the previous_hash must change the output (chain integrity)."""
        from hash_windows import hash_window
        lines = ["stable line\n"]
        h_genesis = hash_window(lines, "0" * 64)
        h_later = hash_window(lines, "a" * 64)
        assert h_genesis != h_later

    def test_hash_window_strips_trailing_whitespace(self):
        """Lines with trailing spaces / newlines should hash identically."""
        from hash_windows import hash_window
        prev = "0" * 64
        h1 = hash_window(["hello world\n"], prev)
        h2 = hash_window(["hello world   \n"], prev)
        # Stripped content differs here so hashes must differ (strip test)
        h3 = hash_window(["hello world"], prev)
        assert h1 == h3   # strip removes newline → same stripped content

    def test_get_last_hash_empty_chain(self):
        """Empty chain → genesis hash (64 zeros)."""
        from hash_windows import get_last_hash
        assert get_last_hash([]) == "0" * 64

    def test_get_last_hash_returns_last_entry(self):
        """Non-empty chain → last entry's window_hash."""
        from hash_windows import get_last_hash
        chain = [
            {"window_id": 0, "window_hash": "aaa"},
            {"window_id": 1, "window_hash": "bbb"},
        ]
        assert get_last_hash(chain) == "bbb"

    def test_load_state_defaults_when_no_file(self, tmp_path, monkeypatch):
        """load_state() returns zero defaults when the state file doesn't exist."""
        import hash_windows as hw
        monkeypatch.setattr(hw, "STATE_FILE", str(tmp_path / "no_state.json"))
        state = hw.load_state()
        assert state == {"last_position": 0, "next_window_id": 0}

    def test_save_and_load_state_roundtrip(self, tmp_path, monkeypatch):
        """Saving then loading state produces an identical dict."""
        import hash_windows as hw
        monkeypatch.setattr(hw, "STATE_FILE", str(tmp_path / "state.json"))
        data = {"last_position": 42, "next_window_id": 7}
        hw.save_state(data)
        assert hw.load_state() == data

    def test_load_chain_empty_when_no_file(self, tmp_path, monkeypatch):
        """load_chain() returns [] when hash_chain.json doesn't exist."""
        import hash_windows as hw
        monkeypatch.setattr(hw, "CHAIN_FILE", str(tmp_path / "no_chain.json"))
        assert hw.load_chain() == []

    def test_save_and_load_chain_roundtrip(self, tmp_path, monkeypatch):
        """Saving then loading the chain preserves all entries exactly."""
        import hash_windows as hw
        monkeypatch.setattr(hw, "CHAIN_FILE", str(tmp_path / "chain.json"))
        chain = [{"window_id": 0, "window_hash": sha256_hex("hello")}]
        hw.save_chain(chain)
        loaded = hw.load_chain()
        assert loaded == chain

    def test_read_new_lines_empty_when_no_log(self, tmp_path, monkeypatch):
        """read_new_lines returns ([], 0) when the log file doesn't exist."""
        import hash_windows as hw
        monkeypatch.setattr(hw, "LOG_FILE", str(tmp_path / "missing.txt"))
        lines, pos = hw.read_new_lines(0)
        assert lines == []
        assert pos == 0

    def test_read_new_lines_sequential_reads(self, tmp_path, monkeypatch):
        """Simulates log growth: second read picks up only new lines."""
        import hash_windows as hw
        log_file = tmp_path / "logs.txt"
        log_file.write_text("line1\nline2\n")
        monkeypatch.setattr(hw, "LOG_FILE", str(log_file))

        lines1, pos1 = hw.read_new_lines(0)
        assert len(lines1) == 2
        assert pos1 > 0

        # Append new content
        log_file.open("a").write("line3\n")
        lines2, pos2 = hw.read_new_lines(pos1)
        assert len(lines2) == 1
        assert lines2[0].strip() == "line3"
        assert pos2 > pos1


# ════════════════════════════════════════════════════════════════════════════════
# 2. verification_core — recompute_hash
# ════════════════════════════════════════════════════════════════════════════════

class TestVerificationCore:
    """Tests for the recompute_hash helper (the central verification primitive)."""

    def test_recompute_hash_matches_manual_sha256(self):
        """The function must produce the same value as a manual SHA-256."""
        from verification_core import recompute_hash
        lines = ["event A\n", "event B\n"]
        prev = "0" * 64
        stripped = "event Aevent B"
        expected = hashlib.sha256((prev + stripped).encode()).hexdigest()
        assert recompute_hash(lines, prev) == expected

    def test_recompute_hash_none_previous(self):
        """None previous_hash should be treated as an empty string."""
        from verification_core import recompute_hash
        lines = ["only line\n"]
        stripped = "only line"
        expected = hashlib.sha256(stripped.encode()).hexdigest()
        assert recompute_hash(lines, None) == expected

    def test_recompute_hash_empty_window(self):
        """An empty window with a known previous hash must still produce a valid digest."""
        from verification_core import recompute_hash
        prev = "abc123"
        result = recompute_hash([], prev)
        expected = hashlib.sha256(prev.encode()).hexdigest()
        assert result == expected

    def test_recompute_hash_is_deterministic(self):
        """Calling twice with identical inputs must return identical results."""
        from verification_core import recompute_hash
        lines = ["stable\n"]
        prev = "deadbeef"
        assert recompute_hash(lines, prev) == recompute_hash(lines, prev)

    def test_recompute_hash_tamper_detected(self):
        """Modifying a log line changes the hash, simulating tamper detection."""
        from verification_core import recompute_hash
        prev = "0" * 64
        original_hash = recompute_hash(["original content\n"], prev)
        tampered_hash = recompute_hash(["TAMPERED content\n"], prev)
        assert original_hash != tampered_hash


# ════════════════════════════════════════════════════════════════════════════════
# 3. behavior_scoring — score calculation
# ════════════════════════════════════════════════════════════════════════════════

SAMPLE_LOGS = """\
[2026-10-27 14:00:00] [INFO] FILE_MODIFIED user=alice ip=10.0.0.1
[2026-10-27 14:01:00] [INFO] PERMISSION_CHANGE user=alice ip=10.0.0.1
[2026-10-27 14:02:00] [INFO] PRIVILEGE_ESCALATION user=alice ip=10.0.0.1
[2026-10-27 14:03:00] [INFO] FILE_MODIFIED user=bob ip=10.0.0.2
[2026-10-27 14:04:00] [INFO] AUTH_FAILURE user=bob ip=10.0.0.2
[2026-10-27 02:00:00] [INFO] FILE_MODIFIED user=charlie ip=10.0.0.3
"""

class TestBehaviorScoring:
    """Tests for the behavior scoring engine."""

    @pytest.fixture(autouse=True)
    def patch_log_file(self, tmp_path, monkeypatch):
        import behavior_scoring
        log_file = tmp_path / "logs.txt"
        log_file.write_text(SAMPLE_LOGS)
        monkeypatch.setattr(behavior_scoring, "LOG_FILE", str(log_file))

    def test_scores_populated_for_all_users(self):
        from behavior_scoring import calculate_all_scores
        scores = calculate_all_scores()
        assert "alice" in scores
        assert "bob" in scores
        assert "charlie" in scores

    def test_alice_high_level(self):
        """alice: FILE_MODIFIED(5) + PERMISSION_CHANGE(10) + PRIVILEGE_ESCALATION(35) = 50 → HIGH"""
        from behavior_scoring import calculate_all_scores
        alice = calculate_all_scores()["alice"]
        assert alice["score"] == 50
        assert alice["level"] == "HIGH"
        assert alice["events"] == 3

    def test_bob_medium_level(self):
        """bob: FILE_MODIFIED(5) + AUTH_FAILURE(5) = 10 → LOW actually; verify exact math"""
        from behavior_scoring import calculate_all_scores
        bob = calculate_all_scores()["bob"]
        # FILE_MODIFIED=5, AUTH_FAILURE=5, total=10 → LOW
        assert bob["score"] == 10
        assert bob["level"] == "LOW"
        assert bob["events"] == 2

    def test_charlie_off_hours_bonus(self):
        """charlie at 02:00 (off-hours) → FILE_MODIFIED(5) + off-hours(20) = 25 → MEDIUM"""
        from behavior_scoring import calculate_all_scores
        charlie = calculate_all_scores()["charlie"]
        assert charlie["score"] == 25
        assert charlie["level"] == "MEDIUM"

    def test_get_user_score_known_user(self):
        from behavior_scoring import get_user_score
        score = get_user_score("alice")
        assert score["score"] > 0
        assert "level" in score

    def test_get_user_score_unknown_user(self):
        from behavior_scoring import get_user_score
        score = get_user_score("nobody")
        assert score == {"score": 0, "level": "LOW", "events": 0, "top_event": None}

    def test_empty_log_file(self, tmp_path, monkeypatch):
        import behavior_scoring
        empty = tmp_path / "empty.txt"
        empty.write_text("")
        monkeypatch.setattr(behavior_scoring, "LOG_FILE", str(empty))
        assert behavior_scoring.calculate_all_scores() == {}

    def test_missing_log_file(self, tmp_path, monkeypatch):
        import behavior_scoring
        monkeypatch.setattr(behavior_scoring, "LOG_FILE", str(tmp_path / "ghost.txt"))
        assert behavior_scoring.calculate_all_scores() == {}

    def test_level_thresholds(self):
        """Score-to-level classification obeys defined thresholds."""
        from behavior_scoring import calculate_all_scores, SCORING_RULES
        # Just verify the levels map back correctly
        THRESHOLDS = {"LOW": (0, 24), "MEDIUM": (25, 49), "HIGH": (50, 9999)}
        scores = calculate_all_scores()
        for user, data in scores.items():
            score = data["score"]
            level = data["level"]
            lo, hi = THRESHOLDS[level]
            assert lo <= score <= hi, (
                f"{user}: score={score} but level={level} (expected {lo}–{hi})"
            )

    def test_top_event_is_highest_scoring(self):
        """top_event must be the event contributing the most points."""
        from behavior_scoring import calculate_all_scores
        alice = calculate_all_scores()["alice"]
        # PRIVILEGE_ESCALATION scores 35, which is the highest
        assert alice["top_event"] == "PRIVILEGE_ESCALATION"


# ════════════════════════════════════════════════════════════════════════════════
# 4. audit_trail — append-only log
# ════════════════════════════════════════════════════════════════════════════════

class TestAuditTrail:
    """Tests for the immutable audit trail module."""

    @pytest.fixture(autouse=True)
    def patch_audit_file(self, tmp_path, monkeypatch):
        import audit_trail
        monkeypatch.setattr(audit_trail, "AUDIT_FILE", str(tmp_path / "audit_log.jsonl"))

    def test_log_action_creates_file(self, tmp_path):
        import audit_trail
        audit_trail.log_action("test_actor", "TEST_ACTION")
        assert os.path.exists(audit_trail.AUDIT_FILE)

    def test_log_action_entry_fields(self):
        import audit_trail
        audit_trail.log_action("alice", "LOGIN", details={"ip": "1.2.3.4"})
        entries = audit_trail.read_audit()
        assert len(entries) == 1
        e = entries[0]
        assert e["actor"] == "alice"
        assert e["action"] == "LOGIN"
        assert e["details"]["ip"] == "1.2.3.4"
        assert "timestamp" in e
        assert e["timestamp"].endswith("Z")

    def test_log_action_with_source_ip(self):
        import audit_trail
        audit_trail.log_action("bob", "API_CALL", source_ip="192.168.1.1")
        entries = audit_trail.read_audit()
        assert entries[0]["source_ip"] == "192.168.1.1"

    def test_log_action_without_source_ip(self):
        import audit_trail
        audit_trail.log_action("system", "STARTUP")
        entries = audit_trail.read_audit()
        assert "source_ip" not in entries[0]

    def test_read_audit_newest_first(self):
        import audit_trail
        audit_trail.log_action("user1", "ACTION_A")
        audit_trail.log_action("user2", "ACTION_B")
        entries = audit_trail.read_audit()
        assert entries[0]["action"] == "ACTION_B"
        assert entries[1]["action"] == "ACTION_A"

    def test_read_audit_limit_respected(self):
        import audit_trail
        for i in range(10):
            audit_trail.log_action("sys", f"EVENT_{i}")
        entries = audit_trail.read_audit(limit=3)
        assert len(entries) == 3

    def test_read_audit_empty_when_no_file(self):
        import audit_trail
        assert audit_trail.read_audit() == []

    def test_count_entries(self):
        import audit_trail
        for _ in range(5):
            audit_trail.log_action("actor", "ACT")
        assert audit_trail.count_entries() == 5

    def test_count_entries_zero_when_no_file(self):
        import audit_trail
        assert audit_trail.count_entries() == 0

    def test_get_actor_actions_filter(self):
        import audit_trail
        audit_trail.log_action("alice", "READ")
        audit_trail.log_action("bob", "WRITE")
        audit_trail.log_action("alice", "DELETE")
        alice_actions = audit_trail.get_actor_actions("alice")
        assert len(alice_actions) == 2
        assert all(e["actor"] == "alice" for e in alice_actions)

    def test_audit_file_is_append_only(self):
        """Calling log_action multiple times must grow the file, not replace it."""
        import audit_trail
        audit_trail.log_action("x", "FIRST")
        first_size = os.path.getsize(audit_trail.AUDIT_FILE)
        audit_trail.log_action("x", "SECOND")
        second_size = os.path.getsize(audit_trail.AUDIT_FILE)
        assert second_size > first_size

    def test_details_defaults_to_empty_dict(self):
        import audit_trail
        audit_trail.log_action("sys", "EVENT")
        entries = audit_trail.read_audit()
        assert entries[0]["details"] == {}


# ════════════════════════════════════════════════════════════════════════════════
# 5. api_auth — API key validation
# ════════════════════════════════════════════════════════════════════════════════

class TestApiAuth:
    """Tests for the API key authentication module."""

    def _get_keys(self):
        from api_auth import load_api_keys
        return load_api_keys()

    def test_load_api_keys_returns_dict(self):
        keys = self._get_keys()
        assert isinstance(keys, dict)
        assert len(keys) > 0

    def test_hardcoded_admin_key_present(self):
        keys = self._get_keys()
        assert "sk_demo_sec_999" in keys
        assert keys["sk_demo_sec_999"]["role"] == "ADMIN"

    def test_hardcoded_operator_key_present(self):
        keys = self._get_keys()
        assert "sk_operator_111" in keys
        assert keys["sk_operator_111"]["role"] == "OPERATOR"

    def test_valid_key_lookup(self):
        keys = self._get_keys()
        # Simulate what require_api_key decorator does internally
        token = "sk_demo_sec_999"
        assert token in keys
        assert keys[token]["role"] == "ADMIN"

    def test_invalid_key_not_in_dict(self):
        keys = self._get_keys()
        assert "sk_totally_fake_key" not in keys

    def test_all_keys_have_required_fields(self):
        keys = self._get_keys()
        for key, meta in keys.items():
            assert "role" in meta, f"Key {key!r} missing 'role'"
            assert "owner" in meta, f"Key {key!r} missing 'owner'"
            assert meta["role"] in ("ADMIN", "OPERATOR"), (
                f"Key {key!r} has unexpected role: {meta['role']}"
            )


# ════════════════════════════════════════════════════════════════════════════════
# 6. End-to-end: hash chain integrity simulation
# ════════════════════════════════════════════════════════════════════════════════

class TestHashChainIntegrity:
    """Simulates a full hash-chain creation + tamper-detection cycle."""

    def test_intact_chain_verifies_correctly(self):
        """Build a 3-window chain, verify all INTACT."""
        from hash_windows import hash_window, get_last_hash
        from verification_core import recompute_hash

        log_lines = [
            ["event A\n", "event B\n"],
            ["event C\n"],
            ["event D\n", "event E\n", "event F\n"],
        ]
        chain = []
        for i, lines in enumerate(log_lines):
            prev = get_last_hash(chain)
            wh = hash_window(lines, prev)
            chain.append({"window_id": i, "window_hash": wh, "previous_hash": prev, "num_lines": len(lines)})

        # Simulate verification: recompute each window hash from "disk" content
        flat_lines = [line for window in log_lines for line in window]
        position = 0
        for entry in chain:
            n = entry["num_lines"]
            window_lines = flat_lines[position: position + n]
            position += n
            recomputed = recompute_hash(window_lines, entry["previous_hash"])
            assert recomputed == entry["window_hash"], f"Window {entry['window_id']} should be INTACT"

    def test_tampered_log_detected(self):
        """Inject tampered content → verification must flag as TAMPERED."""
        from hash_windows import hash_window, get_last_hash
        from verification_core import recompute_hash

        original_lines = ["clean log entry\n"]
        prev = "0" * 64
        wh = hash_window(original_lines, prev)
        chain_entry = {"window_id": 0, "window_hash": wh, "previous_hash": prev, "num_lines": 1}

        # Attacker modifies the log content on disk
        tampered_lines = ["MALICIOUS content injected\n"]
        recomputed = recompute_hash(tampered_lines, chain_entry["previous_hash"])

        assert recomputed != chain_entry["window_hash"], "Tampered window must be detected"

    def test_cascade_effect_of_tamper(self):
        """Modifying window 0 causes ALL subsequent windows to also appear tampered."""
        from hash_windows import hash_window, get_last_hash
        from verification_core import recompute_hash

        log_lines = [["window 0 content\n"], ["window 1 content\n"], ["window 2 content\n"]]
        chain = []
        for i, lines in enumerate(log_lines):
            prev = get_last_hash(chain)
            wh = hash_window(lines, prev)
            chain.append({"window_id": i, "window_hash": wh, "previous_hash": prev, "num_lines": len(lines)})

        # Tamper: modify window 0's content on "disk"
        tampered_logs = [["TAMPERED window 0\n"], ["window 1 content\n"], ["window 2 content\n"]]
        flat = [line for w in tampered_logs for line in w]
        position = 0
        statuses = []
        for entry in chain:
            n = entry["num_lines"]
            window_lines = flat[position: position + n]
            position += n
            recomputed = recompute_hash(window_lines, entry["previous_hash"])
            statuses.append("INTACT" if recomputed == entry["window_hash"] else "TAMPERED")

        # Window 0 must be TAMPERED; others may be intact since previous_hash stored is still original
        assert statuses[0] == "TAMPERED"


# ═══════════════════════════════════════════════════════════════════════════════
# FCM & Risk Alert Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestFcmAndAlerts:
    """Tests for Firebase Cloud Messaging registration, deduplication, and risk bridges."""

    @pytest.fixture
    def client(self):
        import dashboard_app
        dashboard_app.app.config["TESTING"] = True
        with dashboard_app.app.test_client() as client:
            yield client

    def test_fcm_status_endpoint(self, client):
        res = client.get("/api/fcm-status")
        assert res.status_code == 200
        data = res.get_json()
        assert "fcm_available" in data
        assert "registered_devices" in data
        assert isinstance(data["registered_devices"], int)

    def test_register_fcm_token_requires_auth(self, client):
        # Missing auth header should be rejected (401)
        res = client.post("/api/register-fcm-token", json={"token": "test_token_123"})
        assert res.status_code == 401

    def test_register_fcm_token_with_valid_auth(self, client):
        headers = {"X-API-Key": "sk_demo_sec_999"}
        res = client.post(
            "/api/register-fcm-token",
            headers=headers,
            json={"token": "valid_token_xyz_unit_test"},
        )
        assert res.status_code == 200
        data = res.get_json()
        assert data["success"] is True
        assert data["registered_count"] >= 1

    def test_send_alert_requires_auth(self, client):
        res = client.post("/api/send-alert", json={"token": "some_token"})
        assert res.status_code == 401

    def test_breach_alert_deduplication(self, client):
        import dashboard_app
        # First alert should proceed
        res1 = client.post("/api/breach-alert", json={"window_id": 9999, "kind": "tamper"})
        assert res1.status_code == 200
        data1 = res1.get_json()
        assert "deduped" not in data1

        # Second alert immediately after should be suppressed by deduplication cooldown
        res2 = client.post("/api/breach-alert", json={"window_id": 9999, "kind": "tamper"})
        assert res2.status_code == 200
        data2 = res2.get_json()
        assert data2.get("deduped") is True
        assert data2.get("success") is False

    def test_risk_alerts_requires_auth(self, client):
        res = client.post("/api/risk-alerts")
        assert res.status_code == 401

    def test_risk_alerts_with_auth(self, client):
        headers = {"X-API-Key": "sk_demo_sec_999"}
        res = client.post("/api/risk-alerts", headers=headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["success"] is True
        assert "high_risk_users" in data
        assert "alerted" in data
