#!/usr/bin/env python3
"""
CAUA Health Monitor — 24/7 Server Watch
Detects crashes, restarts dev server, logs incidents
"""
import os
import sys
import subprocess
import requests
import time
import json
from datetime import datetime
from pathlib import Path

# Config
PORT = 3000
CHECK_INTERVAL = 5  # seconds
LOG_FILE = Path('logs/health-monitor.log')
CRASH_LOG = Path('logs/crashes.json')

# Ensure log directory exists
LOG_FILE.parent.mkdir(exist_ok=True)
CRASH_LOG.parent.mkdir(exist_ok=True)

def log(msg: str, level: str = "INFO"):
    """Log with timestamp"""
    ts = datetime.now().isoformat()
    line = f"[{ts}] [{level}] {msg}"
    print(line)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def is_server_alive() -> bool:
    """Check if dev server is responding"""
    try:
        resp = requests.get(f'http://localhost:{PORT}', timeout=3)
        return resp.status_code == 200
    except:
        return False

def kill_all_npm_processes():
    """Kill any existing npm processes"""
    try:
        if sys.platform == 'win32':
            os.system('taskkill /F /IM node.exe /T >nul 2>&1')
        else:
            os.system('pkill -f "npm run dev"')
        time.sleep(2)
        log("Killed existing npm processes", "WARN")
    except Exception as e:
        log(f"Error killing processes: {e}", "ERROR")

def start_dev_server():
    """Start the dev server in background"""
    try:
        log("Starting dev server...", "INFO")
        if sys.platform == 'win32':
            # Windows: use START command
            os.system('start /B npm run dev >logs/dev-server.log 2>&1')
        else:
            # Unix: use nohup
            os.system('nohup npm run dev >logs/dev-server.log 2>&1 &')

        time.sleep(8)  # Wait for server to start

        if is_server_alive():
            log(f"✓ Dev server started successfully on port {PORT}", "SUCCESS")
            return True
        else:
            log("Dev server failed to start", "ERROR")
            return False
    except Exception as e:
        log(f"Failed to start dev server: {e}", "ERROR")
        return False

def record_crash():
    """Record crash incident"""
    try:
        crashes = []
        if CRASH_LOG.exists():
            with open(CRASH_LOG, 'r', encoding='utf-8') as f:
                crashes = json.load(f)

        crashes.append({
            'timestamp': datetime.now().isoformat(),
            'port': PORT,
            'recovery_attempted': True
        })

        with open(CRASH_LOG, 'w', encoding='utf-8') as f:
            json.dump(crashes, f, indent=2)
    except Exception as e:
        log(f"Failed to record crash: {e}", "ERROR")

def monitor_loop():
    """Main monitoring loop"""
    consecutive_failures = 0

    log("=" * 60, "INFO")
    log("CAUA 24/7 Health Monitor Started", "INFO")
    log(f"Checking http://localhost:{PORT} every {CHECK_INTERVAL}s", "INFO")
    log("=" * 60, "INFO")

    # Initial server start
    start_dev_server()

    while True:
        try:
            if is_server_alive():
                consecutive_failures = 0
                # Quietly alive
                sys.stdout.write('.')
                sys.stdout.flush()
            else:
                consecutive_failures += 1
                log(f"Server DOWN (attempt {consecutive_failures})", "WARN")

                if consecutive_failures >= 2:
                    log("🚨 SERVER CRASHED — INITIATING RECOVERY", "CRITICAL")
                    record_crash()
                    kill_all_npm_processes()
                    start_dev_server()
                    consecutive_failures = 0

            time.sleep(CHECK_INTERVAL)

        except KeyboardInterrupt:
            log("Monitor stopped by user", "INFO")
            break
        except Exception as e:
            log(f"Monitor error: {e}", "ERROR")
            time.sleep(CHECK_INTERVAL)

if __name__ == '__main__':
    os.chdir(Path(__file__).parent.parent)  # cd to project root
    monitor_loop()
