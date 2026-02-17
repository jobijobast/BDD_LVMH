"""
Test du nettoyage amélioré avec extraction de nom
"""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

CLEANING_PROMPT = """Tu es un expert RGPD retail luxe. Nettoie ET sécurise la transcription. Garde UNIQUEMENT les informations utiles pour le profil client.

SUPPRIMER TOTALEMENT:
- Hésitations: euh, hum, uh, um, eh, ah, oh, hmm, bah, ben, pues, ehm, äh, ähm, hein, voilà
- Fillers: genre, like, tipo, basically, en fait, du coup, tu vois, you know, quoi, right, vale, ok, okay, genau, en quelque sorte, plus ou moins, disons, comment dire, enfin bref, bon, ben, donc, alors, et puis, tu sais
- Répétitions de mots
- Phrases vides (salutations, politesses sans info: "bonjour", "merci", "au revoir", "bonne journée")
- Reformulations inutiles

MASQUER (RGPD):
- Carte bancaire → [CARTE-MASQUÉE]
- IBAN → [IBAN-MASQUÉ]
- Code accès/digicode → [CODE-MASQUÉ]
- SSN/passeport → [ID-MASQUÉ]
- Adresse complète → [ADRESSE-MASQUÉE]
- Téléphone → [TEL-MASQUÉ]
- Email → [EMAIL-MASQUÉ]
- Mot de passe → [MDP-MASQUÉ]

GARDER UNIQUEMENT:
- Nom et prénom du client (IMPORTANT: toujours garder)
- Profession, domaine d'activité
- Âge, génération
- Budget, pouvoir d'achat
- Préférences produits (couleurs, styles, matières)
- Centres d'intérêt (sport, culture, collections)
- Allergies, régimes alimentaires
- Occasions d'achat (anniversaire, cadeau, etc.)
- Historique relationnel (client depuis X, fidèle, etc.)
- Besoins exprimés, demandes spécifiques

OBJECTIF: Texte court, dense, sans mots parasites. Seulement les faits utiles pour le profil.

RÉPONSE (3 lignes):
NOM: [Prénom Nom du client si mentionné, sinon "Non mentionné"]
RGPD_COUNT: [nombre]
TEXT: [texte nettoyé ultra-concis]

Texte: """


async def test_cleaning():
    test_texts = [
        "Euh bonjour, je m'appelle Sophie Martin, euh je suis architecte, euh j'ai 35 ans. Euh voilà, je cherche un sac pour le travail, euh quelque chose de classique, euh en cuir noir si possible. Euh mon budget c'est genre 5000 euros. Merci.",
        
        "Bon alors euh, le client c'est Jean Dupont, euh il est banquier, euh il a genre 50 ans je crois. Euh il cherche un cadeau pour sa femme, euh c'est son anniversaire. Euh il aime bien les montres, euh il collectionne les montres vintage. Euh voilà quoi.",
        
        "Bonjour, euh alors moi c'est Marie Dubois, euh je suis médecin, euh j'ai 42 ans. Euh je voudrais un sac voyage, euh quelque chose de pratique mais élégant. Euh je voyage beaucoup en Asie pour mon travail. Euh j'aime le style minimaliste. Euh merci beaucoup.",
    ]
    
    async with httpx.AsyncClient() as client:
        for i, text in enumerate(test_texts, 1):
            print(f"\n{'='*80}")
            print(f"TEST {i}")
            print(f"{'='*80}")
            print(f"\n📝 ORIGINAL ({len(text)} caractères):")
            print(f"{text}\n")
            
            try:
                resp = await client.post(
                    MISTRAL_URL,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {MISTRAL_API_KEY}",
                    },
                    json={
                        "model": "mistral-small-latest",
                        "messages": [{"role": "user", "content": CLEANING_PROMPT + text}],
                        "max_tokens": 700,
                        "temperature": 0,
                    },
                    timeout=30.0,
                )
                resp.raise_for_status()
                result = resp.json()["choices"][0]["message"]["content"].strip()
                
                print(f"✨ NETTOYÉ ({len(result)} caractères):")
                print(result)
                print(f"\n📊 Réduction: {len(text)} → {len(result)} caractères ({100 - int(len(result)/len(text)*100)}% de réduction)")
                
            except Exception as e:
                print(f"❌ Erreur: {e}")


if __name__ == "__main__":
    asyncio.run(test_cleaning())
