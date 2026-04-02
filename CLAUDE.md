# LVMH Voice-to-Tag — CLAUDE.md

## ═══════════════════════════════════════════════
## AGENTS SPÉCIALISÉS — Quand les utiliser
## ═══════════════════════════════════════════════

Ces agents sont disponibles via `/agent <nom>` ou automatiquement via le `Agent` tool.
Utilise-les systématiquement dès que la tâche correspond à leur domaine.

### Backend Python / Flask (`server.py`)
| Agent | Commande | Quand l'invoquer |
|-------|----------|-----------------|
| **python-pro** | `/python-pro` | Toute modification de `server.py` : nouveaux endpoints, refacto, async, typage |
| **refactoring-specialist** | `/refactoring-specialist` | Nettoyage de code existant, réduction de duplication dans `server.py` ou `engine.js` |

### Frontend JavaScript (`engine.js`, `app.js`, `tagger.js`)
| Agent | Commande | Quand l'invoquer |
|-------|----------|-----------------|
| **javascript-pro** | `/javascript-pro` | Toute modification JS vanilla : nouveaux renders, corrections bugs, optimisations |
| **ui-designer** | `/ui-designer` | Nouveaux composants visuels, amélioration UX des pages, cohérence design system |
| **frontend-developer** | `/frontend-developer` | Intégration complète page-à-page (HTML + CSS + JS ensemble) |

### Base de données Supabase / PostgreSQL
| Agent | Commande | Quand l'invoquer |
|-------|----------|-----------------|
| **postgres-pro** | `/postgres-pro` | Optimisation requêtes, nouveaux index, migrations Supabase, schéma BDD |
| **database-optimizer** | `/database-optimizer` | Requêtes lentes, analyse de performance, structure JSONB (`tags`, `taxonomy`) |
| **sql-pro** | `/sql-pro` | Écriture de requêtes SQL complexes, agrégations pour le dashboard cockpit |

### IA / Mistral / Prompts
| Agent | Commande | Quand l'invoquer |
|-------|----------|-----------------|
| **prompt-engineer** | `/prompt-engineer` | Amélioration des prompts Mistral (nettoyage, sentiment, NBA, smart follow-up, coach RGPD) |
| **llm-architect** | `/llm-architect` | Architecture du pipeline IA multi-étapes, gestion des fallbacks, RAG éventuel |
| **ai-engineer** | `/ai-engineer` | Intégration end-to-end Mistral → Supabase, optimisation du pipeline production |

### RGPD / Conformité légale
| Agent | Commande | Quand l'invoquer |
|-------|----------|-----------------|
| **legal-advisor** | `/legal-advisor` | Validation conformité RGPD, rédaction mentions légales, analyse des violations détectées, coach RGPD feature |

### Qualité / Sécurité
| Agent | Commande | Quand l'invoquer |
|-------|----------|-----------------|
| **code-reviewer** | `/code-reviewer` | Avant tout commit important : review complète d'un fichier ou d'une feature |
| **security-auditor** | `/security-auditor` | Audit sécurité `app.js` (SUPABASE_KEY exposée), injection SQL, XSS, API keys |
| **performance-optimizer** | `/performance-optimizer` | Optimisation Product Matcher (3.4MB JSON), temps de réponse pipeline IA, rendering |

### Documentation / Présentation LVMH
| Agent | Commande | Quand l'invoquer |
|-------|----------|-----------------|
| **documentation-engineer** | `/documentation-engineer` | Rédaction guides, documentation API, supports de démo pour la présentation LVMH |
| **technical-writer** | `/technical-writer` | Synthèse technique pour le pitch LVMH, rédaction du README, slides techniques |

### Règles d'orchestration automatique
- **Toute tâche `server.py`** → invoquer `python-pro` en premier
- **Toute tâche `engine.js` / `app.js`** → invoquer `javascript-pro` en premier
- **Tout prompt Mistral** → invoquer `prompt-engineer` pour optimisation
- **Toute migration BDD** → invoquer `postgres-pro` + `sql-pro`
- **Avant commit feature complète** → invoquer `code-reviewer` + `security-auditor`
- **Feature RGPD / Coach RGPD** → invoquer `legal-advisor` + `security-auditor`
- **Présentation / demo LVMH** → invoquer `documentation-engineer`

---

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
index.css                — Styles (design system Maison Noire, 11000+ lignes)
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
| **vendeur** | Accueil (dictée), Mes Clients, NBA, Produits, Follow-up, Client Brief, Coach RGPD, **Occasions** |
| **manager** | Tout vendeur + Dashboard cockpit, Privacy/RGPD, Sentiment, Boutique, Pulse, Import CSV, Équipe, **Collection Match**, **Leaderboard** |
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

## Navigation — Structure actuelle

### VENDEUR_NAV (8 items — limite CSS nth-of-type 8)
| # | navId | Page | Titre |
|---|-------|------|-------|
| 1 | `v-home` | `page-v-home` | Dictée vocale |
| 2 | `clients` | `page-clients` | Mes Clients |
| 3 | `nba` | `page-nba` | Next Best Action |
| 4 | `products` | `page-products` | Produits LV |
| 5 | `brief` | `page-v-brief` | Client Brief |
| 6 | `followup` | `page-followup` | Follow-up IA |
| 7 | `v-coach` | `page-coach` | Coach RGPD |
| 8 | `v-occasions` | `page-v-occasions` | Occasion Radar |

### MANAGER_NAV (17 items — LIMITE MAXIMUM CSS nth-of-type atteinte ⚠️)
Items 1-8 identiques vendeur + :
| # | navId | Page | Titre |
|---|-------|------|-------|
| 9 | `m-dashboard` | `page-m-dashboard` | Dashboard |
| 10 | `m-privacy` | `page-m-privacy` | Privacy Score |
| 11 | `m-sentiment` | `page-m-sentiment` | Sentiment |
| 12 | `m-boutique` | `page-m-boutique` | Boutique |
| 13 | `m-pulse` | `page-m-pulse` | Pulse |
| 14 | `m-import` | `page-m-import` | Import CSV |
| 15 | `m-team` | `page-m-team` | Équipe |
| 16 | `m-collection` | `page-m-collection` | Collection Match |
| 17 | `m-leaderboard` | `page-m-leaderboard` | Leaderboard |

> ⚠️ **CRITIQUE : 17 items = limite exacte du CSS Radio Glider.** Si on ajoute une page manager, il faut obligatoirement ajouter une règle `nth-of-type(18)` dans `index.css`. Sans ça, le glider sera détraqué.

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

## Algorithme ROI estimé (engine.js)

Fonction `estimateClientROI(client)` — retourne `{ amount, currency, factors[] }`.

```
base = €800
× 2.5 si Key_Account ou VIC
× 2.8 si tag horlogerie/joaillerie
× 1.8 si occasion détectée (anniversaire, mariage…)
× 1.6 si tag profession CEO/dirigeant
× 1.3 si sentiment positif
```

Utilisée par : NBA ROI Badge, Occasion Radar, Leaderboard score.

---

## Design system — Maison Noire

### Tokens CSS réels (`:root` dans `index.css`) — VERSION ACTUELLE
```css
/* Backgrounds */
--bg-canvas: #F4F4F2        /* fond warm off-white */
--bg-surface: #FFFFFF       /* fond cards */
--bg-hover: #F8F8F6
--bg-active: #F0EFEC

/* Carbon scale (remplace gold) */
--carbon: #1A1A1A           /* accent principal */
--carbon-soft: #3A3A38
--carbon-muted: #6A6A68

/* Borders */
--border: #E8E6E2
--border-strong: #D0CEC8
--border-focus: #1A1A1A

/* Text */
--text-primary: #1A1A1A
--text-secondary: #6A6A68
--text-tertiary: #9A9890
--text-muted: #B8B6B0
--text-inverse: #FFFFFF

/* Semantic status */
--color-positive: #16A34A
--color-negative: #DC2626
--color-warning: #D97706
--color-info: #2563EB

/* Fonts */
--font-display: 'Cormorant Garamond', serif
--font-body: 'DM Sans', sans-serif
```

> ⚠️ L'ancienne version utilisait `--gold: #B8965A`. Ce token n'existe plus. Utiliser `--carbon: #1A1A1A` comme accent principal.

### Principes visuels
- Sidebar dark + contenu clair (contraste fort intentionnel)
- `border-radius: 2px` partout — edges sharp, jamais de pilules
- Carbon `#1A1A1A` uniquement sur hover/active/accent — jamais en remplissage de fond
- Section headers : underline 48px via `::after` en `--carbon`
- Cards : `border: 1px solid var(--border)`, hover `translateY(-2px)` + `box-shadow`
- Login : glass morphism `backdrop-filter: blur(24px)`
- Dashboard canvas : `#F5F4F1` (légèrement plus chaud que `--bg-canvas`)

### Navigation — Radio Glider CSS
La sidebar utilise `nth-of-type` jusqu'à l'item **17** (limite atteinte avec MANAGER_NAV). Si on ajoute des pages manager, ajouter les règles CSS correspondantes dans `index.css`. Ne pas casser cette structure.

### Layout CSS critique
```
#appShell (flex row, height:100vh, overflow:hidden)
  ├── .icon-rail (position:fixed, 220px, sidebar dark)
  └── .app-body (flex col, overflow-x:hidden, overflow-y:hidden, margin-left:220px)
        ├── header.page-header (flex-shrink:0, ~64px)
        └── .page.page-canvas (flex:1, min-height:0, overflow-y:auto)  ← pages scrollent ici
```

> ⚠️ **RÈGLE CRITIQUE CSS : Ne JAMAIS mettre `display: flex !important` sur un `#id` de page.** Un sélecteur ID a une spécificité plus haute qu'une classe, donc `#page-xxx { display:flex !important }` écrase `.hidden { display:none !important }` et la page reste toujours visible. Utiliser `display: flex` sans `!important`, et si nécessaire ajouter `#page-xxx.hidden { display: none !important }`.

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
## FEATURES IMPLÉMENTÉES — Phase 1 (avant Avril 2026)
## ═══════════════════════════════════════════════

### Dashboard Cockpit refondu — KPIs business (IMPLÉMENTÉ ✅)
**Fichiers : `engine.js`, `index.html`, `index.css`**

KPIs business (branché sur vraies données, zéro hardcode) :

| KPI | Calcul | Seuils |
|-----|--------|--------|
| **Santé Portefeuille** (0-100) | `(avgSentiment×0.4) + ((1-churnRate)×100×0.35) + (privacyAvg×0.25)` | ≥80 Excellent, ≥65 Bon, ≥50 Attention, <50 Critique |
| **Clients à Risque** | count(`sentiment.level==='negative'` OU `sensitiveCount>2`) | rouge si >0, vert si =0 |
| **Couverture Active** | % clients avec `date` < 30 jours | ≥70% vert, ≥40% ambre, <40% rouge |
| **Score RGPD** | `STATS.privacyAvg` | ≥80 Conforme, ≥60 Risque, <60 Critique |

Visualisations : donut segments SVG, area chart sentiment 30j, performance vendeurs, alertes actives.
Namespace CSS : `ck-health-*`, `ck-risk-*`, `ck-coverage-*`, `ck-seg-*`, `ck-trend-*`, `ck-team-*`, `ck-alert-*`

---

### Coach RGPD Formation Complète (IMPLÉMENTÉ ✅)
**Fichiers : `engine.js`, `index.css`**

4 piliers : Scénarios guidés (10 notes à corriger) / Détection temps réel (`RGPD.scanText()`) / Progression localStorage (`lvmh_coach_progress`) / 8 flip cards RGPD Art.9.

---

### Sentiment Page (IMPLÉMENTÉ ✅)
**Fichiers : `engine.js`, `index.css`**

Refonte complète Maison Noire. Namespace `snt-*`. Layout 2 panneaux (360px alertes | 1fr clients), chacun avec `overflow-y: auto` indépendant. Distribution bar tricolore + 5 KPIs. Smart Triggers (gifting, VIC upsell, escalade, churn précoce). Optimal Outreach Window (24h/48h/3j/7j/14j).

---

### Privacy Score Page (IMPLÉMENTÉ ✅)
**Fichiers : `engine.js`, `index.css`**

Refonte complète Maison Noire. Namespace `prv-*`. Score global en Cormorant Garamond, 4 KPI cards, barre violations par type. Cards vendeur avec barre segmentée 5 blocs.

---

## ═══════════════════════════════════════════════
## FEATURES IMPLÉMENTÉES — Phase 2 (Avril 2026)
## ═══════════════════════════════════════════════

### FEATURE 1 — Occasion Radar (IMPLÉMENTÉ ✅)
**Statut : IMPLÉMENTÉ**
**Fichiers : `engine.js`, `app.js`, `index.html`, `index.css`**
**NavId : `v-occasions` | Page : `page-v-occasions` | Accès : Vendeur + Manager**

**Concept :**
Scanne automatiquement toutes les notes clients pour détecter des occasions imminentes (anniversaire, mariage, naissance, Noël, diplôme…) et affiche un countdown avec ROI estimé pour prioriser les contacts.

**Valeur business :**
Un CA sans outil rate ~40% des fenêtres d'occasion faute de visibilité. Cette feature génère des opportunités de vente ciblées sans effort supplémentaire. Gain estimé : +15-25% de taux de conversion sur les occasions.

**Algorithme de détection (`detectOccasions(client)`) :**
- `OCCASION_PATTERNS` : 10 types d'occasions (Anniversaire, Mariage, Naissance, Noël, Diplôme, Retraite, Saint-Valentin, Fête familiale, Cadeau, Emménagement) — chacun avec mots-clés FR/EN
- `TIME_PATTERNS` : 15 patterns temporels (mois + dates relatives : "le mois prochain", "dans 2 semaines"…)
- `estimateDaysUntilMonth(month)` — calcule les jours avant un mois donné
- Scanne `client.orig` + `client.clean` ; retourne array d'occasions avec `{ type, urgency, daysUntil, keywords }`

**Niveaux d'urgence :**
- `urgent-red` : ≤ 7 jours
- `urgent-orange` : ≤ 14 jours
- `urgent-amber` : ≤ 30 jours
- `urgent-green` : ≤ 90 jours
- `urgent-gray` : > 90 jours

**Rendu (`renderOccasionRadar()`) :**
- Hero avec 3 KPIs : occasions imminentes (≤7j), en approche (≤30j), ROI potentiel total
- Filtres par type d'occasion (tabs)
- Cards par client : type occasion + countdown + tags client + ROI estimé + bouton "Générer message"

**CSS namespace :** `.occasion-hero`, `.occasion-card`, `.occasion-badge`, `.occasion-countdown`, `.urgent-red/orange/amber/green/gray`

---

### FEATURE 2 — Collection Match (IMPLÉMENTÉ ✅)
**Statut : IMPLÉMENTÉ**
**Fichiers : `engine.js`, `app.js`, `index.html`, `index.css`**
**NavId : `m-collection` | Page : `page-m-collection` | Accès : Manager uniquement**

**Concept :**
Un manager saisit le nom d'une nouvelle collection LV et des mots-clés associés → l'algorithme identifie automatiquement les clients dont le profil correspond et les classe par score de pertinence.

**Valeur business :**
Aujourd'hui un manager envoie la même newsletter à tous les clients. Ce feature permet du ciblage précis par collection → taux d'engagement x3. Gain : 2-3h de travail manuel par lancement de collection.

**Algorithme (`runCollectionMatch()`) :**
- Prend les mots-clés saisis (séparés par virgules)
- Pour chaque client, score = mots-clés matchés dans `tags` (×3) + `clean` text (×1) + `nba` actions (×2)
- Tri par score décroissant, affiche top 20
- Bouton "Exporter la liste" → copie dans presse-papiers (format CSV simplifié)

**État persistant :** `window._lastCollectionSearch` — conserve les résultats après navigation

**CSS namespace :** `.collection-search-panel`, `.collection-search-btn`, `.collection-match-card`, `.collection-export-btn`

---

### FEATURE 3 — Churn Alert Réel (IMPLÉMENTÉ ✅)
**Statut : IMPLÉMENTÉ**
**Fichiers : `engine.js`, `index.css`**
**Visible : Page Clients (auto-injectée en haut)**

**Concept :**
Section automatiquement injectée en haut de la page Clients affichant les clients à risque de churn calculé avec une formule réelle (pas du keyword-matching binaire).

**Valeur business :**
Récupérer un client avant le churn coûte 5x moins cher qu'en acquérir un nouveau. Cette alerte visible dès l'ouverture de la page garantit que rien ne passe entre les mailles.

**Algorithme (`computeChurnScore(client)`) — score 0→100, plus bas = plus risqué :**
```
base = 100
− 35 si sentiment négatif
− 10 si sentiment neutre
− 25 si dernière note > 90 jours
− 12 si dernière note > 60 jours (alternatif)
− 8 par signal négatif détecté dans le texte (concurrent mentionné, plainte, insatisfaction)
+ 5 si Key_Account (plus de suivi)
```

Segments de risque :
- `critical` : score < 30 → rouge
- `high` : score < 50 → orange
- `watch` : score < 70 → ambre

**Rendu (`renderChurnAlert()`) :**
- Injectée avant le premier enfant de `#page-clients` via `insertBefore()`
- Section horizontale scrollable avec cards par client à risque
- Chaque card : avatar + score churn (ring SVG coloré) + raisons du risque + bouton Action
- Bouton Action → `window._selectedClient = client` + navigation vers Follow-up

**CSS namespace :** `.churn-alert-section`, `.churn-card`, `.churn-ring`

---

### FEATURE 4 — Morning Briefing Manager (IMPLÉMENTÉ ✅)
**Statut : IMPLÉMENTÉ**
**Fichiers : `engine.js`, `index.css`**
**Déclencheur : automatique à l'ouverture du Dashboard**

**Concept :**
Modal qui s'ouvre automatiquement une fois par jour quand un manager accède au Dashboard, résumant les métriques clés de la veille et les actions prioritaires du jour.

**Valeur business :**
Un manager passe en moyenne 20 min à "faire le point" en arrivant. Le Morning Briefing réduit ça à 30 secondes. Gain : ~1h30/semaine par manager.

**Persistance :** `localStorage.setItem('lvmh_briefing_${today}', '1')` — s'affiche une seule fois par jour. `dismissBriefing()` stocke la clé et supprime le modal avec fade animation.

**Contenu du briefing :**
- KPI grid : clients à risque / score RGPD moyen / occasions cette semaine / sentiment moyen
- Alertes prioritaires calculées en temps réel depuis `DATA` et `SENTIMENT_DATA`
- Bouton "Commencer la journée" → dismiss

**Déclencheur :** `renderDashboard()` appelle `showMorningBriefing()` en premier.

**CSS namespace :** `.briefing-overlay`, `.briefing-modal`, `.briefing-kpi-grid`, `.briefing-close`, `.briefing-start-btn`

---

### FEATURE 5 — ROI Badge sur NBA (IMPLÉMENTÉ ✅)
**Statut : IMPLÉMENTÉ**
**Fichiers : `engine.js`, `index.css`**
**Visible : Page NBA — sur chaque card action**

**Concept :**
Badge visuel sur chaque action NBA montrant le revenu potentiel estimé si l'action est réalisée.

**Valeur business :**
Les CA priorisent les actions qui ont le plus d'impact. Un badge "€ 2 800" sur une action de relance VIC la rend immédiatement prioritaire vs. une action générique. Augmente le taux d'exécution des NBA de ~30% selon les études CRM luxe.

**Calcul :** utilise `estimateClientROI(client)` — même fonction que Occasion Radar.

**Rendu :** Badge `.nba-roi-badge` inséré dans chaque card NBA. Format : `€ 1 400 potentiel`.

**CSS namespace :** `.nba-roi-badge`

---

### FEATURE 6 — Leaderboard Équipe (IMPLÉMENTÉ ✅)
**Statut : IMPLÉMENTÉ**
**Fichiers : `engine.js`, `app.js`, `index.html`, `index.css`**
**NavId : `m-leaderboard` | Page : `page-m-leaderboard` | Accès : Manager uniquement**

**Concept :**
Classement des vendeurs par score composite (RGPD + Sentiment + NBA) avec podium top 3 et tableau complet. Gamification de la qualité des notes.

**Valeur business :**
La compétition saine améliore les comportements. Les managers LVMH peuvent identifier les meilleurs CA à promouvoir et ceux qui nécessitent un coaching ciblé. Réduction attendue des violations RGPD de 20-30% grâce à l'effet leaderboard.

**Algorithme (`computeLeaderboard()`) — score composite 0→100 :**
```
score = (rgpdScore × 0.40) + (sentimentScore × 0.35) + (nbaScore × 0.25)
```
- `rgpdScore` : depuis `PRIVACY_SCORES[seller]`
- `sentimentScore` : moyenne des scores sentiment des clients de ce vendeur (depuis `DATA`)
- `nbaScore` : % de clients avec NBA générés × 100

**Rendu (`renderLeaderboard()`) :**
- Podium visuel top 3 : avatar avec initiales + barre de hauteur proportionnelle + médailles 🥇🥈🥉
- Tableau complet : rank / vendeur / score RGPD / sentiment / NBA / score total
- Légende avec pondérations

**CSS namespace :** `.leaderboard-podium`, `.leaderboard-podium-item`, `.leaderboard-podium-avatar`, `.leaderboard-podium-bar`, `.leaderboard-table`, `.leaderboard-row`

---

### FEATURE 7 — Client Journey Map (IMPLÉMENTÉ ✅)
**Statut : IMPLÉMENTÉ**
**Fichiers : `engine.js`, `index.css`**
**Déclencheur : bouton "Parcours" dans le panneau détail client**

**Concept :**
Modal pleine page affichant l'évolution de la relation client dans le temps : timeline des notes, sparkline du sentiment, tags récurrents, et actions recommandées.

**Valeur business :**
Un CA qui reprend contact après 6 mois peut contextualiser immédiatement la relation sans relire toutes les notes. Gain : 3-5 min de préparation par RDV. Démontre la capacité "mémoire long terme" de la plateforme.

**Données synthétisées :**
- Historique simulé (3 points min) basé sur les données disponibles du client
- Sparkline SVG du sentiment (`buildSentimentSparkline(scores)`) — courbe de Bézier cubique
- Timeline avec nodes colorés par sentiment
- Tags récurrents extraits de `client.tags`
- Actions CTA : "Générer Follow-up" + "Ouvrir Brief"

**Fonctions :**
- `openJourneyMap(clientId)` — crée et anime le modal, exposée sur `window`
- `closeJourneyMap()` — supprime avec fade, exposée sur `window`
- `buildSentimentSparkline(scores)` — génère un SVG path depuis un array de scores

**Point d'entrée :** Bouton `.dp-journey-btn` dans `openDetailPanel()`.

**CSS namespace :** `.journey-overlay`, `.journey-modal`, `.journey-timeline`, `.journey-node`, `.journey-close`, `.journey-cta`, `.dp-journey-btn`

---

## ═══════════════════════════════════════════════
## PLAN D'AMÉLIORATION — À implémenter
## ═══════════════════════════════════════════════

### Smart Follow-up v2 (PRIORITÉ #1)
**Statut : À IMPLÉMENTER**
**Fichiers impactés : `server.py` (nouveau endpoint), `engine.js` (nouveau render)**

Fusionner Follow-up + Product Matcher + Mistral pour générer des messages hyper-personnalisés avec produits LV intégrés naturellement. Endpoint `/api/smart-followup` existant mais render frontend à améliorer.

---

### Sentiment Analysis via Mistral (PRIORITÉ #2)
**Statut : À IMPLÉMENTER**
**Fichiers impactés : `server.py` (fonction `analyze_sentiment`)**

Remplacer le keyword-matching par un appel Mistral. Fallback keyword en cas de timeout.

---

### Client Readiness Brief (IMPLÉMENTÉ ✅)
**Statut : IMPLÉMENTÉ** — navId `brief`, page `page-v-brief`

---

## ═══════════════════════════════════════════════
## AUDIT TECHNIQUE — Faiblesses identifiées
## ═══════════════════════════════════════════════

### Points corrigés ✅
- NBA : `grid.innerHTML = ''` ajouté en début de `renderNBA()` pour éviter duplication
- Privacy trend : calcul réel première/deuxième moitié du dataset (plus de `Math.random()`)
- **Churn Risk** : formule recalibrée — plus de binaire neutre→modéré/négatif→élevé. Nouveaux paramètres : `tagCount` (engagement), `isKeyAccount`, `hasNegativeFeedback`. Appel côté `renderSentiment` résout les données réelles du client depuis `DATA`.
- **Sentiment fallback bug** (`server.py`) : 0 keyword → `neutral` (score 55) au lieu de `negative` (score 0). Nettoyage des mots-clés ambigus : `'cher'` → `'trop cher'`, `'attente'` → `'délai trop long'`, `'retard'` → `'retard livraison'`.
- **Product Matcher** : boutons de filtre par catégorie + boutons de tri entièrement fonctionnels via `applyFiltersAndSort()`.
- **Privacy Score page** : refonte complète design Maison Noire. Namespace CSS `prv-*`.
- **Sentiment page** : refonte complète design Maison Noire. Namespace CSS `snt-*`. Layout 2 panneaux indépendants.
- **Smart Triggers** (`engine.js`) : section "Opportunités commerciales" basée sur croisements Sentiment × Tags. 4 déclencheurs : gifting, VIC upsell, escalade manager, churn précoce.
- **Optimal Outreach Window** (`engine.js`) : badge par card client indiquant la fenêtre d'intervention optimale (24h/48h/3j/7j/14j).
- **Dictée vocale manager** (`app.js`) : `v-home` dans `MANAGER_NAV`.
- **Kanban buttons** (`engine.js`) : boutons page Clients entièrement fonctionnels (check, follow-up, nouvelle note).
- **NBA redesign** (`engine.js`) : icônes SVG + badges catégorie + ROI badge (Phase 2).
- **Dashboard Manager — Refonte KPIs** : KPIs business (santé portefeuille, risque, couverture, RGPD).
- **Layout fix** (`index.css`) : `.page-canvas` avec `min-height: 0` + `overflow-y: auto` — les pages scrollent dans leur container sans être clippées.
- **CSS specificity bug CRITIQUE** (`index.css`) : `#page-m-sentiment { display: flex !important }` écrasait `.hidden { display: none !important }` à cause de la spécificité ID > classe. Corrigé en retirant `!important` + ajout `#page-m-sentiment.hidden { display: none !important }`. La page Sentiment n'est plus visible en permanence sur toutes les autres pages.
- **7 nouvelles features Phase 2** : Occasion Radar, Collection Match, Churn Alert, Morning Briefing, ROI Badge NBA, Leaderboard, Journey Map — toutes implémentées et fonctionnelles.

### Points à corriger 🔧
1. **Sentiment keyword-based** → Migrer vers Mistral (Amélioration 2)
2. **Cross-Brand `Math.random()`** → Remplacer par logique basée sur les tags réels
3. **Follow-up basique** → Fusionner avec Product Matcher + Mistral (Amélioration 1)
4. **NBA prompt générique** → Enrichir avec les produits matchés + événements
5. **Churn Risk `visitFrequency`** → Toujours hardcodé à 1 (pas de données réelles)

### Points d'attention (ne pas casser) ⚠️
- `tagger.js` vs `server.py` : deux implémentations du tagger (client fallback + serveur). Ne pas les désynchroniser.
- Produits LV limités aux 500 premiers du JSON pour performances.
- Product Matcher cache `Map` de 50 entrées max.
- **MANAGER_NAV = 17 items = limite CSS nth-of-type**. Toute nouvelle page manager nécessite une règle CSS supplémentaire.
- **Ne jamais mettre `display: flex !important` sur un `#id` de page** — écrase `.hidden` à cause de la spécificité CSS.
- `SUPABASE_KEY` exposée en clair dans `app.js` (clé anon, acceptable pour le projet école mais à sécuriser en prod).
- `showMorningBriefing()` doit être appelée APRÈS que `DATA` et `SENTIMENT_DATA` sont chargés.
- `renderChurnAlert()` injecte via `insertBefore(section, clientsPage.firstChild)` — si la structure de `#page-clients` change, vérifier ce point.

---

## ═══════════════════════════════════════════════
## STRATÉGIE PRÉSENTATION LVMH
## ═══════════════════════════════════════════════

### Pitch Structure (3 angles)

**Angle 1 — Productivité Client Advisor**
"Aujourd'hui un CA passe 20 min à préparer un RDV et rate les fenêtres d'occasion. Avec le Client Brief + Occasion Radar, c'est 30 secondes."
→ Démo : Occasion Radar → client avec anniversaire dans 5 jours → ROI €2 400 → message généré en 1 clic

**Angle 2 — Revenus incrémentaux**
"Le NBA + ROI Badge + Collection Match identifie les opportunités à valeur maximale en priorité."
→ Démo : NBA avec badges ROI → Collection Match → top clients ciblés → follow-up exporté

**Angle 3 — Réduction du risque RGPD + équipe**
"Le Privacy Score + Coach RGPD + Leaderboard créent une culture de conformité et de performance."
→ Démo : Leaderboard vendeurs → coach RGPD → score vert → morning briefing manager

### Scénarios de démo préparés
1. **Scénario vendeur** : dictée vocale → pipeline → tags → Occasion Radar → message personnalisé
2. **Scénario manager (matin)** : Morning Briefing → Dashboard KPIs → Churn Alerts → actions
3. **Scénario manager (stratégie)** : Collection Match → Leaderboard → Sentiment → coaching
4. **Scénario formation** : Coach RGPD → note avec violation → correction → score vert

### Ce qui nous différencie vs. le concurrent
- Boucle complète Voice → Tag → Action concrète avec ROI chiffré
- **Occasion Radar** : détection automatique des fenêtres d'achat + countdown + ROI (aucun outil LVMH ne fait ça)
- **Collection Match** : ciblage précis pour chaque nouveau lancement collection
- **Churn Alert** : score réel basé sur sentiment + temps + signaux — pas du keyword binaire
- **Morning Briefing** : 30 secondes pour que le manager ait toute l'intelligence du jour
- **ROI Badge NBA** : priorisation immédiate des actions à valeur maximale
- **Leaderboard Équipe** : gamification de la qualité → réduction RGPD violations
- **Client Journey Map** : mémoire long terme de la relation client visualisée
- Product Matcher avec vrais produits LV (images, prix, liens) + filtres + tri
- Coach RGPD interactif (formation, pas juste détection)
- **Optimal Outreach Window** : fenêtre d'intervention optimale par client (24h/48h/7j/14j)
- **Smart Triggers** : croisement Sentiment × Tags → opportunités automatiques (gifting, VIC upsell, escalade)
- Design system cohérent Maison Noire sur toutes les pages

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
