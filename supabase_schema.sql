/*
  LVMH Voice-to-Tag — Supabase Database Schema
  Run this in Supabase Dashboard > SQL Editor
*/

/* 1. Boutiques */
CREATE TABLE IF NOT EXISTS boutiques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

/* 2. Sellers (vendeurs & managers) */
CREATE TABLE IF NOT EXISTS sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('vendeur', 'manager')),
    boutique_id UUID REFERENCES boutiques(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

/* 3. Clients (one row = one processed transcription) */
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT,
    seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
    boutique_id UUID REFERENCES boutiques(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    language TEXT DEFAULT 'FR',
    original_text TEXT,
    cleaned_text TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    /* Taxonomie structurée (TAXONOMIE_UTILISEE.md): profil, interet, voyage, contexte, service, marque, crm */
    taxonomy JSONB DEFAULT '{}'::jsonb,
    nba JSONB DEFAULT '[]'::jsonb,
    sentiment JSONB DEFAULT '{}'::jsonb,
    sensitive_count INT DEFAULT 0,
    sensitive_found JSONB DEFAULT '[]'::jsonb,
    rgpd_masked INT DEFAULT 0,
    store TEXT DEFAULT '',
    client_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_clients_seller ON clients(seller_id);
CREATE INDEX IF NOT EXISTS idx_clients_boutique ON clients(boutique_id);
CREATE INDEX IF NOT EXISTS idx_clients_taxonomy ON clients USING GIN (taxonomy);
CREATE INDEX IF NOT EXISTS idx_clients_client_name ON clients(client_name);
CREATE INDEX IF NOT EXISTS idx_sellers_boutique ON sellers(boutique_id);

/* Disable RLS (data filtering is done in application code) */
ALTER TABLE boutiques DISABLE ROW LEVEL SECURITY;
ALTER TABLE sellers DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

/* Test data */
INSERT INTO boutiques (name, code) VALUES
    ('LVMH Champs-Elysees', 'LVMH2024')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
    bid UUID;
BEGIN
    SELECT id INTO bid FROM boutiques WHERE code = 'LVMH2024';

    IF NOT EXISTS (SELECT 1 FROM sellers WHERE first_name='Bruno' AND last_name='Lopes' AND boutique_id=bid) THEN
        INSERT INTO sellers (first_name, last_name, role, boutique_id) VALUES ('Bruno', 'Lopes', 'manager', bid);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sellers WHERE first_name='Marie' AND last_name='Martin' AND boutique_id=bid) THEN
        INSERT INTO sellers (first_name, last_name, role, boutique_id) VALUES ('Marie', 'Martin', 'manager', bid);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sellers WHERE first_name='Jean' AND last_name='Dupont' AND boutique_id=bid) THEN
        INSERT INTO sellers (first_name, last_name, role, boutique_id) VALUES ('Jean', 'Dupont', 'vendeur', bid);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM sellers WHERE first_name='Sophie' AND last_name='Laurent' AND boutique_id=bid) THEN
        INSERT INTO sellers (first_name, last_name, role, boutique_id) VALUES ('Sophie', 'Laurent', 'vendeur', bid);
    END IF;
END $$;
