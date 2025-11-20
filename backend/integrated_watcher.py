import asyncio
import aiohttp
import os
import json
import logging
from typing import Dict, Any, Optional, Set
from datetime import datetime
import websockets
from websockets.asyncio.server import ServerConnection
import joblib
import xgboost as xgb
import pandas as pd
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

# ---------- CONFIGURATION ----------
LOG_PATH = os.getenv("LOG_PATH", "app.log")
MODEL_API_URL = os.getenv("MODEL_API_URL", "http://localhost:8000/analyze")
WEBSOCKET_HOST = os.getenv("WEBSOCKET_HOST", "0.0.0.0")
WEBSOCKET_PORT = int(os.getenv("WEBSOCKET_PORT", "9001"))
MODEL_API_KEY = os.getenv("MODEL_API_KEY")

CONCURRENCY = int(os.getenv("CONCURRENCY", "4"))
QUEUE_MAXSIZE = int(os.getenv("QUEUE_MAXSIZE", "1000"))
POLL_INTERVAL = float(os.getenv("POLL_INTERVAL", "0.2"))

MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))
INITIAL_BACKOFF = float(os.getenv("INITIAL_BACKOFF", "0.5"))

USE_LOCAL_MODEL = os.getenv("USE_LOCAL_MODEL", "true").lower() in ("1", "true", "yes")

# ---------- LOAD ML MODEL ----------
# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "xgboost_classifier_weighted")

logging.info("🧠 Chargement du modèle ML...")
try:
    ml_model = xgb.XGBClassifier()
    ml_model.load_model(os.path.join(MODEL_DIR, "xgboost_model.json"))
    vectorizer = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib"))
    label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.joblib"))
    logging.info("✅ Modèle ML chargé avec succès")
except Exception as e:
    logging.error(f"❌ Erreur lors du chargement du modèle: {e}")
    ml_model = None
    vectorizer = None
    label_encoder = None

# Global state
request_counter = 1
connected_clients: Set[ServerConnection] = set()
processed_log_hashes: Set[int] = set()  # Track processed log lines to avoid duplicates

# Bug type to category mapping
BUG_TYPE_CATEGORIES = {
    "sql_injection": "Sécurité",
    "xss": "Sécurité",
    "brut_force_ssh": "Sécurité",
    "malware_download": "Sécurité",
    "ddos": "Réseau",
    "port_scan": "Réseau",
    "unauthorized_access": "Accès",
    "performance_issue": "Performance",
    "validation_error": "Validation"
}

# ---------- WEBSOCKET SERVER ----------
async def broadcast_to_clients(message: Dict[str, Any]) -> None:
    """Broadcast a message to all connected WebSocket clients"""
    if not connected_clients:
        logging.debug("No connected clients to broadcast to")
        return

    message_json = json.dumps(message)
    disconnected = set()

    for client in connected_clients:
        try:
            await client.send(message_json)
        except websockets.exceptions.ConnectionClosed:
            disconnected.add(client)
        except Exception as e:
            logging.error(f"Error broadcasting to client: {e}")
            disconnected.add(client)

    for client in disconnected:
        connected_clients.discard(client)


async def handle_client_message(websocket: ServerConnection, message_str: str) -> None:
    """Handle incoming message from WebSocket client"""
    try:
        message = json.loads(message_str)
        message_type = message.get("type")

        if message_type == "apply_fix":
            data = message.get("data", {})
            request_index = data.get("request_index")
            firewall_id = data.get("firewall_id")

            logging.info(f"Received apply_fix request for #{request_index} - {firewall_id}")

            # Simulate fix application
            await asyncio.sleep(0.5)

            # Send success response
            response = {
                "type": "fix_applied",
                "data": {
                    "request_index": request_index,
                    "firewall_id": firewall_id,
                    "applied_at": datetime.now().isoformat()
                }
            }
            await broadcast_to_clients(response)

        elif message_type == "get_all_logs":
            logging.info("Received request to get all logs")

            # Read all logs from file
            all_logs = []
            if os.path.exists(LOG_PATH):
                try:
                    with open(LOG_PATH, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()

                    # Process each line
                    for idx, line in enumerate(lines, start=1):
                        line = line.strip()
                        if not line:
                            continue

                        # Analyze the log line using ML model
                        analysis = predict_log(line)
                        if analysis and "bug_type" in analysis:
                            log_entry = {
                                "index": idx,
                                "firewall_id": f"FW-{(idx % 10) + 1:03d}",
                                "timestamp": datetime.now().isoformat(),
                                "type": BUG_TYPE_CATEGORIES.get(analysis["bug_type"], "Autre"),
                                "bug_type": analysis.get("bug_type", "unknown"),
                                "severity": analysis.get("severity", "faible"),
                                "raw_log": analysis.get("raw_log", line),  # Include raw log for LLM analysis
                                "explanation": None,  # Will be generated by frontend LLM
                                "fix_proposal": None  # Will be generated by frontend LLM
                            }

                            # Add priority if available
                            if "priority" in analysis:
                                log_entry["priority"] = analysis["priority"]

                            all_logs.append(log_entry)

                    # Send response with all logs
                    response = {
                        "type": "all_logs_response",
                        "data": {
                            "logs": all_logs,
                            "total": len(all_logs)
                        }
                    }
                    await websocket.send(json.dumps(response))
                    logging.info(f"Sent {len(all_logs)} historical logs to client")

                except Exception as e:
                    logging.error(f"Error reading log file: {e}")
                    error_response = {
                        "type": "all_logs_error",
                        "data": {"error": str(e)}
                    }
                    await websocket.send(json.dumps(error_response))
            else:
                # No log file exists
                response = {
                    "type": "all_logs_response",
                    "data": {
                        "logs": [],
                        "total": 0
                    }
                }
                await websocket.send(json.dumps(response))

        else:
            logging.warning(f"Unknown message type: {message_type}")

    except json.JSONDecodeError as e:
        logging.error(f"Invalid JSON received: {e}")
    except Exception as e:
        logging.exception(f"Error handling client message: {e}")


async def handle_websocket_connection(websocket: ServerConnection) -> None:
    """Handle new WebSocket connection"""
    connected_clients.add(websocket)
    client_address = websocket.remote_address
    logging.info(f"WebSocket client connected from {client_address}. Total: {len(connected_clients)}")

    try:
        async for message in websocket:
            await handle_client_message(websocket, message)
    except websockets.exceptions.ConnectionClosed:
        logging.info(f"WebSocket client {client_address} disconnected")
    except Exception as e:
        logging.exception(f"WebSocket error for {client_address}: {e}")
    finally:
        connected_clients.discard(websocket)
        logging.info(f"WebSocket client {client_address} removed. Total: {len(connected_clients)}")


# ---------- ML PREDICTION ----------
def predict_log(log_line: str) -> Optional[Dict[str, Any]]:
    """
    Use ML model to predict if log line is an attack
    Returns None if it's normal traffic, or attack details with raw log if detected
    """
    if ml_model is None or vectorizer is None or label_encoder is None:
        logging.warning("ML model not loaded, falling back to pattern matching")
        return local_model_analyze(log_line)

    try:
        # Parse CSV log format
        # Format: timestamp,firewall_id,src_ip,dst_ip,src_port,dst_port,protocol,action,bytes_in,bytes_out,flag,session_id,,message,status,additional
        parts = log_line.split(",")
        if len(parts) < 15:
            return None

        # Extract relevant fields
        log_data = {
            "src_ip": parts[2].strip(),
            "dst_ip": parts[3].strip(),
            "dst_port": parts[5].strip(),
            "protocol": parts[6].strip(),
            "action": parts[7].strip(),
            "explanation": parts[13].strip(),
            "status": parts[14].strip() if len(parts) > 14 else "",
            "attack_type": "",
            "rule_id": "",
            "reason": ""
        }

        # Build text for vectorization
        cols = ["explanation", "attack_type", "rule_id", "reason", "src_ip", "dst_ip", "dst_port", "protocol", "action", "status"]
        text_parts = []
        for col in cols:
            val = log_data.get(col, "")
            if val and str(val).strip():
                text_parts.append(str(val))
        text = " ".join(text_parts)

        # Vectorize
        vectorized = vectorizer.transform([text])

        # Predict
        probs = ml_model.predict_proba(vectorized)[0]
        pred_idx = np.argmax(probs)
        pred_label = label_encoder.inverse_transform([pred_idx])[0]
        confidence = probs[pred_idx]

        # Only return if it's an attack (not "Normal")
        if pred_label.lower() in ["normal", "ok", "benign"]:
            return None

        # Map prediction to bug type
        bug_type_mapping = {
            "sql_injection": "sql_injection",
            "xss": "xss",
            "brute_force": "brut_force_ssh",
            "brut_force_ssh": "brut_force_ssh",
            "port_scan": "port_scan",
            "malware": "malware_download",
            "ddos": "ddos",
            "unauthorized": "unauthorized_access",
            "unauthorized_access": "unauthorized_access",
            # Handle priority labels from model (bug_* or attack_*)
            "bug_high": "unauthorized_access",
            "bug_medium": "port_scan",
            "bug_low": "port_scan",
            "attack_high": "unauthorized_access",
            "attack_medium": "port_scan",
            "attack_low": "port_scan"
        }

        pred_label_lower = pred_label.lower()
        bug_type = bug_type_mapping.get(pred_label_lower, pred_label_lower)

        # Extract priority if pred_label contains priority indicators
        priority = None
        if "high" in pred_label_lower and ("bug" in pred_label_lower or "attack" in pred_label_lower):
            priority = "high"
        elif "medium" in pred_label_lower and ("bug" in pred_label_lower or "attack" in pred_label_lower):
            priority = "medium"
        elif "low" in pred_label_lower and ("bug" in pred_label_lower or "attack" in pred_label_lower):
            priority = "low"

        # If we got a generic attack label (attack_high/medium/low or unmapped), try pattern matching
        is_generic = ("attack" in pred_label_lower or "bug" in pred_label_lower) and ("high" in pred_label_lower or "medium" in pred_label_lower or "low" in pred_label_lower)
        if is_generic or bug_type not in ["sql_injection", "xss", "brut_force_ssh", "port_scan", "malware_download", "ddos", "unauthorized_access"]:
            # Try pattern matching to get specific attack type
            pattern_result = local_model_analyze(log_line)
            if pattern_result and pattern_result.get("bug_type"):
                # Use the more specific type from pattern matching
                bug_type = pattern_result["bug_type"]
                # Keep ML severity and priority
            else:
                # Still generic, try to infer from log message
                message = parts[13].strip().lower() if len(parts) > 13 else ""
                if "sql" in message or "injection" in message or "suspicious payload" in message:
                    bug_type = "sql_injection"
                elif "xss" in message or "script" in message:
                    bug_type = "xss"
                elif "brute" in message or "failed" in message or "ssh" in message:
                    bug_type = "brut_force_ssh"
                elif "scan" in message or "port" in message:
                    bug_type = "port_scan"
                elif "malware" in message or "malicious" in message or "virus" in message:
                    bug_type = "malware_download"
                elif "ddos" in message or "traffic" in message or "flood" in message:
                    bug_type = "ddos"
                elif "unauthorized" in message or "forbidden" in message or "access" in message:
                    bug_type = "unauthorized_access"

        # Severity based on bug type and confidence
        # Define severity by attack type
        severity_by_type = {
            "sql_injection": "élevé",
            "brut_force_ssh": "élevé",
            "ddos": "élevé",
            "malware_download": "élevé",
            "unauthorized_access": "élevé",
            "xss": "moyen",
            "port_scan": "faible"
        }

        # Get base severity from attack type
        severity = severity_by_type.get(bug_type, "moyen")

        # Adjust based on confidence - if confidence is very low, downgrade severity
        if confidence < 0.5:
            if severity == "élevé":
                severity = "moyen"
            elif severity == "moyen":
                severity = "faible"

        # Return attack info with raw log line for LLM processing
        result = {
            "bug_type": bug_type,
            "severity": severity,
            "raw_log": log_line,  # Send raw log to frontend for LLM analysis
            "confidence": f"{confidence:.2%}",
            "ml_prediction": pred_label,  # Keep ML prediction for reference
            "src_ip": log_data.get("src_ip"),
            "dst_ip": log_data.get("dst_ip"),
            "src_port": parts[4].strip() if len(parts) > 4 else None,  # Extract src_port
            "dst_port": log_data.get("dst_port")
        }

        # Add priority if detected
        if priority:
            result["priority"] = priority

        return result

    except Exception as e:
        logging.error(f"Error in ML prediction: {e}")
        return None


# ---------- LOG ANALYSIS (FALLBACK) ----------
def local_model_analyze(log_line: str) -> Optional[Dict[str, Any]]:
    """Analyze log line for security threats (fallback when ML model not available)"""
    attack_patterns = {
        "sql injection": {
            "bug_type": "sql_injection",
            "severity": "élevé"
        },
        "suspicious payload": {
            "bug_type": "sql_injection",
            "severity": "élevé"
        },
        "xss": {
            "bug_type": "xss",
            "severity": "moyen"
        },
        "xss pattern": {
            "bug_type": "xss",
            "severity": "moyen"
        },
        "brute force": {
            "bug_type": "brut_force_ssh",
            "severity": "élevé"
        },
        "failed ssh": {
            "bug_type": "brut_force_ssh",
            "severity": "élevé"
        },
        "port scan": {
            "bug_type": "port_scan",
            "severity": "faible"
        },
        "malware": {
            "bug_type": "malware_download",
            "severity": "élevé"
        },
        "malicious file": {
            "bug_type": "malware_download",
            "severity": "élevé"
        },
        "ddos": {
            "bug_type": "ddos",
            "severity": "élevé"
        },
        "high traffic": {
            "bug_type": "ddos",
            "severity": "élevé"
        },
        "unauthorized": {
            "bug_type": "unauthorized_access",
            "severity": "élevé"
        },
        "unauthorized endpoint": {
            "bug_type": "unauthorized_access",
            "severity": "élevé"
        }
    }

    log_lower = log_line.lower()

    # Extract firewall ID from CSV format (second field) or old format
    firewall_id = "FW-0001"
    if "," in log_line:  # CSV format
        parts = log_line.split(",")
        if len(parts) > 1:
            firewall_id = parts[1].strip()
    elif "fw-" in log_lower:
        parts = log_lower.split("fw-")
        if len(parts) > 1:
            fw_part = parts[1].split()[0].split(",")[0]
            firewall_id = f"FW-{fw_part.upper()}"

    # Check for attack patterns
    for pattern, attack_info in attack_patterns.items():
        if pattern in log_lower:
            return {
                "bug_type": attack_info["bug_type"],
                "severity": attack_info["severity"],
                "raw_log": log_line,  # Include raw log for LLM analysis
                "firewall_id": firewall_id
            }

    return None  # Return None for normal traffic (consistent with predict_log)


async def call_model(session: aiohttp.ClientSession, log_line: str) -> Dict[str, Any]:
    """Call model to analyze log line"""
    # Use ML model first
    ml_result = predict_log(log_line)
    if ml_result:
        return {"alert": True, **ml_result}

    # If ML returns None (normal traffic), don't send to frontend
    return {"alert": False}


async def send_request_to_frontend(model_result: Dict[str, Any], log_line: str) -> None:
    """Send alert as formatted request to frontend via WebSocket"""
    global request_counter

    bug_type = model_result.get("bug_type")
    severity = model_result.get("severity", "moyen")
    priority = model_result.get("priority")  # Get priority if available
    raw_log = model_result.get("raw_log", log_line)  # Get raw_log from model result or use original line
    firewall_id = model_result.get("firewall_id", "FW-0001")

    request_type = BUG_TYPE_CATEGORIES.get(bug_type, "Sécurité") if bug_type else "Validation"

    request_data = {
        "index": request_counter,
        "firewall_id": firewall_id,
        "timestamp": datetime.now().isoformat(),
        "bug_type": bug_type,
        "severity": severity,
        "raw_log": raw_log,  # Include raw log for LLM analysis
        "explanation": None,  # Will be generated by frontend LLM
        "type": request_type,
        "fix_proposal": None,  # Will be generated by frontend LLM
        "src_ip": model_result.get("src_ip"),
        "dst_ip": model_result.get("dst_ip"),
        "src_port": model_result.get("src_port"),
        "dst_port": model_result.get("dst_port")
    }

    # Add priority if available
    if priority:
        request_data["priority"] = priority

    request_counter += 1

    message = {
        "type": "new_request",
        "data": request_data
    }

    await broadcast_to_clients(message)
    logging.info(f"Broadcasted request #{request_data['index']} to {len(connected_clients)} clients")


# ---------- LOG WATCHER ----------
async def tail_file(path: str, queue: asyncio.Queue) -> None:
    """Tail log file and push new lines to queue"""
    logging.info(f"Starting tail on {path}")

    try:
        # Wait for file to exist if it doesn't
        while not os.path.exists(path):
            logging.warning(f"Log file not found: {path}, waiting...")
            await asyncio.sleep(1)

        # Keep file handle open for the entire duration
        f = open(path, "r", encoding="utf-8", errors="ignore")
        try:
            # Seek to end of file
            f.seek(0, os.SEEK_END)
            current_position = f.tell()
            logging.info(f"Watching for new lines in {path}...")

            while True:
                # Save current position
                f.seek(current_position)

                # Try to read new content
                new_content = f.read()

                if new_content:
                    # Update position
                    current_position = f.tell()

                    # Process each line
                    lines = new_content.strip().split('\n')
                    for line in lines:
                        line = line.strip()
                        if line:  # Skip empty lines
                            try:
                                await queue.put(line)
                                logging.debug(f"Added line to queue: {line[:100]}...")
                            except asyncio.QueueFull:
                                logging.warning(f"Queue full, line lost: {line[:100]}...")
                else:
                    # No new content, wait
                    await asyncio.sleep(POLL_INTERVAL)
        finally:
            f.close()

    except FileNotFoundError:
        logging.error(f"Log file not found: {path}")
    except Exception as e:
        logging.exception(f"Error tailing file: {e}")


async def worker(name: int, queue: asyncio.Queue, session: aiohttp.ClientSession) -> None:
    """Process log lines from queue"""
    logging.info(f"Worker {name} started")

    while True:
        log_line = await queue.get()
        try:
            # Check for duplicates using hash
            log_hash = hash(log_line)
            if log_hash in processed_log_hashes:
                logging.debug(f"Worker {name}: Skipping duplicate log line")
                queue.task_done()
                continue

            processed_log_hashes.add(log_hash)

            # Keep set size manageable (last 10000 hashes)
            if len(processed_log_hashes) > 10000:
                # Remove oldest (convert to list, pop first, convert back)
                temp_list = list(processed_log_hashes)
                processed_log_hashes.clear()
                processed_log_hashes.update(temp_list[1000:])

            logging.debug(f"Worker {name} analyzing: {log_line}")

            model_result = await call_model(session, log_line)

            if model_result.get("alert"):
                logging.info(f"ALERT detected by worker {name}: {log_line}")
                await send_request_to_frontend(model_result, log_line)
            else:
                logging.debug("No alert for this line")

        except Exception as e:
            logging.exception(f"Error in worker {name}: {e}")
        finally:
            queue.task_done()


# ---------- MAIN ----------
async def main() -> None:
    """Main entry point"""
    queue = asyncio.Queue(maxsize=QUEUE_MAXSIZE)

    # Start WebSocket server
    ws_server = await websockets.serve(
        handle_websocket_connection,
        WEBSOCKET_HOST,
        WEBSOCKET_PORT
    )
    logging.info(f"WebSocket server started on ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}")

    # Start HTTP session for workers
    async with aiohttp.ClientSession() as session:
        # Start log tail
        tail_task = asyncio.create_task(tail_file(LOG_PATH, queue))

        # Start workers
        workers = [
            asyncio.create_task(worker(i, queue, session))
            for i in range(CONCURRENCY)
        ]

        logging.info("System ready. Press CTRL+C to stop")

        try:
            await asyncio.gather(tail_task, *workers)
        except asyncio.CancelledError:
            logging.info("Shutting down...")
        finally:
            ws_server.close()
            await ws_server.wait_closed()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Stopped by user")
