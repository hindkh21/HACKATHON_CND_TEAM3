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

    echo ""
    echo "✅ Tous les processus arrêtés proprement"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Fonction pour trouver un port disponible
find_available_port() {
    for port in {9001..9020}; do
        if ! lsof -i :$port > /dev/null 2>&1; then
            echo $port
            return 0
        fi
    done
    return 1
}

# Nettoyage initial
echo "🧹 Nettoyage des processus existants..."
pkill -f integrated_watcher.py 2>/dev/null || true
pkill -f generate_test_logs.py 2>/dev/null || true
sleep 1

# Trouver un port disponible
echo "🔍 Recherche d'un port disponible..."
PORT=$(find_available_port)

if [ -z "$PORT" ]; then
    echo "❌ Aucun port disponible trouvé entre 9001-9020"
    exit 1
fi

echo "✅ Port $PORT trouvé"
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
VITE_WS_URL=ws://localhost:$PORT

# API Configuration (if needed in the future)
VITE_API_URL=http://localhost:$PORT
EOF

# Backup et mise à jour websocket.ts (au cas où .env ne marche pas)
sed -i.bak "s|ws://localhost:[0-9]*|ws://localhost:$PORT|g" frontend/src/lib/websocket.ts 2>/dev/null || true

echo "✅ Configuration mise à jour"
echo ""

# Exporter le port pour le backend
export WEBSOCKET_PORT=$PORT

# ============================================
# DÉMARRAGE DES SERVICES
# ============================================

echo "=============================================="
echo "1️⃣  DÉMARRAGE DU BACKEND"
echo "=============================================="
echo ""

# Démarrer le serveur WebSocket
echo "   📡 Serveur WebSocket sur port $PORT..."
cd backend
./venv/bin/python integrated_watcher.py > watcher.log 2>&1 &
WATCHER_PID=$!
cd ..

sleep 2

# Vérifier que le serveur a démarré
if ! lsof -i :$PORT > /dev/null 2>&1; then
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
echo "   • WebSocket Server:  ws://localhost:$PORT (PID: $WATCHER_PID)"
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
