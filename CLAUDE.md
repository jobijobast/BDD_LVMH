# LVMH Voice-to-Tag — CLAUDE.md

## Projet

Plateforme CRM IA pour les boutiques LVMH. Les vendeurs dictent des notes vocales sur leurs rendez-vous clients ; un pipeline IA nettoie le texte, extrait des tags, génère des recommandations (NBA) et analyse le sentiment. Les managers accèdent à un cockpit analytique complet.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | HTML5, CSS3, JavaScript vanilla (pas de framework) |
| Backend | Python Flask |
| IA | Mistral AI API |
| Base de données | Supabase (PostgreSQL) |
| Reconnaissance vocale | Web Speech API (natif navigateur) |
| Produits LV | JSON Hugging Face (`louis_vuitton_products.json`) |

---

## Structure des fichiers

```
index.html          — Structure HTML (login, sidebar, toutes les pages)
index.css           — Styles (design LVMH : blanc, noir #111, or #9C8249)
engine.js           — Moteur de rendu : toutes les fonctions d'affichage
app.js              — Contrôleur : auth, routing, état global, appels API
server.py           — Backend Flask + pipeline IA
tagger.js           — Extracteur de tags côté client (fallback offline)
rgpd.js             — Détection de violations RGPD
preprocessing.js    — Nettoyage texte côté client
app_local_storage.js — Persistance localStorage
```

### Fichiers à ne pas modifier sans raison
- `tagger.js` — 1600+ lignes de règles regex taxonomiques, très fragile
- `server.py` — Pipeline IA multi-étapes, ordre critique

---

## Architecture du pipeline IA (server.py)

```
Transcription brute
  ↓ [1] NETTOYAGE Mistral — supprime filler words, masque données RGPD
  ↓ [2] EXTRACTION TAGS — 200+ règles regex, 7 catégories
  ↓ [3] GÉNÉRATION NBA — Mistral génère 3 actions par client
  ↓ [4] ANALYSE SENTIMENT — matching mots-clés (FR/EN/ES)
  ↓ [5] SCORE PRIVACY — violations RGPD par vendeur
  ↓ [6] SAUVEGARDE Supabase
```

---

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **vendeur** | Accueil (dictée), Mes Clients, NBA, Produits, Follow-up |
| **manager** | Tout vendeur + Dashboard cockpit, Privacy/RGPD, Cross-Brand, Sentiment, Boutique, Pulse, Import CSV, Équipe |
| **admin** | Bruno Lopes uniquement — suppression des données |

---

## État global (app.js)

```javascript
DATA            // Array de clients avec tags, NBA, sentiment
STATS           // { clients, tags, ai, rgpd, nba, privacyAvg, atRisk }
PRIVACY_SCORES  // Score RGPD par vendeur
SENTIMENT_DATA  // Sentiment par client
RGPD_BAD        // Violations RGPD détectées
```

---

## Schéma base de données (Supabase)

### Table `clients`
- `id`, `boutique_id`, `seller_id`, `external_id`, `client_name`
- `original_text`, `cleaned_text`
- `tags` (JSON), `nba` (JSON), `sentiment` (JSON)
- `sensitive_found` (JSON), `sensitive_count`, `rgpd_masked`
- `store`, `language`, `date`, `created_at`

### Table `sellers`
- `id`, `boutique_id`, `first_name`, `last_name`, `role`, `created_at`

### Table `boutiques`
- `id`, `name`, `code`, `region`, `parent_id`

---

## Structure d'un objet client (frontend)

```javascript
{
  id: string,           // external_id
  date: string,
  lang: string,         // FR / EN / ES / IT / DE
  ca: string,           // client_name
  store: string,
  orig: string,         // transcription originale
  clean: string,        // texte nettoyé par IA
  tags: [{ t: string, c: string }],  // valeur tag, catégorie
  nba: [{ action, type, category }],
  sentiment: { level, score },       // positive / negative / neutral
  sensitiveCount: number,
  sensitiveFound: array,
  rgpdMasked: number
}
```

---

## Catégories de tags

| Code | Nom | Description |
|------|-----|-------------|
| `profil` | Profil | Genre, génération, profession, nationalité |
| `interet` | Intérêt | Sports, arts, gastronomie, lifestyle |
| `voyage` | Voyage | Destinations, fréquence, type de voyage |
| `contexte` | Contexte | Occasion (cadeau, anniversaire), style |
| `service` | Service | Services demandés (gravure, retouche…) |
| `marque` | Marque | Maisons LVMH préférées, lignes iconiques |
| `crm` | CRM | Key Account, VIC, potentiel cross-sell |

---

## Algorithme NBA Uplift (engine.js)

```
upliftScore = (sentimentScore / 100) × tagDensity × eventBoost − 0.3
```

Segments :
- **Persuadables** → uplift > 0.3 et pas négatif (ROI élevé)
- **Valeurs Sûres** → uplift > 0 et sentiment positif
- **Chiens Dormants** → uplift faible, besoin de relance douce
- **Cas Perdus** → uplift < -0.2 ou sentiment négatif

---

## Design system

- **Background** : `#FFFFFF` + image `bg-luxury.png`
- **Texte** : `#111111`
- **Or (accent)** : `#9C8249` / `#D4AF37`
- **Typographie** : Playfair Display (titres) + Inter (corps)
- **Navigation** : sidebar radio-glider animé (CSS nth-of-type)
- **Mobile** : bottom nav + sidebar overlay

---

## Variables d'environnement (server.py)

```
MISTRAL_API_KEY     — Clé API Mistral
SUPABASE_URL        — URL du projet Supabase
SUPABASE_KEY        — Clé anon Supabase
ADMIN_SECRET        — Code admin pour suppression données
```

---

## Routes backend

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/process` | Traiter une transcription vocale |
| POST | `/api/process-text` | Traiter un texte saisi |
| POST | `/api/followup` | Générer message de suivi |
| POST | `/api/admin/clear-clients` | Vider table clients |
| POST | `/api/admin/clear-all` | Vider toutes les données |

---

## Points d'attention

- **RGPD** : Ne jamais stocker orientation sexuelle, opinions politiques, religion, données de santé, conflits familiaux, problèmes financiers. Le pipeline les détecte et masque automatiquement.
- **tagger.js vs server.py** : Deux implémentations du tagger existent (client + serveur). Le client est un fallback offline — ne pas les désynchroniser.
- **Glider CSS** : La navigation sidebar utilise `nth-of-type` jusqu'à 16 items. Si on ajoute des pages, ajouter les règles CSS correspondantes dans `index.css`.
- **Produits LV** : Limités aux 500 premiers du JSON pour les performances. Le matching utilise un cache `Map` de 50 entrées max.
- **Math.random()** dans `renderCrossBrand()` — les profils cross-brand sont partiellement randomisés pour l'anonymisation, ce comportement est intentionnel.
