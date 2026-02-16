# Configuration Supabase

## Problème actuel
La clé API Supabase dans le projet est **INVALIDE**. Vous devez la remplacer par la vraie clé.

## Comment obtenir la vraie clé Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet `vgkklymckkwrcpjrnzhr`
3. Allez dans **Settings** > **API**
4. Copiez la clé **anon/public** (pas la service_role)

## Où mettre la clé

### 1. Dans le fichier `.env`
```bash
SUPABASE_URL=https://vgkklymckkwrcpjrnzhr.supabase.co
SUPABASE_KEY=VOTRE_VRAIE_CLE_ICI
```

### 2. Dans le fichier `app.js` (ligne 8)
```javascript
const SUPABASE_KEY = 'VOTRE_VRAIE_CLE_ICI';
```

## Vérification de la connexion

Une fois la clé mise à jour, testez la connexion :

```bash
python3 test_supabase.py
```

Vous devriez voir :
- Status: 200
- Des données de boutiques, sellers, et clients

## Redémarrage nécessaire

Après avoir mis à jour la clé :
1. Arrêtez le serveur Flask (CTRL+C)
2. Relancez-le : `python3 server.py`
3. Rechargez la page dans le navigateur (F5)

## Alternative : Recréer le projet Supabase

Si vous n'avez plus accès à la clé :
1. Créez un nouveau projet sur Supabase
2. Exécutez le script SQL dans `supabase_schema.sql`
3. Mettez à jour les clés dans `.env` et `app.js`
