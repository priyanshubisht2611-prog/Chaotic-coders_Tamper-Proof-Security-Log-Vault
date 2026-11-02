import hashlib
import json
import time
import os
from datetime import datetime

LOG_FILE = "logs.txt"
CHAIN_FILE = "hash_chain.json"
STATE_FILE = "hash_state.json"   # remembers where we left off, even after a restart
WINDOW_SECONDS = 30   # testing ke liye 30 sec rakha hai, baad mein 300 (5 min) kar denge

def load_chain():
    if os.path.exists(CHAIN_FILE):
        with open(CHAIN_FILE, "r") as f:
            return json.load(f)
    return []

def save_chain(chain):
    with open(CHAIN_FILE, "w") as f:
        json.dump(chain, f, indent=2)

def load_state():
    """Remembers the exact byte position in logs.txt we last read up to,
    and the next window_id to use. This is what makes restarting this
    script safe — it picks up exactly where it left off instead of
    re-reading logs.txt from the beginning."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"last_position": 0, "next_window_id": 0}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)

def get_last_hash(chain):
    if len(chain) == 0:
        return "0" * 64   # genesis hash, pehli window ke liye
    return chain[-1]["window_hash"]

def read_new_lines(last_position):
    if not os.path.exists(LOG_FILE):
        return [], last_position
    with open(LOG_FILE, "r") as f:
        f.seek(last_position)
        lines = f.readlines()
        new_position = f.tell()
    return lines, new_position

def hash_window(lines, previous_hash):
    cleaned = [l.strip() for l in lines]
    combined = (previous_hash or "") + "".join(cleaned)
    return hashlib.sha256(combined.encode()).hexdigest()

def main():
    print(f"Hashing started. Window size = {WINDOW_SECONDS} seconds. Press Ctrl+C to stop.")
    chain = load_chain()
    state = load_state()
    last_position = state["last_position"]
    window_id = state["next_window_id"]

    if last_position > 0 or window_id > 0:
        print(f"Resuming from byte position {last_position}, next window will be #{window_id}.")

    while True:
        time.sleep(WINDOW_SECONDS)
        lines, last_position = read_new_lines(last_position)

        if not lines:
            print(f"Window {window_id}: no new logs, skipping.")
            save_state({"last_position": last_position, "next_window_id": window_id})
            continue

        previous_hash = get_last_hash(chain)
        window_hash = hash_window(lines, previous_hash)

        entry = {
            "window_id": window_id,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "num_lines": len(lines),
            "lines": [l.strip() for l in lines],
            "previous_hash": previous_hash,
            "window_hash": window_hash,
        }

        chain.append(entry)
        save_chain(chain)

        print(f"Window {window_id}: {len(lines)} lines hashed -> {window_hash[:16]}...")
        window_id += 1

        save_state({"last_position": last_position, "next_window_id": window_id})

if __name__ == "__main__":
    main()
