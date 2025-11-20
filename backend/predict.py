import joblib
import xgboost as xgb
import pandas as pd
import numpy as np
import os

# CONFIG
MODEL_DIR = "./xgboost_classifier_weighted"

print("Chargement du cerveau (Modèle + Outils)...")
model = xgb.XGBClassifier()
model.load_model(os.path.join(MODEL_DIR, "xgboost_model.json"))
vectorizer = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib"))
label_enc = joblib.load(os.path.join(MODEL_DIR, "label_encoder.joblib"))

# Fonction de prédiction unitaire
def predict_log(log_data):
    """
    log_data: dict contenant les champs du log (src_ip, explanation, etc.)
    """
    # 1. Reconstruire le texte comme à l'entraînement
    cols = ["explanation", "attack_type", "rule_id", "reason", "src_ip", "dst_ip", "dst_port", "protocol", "action", "status"]
    parts = []
    for c in cols:
        val = log_data.get(c, "")
        if val and str(val).strip():
            parts.append(str(val))
    text = " ".join(parts)

    # 2. Vectoriser
    # Attention: transform attend une liste, donc [text]
    vectorized = vectorizer.transform([text])

    # 3. Prédire les probabilités
    probs = model.predict_proba(vectorized)[0]
    pred_idx = np.argmax(probs)
    pred_label = label_enc.inverse_transform([pred_idx])[0]
    confidence = probs[pred_idx]

    return {
        "prediction": pred_label,
        "confidence": f"{confidence:.2%}",
        "details": {label: f"{p:.2%}" for label, p in zip(label_enc.classes_, probs)}
    }

# --- TEST SUR DE FAUX LOGS ---

# Exemple 1 : Trafic Normal
log_normal = {
    "src_ip": "192.168.1.55",
    "dst_port": "443",
    "action": "Allow",
    "protocol": "TCP",
    "explanation": "Access allowed by policy"
}

# Exemple 2 : SQL Injection (Simulée)
log_attack = {
    "src_ip": "45.13.12.11", # IP externe
    "dst_port": "80",
    "explanation": "Pattern match \"SELECT * FROM\"",
    "attack_type": "sql_injection",
    "reason": "IPS Alert"
}

print("\n--- TEST 1 : Log Normal ---")
print(predict_log(log_normal))

print("\n--- TEST 2 : Attaque SQL ---")
res = predict_log(log_attack)
print(f"Prédiction : {res['prediction']} ({res['confidence']})")
print("Probabilités :", res['details'])
