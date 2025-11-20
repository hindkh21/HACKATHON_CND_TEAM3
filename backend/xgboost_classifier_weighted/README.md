# Modèle XGBoost

## Fichiers requis

Placez les fichiers suivants dans ce dossier :

1. `xgboost_model.json` - Le modèle XGBoost entraîné
2. `tfidf_vectorizer.joblib` - Le vectoriseur TF-IDF
3. `label_encoder.joblib` - L'encodeur de labels

## Comment obtenir ces fichiers

Ces fichiers sont générés lors de l'entraînement du modèle ML.
Copiez-les depuis votre environnement d'entraînement vers ce dossier.

## Structure attendue

```
backend/xgboost_classifier_weighted/
├── README.md (ce fichier)
├── xgboost_model.json
├── tfidf_vectorizer.joblib
└── label_encoder.joblib
```
