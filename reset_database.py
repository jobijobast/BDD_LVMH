#!/usr/bin/env python3
"""
Script pour réinitialiser la base de données clients
"""
import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

async def reset_database():
    async with httpx.AsyncClient() as client:
        print("🗑️  Suppression de tous les clients...")
        
        # Supprimer tous les clients
        resp = await client.delete(
            f"{SUPABASE_URL}/rest/v1/clients?id=neq.00000000-0000-0000-0000-000000000000",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Prefer": "return=representation",
            }
        )
        
        if resp.status_code in (200, 204):
            print(f"✅ Tous les clients supprimés")
        else:
            print(f"⚠️  Erreur: {resp.status_code} - {resp.text}")
        
        # Vérifier que la table est vide
        print("\n📊 Vérification...")
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/clients?select=count",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            }
        )
        print(f"Clients restants: {resp.text}")
        
        print("\n✅ Base de données réinitialisée!")
        print("Vous pouvez maintenant tester l'import CSV ou l'enregistrement vocal.")

if __name__ == "__main__":
    asyncio.run(reset_database())
