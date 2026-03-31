# PATCH CLAUDE.md — Smart Follow-up v2
# Remplace / complète les sections correspondantes dans ton CLAUDE.md

## ─────────────────────────────────────────────
## SECTION À METTRE À JOUR : "PLAN D'AMÉLIORATION"
## Remplace l'entrée "AMÉLIORATION 1" par ce qui suit :
## ─────────────────────────────────────────────

### AMÉLIORATION 1 — Smart Follow-up v2 ✅ IMPLÉMENTÉ
**Statut : FAIT**
**Fichiers modifiés : `server.py`, `engine.js`, `index.html`, `index.css`, `app.js`**

**Ce qui a été fait :**
- Nouveau endpoint `/api/smart-followup` dans `server.py`
- `renderSmartFollowup(client)` dans `engine.js` remplace `generateFollowupLocal()`
- Layout split : message Mistral à gauche, 3 produits matchés à droite
- Sélecteur canal Email / WhatsApp / SMS (re-call API à chaque changement)
- Fallback local si Mistral timeout
- Boutons Copier + Régénérer

**Pipeline :**
```
Client sélectionné
  ↓ matchProductsToClient(client) → top 3 produits
  ↓ POST /api/smart-followup (tags + produits + canal + langue)
  ↓ Mistral génère message personnalisé
  ↓ Affichage split : message + cards produits avec images
```

**Endpoint `/api/smart-followup` :**
- Input : `{ client_id, client_name, tags, clean_text, products, channel, house, language }`
- Output : `{ subject, body, products_mentioned, channel, generated_at }`
- Fallback timeout : `{ error: "timeout", fallback: true }` → frontend utilise generateFollowupLocal()

---

## ─────────────────────────────────────────────
## SECTION À METTRE À JOUR : "Routes backend"
## Remplace la ligne /api/smart-followup par :
## ─────────────────────────────────────────────

| POST | `/api/smart-followup` | **[IMPLÉMENTÉ]** Follow-up IA avec produits LV — Input: {client_id, client_name, tags, clean_text, products, channel, house, language} — Output: {subject, body, products_mentioned} |

---

## ─────────────────────────────────────────────
## SECTION À METTRE À JOUR : "AUDIT TECHNIQUE — Points à corriger"
## Remplace l'entrée #5 :
## ─────────────────────────────────────────────

5. ~~**Follow-up basique** → Fusionner avec Product Matcher + Mistral (Amélioration 1)~~ ✅ FAIT

---

## ─────────────────────────────────────────────
## SECTION À AJOUTER : dans "Structure des fichiers"
## Ajoute ces précisions sur les fonctions clés :
## ─────────────────────────────────────────────

### Fonctions clés engine.js (Smart Follow-up)
```
renderSmartFollowup(client)   — Orchestrateur principal : appelle matchProducts + API + render
matchProductsToClient(client) — Retourne top N produits matchés (score ≥ 15, cache Map 50 entrées)
generateFollowupLocal(client) — FALLBACK UNIQUEMENT si Mistral timeout — ne pas supprimer
copyFollowup()                — Copie subject + body dans clipboard
regenFollowup()               — Re-appelle renderSmartFollowup avec même client + même canal
```

### Composants CSS ajoutés (index.css)
```
.followup-v2              — Conteneur principal
.followup-channels        — Sélecteur Email / WhatsApp / SMS
.channel-btn              — Bouton canal (active state gold)
.followup-split           — CSS grid 1fr 1fr
.followup-message         — Zone message gauche
.followup-message__header — Badge AI + boutons action
.followup-message__subject — Objet email (masqué si whatsapp/sms)
.followup-message__body   — Corps du message
.followup-products        — Zone produits droite
.badge-ai                 — Badge "✦ Généré par Mistral"
.followup-loading         — État chargement avec spinner gold
```

---

## ─────────────────────────────────────────────
## SECTION À AJOUTER : dans "Points d'attention (ne pas casser)"
## ─────────────────────────────────────────────

- `generateFollowupLocal()` dans `engine.js` — NE PAS SUPPRIMER, utilisé comme fallback Mistral timeout
- `matchProductsToClient()` dans `engine.js` — Cache Map 50 entrées, clé = tags triés. Toujours appeler avant `/api/smart-followup`
- `/api/smart-followup` dans `server.py` — Prompt SMART_FOLLOWUP_PROMPT sensible au format JSON de sortie Mistral. Ne pas modifier le prompt sans tester le parsing JSON.
