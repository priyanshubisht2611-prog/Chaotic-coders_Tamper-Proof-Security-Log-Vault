import random
import time
from datetime import datetime
from faker import Faker

fake = Faker()

LOG_FILE = "logs.txt"

EVENT_TYPES = [
    "AUTH_SUCCESS",
    "AUTH_FAILURE",
    "AUTH_MFA_VERIFY",
    "AUTH_LOCKOUT",
    "FILE_ACCESS",
    "FILE_MODIFIED",
    "FILE_DELETE",
    "FILE_DOWNLOAD",
    "PERMISSION_CHANGE",
    "PRIVILEGE_ESCALATION",
    "NETWORK_ALLOWED",
    "NETWORK_BLOCKED",
    "PORT_SCAN_DETECTED",
    "DB_QUERY",
    "DB_DELETE",
    "DB_BULK_DELETE",
    "SYSTEM_STARTUP",
    "SYSTEM_SHUTDOWN",
    "SERVICE_CRASH",
    "SECURITY_ALERT",
    "MALWARE_DETECTED",
    "INTRUSION_ATTEMPT",
]

SEVERITY = {
    "AUTH_SUCCESS": "INFO",
    "AUTH_FAILURE": "WARN",
    "AUTH_MFA_VERIFY": "INFO",
    "AUTH_LOCKOUT": "HIGH",
    "FILE_ACCESS": "INFO",
    "FILE_MODIFIED": "WARN",
    "FILE_DELETE": "WARN",
    "FILE_DOWNLOAD": "INFO",
    "PERMISSION_CHANGE": "WARN",
    "PRIVILEGE_ESCALATION": "HIGH",
    "NETWORK_ALLOWED": "INFO",
    "NETWORK_BLOCKED": "WARN",
    "PORT_SCAN_DETECTED": "HIGH",
    "DB_QUERY": "INFO",
    "DB_DELETE": "WARN",
    "DB_BULK_DELETE": "HIGH",
    "SYSTEM_STARTUP": "INFO",
    "SYSTEM_SHUTDOWN": "INFO",
    "SERVICE_CRASH": "HIGH",
    "SECURITY_ALERT": "HIGH",
    "MALWARE_DETECTED": "CRITICAL",
    "INTRUSION_ATTEMPT": "CRITICAL",
}

def generate_log_line():
    event = random.choice(EVENT_TYPES)
    ip = fake.ipv4()
    user = fake.user_name()
    severity = SEVERITY.get(event, "INFO")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] [{severity}] {event} user={user} ip={ip}"
    return line

def main():
    print("Log generator started (22 event types). Press Ctrl+C to stop.")
    with open(LOG_FILE, "a") as f:
        while True:
            line = generate_log_line()
            print(line)
            f.write(line + "\n")
            f.flush()
            time.sleep(random.uniform(1, 3))

if __name__ == "__main__":
    main()
