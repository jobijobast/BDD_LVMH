# LVMH Voice-to-Tag - AI-Powered CRM Intelligence

Plateforme de CRM intelligente avec traitement vocal, nettoyage IA, extraction de tags, et analyse de sentiment.

## 🚀 Démarrage Rapide

### Prérequis
- Python 3.9+
- Compte Supabase
- Clé API Mistral

### Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd BDD_LVMH
```

2. **Installer les dépendances Python**
```bash
pip install -r requirements.txt
```

3. **Configurer les variables d'environnement**

Créer/modifier le fichier `.env` :
```bash
MISTRAL_API_KEY=votre_clé_mistral
SUPABASE_URL=https://vgkklymckkwrcpjrnzhr.supabase.co
SUPABASE_KEY=votre_clé_supabase_anon_public
```

⚠️ **IMPORTANT** : La clé Supabase doit être la clé **anon/public**, pas la service_role !

4. **Configurer Supabase**

Dans votre dashboard Supabase :
- Créer un nouveau projet ou utiliser `vgkklymckkwrcpjrnzhr`
- Aller dans SQL Editor
- Exécuter le contenu de `supabase_schema.sql`

5. **Mettre à jour `app.js`**

Ligne 8, remplacer par votre vraie clé Supabase :
```javascript
const SUPABASE_KEY = 'votre_clé_supabase_anon_public';
```

6. **Démarrer le serveur**
```bash
python3 server.py
```

7. **Ouvrir dans le navigateur**
```
http://localhost:5001
```

## 🧪 Vérification

### Test de connexion Supabase
```bash
python3 test_supabase.py
```

Résultat attendu : `Status: 200` (pas 401)

### Connexion Manager
- Prénom : Bruno
- Nom : Lopes
- Code : LVMH2024

### Connexion Vendeur
- Prénom : Jean
- Nom : Dupont
- Code : LVMH2024

## 📁 Structure du Projet

```
BDD_LVMH/
├── app.js                  # Contrôleur principal (auth, routing, state)
├── engine.js               # Moteur de rendu (toutes les vues)
├── index.html              # Structure HTML
├── index.css               # Styles
├── server.py               # Backend Flask + Pipeline IA
├── supabase_schema.sql     # Schéma base de données
├── requirements.txt        # Dépendances Python
├── .env                    # Variables d'environnement (à créer)
└── test_supabase.py        # Script de test connexion
```

## 🔧 Fonctionnalités

### Vendeur
- 🎤 Enregistrement vocal des notes clients
- 📝 Saisie manuelle
- 👤 Gestion de mes clients
- 🎯 Next Best Action (NBA)
- 🛍️ Product Matcher
- ✉️ Follow-up personnalisé

### Manager
- 📊 Dashboard global
- 👥 Vue tous les clients de la boutique
- 🛡️ Privacy Score & Coaching RGPD
- 🏛️ Cross-Brand Intelligence
- 💬 Sentiment & Retention
- 🏪 Dashboard Boutique
- 📈 The Luxury Pulse (tendances)
- 📁 Import CSV en masse
- 👥 Gestion d'équipe

## 🤖 Pipeline IA

1. **Nettoyage** : Mistral supprime les hésitations et masque les données RGPD
2. **Tags** : Extraction automatique (profession, style, lifestyle, etc.)
3. **NBA** : Génération d'actions prescriptives
4. **Sentiment** : Analyse positive/négative/neutre
5. **Privacy Score** : Calcul de conformité RGPD par CA

## 🐛 Dépannage

### Erreur "Code boutique invalide"
➡️ La clé Supabase est invalide. Voir `SUPABASE_SETUP.md`

### Erreur "Invalid API key"
➡️ Vérifier que vous utilisez la clé **anon/public** de Supabase

### Aucune donnée ne s'affiche
➡️ Vérifier que :
1. Le serveur Flask tourne (`python3 server.py`)
2. La clé Supabase est valide (`python3 test_supabase.py`)
3. Le schéma SQL a été exécuté dans Supabase

### Le nettoyage IA ne marche pas
➡️ Vérifier que :
1. La clé Mistral est valide dans `.env`
2. Le serveur Flask tourne
3. Pas d'erreurs dans les logs du serveur

## 📚 Documentation

- `SUPABASE_SETUP.md` : Configuration Supabase détaillée
- `PROBLEMES_ET_SOLUTIONS.md` : Problèmes courants et solutions
- `RESUME_CORRECTIONS.md` : Historique des corrections

## 🔐 Sécurité

- ✅ `.env` est dans `.gitignore`
- ✅ Données RGPD masquées automatiquement
- ✅ RLS désactivé (filtrage côté application)
- ⚠️ Ne jamais commiter les clés API

## 📝 Licence

Projet interne LVMH - Tous droits réservés

## 👨‍💻 Support

Pour toute question ou problème :
1. Consulter `PROBLEMES_ET_SOLUTIONS.md`
2. Vérifier les logs du serveur et de la console navigateur
3. Exécuter `python3 test_supabase.py` pour diagnostiquer
