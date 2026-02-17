# Compte admin — Suppression des données

Un **compte admin** permet de vider les tables Supabase (clients, optionnellement vendeurs) sans passer par le dashboard Supabase ni demander à un tiers.

## Configuration

1. Dans le fichier **`.env`**, définir une clé secrète :
   ```env
   ADMIN_SECRET=votre_cle_secrete_admin
   ```
   Choisir une clé longue et difficile à deviner (ex. phrase de passe ou mot de passe généré).

2. Redémarrer le serveur après modification de `.env`.

## Authentification

Chaque requête admin doit envoyer cette clé :

- **En-tête HTTP** (recommandé) :
  - `X-Admin-Key: votre_cle_secrete_admin`
  - ou `Authorization: Bearer votre_cle_secrete_admin`
- **Corps JSON** (POST) :
  - `{ "admin_key": "votre_cle_secrete_admin" }`

Si la clé est absente ou incorrecte, l’API renvoie **403 Clé admin invalide**.

## Endpoints

### 1. Vider la table `clients`

Supprime **toutes** les lignes de la table `clients`.

- **URL** : `POST` ou `DELETE` → `http://localhost:5001/api/admin/clear-clients`
- **Exemple cURL** :
  ```bash
  curl -X POST http://localhost:5001/api/admin/clear-clients \
    -H "X-Admin-Key: votre_cle_secrete_admin"
  ```
- **Réponse succès** :
  ```json
  { "success": true, "message": "42 enregistrement(s) supprimé(s)", "deleted": 42 }
  ```

### 2. Vider clients + vendeurs (optionnel)

Supprime tous les **clients**, et éventuellement tous les **sellers**.

- **URL** : `POST` ou `DELETE` → `http://localhost:5001/api/admin/clear-all`
- **Corps** (optionnel) :
  ```json
  { "admin_key": "votre_cle_secrete_admin", "sellers": true }
  ```
  - `sellers: true` → supprime aussi la table `sellers`.
  - Sans `sellers` ou `sellers: false` → seule la table `clients` est vidée.
- **Exemple cURL** :
  ```bash
  curl -X POST http://localhost:5001/api/admin/clear-all \
    -H "Content-Type: application/json" \
    -d '{"admin_key": "votre_cle_secrete_admin", "sellers": true}'
  ```
- **Réponse succès** :
  ```json
  { "success": true, "deleted": { "clients": 42, "sellers": 4 } }
  ```

## Sécurité

- Ne **jamais** commiter `.env` ni exposer `ADMIN_SECRET` (front public, logs, URL).
- Utiliser l’admin uniquement depuis un outil ou une interface de confiance (script, Postman, page admin interne).
- Les tables **boutiques** ne sont pas supprimées par ces endpoints (structure de référence).

## Résumé

| Action              | Endpoint              | Effet                          |
|---------------------|------------------------|--------------------------------|
| Vider les clients   | `POST /api/admin/clear-clients` | Supprime toute la table `clients` |
| Vider tout (option) | `POST /api/admin/clear-all` avec `sellers: true` | Supprime `clients` + `sellers`   |

**Compte admin** = connaître la valeur de `ADMIN_SECRET` dans `.env` et l’envoyer dans les requêtes comme indiqué ci-dessus.
