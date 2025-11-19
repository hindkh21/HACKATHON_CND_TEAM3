#!/usr/bin/env python3
"""
Test log generator - generates fake security logs for testing
Generates logs in CSV format matching the first line
"""
import time
import random
from datetime import datetime, timezone

# Attack types that will be detected
ATTACK_TYPES = [
    ("SQL injection attempt", "Suspicious payload"),
    ("XSS attempt", "XSS pattern detected"),
    ("Port scan detected", "Port scanning activity"),
    ("Brute force SSH", "Multiple failed SSH attempts"),
    ("DDoS attack", "High traffic volume"),
    ("Malware download", "Malicious file detected"),
    ("Unauthorized access", "Unauthorized endpoint access"),
]

# Actions
ACTIONS = ["ACCEPT", "REJECT", "DROP"]
PROTOCOLS = ["TCP", "UDP", "ICMP"]
FLAGS = ["SYN", "ACK", "FIN", "PSH", "RST", "URG", "R5"]

def generate_ip() -> str:
    """Generate a random IP address"""
    return f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 254)}"

def generate_log() -> str:
    """Generate a log line in CSV format matching the first line"""
    # Timestamp in ISO 8601 format
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Firewall ID (FW-A, FW-B, FW-C, etc.)
    fw_id = f"FW-{random.choice(['A', 'B', 'C', 'D', 'E'])}"

    # Source and destination IPs
    src_ip = generate_ip()
    dst_ip = generate_ip()

    # Ports
    src_port = random.randint(1024, 65535)
    dst_port = random.choice([80, 443, 22, 3389, 8080, 3306, 5432, 21])

    # Protocol
    protocol = random.choice(PROTOCOLS)

    # Action
    action = random.choice(ACTIONS)

    # Bytes (can be negative for some reason in the original)
    bytes_in = random.randint(-1000, 5000)
    bytes_out = random.randint(100, 10000)

    # Flag
    flag = random.choice(FLAGS)

    # Session ID (random alphanumeric)
    session_id = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=12))

    # Attack info (sometimes include attack patterns)
    if random.random() < 0.3:  # 30% chance of attack
        attack_type, message = random.choice(ATTACK_TYPES)
        status = "ALERT"
    else:
        message = "Normal traffic"
        status = "OK"

    # Additional flag
    additional = random.choice(["ACK", "SYN", "FIN", "PSH", ""])

    # Build CSV line matching the format:
    # timestamp,firewall_id,src_ip,dst_ip,src_port,dst_port,protocol,action,bytes_in,bytes_out,flag,session_id,,message,status,additional
    log = f"{timestamp},{fw_id},{src_ip},{dst_ip},{src_port},{dst_port},{protocol},{action},{bytes_in},{bytes_out},{flag},{session_id},,{message},{status},{additional}"

    return log

def main():
    """Generate logs continuously"""
    print("Starting log generator... (CTRL+C to stop)")
    print("Writing to app.log")

    try:
        with open("app.log", "a") as f:
            while True:
                log = generate_log()
                f.write(log + "\n")
                f.flush()
                print(log)

                # Random delay between 1-5 seconds
                time.sleep(random.uniform(1, 5))
    except KeyboardInterrupt:
        print("\nLog generator stopped")

if __name__ == "__main__":
    main()
