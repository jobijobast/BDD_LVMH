#!/usr/bin/env python3
"""Test Supabase connection"""
import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

async def test_connection():
    async with httpx.AsyncClient() as client:
        # Test boutiques
        print("Testing boutiques...")
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/boutiques?select=*",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            }
        )
        print(f"Status: {resp.status_code}")
        print(f"Boutiques: {resp.text}")
        
        # Test sellers
        print("\nTesting sellers...")
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/sellers?select=*",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            }
        )
        print(f"Status: {resp.status_code}")
        print(f"Sellers: {resp.text}")
        
        # Test clients
        print("\nTesting clients...")
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/clients?select=*&limit=5",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            }
        )
        print(f"Status: {resp.status_code}")
        print(f"Clients: {resp.text}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_connection())
