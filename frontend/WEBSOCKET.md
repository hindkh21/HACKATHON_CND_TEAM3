# WebSocket Server pour Moniteur de Pare-feu

## Configuration WebSocket

Le frontend se connecte à un serveur WebSocket dont l'URL est définie dans le fichier `.env` :

```env
VITE_WS_URL=ws://localhost:8080
```

Pour modifier l'URL du serveur WebSocket, créez un fichier `.env` à la racine du projet (utilisez `.env.example` comme modèle) et définissez la variable `VITE_WS_URL`.

## Messages WebSocket

### Messages envoyés par le client (frontend)

#### apply_fix
Demande l'application d'une correction :
```json
{
  "type": "apply_fix",
  "data": {
    "request_index": 1,
    "firewall_id": "FW-001",
    "bug_type": "sql_injection",
    "fix_proposal": "Utiliser des requêtes préparées..."
  }
}
```

### Messages reçus par le client (frontend)

#### new_request
Nouvelle requête de pare-feu détectée :
```json
{
  "type": "new_request",
  "data": {
    "index": 6,
    "firewall_id": "FW-006",
    "timestamp": "2025-11-19T14:30:00Z",
    "bug_type": "xss",
    "severity": "moyen",
    "explanation": "Tentative XSS...",
    "type": "Sécurité",
    "fix_proposal": "Nettoyer et échapper..."
  }
}
```

#### fix_applied
Confirmation que la correction a été appliquée :
```json
{
  "type": "fix_applied",
  "data": {
    "request_index": 1,
    "success": true
  }
}
```

#### fix_error
Erreur lors de l'application de la correction :
```json
{
  "type": "fix_error",
  "data": {
    "request_index": 1
  },
  "error": "Description de l'erreur"
}
```

## Fonctionnalités

- **Auto-reconnexion** : Le client tente de se reconnecter automatiquement toutes les 3 secondes si la connexion est perdue
- **Indicateur de statut** : Un indicateur visuel montre l'état de la connexion WebSocket
- **Temps réel** : Les nouvelles requêtes de pare-feu sont affichées instantanément via WebSocket
- **Application de corrections** : Les corrections sont envoyées via WebSocket au lieu d'API REST

## Exemple de serveur WebSocket (Python)

```python
import asyncio
import websockets
import json
from datetime import datetime

connected_clients = set()

async def handle_client(websocket, path):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            data = json.loads(message)

            if data['type'] == 'apply_fix':
                # Traiter la demande de correction
                request_index = data['data']['request_index']

                # Simuler le traitement
                await asyncio.sleep(1)

                # Envoyer la confirmation
                response = {
                    'type': 'fix_applied',
                    'data': {
                        'request_index': request_index,
                        'success': True
                    }
                }
                await websocket.send(json.dumps(response))
    finally:
        connected_clients.remove(websocket)

async def broadcast_new_request():
    """Simuler l'envoi de nouvelles requêtes"""
    while True:
        await asyncio.sleep(5)

        if connected_clients:
            new_request = {
                'type': 'new_request',
                'data': {
                    'index': 100,
                    'firewall_id': 'FW-100',
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'bug_type': 'ddos',
                    'severity': 'élevé',
                    'explanation': 'Potentiel DDoS détecté',
                    'type': 'Réseau',
                    'fix_proposal': 'Activer la limitation de débit'
                }
            }

            await asyncio.gather(
                *[client.send(json.dumps(new_request)) for client in connected_clients]
            )

async def main():
    server = await websockets.serve(handle_client, "localhost", 8080)
    asyncio.create_task(broadcast_new_request())
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
```

## Dépendances Python

```bash
pip install websockets
```

## Lancement du serveur

```bash
python websocket_server.py
```
