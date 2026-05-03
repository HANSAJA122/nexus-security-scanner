import socket
import sys
import json
from threading import Thread

# Maps ports to service names for logic processing
PORT_MAP = {
    21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 
    80: "http", 443: "https", 3306: "mysql", 5432: "postgresql", 
    8080: "http-proxy"
}

results = []

def get_banner(sock, port):
    try:
        # Some services (like HTTP) need a request to send a banner
        if port in [80, 443, 8080]:
            sock.send(b"HEAD / HTTP/1.1\r\nHost: localhost\r\n\r\n")
        
        # Grab the first 1024 bytes of the response
        banner = sock.recv(1024).decode('utf-8', errors='ignore').strip()
        # Return a cleaned up version of the banner
        return banner.split('\n')[0][:100] 
    except:
        return "No banner detected"

def scan_port(ip, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2.0) # Longer timeout to allow for banner response
        result = sock.connect_ex((ip, port))
        
        if result == 0:
            banner = get_banner(sock, port)
            service = PORT_MAP.get(port, "unknown")
            results.append({
                "port": port,
                "status": "open",
                "service": service,
                "banner": banner
            })
        sock.close()
    except:
        pass

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    target_ip = sys.argv[1]
    ports_to_scan = [21, 22, 23, 80, 443, 3306, 5432, 8080]
    threads = []

    for p in ports_to_scan:
        t = Thread(target=scan_port, args=(target_ip, p))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()
        
    print(json.dumps({"target": target_ip, "findings": results}))