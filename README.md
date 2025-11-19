# 🛡️ Firewall Security Monitor - HACKATHON_CND_TEAM3

A real-time firewall monitoring and security alert system with intelligent threat detection and automated fix suggestions.

## 🌟 Features

- **Real-time Log Monitoring** - Continuously monitors firewall logs for security threats
- **Intelligent Threat Detection** - Detects SQL injection, XSS, DDoS, brute force attacks, and more
- **WebSocket Communication** - Real-time bidirectional communication between backend and frontend
- **Interactive Dashboard** - Beautiful React interface with live updates
- **Severity Classification** - Categorizes threats as "élevé" (high), "moyen" (medium), or "faible" (low)
- **Automated Fix Proposals** - Suggests remediation steps for detected threats
- **Visual Analytics** - Charts and statistics for threat analysis

## 🏗️ Architecture

```
┌─────────────────┐      WebSocket      ┌──────────────────┐
│   Log Files     │ ─────────────────▶  │   Backend        │
│   (app.log)     │                     │   (Python)       │
└─────────────────┘                     │                  │
                                        │  - Log Watcher   │
                                        │  - Threat Engine │
                                        │  - WS Server     │
                                        └────────┬─────────┘
                                                 │
                                          ws://localhost:8080
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

## 📋 Prerequisites

- **Python 3.8+** - For backend services
- **Node.js 18+** - For frontend development
- **npm or pnpm** - Package manager

## 🚀 Quick Start

### Option 1: Automated Setup

Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

Then follow the on-screen instructions.

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create log file
touch app.log
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install  # or: pnpm install

# Create environment file
cp .env.example .env
```

#### 3. Run the System

**Terminal 1 - Start Backend:**
```bash
cd backend
source venv/bin/activate
python integrated_watcher.py
```

**Terminal 2 - Generate Test Logs (optional):**
```bash
cd backend
source venv/bin/activate
python generate_test_logs.py
```

**Terminal 3 - Start Frontend:**
```bash
cd frontend
npm run dev  # or: pnpm dev
```

**Access the Application:**
Open your browser to: `http://localhost:5173`

## 📁 Project Structure

```
.
├── backend/
│   ├── integrated_watcher.py    # Main backend service
│   ├── websocket_server.py      # Standalone WebSocket server
│   ├── load_watcher.py           # Original log watcher
│   ├── generate_test_logs.py    # Test log generator
│   ├── requirements.txt          # Python dependencies
│   └── README.md                 # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── lib/                 # Utilities and WebSocket client
│   │   ├── types/               # TypeScript type definitions
│   │   └── App.tsx              # Main application
│   ├── package.json
│   └── README.md
│
├── BACKEND_FRONTEND_INTEGRATION.md  # Integration documentation
├── setup.sh                         # Quick setup script
└── README.md                        # This file
```

## 🔧 Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory (optional):

```bash
LOG_PATH=app.log
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=8080
USE_LOCAL_MODEL=true
CONCURRENCY=4
POLL_INTERVAL=0.2
```

### Frontend Configuration

Edit `frontend/.env`:

```bash
VITE_WS_URL=ws://localhost:8080
VITE_API_URL=http://localhost:8080
```

## 🔍 Detected Threats

The system detects the following security threats:

| Threat Type          | Severity | Description                                    |
|----------------------|----------|------------------------------------------------|
| SQL Injection        | Élevé    | Database manipulation attempts                 |
| XSS                  | Moyen    | Cross-site scripting attacks                   |
| Brute Force SSH      | Élevé    | SSH password guessing attempts                 |
| Port Scan            | Faible   | Network reconnaissance                         |
| Malware Download     | Élevé    | Malicious file download attempts               |
| DDoS                 | Élevé    | Distributed denial of service                  |
| Unauthorized Access  | Élevé    | Unauthorized access attempts                   |

## 📡 WebSocket Protocol

### Messages from Backend to Frontend

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

### Messages from Frontend to Backend

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

See [BACKEND_FRONTEND_INTEGRATION.md](./BACKEND_FRONTEND_INTEGRATION.md) for complete protocol documentation.

## 🧪 Testing

### Generate Test Logs

```bash
cd backend
python generate_test_logs.py
```

This creates realistic security logs including:
- Normal traffic
- Port scans
- SQL injection attempts
- SSH brute force attacks
- XSS attempts
- DDoS attacks

### Manual Log Injection

Append to `backend/app.log`:

```bash
echo "2025-11-19 10:00:00 FW-0001 [CRITICAL] SQL injection attempt detected" >> backend/app.log
```

## 📊 Features in Detail

### Dashboard
- Real-time request feed
- Color-coded severity indicators
- Relative and absolute timestamps
- Firewall ID tracking

### Analytics
- Severity distribution charts
- Attack type breakdown
- Trend analysis
- Request volume metrics

### Fix Application
- View detailed threat explanations
- Review suggested fixes
- Apply fixes via WebSocket
- Track fix application status

## 🐛 Troubleshooting

**WebSocket won't connect:**
- Ensure backend is running
- Check port 8080 is not blocked
- Verify `VITE_WS_URL` in frontend `.env`

**No alerts appearing:**
- Verify `app.log` exists and is being written to
- Check backend console for errors
- Ensure `USE_LOCAL_MODEL=true`

**Import errors:**
- Activate virtual environment: `source venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Documentation

- [Backend README](./backend/README.md) - Backend-specific documentation
- [Frontend README](./frontend/README.md) - Frontend-specific documentation
- [Integration Guide](./BACKEND_FRONTEND_INTEGRATION.md) - Type system and protocol details

## 🎯 Future Enhancements

- [ ] Machine learning-based threat detection
- [ ] Database persistence
- [ ] User authentication
- [ ] TLS/SSL WebSocket (wss://)
- [ ] Multi-firewall support
- [ ] Email/SMS notifications
- [ ] Automated fix application
- [ ] Historical data analysis
- [ ] Export reports (PDF, CSV)

## 👥 Team

**HACKATHON_CND_TEAM3**

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- Built for CND Hackathon
- Ministère des Armées

---

**Made with ❤️ for cybersecurity**
