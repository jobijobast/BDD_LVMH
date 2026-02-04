# 🎯 PROMPT OPTIMISÉ POUR MISTRAL - DATA CLEANER NLP

## Prompt à copier-coller dans Mistral :

---

```
Tu es un expert en NLP et data cleaning spécialisé dans le nettoyage de transcriptions vocales multilingues (FR, EN, ES, IT, DE).

## CONTEXTE
J'ai des transcriptions de notes de conseillers de vente LVMH. Ces transcriptions contiennent beaucoup de "bruit" conversationnel : hésitations, fillers, expressions vides de sens, répétitions.

## OBJECTIF
Génère-moi une liste EXHAUSTIVE et OPTIMISÉE de tous les éléments à supprimer pour nettoyer ces transcriptions, organisée par catégorie.

## CE QUE JE VEUX :

### 1. INTERJECTIONS / HÉSITATIONS (mots courts sans sens)
Exemple : euh, hum, ah, oh, uh, um, er, hmm, bah, ben, pues, ehm, äh...
→ Liste complète pour FR, EN, ES, IT, DE

### 2. EXPRESSIONS MULTI-MOTS VIDES (expressions conversationnelles)
Exemple : "en quelque sorte", "you know what I mean", "más o menos", "in un certo senso", "sozusagen"...
→ Liste complète des expressions de 2+ mots qui n'apportent aucune information

### 3. FILLERS CONVERSATIONNELS (mots de remplissage)
Exemple : genre, like, tipo, basically, pratiquement, eigentlich...
→ Mots utilisés pour meubler sans apporter de sens

### 4. EXPRESSIONS DE REFORMULATION
Exemple : "c'est-à-dire", "I mean", "es decir", "cioè", "also"...
→ Quand le locuteur se corrige ou reformule

### 5. EXPRESSIONS D'APPROXIMATION INUTILES
Exemple : "à peu près", "roughly", "aproximadamente", "pressappoco", "ungefähr"...
→ Quand l'approximation n'apporte rien au contexte

### 6. EXPRESSIONS DE CONFIRMATION VIDES
Exemple : "tu vois", "you see", "ya sabes", "capisci", "weißt du"...
→ Recherche d'approbation sans contenu

### 7. PONCTUATIONS ORALES
Exemple : "quoi", "right", "vale", "ok", "genau"...
→ Mots utilisés comme ponctuation orale

### 8. RÉPÉTITIONS / BÉGAIEMENTS
→ Patterns regex pour détecter les répétitions de mots

## FORMAT DE SORTIE ATTENDU :
Pour chaque catégorie, donne-moi :
1. Le nom de la catégorie
2. Une regex pattern si applicable
3. La liste complète des mots/expressions pour chaque langue (FR, EN, ES, IT, DE)

## CONTRAINTES :
- Ne PAS inclure les mots qui peuvent avoir un sens dans le contexte boutique (ex: "bien" dans "très bien", "bon" dans "bon client")
- Trier les expressions multi-mots du plus long au plus court (pour éviter les faux positifs lors du remplacement)
- Utiliser des word boundaries (\b) dans les patterns
- Inclure les variantes avec accents et sans accents

## EXEMPLE DE TRANSCRIPTION À NETTOYER :
"Mme Fontaine, 39 ans, dentiste cabinet enfin privé, première visite eh bien . quoi, en voilà quelque manière, du pour ainsi dire coup. Recherche sac professionnel discret élégant en quelque sorte, tu sais, là . Budget 3500€ ben, tu vois, en euh gros."

## RÉSULTAT ATTENDU APRÈS NETTOYAGE :
"Mme Fontaine, 39 ans, dentiste cabinet privé, première visite. Recherche sac professionnel discret élégant. Budget 3500€."

Génère maintenant la liste la plus complète et précise possible.
```

---

## 💡 CONSEILS D'UTILISATION :

1. **Après avoir reçu la réponse de Mistral**, tu pourras :
   - Copier les listes dans ton code JavaScript
   - Les transformer en arrays ou regex

2. **Pour améliorer encore** :
   - Demande à Mistral des exemples de faux positifs à éviter
   - Demande des regex optimisées pour la performance

3. **Version courte du prompt** (si limite de tokens) :
```
Liste exhaustive des fillers, hésitations et expressions vides en FR/EN/ES/IT/DE pour nettoyer des transcriptions vocales. Format: arrays JavaScript par catégorie. Inclure expressions multi-mots triées du plus long au plus court.
```
