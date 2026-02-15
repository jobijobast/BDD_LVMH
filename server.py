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

load_dotenv()

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

# ───────────────────────────────────────────
# PROMPTS
# ───────────────────────────────────────────
CLEANING_PROMPT = """Tu es un expert RGPD retail luxe. Nettoie ET sécurise la transcription.

SUPPRIMER: hésitations (euh,hum,uh,um,eh,ah,oh,hmm,bah,ben,pues,ehm,äh,ähm), fillers (genre,like,tipo,basically,en fait,du coup,tu vois,you know,quoi,right,vale,ok,genau,en quelque sorte,plus ou moins), répétitions.

MASQUER:
- Carte bancaire → [CARTE-MASQUÉE]
- IBAN → [IBAN-MASQUÉ]
- Code accès/digicode → [CODE-MASQUÉ]
- SSN/passeport → [ID-MASQUÉ]
- Adresse complète → [ADRESSE-MASQUÉE]
- Téléphone → [TEL-MASQUÉ]
- Email → [EMAIL-MASQUÉ]
- Mot de passe → [MDP-MASQUÉ]

GARDER: noms, professions, âges, budgets, préférences, allergies, régimes, dates événements, historique.

RÉPONSE (2 lignes):
RGPD_COUNT: [nombre]
TEXT: [texte nettoyé]

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

# ───────────────────────────────────────────
# SENTIMENT KEYWORDS
# ───────────────────────────────────────────
SENTIMENT_POSITIVE = [
    'ravi','enchanté','magnifique','parfait','excellent','adore',
    'love','amazing','wonderful','happy','impressed','satisfait',
    'superbe','merveilleux','content','fidèle','recommande','plaisir'
]
SENTIMENT_NEGATIVE = [
    'déçu','disappointed','frustré','attente','delay','retard',
    'problème','problem','défaut','cassé','broken','mauvais',
    'poor','cher','expensive','lent','slow','erreur','error',
    'plainte','complaint','insatisfait','médiocre','décevant',
    'jamais reçu','perdu','endommagé','damaged'
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
# TAG RULES
# ───────────────────────────────────────────
TAG_RULES = [
    (r'\bdentist','profession','Dentiste'),(r'\bmédecin|doctor\b','profession','Médecin'),
    (r'\bchirurgien|surgeon','profession','Chirurgien'),(r'\bcardiologue|cardiologist','profession','Cardiologue'),
    (r'\boncologue|oncologist','profession','Oncologue'),(r'\bpsycholog|psychotherap','profession','Psychologue'),
    (r'\bavocat|lawyer|attorney','profession','Avocat'),(r'\barchitecte|architect','profession','Architecte'),
    (r'\bceo|pdg|directeur','profession','Directeur/CEO'),(r'\bentrepreneur|startup','profession','Entrepreneur'),
    (r'\bbanquier|banker','profession','Banquier'),(r'\bjournaliste|journalist','profession','Journaliste'),
    (r'\binfluenceur|influencer','profession','Influenceur'),(r'\bphotographe|photographer','profession','Photographe'),
    (r'\bchef.*michelin|étoilé','profession','Chef étoilé'),(r'\bsommelier','profession','Sommelier'),
    (r'\bprofesseur|professor','profession','Professeur'),(r'\bgaleriste|curator|museum','profession','Art/Musée'),
    (r'\bpilote|pilot','profession','Pilote'),(r'\bdeveloppeur|developer|software','profession','Tech/Dev'),
    (r'\bsac professionnel|work bag','product','Sac Pro'),(r'\bsac voyage|travel','product','Sac Voyage'),
    (r'\bmontre|watch','product','Montres'),(r'\bbijou|jewelry','product','Bijoux'),
    (r'\bparfum|fragrance|perfume','product','Parfums'),(r'\bchaussure|shoe|sneaker','product','Chaussures'),
    (r'\bfoulard|silk|scarf','product','Foulards'),(r'\blunettes|sunglasses','product','Lunettes'),
    (r'cuir noir|black leather|nero|negro','pref','Noir'),(r'\bnavy|marine\b','pref','Navy'),
    (r'\bbeige|champagne','pref','Beige'),(r'\bcognac|camel|marron','pref','Cognac'),
    (r'hardware.*or|gold.*hardware|doré','pref','Or'),(r'rose gold|or rose','pref','Rose Gold'),
    (r'\bclassique|classic|timeless','style','Classique'),(r'\bmoderne|modern','style','Moderne'),
    (r'\bélégant|elegant','style','Élégant'),(r'\bdiscret|understated','style','Discret'),
    (r'\bminimaliste|minimalist','style','Minimaliste'),(r'\bfonctionnel|functional','style','Fonctionnel'),
    (r'\byoga','lifestyle','Yoga'),(r'\bpilates','lifestyle','Pilates'),
    (r'\bgolf','lifestyle','Golf'),(r'\btennis','lifestyle','Tennis'),
    (r'\brunning|marathon','lifestyle','Running'),(r'\bnatation|swimming|triathlon','lifestyle','Natation'),
    (r'\bescalade|climbing','lifestyle','Escalade'),(r'\bsurf','lifestyle','Surf'),
    (r'\bcrossfit','lifestyle','CrossFit'),(r'\bméditation|meditation','lifestyle','Méditation'),
    (r'\bvégétarien|vegetarian','lifestyle','Végétarien'),(r'\bvegan|végane','lifestyle','Vegan'),
    (r'\bpescetarien|pescatarian','lifestyle','Pescetarien'),(r'\bcollectionn|collector','lifestyle','Collectionneur'),
    (r'\ballergie.*nickel','service','⚠️ Nickel'),(r'\ballergie.*latex','service','⚠️ Latex'),
    (r'\ballergie.*gluten|celiac','service','⚠️ Gluten'),(r'\ballergie.*arachide|peanut','service','⚠️ Arachides'),
    (r'\bintolérance lactose|lactose','service','⚠️ Lactose'),
    (r'\banniversaire|birthday','occasion','Anniversaire'),(r'\bmariage|wedding','occasion','Mariage'),
    (r'\bcadeau|gift','occasion','Cadeau'),(r'\bpetit.enfant|grandchild','occasion','Petits-enfants'),
    (r'\bdivorce|séparation|changement de vie','occasion','Nouveau départ'),
    (r'\bretraite|retirement','occasion','Retraite'),(r'\bpromotion|nouveau poste','occasion','Promotion'),
    (r'\bvip\b','budget','VIP'),(r'budget.{0,15}[3-5]\s*k','budget','3-5K'),
    (r'budget.{0,15}[6-9]\s*k','budget','6-9K'),(r'budget.{0,15}1[0-5]\s*k','budget','10-15K'),
    (r'budget.{0,15}(1[6-9]|2\d)\s*k','budget','15K+'),(r'très flexible|very flexible','budget','Flexible'),
    (r'haut potentiel|high potential','budget','Potentiel'),(r'nouveau client|new client|première','budget','Nouveau'),
    (r'client.*régulier|regular','budget','Régulier'),(r'depuis 201|since 201','budget','Fidèle'),
    (r'\brappeler|follow.?up','service','Rappeler'),(r'preview.*privé|private.*preview','service','Preview'),
    (r'\bréseau|network','network','Réseau'),(r'\bréféré|referred','network','Référent'),
    (r'instagram|youtube|followers','network','Influenceur'),
    (r'sustainab|durable|recyclé','pref','Durabilité'),(r'artisan|handcraft','pref','Artisanat'),
    (r'\bjapon|japan|tokyo','pref','Japon'),(r'\bitalie|italy|milan','pref','Italie'),
    (r'\bparis|france','pref','France'),(r'\bnew york|nyc|usa','pref','USA'),
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
    for cat, patterns in RGPD_FALLBACK.items():
        for pat in patterns:
            matches = re.findall(pat, clean, re.IGNORECASE)
            if matches:
                count += len(matches)
                clean = re.sub(pat, f'[{cat.upper()}-MASQUÉ]', clean, flags=re.IGNORECASE)
    return {"text": clean, "rgpdCount": count}


async def clean_one(client: httpx.AsyncClient, text: str) -> dict:
    try:
        result = await call_mistral(client, CLEANING_PROMPT + text, 600)
        rgpd_match = re.search(r'RGPD_COUNT:\s*(\d+)', result, re.IGNORECASE)
        text_match = re.search(r'TEXT:\s*([\s\S]*)', result, re.IGNORECASE)
        if rgpd_match and text_match:
            return {"text": text_match.group(1).strip(), "rgpdCount": int(rgpd_match.group(1))}
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
    if "occasion" in tag_cats:
        occ = next((t["t"] for t in tags if t["c"] == "occasion"), "")
        actions.append({"action": f"Préparer sélection pour: {occ}", "type": "immediate", "category": "product"})
    if "style" in tag_cats or "pref" in tag_cats:
        styles = [t["t"] for t in tags if t["c"] in ("style", "pref")]
        actions.append({"action": f"Envoyer lookbook {', '.join(styles)}", "type": "short_term", "category": "product"})
    if "budget" in tag_cats:
        actions.append({"action": "Inviter à un événement exclusif", "type": "long_term", "category": "experience"})
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


def analyze_sentiment(clean_text: str, row_id: str, ca: str) -> dict:
    text = clean_text.lower()
    pos_score = sum(1 for kw in SENTIMENT_POSITIVE if kw in text)
    neg_score = sum(1.5 for kw in SENTIMENT_NEGATIVE if kw in text)
    pos_found = [kw for kw in SENTIMENT_POSITIVE if kw in text]
    neg_found = [kw for kw in SENTIMENT_NEGATIVE if kw in text]
    total = pos_score + neg_score or 1
    score = round((pos_score / total) * 100)
    level = "positive" if score >= 70 else ("neutral" if score >= 40 else "negative")
    return {"id": row_id, "ca": ca, "score": score, "level": level, "posFound": pos_found, "negFound": neg_found, "excerpt": clean_text[:150]}


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
def parse_csv(text: str) -> list:
    lines = text.strip().split("\n")
    headers = [h.strip().strip('"') for h in lines[0].split(",")]
    rows = []
    for line in lines[1:]:
        if not line.strip():
            continue
        vals, curr, in_q = [], "", False
        for ch in line:
            if ch == '"': in_q = not in_q
            elif ch == ',' and not in_q: vals.append(curr.strip()); curr = ""
            else: curr += ch
        vals.append(curr.strip())
        if len(vals) >= len(headers):
            row = {headers[j]: (vals[j] if j < len(vals) else "") for j in range(len(headers))}
            rows.append(row)
    return rows


# ───────────────────────────────────────────
# SUPABASE SAVE
# ───────────────────────────────────────────
async def save_to_supabase(data: list, seller_id: str = None, boutique_id: str = None, client_name: str = ""):
    """Save processed rows to Supabase clients table."""
    if not SUPABASE_REST or not SUPABASE_KEY:
        print("⚠️  Supabase not configured, skipping save")
        return

    records = []
    for row in data:
        record = {
            "external_id": row["id"],
            "date": row["date"] or time.strftime("%Y-%m-%d"),
            "language": row["lang"],
            "original_text": row["orig"],
            "cleaned_text": row["clean"],
            "tags": json.dumps(row["tags"]),
            "nba": json.dumps(row["nba"]),
            "sentiment": json.dumps(row.get("sentiment", {})),
            "sensitive_count": row["sensitiveCount"],
            "sensitive_found": json.dumps(row["sensitiveFound"]),
            "rgpd_masked": row["rgpdMasked"],
            "store": row.get("store", ""),
            "client_name": client_name or row.get("ca", ""),
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
                stats["clients"] += 1
                return {
                    "id": row_id, "date": date, "lang": lang, "ca": ca, "store": store,
                    "orig": orig, "clean": clean, "tags": [], "nba": [],
                    "sensitiveCount": sensitive_count, "sensitiveFound": sensitive_found,
                    "rgpdMasked": result["rgpdCount"],
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

    # Step 4: Sentiment
    sentiment_data = []
    for row in data:
        s = analyze_sentiment(row["clean"], row["id"], row["ca"])
        row["sentiment"] = {"score": s["score"], "level": s["level"], "posFound": s["posFound"], "negFound": s["negFound"]}
        if s["level"] == "negative":
            stats["atRisk"] += 1
        sentiment_data.append(s)

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

    if request.content_type and "multipart" in request.content_type:
        f = request.files.get("file")
        if not f:
            return jsonify({"error": "No file provided"}), 400
        csv_text = f.read().decode("utf-8")
        seller_id = request.form.get("seller_id")
        boutique_id = request.form.get("boutique_id")
    else:
        body = request.get_json(silent=True)
        if body and "csv" in body:
            csv_text = body["csv"]
            seller_id = body.get("seller_id")
            boutique_id = body.get("boutique_id")

    if not csv_text:
        return jsonify({"error": "No CSV data provided"}), 400

    rows = parse_csv(csv_text)
    if not rows:
        return jsonify({"error": "CSV empty or could not be parsed"}), 400

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
# MAIN
# ───────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print(f"🚀  LVMH Voice-to-Tag Backend on http://localhost:{port}")
    print(f"   Mistral API: {'✅' if MISTRAL_API_KEY else '❌ MISSING'}")
    print(f"   Supabase:    {'✅ ' + SUPABASE_URL if SUPABASE_URL else '❌ MISSING'}")
    app.run(host="0.0.0.0", port=port, debug=True)
