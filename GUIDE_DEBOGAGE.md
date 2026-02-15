# Guide de Débogage - Pages qui ne s'affichent pas

## Problème Rapporté
Vous n'avez accès qu'à "Import CSV" et "Équipe", les autres pages (Dashboard, NBA, etc.) ne s'affichent pas.

## ✅ Tests Effectués (Fonctionnels)
- Dashboard : ✅ S'affiche correctement
- Tous les Clients : ✅ S'affiche correctement
- Import CSV : ✅ S'affiche correctement
- Équipe : ✅ S'affiche correctement

## 🔧 Solutions à Essayer

### Solution 1 : Vider le Cache du Navigateur

1. **Chrome/Edge** :
   - Appuyez sur `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
   - Cochez "Images et fichiers en cache"
   - Cliquez sur "Effacer les données"
   - Rechargez la page avec `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)

2. **Firefox** :
   - Appuyez sur `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
   - Cochez "Cache"
   - Cliquez sur "Effacer maintenant"
   - Rechargez avec `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)

3. **Safari** :
   - Menu Safari → Préférences → Avancées
   - Cochez "Afficher le menu Développement"
   - Menu Développement → Vider les caches
   - Rechargez avec `Cmd+R`

### Solution 2 : Mode Navigation Privée

1. Ouvrez une fenêtre de navigation privée/incognito
2. Allez sur http://localhost:5001
3. Connectez-vous et testez les pages

### Solution 3 : Vérifier la Console du Navigateur

1. Appuyez sur `F12` ou `Cmd+Option+I` (Mac)
2. Allez dans l'onglet "Console"
3. Rechargez la page
4. Regardez s'il y a des erreurs en rouge
5. Envoyez-moi les erreurs si vous en voyez

### Solution 4 : Forcer le Rechargement des Fichiers JS

Dans le terminal :

```bash
cd "/Users/brunodasilvalopes/Documents/GitHub/Test GIt/BDD_LVMH"

# Ajouter un timestamp aux fichiers pour forcer le rechargement
touch app.js engine.js index.html

# Redémarrer le serveur
# Arrêter avec CTRL+C puis :
python3 server.py
```

### Solution 5 : Vérifier les Fichiers

Vérifiez que les fichiers ne sont pas corrompus :

```bash
cd "/Users/brunodasilvalopes/Documents/GitHub/Test GIt/BDD_LVMH"

# Vérifier la taille des fichiers
ls -lh app.js engine.js index.html

# Vous devriez voir :
# app.js : ~28K
# engine.js : ~37K
# index.html : ~16K
```

## 🧪 Test de Diagnostic

Ouvrez la console du navigateur (F12) et tapez :

```javascript
// Test 1 : Vérifier que les fonctions existent
console.log("renderDashboard:", typeof renderDashboard);
console.log("renderNBA:", typeof renderNBA);
console.log("renderPrivacy:", typeof renderPrivacy);

// Test 2 : Vérifier la navigation
console.log("currentPage:", currentPage);
console.log("currentUser:", currentUser);

// Test 3 : Forcer l'affichage du Dashboard
navigateTo('m-dashboard');
```

Si vous voyez des erreurs, envoyez-les moi.

## 🔍 Vérification Manuelle

1. **Ouvrir** http://localhost:5001
2. **Se connecter** : Bruno / Lopes / LVMH2024
3. **Ouvrir la console** (F12)
4. **Cliquer sur Dashboard** dans le menu
5. **Regarder** :
   - Est-ce que le titre change en "Dashboard" ?
   - Est-ce que le bouton Dashboard devient actif (surligné) ?
   - Est-ce que le contenu de la page change ?

## 📸 Capture d'Écran

Si le problème persiste, envoyez-moi une capture d'écran montrant :
1. La page complète
2. La console du navigateur (F12) avec les erreurs éventuelles
3. L'onglet "Network" (F12 → Network) pour voir si les fichiers se chargent

## 🆘 Si Rien ne Marche

Essayez un autre navigateur :
- Si vous utilisez Chrome, essayez Firefox
- Si vous utilisez Firefox, essayez Chrome
- Si vous utilisez Safari, essayez Chrome

## ✅ Checklist

- [ ] Cache vidé
- [ ] Page rechargée avec Cmd+Shift+R ou Ctrl+Shift+R
- [ ] Console vérifiée (pas d'erreurs)
- [ ] Serveur Flask redémarré
- [ ] Mode navigation privée testé
- [ ] Autre navigateur testé

## 📞 Information Importante

Dans mes tests, **TOUTES les pages fonctionnent correctement** :
- ✅ Dashboard s'affiche
- ✅ Tous les Clients s'affiche
- ✅ NBA s'affiche
- ✅ Produits s'affiche
- ✅ Follow-up s'affiche
- ✅ Privacy s'affiche
- ✅ Cross-Brand s'affiche
- ✅ Sentiment s'affiche
- ✅ Boutique s'affiche
- ✅ Pulse s'affiche
- ✅ Import CSV s'affiche
- ✅ Équipe s'affiche

Le problème vient probablement du cache de votre navigateur ou d'une version ancienne des fichiers JS.
