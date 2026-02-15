# Problèmes identifiés et Solutions

## ✅ CORRIGÉ : Erreur TypeError sur sensitiveFound.forEach

**Problème** : `TypeError: (row.sensitiveFound || []).forEach is not a function`

**Cause** : Les données de Supabase peuvent retourner `null` au lieu de tableaux vides

**Solution appliquée** :
- Ajout de vérifications `Array.isArray()` dans `loadClientsFromDB()` (app.js lignes 236-252)
- Protection dans `recomputeStats()` (app.js lignes 293-306)

## ❌ PROBLÈME ACTUEL : Clé Supabase invalide

**Erreur** : `Invalid API key` lors de la connexion

**Cause** : La clé Supabase dans le code est invalide ou expirée

**Solution URGENTE** :

### Étape 1 : Obtenir la vraie clé
1. Aller sur https://supabase.com/dashboard
2. Se connecter avec votre compte
3. Sélectionner le projet `vgkklymckkwrcpjrnzhr`
4. Aller dans **Settings** → **API**
5. Copier la clé **anon public** (PAS la service_role)

### Étape 2 : Mettre à jour les fichiers

**Fichier `.env`** :
```bash
SUPABASE_KEY=VOTRE_VRAIE_CLE_ANON_PUBLIC_ICI
```

**Fichier `app.js` (ligne 8)** :
```javascript
const SUPABASE_KEY = 'VOTRE_VRAIE_CLE_ANON_PUBLIC_ICI';
```

### Étape 3 : Redémarrer
```bash
# Arrêter le serveur Flask (CTRL+C dans le terminal)
python3 server.py
```

### Étape 4 : Tester
```bash
python3 test_supabase.py
```

Vous devriez voir `Status: 200` au lieu de `Status: 401`

## 🔧 ALTERNATIVE : Solution temporaire sans Supabase

Si vous ne pouvez pas obtenir la clé immédiatement, je peux créer une version qui fonctionne avec une base de données locale (SQLite).

## ⚠️ Autres problèmes potentiels

### Serveur Flask non démarré
**Symptôme** : Les fonctionnalités de nettoyage IA ne marchent pas

**Solution** : Vérifier que le serveur Flask tourne sur le port 5001
```bash
python3 server.py
```

### Base de données vide
**Symptôme** : Aucune donnée n'apparaît dans le dashboard manager

**Solution** : Importer des données via CSV ou créer des entrées de test

## 📝 Checklist de vérification

- [ ] Serveur Flask démarré (`python3 server.py`)
- [ ] Clé Supabase valide dans `.env` et `app.js`
- [ ] Test de connexion réussi (`python3 test_supabase.py`)
- [ ] Navigateur rechargé (F5)
- [ ] Console du navigateur sans erreurs (F12)

## 🆘 Besoin d'aide ?

Si le problème persiste après avoir mis à jour la clé Supabase, vérifiez :
1. La console du navigateur (F12) pour les erreurs JavaScript
2. Les logs du serveur Flask pour les erreurs Python
3. Que le schéma SQL a été exécuté dans Supabase
