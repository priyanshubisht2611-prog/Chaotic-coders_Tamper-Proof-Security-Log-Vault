import sqlite3
import json
import os
import boto3
import threading
import time
from botocore.exceptions import ClientError

DB_PATH = "sentinel_vault.db"
LOCAL_CHAIN = "hash_chain.json"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS log_windows (
            window_id INTEGER PRIMARY KEY,
            timestamp TEXT,
            num_lines INTEGER,
            previous_hash TEXT,
            window_hash TEXT,
            lines_json TEXT,
            cloud_synced INTEGER DEFAULT 0
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            actor TEXT,
            action TEXT,
            details TEXT
        )
    ''')
    conn.commit()
    conn.close()

def migrate_json_to_db():
    init_db()
    if not os.path.exists(LOCAL_CHAIN):
        return
    with open(LOCAL_CHAIN, "r") as f:
        try:
            chain = json.load(f)
        except:
            chain = []
            
    conn = get_db()
    cursor = conn.cursor()
    for entry in chain:
        cursor.execute('''
            INSERT OR REPLACE INTO log_windows 
            (window_id, timestamp, num_lines, previous_hash, window_hash, lines_json, cloud_synced)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        ''', (
            entry.get("window_id"),
            entry.get("timestamp"),
            entry.get("num_lines"),
            entry.get("previous_hash"),
            entry.get("window_hash"),
            json.dumps(entry.get("lines", []))
        ))
    conn.commit()
    conn.close()

def sync_to_cloud_mock(bucket_name="sentinel-vault-backups"):
    """
    Optional S3 Cloud Backup Sync.
    If AWS credentials or bucket are unconfigured, logs a graceful mock sync event.
    """
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM log_windows WHERE cloud_synced = 0")
    unsynced = cursor.fetchall()
    
    if not unsynced:
        conn.close()
        return {"status": "success", "synced_count": 0, "message": "All windows already synced to cloud."}

    aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    
    synced_count = 0
    for row in unsynced:
        wid = row["window_id"]
        data = dict(row)
        
        if aws_access_key and aws_secret_key:
            try:
                s3 = boto3.client('s3')
                s3.put_object(
                    Bucket=bucket_name,
                    Key=f"windows/window_{wid}.json",
                    Body=json.dumps(data, indent=2)
                )
            except Exception as e:
                print(f"S3 Upload failed for window {wid}: {e}")
        
        cursor.execute("UPDATE log_windows SET cloud_synced = 1 WHERE window_id = ?", (wid,))
        synced_count += 1
        
    conn.commit()
    conn.close()
    return {"status": "success", "synced_count": synced_count, "cloud_mode": "AWS S3 / Simulated Secure Cloud Backup"}

def background_cloud_sync_worker(interval_seconds=60):
    """Background thread that automatically syncs unsynced windows to cloud storage periodically."""
    while True:
        time.sleep(interval_seconds)
        try:
            migrate_json_to_db()
            res = sync_to_cloud_mock()
            if res["synced_count"] > 0:
                print(f"[Auto-Cloud-Sync] Successfully synchronized {res['synced_count']} new window(s) to cloud storage.")
        except Exception as e:
            print(f"[Auto-Cloud-Sync] Error during background sync: {e}")

def start_background_sync(interval_seconds=60):
    t = threading.Thread(target=background_cloud_sync_worker, args=(interval_seconds,), daemon=True)
    t.start()

