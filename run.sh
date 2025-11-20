#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Démarrage des conteneurs Docker Compose...${NC}"

# Fonction pour arrêter proprement les conteneurs
cleanup() {
    echo -e "\n${YELLOW}⏳ Arrêt des conteneurs en cours...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Conteneurs arrêtés avec succès${NC}"
    exit 0
}

# Capturer le signal SIGINT (Ctrl+C)
trap cleanup SIGINT SIGTERM

# Démarrer Docker Compose en mode détaché
docker compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Conteneurs démarrés avec succès${NC}"
    echo -e "${YELLOW}📋 Affichage des logs en temps réel...${NC}"
    echo -e "${YELLOW}🛑 Appuyez sur Ctrl+C pour arrêter les conteneurs${NC}"
    echo ""
    
    # Suivre les logs en temps réel
    docker compose logs -f
else
    echo -e "${RED}❌ Erreur lors du démarrage des conteneurs${NC}"
    exit 1
fi
