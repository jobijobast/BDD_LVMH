# Base de Données Produits Louis Vuitton

## Source

**Dataset Hugging Face**: [DBQ/Louis.Vuitton.Product.prices.France](https://huggingface.co/datasets/DBQ/Louis.Vuitton.Product.prices.France)

## Fichier

- **Nom**: `louis_vuitton_products.json`
- **Taille**: 3.3 MB
- **Nombre de produits**: 4,500 produits Louis Vuitton
- **Date des données**: 17 novembre 2023
- **Marché**: France (prix en EUR)

## Structure des Données

Chaque produit contient les champs suivants :

```json
{
  "website_name": "Louis Vuitton",
  "competence_date": "2023-11-17",
  "country_code": "FRA",
  "currency_code": "EUR",
  "brand": "LOUIS VUITTON",
  "category1_code": "FEMME",
  "category2_code": "SACS A MAIN",
  "category3_code": "SACS MONOGRAM ICONIQUES",
  "product_code": "NVPROD3190095V/M46222",
  "title": "Sac Speedy Bandoulière 20",
  "itemurl": "https://fr.louisvuitton.com/...",
  "imageurl": "https://fr.louisvuitton.com/images/...",
  "full_price": 1750.0,
  "price": 1750.0,
  "full_price_eur": 1750.0,
  "price_eur": 1750.0,
  "flg_discount": 0
}
```

## Catégories Principales

### Catégorie 1 (category1_code)
- FEMME
- HOMME
- NOUVEAUTES
- ART DE VIVRE
- PARFUMS
- JOAILLERIE

### Catégorie 2 (category2_code)
- SACS A MAIN
- PRET A PORTER
- SOULIERS
- ACCESSOIRES
- VOYAGE
- BIJOUX
- MAISON
- etc.

### Catégorie 3 (category3_code)
- Sous-catégories spécifiques par type de produit

## Utilisation dans l'Application

Le fichier `engine.js` charge automatiquement cette base de données au démarrage :

```javascript
await loadLVProducts();
```

Le système de matching produit utilise :
- Les tags clients (intérêts, profil, contexte)
- Les catégories de produits
- Les mots-clés dans les titres
- Un système de scoring sémantique

## Mise à Jour

Pour télécharger une version plus récente ou compléter les données :

```bash
# Télécharger via l'API Hugging Face (100 produits max par requête)
curl -X GET "https://datasets-server.huggingface.co/rows?dataset=DBQ%2FLouis.Vuitton.Product.prices.France&config=default&split=train&offset=0&length=100"
```

**Note**: Le dataset complet contient 7,806 produits. Actuellement, 4,500 sont téléchargés en raison des limitations de l'API.

## Avantages

✅ **Données réelles** : Produits officiels Louis Vuitton  
✅ **Prix actualisés** : Prix en euros pour le marché français  
✅ **Images haute qualité** : URLs directes vers les images produits  
✅ **Liens directs** : URLs vers les pages produits sur louisvuitton.com  
✅ **Catégorisation complète** : 3 niveaux de catégories  
✅ **Codes produits** : SKU officiels Louis Vuitton  

## Exemples de Produits

- **Sacs iconiques** : Speedy, Neverfull, Alma, Keepall
- **Prêt-à-porter** : Vestes, manteaux, t-shirts, pantalons
- **Accessoires** : Lunettes, ceintures, écharpes, bijoux
- **Voyage** : Valises, sacs de voyage, organiseurs
- **Parfums** : Collections masculines et féminines
- **Joaillerie** : Colliers, bracelets, boucles d'oreilles
- **Art de vivre** : Objets décoratifs, papeterie, sport

## Gamme de Prix

- **Minimum** : ~200 € (petits accessoires)
- **Maximum** : ~190,000 € (malles sur mesure)
- **Moyenne** : ~1,500-3,000 € (sacs et maroquinerie)
