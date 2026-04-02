"""
LVMH Voice-to-Tag — Python Backend (Flask)
AI pipeline + Supabase integration:
  - Nettoyage IA (Mistral) + RGPD
  - Extraction de tags
  - NBA (Next Best Action) via Mistral
  - Privacy Score par CA
  - Analyse de sentiment
  - Sauvegarde dans Supabase

Lancement :
  pip install -r requirements.txt
  python server.py
"""

import os, re, json, csv, io, math, random, asyncio, time
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import httpx

# Charger .env depuis le dossier du script (évite 503 Admin non configuré si lancé depuis un autre répertoire)
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_env_path)

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# ───────────────────────────────────────────
# CONFIG
# ───────────────────────────────────────────
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
BATCH_SIZE = 5
BATCH_DELAY = 0.08

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_REST = f"{SUPABASE_URL}/rest/v1" if SUPABASE_URL else ""

# Compte admin : clé secrète pour supprimer les données (à définir dans .env)
ADMIN_SECRET = (os.getenv("ADMIN_SECRET") or "").strip().strip('"\'')

# ───────────────────────────────────────────
# PROMPTS
# ───────────────────────────────────────────
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

NBA_PROMPT = """Tu es un expert clienteling luxe LVMH. Analyse le profil client et génère 3 actions concrètes pour le Client Advisor.

Profil client:
TAGS: {tags}
TEXTE NETTOYÉ: {text}

Génère exactement 3 actions au format JSON array. Chaque action:
- "action": description concrète (1-2 phrases max)
- "type": "immediate"|"short_term"|"long_term"
- "category": "product"|"experience"|"relationship"|"event"

RÉPONSE JSON UNIQUEMENT:
[{{"action":"...","type":"...","category":"..."}},{{"action":"...","type":"...","category":"..."}},{{"action":"...","type":"...","category":"..."}}]"""

SENTIMENT_PROMPT = """Tu es un expert CRM pour les maisons de luxe LVMH. Ton rôle est d'analyser le ressenti d'un client à partir d'une note rédigée par un Client Advisor.

CONTEXTE LUXE IMPORTANT :
- Un client exigeant ou précis dans ses attentes n'est PAS négatif
- L'absence de compliments n'est PAS un signal négatif dans le luxe
- Un client silencieux ou neutre = score 45-55
- Les achats répétés, la fidélité, les cadeaux = signaux très positifs
- Une plainte, un retard, un défaut = signaux négatifs

ANCRES DE SCORE :
- 85-100 : Enthousiaste, exprime clairement sa satisfaction, recommande, émotionnellement engagé
- 65-84 : Satisfait, visite positive, pas de friction notable
- 45-64 : Neutre, transactionnel, pas d'émotion particulière dans les deux sens
- 25-44 : Insatisfait, friction légère, attente déçue sans rupture
- 0-24 : Très négatif, plainte explicite, rupture de confiance, retour produit

NOTE DU CLIENT ADVISOR :
{text}

TAGS DÉTECTÉS : {tags}

ANALYSE PAS À PAS (dans ta tête, ne l'écris pas) :
1. Quels mots expriment le ressenti du CLIENT (pas du CA) ?
2. Y a-t-il des signaux d'achat, fidélité, ou satisfaction implicite ?
3. Y a-t-il une friction, plainte, ou attente déçue ?
4. Quel score correspond aux ancres ci-dessus ?

RÉPONSE JSON UNIQUEMENT (aucun texte avant ou après) :
{{"level":"positive|neutral|negative","score":0-100,"justification":"1 phrase qui cite un élément concret du texte","posFound":["signal1","signal2"],"negFound":["signal1"]}}"""

# ───────────────────────────────────────────
# SENTIMENT KEYWORDS
# ───────────────────────────────────────────
SENTIMENT_POSITIVE = [
    'ravi','enchanté','magnifique','parfait','excellent','adore',
    'love','amazing','wonderful','happy','impressed','satisfait',
    'superbe','merveilleux','content','fidèle','recommande','plaisir'
]
SENTIMENT_NEGATIVE = [
    'déçu','disappointed','frustré','délai trop long','delay','retard livraison',
    'problème','problem','défaut','cassé','broken','mauvais',
    'poor','trop cher','expensive','lent','slow','erreur','error',
    'plainte','complaint','insatisfait','médiocre','décevant',
    'jamais reçu','perdu','endommagé','damaged','mécontent','pas satisfait'
]

# ───────────────────────────────────────────
# RGPD FALLBACK (regex)
# ───────────────────────────────────────────
RGPD_FALLBACK = {
    'Carte':  [r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'],
    'IBAN':   [r'\b[A-Z]{2}\d{2}[\s]?[A-Z0-9]{4}[\s]?[A-Z0-9]{4}[\s]?[A-Z0-9]{4}[\s]?[A-Z0-9]{0,4}'],
    'SSN':    [r'\b\d{3}[-]?\d{2}[-]?\d{4}\b'],
    'Tel':    [r'\b(\+\d{1,3}[\s]?)?\d{2,4}[\s]?\d{2,4}[\s]?\d{2,4}[\s]?\d{0,4}\b'],
    'Email':  [r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'],
    'Code':   [r'\bcode\s*(porte|accès|digicode)?\s*:?\s*\d{4,6}\b'],
}

# ───────────────────────────────────────────
# RGPD SENSITIVE KEYWORDS
# ───────────────────────────────────────────
RGPD_SENSITIVE = [
    {'cat':'accessCodes','words':['code porte','digicode','mot de passe','password','pin code']},
    {'cat':'identity','words':['numéro sécurité sociale','iban','passport number','credit card']},
    {'cat':'orientation','words':['homosexuel','gay','lesbienne','bisexuel','transgenre']},
    {'cat':'politics','words':['vote pour','électeur de','militant','parti politique']},
    {'cat':'religion','words':['pratiquant','converti','croyant fervent','fait le ramadan']},
    {'cat':'familyConflict','words':['violence conjugale','violence domestique','maltraitance']},
    {'cat':'finance','words':['dette','faillite','surendettement','bankruptcy']},
    {'cat':'appearance','words':['obèse','trop gros','laid','moche']},
]

# ───────────────────────────────────────────
# TAG RULES — Taxonomie LVMH (Profils, Intérêts, Contexte, Service, Marque, CRM)
# ───────────────────────────────────────────
TAG_RULES = [
    # 1. PROFILS — Genre
    (r'\bfemme\b|\bwoman\b|\belle\s+(est|a|veut)\b','profil','Femme'),
    (r'\bhomme\b|\bman\b|\bmonsieur\b|\bclient\s+homme\b','profil','Homme'),
    (r'\bnon.binaire|nonbinary|non.binary','profil','Non-Binaire'),
    (r'\bcouple\b|\bcollectif\b|\bmariés\b|\bensemble\s+(pour|en)','profil','Collectif/Couple'),
    # PROFILS — Segmentation générationnelle
    (r'\b(18|19|20|21|22|23|24)\s*ans\b|under\s*25|u\.?25|jeune\s+client','profil','U-25'),
    (r'\b(25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40)\s*ans\b|trentaine|thirty|quarante','profil','25-40'),
    (r'\b(40|41|50|60)\s*ans\b|cinquantaine|soixantaine|fifty|sixty|quadra|quinqua','profil','40-60'),
    (r'\b(60|65|70|75|78|79)\s*ans\b|soixante|septuagénaire|retraité','profil','60-80'),
    (r'\b80\s*ans|\boctogénaire|très\s+âgé','profil','80+'),
    # PROFILS — Statut relationnel
    (r'\bprospect\b','profil','Prospect'),
    (r'\bnouveau\s+client|new\s+client|première\s+visite|premier\s+achat','profil','Nouveau_Client'),
    (r'\bclient\s+actif|active\s+client|achète\s+régulièrement','profil','Client_Actif'),
    (r'\bclient\s+fidèle|fidèle|regular\s+client|depuis\s+(20|plusieurs)','profil','Client_Fidèle'),
    (r'\bambassadeur|ambassador|recommand(e|ant)','profil','Ambassadeur'),
    (r'\bkey\s+account|compte\s+clé|vip\s+client|gros\s+client','profil','Key_Account'),
    (r'\bà\s+réactiver|réactivation|inactif\s+depuis','profil','A_Réactiver'),
    # PROFILS — Communication
    (r'\bfrançais\b|parle\s+français|langue\s+française','profil','Français'),
    (r'\banglais\b|english|parle\s+anglais','profil','Anglais'),
    (r'\bitalien\b|italian|parle\s+italien','profil','Italien'),
    (r'\bespagnol\b|spanish|parle\s+espagnol','profil','Espagnol'),
    (r'\ballemand\b|german|parle\s+allemand','profil','Allemand'),
    (r'\bmandarin\b|chinese|parle\s+chinois','profil','Mandarin'),
    (r'\bjaponais\b|japanese|parle\s+japonais','profil','Japonais'),
    (r'\barabe\b|arabic|parle\s+arabe','profil','Arabe'),
    (r'\brusse\b|russian|parle\s+russe','profil','Russe'),
    # PROFILS — Visibilité publique
    (r'\baudience\s+niche|niche\s+audience','profil','Audience_Niche'),
    (r'\baudience\s+large|large\s+audience','profil','Audience_Large'),
    (r'\baudience\s+masse|mass\s+audience','profil','Audience_Masse'),
    (r'\bpersonnalité\s+publique|public\s+figure|personne\s+publique','profil','Personnalité_Publique'),
    (r'\bexpert\s+sectoriel|sector\s+expert|référent\s+secteur','profil','Expert_Sectoriel'),
    # PROFILS — Écosystème digital
    (r'\bsocial\s+native|réseaux\s+sociaux|instagram|influenceur\s+digital','profil','Social_Native'),
    (r'\bpro\s+network|linkedin|réseau\s+pro|business\s+network','profil','Pro_Network'),
    (r'\bweb3\b|blockchain|crypto|nft\b','profil','Web3_Interests'),
    # PROFILS — Domaine d'expertise (Sciences & Santé, Finance, Droit, Arts, Corporate)
    (r'\bchirurgien|surgeon|expertise\s+chirurg','profil','Expertise_Chirurgie'),
    (r'\bmédecin|doctor\b|expertise\s+médicale|médical\b','profil','Expertise_Médicale'),
    (r'\brecherche\s+pharma|pharma\s+research|laboratoire\s+pharma','profil','Recherche_Pharma'),
    (r'\bmarchés\s+financiers|finance\s+de\s+marché|trading\b','profil','Marchés_Financiers'),
    (r'\bprivate\s+equity|venture\s+capital|vc\b|pe\b','profil','Private_Equity_VC'),
    (r'\bbanque\s+conseil|conseil\s+banque|investment\s+banking','profil','Banque_Conseil'),
    (r'\bfintech|blockchain\s+finance','profil','Fintech_Blockchain'),
    (r'\bconseil\s+juridique|avocat|lawyer|legal\s+advice','profil','Conseil_Juridique'),
    (r'\bofficier\s+public|notaire|huissier','profil','Officier_Public'),
    (r'\bexpertise\s+légale|legal\s+expert','profil','Expertise_Légale'),
    (r'\bmarché\s+de\s+l.?art|art\s+market|galeriste','profil','Marché_de_l_Art'),
    (r'\barchitecture|architecte|design\s+intérieur','profil','Architecture_Design'),
    (r'\bproduction\s+artistique|artiste|réalisateur','profil','Production_Artistique'),
    (r'\bexecutive\s+leadership|ceo|pdg|directeur\s+général','profil','Executive_Leadership'),
    (r'\bentrepreneur|startup|fondateur|founder','profil','Entrepreneur'),
    (r'\breal\s+estate|immobilier|promoteur\s+immobilier','profil','Real_Estate_Dev'),
    # 2. CENTRES D'INTÉRÊT — Réseaux & clubs, Collections, Loisirs, Culture, Engagements
    (r'\bsports?\s+club\s+prestige|club\s+privé\s+sport','interet','Sports_Clubs_Prestige'),
    (r'\bsocial\s+arts?\s+club|club\s+art|arts?\s+club','interet','Social_Arts_Clubs'),
    (r'\bbusiness\s+network|réseau\s+affaires|club\s+business','interet','Business_Networks'),
    (r'\balumni|grande\s+école|hec|essec|polytechnique|ena','interet','Alumni_Grandes_Ecoles'),
    (r'\bhorlogerie\s+vintage|vintage\s+watch|montre\s+vintage','interet','Horlogerie_Vintage'),
    (r'\bhaute\s+horlogerie|fine\s+watchmaking|complications','interet','Haute_Horlogerie'),
    (r'\blivres\s+rares|rare\s+books|édition\s+limitée','interet','Livres_Rares'),
    (r'\bart\s+contemporain|contemporary\s+art','interet','Art_Contemporain'),
    (r'\bart\s+classique|classical\s+art|peinture\s+classique','interet','Art_Classique'),
    (r'\bvins?\s+spiritueux|prestige\s+wine|spirits?|oenolog','interet','Vins_Spiritueux_Prestige'),
    (r'\bsports?\s+raquette|tennis|squash|padel','interet','Sports_Raquette'),
    (r'\bgolf\b|golfeur','interet','Golf'),
    (r'\bnautisme|yachting|voilier|bateau\s+de\s+luxe','interet','Nautisme_Yachting'),
    (r'\bsports?\s+endurance|marathon|triathlon|running','interet','Sports_Endurance'),
    (r'\bwellness|yoga|pilates|méditation','interet','Wellness_Yoga'),
    (r'\bautomobile\s+collection|collection\s+voitures?|voiture\s+de\s+collection','interet','Automobile_Collection'),
    (r'\bmotorsport|formula|circuit|course\s+auto','interet','Motorsport_Experience'),
    (r'\bdesign\s+minimaliste|minimalist\s+design','interet','Design_Minimaliste'),
    (r'\bopéra|musique\s+symphonique|orchestre|classique\s+music','interet','Opéra_Musique_Symphonique'),
    (r'\bjazz|contemporary\s+music','interet','Jazz_Contemporary'),
    (r'\bgastronomie|fine\s+dining|étoilé\s+michelin','interet','Gastronomie_Fine_Dining'),
    (r'\boenolog|sommelier|vins?|cave\s+à\s+vin','interet','Oenologie'),
    (r'\bsustainability|durable|écolog|recyclé|green','interet','Sustainability_Focus'),
    (r'\bhandicraft|artisanat|savoir.faire|heritage','interet','Handicraft_Heritage'),
    (r'\bphilanthrop|inclusion|mécénat|charity','interet','Philanthropy_Inclusion'),
    # 3. VOYAGE
    (r'\bloisir\s+premium|voyage\s+luxe|premium\s+travel','voyage','Loisir_Premium'),
    (r'\bexpédition|nature|aventure|safari','voyage','Expédition_Nature'),
    (r'\bretraite\s+bien.être|wellness\s+retreat|spa\s+resort','voyage','Retraite_Bien_être'),
    (r'\bitinérance\s+culturelle|cultural\s+travel|voyage\s+culture','voyage','Itinérance_Culturelle'),
    (r'\bbusiness\s+travel|voyage\s+pro|déplacement\s+pro','voyage','Business_Travel'),
    (r'\bapac|asie\s+pacifique|japon|chine|singapore','voyage','APAC'),
    (r'\bamericas|amérique|usa|new\s+york|miami','voyage','Americas'),
    (r'\beurope\b|paris|milan|londres','voyage','Europe'),
    (r'\bmea|moyen.orient|dubai|émirats','voyage','MEA'),
    # 4. CONTEXTE D'ACHAT — Bénéficiaire, Célébration, Style
    (r'\busage\s+personnel|pour\s+moi|pour\s+lui|pour\s+elle','contexte','Usage_Personnel'),
    (r'\bcadeau\s+proche|proche|conjoint|conjointe|ami\b','contexte','Cadeau_Proche'),
    (r'\bcadeau\s+famille|enfant|parent|petit.enfant|grandchild','contexte','Cadeau_Famille'),
    (r'\bcadeau\s+professionnel|client\s+pro|partenaire\s+business','contexte','Cadeau_Professionnel'),
    (r'\bcadeau\s+protocolaire|protocol|officiel','contexte','Cadeau_Protocolaire'),
    (r'\banniversaire|birthday','contexte','Anniversaire'),
    (r'\bunion|mariage|wedding|noces','contexte','Union'),
    (r'\bnaissance|bébé|baby|naissance','contexte','Naissance'),
    (r'\bévénement\s+de\s+vie|changement\s+de\s+vie|nouveau\s+départ','contexte','Événement_Vie'),
    (r'\bpromotion|nouveau\s+poste|nouvelle\s+fonction','contexte','Promotion'),
    (r'\bréussite\s+business|deal|transaction\s+réussie','contexte','Réussite_Business'),
    (r'\bretraite\s+professionnelle|retirement','contexte','Retraite'),
    (r'\bfêtes?\s+fin\s+année|noël|nouvel\s+an\s+occidental','contexte','Fêtes_Fin_Année'),
    (r'\bnouvel\s+an\s+lunaire|chinese\s+new\s+year','contexte','Nouvel_An_Lunaire'),
    (r'\bfête\s+maternelle|fête\s+paternelle|mother.?day|father.?day','contexte','Fête_Maternelle_Paternelle'),
    (r'\bintemporel|timeless|classique\s+intemporel','contexte','Intemporel'),
    (r'\bcontemporain|modern\b','contexte','Contemporain'),
    (r'\btendance|trendy|tendance','contexte','Tendance'),
    (r'\bsignature\s+logo|logo\s+visible|monogramme','contexte','Signature_Logo'),
    (r'\bquiet\s+luxury|luxe\s+discret|understated\s+luxury','contexte','Quiet_Luxury'),
    # 5. SERVICE & HOSPITALITY — Restrictions, Diététique, Boissons, Confort, Confidentialité
    (r'\ballerg(e|ie)\s+majeur|allergène\s+majeur|alerte\s+allerg','service','Alerte_Allergène_Majeur'),
    (r'\bsans\s+gluten|régime\s+sans\s+gluten|gluten.free|celiac','service','Régime_Sans_Gluten'),
    (r'\bsans\s+lactose|lactose|intolérance\s+lactose','service','Régime_Sans_Lactose'),
    (r'\bvégétarien|vegetarian','service','Végétarien'),
    (r'\bvégétalien|vegan|végane','service','Végétalien'),
    (r'\bsans\s+alcool|no\s+alcohol|abstinent','service','Sans_Alcool'),
    (r'\bhalal|produits?\s+halal','service','Sélection_Produits_Halal'),
    (r'\bpremium\s+tea|matcha|thé\s+premium','service','Premium_Tea_Matcha'),
    (r'\bchampagne|spirits?|spiritueux','service','Champagne_Spirits'),
    (r'\bsoft\s+only|sans\s+alcool|boisson\s+sans','service','Soft_Only'),
    (r'\beau\s+tempérée|eau\s+tiède','service','Eau_Tempérée'),
    (r'\bmobilité\s+réduite|accès\s+mobilité|fauteuil|handicap','service','Accès_Mobilité_Réduite'),
    (r'\bassise\s+prioritaire|siège\s+prioritaire|besoin\s+assise','service','Besoin_Assise_Prioritaire'),
    (r'\bprotocole\s+discrétion|entrée\s+dédiée|discretion','service','Protocole_Discrétion_Haute'),
    (r'\bno\s+photo|pas\s+de\s+photo|interdit\s+photo','service','No_Photo_Policy'),
    # 6. UNIVERS DE MARQUE — Préférences produits, Niveau d'engagement
    (r'\blignes?\s+iconiques|iconic\s+line','marque','Lignes_Iconiques'),
    (r'\blignes?\s+animation|animation\s+line','marque','Lignes_Animation'),
    (r'\bcuirs?\s+exotiques|exotic\s+leather|crocodile|python','marque','Cuirs_Exotiques'),
    (r'\bhaute\s+horlogerie|fine\s+watchmaking','marque','Haute_Horlogerie'),
    (r'\bart\s+de\s+vivre|malles?|trunk','marque','Art_de_Vivre_Malles'),
    (r'\bclient\s+historique|depuis\s+longtemps|ancien\s+client','marque','Client_Historique'),
    (r'\bcommande\s+spéciale|special\s+order|sur\s+mesure','marque','Client_Commandes_Spéciales'),
    (r'\binvité\s+événement|événement\s+maison|house\s+event','marque','Invité_Événements_Maison'),
    # 7. OPPORTUNITÉS & SUIVI (CRM)
    (r'\ben\s+attente\s+stock|waiting\s+stock|attente\s+dispo','crm','En_Attente_Stock'),
    (r'\bwaitlist|liste\s+d.?attente','crm','Waitlist_Active'),
    (r'\btaille\s+non\s+disponible|size\s+unavailable','crm','Taille_Non_Disponible'),
    (r'\bsensibilité\s+délais|délais\s+important|urgent','crm','Sensibilité_Délais'),
    (r'\balerte\s+nouveautés|nouveautés|new\s+arrivals|wishlist','crm','Souhaite_Alerte_Nouveautés'),
    (r'\bcontact\s+stock|prévenir\s+stock|dispo\s+à','crm','Contact_Stock'),
    (r'\bavant.première|preview|private\s+preview','crm','Invitation_Avant_Première'),
    (r'\battention\s+personnalisée|personalized\s+attention','crm','Attention_Personnalisée'),
    (r'\bfollow.up|followup|rappel|rappeler|suivi','crm','Follow_up_Digital'),
]


# ───────────────────────────────────────────
# MISTRAL API
# ───────────────────────────────────────────
async def call_mistral(client: httpx.AsyncClient, prompt: str, max_tokens: int = 600) -> str:
    resp = await client.post(MISTRAL_URL, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
    }, json={
        "model": "mistral-small-latest",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens, "temperature": 0,
    }, timeout=30.0)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


def fallback_clean(text: str) -> dict:
    clean = text
    count = 0
    # Masquer données sensibles
    for cat, patterns in RGPD_FALLBACK.items():
        for pat in patterns:
            matches = re.findall(pat, clean, re.IGNORECASE)
            if matches:
                count += len(matches)
                clean = re.sub(pat, f'[{cat.upper()}-MASQUÉ]', clean, flags=re.IGNORECASE)
    # Supprimer mots parasites basiques
    fillers = r'\b(euh|hum|uh|um|eh|ah|oh|hmm|bah|ben|genre|like|en fait|du coup|tu vois|you know|quoi|okay|ok|voilà|hein|donc|alors|bon|ben)\b'
    clean = re.sub(fillers, '', clean, flags=re.IGNORECASE)
    # Nettoyer espaces multiples
    clean = re.sub(r'\s+', ' ', clean).strip()
    # Extraire nom (simple heuristique: chercher "je m'appelle X" ou "client X")
    nom = extract_name_fallback(text)
    return {"text": clean, "rgpdCount": count, "nom": nom}


def extract_name_fallback(text: str) -> str:
    """Extraction simple du nom via regex (fallback si IA échoue)"""
    patterns = [
        r"(?:je m'appelle|je suis|mon nom est|client)\s+([A-Z][a-zàâäéèêëïîôùûüÿç]+(?:\s+[A-Z][a-zàâäéèêëïîôùûüÿç]+)?)",
        r"\b([A-Z][a-zàâäéèêëïîôùûüÿç]+\s+[A-Z][a-zàâäéèêëïîôùûüÿç]+)\b"
    ]
    for pat in patterns:
        match = re.search(pat, text)
        if match:
            return match.group(1).strip()
    return "Non mentionné"


async def clean_one(client: httpx.AsyncClient, text: str) -> dict:
    try:
        result = await call_mistral(client, CLEANING_PROMPT + text, 700)
        nom_match = re.search(r'NOM:\s*(.+)', result, re.IGNORECASE)
        rgpd_match = re.search(r'RGPD_COUNT:\s*(\d+)', result, re.IGNORECASE)
        text_match = re.search(r'TEXT:\s*([\s\S]*)', result, re.IGNORECASE)
        if rgpd_match and text_match:
            nom = nom_match.group(1).strip() if nom_match else "Non mentionné"
            return {
                "text": text_match.group(1).strip(), 
                "rgpdCount": int(rgpd_match.group(1)),
                "nom": nom
            }
        return fallback_clean(result)
    except Exception:
        return fallback_clean(text)


def detect_sensitive(orig: str) -> tuple:
    sensitive_count = 0
    sensitive_found = []
    lower = orig.lower()
    for p in RGPD_SENSITIVE:
        for w in p["words"]:
            if w.lower() in lower:
                sensitive_count += 1
                sensitive_found.append({"cat": p["cat"], "word": w})
    return sensitive_count, sensitive_found


def extract_tags(text: str) -> list:
    tags = []
    seen = set()
    lower = text.lower()
    for pattern, cat, label in TAG_RULES:
        if re.search(pattern, lower, re.IGNORECASE):
            key = f"{cat}-{label}"
            if key not in seen:
                tags.append({"c": cat, "t": label})
                seen.add(key)
    return tags


def generate_fallback_nba(tags: list) -> list:
    actions = []
    tag_cats = [t["c"] for t in tags]
    if "contexte" in tag_cats:
        ctx = [t["t"] for t in tags if t["c"] == "contexte"]
        actions.append({"action": f"Préparer sélection pour: {', '.join(ctx[:2])}", "type": "immediate", "category": "product"})
    if "interet" in tag_cats:
        interets = [t["t"] for t in tags if t["c"] == "interet"]
        actions.append({"action": f"Envoyer contenu aligné centres d'intérêt: {', '.join(interets[:2])}", "type": "short_term", "category": "product"})
    if "profil" in tag_cats:
        actions.append({"action": "Inviter à un événement exclusif selon profil", "type": "long_term", "category": "experience"})
    if "crm" in tag_cats:
        actions.append({"action": "Exécuter action CRM prioritaire (stock / preview / follow-up)", "type": "immediate", "category": "relationship"})
    if not actions:
        actions.append({"action": "Planifier un appel de suivi", "type": "immediate", "category": "relationship"})
    return actions[:3]


async def generate_nba(client: httpx.AsyncClient, tags: list, clean_text: str) -> list:
    if not tags:
        return [{"action": "Approfondir le profil", "type": "immediate", "category": "relationship"}]
    try:
        tags_str = ", ".join(t["t"] for t in tags)
        prompt = NBA_PROMPT.replace("{tags}", tags_str).replace("{text}", clean_text[:300])
        result = await call_mistral(client, prompt, 400)
        json_match = re.search(r'\[[\s\S]*\]', result)
        if json_match:
            return json.loads(json_match.group(0))
        return [{"action": f"Personnaliser contact: {tags_str}", "type": "immediate", "category": "relationship"}]
    except Exception:
        return generate_fallback_nba(tags)


# Catégories de la taxonomie (TAXONOMIE_UTILISEE.md) pour stockage structuré
TAXONOMY_CATEGORIES = ("profil", "interet", "voyage", "contexte", "service", "marque", "crm")


def build_taxonomy_from_tags(tags: list) -> dict:
    """Construit un objet taxonomy par catégorie à partir des tags extraits.
    Format: { "profil": ["Femme", "25-40"], "interet": ["Golf"], ... }
    Permet requêtes et rapports par bloc de taxonomie."""
    out = {cat: [] for cat in TAXONOMY_CATEGORIES}
    for t in tags or []:
        c, label = t.get("c"), t.get("t")
        if c in out and label and label not in out[c]:
            out[c].append(label)
    return out


def analyze_sentiment_fallback(clean_text: str, row_id: str = "", ca: str = "") -> dict:
    text = clean_text.lower()
    pos_found = [kw for kw in SENTIMENT_POSITIVE if kw in text]
    neg_found = [kw for kw in SENTIMENT_NEGATIVE if kw in text]
    pos_score = len(pos_found)
    neg_score = len(neg_found) * 1.5

    # Aucun signal détecté → neutre par défaut (ne pas pénaliser les notes sans keywords)
    if pos_score == 0 and neg_score == 0:
        return {"id": row_id, "ca": ca, "score": 55, "level": "neutral",
                "posFound": [], "negFound": [], "excerpt": clean_text[:150]}

    total = pos_score + neg_score
    score = round((pos_score / total) * 100)
    level = "positive" if score >= 65 else ("neutral" if score >= 35 else "negative")
    return {"id": row_id, "ca": ca, "score": score, "level": level, "posFound": pos_found, "negFound": neg_found, "excerpt": clean_text[:150]}


async def analyze_sentiment_ai(client_http: httpx.AsyncClient, clean_text: str, tags_str: str, row_id: str = "", ca: str = "") -> dict:
    """Analyse le sentiment via Mistral AI avec fallback sur l'analyse par mots-clés."""
    try:
        prompt = SENTIMENT_PROMPT.replace("{text}", clean_text[:700]).replace("{tags}", tags_str[:300])
        result = await call_mistral(client_http, prompt, 400)
        json_match = re.search(r'\{[^{}]*\}', result, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            # Normalisation : forcer la cohérence level/score
            score = max(0, min(100, int(parsed.get("score", 50))))
            level = parsed.get("level", "neutral")
            # Si le score ne correspond pas au level déclaré, corriger le level
            if score >= 65 and level != "positive":
                level = "positive"
            elif score <= 35 and level != "negative":
                level = "negative"
            elif 36 <= score <= 64 and level not in ("neutral",):
                level = "neutral"
            return {
                "id": row_id,
                "ca": ca,
                "score": score,
                "level": level,
                "justification": parsed.get("justification", ""),
                "posFound": parsed.get("posFound", []),
                "negFound": parsed.get("negFound", []),
                "excerpt": clean_text[:150],
            }
    except Exception:
        pass
    fallback = analyze_sentiment_fallback(clean_text, row_id, ca)
    fallback["justification"] = "Analyse locale (fallback)"
    return fallback


COACHING_RULES = {
    "orientation": "Formation RGPD: données orientation sexuelle interdites",
    "politics": "Formation RGPD: opinions politiques non-collectables",
    "religion": "Formation RGPD: croyances religieuses à ne pas enregistrer",
    "familyConflict": "Sensibilisation: conflits familiaux = données ultra-sensibles",
    "appearance": "Rappel: jugements physiques = non conforme",
    "finance": "Formation: données financières personnelles interdites",
    "accessCodes": "Alerte sécurité: ne jamais enregistrer de codes d'accès",
}

def compute_privacy_scores(data: list) -> tuple:
    ca_map = {}
    for row in data:
        ca = row["ca"]
        if ca not in ca_map:
            ca_map[ca] = {"ca": ca, "total": 0, "violations": 0, "categories": {}, "notes": []}
        entry = ca_map[ca]
        entry["total"] += 1
        if row["sensitiveCount"] > 0:
            entry["violations"] += row["sensitiveCount"]
            for s in row["sensitiveFound"]:
                entry["categories"][s["cat"]] = entry["categories"].get(s["cat"], 0) + 1
            entry["notes"].append(row["id"])
    scores = []
    for entry in ca_map.values():
        score = max(0, round(100 - (entry["violations"] / (entry["total"] or 1)) * 50 - entry["violations"] * 5))
        level = "critical" if score < 60 else "warning" if score < 75 else "good" if score < 90 else "excellent"
        coaching = [msg for cat, msg in COACHING_RULES.items() if entry["categories"].get(cat)]
        scores.append({**entry, "score": score, "level": level, "coaching": coaching})
    scores.sort(key=lambda p: p["score"])
    avg = round(sum(p["score"] for p in scores) / len(scores)) if scores else 0
    return scores, avg


# ───────────────────────────────────────────
# CSV PARSER
# ───────────────────────────────────────────
# Mapping des en-têtes courants (FR/EN) vers les clés attendues par le pipeline
CSV_HEADER_ALIASES = {
    "transcription": "Transcription",
    "texte": "Transcription",
    "text": "Transcription",
    "commentaire": "Transcription",
    "notes": "Transcription",
    "id": "ID",
    "id client": "ID",
    "client id": "ID",
    "date": "Date",
    "langue": "Language",
    "language": "Language",
    "lang": "Language",
    "ca": "CA",
    "conseiller": "CA",
    "advisor": "CA",
    "conseiller client": "CA",
    "store": "Store",
    "boutique": "Store",
    "magasin": "Store",
}


def _normalize_header(h: str) -> str:
    h = h.strip().strip('"').strip()
    key = h.lower()
    return CSV_HEADER_ALIASES.get(key, h)


def parse_csv(text: str) -> list:
    # Retirer BOM UTF-8 si présent
    if text.startswith("\ufeff"):
        text = text[1:]
    lines = [ln.rstrip("\r") for ln in text.strip().split("\n") if ln.strip()]
    if not lines:
        return []
    raw_headers = [h.strip().strip('"') for h in lines[0].split(",")]
    headers = [_normalize_header(h) for h in raw_headers]
    # S'assurer qu'il y a au moins une colonne de transcription
    if "Transcription" not in headers:
        for i, h in enumerate(raw_headers):
            if h and _normalize_header(h) == "Transcription":
                break
        else:
            # Chercher une colonne contenant "transcription" ou "texte"
            for i, h in enumerate(raw_headers):
                low = h.lower()
                if "transcription" in low or "texte" in low or "text" in low or "commentaire" in low or "notes" in low:
                    headers[i] = "Transcription"
                    break
    rows = []
    for line in lines[1:]:
        if not line.strip():
            continue
        vals, curr, in_q = [], "", False
        for ch in line:
            if ch == '"':
                in_q = not in_q
            elif ch == "," and not in_q:
                vals.append(curr.strip())
                curr = ""
            else:
                curr += ch
        vals.append(curr.strip())
        if len(vals) < len(headers):
            vals.extend([""] * (len(headers) - len(vals)))
        row = {headers[j]: (vals[j] if j < len(vals) else "") for j in range(len(headers))}
        # Au moins une transcription non vide
        trans = (row.get("Transcription") or "").strip()
        if trans:
            if "ID" not in row or not str(row.get("ID", "")).strip():
                row["ID"] = f"CSV-{len(rows) + 1}"
            if "Date" not in row or not str(row.get("Date", "")).strip():
                row["Date"] = time.strftime("%Y-%m-%d")
            rows.append(row)
    return rows


# ───────────────────────────────────────────
# SUPABASE SAVE
# ───────────────────────────────────────────
async def save_to_supabase(data: list, seller_id: str = None, boutique_id: str = None, client_name: str = ""):
    """Enregistre en base tous les champs utiles : tags, taxonomy, nba, sentiment, texte nettoyé, nom client, etc."""
    if not SUPABASE_REST or not SUPABASE_KEY:
        print("⚠️  Supabase not configured, skipping save")
        return

    records = []
    for row in data:
        tags = row.get("tags") if isinstance(row.get("tags"), list) else []
        nba = row.get("nba") if isinstance(row.get("nba"), list) else []
        sentiment = row.get("sentiment") if isinstance(row.get("sentiment"), dict) else {}
        sensitive_found = row.get("sensitiveFound") if isinstance(row.get("sensitiveFound"), list) else []
        taxonomy = build_taxonomy_from_tags(tags)
        record = {
            "external_id": row.get("id", ""),
            "date": row.get("date") or time.strftime("%Y-%m-%d"),
            "language": row.get("lang", "FR"),
            "original_text": row.get("orig", ""),
            "cleaned_text": row.get("clean", ""),
            "tags": json.dumps(tags),
            "taxonomy": json.dumps(taxonomy),
            "nba": json.dumps(nba),
            "sentiment": json.dumps(sentiment),
            "sensitive_count": row.get("sensitiveCount", 0),
            "sensitive_found": json.dumps(sensitive_found),
            "rgpd_masked": row.get("rgpdMasked", 0),
            "store": row.get("store", ""),
            "client_name": row.get("clientName", "Non mentionné"),
        }
        if seller_id:
            record["seller_id"] = seller_id
        if boutique_id:
            record["boutique_id"] = boutique_id
        records.append(record)

    if not records:
        return

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{SUPABASE_REST}/clients",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
                json=records,
                timeout=30.0,
            )
            if resp.status_code in (200, 201):
                print(f"✅ Saved {len(records)} records to Supabase")
            else:
                print(f"⚠️  Supabase save error {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"⚠️  Supabase save exception: {e}")


# ───────────────────────────────────────────
# MAIN PIPELINE
# ───────────────────────────────────────────
async def run_pipeline(rows: list, seller_id: str = None, boutique_id: str = None, client_name: str = "") -> dict:
    stats = {"clients": 0, "tags": 0, "ai": 0, "rgpd": 0, "nba": 0, "privacyAvg": 0, "atRisk": 0}
    rgpd_bad = []
    data = []

    # Step 1: Clean with AI
    async with httpx.AsyncClient() as client:
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i+BATCH_SIZE]

            async def process_row(row):
                orig = row.get("Transcription") or row.get("transcription") or ""
                row_id = row.get("ID") or row.get("id") or "N/A"
                date = row.get("Date") or row.get("date") or ""
                lang = (row.get("Language") or row.get("Langue") or "FR").upper()
                ca = row.get("CA") or row.get("Advisor") or f"CA-{random.randint(1,5)}"
                store = row.get("Store") or row.get("Boutique") or ""

                result = await clean_one(client, orig)
                stats["ai"] += 1
                sensitive_count, sensitive_found = detect_sensitive(orig)

                if result["rgpdCount"] > 0:
                    stats["rgpd"] += result["rgpdCount"]
                    masks = re.findall(r'\[[A-Z]+-MASQU[ÉE]+\]', result["text"], re.IGNORECASE)
                    for m in masks:
                        rgpd_bad.append({"id": row_id, "cat": m.strip("[]"), "w": "Masqué par IA"})

                clean = re.sub(r'\s+', ' ', result["text"]).strip()
                extracted_name = result.get("nom", "Non mentionné")
                stats["clients"] += 1
                return {
                    "id": row_id, "date": date, "lang": lang, "ca": ca, "store": store,
                    "orig": orig, "clean": clean, "tags": [], "nba": [],
                    "sensitiveCount": sensitive_count, "sensitiveFound": sensitive_found,
                    "rgpdMasked": result["rgpdCount"],
                    "clientName": extracted_name,
                }

            batch_results = await asyncio.gather(*[process_row(r) for r in batch])
            data.extend(batch_results)
            if i + BATCH_SIZE < len(rows):
                await asyncio.sleep(BATCH_DELAY)

    # Step 2: Extract tags
    seen_tags = set()
    for row in data:
        row["tags"] = extract_tags(row["clean"])
        stats["tags"] += len(row["tags"])

    # Step 3: Generate NBA
    async with httpx.AsyncClient() as client:
        for i in range(0, len(data), BATCH_SIZE):
            batch = data[i:i+BATCH_SIZE]
            async def nba_for_row(row):
                row["nba"] = await generate_nba(client, row["tags"], row["clean"])
                stats["nba"] += len(row["nba"])
            await asyncio.gather(*[nba_for_row(r) for r in batch])
            if i + BATCH_SIZE < len(data):
                await asyncio.sleep(BATCH_DELAY)

    # Step 4: Sentiment (via Mistral AI avec fallback local)
    sentiment_data = []
    async with httpx.AsyncClient() as client:
        for i in range(0, len(data), BATCH_SIZE):
            batch = data[i:i+BATCH_SIZE]

            async def sentiment_for_row(row):
                tags_str = ", ".join(t["t"] for t in row.get("tags", []))
                s = await analyze_sentiment_ai(client, row["clean"], tags_str, row["id"], row["ca"])
                row["sentiment"] = {
                    "score": s["score"],
                    "level": s["level"],
                    "posFound": s["posFound"],
                    "negFound": s["negFound"],
                    "justification": s.get("justification", ""),
                }
                if s["level"] == "negative":
                    stats["atRisk"] += 1
                sentiment_data.append({
                    "id": s["id"],
                    "ca": s["ca"],
                    "score": s["score"],
                    "level": s["level"],
                    "posFound": s["posFound"],
                    "negFound": s["negFound"],
                    "excerpt": s["excerpt"],
                    "justification": s.get("justification", ""),
                })

            await asyncio.gather(*[sentiment_for_row(r) for r in batch])
            if i + BATCH_SIZE < len(data):
                await asyncio.sleep(BATCH_DELAY)

    # Step 5: Privacy Scores
    privacy_scores, privacy_avg = compute_privacy_scores(data)
    stats["privacyAvg"] = privacy_avg

    # Step 6: Save to Supabase
    await save_to_supabase(data, seller_id=seller_id, boutique_id=boutique_id, client_name=client_name)

    return {
        "data": data,
        "stats": stats,
        "rgpdBad": rgpd_bad,
        "privacyScores": privacy_scores,
        "sentimentData": sentiment_data,
    }


# ───────────────────────────────────────────
# FLASK ROUTES
# ───────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/process", methods=["POST"])
def api_process():
    """Process a CSV file upload. Accepts multipart file or JSON with csv text."""
    csv_text = None
    seller_id = None
    boutique_id = None

    if request.content_type and "multipart" in request.content_type.lower():
        f = request.files.get("file")
        if not f:
            return jsonify({"error": "Aucun fichier fourni. Utilisez le champ 'file' pour le CSV."}), 400
        try:
            raw = f.read()
            csv_text = raw.decode("utf-8-sig")  # utf-8-sig enlève le BOM
        except UnicodeDecodeError:
            try:
                csv_text = raw.decode("latin-1")
            except Exception:
                return jsonify({"error": "Encodage du fichier non reconnu. Utilisez UTF-8."}), 400
        seller_id = request.form.get("seller_id") or None
        boutique_id = request.form.get("boutique_id") or None
    else:
        body = request.get_json(silent=True)
        if body and "csv" in body:
            csv_text = body["csv"]
            seller_id = body.get("seller_id")
            boutique_id = body.get("boutique_id")

    if not csv_text or not csv_text.strip():
        return jsonify({"error": "Aucune donnée CSV fournie."}), 400

    rows = parse_csv(csv_text)
    if not rows:
        return jsonify({
            "error": "CSV vide ou format non reconnu. Le fichier doit contenir une ligne d'en-têtes avec au moins une colonne 'Transcription' (ou Texte, Commentaire, Notes), puis des lignes de données."
        }), 400

    result = asyncio.run(run_pipeline(rows, seller_id=seller_id, boutique_id=boutique_id))
    return jsonify(result)


@app.route("/api/process-text", methods=["POST"])
def api_process_text():
    """Process a single transcription text (from audio recording)."""
    body = request.get_json(silent=True)
    if not body or "text" not in body:
        return jsonify({"error": "No text provided"}), 400

    text = body["text"].strip()
    if not text:
        return jsonify({"error": "Empty text provided"}), 400

    ca = body.get("ca", "CA-Audio").strip() or "CA-Audio"
    seller_id = body.get("seller_id")
    boutique_id = body.get("boutique_id")
    client_name = body.get("client_name", "")
    row_id = f"AUDIO-{int(time.time())}"

    rows = [{
        "ID": row_id,
        "Date": time.strftime("%Y-%m-%d"),
        "Language": "FR",
        "CA": ca,
        "Store": "",
        "Transcription": text,
    }]

    result = asyncio.run(run_pipeline(rows, seller_id=seller_id, boutique_id=boutique_id, client_name=client_name))
    return jsonify(result)


@app.route("/api/followup", methods=["POST"])
def api_followup():
    return jsonify({"info": "Follow-up generation is handled client-side."})


# ───────────────────────────────────────────
# ADMIN — Suppression des données (protégé par ADMIN_SECRET)
# ───────────────────────────────────────────
def _require_admin():
    """Vérifie la clé admin (body admin_key ou header X-Admin-Key). Retourne (None, None) si OK, sinon (json_error, status_code)."""
    if not ADMIN_SECRET:
        return jsonify({"error": "Admin non configuré (ADMIN_SECRET manquant dans .env)"}), 503
    # Lire d'abord le body (plus fiable avec CORS), puis les headers
    key = ""
    if request.is_json:
        try:
            body = request.get_json(silent=True) or {}
            key = (body.get("admin_key") or "").strip()
        except Exception:
            pass
    if not key:
        key = (request.headers.get("X-Admin-Key") or request.headers.get("Authorization", "").replace("Bearer ", "").strip())
    key = (key or "").strip()
    if key != ADMIN_SECRET:
        return jsonify({"error": "Clé admin invalide"}), 403
    return None, None


@app.route("/api/admin/clear-clients", methods=["POST", "DELETE"])
def api_admin_clear_clients():
    """Supprime toutes les lignes de la table clients. Nécessite X-Admin-Key: <ADMIN_SECRET> ou body { "admin_key": "..." }."""
    err, status = _require_admin()
    if err is not None:
        return err, status
    if not SUPABASE_REST or not SUPABASE_KEY:
        return jsonify({"error": "Supabase non configuré"}), 503

    async def _run():
        async with httpx.AsyncClient() as client:
            return await _supabase_delete_all(client, "clients")

    ok, count_or_msg = asyncio.run(_run())
    if ok:
        msg = f"{count_or_msg} enregistrement(s) supprimé(s)" if count_or_msg else "Aucune donnée à supprimer"
        return jsonify({"success": True, "message": msg, "deleted": count_or_msg})
    return jsonify({"error": "Erreur Supabase", "details": count_or_msg}), 500


async def _supabase_delete_all(client: httpx.AsyncClient, table: str) -> tuple:
    """Supprime toutes les lignes d'une table. Retourne (success, count ou message)."""
    resp = await client.get(
        f"{SUPABASE_REST}/{table}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        params={"select": "id"},
        timeout=30.0,
    )
    if resp.status_code != 200:
        return False, resp.text
    rows = resp.json()
    ids = [r["id"] for r in rows] if isinstance(rows, list) and rows and isinstance(rows[0], dict) else []
    if not ids:
        return True, 0
    for i in range(0, len(ids), 100):
        batch = ids[i : i + 100]
        in_filter = ",".join(f'"{x}"' for x in batch)
        r = await client.delete(
            f"{SUPABASE_REST}/{table}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            params={"id": f"in.({in_filter})"},
            timeout=30.0,
        )
        if r.status_code not in (200, 204):
            return False, r.text
    return True, len(ids)


@app.route("/api/admin/clear-all", methods=["POST", "DELETE"])
def api_admin_clear_all():
    """Supprime clients puis optionnellement sellers. body: { "admin_key": "...", "sellers": true }."""
    err, status = _require_admin()
    if err is not None:
        return err, status
    if not SUPABASE_REST or not SUPABASE_KEY:
        return jsonify({"error": "Supabase non configuré"}), 503
    body = request.get_json(silent=True) or {}

    async def _run():
        async with httpx.AsyncClient() as client:
            ok, n = await _supabase_delete_all(client, "clients")
            if not ok:
                return False, n
            deleted_sellers = 0
            if body.get("sellers"):
                ok2, n2 = await _supabase_delete_all(client, "sellers")
                if not ok2:
                    return False, n2
                deleted_sellers = n2
            return True, {"clients": n, "sellers": deleted_sellers}

    ok, result = asyncio.run(_run())
    if ok:
        return jsonify({"success": True, "deleted": result})
    return jsonify({"error": "Erreur Supabase", "details": result}), 500


# ───────────────────────────────────────────
# SMART FOLLOW-UP
# ───────────────────────────────────────────
SMART_FOLLOWUP_PROMPT = """Tu es un expert en clienteling luxe pour {house}.
Rédige un message de suivi personnalisé pour le client {client_name} via {channel}.

Contexte client (note du Client Advisor) :
{clean_text}

Tags détectés : {tags_formatted}

Produits recommandés à mentionner naturellement :
{products_formatted}

Consignes :
- Ton chaleureux, élégant, jamais commercial ou insistant
- Mentionne les produits de façon naturelle et contextuelle (pas de liste)
- Adapte la longueur au canal : email (3-4 paragraphes), whatsapp (2-3 phrases), sms (1 phrase)
- Langue : {language}
- Ne mentionne JAMAIS de prix directement dans le message

RÉPONDS UNIQUEMENT EN JSON :
{{"subject": "...", "body": "...", "products_mentioned": ["..."]}}"""


def _build_followup_fallback(client_name: str, tags: list, products: list, channel: str, house: str) -> dict:
    """Message template basique si Mistral échoue."""
    from datetime import datetime, timezone
    product_names = [p.get("name", "") for p in products if p.get("name")][:3]
    name_part = client_name if client_name and client_name.strip() else "client(e)"

    if channel == "whatsapp":
        subject = ""
        body = f"Bonjour {name_part}, je voulais vous faire part de quelques pièces qui m'ont fait penser à vous."
        if product_names:
            body += " Notamment " + " et ".join(product_names) + "."
        body += f" N'hésitez pas à me contacter. Bien à vous, votre CA {house}."
    elif channel == "sms":
        subject = ""
        body = f"Bonjour {name_part}, {house} — une sélection spécialement pour vous. Contactez-nous."
    else:
        subject = f"Une sélection personnalisée pour vous — {house}"
        lines = [f"Cher(e) {name_part},", ""]
        lines.append("Je me permets de vous contacter afin de vous présenter une sélection réalisée spécialement pour vous.")
        if product_names:
            lines += ["", "Je souhaitais particulièrement attirer votre attention sur : " + ", ".join(product_names) + "."]
        lines += ["", "Je reste à votre entière disposition pour organiser une présentation en boutique.", "", f"Bien cordialement,", f"Votre Client Advisor {house}"]
        body = "\n".join(lines)

    return {
        "subject": subject,
        "body": body,
        "products_mentioned": product_names,
        "channel": channel,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.route("/api/smart-followup", methods=["POST"])
def api_smart_followup():
    """Génère un message de follow-up personnalisé via Mistral, avec produits LV intégrés."""
    from datetime import datetime, timezone

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "No JSON body provided"}), 400

    # ── Input extraction ──────────────────────────────────────────
    tags        = body.get("tags", [])
    clean_text  = (body.get("clean_text") or "").strip()
    products    = body.get("products", [])[:3]
    channel     = (body.get("channel") or "email").lower()
    house       = (body.get("house") or "Louis Vuitton").strip()
    client_name = (body.get("client_name") or "").strip()
    language    = (body.get("language") or "FR").upper()

    # ── Input validation ──────────────────────────────────────────
    if channel not in ("email", "whatsapp", "sms"):
        return jsonify({"error": f"Canal invalide '{channel}'. Valeurs acceptées : email, whatsapp, sms"}), 400
    if not clean_text and not tags:
        return jsonify({"error": "Au moins 'clean_text' ou 'tags' doit être fourni"}), 400

    # ── Format tags grouped by category ──────────────────────────
    tag_by_cat: dict = {}
    for t in tags:
        cat = t.get("c", "autre")
        tag_by_cat.setdefault(cat, []).append(t.get("t", ""))
    tags_formatted = "; ".join(
        f"{cat}: {', '.join(vals)}" for cat, vals in tag_by_cat.items() if vals
    ) or "Aucun signal disponible"

    # ── Format products ───────────────────────────────────────────
    products_formatted = "\n".join(
        f"- {p.get('name', 'N/A')} ({p.get('category', 'N/A')})"
        for p in products if p.get("name")
    ) or "Aucun produit spécifique — ne pas inventer de références produit, rester sur le contexte de la visite"

    # ── Build prompt ──────────────────────────────────────────────
    prompt = SMART_FOLLOWUP_PROMPT.format(
        house=house,
        client_name=client_name or "le client",
        channel=channel,
        clean_text=clean_text[:400],
        tags_formatted=tags_formatted,
        products_formatted=products_formatted,
        language=language,
    )

    # ── Call Mistral with 10s timeout ─────────────────────────────
    async def _call():
        async with httpx.AsyncClient() as http:
            return await asyncio.wait_for(
                call_mistral(http, prompt, max_tokens=700),
                timeout=10.0,
            )

    try:
        raw = asyncio.run(_call())
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            raise ValueError("No JSON found in Mistral response")
        parsed = json.loads(json_match.group(0))
        return jsonify({
            "subject":            parsed.get("subject", ""),
            "body":               parsed.get("body", ""),
            "products_mentioned": parsed.get("products_mentioned", []),
            "channel":            channel,
            "generated_at":       datetime.now(timezone.utc).isoformat(),
        })

    except asyncio.TimeoutError:
        app.logger.error("[smart-followup] Mistral timeout after 10s")
        return jsonify({"error": "timeout", "fallback": True})

    except Exception as e:
        app.logger.error(f"[smart-followup] Error: {e}")
        fallback = _build_followup_fallback(client_name, tags, products, channel, house)
        return jsonify(fallback)


# ───────────────────────────────────────────
# COACH RGPD
# ───────────────────────────────────────────
COACH_RGPD_SYSTEM = """Tu es un formateur RGPD pour Client Advisors LVMH. Voici une note prise par un vendeur. Pour chaque donnée sensible détectée, explique en 1 phrase pourquoi c'est interdit et propose une reformulation qui garde l'info utile sans violer le RGPD. Si la note est conforme, félicite le vendeur et suggère comment enrichir la note avec plus d'informations exploitables (centres d'intérêt, style, occasion). RÉPONSE JSON UNIQUEMENT : {"feedback":"message global","suggestions":[{"original":"passage problématique","reason":"pourquoi interdit","reformulation":"version conforme"}]}"""


@app.route("/api/coach-rgpd", methods=["POST"])
def api_coach_rgpd():
    """Analyse une note vendeur : score RGPD, score qualité, feedback Mistral."""
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "No JSON body provided"}), 400

    text = (body.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Le champ 'text' est requis et ne peut pas être vide"}), 400

    language = (body.get("language") or "FR").strip().upper()

    # --- Étape 1 : détection violations RGPD ---
    try:
        sensitive_count, sensitive_found = detect_sensitive(text)
    except Exception:
        sensitive_count, sensitive_found = 0, []

    violations = sensitive_found  # liste de {"cat": ..., "word": ...}

    # --- Étape 2 : extraction des tags ---
    try:
        tags = extract_tags(text)
    except Exception:
        tags = []

    # --- Étape 3 : calcul des scores ---
    rgpd_score = max(0, 100 - len(violations) * 15)

    tag_count = len(tags)
    if tag_count == 0:
        quality_score = 20
    elif tag_count <= 3:
        quality_score = 40
    elif tag_count <= 6:
        quality_score = 60
    elif tag_count <= 10:
        quality_score = 80
    else:
        quality_score = 100

    # --- Étape 4 : appel Mistral pour feedback et suggestions ---
    violations_str = (
        "\n".join(f"- [{v.get('cat', '')}] \"{v.get('word', '')}\"" for v in violations)
        if violations else "Aucune violation détectée"
    )
    tags_str = (
        ", ".join(f"{t.get('t', '')} ({t.get('c', '')})" for t in tags if t.get("t"))
        or "Aucun tag extractible"
    )

    user_message = (
        f"Note du vendeur :\n{text}\n\n"
        f"Violations RGPD détectées :\n{violations_str}\n\n"
        f"Tags CRM extractibles : {tags_str}\n\n"
        f"RÉPONSE JSON UNIQUEMENT (sans markdown) :\n"
        f'{{\"feedback\": \"...\", \"suggestions\": []}}'
    )

    full_prompt = COACH_RGPD_SYSTEM + "\n\n" + user_message

    async def _call():
        async with httpx.AsyncClient() as client:
            return await call_mistral(client, full_prompt, max_tokens=700)

    feedback = ""
    suggestions = []

    try:
        raw = asyncio.run(_call())
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if json_match:
            parsed = json.loads(json_match.group(0))
            feedback = parsed.get("feedback", "")
            suggestions = parsed.get("suggestions", [])
    except Exception:
        # Fallback silencieux : scores et violations retournés, pas de feedback IA
        pass

    return jsonify({
        "rgpd_score": rgpd_score,
        "quality_score": quality_score,
        "violations": violations,
        "extractable_tags_count": tag_count,
        "tags": tags,
        "feedback": feedback,
        "suggestions": suggestions,
    })


# ───────────────────────────────────────────
# MAIN
# ───────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print(f"🚀  LVMH Voice-to-Tag Backend on http://localhost:{port}")
    print(f"   Mistral API: {'✅' if MISTRAL_API_KEY else '❌ MISSING'}")
    print(f"   Supabase:    {'✅ ' + SUPABASE_URL if SUPABASE_URL else '❌ MISSING'}")
    app.run(host="0.0.0.0", port=port, debug=True)
