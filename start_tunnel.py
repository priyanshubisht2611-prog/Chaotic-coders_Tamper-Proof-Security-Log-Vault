import subprocess
import re
import sys
import time

def run():
    print("Starting Cloudflare Tunnel to production Flask server on port 5000...")
    proc = subprocess.Popen(
        ["cloudflared.exe", "tunnel", "--url", "http://127.0.0.1:5000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    url = None
    for line in iter(proc.stdout.readline, ''):
        print(line, end='', flush=True)
        match = re.search(r'https://[a-zA-Z0-9.-]+\.trycloudflare\.com', line)
        if match:
            url = match.group(0)
            print(f"\n==========================================")
            print(f"  PRODUCTION CLOUDFLARE URL: {url}")
            print(f"==========================================\n", flush=True)
            with open("tunnel_url.txt", "w") as f:
                f.write(url)

    proc.wait()

if __name__ == "__main__":
    run()
