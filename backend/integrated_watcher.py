import asyncio
import aiohttp
import os
import json
import logging
from typing import Dict, Any, Optional, Set
from datetime import datetime
import websockets
from websockets.asyncio.server import ServerConnection

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

# Global state
request_counter = 1
connected_clients: Set[ServerConnection] = set()

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


# ---------- LOG ANALYSIS ----------
def local_model_analyze(log_line: str) -> Dict[str, Any]:
    """Analyze log line for security threats"""
    attack_patterns = {
        "sql injection": {
            "bug_type": "sql_injection",
            "severity": "élevé",
            "explanation": "Un pirate tente de manipuler votre base de données en insérant des commandes malveillantes.",
            "fix_proposal": "Utiliser des requêtes préparées, valider toutes les entrées, activer WAF (Web Application Firewall)."
        },
        "suspicious payload": {
            "bug_type": "sql_injection",
            "severity": "élevé",
            "explanation": "Un pirate tente de manipuler votre base de données en insérant des commandes malveillantes.",
            "fix_proposal": "Utiliser des requêtes préparées, valider toutes les entrées, activer WAF (Web Application Firewall)."
        },
        "xss": {
            "bug_type": "xss",
            "severity": "moyen",
            "explanation": "Un pirate essaie d'injecter du code malveillant dans votre site web pour voler des informations.",
            "fix_proposal": "Nettoyer et échapper toutes les entrées utilisateur, implémenter CSP (Content Security Policy)."
        },
        "xss pattern": {
            "bug_type": "xss",
            "severity": "moyen",
            "explanation": "Un pirate essaie d'injecter du code malveillant dans votre site web pour voler des informations.",
            "fix_proposal": "Nettoyer et échapper toutes les entrées utilisateur, implémenter CSP (Content Security Policy)."
        },
        "brute force": {
            "bug_type": "brut_force_ssh",
            "severity": "élevé",
            "explanation": "Un attaquant tente de deviner votre mot de passe en essayant des milliers de combinaisons différentes.",
            "fix_proposal": "Bloquer l'IP après plusieurs tentatives, implémenter l'authentification à deux facteurs."
        },
        "failed ssh": {
            "bug_type": "brut_force_ssh",
            "severity": "élevé",
            "explanation": "Un attaquant tente de deviner votre mot de passe SSH.",
            "fix_proposal": "Bloquer l'IP après plusieurs tentatives, implémenter l'authentification à deux facteurs."
        },
        "port scan": {
            "bug_type": "port_scan",
            "severity": "faible",
            "explanation": "Quelqu'un essaie de trouver les portes d'entrée ouvertes de votre système informatique.",
            "fix_proposal": "Bloquer l'IP source et activer la détection de scan avancée."
        },
        "malware": {
            "bug_type": "malware_download",
            "severity": "élevé",
            "explanation": "Un fichier dangereux tente d'être téléchargé sur votre système.",
            "fix_proposal": "Bloquer le téléchargement, scanner avec antivirus, mettre en quarantaine le fichier."
        },
        "malicious file": {
            "bug_type": "malware_download",
            "severity": "élevé",
            "explanation": "Un fichier dangereux tente d'être téléchargé sur votre système.",
            "fix_proposal": "Bloquer le téléchargement, scanner avec antivirus, mettre en quarantaine le fichier."
        },
        "ddos": {
            "bug_type": "ddos",
            "severity": "élevé",
            "explanation": "Votre système reçoit une avalanche de demandes simultanées pour le faire tomber.",
            "fix_proposal": "Activer la limitation de débit, filtrage géographique, et protection DDoS du CDN."
        },
        "high traffic": {
            "bug_type": "ddos",
            "severity": "élevé",
            "explanation": "Votre système reçoit une avalanche de demandes simultanées pour le faire tomber.",
            "fix_proposal": "Activer la limitation de débit, filtrage géographique, et protection DDoS du CDN."
        },
        "unauthorized": {
            "bug_type": "unauthorized_access",
            "severity": "élevé",
            "explanation": "Tentative d'accès non autorisé détectée.",
            "fix_proposal": "Bloquer l'IP source et renforcer les contrôles d'authentification."
        },
        "unauthorized endpoint": {
            "bug_type": "unauthorized_access",
            "severity": "élevé",
            "explanation": "Tentative d'accès non autorisé détectée.",
            "fix_proposal": "Bloquer l'IP source et renforcer les contrôles d'authentification."
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
                "alert": True,
                "bug_type": attack_info["bug_type"],
                "severity": attack_info["severity"],
                "explanation": attack_info["explanation"],
                "fix_proposal": attack_info["fix_proposal"],
                "firewall_id": firewall_id
            }

    return {"alert": False}


async def call_model(session: aiohttp.ClientSession, log_line: str) -> Dict[str, Any]:
    """Call model to analyze log line"""
    if USE_LOCAL_MODEL:
        return local_model_analyze(log_line)

    headers = {"Content-Type": "application/json"}
    if MODEL_API_KEY:
        headers["Authorization"] = f"Bearer {MODEL_API_KEY}"

    payload = {"log": log_line, "timestamp": datetime.now().isoformat()}

    try:
        async with session.post(MODEL_API_URL, json=payload, headers=headers, timeout=10) as resp:
            if resp.status == 200:
                return await resp.json()
            else:
                logging.warning(f"Model API returned status {resp.status}")
                return {"alert": False, "error": "model_unavailable"}
    except Exception as e:
        logging.error(f"Error calling model API: {e}")
        return {"alert": False, "error": str(e)}


async def send_request_to_frontend(model_result: Dict[str, Any], log_line: str) -> None:
    """Send alert as formatted request to frontend via WebSocket"""
    global request_counter

    bug_type = model_result.get("bug_type")
    severity = model_result.get("severity", "moyen")
    explanation = model_result.get("explanation")
    fix_proposal = model_result.get("fix_proposal")
    firewall_id = model_result.get("firewall_id", "FW-0001")

    request_type = BUG_TYPE_CATEGORIES.get(bug_type, "Sécurité") if bug_type else "Validation"

    request_data = {
        "index": request_counter,
        "firewall_id": firewall_id,
        "timestamp": datetime.now().isoformat(),
        "bug_type": bug_type,
        "severity": severity,
        "explanation": explanation,
        "type": request_type,
        "fix_proposal": fix_proposal
    }

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
