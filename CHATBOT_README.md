# Configuration du Chatbot OVH Cloud AI

## Vue d'ensemble
Le chatbot utilise l'API OVH Cloud AI avec le modèle Llama 3.1 8B Instruct pour fournir une assistance intelligente sur les alertes de sécurité.

## Configuration

### 1. Obtenir une clé API OVH Cloud
1. Connectez-vous à [OVH Cloud AI](https://www.ovhcloud.com/fr/public-cloud/ai-platform/)
2. Créez un endpoint avec le modèle `Meta-Llama-3.1-8B-Instruct`
3. Récupérez votre clé API

### 2. Configurer les variables d'environnement
Modifiez le fichier `frontend/.env` :

```env
VITE_OVH_LLM_API_KEY=votre_cle_api_ici
VITE_OVH_LLM_ENDPOINT=https://llama-3-1-8b-instruct.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1/chat/completions
```

### 3. Redémarrer le frontend
```bash
cd frontend
npm run dev
```

## Fonctionnalités

### 🤖 Assistant Intelligent
- Analyse les alertes de sécurité en temps réel
- Fournit des explications détaillées
- Propose des recommandations personnalisées
- Contexte automatique basé sur les 5 dernières alertes

### 💬 Interface Chat
- Bouton flottant en bas à droite
- Historique de conversation
- Réponses en français
- Animation de chargement

### 🔒 Sécurité
- Clé API stockée dans les variables d'environnement
- Pas de logs des messages côté client
- Communication HTTPS avec OVH

## Utilisation

1. **Cliquez sur l'icône robot** en bas à droite
2. **Posez vos questions** :
   - "Explique-moi la dernière alerte"
   - "Que faire contre les attaques XSS ?"
   - "Combien d'alertes critiques ai-je ?"
   - "Comment sécuriser mon serveur SSH ?"

3. **Le chatbot analyse** automatiquement le contexte des alertes récentes

## Personnalisation

### Changer le modèle
Dans `Chatbot.tsx`, ligne 58 :
```typescript
model: 'Meta-Llama-3.1-8B-Instruct'
```

### Ajuster les paramètres
```typescript
max_tokens: 500,     // Longueur max de la réponse
temperature: 0.7     // Créativité (0-1)
```

### Modifier le contexte
Le système envoie automatiquement les 5 dernières alertes au LLM. Pour changer :
```typescript
const alertsContext = requests.slice(0, 5) // Changer 5 à autre chose
```

## Dépannage

### Erreur "API key not configured"
- Vérifiez que `VITE_OVH_LLM_API_KEY` est défini dans `.env`
- Redémarrez le serveur de développement

### Erreur HTTP 401
- Votre clé API est invalide ou expirée
- Générez une nouvelle clé sur OVH Cloud

### Réponses lentes
- Normal, le modèle met 2-5 secondes à répondre
- Vérifiez votre connexion internet

### Le chatbot ne comprend pas le contexte
- Vérifiez que les alertes sont bien passées via `requests` prop
- Les 5 dernières alertes sont automatiquement ajoutées au contexte

## Support
Pour plus d'informations sur l'API OVH Cloud AI :
- [Documentation OVH Cloud AI](https://help.ovhcloud.com/csm/fr-public-cloud-ai-capabilities?id=kb_browse_cat&kb_category=b5f1835b1bb9641034cd55ccdc4bcb1d)
- [Modèles disponibles](https://endpoints.ai.cloud.ovh.net/docs)
