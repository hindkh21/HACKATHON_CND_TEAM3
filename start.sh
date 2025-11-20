#!/bin/bash

# Script de démarrage complet - Backend + Frontend
# Gère l'arrêt propre avec Ctrl+C

set -e

echo "🚀 Démarrage du système de monitoring complet..."
echo ""

cd "$(dirname "$0")"

# Trap pour gérer Ctrl+C proprement
cleanup() {
    echo ""
    echo "🛑 Arrêt en cours..."
    echo ""

    # Arrêter le frontend
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "   • Arrêt du frontend (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null
    fi

    # Arrêter le générateur de logs
    if [ ! -z "$GENERATOR_PID" ] && kill -0 $GENERATOR_PID 2>/dev/null; then
        echo "   • Arrêt du générateur (PID: $GENERATOR_PID)"
        kill $GENERATOR_PID 2>/dev/null
    fi

    # Arrêter le serveur WebSocket
    if [ ! -z "$WATCHER_PID" ] && kill -0 $WATCHER_PID 2>/dev/null; then
        echo "   • Arrêt du serveur WebSocket (PID: $WATCHER_PID)"
        kill $WATCHER_PID 2>/dev/null
    fi

    # Forcer l'arrêt si nécessaire
    pkill -f integrated_watcher.py 2>/dev/null || true
    pkill -f generate_test_logs.py 2>/dev/null || true

    # Nettoyer les fichiers temporaires
    rm -f /tmp/firewall_monitor.pid
	> app.log


    echo ""
    echo "✅ Tous les processus arrêtés proprement"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Port fixe hardcodé
PORT=9001

# Nettoyage initial
echo "🧹 Nettoyage des processus existants..."
pkill -f integrated_watcher.py 2>/dev/null || true
pkill -f generate_test_logs.py 2>/dev/null || true

# Nettoyer le port 9001 si occupé
echo "🔌 Libération du port $PORT..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 2

echo "✅ Utilisation du port $PORT"
echo ""

# Vérifier les dépendances backend
if [ ! -d "backend/venv" ]; then
    echo "⚠️  Virtual environment non trouvé, création..."
    cd backend
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
    cd ..
fi

# Vérifier les dépendances frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Node modules non trouvés, installation..."
    cd frontend
    npm install
    cd ..
fi

# Configuration du port
echo "📝 Configuration du port $PORT..."

# Frontend .env
cat > frontend/.env << EOF
# WebSocket Configuration
VITE_WS_URL=ws://localhost:9001

# API Configuration (if needed in the future)
VITE_API_URL=http://localhost:9001
EOF

echo "✅ Configuration mise à jour"
echo ""

# Exporter le port pour le backend (même si hardcodé)
export WEBSOCKET_PORT=9001

# ============================================
# DÉMARRAGE DES SERVICES
# ============================================

echo "=============================================="
echo "1️⃣  DÉMARRAGE DU BACKEND"
echo "=============================================="
echo ""

# Démarrer le serveur WebSocket
echo "   📡 Serveur WebSocket sur port 9001..."
cd backend
./venv/bin/python integrated_watcher.py > watcher.log 2>&1 &
WATCHER_PID=$!
cd ..

sleep 2

# Vérifier que le serveur a démarré
if ! lsof -i :9001 > /dev/null 2>&1; then
    echo "   ❌ Le serveur n'a pas démarré"
    echo ""
    echo "Logs:"
    tail -20 backend/watcher.log
    exit 1
fi

echo "   ✅ Serveur WebSocket actif (PID: $WATCHER_PID)"
echo ""

# Démarrer le générateur de logs
echo "   📊 Générateur de logs..."
cd backend
./venv/bin/python generate_test_logs.py > generator.log 2>&1 &
GENERATOR_PID=$!
cd ..

if kill -0 $GENERATOR_PID 2>/dev/null; then
    echo "   ✅ Générateur actif (PID: $GENERATOR_PID)"
else
    echo "   ⚠️  Générateur non démarré"
    GENERATOR_PID=""
fi

echo ""
echo "=============================================="
echo "2️⃣  DÉMARRAGE DU FRONTEND"
echo "=============================================="
echo ""

cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "   ✅ Frontend démarré (PID: $FRONTEND_PID)"
else
    echo "   ❌ Frontend non démarré"
    cleanup
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ SYSTÈME OPÉRATIONNEL"
echo "=============================================="
echo ""
echo "📊 Services actifs:"
echo "   • WebSocket Server:  ws://localhost:9001 (PID: $WATCHER_PID)"
echo "   • Log Generator:     PID: $GENERATOR_PID"
echo "   • Frontend Dev:      http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "📝 Logs disponibles:"
echo "   • Backend:   backend/watcher.log"
echo "   • Generator: backend/generator.log"
echo ""
echo "⚠️  Appuyez sur Ctrl+C pour arrêter tous les services"
echo ""
echo "=============================================="

# Sauvegarder les PIDs
cat > /tmp/firewall_monitor.pid << EOF
$WATCHER_PID
$GENERATOR_PID
$FRONTEND_PID
EOF

# Attendre indéfiniment (le script reste actif)
while true; do
    # Vérifier que les processus sont toujours actifs
    if ! kill -0 $WATCHER_PID 2>/dev/null; then
        echo "⚠️  Le serveur WebSocket s'est arrêté"
        cleanup
        exit 1
    fi

    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "⚠️  Le frontend s'est arrêté"
        cleanup
        exit 1
    fi

    sleep 2
done
