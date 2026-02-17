# Améliorations du nettoyage des données — LVMH Voice-to-Tag

## Résumé des modifications

### 1. **Nettoyage amélioré (CLEANING_PROMPT)**

Le prompt de nettoyage a été considérablement renforcé pour :

#### ✅ Supprimer TOTALEMENT les mots parasites
- **Hésitations** : euh, hum, uh, um, eh, ah, oh, hmm, bah, ben, hein, voilà
- **Fillers** : genre, like, en fait, du coup, tu vois, you know, quoi, ok, donc, alors, bon, ben, et puis, tu sais
- **Répétitions** de mots
- **Phrases vides** : salutations, politesses sans info (bonjour, merci, au revoir, bonne journée)
- **Reformulations** inutiles

#### ✅ Garder UNIQUEMENT l'essentiel
- **Nom et prénom** du client (PRIORITÉ)
- Profession, domaine d'activité
- Âge, génération
- Budget, pouvoir d'achat
- Préférences produits (couleurs, styles, matières)
- Centres d'intérêt (sport, culture, collections)
- Allergies, régimes alimentaires
- Occasions d'achat (anniversaire, cadeau, etc.)
- Historique relationnel (client depuis X, fidèle, etc.)
- Besoins exprimés, demandes spécifiques

#### 📊 Résultats
- **Réduction de 40-52%** du volume de texte
- Texte ultra-concis, dense, sans bruit
- Seulement les faits utiles pour le profil client

---

### 2. **Extraction automatique du nom/prénom**

#### Nouvelle fonctionnalité
Le système extrait maintenant automatiquement le **nom et prénom** du client depuis la transcription et le lie à l'ID de la transcription.

#### Format de sortie du nettoyage
```
NOM: [Prénom Nom du client]
RGPD_COUNT: [nombre]
TEXT: [texte nettoyé ultra-concis]
```

#### Exemple
**Avant** :
```
Euh bonjour, je m'appelle Sophie Martin, euh je suis architecte, euh j'ai 35 ans. 
Euh voilà, je cherche un sac pour le travail, euh quelque chose de classique, 
euh en cuir noir si possible. Euh mon budget c'est genre 5000 euros. Merci.
```

**Après** :
```
NOM: Sophie Martin
RGPD_COUNT: 0
TEXT: Architecte, 35 ans. Cherche sac travail, classique cuir noir, budget 5000€.
```

#### Stockage
Le nom extrait est stocké dans le champ `client_name` de la table `clients` dans Supabase, lié à l'`external_id` (ID de la transcription).

---

### 3. **Fallback intelligent**

Si l'IA échoue, un système de fallback :
- Masque les données RGPD via regex
- Supprime les mots parasites basiques (euh, hum, genre, etc.)
- Tente d'extraire le nom via patterns regex :
  - "je m'appelle X"
  - "je suis X"
  - "mon nom est X"
  - "client X"
  - Détection de noms propres (Prénom Nom avec majuscules)

---

### 4. **Application au transcript audio en direct**

Les améliorations s'appliquent **automatiquement** :
- ✅ CSV upload (`/api/upload`)
- ✅ Transcript audio en direct (`/api/process-text`)

Le pipeline `run_pipeline()` est utilisé par les deux endpoints, donc toutes les améliorations (nettoyage, extraction de nom, nouvelle taxonomie) sont appliquées uniformément.

---

## Tests

### Test de nettoyage
```bash
python3 test_cleaning.py
```

Résultats :
- **Test 1** : 235 → 114 caractères (52% de réduction) — Nom: Sophie Martin
- **Test 2** : 251 → 151 caractères (40% de réduction) — Nom: Jean Dupont
- **Test 3** : 257 → 152 caractères (41% de réduction) — Nom: Marie Dubois

### Test du serveur complet
1. Démarrer le serveur : `python3 server.py`
2. Uploader un CSV avec des transcriptions contenant des noms
3. Vérifier dans Supabase que le champ `client_name` est rempli avec les noms extraits

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `server.py` | - CLEANING_PROMPT amélioré<br>- `fallback_clean()` avec suppression de fillers<br>- `extract_name_fallback()` pour extraction de nom<br>- `clean_one()` parse le format NOM/RGPD_COUNT/TEXT<br>- `run_pipeline()` stocke le nom extrait dans `clientName`<br>- Sauvegarde Supabase utilise `row.get("clientName")` |
| `test_cleaning.py` | Nouveau fichier de test pour valider le nettoyage et l'extraction de nom |
| `AMELIORATIONS_NETTOYAGE.md` | Ce document récapitulatif |

---

## Prochaines étapes possibles

1. **Enrichissement de l'extraction de nom** : gérer les cas complexes (titres, particules, noms composés)
2. **Déduplication de clients** : fusionner les transcriptions du même client (même nom)
3. **Validation du nom** : vérifier la cohérence (ex: "Sophie Martin" vs "Martin Sophie")
4. **Historique client** : agréger toutes les transcriptions d'un même client pour un profil complet

---

*Dernière mise à jour : 2026-02-17*
