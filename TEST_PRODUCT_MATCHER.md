# Test du Product Matcher

## 🧪 Comment tester

### 1. Démarrer le serveur
```bash
python server.py
```

### 2. Se connecter à l'application
- Ouvrir http://localhost:5001
- Se connecter avec vos identifiants

### 3. Créer des profils clients de test

#### Test 1 : Cliente Femme + Golf
**Transcription à dicter :**
```
Madame Sophie Dubois, 35 ans, passionnée de golf. 
Elle cherche un sac élégant pour ses parcours au golf club.
Budget flexible, style classique et intemporel.
```

**Résultat attendu :**
- Produits catégorie "Femme"
- Produits liés au golf (si disponibles dans la base LV)
- Sacs et accessoires classiques

---

#### Test 2 : Client Homme + Business Travel
**Transcription à dicter :**
```
Monsieur Jean Martin, 45 ans, directeur général.
Voyage beaucoup pour le travail, besoin d'un bagage professionnel.
Recherche qualité et durabilité, style sobre et élégant.
```

**Résultat attendu :**
- Produits catégorie "Homme"
- Keepall, Horizon, valises
- Attaché-cases et organiseurs
- Match sur "Business_Travel"

---

#### Test 3 : Cliente + Anniversaire
**Transcription à dicter :**
```
Madame Claire Lefebvre, 28 ans.
Cherche un cadeau pour son anniversaire.
Aime les accessoires élégants et les bijoux.
Budget environ 1500 euros.
```

**Résultat attendu :**
- Produits catégorie "Femme"
- Sacs, accessoires, petite maroquinerie
- Match sur "Anniversaire"

---

#### Test 4 : Client sans match évident
**Transcription à dicter :**
```
Monsieur Pierre Durand, 50 ans.
Intéressé par la cuisine et la gastronomie.
Cherche quelque chose d'unique.
```

**Résultat attendu :**
- Soit quelques produits génériques (si match faible)
- Soit message "Aucun produit ne correspond" (si pas de match)

---

## ✅ Points de vérification

### Chargement de la base de données
- [ ] Console du navigateur affiche : "✅ Loaded XXXX Louis Vuitton products"
- [ ] Pas d'erreur de chargement

### Page Product Matcher
- [ ] Les images des produits s'affichent correctement
- [ ] Les prix sont affichés (format "X XXX,XX€")
- [ ] Les tags de match sont visibles (ex: "Match: Femme, Golf")
- [ ] Le lien "Voir sur LV →" fonctionne

### Pertinence des recommandations
- [ ] Les produits correspondent au genre du client (Femme/Homme)
- [ ] Les produits correspondent aux centres d'intérêt
- [ ] Les produits correspondent au contexte (anniversaire, voyage, etc.)
- [ ] Pas de produits non pertinents

### Cas limites
- [ ] Client sans tags → Message "Aucun client avec tags"
- [ ] Client avec tags mais pas de match → Message "Aucun produit ne correspond"
- [ ] Erreur de chargement JSON → Message d'erreur clair

---

## 🐛 Debugging

### Si les images ne s'affichent pas
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs de chargement d'images
3. Les URLs d'images doivent pointer vers `fr.louisvuitton.com`

### Si aucun produit n'est matché
1. Vérifier que le fichier JSON est bien chargé (console)
2. Vérifier les tags extraits du client (page Clients)
3. Vérifier que les tags correspondent aux règles de matching

### Si le fichier JSON ne charge pas
1. Vérifier le chemin : `louis_vuitton_femme_et_homme copie.json` à la racine
2. Vérifier les permissions du fichier
3. Vérifier la console pour les erreurs CORS

---

## 📊 Métriques de succès

- **Taux de match** : >70% des clients avec tags doivent avoir au moins 1 produit matché
- **Pertinence** : Les 3 premiers produits doivent être cohérents avec le profil
- **Performance** : Chargement < 1 seconde
- **Stabilité** : Pas d'erreurs JavaScript

---

## 🔄 Tests de régression

Après chaque modification du code :

1. **Test de chargement**
   - Rafraîchir la page
   - Vérifier que les produits se chargent

2. **Test de matching**
   - Créer un nouveau client avec tags connus
   - Vérifier que les produits matchent

3. **Test d'affichage**
   - Vérifier que les images s'affichent
   - Vérifier que les prix sont corrects
   - Vérifier que les liens fonctionnent

---

## 📝 Notes

- Le matching est basé sur les tags de la taxonomie LVMH
- Les tags sont extraits automatiquement par l'IA (Mistral)
- Le système peut être étendu à d'autres marques LVMH
- Les images sont hébergées par Louis Vuitton (CDN externe)

---

**Dernière mise à jour :** 17 février 2026
