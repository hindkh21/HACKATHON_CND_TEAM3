# Hackathon CND – Comprendre et utiliser OVHcloud AI Notebooks

Pour tout problème technique en lien avec les AI Notebooks, un channel Discord vous est mis à disposition.

- L'accès au Discord : le lien vers le channel [#🔐┊hackathon-cnd](https://discord.com/channels/850031577277792286/1429814451007262720)
- Le code d'accès : `8291026478`

## Introduction

Les **AI Notebooks** proposés par **OVHcloud** sont des environnements de développement dans le cloud, basés sur un éditeur de code - **JupyterLab**.
Ils permettent d’écrire, exécuter et visualiser du code Python sans configuration complexe ni installation locale tout en bénénificiant de la puissance des GPUs NVIDIA.

Ces notebooks sont particulièrement adaptés pour :
- De l'implémentation et du test de manière itérative
- L’apprentissage et la pratique du Machine Learning ou du Deep Learning
- Les projets de Data Science collaboratifs
- Des tâches de visualisation de la données
- Les travaux pratiques nécessitant une puissance de calcul GPU/CPU
- Les prototypes avant un passage à grande échelle et un déploiement sur d’autres services d'IA

## Fonctionnalités principales

| Fonctionnalité | Description |
|-----------------|--------------|
| Environnement managé | OVHcloud gère l’infrastructure, les ressources et les mises à jour |
| Interface JupyterLab | Interface graphique complète pour coder, visualiser et documenter |
| Accès CPU/GPU | Choix de la puissance de calcul selon le besoin |
| Stockage persistant | Les données et notebooks sont sauvegardés sur un volume attaché |
| Sécurité et isolation | Chaque notebook tourne dans un conteneur dédié et sécurisé |
| Interopérabilité | Connexion possible avec d’autres services OVHcloud, dont l'Object Storage pour le stockage de données, de modèles d'IA ou de codes/résultats|

## Getting Started

### 1. Ce qui vous sera fourni
**1.1. Matériel fourni à chaque équipe :**
- **5** notebooks sur CPU pour les premiers tests et itérations
- **1** notebook sur GPU (**1 Tesla V100S**) pour l'entraînement, l'inférence du modèle, ou toute tâche nécessitant de la puissance de calcul d'un GPU
- pour chaque notebook, une URL et un token d'accès vous sera fourni

**1.2. Mise à disposition d'un environnement pré-configuré :**
- Version de Python: Python 3.13
- Version de Cuda : cudadevel 12.8
- Framework: Conda 25.7.0
- Type de ressources: 1 CPU ou 1 GPU Tesla V100S (dépendamment du type de notebooks "expérimentaux" ou "d'entraînement")

**1.3. Datasets disponibles dans le notebook :**
- Un volume avec le dataset complet "mutualisé" de 100Go de données (en `Read-Only`): `data-hackathon-shared`.
- Un volume "vide" dédié à accueillir des datasets partitionnés pour développer - merci de respecter un **maximum de 4 Go** dans ce volume pour assurer le bon fonctionnement du notebook. Les données sont partitionnées par vos soins parmi les 100Go et peuvent donc être chargées dans `/workspace/dataset-team-x` dans une **limite de 4Go**.

**1.4. Espace de stockage pour les résultats :**
- Un volume `/workspace/resultats-team-x` qui vous permettra de mettre stocker vos résulats à la fin du hackathon (notebooks, codes, compte-rendus, ...).

### 2. Commencer à travailler
- Créez un nouveau fichier `.ipynb` ou utilisez le "Drag & Drop" pour ajouter un notebook existant.
- Installez les bibliothèques nécessaires (TensorFlow, PyTorch, scikit-learn…) via un `pip install` ou un `conda install`.
- Expérimentez, documentez et sauvegardez régulièrement vos travaux.

### 3. Limitations
- Les utilisateurs ne sont pas administrateurs (root) dans les notebooks. Les installations devront donc se faire via un `pip install <nom_bibliothèque_python>` ou `conda install <nom_bibliothèque_python>` dans un `Terminal`de l'environnment du notebook.
Il est également possible de le faire directement depuis un fichier `.ipynb`, en précédant la commande d'un point d'exclamation, afin d'indiquer qu'il s'agit d'une commande: `!pip install <nom_bibliothèque_python>`
- Le volume de 100Go est monté en read-only à la racine dans `/data-hackathon-shared` (et non dans `/workspace` comme pour les autres volumes) pour éviter de surcharger la workspace du notebook

## Bonnes pratiques

### À faire

- Documenter vos notebooks avec du texte et des commentaires clairs
- Nettoyer et valider vos données avant l’entraînement
- Sauvegarder régulièrement votre travail dans le notebook, dans un dépôt Git ou un stockage "externe" (en local par exemple)
- Surveiller l'utilisation des ressources (CPU, GPU, mémoire) - `nvidia-smi` dans le terminal de l'environnement notebook
- Libérer la mémoire du GPU quand nécessaire en vidant par exemple le cache CUDA:
```python
import torch
torch.cuda.empty_cache()
```
- Versionner les données si besoin

### À éviter

Pour assurer le bon déroulé du hackathon et éviter tout incident sur les notebooks qui pourrait engendrer une perte du travail réalisé, merci de :
- Veiller à ne pas surcharger le GPU en lançant plusieurs fois le même entraînement en parallèle.
- Eviter de stocker de grandes bases de données dans le "volume local" : le `/workspace` n'est pas fait pour stocker un large volume de données, il s'agit d'un environnement de travail.
- Ne pas installer des bibliothèques sans les consigner dans un fichier `requirements.txt`.
- Ne pas partager publiquement des informations sensibles (url du notebook, token d'accès, ...).
- Porter une attention particulière sur le contenu du workspace pour **ne pas dépasser les 4Go** dans le volume de données de travail `/workspace/dataset-team-x`.

### Astuces

1. Execution de cellules de code ou de texte
Dans un fichier `.ipynb`, il faut tout d'abord sélectionner la cellule que vous souhaitez exécuter, puis cliquer sur l'icône "lecture", dans le menu supérieur. Vous pouvez egalement utiliser le raccourci clavier "Shift" + "Entrée".

2. Utilisation de Gradio
Il est possible de lancer une interface Gradio depuis un notebook en configurant et`server_name="0.0.0.0"` et `share='True'` dans la commande lancement : `demo.launch(server_name="0.0.0.0", share='True')`

3. Utilisation de Streamlit :
Il est possible de lancer une interface Streamlit depuis les notebooks en suivant la procédure suivante :
– Ouvrez un terminal et installez streamlit via `pip install streamlit`
– Créez un fichier `app.py` avec le code de votre app Streamlit
- Dans le terminal, lancez l'app Streamlit avec `streamlit run app.py --server.port 8502`

**IMPORTANT :** N'utilisez pas le port 8080 (déjà utilisé par Jupyter).
- Dans une cellule, exécutez le code suivant en Python pour obtenir l'URL de l'app Streamlit :
```python
import os
NOTEBOOK_ID = os.environ['NOTEBOOK_ID']
NOTEBOOK_HOST = os.environ['NOTEBOOK_HOST']
streamlit_server_port = "8502"
print("Steamlit URL:", f'https://{NOTEBOOK_ID}-<streamlit_server_port>.{NOTEBOOK_HOST}')
```
**Exemple:**

"Steamlit URL: https://a8a14ceb-5369-4360-bfc8-be70842c20f9-8502.notebook.gra.ai.cloud.ovh.net'"

## Ressources

- Documentation officielle : https://help.ovhcloud.com/csm/en-gb-documentation-public-cloud-ai-and-machine-learning-ai-notebooks?id=kb_browse_cat&kb_id=574a8325551974502d4c6e78b7421938&kb_category=c8441955f49801102d4ca4d466a7fd58&spa=1
- Exemples GitHub : https://github.com/ovh/ai-training-examples
