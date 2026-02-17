/*
  Migration: ajout du stockage structuré de la taxonomie (TAXONOMIE_UTILISEE.md)
  À exécuter dans Supabase Dashboard > SQL Editor si la table clients existe déjà.
*/

-- Colonne taxonomy (JSONB) : un objet par catégorie avec liste de libellés
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS taxonomy JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN clients.taxonomy IS 'Taxonomie structurée: { profil: [], interet: [], voyage: [], contexte: [], service: [], marque: [], crm: [] }';

-- Index GIN pour requêtes sur taxonomy (ex: WHERE taxonomy->''profil'' ? ''Client_Fidèle'' )
CREATE INDEX IF NOT EXISTS idx_clients_taxonomy ON clients USING GIN (taxonomy);

-- Index sur client_name pour recherche par nom
CREATE INDEX IF NOT EXISTS idx_clients_client_name ON clients(client_name);
