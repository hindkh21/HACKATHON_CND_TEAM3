# 🛡️ Firewall Security Monitor - HACKATHON_CND_TEAM3

Un système de surveillance de firewall en temps réel avec détection intelligente des menaces et suggestions de corrections automatisées.

## 🌟 Fonctionnalités

- **Surveillance des Logs en Temps Réel** - Surveille en continu les logs du firewall pour détecter les menaces de sécurité
- **Détection Intelligente des Menaces** - Détecte les SQL injection, XSS, DDoS, attaques par force brute, et plus encore
- **Communication WebSocket** - Communication bidirectionnelle en temps réel entre le backend et le frontend
- **Dashboard Interactif** - Belle interface React avec mises à jour en direct
- **Classification de Sévérité** - Catégorise les menaces comme "élevé", "moyen", ou "faible"
- **Propositions de Corrections Automatisées** - Suggère des étapes de remédiation pour les menaces détectées
- **Analytiques Visuelles** - Graphiques et statistiques pour l'analyse des menaces
- **Help ChatBot** - Un ChatBot toujours disponible en cas d'insécurité ou d'incompréhension

## 🏗️ Architecture

```
┌─────────────────┐       Watch         ┌──────────────────┐
│   Log Files     │ ─────────────────▶ │   Backend        │
│   (app.log)     │                     │   (Python)       │
└─────────────────┘                     │                  │
                                        │  - Log Watcher   │
                                        │  - Threat Engine │
                                        │  - WS Server     │
                                        └────────┬─────────┘
                                                 │
                                          ws://localhost:9001
                                                 │
                                        ┌────────▼─────────┐
                                        │    Frontend      │
                                        │  (React + TS)    │
                                        │                  │
                                        │  - Dashboard     │
                                        │  - Analytics     │
                                        │  - Fix Interface │
                                        └──────────────────┘
```

## 📋 Prérequis

- **Python 3.8+** - Pour les services backend
- **Node.js 18+** - Pour le développement frontend
- **npm or pnpm** - Gestionnaire de paquets

## 🚀 Démarrage Rapide

### Option 1: Configuration Automatisée (Recommandée)

La façon la plus simple de démarrer tous les services à la fois :

```bash
chmod +x start.sh
./start.sh
```

Ce script va :
- Démarrer le serveur WebSocket backend
- Démarrer le générateur de logs
- Démarrer le serveur de développement frontend

Tous les services s'exécuteront dans des fenêtres de terminal séparées.

### Option 2: Configuration Manuelle

#### 1. Configuration du Backend

```bash
cd backend

# Créer un environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier de logs
touch app.log
```

#### 2. Configuration du Frontend

```bash
cd frontend

# Installer les dépendances
npm install  # ou: pnpm install

# Créer le fichier d'environnement
cp .env.example .env.local
# Éditer .env.local avec votre configuration
```

#### 3. Exécuter le Système Manuellement

**Terminal 1 - Démarrer le Backend:**
```bash
cd backend
source venv/bin/activate
python integrated_watcher.py
```

**Terminal 2 - Générer des Logs de Test (optionnel):**
```bash
cd backend
source venv/bin/activate
python generate_test_logs.py
```

**Terminal 3 - Démarrer le Frontend:**
```bash
cd frontend
npm run dev  # ou: pnpm dev
```

**Accéder à l'Application:**
Ouvrez votre navigateur à : `http://localhost:5173`

## 📁 Structure du Projet

```
.
├── backend/
│   ├── integrated_watcher.py    # Service backend principal
│   ├── websocket_server.py      # Serveur WebSocket autonome
│   ├── load_watcher.py           # Watcher de logs original
│   ├── generate_test_logs.py    # Générateur de logs de test
│   ├── requirements.txt          # Dépendances Python
│   └── README.md                 # Documentation backend
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Composants React
│   │   ├── lib/                 # Utilitaires et client WebSocket
│   │   ├── types/               # Définitions de types TypeScript
│   │   └── App.tsx              # Application principale
│   ├── package.json
│   └── README.md
│
├── BACKEND_FRONTEND_INTEGRATION.md  # Documentation d'intégration
├── setup.sh                         # Script de configuration rapide
└── README.md                        # Ce fichier
```

## 🔧 Configuration

### Configuration Backend

Créer un fichier `.env` dans le répertoire `backend/` (optionnel) :

```bash
LOG_PATH=app.log
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=8080
USE_LOCAL_MODEL=true
CONCURRENCY=4
POLL_INTERVAL=0.2
```

### Configuration Frontend

Créer `frontend/.env.local` à partir de l'exemple :

```bash
cp .env.example .env.local
```

Éditer `frontend/.env.local` :

```bash
VITE_WS_URL=ws://localhost:9001
VITE_API_URL=http://localhost:9001/
VITE_OVH_LLM_API_KEY=your_api_key_here
VITE_OVH_LLM_ENDPOINT=https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions
VITE_OVH_LLM_MODEL=Meta-Llama-3_3-70B-Instruct
```

**Note:** Remplacer `your_api_key_here` par votre véritable clé API OVH Cloud AI.

## 🔍 Menaces Détectées

Le système détecte les menaces de sécurité suivantes :

| Type de Menace       | Sévérité | Description                                    |
|----------------------|----------|------------------------------------------------|
| SQL Injection        | Élevé    | Tentatives de manipulation de base de données  |
| XSS                  | Moyen    | Attaques de script inter-sites                 |
| Brute Force SSH      | Élevé    | Tentatives de devinette de mot de passe SSH    |
| Port Scan            | Faible   | Reconnaissance réseau                          |
| Malware Download     | Élevé    | Tentatives de téléchargement de fichiers malveillants |
| DDoS                 | Élevé    | Déni de service distribué                      |
| Unauthorized Access  | Élevé    | Tentatives d'accès non autorisées              |

## 📡 Protocole WebSocket

### Messages du Backend vers le Frontend

```json
{
  "type": "new_request",
  "data": {
    "index": 1,
    "firewall_id": "FW-0001",
    "timestamp": "2025-11-19T10:00:00.000Z",
    "bug_type": "sql_injection",
    "severity": "élevé",
    "explanation": "Description...",
    "type": "Sécurité",
    "fix_proposal": "Solution..."
  }
}
```

### Messages du Frontend vers le Backend

```json
{
  "type": "apply_fix",
  "data": {
    "request_index": 1,
    "firewall_id": "FW-0001",
    "bug_type": "sql_injection",
    "fix_proposal": "Solution..."
  }
}
```

Voir [BACKEND_FRONTEND_INTEGRATION.md](./BACKEND_FRONTEND_INTEGRATION.md) pour la documentation complète du protocole.

## 🧪 Tests

### Générer des Logs de Test

```bash
cd backend
python generate_test_logs.py
```

Cela crée des logs de sécurité réalistes incluant :
- Trafic normal
- Scans de ports
- Tentatives de SQL injection
- Attaques SSH par force brute
- Tentatives XSS
- Attaques DDoS

### Injection Manuelle de Logs

Ajouter à `backend/app.log` :

```bash
echo "2025-11-19 10:00:00 FW-0001 [CRITICAL] SQL injection attempt detected" >> backend/app.log
```

## 📊 Fonctionnalités en Détail

### Dashboard
- Flux de requêtes en temps réel
- Indicateurs de sévérité codés par couleur
- Horodatages relatifs et absolus
- Suivi des ID de firewall

### Analytics
- Graphiques de distribution de sévérité
- Répartition par type d'attaque
- Analyse des tendances
- Métriques de volume de requêtes

### Application de Corrections
- Visualiser les explications détaillées des menaces
- Examiner les corrections suggérées
- Appliquer les corrections via WebSocket
- Suivre le statut d'application des corrections

## 🐛 Dépannage

**Le WebSocket ne se connecte pas:**
- S'assurer que le backend est en cours d'exécution
- Vérifier que le port 8080 n'est pas bloqué
- Vérifier `VITE_WS_URL` dans le `.env` frontend

**Aucune alerte n'apparaît:**
- Vérifier que `app.log` existe et est en cours d'écriture
- Vérifier la console backend pour les erreurs
- S'assurer que `USE_LOCAL_MODEL=true`

**Erreurs d'import:**
- Activer l'environnement virtuel: `source venv/bin/activate`
- Réinstaller les dépendances: `pip install -r requirements.txt`

## 🤝 Contribution

1. Fork le dépôt
2. Créer une branche de fonctionnalité
3. Apporter vos modifications
4. Tester minutieusement
5. Soumettre une pull request

## 📝 Documentation

- [Backend README](./backend/README.md) - Documentation spécifique au backend
- [Frontend README](./frontend/README.md) - Documentation spécifique au frontend
- [Guide d'Intégration](./BACKEND_FRONTEND_INTEGRATION.md) - Système de types et détails du protocole

## 🎯 Améliorations Futures

- [ ] Détection de menaces basée sur le machine learning
- [ ] Persistance en base de données
- [ ] Authentification utilisateur
- [ ] TLS/SSL WebSocket (wss://)
- [ ] Support multi-firewall
- [ ] Notifications Email/SMS
- [ ] Application automatisée des corrections
- [ ] Analyse des données historiques
- [ ] Export de rapports (PDF, CSV)

## 👥 Équipe

**HACKATHON_CND_TEAM3**

## 📄 Licence

[Votre Licence Ici]

## 🙏 Remerciements

- Développé pour le Hackathon CND
- Ministère des Armées

---

**Fait avec ❤️ pour la France**



