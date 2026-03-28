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
index.html               — Structure HTML (login, sidebar, toutes les pages)
index.css                — Styles (design system Maison Noire, 4000+ lignes)
engine.js                — Moteur de rendu : toutes les fonctions d'affichage
app.js                   — Contrôleur : auth, routing, état global, appels API
server.py                — Backend Flask + pipeline IA
tagger.js                — Extracteur de tags côté client (fallback offline)
rgpd.js                  — Détection de violations RGPD
preprocessing.js         — Nettoyage texte côté client
app_local_storage.js     — Persistance localStorage
louis_vuitton_products.json — Catalogue produits LV (3.4 MB)
bg-luxury.png            — Image de fond login
supabase_schema.sql      — Schéma BDD initial
supabase_migration_taxonomy.sql — Migration taxonomie
reset_database.py        — Script utilitaire reset BDD
config.example.js        — Exemple de config (ne pas commiter .env)
prompt_mistral_cleaner.md — Prompt système Mistral (nettoyage texte)
TAXONOMIE_UTILISEE.md    — Référence complète des tags (utile pour tagger.js)
taxo.pdf                 — PDF source de la taxonomie
requirements.txt         — Dépendances Python
```

### Fichiers à ne pas modifier sans raison
- `tagger.js` — 1600+ lignes de règles regex taxonomiques, très fragile
- `server.py` — Pipeline IA multi-étapes, ordre critique

---

## Architecture du pipeline IA (server.py)

```
Transcription brute
  ↓ [1] NETTOYAGE Mistral — supprime filler words, masque données RGPD
  ↓ [2] EXTRACTION TAGS — 150+ règles regex, 7 catégories
  ↓ [3] GÉNÉRATION NBA — Mistral génère 3 actions par client
  ↓ [4] ANALYSE SENTIMENT — [À AMÉLIORER] actuellement keyword matching → migrer vers Mistral
  ↓ [5] SCORE PRIVACY — violations RGPD par vendeur + coaching
  ↓ [6] SAUVEGARDE Supabase (tags + taxonomy JSONB)
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
- `tags` (JSON), `taxonomy` (JSONB), `nba` (JSON), `sentiment` (JSON)
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
  sentiment: { level, score, justification },  // positive / negative / neutral
  sensitiveCount: number,
  sensitiveFound: array,
  rgpdMasked: number
}
```

---

## Catégories de tags (Taxonomie LVMH)

| Code | Nom | Description |
|------|-----|-------------|
| `profil` | Profil | Genre, génération, profession, nationalité, visibilité, digital, expertise |
| `interet` | Intérêt | Réseaux/clubs, collections, loisirs/sport, culture, engagements CSR |
| `voyage` | Voyage | Profil voyageur, zones géographiques (APAC, Americas, Europe, MEA) |
| `contexte` | Contexte | Bénéficiaire, célébration, style (Quiet Luxury, Signature Logo, etc.) |
| `service` | Service | Restrictions alimentaires, boissons, confort/accès, confidentialité |
| `marque` | Marque | Préférences produits (iconiques, exotiques, horlogerie), niveau d'engagement |
| `crm` | CRM | Disponibilité stock, feedback client, actions CRM (follow-up, preview, etc.) |

Stockage en base : champ `taxonomy` (JSONB) structuré par catégorie + champ `tags` (liste plate `{c, t}`).

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

## Product Matcher (engine.js)

Système de matching intelligent entre tags client et catalogue LV (3.4MB JSON, 500 premiers produits traités).

Architecture du scoring :
1. **Semantic Matching** — 40+ règles `matchingRules` mappant chaque tag vers des mots-clés produits
2. **Context-based Scoring** — bonus voyage (+20), sport (+15), professionnel (+18), cadeau (+15), style (+12)
3. **Client Text Matching** — mots du texte nettoyé matchés dans le nom produit (+8)
4. **Genre Preference** — bonus homme/femme (+10)
5. **Iconic Product Bonus** — Speedy, Neverfull, Alma, Keepall (+10)

Cache `Map` de 50 entrées max, clé = tags triés concaténés. Seuil minimum : score ≥ 15 avec au moins 1 raison de match.

---

## Design system — Maison Noire

### Tokens CSS (`:root` dans `index.css`)
```css
--gold: #B8965A          /* accent principal */
--gold-light: #D4AF6E
--gold-dark: #9C7A3E
--sidebar-bg: #0C0C0F    /* obsidien sidebar */
--content-bg: #FAFAF8    /* fond pages */
--surface: #FFFFFF       /* fond cards */
--border: #EBEBEB
--text-primary: #111010
--text-secondary: #888880
--font-display: 'Cormorant Garamond', serif   /* titres */
--font-body: 'DM Sans', sans-serif            /* corps */
--shadow-sm/md/lg/gold
--transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1)
```

### Principes visuels
- Sidebar dark obsidien + contenu clair (contraste fort intentionnel)
- `border-radius: 2px` partout — edges sharp, jamais de pilules
- Gold uniquement sur hover/active/accent, jamais en excès
- Section headers : gold underline 48px via `::after`
- Cards : `border: 1px solid var(--border)`, hover `translateY(-2px)` + `var(--shadow-gold)`
- Login : glass morphism `backdrop-filter: blur(24px)`

### Navigation — Radio Glider CSS
La sidebar utilise `nth-of-type` jusqu'à l'item 16. Si on ajoute des pages, ajouter les règles CSS correspondantes dans `index.css`. Ne pas casser cette structure.

---

## Routes backend

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/process` | Traiter un CSV (multipart ou JSON) |
| POST | `/api/process-text` | Traiter un texte saisi / audio |
| POST | `/api/followup` | *(côté client actuellement)* |
| POST | `/api/smart-followup` | **[NOUVEAU]** Follow-up IA avec produits LV |
| POST | `/api/sentiment` | **[NOUVEAU]** Analyse sentiment via Mistral |
| POST | `/api/client-brief` | **[NOUVEAU]** Génération Client Readiness Brief |
| POST | `/api/coach-rgpd` | **[NOUVEAU]** Simulation training RGPD |
| POST | `/api/admin/clear-clients` | Vider table clients |
| POST | `/api/admin/clear-all` | Vider toutes les données |

---

## Variables d'environnement (server.py)

```
MISTRAL_API_KEY     — Clé API Mistral
SUPABASE_URL        — URL du projet Supabase
SUPABASE_KEY        — Clé anon Supabase
ADMIN_SECRET        — Code admin pour suppression données
```

---

## ═══════════════════════════════════════════════
## PLAN D'AMÉLIORATION — Phase 2+ (Mars 2026)
## ═══════════════════════════════════════════════

### Contexte stratégique
- Présentation directement à LVMH (équipe Client Intelligence & Programs)
- Objectif : démontrer la boucle complète Voice → Tag → Action concrète avec ROI
- Différenciation : profondeur business + features incopiables en quelques jours
- Démo live avec données réelles en base Supabase

---

### AMÉLIORATION 1 — Smart Follow-up v2 (PRIORITÉ #1)
**Statut : À IMPLÉMENTER**
**Fichiers impactés : `server.py` (nouveau endpoint), `engine.js` (nouveau render)**

**Problème actuel :**
`generateFollowupLocal()` dans `engine.js` est un template string basique qui concatène des tags. Aucun produit LV n'est recommandé alors que le Product Matcher existe dans le même fichier.

**Solution :**
Fusionner Follow-up + Product Matcher + Mistral pour générer des messages hyper-personnalisés.

**Pipeline Smart Follow-up :**
```
Client sélectionné
  ↓ Récupérer tags + texte nettoyé
  ↓ Appeler matchProductsToClient() → top 3 produits
  ↓ Envoyer à Mistral : tags + produits (nom, prix, catégorie) + canal (email/WhatsApp)
  ↓ Mistral génère un message personnalisé avec produits intégrés naturellement
  ↓ Affichage : message + cards produits avec images + bouton copier
```

**Nouveau endpoint `/api/smart-followup` :**
- Input : `{ client_id, tags, clean_text, products: [{name, price, category}], channel, house }`
- Prompt Mistral : Expert clienteling luxe, style chaleureux, produits mentionnés naturellement
- Output : `{ subject, body, products_mentioned }`

**Rendu frontend :**
- Card split : message à gauche, produits recommandés à droite avec images du JSON
- Sélecteur : Email / WhatsApp / SMS
- Bouton "Copier" + "Régénérer"
- Badge "IA" sur le message pour montrer la génération Mistral

---

### AMÉLIORATION 2 — Sentiment Analysis via Mistral (PRIORITÉ #2)
**Statut : À IMPLÉMENTER**
**Fichiers impactés : `server.py` (fonction `analyze_sentiment`)**

**Problème actuel :**
`analyze_sentiment()` compte 18 mots positifs et 28 mots négatifs. Faux positifs fréquents (ex: "parfait pour un cadeau" ≠ satisfaction). Score peu fiable pour le Churn Risk qui en dépend.

**Solution :**
Remplacer par un appel Mistral dans le pipeline (étape 4).

**Nouveau prompt SENTIMENT_PROMPT :**
```
Tu es un analyste CRM luxe. Analyse le sentiment du client dans cette note de Client Advisor.

Texte nettoyé : {clean_text}
Tags détectés : {tags}

Évalue :
1. Le sentiment global (positive/neutral/negative)
2. Un score de 0 à 100
3. Une justification en 1 phrase
4. Les signaux détectés (mots-clés positifs et négatifs)

RÉPONSE JSON UNIQUEMENT :
{"level":"...","score":N,"justification":"...","posFound":["..."],"negFound":["..."]}
```

**Fallback :** Garder l'analyse par mots-clés si Mistral timeout.

**Impact :**
- Sentiment plus fiable → Churn Risk plus fiable → Service Recovery plus pertinent
- Justification affichable dans la card sentiment (crédibilité démo)

---

### AMÉLIORATION 3 — Client Readiness Brief (PRIORITÉ #3 — FEATURE NEUVE)
**Statut : À IMPLÉMENTER**
**Fichiers impactés : `engine.js` (nouvelle page), `app.js` (nouvelle route), `index.html` (nouvelle page), `index.css` (styles)**

**Concept :**
Avant un RDV client, le vendeur génère une fiche synthétique auto-générée à partir de toutes les données disponibles.

**Contenu du Brief :**
```
╔══════════════════════════════════════╗
║  CLIENT READINESS BRIEF             ║
║  [Nom Client] — [Date du brief]     ║
╠══════════════════════════════════════╣
║ PROFIL                              ║
║  Genre, âge, langue, statut CRM     ║
║  Profession / domaine d'expertise   ║
╠══════════════════════════════════════╣
║ CENTRES D'INTÉRÊT                   ║
║  Sports, culture, collections, CSR  ║
╠══════════════════════════════════════╣
║ HISTORIQUE & CONTEXTE               ║
║  Dernière visite, occasions à venir ║
║  Style préféré, marques favorites   ║
╠══════════════════════════════════════╣
║ RECOMMANDATIONS PRODUITS            ║
║  Top 3 produits matchés + images    ║
║  Raisons du match                   ║
╠══════════════════════════════════════╣
║ NEXT BEST ACTIONS                   ║
║  3 actions prioritaires             ║
║  Segment Uplift + justification     ║
╠══════════════════════════════════════╣
║ ⚠ POINTS D'ATTENTION               ║
║  Restrictions alimentaires/service  ║
║  Protocole confidentialité          ║
║  Sentiment actuel + churn risk      ║
╚══════════════════════════════════════╝
```

**Implémentation :**
- Nouvelle page dans la sidebar vendeur + manager (entre "Produits" et "Follow-up")
- Sélecteur de client (dropdown ou recherche)
- Génération côté client (agrège DATA existant) + optionnel appel Mistral pour synthèse narrative
- Bouton "Exporter PDF" ou "Imprimer"
- Design : card pleine page, sections gold underline, produits avec images

**Valeur business :**
Aucun outil LVMH ne fait ça aujourd'hui. Gain de temps CA estimé : 5-10 min par RDV. Démontre la boucle complète Voice → Intelligence actionnable.

---

### AMÉLIORATION 4 — Dashboard Cockpit avec vraies données (PRIORITÉ #4)
**Statut : À CORRIGER**
**Fichiers impactés : `engine.js` (fonction `renderDashboard`)**

**Problème actuel :**
Les widgets du cockpit manager utilisent des données hardcodées :
- `renderSparkline()` : `[10, 15, 12, 18, 20, 15, 22, 25, 20, 28]` — faux
- `renderCockpitMain()` : `dataA = [40, 25, 50, 30, 60, 75, 45]` — faux
- `renderPrivacyDonut()` : `val = 85` — hardcodé au lieu de `STATS.privacyAvg`
- `renderRadar()` : `data = [0.8, 0.6, 0.9, 0.4, 0.7]` — faux
- `renderCalendar()` : dates hardcodées
- Privacy trend : `previousAvg = STATS.privacyAvg - (Math.random() * 10 - 5)` — randomisé

**Solution :**
Remplacer par les vraies données de `DATA`, `STATS`, `PRIVACY_SCORES`, `SENTIMENT_DATA`.
- Sparklines : calculées à partir des dates des notes (groupées par jour/semaine)
- Chart principal : évolution réelle des notes traitées
- Privacy donut : `STATS.privacyAvg`
- Radar : scores réels par catégorie de tag (profil, intérêt, voyage, etc.)
- Trend : comparer première moitié vs deuxième moitié du dataset

---

### AMÉLIORATION 5 — Coach RGPD Interactif (PRIORITÉ #5 — FEATURE NEUVE)
**Statut : À IMPLÉMENTER**
**Fichiers impactés : `engine.js` (nouvelle page), `server.py` (nouveau endpoint), `index.html`, `index.css`**

**Concept :**
Mode simulation où le vendeur dicte/tape une note fictive et reçoit un feedback en temps réel.

**Pipeline Coach :**
```
Note fictive du vendeur
  ↓ Détection RGPD (réutilise detect_sensitive() + RGPD_SENSITIVE)
  ↓ Analyse qualité de la note (nombre de tags extractibles)
  ↓ Mistral génère des suggestions de reformulation
  ↓ Feedback visuel : passages problématiques surlignés en rouge
  ↓ Score de conformité + score de richesse informationnelle
  ↓ Le vendeur peut réessayer (gamification)
```

**Nouveau endpoint `/api/coach-rgpd` :**
- Input : `{ text, language }`
- Output : `{ rgpd_score, quality_score, violations: [{text, category, suggestion}], extractable_tags_count, feedback }`

**Rendu frontend :**
- Texte avec passages RGPD surlignés en rouge + tooltip "Pourquoi c'est interdit"
- Barre de progression : Score RGPD (vert/orange/rouge)
- Barre de progression : Score Qualité (richesse des infos pour le CRM)
- Section "Suggestions de reformulation" générées par Mistral
- Historique des tentatives du vendeur dans la session

**Valeur business :**
LVMH investit déjà dans la formation CA. Cet outil réduit le risque RGPD en amont au lieu de le détecter après coup. Impact : réduction des violations + meilleure qualité des notes = meilleurs tags = meilleur CRM.

---

## ═══════════════════════════════════════════════
## AUDIT TECHNIQUE — Faiblesses identifiées
## ═══════════════════════════════════════════════

### Points corrigés ✅
- NBA : `grid.innerHTML = ''` ajouté en début de `renderNBA()` pour éviter duplication

### Points à corriger 🔧
1. **Sentiment keyword-based** → Migrer vers Mistral (Amélioration 2)
2. **Dashboard données mock** → Brancher sur vraies données (Amélioration 4)
3. **Cross-Brand `Math.random()`** → Remplacer par logique basée sur les tags réels des clients
4. **Privacy trend randomisé** → `previousAvg = STATS.privacyAvg - (Math.random() * 10 - 5)` → comparer première/deuxième moitié du dataset
5. **Follow-up basique** → Fusionner avec Product Matcher + Mistral (Amélioration 1)
6. **NBA prompt générique** → Enrichir avec les produits matchés + événements du client
7. **Churn Risk `visitFrequency = 1`** → Toujours hardcodé à 1 (pas de données réelles de fréquence). Solution : calculer à partir de `DATA` si multiple entrées par client.

### Points d'attention (ne pas casser) ⚠️
- `tagger.js` vs `server.py` : deux implémentations du tagger (client fallback + serveur). Ne pas les désynchroniser.
- Produits LV limités aux 500 premiers du JSON pour performances.
- Product Matcher cache `Map` de 50 entrées max.
- Sidebar CSS `nth-of-type` jusqu'à l'item 16. Si ajout de pages → ajouter les règles CSS.
- `SUPABASE_KEY` exposée en clair dans `app.js` (clé anon, acceptable pour le projet école mais à sécuriser en prod).

---

## ═══════════════════════════════════════════════
## STRATÉGIE PRÉSENTATION LVMH
## ═══════════════════════════════════════════════

### Pitch Structure (3 angles)

**Angle 1 — Productivité Client Advisor**
"Aujourd'hui un CA passe X minutes à préparer un RDV client. Avec le Client Readiness Brief, c'est automatique."
→ Démo : sélectionner un client → brief généré en 2 secondes

**Angle 2 — Revenus incrémentaux**
"Le NBA + Smart Follow-up identifie des opportunités et génère des messages avec les bons produits LV."
→ Démo : montrer un follow-up personnalisé avec 3 produits recommandés (images + prix + liens)

**Angle 3 — Réduction du risque RGPD**
"Le Privacy Score + Coach RGPD réduisent l'exposition légale en formant les CA en amont."
→ Démo : taper une note avec violation → feedback immédiat → correction → score vert

### Scénarios de démo préparés
1. **Scénario vendeur** : dictée vocale → traitement pipeline → tags → produits matchés → follow-up IA
2. **Scénario manager** : cockpit → privacy scores → sentiment → alertes churn → actions
3. **Scénario formation** : coach RGPD → note avec violation → correction guidée

### Ce qui nous différencie vs. le concurrent
- Boucle complète Voice → Tag → Action concrète (pas juste des tags)
- Product Matcher avec vrais produits LV (images, prix, liens)
- Smart Follow-up IA personnalisé (pas un template)
- Client Readiness Brief (aucun outil LVMH ne fait ça)
- Coach RGPD interactif (formation, pas juste détection)
- Design system cohérent Maison Noire

---

## Lancer le projet

### Backend (Flask + Mistral)
```bash
cd "chemin/vers/BDD_LVMH"
pip install -r requirements.txt
python server.py
# → http://localhost:5001
```

### Frontend (serveur statique)
```bash
cd "chemin/vers/BDD_LVMH"
python3 -m http.server 8080
# → http://localhost:8080
```

### Variables d'environnement (.env)
```
MISTRAL_API_KEY=...
SUPABASE_URL=https://vgkklymckkwrcpjrnzhr.supabase.co
SUPABASE_KEY=...
ADMIN_SECRET=...
```
