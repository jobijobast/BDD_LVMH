# 🛍️ Product Matcher Louis Vuitton - Guide d'utilisation

## Vue d'ensemble

Le **Product Matcher** est un système intelligent qui recommande automatiquement des produits Louis Vuitton en fonction du profil et des préférences de chaque client.

---

## 🎯 Comment ça marche ?

### 1. Analyse du profil client
Lorsque vous créez une note client (vocale ou texte), l'IA extrait automatiquement :
- **Genre** : Femme, Homme
- **Centres d'intérêt** : Golf, Tennis, Voyage, Art, etc.
- **Occasions** : Anniversaire, Mariage, Cadeau
- **Style** : Classique, Moderne, Minimaliste
- **Contexte** : Business Travel, Loisir Premium

### 2. Matching intelligent
Le système analyse la base de données Louis Vuitton (3000+ produits) et :
- Compare les tags du client avec les descriptions produits
- Calcule un score de pertinence pour chaque produit
- Sélectionne les 3 meilleurs matches

### 3. Affichage des recommandations
Pour chaque client, vous voyez :
- **Image réelle** du produit
- **Nom et description** du produit
- **Prix** officiel Louis Vuitton
- **Raisons du match** (tags correspondants)
- **Lien direct** vers la page produit LV

---

## 📱 Utilisation

### Accéder au Product Matcher

1. **Vendeur** : Cliquez sur l'onglet "🛍 Produits" dans le menu
2. **Manager** : Même chose, accessible depuis le menu latéral

### Interpréter les résultats

#### Exemple d'affichage :
```
┌─────────────────────────────────────────┐
│ Mme Sophie Dubois    3 produits trouvés │
├─────────────────────────────────────────┤
│ Tags: Femme | Golf | 25-40 | Classique  │
├─────────────────────────────────────────┤
│ [IMAGE]  Cabas OnTheGo PM               │
│          Monogram 130                    │
│          2 700,00€                       │
│          Match: Femme, Golf              │
│          Voir sur LV →                   │
├─────────────────────────────────────────┤
│ [IMAGE]  Speedy Bandoulière 25          │
│          Cuir Épi                        │
│          1 850,00€                       │
│          Match: Femme, Classique         │
│          Voir sur LV →                   │
└─────────────────────────────────────────┘
```

---

## 🎨 Cas d'usage

### Cas 1 : Cliente passionnée de golf
**Profil :** Femme, 35 ans, joue au golf, style classique

**Produits recommandés :**
- Sacs de golf LV (si disponibles)
- Sacs cabas pour le club house
- Accessoires élégants et pratiques

**Utilisation :** Montrez ces produits lors du rendez-vous client

---

### Cas 2 : Client en voyage d'affaires
**Profil :** Homme, 45 ans, voyages fréquents, executive

**Produits recommandés :**
- Keepall (bagage iconique)
- Horizon (valise cabine)
- Organiseurs et porte-documents
- Attaché-cases

**Utilisation :** Préparez une sélection avant son arrivée

---

### Cas 3 : Cadeau d'anniversaire
**Profil :** Femme, 28 ans, anniversaire, budget 1500€

**Produits recommandés :**
- Petite maroquinerie
- Sacs de taille moyenne
- Accessoires premium

**Utilisation :** Créez un coffret cadeau personnalisé

---

## 🔍 Comprendre le matching

### Critères de matching (par ordre de priorité)

1. **Genre** (+30 points)
   - Match exact Femme/Homme avec catégorie produit

2. **Centres d'intérêt spécifiques** (+25 points)
   - Golf, Tennis, Voyage d'affaires
   - Match direct dans nom/description produit

3. **Tags dans description** (+20 points)
   - Le nom du tag apparaît dans la description produit

4. **Mots-clés associés** (+15 points)
   - Mots-clés liés au tag (ex: "golf" → "parcours", "green")

5. **Occasions** (+10-20 points)
   - Anniversaire → Bijoux, accessoires
   - Mariage → Bijoux, cadeaux premium

6. **Matching sémantique** (+3-10 points)
   - Mots du texte client présents dans description produit

**Seuil minimum :** 20 points pour qu'un produit soit proposé

---

## ⚙️ Configuration

### Ajouter d'autres bases de données produits

Le système est conçu pour être extensible. Pour ajouter une autre marque :

1. Créez un fichier JSON avec la même structure :
```json
[
  {
    "brand": "Nom de la marque",
    "name": "Nom du produit",
    "price": "Prix",
    "category": "Catégorie",
    "description": "Description",
    "image_urls": ["url1", "url2"],
    "url": "lien produit"
  }
]
```

2. Modifiez `engine.js` pour charger ce fichier
3. Adaptez les règles de matching si nécessaire

---

## 🚨 Résolution de problèmes

### Problème : Aucun produit ne s'affiche

**Causes possibles :**
1. Le fichier JSON n'est pas chargé
   - Vérifiez la console : devrait afficher "✅ Loaded XXXX products"
   - Vérifiez que le fichier existe à la racine

2. Les tags ne matchent pas
   - Vérifiez les tags extraits (page Clients)
   - Vérifiez que les tags correspondent aux règles de matching

3. Le seuil de score n'est pas atteint
   - Normal si le profil est très spécifique
   - Le système préfère ne rien proposer que proposer n'importe quoi

### Problème : Les images ne s'affichent pas

**Causes possibles :**
1. URLs d'images invalides dans le JSON
2. Problème de CORS (les images LV sont sur un autre domaine)
3. Connexion internet lente

**Solution :** Les images sont chargées depuis le CDN Louis Vuitton, elles peuvent prendre quelques secondes à charger.

### Problème : Produits non pertinents

**Causes possibles :**
1. Tags mal extraits par l'IA
   - Vérifiez la transcription nettoyée
   - Reformulez la note client pour être plus précis

2. Règles de matching à ajuster
   - Modifiez les poids dans `matchingRules` (engine.js)
   - Ajoutez de nouveaux mots-clés

---

## 📊 Métriques et analytics

### Indicateurs à suivre

1. **Taux de match**
   - % de clients avec au moins 1 produit matché
   - Objectif : >70%

2. **Pertinence**
   - Feedback des vendeurs sur la qualité des recommandations
   - Taux de conversion (produits recommandés → achats)

3. **Performance**
   - Temps de chargement de la base de données
   - Temps de calcul du matching

---

## 🔮 Évolutions futures

### Court terme
- [ ] Ajouter filtres par prix
- [ ] Ajouter filtres par disponibilité
- [ ] Historique des produits consultés

### Moyen terme
- [ ] Intégration d'autres marques LVMH (Dior, Fendi, etc.)
- [ ] Machine learning pour améliorer le scoring
- [ ] Recommandations basées sur l'historique d'achats

### Long terme
- [ ] API temps réel avec le stock boutique
- [ ] Personnalisation par boutique
- [ ] A/B testing des recommandations

---

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation technique : `PRODUCT_MATCHER_IMPROVEMENTS.md`
2. Testez avec les scénarios : `TEST_PRODUCT_MATCHER.md`
3. Vérifiez les logs dans la console du navigateur (F12)

---

## 📄 Licence et crédits

- **Système développé pour :** LVMH Voice-to-Tag Platform
- **Base de données produits :** Louis Vuitton (données scrapées)
- **IA de matching :** Algorithme propriétaire
- **Images produits :** © Louis Vuitton (CDN externe)

---

**Version :** 2.0  
**Dernière mise à jour :** 17 février 2026  
**Auteur :** Bruno da Silva Lopes
