import socket
import sys
import json
from threading import Thread

# Shared list to store findings
results = []

def scan_port(ip, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex((ip, port))
        if result == 0:
            # Storing as a dictionary for JSON conversion
            results.append({"port": port, "status": "open"})
        sock.close()
    except Exception:
        pass

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    target_ip = sys.argv[1]
    # Standard ports for a security audit
    ports_to_scan = [21, 22, 23, 80, 443, 3306, 8080]
    threads = []

    for p in ports_to_scan:
        t = Thread(target=scan_port, args=(target_ip, p))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()
        
    # Output ONLY valid JSON so the API can parse it perfectly
    print(json.dumps({"target": target_ip, "findings": results}))