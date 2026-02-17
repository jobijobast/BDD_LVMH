/**
 * LVMH Voice-to-Tag — AI Platform Engine
 * NBA + Privacy Score + Cross-Brand + Luxury Pulse
 */

// ===== LOUIS VUITTON PRODUCT DATABASE =====
let LV_PRODUCTS = [];
let PRODUCTS_LOADED = false;

// Load LV products from JSON file
async function loadLVProducts() {
    if (PRODUCTS_LOADED) return;
    
    try {
        const response = await fetch('louis_vuitton_femme_et_homme copie.json');
        if (!response.ok) throw new Error('Failed to load product database');
        
        LV_PRODUCTS = await response.json();
        PRODUCTS_LOADED = true;
        console.log(`✅ Loaded ${LV_PRODUCTS.length} Louis Vuitton products`);
    } catch (error) {
        console.error('❌ Error loading LV products:', error);
        LV_PRODUCTS = [];
    }
}

// Initialize product loading on page load
if (typeof window !== 'undefined') {
    loadLVProducts();
}

// ===== CONFIG =====
const MISTRAL_API_KEY = 'jdktG6GMjxjSz769BBOpuO7Yr7nD7evc';
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const BATCH_SIZE = 5;
const BATCH_DELAY = 80;

// ===== PROMPTS =====
const CLEANING_PROMPT = `Tu es un expert RGPD retail luxe. Nettoie ET sécurise la transcription.

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

Texte: `;

const FOLLOWUP_PROMPT = `Tu es un Client Advisor expert de la Maison {house}. Rédige un {channel} de suivi personnalisé après un rendez-vous client.

PROFIL CLIENT:
Tags: {tags}
Résumé: {text}

RÈGLES:
- Ton raffiné, chaleureux, personnalisé
- Mentionner des éléments spécifiques du profil
- {channel_rules}
- NE PAS inclure de données personnelles sensibles
- Signer au nom de la Maison

RÉPONSE FORMAT:
SUBJECT: [objet du message]
BODY: [corps du message]`;

const SENTIMENT_KEYWORDS = {
    positive: ['ravi', 'enchanté', 'magnifique', 'parfait', 'excellent', 'adore', 'love', 'amazing', 'wonderful', 'happy', 'impressed', 'satisfait', 'superbe', 'merveilleux', 'content', 'fidèle', 'recommande', 'plaisir'],
    negative: ['déçu', 'disappointed', 'frustré', 'attente', 'delay', 'retard', 'problème', 'problem', 'défaut', 'cassé', 'broken', 'mauvais', 'poor', 'cher', 'expensive', 'lent', 'slow', 'erreur', 'error', 'plainte', 'complaint', 'insatisfait', 'médiocre', 'décevant', 'jamais reçu', 'perdu', 'endommagé', 'damaged']
};

// ===== PRODUCT CATALOG (LVMH simulated) =====
const PRODUCT_CATALOG = {
    'Golf': [
        { name: 'LV Damier Golf Bag', desc: 'Sac de golf en toile Damier enduite, finitions cuir', price: '4 200€', img: '⛳' },
        { name: 'Berluti Golf Glove', desc: 'Gant de golf en cuir patiné Venezia', price: '580€', img: '🧤' },
        { name: 'Loro Piana Cashmere Polo', desc: 'Polo en baby cashmere, coupe sport-chic', price: '1 150€', img: '👕' }
    ],
    'Ski': [
        { name: 'LV Ski Capsule Jacket', desc: 'Doudoune monogram réversible, collection ski', price: '3 800€', img: '🎿' },
        { name: 'Fendi Ski Goggles', desc: 'Masque FF logo, verres anti-buée haute montagne', price: '690€', img: '🥽' },
        { name: 'Rimowa Original Cabin', desc: 'Valise aluminium pour week-end ski', price: '1 340€', img: '🧳' }
    ],
    'Tennis': [
        { name: 'LV Tennis Sneakers', desc: 'Baskets Charlie en cuir, semelle technique', price: '1 080€', img: '🎾' },
        { name: 'Celine Sport Band', desc: 'Bandeau éponge Triomphe en coton bio', price: '320€', img: '🏅' },
        { name: 'Berluti Leather Racket Cover', desc: 'Housse raquette en cuir Venezia patiné', price: '1 450€', img: '🎒' }
    ],
    'Yoga': [
        { name: 'Loewe Yoga Mat Case', desc: 'Housse tapis yoga en cuir Anagram', price: '890€', img: '🧘' },
        { name: 'Loro Piana Stretch Cashmere Set', desc: 'Ensemble yoga en cashmere stretch', price: '2 400€', img: '👗' },
        { name: 'Dior Wellness Candle', desc: 'Bougie parfumée relaxation Maison Dior', price: '180€', img: '🕯️' }
    ],
    'Running': [
        { name: 'LV Run Away Sneakers', desc: 'Sneakers running en mesh et cuir technique', price: '980€', img: '🏃' },
        { name: 'Givenchy Sport Hoodie', desc: 'Sweat à capuche en jersey technique', price: '1 190€', img: '🧥' },
        { name: 'TAG Heuer Connected', desc: 'Montre connectée, GPS et cardio intégrés', price: '2 150€', img: '⌚' }
    ],
    'Montres': [
        { name: 'TAG Heuer Carrera', desc: 'Chronographe automatique, boîtier 42mm', price: '5 950€', img: '⌚' },
        { name: 'Hublot Big Bang', desc: 'Mouvement UNICO, boîtier céramique noire', price: '18 500€', img: '⌚' },
        { name: 'Bulgari Octo Finissimo', desc: 'Ultra-plat automatique, record mondial', price: '12 800€', img: '⌚' }
    ],
    'Bijoux': [
        { name: 'Tiffany T Wire Bracelet', desc: 'Bracelet en or rose 18k, design T iconic', price: '1 850€', img: '💎' },
        { name: 'Bulgari Serpenti Necklace', desc: 'Collier Serpenti Viper en or blanc et diamants', price: '8 900€', img: '💎' },
        { name: 'Chaumet Joséphine Tiara Ring', desc: 'Bague tiare en or blanc et diamants', price: '5 200€', img: '💍' }
    ],
    'Parfums': [
        { name: 'Dior Sauvage Elixir', desc: 'Parfum concentré, notes boisées intenses', price: '165€', img: '🧴' },
        { name: 'Givenchy L\'Interdit', desc: 'Eau de parfum, tubéreuse et vétiver noir', price: '145€', img: '🧴' },
        { name: 'Maison Francis Kurkdjian Baccarat Rouge', desc: 'Extrait de parfum, ambre et jasmin', price: '325€', img: '🧴' }
    ],
    'Anniversaire': [
        { name: 'LV Petite Malle', desc: 'Sac iconique en cuir Epi, édition collector', price: '5 500€', img: '🎁' },
        { name: 'Tiffany Heart Tag Pendant', desc: 'Pendentif cœur en argent 925, gravure possible', price: '280€', img: '💝' },
        { name: 'Dom Pérignon Vintage', desc: 'Champagne millésimé, coffret prestige', price: '250€', img: '🍾' }
    ],
    'Mariage': [
        { name: 'Tiffany Setting Engagement', desc: 'Solitaire diamant 1ct, monture platine iconique', price: '14 500€', img: '💍' },
        { name: 'Bulgari Wedding Band', desc: 'Alliance B.zero1 en or rose et céramique', price: '1 290€', img: '💍' },
        { name: 'LV Trunk Gift Box', desc: 'Malle cadeau personnalisée pour couple', price: '3 200€', img: '🎁' }
    ],
    'Cadeau': [
        { name: 'Dior Prestige Coffret', desc: 'Coffret soins prestige La Micro-Huile de Rose', price: '420€', img: '🎁' },
        { name: 'LV Pocket Organizer', desc: 'Organiseur de poche Monogram Eclipse', price: '420€', img: '👛' },
        { name: 'Rimowa Personal Case', desc: 'Trousse en aluminium anodisé, édition limitée', price: '680€', img: '🧳' }
    ],
    'Vegan': [
        { name: 'Stella McCartney x LV Capsule', desc: 'Sac Falabella en matériaux recyclés', price: '1 295€', img: '🌱' },
        { name: 'Loewe Cactus Leather Bag', desc: 'Sac en cuir de cactus, collection durable', price: '2 100€', img: '🌵' },
        { name: 'Sephora Clean Beauty Set', desc: 'Coffret cosmétiques vegan et cruelty-free', price: '89€', img: '🧴' }
    ],
    'Durabilité': [
        { name: 'LV Felt Line Collection', desc: 'Sac en feutre recyclé, édition éco-responsable', price: '2 200€', img: '🌍' },
        { name: 'Loro Piana The Gift of Kings', desc: 'Écharpe en laine mérinos traçable', price: '890€', img: '🧣' },
        { name: 'Berluti Upcycled Leather Wallet', desc: 'Portefeuille en cuirs revalorisés', price: '580€', img: '👛' }
    ],
    'Classique': [
        { name: 'LV Capucines MM', desc: 'Sac en cuir Taurillon, hardware LV signature', price: '5 900€', img: '👜' },
        { name: 'Dior Lady Dior Medium', desc: 'Sac iconique cannage en agneau noir', price: '5 500€', img: '👜' },
        { name: 'Celine Triomphe Canvas Bag', desc: 'Sac en toile Triomphe, cuir de veau naturel', price: '2 100€', img: '👜' }
    ],
    'Minimaliste': [
        { name: 'Celine Trio Bag', desc: 'Pochette triple en agneau lisse, minimaliste', price: '1 050€', img: '👝' },
        { name: 'Loewe Puzzle Small', desc: 'Sac Puzzle géométrique, cuir souple', price: '2 650€', img: '👜' },
        { name: 'Berluti Scritto Card Holder', desc: 'Porte-cartes en cuir Venezia gravé', price: '380€', img: '💳' }
    ],
    'VIP': [
        { name: 'LV Malle Personalisation', desc: 'Service sur-mesure, malle personnalisée', price: 'Sur devis', img: '✨' },
        { name: 'Tiffany High Jewelry Private Viewing', desc: 'Invitation viewing haute joaillerie privé', price: 'Sur invitation', img: '💎' },
        { name: 'Dior Atelier Experience', desc: 'Visite privée atelier couture Avenue Montaigne', price: 'Exclusif', img: '🏛️' }
    ]
};

const NBA_PROMPT = `Tu es un expert clienteling luxe LVMH. Analyse le profil client et génère 3 actions concrètes pour le Client Advisor.

Profil client:
TAGS: {tags}
TEXTE NETTOYÉ: {text}

Génère exactement 3 actions au format JSON array. Chaque action:
- "action": description concrète (1-2 phrases max)
- "type": "immediate"|"short_term"|"long_term"
- "category": "product"|"experience"|"relationship"|"event"

Exemples de bonnes actions:
- "Proposer la nouvelle collection capsule cuir cognac pour son prochain rendez-vous"
- "Inviter au private viewing joaillerie prévu le mois prochain"
- "Envoyer un message personnalisé pour son anniversaire avec sélection pré-curée"

RÉPONSE JSON UNIQUEMENT (pas de texte avant/après):
[{"action":"...","type":"...","category":"..."},{"action":"...","type":"...","category":"..."},{"action":"...","type":"...","category":"..."}]`;

// ===== RGPD FALLBACK =====
const RGPD_FALLBACK = {
    'Carte': [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g],
    'IBAN': [/\b[A-Z]{2}\d{2}[\s]?[A-Z0-9]{4}[\s]?[A-Z0-9]{4}[\s]?[A-Z0-9]{4}[\s]?[A-Z0-9]{0,4}/gi],
    'SSN': [/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g],
    'Tel': [/\b(\+\d{1,3}[\s]?)?\d{2,4}[\s]?\d{2,4}[\s]?\d{2,4}[\s]?\d{0,4}\b/g],
    'Email': [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
    'Code': [/\bcode\s*(porte|accès|digicode)?\s*:?\s*\d{4,6}\b/gi]
};

// ===== RGPD SENSITIVE KEYWORDS =====
const RGPD_SENSITIVE = [
    { cat: 'accessCodes', words: ['code porte', 'digicode', 'mot de passe', 'password', 'pin code'] },
    { cat: 'identity', words: ['numéro sécurité sociale', 'iban', 'passport number', 'credit card'] },
    { cat: 'orientation', words: ['homosexuel', 'gay', 'lesbienne', 'bisexuel', 'transgenre'] },
    { cat: 'politics', words: ['vote pour', 'électeur de', 'militant', 'parti politique'] },
    { cat: 'religion', words: ['pratiquant', 'converti', 'croyant fervent', 'fait le ramadan'] },
    { cat: 'familyConflict', words: ['violence conjugale', 'violence domestique', 'maltraitance'] },
    { cat: 'finance', words: ['dette', 'faillite', 'surendettement', 'bankruptcy'] },
    { cat: 'appearance', words: ['obèse', 'trop gros', 'laid', 'moche'] }
];

// ===== TAGS =====
// Legacy hardcoded tags removed. Using tagger.js instead.
const TAGS = []; // Deprecated


// ===== LVMH HOUSES =====
const LVMH_HOUSES = ['Louis Vuitton', 'Dior', 'Fendi', 'Givenchy', 'Celine', 'Loewe', 'Berluti', 'Loro Piana', 'Tiffany & Co.', 'Bulgari', 'TAG Heuer', 'Hublot', 'Moët Hennessy', 'Sephora', 'Rimowa'];

// ===== STATE =====
let DATA = [];
let NBA_DATA = [];
let RGPD_BAD = [];
let PRIVACY_SCORES = [];
let SENTIMENT_DATA = [];
let STATS = { clients: 0, tags: 0, ai: 0, rgpd: 0, nba: 0, privacyAvg: 0, atRisk: 0 };

const $ = id => document.getElementById(id);
const CAT_NAMES = {
    'PROFIL_GENRE': '👤 Genre',
    'PROFIL_GÉNÉRATION': '👶/👴 Génération',
    'PROFIL_STATUS': '💎 Status',
    'PROFIL_LANGUE': '🗣️ Langue',
    'PROFIL_INFLUENCE': '🌟 Influence',
    'PROFIL_DIGITAL': '📱 Digital',
    'PROFESSION_SANTÉ': '⚕️ Santé',
    'PROFESSION_FINANCE': '💰 Finance',
    'PROFESSION_LÉGAL': '⚖️ Légal',
    'PROFESSION_CRÉATIF': '🎨 Créatif',
    'PROFESSION_BUSINESS': '💼 Business',
    'PROFESSION_PUBLIC': '🏛️ Public',
    'PASSION_CERCLES': '🤝 Cercles',
    'PASSION_COLLECTION': '🖼️ Collection',
    'PASSION_SPORT': '🎾 Sport',
    'PASSION_CULTURE': '🎭 Culture',
    'VALEURS_ÉTHIQUE': '🌱 Valeurs',
    'VOYAGE_TYPE': '✈️ Type Voyage',
    'VOYAGE_DESTINATION': '📍 Destination',
    'INTENTION_DESTINATAIRE': '🎁 Pour qui ?',
    'INTENTION_OCCASION': '🎉 Occasion',
    'INTENTION_STYLE': '👗 Ref Style',
    'SÉCURITÉ_RISQUE': '⚠️ Risque',
    'SÉCURITÉ_ALIM': '🥗 Régime',
    'SÉCURITÉ_CONFORT': '🛋️ Confort',
    'UNIVERS_LV': '👜 Univers LV',
    'HISTO_MARO_FEMME': '👜 Maro Femme',
    'HISTO_MARO_HOMME': '🎒 Maro Homme',
    'HISTO_VOYAGE': '🧳 Voyage',
    'HISTO_SIZING': '📏 Taille',
    'HISTO_STYLE': '👠 Souliers',
    'OPPORTUNITÉS_MANQUÉES': '📉 Opportunités',
    'ACTION_CRM': '⚡ Action CRM'
};

// New Hierarchy based on Markmap
const SUPER_CATS = {
    '1. PROFILS': ['PROFIL_GENRE', 'PROFIL_GÉNÉRATION', 'PROFIL_STATUS', 'PROFIL_LANGUE', 'PROFIL_INFLUENCE', 'PROFIL_DIGITAL', 'PROFESSION_SANTÉ', 'PROFESSION_FINANCE', 'PROFESSION_LÉGAL', 'PROFESSION_CRÉATIF', 'PROFESSION_BUSINESS', 'PROFESSION_PUBLIC'],
    '2. INTÉRÊTS & CERCLES': ['PASSION_CERCLES', 'PASSION_COLLECTION', 'PASSION_SPORT', 'PASSION_CULTURE', 'VALEURS_ÉTHIQUE'],
    '3. VOYAGE': ['VOYAGE_TYPE', 'VOYAGE_DESTINATION'],
    '4. INTENTION D\'ACHAT': ['INTENTION_DESTINATAIRE', 'INTENTION_OCCASION', 'INTENTION_STYLE'],
    '5. SÉCURITÉ & HOSPITALITY': ['SÉCURITÉ_RISQUE', 'SÉCURITÉ_ALIM', 'SÉCURITÉ_CONFORT'],
    '6. L\'UNIVERS LOUIS VUITTON': ['UNIVERS_LV'],
    '7. HISTORIQUE & POSSESSIONS': ['HISTO_MARO_FEMME', 'HISTO_MARO_HOMME', 'HISTO_VOYAGE', 'HISTO_SIZING', 'HISTO_STYLE'],
    '8. OPPORTUNITÉS': ['OPPORTUNITÉS_MANQUÉES', 'ACTION_CRM']
};

const SUPER_CAT_COLORS = {
    '1. PROFILS': '#60a5fa',        // Blue
    '2. INTÉRÊTS & CERCLES': '#f472b6', // Pink
    '3. VOYAGE': '#2dd4bf',         // Teal
    '4. INTENTION D\'ACHAT': '#fb923c', // Orange
    '5. SÉCURITÉ & HOSPITALITY': '#ef4444', // Red
    '6. L\'UNIVERS LOUIS VUITTON': '#d4af37', // Gold
    '7. HISTORIQUE & POSSESSIONS': '#a855f7', // Purple
    '8. OPPORTUNITÉS': '#818cf8'    // Indigo
};

// ===== INIT =====
$('selectBtn').onclick = () => $('fileInput').click();
$('uploadArea').onclick = e => { if (e.target.id !== 'selectBtn') $('fileInput').click(); };

$('fileInput').onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    $('loading').classList.add('active');
    updateLoading('Lecture du fichier...', 0, 1);

    try {
        const t0 = performance.now();
        const text = await file.text();
        const rows = parseCSV(text);
        const total = rows.length;

        // Step 1: Clean with AI (parallel batches)
        updateLoading('Nettoyage IA parallèle...', 0, total);
        DATA = await processWithAI(rows);

        // Step 2: Extract tags
        updateLoading('Extraction des tags...', total, total);
        extractAllTags();

        // Step 3: Generate NBA actions (parallel batches)
        updateLoading('Génération NBA...', 0, total);
        await generateAllNBA();

        // Step 4: Sentiment Analysis
        updateLoading('Analyse sentiment...', total, total);
        analyzeSentiment();

        // Step 5: Compute Privacy Scores
        updateLoading('Calcul Privacy Scores...', total, total);
        computePrivacyScores();

        const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
        console.log(`Pipeline complete: ${total} clients in ${elapsed}s`);

        $('loading').classList.remove('active');
        showApp();

    } catch (err) {
        $('loading').classList.remove('active');
        alert('Erreur: ' + err.message);
        console.error(err);
    }
};

// ===== LOADING UI =====
function updateLoading(msg, current, total) {
    $('loadingMsg').textContent = msg;
    $('loadingProgress').textContent = `${current}/${total}`;
    const pct = total > 0 ? (current / total * 100) : 0;
    $('progressFill').style.width = pct + '%';
}

// ===== CSV PARSER =====
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = [];
        let curr = '', inQ = false;
        for (const ch of lines[i]) {
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) { vals.push(curr.trim()); curr = ''; }
            else curr += ch;
        }
        vals.push(curr.trim());
        if (vals.length >= headers.length) {
            const row = {};
            headers.forEach((h, j) => row[h] = vals[j] || '');
            rows.push(row);
        }
    }
    return rows;
}

// ===== MISTRAL API =====
async function callMistral(prompt, maxTokens = 600) {
    const resp = await fetch(MISTRAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_API_KEY}` },
        body: JSON.stringify({ model: 'mistral-small-latest', messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0 })
    });
    if (!resp.ok) throw new Error('Mistral API ' + resp.status);
    const data = await resp.json();
    return data.choices[0].message.content.trim();
}

// ===== CLEAN WITH MISTRAL =====
async function cleanOne(text) {
    try {
        const result = await callMistral(CLEANING_PROMPT + text, 600);
        const rgpdMatch = result.match(/RGPD_COUNT:\s*(\d+)/i);
        const textMatch = result.match(/TEXT:\s*([\s\S]*)/i);
        if (rgpdMatch && textMatch) {
            return { text: textMatch[1].trim(), rgpdCount: parseInt(rgpdMatch[1], 10) };
        }
        // Fallback
        return fallbackClean(result);
    } catch {
        return fallbackClean(text);
    }
}

function fallbackClean(text) {
    let clean = text, count = 0;
    Object.entries(RGPD_FALLBACK).forEach(([cat, patterns]) => {
        patterns.forEach(re => {
            const m = clean.match(re);
            if (m) { count += m.length; clean = clean.replace(re, `[${cat.toUpperCase()}-MASQUÉ]`); }
        });
    });
    return { text: clean, rgpdCount: count };
}

// ===== PROCESS ALL WITH AI =====
async function processWithAI(rows) {
    STATS = { clients: 0, tags: 0, ai: 0, rgpd: 0, nba: 0, privacyAvg: 0 };
    RGPD_BAD = [];
    const results = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        updateLoading('Nettoyage IA parallèle...', Math.min(i + BATCH_SIZE, rows.length), rows.length);

        const batchResults = await Promise.all(batch.map(async row => {
            const orig = row.Transcription || row.transcription || '';
            const id = row.ID || row.id || 'N/A';
            const date = row.Date || row.date || '';
            const lang = (row.Language || row.Langue || row.language || 'FR').toUpperCase();
            const ca = row.CA || row.Advisor || row.advisor || 'CA-' + Math.floor(Math.random() * 5 + 1);
            const store = row.Store || row.Boutique || row.store || '';

            const result = await cleanOne(orig);
            STATS.ai++;

            // Detect RGPD sensitive words in original
            let sensitiveCount = 0;
            const sensitiveFound = [];
            RGPD_SENSITIVE.forEach(p => {
                p.words.forEach(w => {
                    if (orig.toLowerCase().includes(w.toLowerCase())) {
                        sensitiveCount++;
                        sensitiveFound.push({ cat: p.cat, word: w });
                    }
                });
            });

            if (result.rgpdCount > 0) {
                STATS.rgpd += result.rgpdCount;
                const masks = result.text.match(/\[[A-Z]+-MASQU[ÉE]+\]/gi) || [];
                masks.forEach(m => RGPD_BAD.push({ id, cat: m.replace(/[\[\]]/g, ''), w: 'Masqué par IA' }));
            }

            const clean = result.text.replace(/\s+/g, ' ').trim();
            STATS.clients++;
            return { id, date, lang, ca, store, orig, clean, tags: [], nba: [], sensitiveCount, sensitiveFound, rgpdMasked: result.rgpdCount };
        }));

        results.push(...batchResults);
        if (i + BATCH_SIZE < rows.length) await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
    return results;
}

// ===== TAG EXTRACTION =====
function extractAllTags() {
    DATA.forEach(row => {
        const text = row.clean || row.orig || '';
        // Use external Tagger module
        const extracted = Tagger.extractTags(text);

        // Map to expected format {c: category, t: tag}
        row.tags = extracted.map(t => ({ c: t.category, t: t.tag }));
        STATS.tags += row.tags.length;
    });
}

// ===== NBA ENGINE =====
async function generateAllNBA() {
    NBA_DATA = [];
    for (let i = 0; i < DATA.length; i += BATCH_SIZE) {
        const batch = DATA.slice(i, i + BATCH_SIZE);
        updateLoading('Génération NBA...', Math.min(i + BATCH_SIZE, DATA.length), DATA.length);

        await Promise.all(batch.map(async row => {
            if (row.tags.length === 0) {
                row.nba = [{ action: 'Approfondir le profil lors de la prochaine visite', type: 'immediate', category: 'relationship' }];
                STATS.nba++;
                return;
            }
            try {
                const tagsStr = row.tags.map(t => t.t).join(', ');
                const prompt = NBA_PROMPT.replace('{tags}', tagsStr).replace('{text}', row.clean.substring(0, 300));
                const result = await callMistral(prompt, 400);

                // Extract JSON from response
                const jsonMatch = result.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    row.nba = JSON.parse(jsonMatch[0]);
                    STATS.nba += row.nba.length;
                } else {
                    row.nba = [{ action: 'Personnaliser le prochain contact basé sur: ' + tagsStr, type: 'immediate', category: 'relationship' }];
                    STATS.nba++;
                }
            } catch {
                row.nba = generateFallbackNBA(row);
                STATS.nba += row.nba.length;
            }
        }));

        if (i + BATCH_SIZE < DATA.length) await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
}

function generateFallbackNBA(row) {
    const actions = [];
    const tags = row.tags.map(t => t.t);
    const cats = row.tags.map(t => t.c);

    // Immediate action based on occasion
    if (cats.includes('occasion')) {
        const occasion = tags.find((_, i) => row.tags[i].c === 'occasion');
        actions.push({ action: `Préparer une sélection personnalisée pour l'occasion: ${occasion}`, type: 'immediate', category: 'product' });
    }

    // Product recommendation
    if (cats.includes('style') || cats.includes('pref')) {
        const style = tags.filter((_, i) => ['style', 'pref'].includes(row.tags[i].c)).join(', ');
        actions.push({ action: `Envoyer lookbook digital avec sélection ${style}`, type: 'short_term', category: 'product' });
    }

    // Relationship
    if (cats.includes('budget')) {
        actions.push({ action: 'Inviter à un événement exclusif en boutique', type: 'long_term', category: 'experience' });
    }

    if (actions.length === 0) {
        actions.push({ action: 'Planifier un appel de suivi pour approfondir les préférences', type: 'immediate', category: 'relationship' });
    }

    return actions.slice(0, 3);
}

// ===== PRIVACY SCORE =====
function computePrivacyScores() {
    const caMap = new Map();

    DATA.forEach(row => {
        if (!caMap.has(row.ca)) {
            caMap.set(row.ca, { ca: row.ca, total: 0, violations: 0, categories: {}, notes: [] });
        }
        const entry = caMap.get(row.ca);
        entry.total++;

        if (row.sensitiveCount > 0) {
            entry.violations += row.sensitiveCount;
            row.sensitiveFound.forEach(s => {
                entry.categories[s.cat] = (entry.categories[s.cat] || 0) + 1;
            });
            entry.notes.push(row.id);
        }
    });

    PRIVACY_SCORES = Array.from(caMap.values()).map(entry => {
        const score = Math.max(0, Math.round(100 - (entry.violations / entry.total) * 50 - entry.violations * 5));
        let level = 'excellent';
        if (score < 60) level = 'critical';
        else if (score < 75) level = 'warning';
        else if (score < 90) level = 'good';

        const coaching = [];
        if (entry.categories.orientation) coaching.push('Formation RGPD: données orientation sexuelle interdites');
        if (entry.categories.politics) coaching.push('Formation RGPD: opinions politiques non-collectables');
        if (entry.categories.religion) coaching.push('Formation RGPD: croyances religieuses à ne pas enregistrer');
        if (entry.categories.familyConflict) coaching.push('Sensibilisation: conflits familiaux = données ultra-sensibles');
        if (entry.categories.appearance) coaching.push('Rappel: jugements physiques = non conforme et irrespectueux');
        if (entry.categories.finance) coaching.push('Formation: données financières personnelles interdites');
        if (entry.categories.accessCodes) coaching.push('Alerte sécurité: ne jamais enregistrer de codes d\'accès');

        return { ...entry, score, level, coaching };
    }).sort((a, b) => a.score - b.score);

    // Compute avg
    if (PRIVACY_SCORES.length > 0) {
        STATS.privacyAvg = Math.round(PRIVACY_SCORES.reduce((s, p) => s + p.score, 0) / PRIVACY_SCORES.length);
    }
}

// ===== SHOW APP =====
function showApp() {
    $('uploadSection').classList.add('hidden');
    $('mainNav').classList.remove('hidden');
    $('mainFooter').classList.remove('hidden');

    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-page').forEach(p => p.classList.add('hidden'));
            tab.classList.add('active');
            $('tab-' + tab.dataset.tab).classList.remove('hidden');
        };
    });

    // Show dashboard
    $('tab-dashboard').classList.remove('hidden');
    renderDashboard();
    renderClients();
    renderNBA();
    renderPrivacy();
    renderCrossBrand();
    renderFollowup();
    renderProducts();
    renderSentiment();
    renderBoutique();
    renderPulse();

    // Follow-up controls
    $('followupHouse').onchange = () => renderFollowup();
    $('followupChannel').onchange = () => renderFollowup();
}

// ===== RENDER: DASHBOARD =====
function renderDashboard() {
    $('statClients').textContent = STATS.clients;
    $('statTags').textContent = STATS.tags;
    $('statAI').textContent = STATS.ai;
    $('statRGPD').textContent = STATS.rgpd;
    $('statNBA').textContent = STATS.nba;
    $('statPrivacy').textContent = STATS.privacyAvg + '%';

    if (DATA.length > 0) {
        $('beforeText').textContent = DATA[0].orig.substring(0, 400);
        $('afterText').textContent = DATA[0].clean.substring(0, 400);
    }

    const bl = $('rgpdBadList');
    if (RGPD_BAD.length === 0) { $('rgpdSection').style.display = 'none'; }
    else {
        bl.innerHTML = RGPD_BAD.map(i => `<div class="rgpd-bad-item"><span class="id">${i.id}</span><span class="cat">${i.cat}</span>${i.w}</div>`).join('');
    }

    $('exportCsv').onclick = exportCSV;
    $('exportJson').onclick = exportJSON;
    $('exportReport').onclick = exportReport;
}

// ===== RENDER: CLIENTS =====
function renderClients() {
    // Legend based on Super Categories
    $('tagLegend').innerHTML = Object.keys(SUPER_CATS).map(cat =>
        `<div class="legend-item"><span class="legend-dot" style="background:${SUPER_CAT_COLORS[cat]}"></span>${cat}</div>`
    ).join('');

    renderGrid();
    $('personSearch').oninput = e => renderGrid(e.target.value);
}

function renderGrid(filter = '') {
    const g = $('personGrid');
    g.innerHTML = '';
    const f = filter.toLowerCase();
    const filtered = DATA.filter(p => !f || p.id.toLowerCase().includes(f) || p.tags.some(t => t.t.toLowerCase().includes(f)) || p.clean.toLowerCase().includes(f));

    filtered.forEach(p => {
        // Group tags by Category
        const cats = {};
        p.tags.forEach(t => { if (!cats[t.c]) cats[t.c] = []; cats[t.c].push(t.t); });

        let html = `<div class="person-header"><span class="person-id">${p.id}</span><div class="person-meta"><span>${p.lang}</span><span>${p.date}</span><span>${p.tags.length} tags</span></div></div>`;

        if (p.tags.length === 0) {
            html += '<div class="no-tags">Aucun tag détecté</div>';
        } else {
            // Iterate over SUPER_CATS to maintain order and grouping
            for (const [superCat, subCats] of Object.entries(SUPER_CATS)) {
                // Check if this super category has any active sub-categories for this person
                const activeSubCats = subCats.filter(sc => cats[sc]);

                if (activeSubCats.length > 0) {
                    // Get color for this super category
                    const color = SUPER_CAT_COLORS[superCat] || '#888';
                    const bgStyle = `background: ${color}20; color: ${color};`;

                    html += `<div class="super-category">
                        <div class="super-category-title" style="color:${color}">${superCat}</div>
                        <div class="super-category-content">`;

                    activeSubCats.forEach(sc => {
                        html += `<div class="tag-group">
                            <span class="tag-group-label">${CAT_NAMES[sc] || sc}:</span>
                            ${cats[sc].map(t => `<span class="tag" style="${bgStyle}">${t}</span>`).join('')}
                        </div>`;
                    });

                    html += `</div></div>`;
                }
            }
        }

        // Mini NBA preview
        if (p.nba && p.nba.length > 0) {
            html += `<div class="super-category"><div class="super-category-title">🎯 Next Best Action</div><div class="super-category-content"><div class="tag-group">${p.nba.slice(0, 2).map(a => `<span class="tag nba">${a.action.substring(0, 50)}...</span>`).join('')}</div></div></div>`;
        }

        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = html;
        g.appendChild(card);
    });
}

// ===== RENDER: NBA =====
function renderNBA() {
    const grid = $('nbaGrid');
    grid.innerHTML = '';

    const typeLabels = { immediate: 'Immédiat', short_term: 'Court terme', long_term: 'Long terme' };
    const typeClasses = { immediate: 'immediate', short_term: 'shortterm', long_term: 'longterm' };

    DATA.forEach(p => {
        if (!p.nba || p.nba.length === 0) return;

        let html = `<div class="nba-card-header"><span class="nba-client-id">${p.id}</span><div class="person-meta"><span>${p.tags.length} tags</span><span>${p.lang}</span></div></div>`;

        html += `<div class="nba-context">${p.tags.map(t => t.t).join(' · ')}</div>`;


        html += '<div class="nba-actions">';
        p.nba.forEach((a, i) => {
            const cls = typeClasses[a.type] || 'shortterm';
            html += `<div class="nba-action"><div class="nba-action-num">${i + 1}</div><div><div class="nba-action-text">${a.action}</div><span class="nba-action-type ${cls}">${typeLabels[a.type] || a.type}</span></div></div>`;
        });
        html += '</div>';

        const card = document.createElement('div');
        card.className = 'nba-card';
        card.innerHTML = html;
        grid.appendChild(card);
    });
}

// ===== RENDER: PRIVACY SCORE =====
function renderPrivacy() {
    const overview = $('privacyOverview');
    const totalViolations = PRIVACY_SCORES.reduce((s, p) => s + p.violations, 0);
    const criticalCount = PRIVACY_SCORES.filter(p => p.level === 'critical').length;
    const avgLevel = STATS.privacyAvg >= 90 ? 'excellent' : STATS.privacyAvg >= 75 ? 'good' : STATS.privacyAvg >= 60 ? 'warning' : 'critical';

    overview.innerHTML = `
        <div class="privacy-score-card">
            <div class="privacy-score-circle ${avgLevel}">${STATS.privacyAvg}%</div>
            <div style="color:#888;font-size:.8rem">Score Global</div>
        </div>
        <div class="privacy-score-card">
            <div style="font-size:2.5rem;font-weight:700;color:${totalViolations > 0 ? '#ef4444' : '#10b981'};margin-bottom:8px">${totalViolations}</div>
            <div style="color:#888;font-size:.8rem">Violations détectées</div>
        </div>
        <div class="privacy-score-card">
            <div style="font-size:2.5rem;font-weight:700;color:${criticalCount > 0 ? '#ef4444' : '#10b981'};margin-bottom:8px">${criticalCount}</div>
            <div style="color:#888;font-size:.8rem">CA en alerte</div>
        </div>
    `;

    const grid = $('privacyGrid');
    grid.innerHTML = '';

    PRIVACY_SCORES.forEach(p => {
        const badgeClass = p.level === 'critical' ? 'alert' : p.level === 'warning' ? 'warn' : 'ok';
        const barColor = p.level === 'critical' ? '#ef4444' : p.level === 'warning' ? '#fb923c' : p.level === 'good' ? '#3b82f6' : '#10b981';

        let html = `
            <div class="privacy-card-header">
                <span class="privacy-ca-name">${p.ca}</span>
                <span class="privacy-badge ${badgeClass}">${p.score}% — ${p.level.toUpperCase()}</span>
            </div>
            <div class="privacy-bar"><div class="privacy-bar-fill" style="width:${p.score}%;background:${barColor}"></div></div>
            <div class="privacy-detail">${p.total} notes analysées · ${p.violations} violation${p.violations > 1 ? 's' : ''}</div>
        `;

        if (p.coaching.length > 0) {
            html += '<div class="coaching-alert">⚠️ Coaching requis:<br>' + p.coaching.map(c => '→ ' + c).join('<br>') + '</div>';
        }

        const card = document.createElement('div');
        card.className = 'privacy-card';
        card.innerHTML = html;
        grid.appendChild(card);
    });
}

// ===== RENDER: CROSS-BRAND =====
function renderCrossBrand() {
    const grid = $('crossbrandGrid');
    grid.innerHTML = '';

    // Generate anonymized universal style profiles
    DATA.forEach(p => {
        if (p.tags.length < 2) return;


        // Assign random houses for demo
        const numHouses = Math.min(Math.floor(Math.random() * 3) + 1, 3);
        const houses = [];
        const shuffled = [...LVMH_HOUSES].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numHouses; i++) houses.push(shuffled[i]);

        // Anonymized profile ID
        const anonId = 'USP-' + btoa(p.id).substring(0, 8).toUpperCase();

        // Extract style dimensions
        const styleTags = p.tags.filter(t => ['style', 'pref', 'lifestyle'].includes(t.c));
        const productTags = p.tags.filter(t => ['product', 'occasion'].includes(t.c));
        const segmentTags = p.tags.filter(t => ['budget', 'network'].includes(t.c));

        let html = `
            <div class="crossbrand-header">
                <span class="crossbrand-id">${anonId}</span>
                <div class="crossbrand-houses">${houses.map(h => `<span class="crossbrand-house">${h}</span>`).join('')}</div>
            </div>
        `;

        if (styleTags.length > 0) {
            html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Style DNA</div><div class="crossbrand-tags">${styleTags.map(t => `<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;
        }
        if (productTags.length > 0) {
            html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Univers Produit</div><div class="crossbrand-tags">${productTags.map(t => `<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;
        }
        if (segmentTags.length > 0) {
            html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Segment</div><div class="crossbrand-tags">${segmentTags.map(t => `<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;
        }

        const card = document.createElement('div');
        card.className = 'crossbrand-card';
        card.innerHTML = html;
        grid.appendChild(card);
    });
}

// ===== RENDER: LUXURY PULSE =====
function renderPulse() {
    // Aggregate tag frequencies
    const tagFreq = new Map();
    const catFreq = new Map();

    DATA.forEach(row => {
        row.tags.forEach(t => {
            tagFreq.set(t.t, (tagFreq.get(t.t) || 0) + 1);
            catFreq.set(t.c, (catFreq.get(t.c) || 0) + 1);
        });
    });

    const sorted = Array.from(tagFreq.entries()).sort((a, b) => b[1] - a[1]);
    const totalTags = sorted.reduce((s, [, c]) => s + c, 0);

    // Pulse Stats
    $('pulseStats').innerHTML = `
        <div class="pulse-stat"><div class="pulse-stat-value">${sorted.length}</div><div class="pulse-stat-label">Tags uniques</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${totalTags}</div><div class="pulse-stat-label">Mentions totales</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${DATA.length}</div><div class="pulse-stat-label">Notes analysées</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${Array.from(catFreq.keys()).length}</div><div class="pulse-stat-label">Catégories actives</div></div>
    `;

    // Trend Cards (top 12)
    const trends = $('pulseTrends');
    trends.innerHTML = '';

    sorted.slice(0, 12).forEach(([tag, count]) => {
        const pct = ((count / DATA.length) * 100).toFixed(0);
        // Simulate trend (random for demo, would be time-based in prod)
        const change = Math.floor(Math.random() * 30) - 10;
        const changeClass = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
        const changeLabel = change > 0 ? `+${change}%` : `${change}%`;

        // Generate mini bar chart (simulated weekly data)
        const bars = [];
        for (let i = 0; i < 8; i++) {
            const h = Math.max(4, Math.floor(Math.random() * 28) + 2);
            bars.push(`<div class="pulse-bar-segment" style="height:${h}px;flex:1"></div>`);
        }

        const card = document.createElement('div');
        card.className = 'pulse-trend-card';
        card.innerHTML = `
            <div class="pulse-trend-header">
                <span class="pulse-trend-name">${tag}</span>
                <span class="pulse-trend-change ${changeClass}">${changeLabel}</span>
            </div>
            <div class="pulse-trend-bar">${bars.join('')}</div>
            <div class="pulse-trend-meta"><span>${count} mentions</span><span>${pct}% des clients</span></div>
        `;
        trends.appendChild(card);
    });

    // Signals
    const signals = $('pulseSignals');
    signals.innerHTML = '<h3 style="margin-bottom:14px;font-size:1.1rem">🔔 Signaux Faibles Détectés</h3>';

    const signalData = generateSignals(tagFreq, catFreq);
    signalData.forEach(s => {
        const sig = document.createElement('div');
        sig.className = `pulse-signal ${s.level}`;
        sig.innerHTML = `
            <div class="pulse-signal-icon">${s.icon}</div>
            <div class="pulse-signal-content"><div class="pulse-signal-title">${s.title}</div><div class="pulse-signal-desc">${s.desc}</div></div>
            <span class="pulse-signal-badge ${s.level}">${s.level === 'hot' ? 'Signal fort' : s.level === 'warm' ? 'Signal moyen' : 'Signal faible'}</span>
        `;
        signals.appendChild(sig);
    });
}

function generateSignals(tagFreq, catFreq) {
    const signals = [];
    const total = DATA.length;

    // Check for sustainability trend
    const durability = tagFreq.get('Durabilité') || 0;
    if (durability > 0) {
        const pct = ((durability / total) * 100).toFixed(0);
        signals.push({ icon: '🌍', title: `Durabilité: ${pct}% des clients mentionnent des matériaux responsables`, desc: `${durability} mentions détectées. Tendance forte vers le luxe durable. Recommandation: amplifier la communication sur les collections éco-responsables.`, level: durability / total > 0.1 ? 'hot' : 'warm' });
    }

    // Check for lifestyle dominance
    const lifestyleCount = catFreq.get('lifestyle') || 0;
    if (lifestyleCount > total * 0.3) {
        signals.push({ icon: '🏃', title: `Lifestyle actif dominant: ${lifestyleCount} mentions sport/bien-être`, desc: 'Les clients partagent activement leur mode de vie sportif. Opportunité: collections capsule sport-chic et partenariats wellness.', level: 'hot' });
    }

    // Check occasion patterns
    const occasionCount = catFreq.get('occasion') || 0;
    if (occasionCount > 0) {
        signals.push({ icon: '🎁', title: `${occasionCount} occasions de gifting identifiées`, desc: 'Mariages, anniversaires et célébrations détectés. Activer les campagnes de gifting personnalisé et les services d\'emballage premium.', level: 'warm' });
    }

    // Budget analysis
    const vipCount = tagFreq.get('VIP') || 0;
    const highBudget = (tagFreq.get('15K+') || 0) + (tagFreq.get('10-15K') || 0);
    if (vipCount > 0 || highBudget > 0) {
        signals.push({ icon: '💎', title: `${vipCount + highBudget} clients high-value identifiés`, desc: `${vipCount} VIP + ${highBudget} budgets > 10K. Prioriser les invitations private viewing et les expériences sur-mesure.`, level: 'hot' });
    }

    // Minimalisme trend
    const mini = tagFreq.get('Minimaliste') || 0;
    if (mini > 0) {
        signals.push({ icon: '⚪', title: 'Tendance minimalisme en progression', desc: `${mini} clients orientés minimaliste. Le "quiet luxury" continue de dominer. Adapter le visual merchandising en boutique.`, level: 'warm' });
    }

    // Network/influence
    const netCount = catFreq.get('network') || 0;
    if (netCount > 0) {
        signals.push({ icon: '📱', title: `${netCount} connexions réseau/influence détectées`, desc: 'Potentiel d\'activation UGC et de programmes ambassadeurs. Cartographier les micro-influenceurs parmi la clientèle.', level: 'cool' });
    }

    if (signals.length === 0) {
        signals.push({ icon: '📊', title: 'Analyse en cours...', desc: 'Importez plus de données pour détecter des signaux significatifs. Minimum recommandé: 50 notes vocales.', level: 'cool' });
    }

    return signals;
}

// ===== SENTIMENT ANALYSIS =====
function analyzeSentiment() {
    SENTIMENT_DATA = [];
    DATA.forEach(row => {
        const text = row.clean.toLowerCase();
        let posScore = 0, negScore = 0;
        const posFound = [], negFound = [];

        SENTIMENT_KEYWORDS.positive.forEach(kw => {
            if (text.includes(kw)) { posScore++; posFound.push(kw); }
        });
        SENTIMENT_KEYWORDS.negative.forEach(kw => {
            if (text.includes(kw)) { negScore += 1.5; negFound.push(kw); }
        });

        const total = posScore + negScore || 1;
        const sentiment = Math.round(((posScore / total) * 100));
        const level = sentiment >= 70 ? 'positive' : sentiment >= 40 ? 'neutral' : 'negative';

        row.sentiment = { score: sentiment, level, posFound, negFound };

        if (level === 'negative') STATS.atRisk++;

        SENTIMENT_DATA.push({ id: row.id, ca: row.ca, score: sentiment, level, posFound, negFound, excerpt: row.clean.substring(0, 150) });
    });
}

// ===== RENDER: FOLLOW-UP =====
function renderFollowup() {
    const grid = $('followupGrid');
    const house = $('followupHouse').value;
    const channel = $('followupChannel').value;
    grid.innerHTML = '';

    DATA.forEach(p => {
        if (p.tags.length === 0) return;

        const msg = generateFollowupLocal(p, house, channel);

        const card = document.createElement('div');
        card.className = 'followup-card';
        card.innerHTML = `
            <div class="followup-card-header">
                <span class="followup-client-id">${p.id}</span>
                <span class="followup-channel ${channel}">${channel === 'email' ? '📧 Email' : '💬 WhatsApp'}</span>
            </div>
            <div class="followup-subject">${msg.subject}</div>
            <div class="followup-body">${msg.body}</div>
            <div class="followup-actions">
                <button class="followup-btn copy" onclick="copyFollowup(this)">📋 Copier</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function generateFollowupLocal(client, house, channel) {
    const tags = client.tags.map(t => t.t);
    const name = client.id;
    const occasions = tags.filter(t => ['Anniversaire', 'Union', 'Naissance', 'Événement_Vie', 'Promotion', 'Réussite_Business', 'Retraite', 'Mariage', 'Cadeau', 'Nouveau départ'].includes(t));
    const styles = tags.filter(t => ['Intemporel', 'Contemporain', 'Tendance', 'Quiet_Luxury', 'Signature_Logo', 'Classique', 'Moderne', 'Élégant', 'Discret', 'Minimaliste'].includes(t));
    const interests = tags.filter(t => ['Golf', 'Tennis', 'Nautisme_Yachting', 'Sports_Endurance', 'Wellness_Yoga', 'Art_Contemporain', 'Gastronomie_Fine_Dining'].includes(t));
    const products = tags.filter(t => ['Montres', 'Bijoux', 'Parfums', 'Sac Pro', 'Sac Voyage', 'Chaussures', 'Foulards', 'Lunettes'].includes(t));
    const prefs = tags.filter(t => ['Noir', 'Navy', 'Beige', 'Cognac', 'Or', 'Rose Gold', 'Durabilité', 'Artisanat'].includes(t));

    let subject, body;

    if (channel === 'email') {
        subject = occasions.length > 0
            ? `${house} — Une attention particulière pour votre ${occasions[0].toLowerCase().replace(/_/g, ' ')}`
            : `${house} — Suite à notre échange, ${name}`;

        body = `Cher(e) ${name},\n\n`;
        body += `Ce fut un réel plaisir de vous accueillir chez ${house}.\n\n`;

        if (styles.length > 0) {
            body += `Votre sensibilité pour un style ${styles.join(' et ').toLowerCase().replace(/_/g, ' ')} m'a particulièrement inspiré(e). `;
        }
        if (interests.length > 0) {
            body += `Suite à votre intérêt pour ${interests.join(', ').toLowerCase().replace(/_/g, ' ')}, `;
            body += `je me permets de vous informer que de nouvelles pièces viennent d'arriver en boutique.\n\n`;
        }
        if (products.length > 0) {
            body += `Suite à votre intérêt pour nos ${products.join(', ').toLowerCase()}, `;
            body += `de nouvelles pièces sont arrivées.\n\n`;
        }
        if (occasions.length > 0) {
            body += `Pour votre ${occasions[0].toLowerCase().replace(/_/g, ' ')}, j'ai pré-sélectionné quelques pièces qui, je pense, vous enchanteront. `;
            body += `Je serais ravi(e) de vous les présenter lors d'un rendez-vous privé.\n\n`;
        }
        if (prefs.length > 0) {
            body += `Connaissant votre attrait pour les tons ${prefs.join(', ').toLowerCase()}, `;
            body += `je pense que notre dernière collection saura vous séduire.\n\n`;
        }
        body += `N'hésitez pas à me contacter pour un rendez-vous à votre convenance.\n\n`;
        body += `Avec toute mon attention,\nVotre Client Advisor\n${house}`;
    } else {
        subject = `WhatsApp — ${name}`;
        body = `Bonjour ${name} 🙂\n\n`;
        body += `Merci pour votre visite chez ${house} ! `;

        if (interests.length > 0) {
            body += `\n\nCentres d'intérêt :\n`;
            interests.forEach(pr => body += `→ ${pr.replace(/_/g, ' ')}\n`);
        }
        if (products.length > 0) {
            body += `\n\nComme évoqué, voici les références qui ont retenu votre attention :\n`;
            products.forEach(p => { body += `→ ${p}\n`; });
        }
        if (occasions.length > 0) {
            body += `\nPour votre ${occasions[0].toLowerCase().replace(/_/g, ' ')}, je vous prépare une sélection sur-mesure ✨\n`;
        }
        if (styles.length > 0) {
            body += `\nJ'ai repéré des nouveautés ${styles[0].toLowerCase().replace(/_/g, ' ')} qui vous correspondraient parfaitement.\n`;
        }
        body += `\nJe reste disponible pour organiser un moment privilégié en boutique.\n`;
        body += `Belle journée ! 🤍\n— Votre CA ${house}`;
    }

    return { subject, body };
}

window.copyFollowup = function (btn) {
    const body = btn.closest('.followup-card').querySelector('.followup-body').textContent;
    navigator.clipboard.writeText(body).then(() => {
        btn.textContent = '✅ Copié !';
        setTimeout(() => { btn.textContent = '📋 Copier'; }, 1500);
    });
};

// ===== INTELLIGENT PRODUCT MATCHING =====
function matchProductsToClient(clientTags, clientText) {
    if (!PRODUCTS_LOADED || LV_PRODUCTS.length === 0) return [];
    
    const matches = [];
    const clientTextLower = (clientText || '').toLowerCase();
    
    // Extract relevant info from tags
    const profil = clientTags.filter(t => t.c === 'profil').map(t => t.t);
    const interet = clientTags.filter(t => t.c === 'interet').map(t => t.t);
    const contexte = clientTags.filter(t => t.c === 'contexte').map(t => t.t);
    const voyage = clientTags.filter(t => t.c === 'voyage').map(t => t.t);
    const service = clientTags.filter(t => t.c === 'service').map(t => t.t);
    const marque = clientTags.filter(t => t.c === 'marque').map(t => t.t);
    
    // Expanded matching rules - semantic understanding
    const matchingRules = {
        // Interest-based matching (sports & activities)
        'Golf': ['golf', 'golfeur', 'green', 'parcours', 'club', 'sport'],
        'Tennis': ['tennis', 'raquette', 'court', 'sport'],
        'Sports_Raquette': ['tennis', 'raquette', 'squash', 'padel', 'sport'],
        'Nautisme_Yachting': ['yacht', 'bateau', 'nautique', 'mer', 'sailing', 'voyage', 'weekend'],
        'Sports_Endurance': ['running', 'marathon', 'sport', 'course', 'jogging', 'fitness', 'training'],
        'Wellness_Yoga': ['yoga', 'wellness', 'bien-être', 'zen', 'meditation', 'sport', 'relaxation'],
        'Automobile_Collection': ['voiture', 'automobile', 'car', 'driving', 'voyage', 'weekend'],
        'Motorsport_Experience': ['course', 'circuit', 'formula', 'racing', 'sport', 'weekend'],
        
        // Arts & Culture
        'Art_Contemporain': ['art', 'galerie', 'exposition', 'museum', 'culture', 'élégant', 'raffiné'],
        'Art_Classique': ['art', 'classique', 'peinture', 'sculpture', 'culture', 'élégant'],
        'Opéra_Musique_Symphonique': ['opéra', 'musique', 'concert', 'symphonie', 'culture', 'soirée', 'élégant'],
        'Jazz_Contemporary': ['jazz', 'musique', 'concert', 'culture', 'soirée'],
        
        // Lifestyle & Collections
        'Horlogerie_Vintage': ['montre', 'horlogerie', 'watch', 'time', 'vintage', 'collection', 'accessoire'],
        'Haute_Horlogerie': ['montre', 'horlogerie', 'watch', 'complications', 'luxe', 'accessoire'],
        'Livres_Rares': ['livre', 'lecture', 'collection', 'culture', 'bibliothèque'],
        'Vins_Spiritueux_Prestige': ['vin', 'spiritueux', 'collection', 'cave', 'dégustation'],
        'Gastronomie_Fine_Dining': ['gastronomie', 'restaurant', 'cuisine', 'dining', 'chef', 'dégustation'],
        
        // Occasion-based matching
        'Anniversaire': ['anniversaire', 'birthday', 'celebration', 'cadeau', 'fête', 'personnel'],
        'Union': ['mariage', 'wedding', 'union', 'noces', 'cérémonie', 'élégant'],
        'Naissance': ['naissance', 'bébé', 'baby', 'birth', 'cadeau', 'famille'],
        'Cadeau_Proche': ['cadeau', 'gift', 'offrir', 'proche', 'ami', 'personnel'],
        'Cadeau_Famille': ['cadeau', 'famille', 'family', 'gift', 'enfant', 'parent'],
        'Cadeau_Professionnel': ['cadeau', 'professionnel', 'business', 'corporate', 'client', 'partenaire'],
        'Promotion': ['promotion', 'succès', 'réussite', 'professionnel', 'carrière'],
        'Réussite_Business': ['business', 'succès', 'deal', 'transaction', 'professionnel'],
        
        // Style preferences
        'Intemporel': ['classique', 'intemporel', 'timeless', 'classic', 'élégant', 'sobre', 'raffiné'],
        'Contemporain': ['moderne', 'contemporain', 'modern', 'contemporary', 'actuel', 'tendance'],
        'Tendance': ['tendance', 'trendy', 'fashion', 'mode', 'nouveau', 'actuel'],
        'Quiet_Luxury': ['discret', 'quiet', 'subtle', 'understated', 'sobre', 'élégant', 'raffiné'],
        'Signature_Logo': ['logo', 'monogram', 'signature', 'branded', 'iconique'],
        'Design_Minimaliste': ['minimaliste', 'minimal', 'épuré', 'simple', 'sobre', 'discret'],
        
        // Travel & Professional
        'Business_Travel': ['voyage', 'travel', 'business', 'déplacement', 'bagage', 'valise', 'cabine', 'professionnel', 'week-end'],
        'Loisir_Premium': ['voyage', 'vacances', 'holiday', 'leisure', 'weekend', 'détente', 'bagage'],
        'Expédition_Nature': ['voyage', 'aventure', 'nature', 'outdoor', 'exploration', 'weekend'],
        'Itinérance_Culturelle': ['voyage', 'culture', 'découverte', 'city', 'urbain', 'bagage'],
        
        // Professional profiles
        'Executive_Leadership': ['professionnel', 'business', 'élégant', 'sobre', 'raffiné', 'luxe'],
        'Entrepreneur': ['professionnel', 'business', 'moderne', 'dynamique', 'pratique'],
        'Expertise_Médicale': ['professionnel', 'élégant', 'sobre', 'pratique'],
        'Marchés_Financiers': ['professionnel', 'business', 'élégant', 'luxe', 'sobre'],
        
        // LV Product lines
        'Lignes_Iconiques': ['speedy', 'neverfull', 'alma', 'keepall', 'noé', 'iconique', 'classique'],
        'Art_de_Vivre_Malles': ['malle', 'trunk', 'boîte', 'coffret', 'voyage'],
        'Cuirs_Exotiques': ['crocodile', 'python', 'alligator', 'exotique', 'luxe', 'rare'],
        'Client_Historique': ['iconique', 'classique', 'heritage', 'tradition'],
        'Lignes_Animation': ['nouveau', 'collection', 'édition', 'limité', 'tendance'],
    };
    
    // Score each product
    LV_PRODUCTS.forEach(product => {
        let score = 0;
        let matchReasons = [];
        
        // Build comprehensive product text from ALL available fields
        const productName = (product.name || '').toLowerCase();
        const productDesc = (product.description || '').toLowerCase();
        const productCategory = (product.category || '').toLowerCase();
        const productSubcategory = (product.subcategory || '').toLowerCase();
        const productMaterials = Array.isArray(product.materials) ? product.materials.join(' ').toLowerCase() : '';
        const productColors = Array.isArray(product.colors) ? product.colors.join(' ').toLowerCase() : '';
        const productSKU = (product.sku || '').toLowerCase();
        
        // Complete product text for matching
        const productText = `${productName} ${productDesc} ${productCategory} ${productSubcategory} ${productMaterials} ${productColors}`;
        
        // 1. SEMANTIC MATCHING - Use ALL product information
        clientTags.forEach(tag => {
            const tagLabel = tag.t;
            const keywords = matchingRules[tagLabel] || [];
            
            // Match keywords in product text
            keywords.forEach(keyword => {
                if (productText.includes(keyword)) {
                    score += 12;
                    if (!matchReasons.includes(tagLabel)) {
                        matchReasons.push(tagLabel);
                    }
                }
            });
            
            // Direct tag matching in product text
            const tagWords = tagLabel.toLowerCase().replace(/_/g, ' ').split(' ');
            tagWords.forEach(word => {
                if (word.length > 3 && productText.includes(word)) {
                    score += 8;
                    if (!matchReasons.includes(tagLabel)) {
                        matchReasons.push(tagLabel);
                    }
                }
            });
        });
        
        // 2. CONTEXT-BASED SCORING
        
        // Travel context - prioritize bags, luggage
        if (voyage.length > 0 || interet.some(i => i.includes('Travel'))) {
            if (productCategory.includes('bagage') || productName.includes('valise') || 
                productName.includes('keepall') || productName.includes('horizon') ||
                productName.includes('cabas') || productName.includes('sac')) {
                score += 20;
                matchReasons.push('Voyage');
            }
        }
        
        // Sports/Active lifestyle - practical bags
        if (interet.some(i => i.includes('Sport') || i.includes('Golf') || i.includes('Tennis'))) {
            if (productName.includes('sac') || productName.includes('cabas') || 
                productName.includes('backpack') || productName.includes('messenger')) {
                score += 15;
                matchReasons.push('Sport/Actif');
            }
        }
        
        // Professional context - elegant, practical items
        if (profil.some(p => p.includes('Executive') || p.includes('Entrepreneur') || p.includes('Leadership'))) {
            if (productName.includes('attaché') || productName.includes('porte-documents') ||
                productName.includes('organiseur') || productName.includes('portefeuille') ||
                (productDesc.includes('professionnel') || productDesc.includes('business'))) {
                score += 18;
                matchReasons.push('Professionnel');
            }
        }
        
        // Gift context - appropriate price range and style
        if (contexte.some(c => c.includes('Cadeau') || c.includes('Anniversaire'))) {
            if (productCategory.includes('accessoires') || productCategory.includes('petite maroquinerie') ||
                productName.includes('portefeuille') || productName.includes('pochette') ||
                productName.includes('foulard') || productName.includes('ceinture')) {
                score += 15;
                matchReasons.push('Cadeau');
            }
        }
        
        // Style matching - use materials and design
        if (contexte.includes('Intemporel') || contexte.includes('Quiet_Luxury')) {
            if (productDesc.includes('classique') || productDesc.includes('intemporel') ||
                productMaterials.includes('cuir') || productName.includes('monogram')) {
                score += 12;
                matchReasons.push('Style Classique');
            }
        }
        
        if (contexte.includes('Contemporain') || contexte.includes('Tendance')) {
            if (productDesc.includes('moderne') || productDesc.includes('nouveau') ||
                productDesc.includes('collection')) {
                score += 12;
                matchReasons.push('Style Moderne');
            }
        }
        
        // 3. CLIENT TEXT SEMANTIC MATCHING
        const clientWords = clientTextLower.split(/\s+/).filter(w => w.length > 4);
        clientWords.forEach(word => {
            // Strong match in product name
            if (productName.includes(word)) {
                score += 8;
            }
            // Match in description
            else if (productDesc.includes(word)) {
                score += 5;
            }
            // Match in materials or colors
            else if (productMaterials.includes(word) || productColors.includes(word)) {
                score += 4;
            }
        });
        
        // 4. GENDER PREFERENCE (lower weight - not the main criteria)
        if (profil.includes('Femme') && productCategory.includes('femme')) {
            score += 10;
            matchReasons.push('Femme');
        }
        if (profil.includes('Homme') && productCategory.includes('homme')) {
            score += 10;
            matchReasons.push('Homme');
        }
        
        // 5. BONUS FOR ICONIC PRODUCTS
        if (marque.includes('Lignes_Iconiques') || marque.includes('Client_Historique')) {
            if (productName.includes('speedy') || productName.includes('neverfull') ||
                productName.includes('alma') || productName.includes('keepall')) {
                score += 10;
                matchReasons.push('Iconique');
            }
        }
        
        // Only include products with meaningful matches (lower threshold for better coverage)
        if (score >= 15 && matchReasons.length > 0) {
            matches.push({
                product,
                score,
                matchReasons: [...new Set(matchReasons)].slice(0, 3)
            });
        }
    });
    
    // Sort by score and return top matches
    return matches.sort((a, b) => b.score - a.score);
}

// ===== RENDER: PRODUCT MATCHER =====
async function renderProducts() {
    const grid = $('productGrid');
    if (!grid) return;
    
    // Ensure products are loaded
    if (!PRODUCTS_LOADED) {
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:#999"><div class="spinner" style="margin:0 auto 16px"></div><p>Chargement de la base de données produits Louis Vuitton...</p></div>';
        await loadLVProducts();
    }
    
    grid.innerHTML = '';

    const withTags = DATA.filter(p => p.tags.length > 0);
    if (withTags.length === 0) {
        grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucun client avec tags pour le matching produit.</p>';
        return;
    }
    
    if (LV_PRODUCTS.length === 0) {
        grid.innerHTML = '<p style="color:#ef4444;font-size:.85rem;padding:20px">⚠️ Erreur de chargement de la base de données produits. Vérifiez que le fichier JSON est accessible.</p>';
        return;
    }

    let totalMatches = 0;

    withTags.forEach(p => {
        const matches = matchProductsToClient(p.tags, p.clean);
        
        // Only show clients with actual matches
        if (matches.length === 0) return;
        
        totalMatches += matches.length;
        const top3 = matches.slice(0, 3);

        const card = document.createElement('div');
        card.className = 'product-match-card';
        card.innerHTML = `
            <div class="product-match-header">
                <span class="product-match-client">${p.id}</span>
                <span style="color:#666;font-size:.75rem">${matches.length} produit${matches.length > 1 ? 's' : ''} trouvé${matches.length > 1 ? 's' : ''}</span>
            </div>
            <div class="product-match-tags">${p.tags.slice(0, 6).map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>

            <div class="product-items">
                ${top3.map(match => {
                    const prod = match.product;
                    
                    // Find the best product image (not generic banners)
                    let imageUrl = '';
                    if (prod.image_urls && prod.image_urls.length > 0) {
                        // Try to find image with SKU in URL (most specific)
                        const skuImage = prod.image_urls.find(url => 
                            prod.sku && url.toLowerCase().includes(prod.sku.toLowerCase())
                        );
                        
                        if (skuImage) {
                            imageUrl = skuImage;
                        } else {
                            // Filter out generic banners and take first specific image
                            const specificImages = prod.image_urls.filter(url => {
                                const urlLower = url.toLowerCase();
                                // Exclude generic marketing images
                                return !urlLower.includes('_mm_') && 
                                       !urlLower.includes('_lg_') &&
                                       !urlLower.includes('gifts') &&
                                       !urlLower.includes('perso') &&
                                       !urlLower.includes('new_for') &&
                                       !urlLower.includes('show') &&
                                       !urlLower.includes('pushat') &&
                                       !urlLower.includes('bc_') &&
                                       (urlLower.includes('/pp_vp_l/') || urlLower.includes('/lv/'));
                            });
                            
                            imageUrl = specificImages.length > 0 ? specificImages[0] : prod.image_urls[0];
                        }
                    }
                    
                    const price = prod.price || 'Prix sur demande';
                    const matchTags = match.matchReasons.join(', ');
                    
                    return `
                        <div class="product-item">
                            <div class="product-item-img" style="background-image:url('${imageUrl}');background-size:cover;background-position:center;width:100px;height:100px;border-radius:8px;flex-shrink:0;${imageUrl ? '' : 'background-color:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:2rem'}">
                                ${imageUrl ? '' : '🛍️'}
                            </div>
                            <div class="product-item-info">
                                <div class="product-item-name">${prod.name}</div>
                                <div class="product-item-desc">${prod.description || prod.category}</div>
                                <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap">
                                    <span class="product-item-price">${price}</span>
                                    <span class="product-item-match" title="Match: ${matchTags}">Match: ${matchTags}</span>
                                </div>
                                ${prod.url ? `<a href="${prod.url}" target="_blank" style="font-size:.7rem;color:#d4af37;margin-top:4px;display:inline-block">Voir sur LV →</a>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        grid.appendChild(card);
    });
    
    // Show message if no matches found for any client
    if (totalMatches === 0) {
        grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px;text-align:center">Aucun produit Louis Vuitton ne correspond aux profils clients actuels. Le matching est basé sur les tags et descriptions des clients.</p>';
    }
}

// ===== RENDER: SENTIMENT =====
function renderSentiment() {
    const overview = $('sentimentOverview');
    const posCount = SENTIMENT_DATA.filter(s => s.level === 'positive').length;
    const neuCount = SENTIMENT_DATA.filter(s => s.level === 'neutral').length;
    const negCount = SENTIMENT_DATA.filter(s => s.level === 'negative').length;
    const avgScore = SENTIMENT_DATA.length > 0 ? Math.round(SENTIMENT_DATA.reduce((s, d) => s + d.score, 0) / SENTIMENT_DATA.length) : 0;

    overview.innerHTML = `
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#10b981">${posCount}</div><div class="sentiment-stat-label">Positifs</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#888">${neuCount}</div><div class="sentiment-stat-label">Neutres</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#ef4444">${negCount}</div><div class="sentiment-stat-label">Négatifs / À risque</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#d4af37">${avgScore}%</div><div class="sentiment-stat-label">Score moyen</div></div>
    `;

    // Alerts (negative sentiments)
    const alerts = $('sentimentAlerts');
    alerts.innerHTML = '';
    const negatives = SENTIMENT_DATA.filter(s => s.level === 'negative');
    if (negatives.length > 0) {
        alerts.innerHTML = '<h3 style="margin-bottom:12px;font-size:1rem;color:#ef4444">🚨 Alertes Store Manager — Clients à risque</h3>';
        negatives.forEach(s => {
            const alert = document.createElement('div');
            alert.className = 'sentiment-alert';
            alert.innerHTML = `
                <div class="sentiment-alert-icon">⚠️</div>
                <div class="sentiment-alert-content">
                    <div class="sentiment-alert-title">${s.id} — Score ${s.score}% (CA: ${s.ca})</div>
                    <div class="sentiment-alert-desc">Mots détectés: ${s.negFound.join(', ')}. Action immédiate recommandée: appel du Store Manager.</div>
                </div>
                <span class="sentiment-alert-badge">À risque</span>
            `;
            alerts.appendChild(alert);
        });
    }

    // All cards
    const grid = $('sentimentGrid');
    grid.innerHTML = '';
    SENTIMENT_DATA.sort((a, b) => a.score - b.score).forEach(s => {
        const color = s.level === 'positive' ? '#10b981' : s.level === 'negative' ? '#ef4444' : '#888';
        const card = document.createElement('div');
        card.className = 'sentiment-card';
        card.innerHTML = `
            <div class="sentiment-card-header">
                <span class="sentiment-client">${s.id}</span>
                <div class="sentiment-gauge">
                    <div class="sentiment-gauge-bar"><div class="sentiment-gauge-fill" style="width:${s.score}%;background:${color}"></div></div>
                    <span class="sentiment-gauge-label" style="color:${color}">${s.score}%</span>
                </div>
            </div>
            <div class="sentiment-keywords">
                ${s.posFound.map(k => `<span class="sentiment-kw positive">${k}</span>`).join('')}
                ${s.negFound.map(k => `<span class="sentiment-kw negative">${k}</span>`).join('')}
                ${s.posFound.length === 0 && s.negFound.length === 0 ? '<span class="sentiment-kw neutral">neutre</span>' : ''}
            </div>
            <div class="sentiment-excerpt">"${s.excerpt}..."</div>
        `;
        grid.appendChild(card);
    });
}

// ===== RENDER: BOUTIQUE MANAGER =====
function renderBoutique() {
    // KPIs
    const kpis = $('boutiqueKPIs');
    const avgSentiment = SENTIMENT_DATA.length > 0 ? Math.round(SENTIMENT_DATA.reduce((s, d) => s + d.score, 0) / SENTIMENT_DATA.length) : 0;
    const atRiskPct = STATS.clients > 0 ? Math.round((STATS.atRisk / STATS.clients) * 100) : 0;

    kpis.innerHTML = `
        <div class="boutique-kpi"><div class="boutique-kpi-value">${STATS.clients}</div><div class="boutique-kpi-label">Notes traitées</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:#10b981">${STATS.tags}</div><div class="boutique-kpi-label">Tags extraits</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:#d4af37">${STATS.nba}</div><div class="boutique-kpi-label">Actions NBA</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:${avgSentiment >= 60 ? '#10b981' : '#ef4444'}">${avgSentiment}%</div><div class="boutique-kpi-label">Satisfaction</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:${atRiskPct > 10 ? '#ef4444' : '#10b981'}">${atRiskPct}%</div><div class="boutique-kpi-label">À risque</div></div>
    `;

    // Top 5 interests
    const tagFreq = new Map();
    DATA.forEach(r => r.tags.forEach(t => tagFreq.set(t.t, (tagFreq.get(t.t) || 0) + 1)));
    const top5 = Array.from(tagFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCount = top5.length > 0 ? top5[0][1] : 1;

    const topList = $('boutiqueTopList');
    topList.innerHTML = top5.map(([tag, count], i) => `
        <div class="top5-item">
            <div class="top5-rank r${i + 1}">${i + 1}</div>
            <div class="top5-info">
                <div class="top5-name">${tag}</div>
                <div class="top5-bar"><div class="top5-bar-fill" style="width:${(count / maxCount * 100).toFixed(0)}%"></div></div>
            </div>
            <div class="top5-count">${count}</div>
        </div>
    `).join('');

    // Manager actions
    const actionsList = $('boutiqueActionsList');
    const actions = [];

    // Generate smart actions based on data
    if (top5.length > 0) {
        actions.push({ icon: '📦', text: `Réapprovisionner les catégories "${top5[0][0]}" et "${top5[1] ? top5[1][0] : ''}" — demande forte cette semaine`, priority: 'high' });
    }

    const negClients = SENTIMENT_DATA.filter(s => s.level === 'negative');
    if (negClients.length > 0) {
        actions.push({ icon: '📞', text: `Contacter ${negClients.length} client${negClients.length > 1 ? 's' : ''} insatisfait${negClients.length > 1 ? 's' : ''} — risque de perte`, priority: 'high' });
    }

    const occasionTags = DATA.filter(r => r.tags.some(t => t.c === 'occasion'));
    if (occasionTags.length > 0) {
        actions.push({ icon: '🎁', text: `${occasionTags.length} opportunités de gifting identifiées — activer campagne cadeau personnalisé`, priority: 'medium' });
    }

    const vipCount = DATA.filter(r => r.tags.some(t => t.t === 'VIP')).length;
    if (vipCount > 0) {
        actions.push({ icon: '⭐', text: `${vipCount} VIP détectés — planifier private viewing et expériences sur-mesure`, priority: 'medium' });
    }

    actions.push({ icon: '📊', text: 'Diffuser le rapport hebdomadaire aux équipes — briefing lundi matin', priority: 'low' });

    actionsList.innerHTML = actions.map(a => `
        <div class="action-item">
            <div class="action-icon">${a.icon}</div>
            <div>
                <div class="action-text">${a.text}</div>
                <span class="action-priority ${a.priority}">${a.priority === 'high' ? 'Urgent' : a.priority === 'medium' ? 'Cette semaine' : 'Planifié'}</span>
            </div>
        </div>
    `).join('');

    // CA Performance
    const caPerf = $('boutiqueCAPerfList');
    const caMap = new Map();
    DATA.forEach(r => {
        if (!caMap.has(r.ca)) caMap.set(r.ca, { notes: 0, tags: 0, sentiment: 0 });
        const entry = caMap.get(r.ca);
        entry.notes++;
        entry.tags += r.tags.length;
        entry.sentiment += r.sentiment ? r.sentiment.score : 50;
    });

    caPerf.innerHTML = Array.from(caMap.entries()).map(([ca, data]) => {
        const avgSent = Math.round(data.sentiment / data.notes);
        const color = avgSent >= 70 ? '#10b981' : avgSent >= 40 ? '#fb923c' : '#ef4444';
        return `
            <div class="ca-perf-item">
                <span class="ca-perf-name">${ca}</span>
                <div class="ca-perf-bar"><div class="ca-perf-bar-fill" style="width:${avgSent}%;background:${color}"></div></div>
                <div class="ca-perf-stats"><span>${data.notes} notes</span><span>${data.tags} tags</span><span style="color:${color}">${avgSent}%</span></div>
            </div>
        `;
    }).join('');

    // Stock recommendations
    const stockList = $('boutiqueStockList');
    const stockRecs = [];

    top5.forEach(([tag, count]) => {
        const catalog = PRODUCT_CATALOG[tag];
        if (catalog) {
            stockRecs.push({ icon: '📦', text: `${tag}: ${count} demandes — vérifier stocks ${catalog[0].name}`, urgency: count > 3 ? 'high' : 'medium' });
        }
    });

    if (stockRecs.length === 0) {
        stockRecs.push({ icon: '✅', text: 'Pas de recommandation urgente — stocks cohérents avec la demande', urgency: 'medium' });
    }

    stockList.innerHTML = stockRecs.map(s => `
        <div class="stock-item">
            <div class="stock-icon">${s.icon}</div>
            <div class="stock-text">${s.text}</div>
            <span class="stock-urgency ${s.urgency}">${s.urgency === 'high' ? 'Urgent' : 'À suivre'}</span>
        </div>
    `).join('');
}

// ===== EXPORTS =====
function exportCSV() {
    const lines = ['ID,Date,Langue,CA,Transcription_AI_Clean,Tags,NBA_Actions'];
    DATA.forEach(r => {
        lines.push([
            r.id, r.date, r.lang, r.ca,
            '"' + r.clean.replace(/"/g, '""') + '"',
            '"' + r.tags.map(t => t.t).join('|') + '"',
            '"' + (r.nba || []).map(a => a.action).join(' | ') + '"'
        ].join(','));
    });
    dl(lines.join('\n'), 'lvmh_ai_platform.csv', 'text/csv');
}

function exportJSON() {
    const payload = DATA.map(r => ({
        id: r.id, date: r.date, lang: r.lang, ca: r.ca,
        clean: r.clean,
        tags: r.tags,
        nba: r.nba,
        privacyFlags: r.sensitiveFound
    }));
    dl(JSON.stringify(payload, null, 2), 'lvmh_ai_tags_nba.json', 'application/json');
}

function exportReport() {
    const report = {
        date: new Date().toISOString(),
        summary: { clients: STATS.clients, tags: STATS.tags, rgpdMasked: STATS.rgpd, nbaActions: STATS.nba, privacyAvg: STATS.privacyAvg },
        privacyScores: PRIVACY_SCORES.map(p => ({ ca: p.ca, score: p.score, level: p.level, violations: p.violations, coaching: p.coaching })),
        rgpdViolations: RGPD_BAD,
        tagDistribution: (() => { const m = {}; DATA.forEach(r => r.tags.forEach(t => { m[t.t] = (m[t.t] || 0) + 1; })); return m; })()
    };
    dl(JSON.stringify(report, null, 2), 'lvmh_full_report.json', 'application/json');
}

function dl(content, name, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
}
