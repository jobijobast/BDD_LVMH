/**
 * LVMH Voice-to-Tag — Rendering Engine
 * All rendering functions for vendeur & manager views.
 * State (DATA, STATS, etc.) is managed by app.js.
 */

// ===== LOUIS VUITTON PRODUCT DATABASE =====
let LV_PRODUCTS = [];
let PRODUCTS_LOADED = false;

// Load LV products from JSON file
async function loadLVProducts() {
    if (PRODUCTS_LOADED) return;

    try {
        const response = await fetch('louis_vuitton_products.json');
        if (!response.ok) throw new Error('Failed to load product database');

        LV_PRODUCTS = await response.json();
        PRODUCTS_LOADED = true;
    } catch (error) {
        console.error('❌ Error loading LV products:', error);
        LV_PRODUCTS = [];
    }
}

// Initialize product loading on page load
if (typeof window !== 'undefined') {
    loadLVProducts();
}

// ===== HELPERS =====
const CAT_NAMES = { profil: 'Profil', interet: 'Intérêt', voyage: 'Voyage', contexte: 'Contexte', service: 'Service', marque: 'Marque', crm: 'CRM' };
const legendColors = { profil: '#60a5fa', interet: '#d4af37', voyage: '#34d399', contexte: '#c084fc', service: '#f472b6', marque: '#fb923c', crm: '#facc15' };

// ── Design System Helpers ─────────────────────────────────────────
const TAG_CLASSES = {
    voyage: 'tag-voyage', marque: 'tag-marque', interet: 'tag-interet',
    profil: 'tag-profil', contexte: 'tag-contexte', service: 'tag-service', crm: 'tag-crm'
};

function getTagClass(category) {
    return TAG_CLASSES[category?.toLowerCase()] || 'tag-crm';
}

function getScoreClass(score) {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-mid';
    return 'score-low';
}

function getProgressClass(score) {
    if (score >= 80) return 'progress-green';
    if (score >= 60) return 'progress-amber';
    return 'progress-red';
}

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_PALETTES = [
    { bg: '#F0E8D0', color: '#8A6020' },
    { bg: '#E8EEF5', color: '#3A5A8A' },
    { bg: '#EBF5EB', color: '#2A6A2A' },
    { bg: '#F0EBF5', color: '#6A3A8A' },
    { bg: '#F5EBE8', color: '#8A3A2A' },
    { bg: '#E8F0F5', color: '#2A5A7A' },
    { bg: '#F5F0E8', color: '#7A6020' },
];
function getAvatarPalette(name) {
    const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
}

function buildTag(tagObj) {
    const cls = getTagClass(tagObj.c);
    return `<span class="tag ${cls}">${tagObj.t}</span>`;
}

function buildClientAvatar(name, size = 30) {
    const p = getAvatarPalette(name);
    const initials = getInitials(name);
    return `<div class="client-av" style="width:${size}px;height:${size}px;background:${p.bg};color:${p.color}">${initials}</div>`;
}

// ===== DASHBOARD HELPERS =====
function groupByDate(arr, valueFn) {
    const map = {};
    (arr || []).forEach(function (row) {
        const d = (row.date || '').substring(0, 10);
        if (!d) return;
        map[d] = (map[d] || 0) + (valueFn ? valueFn(row) : 1);
    });
    return map;
}

function lastNDays(map, n) {
    const sorted = Object.keys(map).sort();
    const last = sorted.slice(-n);
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(last[i] !== undefined ? (map[last[i]] || 0) : 0);
    }
    return result.length ? result : Array(n).fill(0);
}

// ===== DASHBOARD DATA HELPERS =====
function calcWeeklyActivity(data) {
    const weeks = Array(8).fill(0);
    (data || []).forEach(c => {
        const date = new Date(c.date || c.created_at);
        const w = Math.floor((Date.now() - date) / (7 * 86400000));
        if (w >= 0 && w < 8) weeks[7 - w]++;
    });
    return weeks;
}

function calcPrivacyScore(stats, data) {
    if (stats?.privacyAvg) return stats.privacyAvg;
    const violations = (data || []).filter(c => c.sensitiveCount > 0).length;
    return data?.length ? Math.round((1 - violations / data.length) * 100) : 0;
}

function calcTagDensityByCategory(data) {
    const cats = { profil: 0, interet: 0, voyage: 0, contexte: 0, service: 0, marque: 0, crm: 0 };
    (data || []).forEach(c => {
        (c.tags || []).forEach(t => {
            const cat = t.c?.toLowerCase();
            if (cats.hasOwnProperty(cat)) cats[cat]++;
        });
    });
    const max = Math.max(...Object.values(cats), 1);
    return Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, v / max]));
}

function calcPrivacyTrend(data) {
    if (!data || data.length < 2) return 0;
    const mid = Math.floor(data.length / 2);
    const first = data.slice(0, mid);
    const second = data.slice(mid);
    const avgScore = arr => arr.reduce((a, c) => a + (c.sensitiveCount > 0 ? 0 : 100), 0) / arr.length;
    return Math.round(avgScore(second) - avgScore(first));
}

// ===== HELPER: CLIENT ROI ESTIMATE =====
function estimateClientROI(client) {
    const tags = (client.tags || []).map(t => (t.t || '').toLowerCase());
    let base = 800;

    if (tags.some(t => t.includes('vip') || t.includes('vvip') || t.includes('prestige'))) base *= 2.5;
    if (tags.some(t => t.includes('horlogerie') || t.includes('joaillerie') || t.includes('bijoux'))) base *= 2.8;
    if (tags.some(t => t.includes('cadeau') || t.includes('occasion') || t.includes('anniversaire') || t.includes('mariage'))) base *= 1.8;
    if (tags.some(t => t.includes('collection') || t.includes('iconique'))) base *= 1.4;
    if (tags.some(t => t.includes('professionnel') || t.includes('executive') || t.includes('ceo'))) base *= 1.6;

    const sentiment = client.sentiment || {};
    if (sentiment.level === 'positive') base *= 1.3;
    if (sentiment.level === 'negative') base *= 0.5;

    const min = Math.round(base * 0.6 / 100) * 100;
    const max = Math.round(base * 1.5 / 100) * 100;
    return { min: Math.max(200, min), max: Math.max(400, max) };
}

// ===== FEATURE: OCCASION RADAR =====
const OCCASION_PATTERNS = [
    { regex: /anniversaire|fête d[eu]|célèbre|souffle (ses|[0-9]+) bougies/i, type: 'Anniversaire', icon: '🎂', color: '#E84393', urgency: 3 },
    { regex: /mariage|se marie|noces|futur[se] épou/i, type: 'Mariage', icon: '💍', color: '#7C3AED', urgency: 4 },
    { regex: /naissance|bébé|enceinte|grossesse|attend un enfant|accouche/i, type: 'Naissance', icon: '👶', color: '#10B981', urgency: 3 },
    { regex: /noël|cadeau de noël|fêtes de fin d'année/i, type: 'Noël', icon: '🎄', color: '#DC2626', urgency: 2 },
    { regex: /diplôme|graduation|licence|master|bac\b|promotion scolaire/i, type: 'Diplôme', icon: '🎓', color: '#2563EB', urgency: 2 },
    { regex: /retraite|départ en retraite/i, type: 'Retraite', icon: '🌴', color: '#D97706', urgency: 2 },
    { regex: /saint-valentin|valentines|st-valentin/i, type: 'Saint-Valentin', icon: '❤️', color: '#E84393', urgency: 4 },
    { regex: /fête des mères|fête des pères|mother.s day|father.s day/i, type: 'Fête familiale', icon: '🌸', color: '#D97706', urgency: 3 },
    { regex: /cadeau|offrir|offert|surprise|gâter/i, type: 'Cadeau', icon: '🎁', color: '#6B7280', urgency: 1 },
    { regex: /pendaison de crémaillère|emménage|nouvelle maison/i, type: 'Emménagement', icon: '🏡', color: '#2563EB', urgency: 2 },
];

const TIME_PATTERNS = [
    { regex: /la semaine prochaine|semaine prochaine/i, daysUntil: 7 },
    { regex: /le mois prochain|mois prochain/i, daysUntil: 30 },
    { regex: /prochainement|bientôt|dans quelques semaines/i, daysUntil: 21 },
    { regex: /en janvier/i, daysUntil: () => estimateDaysUntilMonth(1) },
    { regex: /en février/i, daysUntil: () => estimateDaysUntilMonth(2) },
    { regex: /en mars/i, daysUntil: () => estimateDaysUntilMonth(3) },
    { regex: /en avril/i, daysUntil: () => estimateDaysUntilMonth(4) },
    { regex: /en mai/i, daysUntil: () => estimateDaysUntilMonth(5) },
    { regex: /en juin/i, daysUntil: () => estimateDaysUntilMonth(6) },
    { regex: /en juillet/i, daysUntil: () => estimateDaysUntilMonth(7) },
    { regex: /en août/i, daysUntil: () => estimateDaysUntilMonth(8) },
    { regex: /en septembre/i, daysUntil: () => estimateDaysUntilMonth(9) },
    { regex: /en octobre/i, daysUntil: () => estimateDaysUntilMonth(10) },
    { regex: /en novembre/i, daysUntil: () => estimateDaysUntilMonth(11) },
    { regex: /en décembre/i, daysUntil: () => estimateDaysUntilMonth(12) },
];

function estimateDaysUntilMonth(month) {
    const today = new Date();
    const targetYear = today.getMonth() + 1 > month ? today.getFullYear() + 1 : today.getFullYear();
    const target = new Date(targetYear, month - 1, 15);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function detectOccasions(client) {
    const text = ((client.orig || '') + ' ' + (client.clean || '')).toLowerCase();
    const occasions = [];

    for (const pattern of OCCASION_PATTERNS) {
        if (pattern.regex.test(text)) {
            let daysUntil = null;
            for (const tp of TIME_PATTERNS) {
                if (tp.regex.test(text)) {
                    daysUntil = typeof tp.daysUntil === 'function' ? tp.daysUntil() : tp.daysUntil;
                    break;
                }
            }
            const dateMatch = text.match(/(?:le\s+)?(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i);
            if (dateMatch) {
                const months = {janvier:1,février:2,mars:3,avril:4,mai:5,juin:6,juillet:7,août:8,septembre:9,octobre:10,novembre:11,décembre:12};
                daysUntil = estimateDaysUntilMonth(months[dateMatch[2].toLowerCase()]);
            }
            occasions.push({ ...pattern, daysUntil });
        }
    }
    return occasions;
}

function buildOccasionCard(client, occ) {
    const p = getAvatarPalette(client.ca);
    const initials = getInitials(client.ca);
    const daysUntil = occ.daysUntil;
    const urgencyClass = daysUntil !== null ? (daysUntil <= 7 ? 'urgent-red' : daysUntil <= 14 ? 'urgent-orange' : daysUntil <= 30 ? 'urgent-amber' : 'urgent-green') : 'urgent-gray';
    const daysLabel = daysUntil !== null ? (daysUntil <= 0 ? "Aujourd'hui !" : `Dans ${daysUntil}j`) : 'Date non précisée';
    const roi = estimateClientROI(client);

    return `
        <div class="occasion-card">
            <div class="occasion-card-header">
                <div class="occasion-badge" style="background:${occ.color}20;color:${occ.color};border-color:${occ.color}40">
                    ${occ.icon} ${occ.type}
                </div>
                <div class="occasion-countdown ${urgencyClass}">${daysLabel}</div>
            </div>
            <div class="occasion-card-client">
                <div class="occasion-avatar" style="background:${p.bg};color:${p.color}">${initials}</div>
                <div>
                    <div class="occasion-client-name">${client.ca || 'Client inconnu'}</div>
                    <div class="occasion-client-meta">${client.store || ''} · ${client.lang || 'FR'}</div>
                </div>
            </div>
            <div class="occasion-tags">
                ${(client.tags || []).slice(0, 3).map(buildTag).join('')}
            </div>
            <div class="occasion-roi">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v14M5 4h4.5a2.5 2.5 0 010 5H5M5 9h5a2.5 2.5 0 010 5H5"/></svg>
                Potentiel estimé : <strong>€${roi.min.toLocaleString()} – €${roi.max.toLocaleString()}</strong>
            </div>
            <div class="occasion-actions">
                <button class="occasion-copy-btn" onclick="copyOccasionMessage('${(client.ca || '').replace(/'/g,"\\'")}','${occ.type}')">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="9" height="10" rx="1"/><path d="M11 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v9a1 1 0 001 1h1"/></svg>
                    Copier message
                </button>
                <button class="occasion-brief-btn" onclick="if(typeof navigateTo==='function'){window._briefClientId='${client.id}';navigateTo('brief');}">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="1" width="12" height="14" rx="1"/><path d="M5 5h6M5 8h6M5 11h3"/></svg>
                    Voir brief
                </button>
            </div>
        </div>
    `;
}

window.copyOccasionMessage = function(clientName, occasionType) {
    const msg = `Bonjour ${clientName || 'cher(e) client(e)'}, j'espère que vous allez bien ! À l'occasion de votre ${occasionType.toLowerCase()}, j'ai pensé à vous et souhaite vous présenter quelques pièces qui correspondent parfaitement à cet événement. N'hésitez pas à me contacter pour organiser une visite — il me ferait plaisir de vous accueillir.`;
    navigator.clipboard.writeText(msg).then(() => showToast('Message copié !', 'success'));
};

function renderOccasionRadar() {
    const root = document.getElementById('occasions-root');
    if (!root) return;

    const allOccasions = [];
    DATA.forEach(client => {
        const detected = detectOccasions(client);
        detected.forEach(occ => {
            allOccasions.push({ client, occ });
        });
    });

    allOccasions.sort((a, b) => {
        const aDays = a.occ.daysUntil !== null ? a.occ.daysUntil : 999;
        const bDays = b.occ.daysUntil !== null ? b.occ.daysUntil : 999;
        if (aDays !== bDays) return aDays - bDays;
        return b.occ.urgency - a.occ.urgency;
    });

    const roiTotal = allOccasions.length * 1800;
    const urgentCount = allOccasions.filter(o => o.occ.daysUntil !== null && o.occ.daysUntil <= 14).length;

    const activeFilter = window._occasionFilter || 'all';
    let filtered = allOccasions;
    if (activeFilter === 'urgent') filtered = allOccasions.filter(o => o.occ.daysUntil !== null && o.occ.daysUntil <= 14);
    else if (activeFilter === 'month') filtered = allOccasions.filter(o => o.occ.daysUntil !== null && o.occ.daysUntil <= 30);
    else if (activeFilter === 'gift') filtered = allOccasions.filter(o => o.occ.type === 'Cadeau');

    root.innerHTML = `
        <div class="occasion-hero">
            <div class="occasion-hero-left">
                <div class="occasion-hero-title">Occasion Radar</div>
                <div class="occasion-hero-sub">Occasions détectées dans les notes clients</div>
            </div>
            <div class="occasion-hero-kpis">
                <div class="occasion-kpi">
                    <div class="occasion-kpi-val">${allOccasions.length}</div>
                    <div class="occasion-kpi-label">occasions détectées</div>
                </div>
                <div class="occasion-kpi occasion-kpi--urgent">
                    <div class="occasion-kpi-val">${urgentCount}</div>
                    <div class="occasion-kpi-label">urgentes (14j)</div>
                </div>
                <div class="occasion-kpi occasion-kpi--roi">
                    <div class="occasion-kpi-val">€${(roiTotal / 1000).toFixed(0)}k</div>
                    <div class="occasion-kpi-label">CA potentiel</div>
                </div>
            </div>
        </div>

        <div class="occasion-filters">
            <button class="occasion-filter-btn ${activeFilter === 'all' ? 'active' : ''}" onclick="window._occasionFilter='all';renderOccasionRadar()">Toutes (${allOccasions.length})</button>
            <button class="occasion-filter-btn ${activeFilter === 'urgent' ? 'active' : ''}" onclick="window._occasionFilter='urgent';renderOccasionRadar()">Urgentes — 14j (${allOccasions.filter(o=>o.occ.daysUntil!==null&&o.occ.daysUntil<=14).length})</button>
            <button class="occasion-filter-btn ${activeFilter === 'month' ? 'active' : ''}" onclick="window._occasionFilter='month';renderOccasionRadar()">Ce mois (${allOccasions.filter(o=>o.occ.daysUntil!==null&&o.occ.daysUntil<=30).length})</button>
            <button class="occasion-filter-btn ${activeFilter === 'gift' ? 'active' : ''}" onclick="window._occasionFilter='gift';renderOccasionRadar()">Cadeaux (${allOccasions.filter(o=>o.occ.type==='Cadeau').length})</button>
        </div>

        ${filtered.length === 0 ? `
            <div class="occasion-empty">
                <div style="font-size:32px;margin-bottom:12px">🎯</div>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:6px">Aucune occasion dans ce filtre</div>
                <div style="font-size:12px;color:var(--text-secondary)">Importez plus de notes clients pour détecter des occasions</div>
            </div>
        ` : `
            <div class="occasion-cards-grid">
                ${filtered.map(({ client, occ }) => buildOccasionCard(client, occ)).join('')}
            </div>
        `}
    `;
}

// ===== FEATURE: CHURN ALERT =====
function computeChurnScore(client) {
    let score = 100;
    const sentiment = client.sentiment || {};

    if (sentiment.level === 'negative') score -= 35;
    else if (sentiment.level === 'neutral') score -= 10;

    const noteDate = client.date ? new Date(client.date) : null;
    if (noteDate) {
        const daysSince = Math.round((new Date() - noteDate) / (1000 * 60 * 60 * 24));
        if (daysSince > 90) score -= 25;
        else if (daysSince > 60) score -= 15;
        else if (daysSince > 30) score -= 5;
    }

    const negSignals = ['concurrent', 'hermès', 'chanel', 'gucci', 'pas intéressé', 'trop cher', 'ailleurs', 'déçu', 'mécontent', 'déçue'];
    const text = ((client.orig || '') + ' ' + (client.clean || '')).toLowerCase();
    let negPenalty = 0;
    negSignals.forEach(s => { if (text.includes(s)) negPenalty = Math.min(24, negPenalty + 8); });
    score -= negPenalty;

    const posSignals = ['fidèle', 'régulier', 'régulière', 'toujours', 'adore', 'fan', 'ambassadeur', 'habituel'];
    posSignals.forEach(s => { if (text.includes(s)) score = Math.min(100, score + 5); });

    if ((client.nba || []).length >= 2) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
}

function renderChurnAlert() {
    const clientsPage = document.getElementById('page-clients');
    if (!clientsPage) return;

    const existing = document.getElementById('churn-alert-section');
    if (existing) existing.remove();

    const atRisk = DATA.map(c => ({ client: c, score: computeChurnScore(c) }))
        .filter(r => r.score < 65)
        .sort((a, b) => a.score - b.score)
        .slice(0, 6);

    if (atRisk.length === 0) return;

    const critical = atRisk.filter(r => r.score < 40);
    const warning = atRisk.filter(r => r.score >= 40 && r.score < 65);

    const section = document.createElement('div');
    section.id = 'churn-alert-section';
    section.className = 'churn-alert-section';
    section.innerHTML = `
        <div class="churn-header">
            <div class="churn-header-left">
                <span class="churn-header-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </span>
                <div>
                    <div class="churn-header-title">Alerte Rétention</div>
                    <div class="churn-header-sub">${critical.length} critique${critical.length !== 1 ? 's' : ''} · ${warning.length} à surveiller</div>
                </div>
            </div>
            <button class="churn-dismiss-btn" onclick="document.getElementById('churn-alert-section').style.display='none'">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg>
            </button>
        </div>
        <div class="churn-cards-row">
            ${atRisk.map(({ client, score }) => {
                const p = getAvatarPalette(client.ca);
                const initials = getInitials(client.ca);
                const riskLevel = score < 40 ? 'critical' : 'warning';
                const riskLabel = score < 40 ? 'Risque critique' : 'À surveiller';
                const riskColor = score < 40 ? 'var(--color-negative)' : 'var(--color-warning)';
                const recovery = score < 40
                    ? 'Appel personnel urgent + invitation exclusive requise'
                    : 'Follow-up personnalisé recommandé dans les 7 jours';
                const noteDate = client.date ? new Date(client.date).toLocaleDateString('fr-FR', {day:'2-digit',month:'short'}) : '—';
                return `
                    <div class="churn-card churn-card--${riskLevel}" onclick="openDetailPanel(DATA.find(c=>c.id==='${client.id}'))">
                        <div class="churn-card-header">
                            <div class="churn-avatar" style="background:${p.bg};color:${p.color}">${initials}</div>
                            <div class="churn-ring" style="--score:${score}%;--color:${riskColor}">
                                <svg viewBox="0 0 36 36" class="churn-ring-svg">
                                    <path d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" fill="none" stroke="var(--border)" stroke-width="3"/>
                                    <path d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32" fill="none" stroke="${riskColor}" stroke-width="3" stroke-dasharray="${Math.round(score)} 100" stroke-linecap="round"/>
                                </svg>
                                <span class="churn-ring-val">${score}</span>
                            </div>
                        </div>
                        <div class="churn-card-name">${client.ca || 'Client'}</div>
                        <div class="churn-risk-badge" style="color:${riskColor}">${riskLabel}</div>
                        <div class="churn-last-contact">Dernière note : ${noteDate}</div>
                        <div class="churn-recovery">${recovery}</div>
                        <button class="churn-action-btn" onclick="event.stopPropagation();if(typeof navigateTo==='function'){window._selectedClient=DATA.find(c=>c.id==='${client.id}');navigateTo('followup');}">
                            Action →
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Insert before the search-filter-bar (first child of page-clients)
    clientsPage.insertBefore(section, clientsPage.firstChild);
}

// ===== FEATURE: MORNING BRIEFING =====
function showMorningBriefing() {
    if ((typeof currentUser !== 'undefined' ? (currentUser?.role || '') : '').toLowerCase() !== 'manager') return;

    const today = new Date().toISOString().split('T')[0];
    const key = `lvmh_briefing_${today}`;
    if (localStorage.getItem(key)) return;

    const churnAtRisk = DATA.filter(c => computeChurnScore(c) < 40).length;
    const occasionsThisWeek = DATA.reduce((count, c) => {
        const occ = detectOccasions(c);
        return count + occ.filter(o => o.daysUntil !== null && o.daysUntil <= 7).length;
    }, 0);

    const sentimentAvg = DATA.length
        ? Math.round(DATA.reduce((a, c) => a + (c.sentiment?.score || 50), 0) / DATA.length)
        : 0;

    const worstSeller = PRIVACY_SCORES.length ? [...PRIVACY_SCORES].sort((a, b) => a.score - b.score)[0] : null;

    let actionOfDay = '';
    if (churnAtRisk > 0) actionOfDay = `${churnAtRisk} client${churnAtRisk > 1 ? 's' : ''} en risque critique de churn — contactez-les aujourd'hui.`;
    else if (occasionsThisWeek > 0) actionOfDay = `${occasionsThisWeek} occasion${occasionsThisWeek > 1 ? 's' : ''} cette semaine — préparez vos messages personnalisés.`;
    else if (worstSeller && worstSeller.score < 70) actionOfDay = `Score RGPD de ${worstSeller.ca} à ${worstSeller.score}/100 — formation recommandée.`;
    else actionOfDay = `Bonne journée — tous vos indicateurs sont au vert.`;

    const firstName = (typeof currentUser !== 'undefined' ? currentUser?.first_name : '') || 'Manager';
    const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    const weekOccasions = DATA.flatMap(c => detectOccasions(c).filter(o => o.daysUntil !== null && o.daysUntil <= 7).map(o => ({client:c, occ:o}))).slice(0, 3);

    const modal = document.createElement('div');
    modal.id = 'morning-briefing-modal';
    modal.className = 'briefing-overlay';
    modal.innerHTML = `
        <div class="briefing-modal">
            <div class="briefing-modal-header">
                <div>
                    <div class="briefing-greeting">Bonjour, ${firstName}</div>
                    <div class="briefing-date">${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</div>
                </div>
                <button class="briefing-close" onclick="dismissBriefing()">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg>
                </button>
            </div>

            <div class="briefing-kpi-grid">
                <div class="briefing-kpi">
                    <div class="briefing-kpi-val">${DATA.length}</div>
                    <div class="briefing-kpi-label">Clients en base</div>
                </div>
                <div class="briefing-kpi briefing-kpi--alert" style="${churnAtRisk > 0 ? '' : 'opacity:0.5'}">
                    <div class="briefing-kpi-val">${churnAtRisk}</div>
                    <div class="briefing-kpi-label">Clients à risque</div>
                </div>
                <div class="briefing-kpi briefing-kpi--opportunity">
                    <div class="briefing-kpi-val">${occasionsThisWeek}</div>
                    <div class="briefing-kpi-label">Occasions cette sem.</div>
                </div>
                <div class="briefing-kpi">
                    <div class="briefing-kpi-val">${STATS.privacyAvg || 0}</div>
                    <div class="briefing-kpi-label">Score RGPD moy.</div>
                </div>
                <div class="briefing-kpi briefing-kpi--sentiment">
                    <div class="briefing-kpi-val">${sentimentAvg}</div>
                    <div class="briefing-kpi-label">Sentiment client</div>
                </div>
            </div>

            <div class="briefing-action-spotlight">
                <div class="briefing-action-label">ACTION DU JOUR</div>
                <div class="briefing-action-text">${actionOfDay}</div>
            </div>

            ${weekOccasions.length > 0 ? `
            <div class="briefing-occasions-preview">
                <div class="briefing-section-title">Occasions cette semaine</div>
                ${weekOccasions.map(({client, occ}) => `
                    <div class="briefing-occasion-row">
                        <span class="briefing-occ-icon" style="color:${occ.color}">${occ.icon}</span>
                        <span class="briefing-occ-name">${client.ca}</span>
                        <span class="briefing-occ-type">${occ.type}</span>
                        <span class="briefing-occ-days">Dans ${occ.daysUntil}j</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <button class="briefing-start-btn" onclick="dismissBriefing()">
                Commencer la journée
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </button>
        </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('briefing-overlay--visible'));
}

window.dismissBriefing = function() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`lvmh_briefing_${today}`, '1');
    const modal = document.getElementById('morning-briefing-modal');
    if (modal) {
        modal.classList.remove('briefing-overlay--visible');
        setTimeout(() => modal.remove(), 300);
    }
};

// ===== FEATURE: COLLECTION MATCH =====
function renderCollectionMatch() {
    const root = document.getElementById('collection-root');
    if (!root) return;

    const lastCollection = window._lastCollectionSearch || null;

    root.innerHTML = `
        <div class="collection-hero">
            <div class="collection-hero-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <div>
                <div class="collection-hero-title">Collection Match</div>
                <div class="collection-hero-sub">Identifiez quels clients contacter pour une nouvelle collection</div>
            </div>
        </div>

        <div class="collection-search-panel">
            <div class="collection-field">
                <label class="collection-label">Nom de la collection</label>
                <input type="text" id="collectionName" class="collection-input" placeholder="Ex: Capucines Brodée Printemps 2026" value="${lastCollection?.name || ''}">
            </div>
            <div class="collection-field">
                <label class="collection-label">Mots-clés associés <span style="font-weight:400;color:var(--text-secondary)">(séparés par des virgules)</span></label>
                <input type="text" id="collectionKeywords" class="collection-input" placeholder="Ex: broderie, coloris pastel, sac, cérémonie, printemps, floral" value="${lastCollection?.keywords || ''}">
            </div>
            <button class="collection-search-btn" onclick="runCollectionMatch()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Trouver mes clients cibles
            </button>
        </div>

        <div id="collection-results"></div>
    `;

    if (lastCollection?.results) {
        renderCollectionResults(lastCollection.results, lastCollection.name);
    }
}

window.runCollectionMatch = function() {
    const name = document.getElementById('collectionName')?.value?.trim();
    const keywords = document.getElementById('collectionKeywords')?.value?.trim();
    if (!name || !keywords) { showToast('Renseignez le nom et les mots-clés', 'error'); return; }

    const kws = keywords.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);

    const results = DATA.map(client => {
        let score = 0;
        const reasons = [];
        const clientText = ((client.orig || '') + ' ' + (client.clean || '')).toLowerCase();
        const clientTags = (client.tags || []).map(t => t.t.toLowerCase());

        kws.forEach(kw => {
            if (clientTags.some(t => t.includes(kw) || kw.includes(t.replace(/[^a-z]/g,'')))) {
                score += 5;
                const matchedTag = (client.tags || []).find(t => t.t.toLowerCase().includes(kw));
                if (matchedTag) reasons.push(matchedTag.t);
            }
            if (clientText.includes(kw)) {
                score += 2;
                if (!reasons.includes(kw)) reasons.push(kw);
            }
        });

        return { client, score, reasons: [...new Set(reasons)] };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

    window._lastCollectionSearch = { name, keywords, results };
    renderCollectionResults(results, name);
};

function renderCollectionResults(results, collectionName) {
    const container = document.getElementById('collection-results');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = `<div class="collection-empty">Aucun client ne correspond à ces mots-clés. Essayez des termes plus généraux.</div>`;
        return;
    }

    const roiTotal = results.length * 2200;
    const maxScore = results[0]?.score || 1;

    container.innerHTML = `
        <div class="collection-results-header">
            <div class="collection-results-title">${results.length} clients ciblés pour « ${collectionName} »</div>
            <div class="collection-roi-badge">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v14M5 4h4.5a2.5 2.5 0 010 5H5M5 9h5a2.5 2.5 0 010 5H5"/></svg>
                CA potentiel estimé : €${(roiTotal/1000).toFixed(0)}k
            </div>
            <button class="collection-export-btn" onclick="exportCollectionList()">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 11V1M4 7l4 4 4-4M14 13H2"/></svg>
                Exporter CSV
            </button>
        </div>
        <div class="collection-list">
            ${results.map((r, i) => {
                const p = getAvatarPalette(r.client.ca);
                const initials = getInitials(r.client.ca);
                const pct = Math.round((r.score / maxScore) * 100);
                const roi = estimateClientROI(r.client);
                const safeCollectionName = collectionName.replace(/`/g, "'");
                const safeClientName = (r.client.ca || 'cher(e) client(e)').replace(/`/g, "'");
                return `
                    <div class="collection-match-card">
                        <div class="collection-match-rank">#${i + 1}</div>
                        <div class="collection-match-avatar" style="background:${p.bg};color:${p.color}">${initials}</div>
                        <div class="collection-match-info">
                            <div class="collection-match-name">${r.client.ca || 'Client inconnu'}</div>
                            <div class="collection-match-tags">
                                ${r.reasons.slice(0, 3).map(reason => `<span class="collection-match-reason">${reason}</span>`).join('')}
                            </div>
                        </div>
                        <div class="collection-match-score-bar">
                            <div class="collection-match-bar-fill" style="width:${pct}%"></div>
                            <span class="collection-match-pct">${pct}%</span>
                        </div>
                        <div class="collection-match-roi">€${roi.min.toLocaleString()}–€${roi.max.toLocaleString()}</div>
                        <button class="collection-copy-msg" title="Copier le message" onclick="navigator.clipboard.writeText('Bonjour ${safeClientName}, je pense à vous ! La nouvelle collection ${safeCollectionName} vient d\\'arriver et certaines pièces m\\'ont immédiatement fait penser à vous. Je serais ravie de vous les présenter lors d\\'une prochaine visite.').then(()=>showToast('Message copié !','success'))">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="9" height="10" rx="1"/><path d="M11 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v9a1 1 0 001 1h1"/></svg>
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

window.exportCollectionList = function() {
    const data = window._lastCollectionSearch;
    if (!data?.results) return;
    const lines = ['Rang,Client,Score,Raisons du match,Boutique'];
    data.results.forEach((r, i) => {
        lines.push([i+1, r.client.ca, r.score, '"' + r.reasons.join(', ') + '"', r.client.store].join(','));
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = `collection_match_${(data.name || 'export').replace(/\s+/g,'_')}.csv`;
    a.click();
};

// ===== FEATURE: LEADERBOARD =====
function computeLeaderboard() {
    const sellersMap = {};

    PRIVACY_SCORES.forEach(p => {
        sellersMap[p.ca] = {
            name: p.ca,
            rgpdScore: p.score,
            violations: p.violations || 0,
            level: p.level,
            notes: 0,
            sentimentScores: [],
            nbas: 0
        };
    });

    DATA.forEach(client => {
        const sellerKey = client.ca || 'Inconnu';
        if (!sellersMap[sellerKey]) {
            sellersMap[sellerKey] = { name: sellerKey, rgpdScore: 85, violations: 0, notes: 0, sentimentScores: [], nbas: 0 };
        }
        sellersMap[sellerKey].notes++;
        sellersMap[sellerKey].sentimentScores.push(client.sentiment?.score || 50);
        sellersMap[sellerKey].nbas += (client.nba || []).length;
    });

    return Object.values(sellersMap).map(s => {
        const avgSentiment = s.sentimentScores.length
            ? Math.round(s.sentimentScores.reduce((a, b) => a + b, 0) / s.sentimentScores.length)
            : 50;
        const rgpd = s.rgpdScore || 85;
        const nbaScore = Math.min(100, (s.nbas / Math.max(1, s.notes)) * 50);
        const composite = Math.round(rgpd * 0.4 + avgSentiment * 0.35 + nbaScore * 0.25);
        return { ...s, avgSentiment, rgpd, nbaScore: Math.round(nbaScore), composite };
    }).sort((a, b) => b.composite - a.composite);
}

function renderLeaderboard() {
    const root = document.getElementById('leaderboard-root');
    if (!root) return;

    const rankings = computeLeaderboard();
    if (rankings.length === 0) {
        root.innerHTML = `<div class="leaderboard-empty">Aucune donnée disponible. Importez des notes pour voir le classement.</div>`;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const top3 = rankings.slice(0, 3);
    const rest = rankings.slice(3);
    const heights = ['80px', '110px', '60px'];
    const podiumOrder = [1, 0, 2];

    root.innerHTML = `
        <div class="leaderboard-hero">
            <div class="leaderboard-hero-title">Leaderboard Équipe</div>
            <div class="leaderboard-hero-sub">Classement basé sur RGPD (40%) · Sentiment client (35%) · NBAs générés (25%)</div>
        </div>

        <div class="leaderboard-podium">
            ${top3.map((seller, i) => {
                const p = getAvatarPalette(seller.name);
                const initials = getInitials(seller.name);
                return `
                    <div class="leaderboard-podium-item" style="order:${podiumOrder[i]}">
                        <div class="leaderboard-podium-avatar" style="background:${p.bg};color:${p.color}">
                            ${initials}
                            ${i === 0 ? '<div class="leaderboard-crown">👑</div>' : ''}
                        </div>
                        <div class="leaderboard-podium-name">${seller.name.split(' ')[0]}</div>
                        <div class="leaderboard-podium-score">${seller.composite}</div>
                        <div class="leaderboard-podium-bar" style="height:${heights[i]};background:${i === 0 ? 'var(--carbon)' : 'var(--border-strong)'}">
                            <span class="leaderboard-podium-rank">${medals[i]}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        ${rest.length > 0 ? `
        <div class="leaderboard-table">
            <div class="leaderboard-table-header">
                <span>Rang</span><span>Conseiller</span><span>Score global</span><span>RGPD</span><span>Sentiment</span><span>NBA</span>
            </div>
            ${rest.map((seller, i) => {
                const p = getAvatarPalette(seller.name);
                const initials = getInitials(seller.name);
                const isCurrentUser = typeof currentUser !== 'undefined' && currentUser && seller.name.toLowerCase().includes((currentUser.first_name || '').toLowerCase());
                return `
                    <div class="leaderboard-row ${isCurrentUser ? 'leaderboard-row--you' : ''}">
                        <span class="leaderboard-row-rank">#${i + 4}</span>
                        <div class="leaderboard-row-seller">
                            <div class="leaderboard-row-avatar" style="background:${p.bg};color:${p.color}">${initials}</div>
                            <span>${seller.name}</span>
                            ${isCurrentUser ? '<span class="leaderboard-you-badge">Vous</span>' : ''}
                        </div>
                        <div class="leaderboard-row-composite">
                            <div class="leaderboard-composite-bar" style="width:${seller.composite}%"></div>
                            <span>${seller.composite}</span>
                        </div>
                        <span class="leaderboard-metric ${seller.rgpd >= 80 ? 'metric-good' : seller.rgpd >= 60 ? 'metric-mid' : 'metric-bad'}">${seller.rgpd}</span>
                        <span class="leaderboard-metric ${seller.avgSentiment >= 65 ? 'metric-good' : seller.avgSentiment >= 45 ? 'metric-mid' : 'metric-bad'}">${seller.avgSentiment}</span>
                        <span class="leaderboard-metric">${seller.nbaScore}</span>
                    </div>
                `;
            }).join('')}
        </div>
        ` : ''}

        <div class="leaderboard-legend">
            <div class="leaderboard-legend-item"><span class="metric-good">■</span> Excellent (80+)</div>
            <div class="leaderboard-legend-item"><span class="metric-mid">■</span> Bon (60-79)</div>
            <div class="leaderboard-legend-item"><span class="metric-bad">■</span> À améliorer (&lt;60)</div>
        </div>
    `;
}

// ===== FEATURE: CLIENT JOURNEY MAP =====
function buildSentimentSparkline(scores) {
    if (!scores || scores.length < 2) return '';
    const W = 300, H = 60, P = 8;
    const W2 = W - P * 2, H2 = H - P * 2;
    const max = Math.max(...scores, 100);
    const min = Math.min(...scores, 0);
    const range = max - min || 1;

    const cx = (i) => P + (i / (scores.length - 1)) * W2;
    const cy = (v) => P + H2 - ((v - min) / range) * H2;

    const path = scores.map((v, i) => `${i === 0 ? 'M' : 'L'} ${cx(i)} ${cy(v)}`).join(' ');
    const area = path + ` L ${cx(scores.length-1)} ${P+H2} L ${P} ${P+H2} Z`;

    return `<svg class="journey-sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs><linearGradient id="journeyGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#1A1A1A" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#1A1A1A" stop-opacity="0"/>
        </linearGradient></defs>
        <path d="${area}" fill="url(#journeyGrad)"/>
        <path d="${path}" fill="none" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round"/>
        ${scores.map((v, i) => `<circle cx="${cx(i)}" cy="${cy(v)}" r="3" fill="#1A1A1A"/>`).join('')}
    </svg>`;
}

window.openJourneyMap = function(clientId) {
    const client = DATA.find(c => c.id === clientId);
    if (!client) return;

    const allNotes = DATA.filter(c =>
        c.ca === client.ca || c.id === clientId
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    const p = getAvatarPalette(client.ca);
    const initials = getInitials(client.ca);

    const sentimentHistory = allNotes.map(n => ({
        date: n.date,
        level: n.sentiment?.level || 'neutral',
        score: n.sentiment?.score || 50,
        tags: (n.tags || []).slice(0, 4),
        nbas: (n.nba || []).slice(0, 2),
    }));

    const lastNote = allNotes[allNotes.length - 1];
    const sentimentTrend = sentimentHistory.length > 1
        ? (sentimentHistory[sentimentHistory.length - 1].score > sentimentHistory[0].score ? 'improving' : 'declining')
        : 'stable';

    const relationshipStatus = (() => {
        const lastScore = lastNote?.sentiment?.score || 50;
        const churnScore = computeChurnScore(lastNote || client);
        if (churnScore < 40) return { label: 'Attention requise', color: 'var(--color-negative)', icon: '⚠️' };
        if (lastScore >= 70) return { label: 'Relation de confiance', color: 'var(--color-positive)', icon: '✦' };
        if (lastScore >= 50) return { label: 'Relation stable', color: 'var(--color-info)', icon: '◎' };
        return { label: 'Relation fragile', color: 'var(--color-warning)', icon: '◐' };
    })();

    const sparkline = buildSentimentSparkline(sentimentHistory.map(s => s.score));

    const modal = document.createElement('div');
    modal.id = 'journey-modal';
    modal.className = 'journey-overlay';
    modal.onclick = e => { if (e.target === modal) closeJourneyMap(); };
    modal.innerHTML = `
        <div class="journey-modal">
            <div class="journey-modal-header">
                <div class="journey-client-info">
                    <div class="journey-avatar" style="background:${p.bg};color:${p.color}">${initials}</div>
                    <div>
                        <div class="journey-client-name">${client.ca}</div>
                        <div class="journey-client-meta">${client.store || ''} · ${allNotes.length} note${allNotes.length > 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="journey-relation-status" style="color:${relationshipStatus.color}">
                    ${relationshipStatus.icon} ${relationshipStatus.label}
                </div>
                <button class="journey-close" onclick="closeJourneyMap()">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg>
                </button>
            </div>

            ${sparkline ? `
            <div class="journey-sparkline-section">
                <div class="journey-spark-label">Évolution du sentiment</div>
                ${sparkline}
                <div class="journey-trend-label" style="color:${sentimentTrend === 'improving' ? 'var(--color-positive)' : sentimentTrend === 'declining' ? 'var(--color-negative)' : 'var(--text-secondary)'}">
                    ${sentimentTrend === 'improving' ? '↗ En amélioration' : sentimentTrend === 'declining' ? '↘ En baisse' : '→ Stable'}
                </div>
            </div>
            ` : ''}

            <div class="journey-timeline">
                ${sentimentHistory.map((note, i) => {
                    const isFirst = i === 0;
                    const isLast = i === sentimentHistory.length - 1;
                    const sentColor = note.level === 'positive' ? 'var(--color-positive)' : note.level === 'negative' ? 'var(--color-negative)' : 'var(--text-secondary)';
                    const dateLabel = note.date ? new Date(note.date).toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'}) : '—';
                    return `
                        <div class="journey-node ${isFirst ? 'journey-node--first' : ''} ${isLast ? 'journey-node--last' : ''}">
                            <div class="journey-node-dot" style="border-color:${sentColor};background:${isLast ? sentColor : 'var(--bg-surface)'}"></div>
                            <div class="journey-node-content">
                                <div class="journey-node-header">
                                    <span class="journey-node-date">${dateLabel}</span>
                                    ${isFirst ? '<span class="journey-node-badge">Première visite</span>' : ''}
                                    ${isLast && !isFirst ? '<span class="journey-node-badge journey-node-badge--last">Dernière visite</span>' : ''}
                                </div>
                                <div class="journey-node-sentiment" style="color:${sentColor}">
                                    ${note.level === 'positive' ? '◆ Positif' : note.level === 'negative' ? '◆ Négatif' : '◆ Neutre'} · Score ${note.score}
                                </div>
                                ${note.tags.length > 0 ? `
                                <div class="journey-node-tags">
                                    ${note.tags.map(buildTag).join('')}
                                </div>` : ''}
                                ${note.nbas.length > 0 ? `
                                <div class="journey-node-nbas">
                                    ${note.nbas.map(nba => `<div class="journey-nba-item">→ ${nba.action || nba}</div>`).join('')}
                                </div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="journey-footer-actions">
                <button class="journey-cta" onclick="closeJourneyMap();if(typeof navigateTo==='function'){window._selectedClient=DATA.find(c=>c.id==='${client.id}');navigateTo('followup');}">
                    Générer Follow-up →
                </button>
                <button class="journey-cta journey-cta--secondary" onclick="closeJourneyMap();if(typeof navigateTo==='function'){window._briefClientId='${client.id}';navigateTo('brief');}">
                    Voir le Brief →
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('journey-overlay--visible'));
};

window.closeJourneyMap = function() {
    const modal = document.getElementById('journey-modal');
    if (modal) {
        modal.classList.remove('journey-overlay--visible');
        setTimeout(() => modal.remove(), 300);
    }
};

// ===== RENDER: DASHBOARD (Manager - COCKPIT) =====
function renderDashboard() {
    showMorningBriefing();

    var setEl = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };

    // ── TOP BAR ──
    var totalClients = DATA.length;
    var totalTags = DATA.reduce(function(s, r) { return s + (r.tags || []).length; }, 0);
    var totalNBA = DATA.reduce(function(s, r) { return s + (r.nba || []).length; }, 0);
    var privacyAvg = Math.round(STATS.privacyAvg || 0);

    setEl('ck-tb-clients', totalClients.toLocaleString('fr-FR'));
    setEl('ck-tb-tags', totalTags.toLocaleString('fr-FR'));
    setEl('ck-tb-privacy', privacyAvg);
    setEl('ck-tb-nba', totalNBA.toLocaleString('fr-FR'));
    setEl('ck-tb-date', new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

    // ── KPI 1 — SANTE PORTEFEUILLE ──
    var avgSentimentScore = DATA.length
        ? Math.round(DATA.reduce(function(s, r) { return s + ((r.sentiment && r.sentiment.score) ? r.sentiment.score : 50); }, 0) / DATA.length)
        : 50;
    var negCount = DATA.filter(function(r) { return r.sentiment && r.sentiment.level === 'negative'; }).length;
    var churnRate = DATA.length ? negCount / DATA.length : 0;
    var healthScore = Math.round((avgSentimentScore * 0.4) + ((1 - churnRate) * 100 * 0.35) + (privacyAvg * 0.25));

    var healthBadge, healthClass, healthColor;
    if (healthScore >= 80) {
        healthBadge = 'Excellent'; healthClass = 'ok'; healthColor = '#16A34A';
    } else if (healthScore >= 65) {
        healthBadge = 'Bon'; healthClass = 'good'; healthColor = '#2563EB';
    } else if (healthScore >= 50) {
        healthBadge = 'Attention'; healthClass = 'warn'; healthColor = '#D97706';
    } else {
        healthBadge = 'Critique'; healthClass = 'crit'; healthColor = '#DC2626';
    }

    var healthValEl = document.getElementById('ck-health-score');
    if (healthValEl) {
        healthValEl.textContent = DATA.length ? healthScore : '—';
        healthValEl.style.color = DATA.length ? healthColor : '#A8A6A0';
    }
    var healthBadgeEl = document.getElementById('ck-health-badge');
    if (healthBadgeEl) {
        healthBadgeEl.textContent = DATA.length ? healthBadge : '—';
        healthBadgeEl.className = 'ck-status-badge' + (DATA.length ? ' ' + healthClass : '');
    }
    var healthSubEl = document.getElementById('ck-health-sub');
    if (healthSubEl) {
        healthSubEl.textContent = DATA.length
            ? 'Sentiment ' + avgSentimentScore + ' · Churn ' + Math.round(churnRate * 100) + '% · RGPD ' + privacyAvg + '%'
            : 'Aucune donnée';
    }

    // ── KPI 2 — CLIENTS A RISQUE ──
    var riskCount = DATA.filter(function(r) {
        return (r.sentiment && r.sentiment.level === 'negative') || (r.sensitiveCount > 2);
    }).length;
    var riskPct = DATA.length ? Math.round(riskCount / DATA.length * 100) : 0;

    var riskCountEl = document.getElementById('ck-risk-count');
    if (riskCountEl) {
        riskCountEl.textContent = DATA.length ? riskCount : '—';
        riskCountEl.style.color = riskCount > 0 ? '#DC2626' : (DATA.length ? '#16A34A' : '#A8A6A0');
    }
    setEl('ck-risk-pct', DATA.length ? riskPct + '% du portefeuille' : '');

    // ── KPI 3 — COUVERTURE ACTIVE ──
    var now = new Date('2026-04-02');
    var recentCount = DATA.filter(function(r) {
        if (!r.date) return false;
        var d = new Date(r.date);
        return (now - d) / 86400000 < 30;
    }).length;
    var coveragePct = DATA.length ? Math.round(recentCount / DATA.length * 100) : 0;
    var coverageColor = coveragePct >= 70 ? '#16A34A' : coveragePct >= 40 ? '#D97706' : '#DC2626';

    setEl('ck-coverage-pct', DATA.length ? coveragePct + '%' : '—');
    var covEl = document.getElementById('ck-coverage-pct');
    if (covEl && DATA.length) covEl.style.color = coverageColor;

    var covBar = document.getElementById('ck-coverage-bar');
    if (covBar) {
        covBar.style.width = coveragePct + '%';
        covBar.style.background = coverageColor;
    }

    // ── KPI 4 — SCORE RGPD ──
    var rgpdBadge, rgpdClass;
    if (privacyAvg >= 80) {
        rgpdBadge = 'Conforme'; rgpdClass = 'ok';
    } else if (privacyAvg >= 60) {
        rgpdBadge = 'Risque'; rgpdClass = 'warn';
    } else {
        rgpdBadge = 'Critique'; rgpdClass = 'crit';
    }
    setEl('ck-rgpd-score', privacyAvg + '%');
    var rgpdBadgeEl = document.getElementById('ck-rgpd-badge');
    if (rgpdBadgeEl) {
        rgpdBadgeEl.textContent = rgpdBadge;
        rgpdBadgeEl.className = 'ck-status-badge ' + rgpdClass;
    }

    // ── CHART ROW ──
    renderSegmentDonut('ck-seg-chart', 'ck-seg-legend');
    renderSentimentTrend('ck-trend-chart');

    // ── BOTTOM ROW ──
    renderTeamList('ck-team-list');
    renderAlertFeed('ck-alert-feed');
}

// ── Segment Donut SVG ──
function renderSegmentDonut(chartId, legendId) {
    var chartEl = document.getElementById(chartId);
    var legendEl = document.getElementById(legendId);
    if (!chartEl) return;

    if (!DATA.length) {
        chartEl.innerHTML = '<div class="ck-empty-state">Aucune donnée</div>';
        if (legendEl) legendEl.innerHTML = '';
        return;
    }

    var avgTags = DATA.reduce(function(s, r) { return s + (r.tags || []).length; }, 0) / DATA.length;

    var segs = { persuadables: 0, sures: 0, dormants: 0, perdus: 0 };
    DATA.forEach(function(r) {
        var score = (r.sentiment && r.sentiment.score) ? r.sentiment.score : 50;
        var level = (r.sentiment && r.sentiment.level) ? r.sentiment.level : 'neutral';
        var tagDensity = (r.tags || []).length / Math.max(avgTags, 1);
        var uplift = (score / 100) * tagDensity * 1.1 - 0.3;
        if (uplift > 0.3 && level !== 'negative') segs.persuadables++;
        else if (uplift > 0 && level === 'positive') segs.sures++;
        else if (uplift >= -0.2 && uplift <= 0) segs.dormants++;
        else segs.perdus++;
    });

    var total = DATA.length;
    var palette = {
        persuadables: '#2563EB',
        sures: '#16A34A',
        dormants: '#D97706',
        perdus: '#DC2626'
    };
    var labels = {
        persuadables: 'Persuadables',
        sures: 'Valeurs S\u00fbres',
        dormants: 'Dormants',
        perdus: 'Perdus'
    };

    // SVG donut 130x130, r=48, stroke-width=18
    var R = 48, SW = 18;
    var circ = 2 * Math.PI * R;
    var order = ['persuadables', 'sures', 'dormants', 'perdus'];
    var offset = 0;
    var circles = '';

    order.forEach(function(key) {
        var pct = segs[key] / total;
        var arc = pct * circ;
        if (arc < 0.01) { offset += arc; return; }
        circles += '<circle cx="65" cy="65" r="' + R + '" fill="none"'
            + ' stroke="' + palette[key] + '"'
            + ' stroke-width="' + SW + '"'
            + ' stroke-dasharray="' + arc.toFixed(3) + ' ' + circ.toFixed(3) + '"'
            + ' stroke-dashoffset="-' + offset.toFixed(3) + '"'
            + ' stroke-linecap="butt"/>';
        offset += arc;
    });

    chartEl.innerHTML = '<svg viewBox="0 0 130 130" style="width:130px;height:130px;transform:rotate(-90deg);display:block">'
        + '<circle cx="65" cy="65" r="' + R + '" fill="none" stroke="#F0EDE8" stroke-width="' + SW + '"/>'
        + circles
        + '</svg>';

    if (legendEl) {
        legendEl.innerHTML = order.map(function(key) {
            var count = segs[key];
            var pct = Math.round(count / total * 100);
            return '<div class="ck-seg-leg-row">'
                + '<span class="ck-seg-leg-dot" style="background:' + palette[key] + '"></span>'
                + '<span class="ck-seg-leg-name">' + labels[key] + '</span>'
                + '<span class="ck-seg-leg-count">' + count + '</span>'
                + '<span class="ck-seg-leg-pct">' + pct + '%</span>'
                + '</div>';
        }).join('');
    }
}

// ── Sentiment Trend dual-line SVG (30 jours) ──
function renderSentimentTrend(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var DAYS = 30;
    var refDate = new Date('2026-04-02');
    var allKeys = [];
    for (var i = DAYS - 1; i >= 0; i--) {
        var d = new Date(refDate);
        d.setDate(d.getDate() - i);
        allKeys.push(d.toISOString().substring(0, 10));
    }

    var posMap = {}, negMap = {};
    DATA.forEach(function(r) {
        var key = (r.date || '').substring(0, 10);
        if (!key) return;
        var level = (r.sentiment && r.sentiment.level) ? r.sentiment.level : 'neutral';
        if (level === 'positive') posMap[key] = (posMap[key] || 0) + 1;
        if (level === 'negative') negMap[key] = (negMap[key] || 0) + 1;
    });

    var posData = allKeys.map(function(k) { return posMap[k] || 0; });
    var negData = allKeys.map(function(k) { return negMap[k] || 0; });

    var W = 560, H = 140, PL = 24, PR = 12, PT = 10, PB = 22;
    var W2 = W - PL - PR, H2 = H - PT - PB;
    var allVals = posData.concat(negData);
    var maxVal = Math.max.apply(null, allVals) || 1;

    function cx(i) { return PL + (i / Math.max(allKeys.length - 1, 1)) * W2; }
    function cy(v) { return PT + H2 - (v / maxVal) * H2; }

    function buildPath(data) {
        return data.map(function(v, i) {
            if (i === 0) return 'M ' + cx(i).toFixed(1) + ' ' + cy(v).toFixed(1);
            var cpx = ((cx(i - 1) + cx(i)) / 2).toFixed(1);
            return 'C ' + cpx + ' ' + cy(data[i - 1]).toFixed(1) + ' ' + cpx + ' ' + cy(v).toFixed(1) + ' ' + cx(i).toFixed(1) + ' ' + cy(v).toFixed(1);
        }).join(' ');
    }

    function buildArea(path, data) {
        return path + ' L ' + cx(data.length - 1).toFixed(1) + ' ' + (PT + H2).toFixed(1)
            + ' L ' + PL.toFixed(1) + ' ' + (PT + H2).toFixed(1) + ' Z';
    }

    var posPath = buildPath(posData);
    var negPath = buildPath(negData);
    var posArea = buildArea(posPath, posData);
    var negArea = buildArea(negPath, negData);

    // Grid horizontal lines
    var grids = '';
    for (var gi = 0; gi <= 3; gi++) {
        var gy = PT + (gi / 3) * H2;
        grids += '<line x1="' + PL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - PR) + '" y2="' + gy.toFixed(1)
            + '" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>';
    }

    // X labels: first, mid, last
    var xLabelIndices = [0, Math.floor(allKeys.length / 2), allKeys.length - 1];
    var xlabels = xLabelIndices.map(function(i) {
        var dt = new Date(allKeys[i]);
        var label = dt.getDate() + '/' + (dt.getMonth() + 1);
        return '<text x="' + cx(i).toFixed(1) + '" y="' + (H - 4) + '" fill="#A8A6A0" font-size="8"'
            + ' text-anchor="middle" font-family="DM Sans,sans-serif">' + label + '</text>';
    }).join('');

    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:100%;display:block">'
        + '<defs>'
        + '<linearGradient id="gradPos" x1="0" x2="0" y1="0" y2="1">'
        + '<stop offset="0%" stop-color="#16A34A" stop-opacity="0.08"/>'
        + '<stop offset="100%" stop-color="#16A34A" stop-opacity="0"/>'
        + '</linearGradient>'
        + '<linearGradient id="gradNeg" x1="0" x2="0" y1="0" y2="1">'
        + '<stop offset="0%" stop-color="#DC2626" stop-opacity="0.08"/>'
        + '<stop offset="100%" stop-color="#DC2626" stop-opacity="0"/>'
        + '</linearGradient>'
        + '</defs>'
        + grids
        + '<path d="' + posArea + '" fill="url(#gradPos)"/>'
        + '<path d="' + negArea + '" fill="url(#gradNeg)"/>'
        + '<path d="' + posPath + '" fill="none" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="' + negPath + '" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
        + xlabels
        + '</svg>';
}

// ── Team List ──
function renderTeamList(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    if (!DATA.length) {
        el.innerHTML = '<div class="ck-empty-state">Aucune donnée</div>';
        return;
    }

    // Agréger par seller_id ou ca
    var sellerMap = {};
    DATA.forEach(function(r) {
        var key = r.seller_id || r.ca || 'Inconnu';
        var name = r.ca || r.seller_id || 'Inconnu';
        if (!sellerMap[key]) sellerMap[key] = { name: name, count: 0, posCount: 0, negCount: 0, neuCount: 0 };
        sellerMap[key].count++;
        var level = (r.sentiment && r.sentiment.level) ? r.sentiment.level : 'neutral';
        if (level === 'positive') sellerMap[key].posCount++;
        else if (level === 'negative') sellerMap[key].negCount++;
        else sellerMap[key].neuCount++;
    });

    var sorted = Object.values(sellerMap)
        .sort(function(a, b) { return b.count - a.count; })
        .slice(0, 5);

    el.innerHTML = sorted.map(function(s) {
        var parts = s.name.trim().split(/\s+/);
        var initials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : s.name.substring(0, 2).toUpperCase();
        var name = s.name.length > 24 ? s.name.substring(0, 23) + '\u2026' : s.name;

        var dominant = s.posCount >= s.negCount && s.posCount >= s.neuCount ? 'positive'
            : s.negCount >= s.posCount && s.negCount >= s.neuCount ? 'negative' : 'neutral';
        var dotColor = dominant === 'positive' ? '#16A34A' : dominant === 'negative' ? '#DC2626' : '#D4D0CA';
        var dotLabel = dominant === 'positive' ? 'Positif' : dominant === 'negative' ? 'N\u00e9gatif' : 'Neutre';

        return '<div class="ck-team-row">'
            + '<div class="ck-team-avatar">' + initials + '</div>'
            + '<div class="ck-team-info">'
            + '<div class="ck-team-name">' + name + '</div>'
            + '<div class="ck-team-meta">' + s.count + ' note' + (s.count > 1 ? 's' : '') + '</div>'
            + '</div>'
            + '<div class="ck-team-badge">'
            + '<span class="ck-team-badge-dot" style="background:' + dotColor + '"></span>'
            + dotLabel
            + '</div>'
            + '</div>';
    }).join('');
}

// ── Alert Feed ──
function renderAlertFeed(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var today = '02/04/2026';
    var alerts = [];
    var privacyAvg = Math.round(STATS.privacyAvg || 0);

    // Clients à risque négatifs
    var riskNeg = DATA.filter(function(r) { return r.sentiment && r.sentiment.level === 'negative'; }).length;
    if (riskNeg > 0) {
        alerts.push({ level: 'crit', text: riskNeg + ' client' + (riskNeg > 1 ? 's' : '') + ' négatif' + (riskNeg > 1 ? 's' : '') + ' — relance urgente', date: today });
    }

    // RGPD sous seuil
    if (privacyAvg < 70) {
        alerts.push({ level: 'warn', text: 'Conformité RGPD sous seuil (' + privacyAvg + '%) — action requise', date: today });
    }

    // Couverture faible
    var now = new Date('2026-04-02');
    var recentCount = DATA.filter(function(r) {
        if (!r.date) return false;
        return (now - new Date(r.date)) / 86400000 < 30;
    }).length;
    var coveragePct = DATA.length ? Math.round(recentCount / DATA.length * 100) : 100;
    if (coveragePct < 50 && DATA.length > 0) {
        alerts.push({ level: 'warn', text: coveragePct + '% seulement du portefeuille couvert (30j)', date: today });
    }

    // Vendeurs RGPD critiques
    var critSellers = PRIVACY_SCORES.filter(function(p) { return p.score < 60; });
    critSellers.slice(0, 2).forEach(function(p) {
        var name = p.ca || p.seller_id || 'Vendeur';
        alerts.push({ level: 'crit', text: name + ' — risque RGPD élevé (' + Math.round(p.score) + '%)', date: today });
    });

    // Clients sensibles (sensitiveCount > 2)
    var sensitiveCount = DATA.filter(function(r) { return r.sensitiveCount > 2; }).length;
    if (sensitiveCount > 0 && !alerts.find(function(a) { return a.text.indexOf('négatif') > -1; })) {
        alerts.push({ level: 'warn', text: sensitiveCount + ' note' + (sensitiveCount > 1 ? 's' : '') + ' avec données sensibles élevées', date: today });
    }

    if (alerts.length === 0) {
        if (DATA.length === 0) {
            el.innerHTML = '<div class="ck-alert-row">'
                + '<span class="ck-alert-dot warn"></span>'
                + '<div class="ck-alert-body">'
                + '<div class="ck-alert-text">Aucune donnée chargée</div>'
                + '<div class="ck-alert-date">' + today + '</div>'
                + '</div>'
                + '</div>';
        } else {
            el.innerHTML = '<div class="ck-alert-row">'
                + '<span class="ck-alert-dot ok"></span>'
                + '<div class="ck-alert-body">'
                + '<div class="ck-alert-text">Aucune alerte active — portefeuille sain</div>'
                + '<div class="ck-alert-date">' + today + '</div>'
                + '</div>'
                + '</div>';
        }
        return;
    }

    el.innerHTML = alerts.slice(0, 5).map(function(a) {
        return '<div class="ck-alert-row">'
            + '<span class="ck-alert-dot ' + a.level + '"></span>'
            + '<div class="ck-alert-body">'
            + '<div class="ck-alert-text">' + a.text + '</div>'
            + '<div class="ck-alert-date">' + a.date + '</div>'
            + '</div>'
            + '</div>';
    }).join('');
}

// Stubs preserved for any external callers
function renderSparkline(id, data, color) {}
function renderTopVendeurs() {}
function renderStoreList() {}
function renderSentimentDonut() {}
function renderRGPDDonut() {}
function renderEvolutionChart(days) {}
function renderTagsCockpit() {}
function renderCockpitTags() {}

// ===== RENDER: CLIENTS (shared) =====
function renderClients(filteredData) {
    const data = filteredData || DATA;

    // Churn Alert section
    renderChurnAlert();

    // Légende catégories
    const legend = $('tagLegend');
    if (legend) {
        legend.innerHTML = Object.entries(CAT_NAMES).map(([k, v]) =>
            `<div class="legend-item"><span class="legend-dot" style="background:${legendColors[k] || '#888'}"></span>${v}</div>`
        ).join('');
    }

    // Kanban
    if (typeof renderKanban === 'function') renderKanban(data);

    // Avatar strip
    if (typeof renderAvatarStrip === 'function') renderAvatarStrip(data);

    // Stats bar
    if (typeof renderStatsBar === 'function') renderStatsBar();

    // Masquer l'ancien grid si kanban présent
    const kanbanGrid = $('kanban-grid');
    const personGrid = $('personGrid');
    if (kanbanGrid && personGrid) personGrid.style.display = 'none';
    if (!kanbanGrid && personGrid) personGrid.style.display = '';

    // Recherche — filtre kanban + grid
    const search = $('personSearch');
    if (search) {
        search.oninput = e => {
            const q = e.target.value.toLowerCase();
            const base = filteredData || DATA;
            const result = base.filter(p =>
                !q ||
                (p.ca || '').toLowerCase().includes(q) ||
                p.tags.some(t => t.t.toLowerCase().includes(q)) ||
                (p.clean || '').toLowerCase().includes(q)
            );
            if (typeof renderKanban === 'function') renderKanban(result);
            renderGrid(q, base);
        };
    }

    // Fallback grid si pas de kanban
    if (!kanbanGrid) renderGrid('', data);
}

function renderGrid(filter, sourceData) {
    filter = filter || '';
    const g = $('personGrid');
    if (!g) return;
    g.innerHTML = '';
    const f = filter.toLowerCase();
    const base = sourceData || DATA;
    const filtered = base.filter(p => !f || (p.ca || '').toLowerCase().includes(f) || p.tags.some(t => t.t.toLowerCase().includes(f)) || (p.clean || '').toLowerCase().includes(f));

    if (filtered.length === 0) {
        g.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucun client trouve.</p>';
        return;
    }

    filtered.forEach(p => {
        const cats = {};
        p.tags.forEach(t => { if (!cats[t.c]) cats[t.c] = []; cats[t.c].push(t.t); });

        let html = `<div class="person-header"><span class="person-id">${p.ca || p.id}</span><div class="person-meta"><span>${p.lang}</span><span>${p.date}</span><span>${p.tags.length} tags</span></div></div>`;

        if (Object.keys(cats).length === 0) html += '<div class="no-tags">Aucun tag détecté</div>';
        else {
            Object.entries(cats).forEach(([c, tags]) => {
                html += `<div class="tag-section"><div class="tag-section-title">${CAT_NAMES[c] || c}</div><div class="tag-row">${tags.map(t => `<span class="tag ${c}">${t}</span>`).join('')}</div></div>`;
            });
        }

        if (p.nba && p.nba.length > 0) {
            html += `<div class="tag-section"><div class="tag-section-title">Next Best Action</div><div class="tag-row">${p.nba.slice(0, 2).map(a => `<span class="tag nba">🎯 ${a.action.substring(0, 50)}...</span>`).join('')}</div></div>`;
        }

        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = html;
        g.appendChild(card);
    });
}

// ===== RENDER: KANBAN CLIENTS =====
function renderKanban(data) {
    if (!data || !data.length) return;

    const cols = { nouveaux: [], suivi: [], nbaDone: [], prioritaires: [] };

    data.forEach(client => {
        const score = client.sentiment?.score || 50;
        const hasNba = client.nba && client.nba.length > 0;
        const isChurnRisk = score < 50;

        if (isChurnRisk) {
            cols.prioritaires.push(client);
        } else if (hasNba) {
            cols.nbaDone.push(client);
        } else {
            const daysSince = Math.floor((Date.now() - new Date(client.date || Date.now())) / 86400000);
            if (daysSince <= 3) cols.nouveaux.push(client);
            else cols.suivi.push(client);
        }
    });

    const setCount = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
    setCount('count-nouveaux', cols.nouveaux.length);
    setCount('count-suivi', cols.suivi.length);
    setCount('count-nba', cols.nbaDone.length);
    setCount('count-prioritaires', cols.prioritaires.length);

    renderKanbanCol('col-nouveaux', cols.nouveaux);
    renderKanbanCol('col-suivi', cols.suivi);
    renderKanbanCol('col-nba-done', cols.nbaDone);
    renderKanbanCol('col-prioritaires', cols.prioritaires);
}

function renderKanbanCol(containerId, clients) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    clients.slice(0, 6).forEach((client, i) => {
        const score = client.sentiment?.score || 50;
        const scoreClass = getScoreClass(score);
        const progressClass = getProgressClass(score);
        const top3tags = (client.tags || []).slice(0, 3);
        const p = getAvatarPalette(client.ca);
        const initials = getInitials(client.ca);

        const card = document.createElement('div');
        card.className = 'client-card';
        card.style.animationDelay = `${i * 40}ms`;
        card.innerHTML = `
      <div class="card-top">
        <div class="client-av" style="width:30px;height:30px;background:${p.bg};color:${p.color}">${initials}</div>
        <div class="card-info">
          <div class="card-name">${client.ca || 'Client inconnu'}</div>
          <div class="card-meta">${client.lang || '?'} · ${client.store || '?'}</div>
        </div>
        <div class="card-actions">
          <div class="card-action-btn ${client._checked ? 'done' : ''}" data-action="check" data-id="${client.id}">
            <svg viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div class="card-action-btn" data-action="calendar" data-id="${client.id}">
            <svg viewBox="0 0 10 10"><rect x="1" y="2" width="8" height="7" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M3 2V1M7 2V1M1 5h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
        </div>
      </div>
      ${top3tags.length ? `<div class="card-tags">${top3tags.map(buildTag).join('')}</div>` : ''}
      <div class="card-bottom">
        <span class="score-badge ${scoreClass}">${score}</span>
        <div class="progress-mini"><div class="progress-fill ${progressClass}" style="width:${score}%"></div></div>
      </div>
    `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('[data-action]')) return;
            document.querySelectorAll('.client-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            openDetailPanel(client);
        });

        const checkBtn = card.querySelector('[data-action="check"]');
        const calBtn = card.querySelector('[data-action="calendar"]');

        if (checkBtn) {
            checkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                client._checked = !client._checked;
                checkBtn.classList.toggle('done', client._checked);
                showToast(
                    client._checked ? `${client.ca} — marqué comme traité` : `${client.ca} — remis en attente`,
                    client._checked ? 'success' : 'info'
                );
            });
        }

        if (calBtn) {
            calBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window._selectedClient = client;
                if (typeof navigateTo === 'function') navigateTo('followup');
                showToast(`Follow-up ouvert pour ${client.ca}`, 'info');
            });
        }

        container.appendChild(card);
    });

    if (clients.length > 6) {
        const more = document.createElement('div');
        more.className = 'kanban-more';
        more.style.cssText = 'font-size:11px;color:var(--text-secondary);text-align:center;padding:6px 4px;letter-spacing:0.04em;cursor:pointer;';
        more.textContent = `+ ${clients.length - 6} autre${clients.length - 6 > 1 ? 's' : ''}`;
        container.appendChild(more);
    }

    const addBtn = document.createElement('div');
    addBtn.className = 'add-card';
    addBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M7 2v10M2 7h10"/></svg> Ajouter`;
    addBtn.addEventListener('click', () => {
        if (typeof navigateTo === 'function') navigateTo('v-home');
        showToast('Dictez une note pour ajouter un client', 'info');
    });
    container.appendChild(addBtn);
}

// ===== DETAIL PANEL =====
function openDetailPanel(client) {
    const wrap = document.getElementById('col-detail-wrap');
    if (!wrap) return;

    const p = getAvatarPalette(client.ca);
    const initials = getInitials(client.ca);
    const score = client.sentiment?.score || 50;
    const scoreClass = getScoreClass(score);
    const tags = (client.tags || []).slice(0, 8);
    const nbaItems = (client.nba || []).slice(0, 3);
    const nbaBgColors = ['#1A1A1A', '#2A4A8A', '#2A5A2A'];

    const sentLevel = client.sentiment?.level || 'neutral';
    const sentScore = client.sentiment?.score || 50;
    const sentPos = sentLevel === 'positive' ? sentScore : Math.max(10, 100 - sentScore - 20);
    const sentNeg = sentLevel === 'negative' ? sentScore : Math.max(0, sentScore - 70);
    const sentNeu = Math.max(0, 100 - sentPos - sentNeg);

    wrap.innerHTML = `
    <div class="col-header">
      ${client.ca}
      <span class="col-count" style="background:#1A1A1A;color:#fff">actif</span>
    </div>
    <div class="detail-panel">
      <div class="dp-header">
        <div class="dp-avatar" style="background:${p.bg};color:${p.color}">${initials}</div>
        <div>
          <div class="dp-name">${client.ca}</div>
          <div class="dp-sub">${client.store || ''} · ${client.lang || ''} · Score ${score}</div>
        </div>
        <button class="dp-close" onclick="closeDetailPanel()">
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M2 2l6 6M8 2l-6 6"/>
          </svg>
        </button>
      </div>
      <div class="dp-body">

        <div>
          <div class="dp-section-label">Tags détectés</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${tags.map(buildTag).join('') || '<span style="font-size:11px;color:var(--text-muted)">Aucun tag</span>'}
          </div>
        </div>

        <div>
          <div class="dp-section-label">Next Best Actions</div>
          <div>
            ${nbaItems.length ? nbaItems.map((nba, i) => `
              <div class="nba-item">
                <div class="nba-num" style="background:${nbaBgColors[i] || '#1A1A1A'}">${i + 1}</div>
                <div class="nba-text">${nba.action || nba}</div>
              </div>
            `).join('') : '<span style="font-size:11px;color:var(--text-muted)">Aucune NBA générée</span>'}
          </div>
        </div>

        <div>
          <div class="dp-section-label">Sentiment</div>
          <div class="sent-row">
            <span class="sent-label">Positif</span>
            <div class="sent-bar-bg"><div class="sent-bar-fill" style="width:${sentPos}%;background:var(--green-soft)"></div></div>
            <span class="sent-value" style="color:var(--green)">${sentPos}</span>
          </div>
          <div class="sent-row">
            <span class="sent-label">Neutre</span>
            <div class="sent-bar-bg"><div class="sent-bar-fill" style="width:${sentNeu}%;background:var(--border-strong)"></div></div>
            <span class="sent-value" style="color:var(--text-muted)">${sentNeu}</span>
          </div>
          <div class="sent-row">
            <span class="sent-label">Négatif</span>
            <div class="sent-bar-bg"><div class="sent-bar-fill" style="width:${sentNeg}%;background:var(--red)"></div></div>
            <span class="sent-value" style="color:var(--red)">${sentNeg}</span>
          </div>
        </div>

        <button class="dp-cta" onclick="renderSmartFollowup(window._selectedClient)">
          ✦ Générer Follow-up IA
        </button>

        <button class="dp-journey-btn" onclick="openJourneyMap('${client.id}')">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s3-7 7-7 7 7 7 7"/><circle cx="8" cy="5" r="2"/></svg>
            Voir le parcours client
        </button>

      </div>
    </div>
  `;

    window._selectedClient = client;
}

function closeDetailPanel() {
    const wrap = document.getElementById('col-detail-wrap');
    if (!wrap) return;
    renderKanban(window.DATA || []);
}

// ===== AVATAR STRIP =====
function renderAvatarStrip(data) {
    const container = document.getElementById('clients-avatar-strip');
    if (!container || !data) return;

    const recent = data.slice(0, 10); // Slightly more avatars for better strip fill
    const stripHTML = recent.map(client => {
        const p = getAvatarPalette(client.ca);
        const initials = getInitials(client.ca);
        const hasAlert = (client.sentiment?.score || 50) < 50;
        const hasNba = client.nba && client.nba.length > 0;
        const badgeClass = hasAlert ? 'urgent' : hasNba ? 'info' : '';
        const badgeCount = hasAlert ? '!' : hasNba ? client.nba.length : '';

        return `
      <div class="av-strip-item" onclick="selectClientFromStrip('${client.id}')">
        <div class="av-circle" style="background:${p.bg};color:${p.color}">
          ${initials}
          ${badgeCount ? `<span class="av-badge ${badgeClass}">${badgeCount}</span>` : ''}
        </div>
        <span class="av-strip-name">${(client.ca || '').split(' ')[1] || client.ca}</span>
      </div>
    `;
    }).join('');

    container.innerHTML = `
    <button class="avatar-strip-arrow left" onclick="scrollAvatarStrip(-120)">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 12l-4-4 4-4"/></svg>
    </button>
    <div class="av-strip-inner" id="av-strip-inner" style="display:flex;gap:16px;overflow:hidden;padding:4px">
        ${stripHTML}
    </div>
    <button class="avatar-strip-arrow right" onclick="scrollAvatarStrip(120)">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 12l4-4-4-4"/></svg>
    </button>
  `;
}

// Global scroll function for avatar strip
window.scrollAvatarStrip = function (dist) {
    const el = document.getElementById('av-strip-inner');
    if (el) el.scrollBy({ left: dist, behavior: 'smooth' });
}

function selectClientFromStrip(clientId) {
    const client = (window.DATA || []).find(c => c.id === clientId);
    if (client) openDetailPanel(client);
}

// ===== STATS BAR =====
function renderStatsBar(stats) {
    const container = document.getElementById('clients-stats-bar');
    if (!container) return;

    const s = stats || window.STATS || {};
    const data = window.DATA || [];

    const last8weeks = Array(8).fill(0);
    data.forEach(client => {
        const date = new Date(client.date || client.created_at);
        const weeksAgo = Math.floor((Date.now() - date) / (7 * 86400000));
        if (weeksAgo >= 0 && weeksAgo < 8) last8weeks[7 - weeksAgo]++;
    });
    const maxBar = Math.max(...last8weeks, 1);

    const bars = last8weeks.map((v, i) => {
        const h = Math.max(4, Math.round((v / maxBar) * 24));
        const isCurrent = i === 7;
        return `<div class="spark-bar ${isCurrent ? 'current' : ''}" style="height:${h}px"></div>`;
    }).join('');

    const privacyAvg = s.privacyAvg || (s.rgpd ? Math.round((1 - s.rgpd / Math.max(s.clients, 1)) * 100) : 88);
    const sentimentAvg = data.length
        ? Math.round(data.reduce((acc, c) => acc + (c.sentiment?.score || 50), 0) / data.length)
        : 0;

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;gap:32px;width:100%;max-width:1200px;margin:0 auto">
        <div class="stat-item">
          <span class="stat-label">Clients</span>
          <span class="stat-value">${s.clients || data.length || 0}</span>
          <span class="stat-delta" style="color:var(--green)">↑ actifs</span>
        </div>
        <div class="stats-sep"></div>
        <div class="stat-item">
          <span class="stat-label">Privacy</span>
          <span class="stat-value">${privacyAvg}%</span>
          <span class="stat-delta" style="color:var(--green)">↑ conforme</span>
        </div>
        <div class="stats-sep"></div>
        <div class="stat-item">
          <span class="stat-label">NBA</span>
          <span class="stat-value">${s.nba || 0}</span>
          <span class="stat-delta" style="color:var(--text-muted)">→ générés</span>
        </div>
        <div class="stats-sep"></div>
        <div class="stat-item">
          <span class="stat-label">Sentiment</span>
          <span class="stat-value">${sentimentAvg}%</span>
          <span class="stat-delta" style="color:${sentimentAvg > 60 ? 'var(--green)' : 'var(--amber)'}">
            ${sentimentAvg > 60 ? '↑ positif' : '→ neutre'}
          </span>
        </div>
        <div class="stats-sep"></div>
        <div class="stat-item" style="flex:none">
          <div class="stat-label" style="margin-bottom:4px">Activité 8 sem.</div>
          <div class="sparkline">${bars}</div>
        </div>
    </div>
  `;
}

// ===== UPLIFT SCORING ALGORITHM =====
function calculateUpliftScore(client) {
    // Formule : P(Achat|Action) - P(Achat|Pas d'Action)
    // Simplifie : (sentiment/100) * tagDensity * eventBoost - baseline

    // Extract sentiment safely
    let sentimentScore = 50;
    if (client.sentiment && typeof client.sentiment === 'object') {
        sentimentScore = client.sentiment.score || 50;
    }

    const tagDensity = Math.min(1, (Array.isArray(client.tags) ? client.tags.length : 0) / 10);
    const contextTags = Array.isArray(client.tags) ? client.tags.filter(t => t.c === 'contexte') : [];
    const eventBoost = contextTags.length > 0 ? 1.5 : 1.0;
    const baseline = 0.3; // 30% achètent sans intervention

    const upliftScore = (sentimentScore / 100) * tagDensity * eventBoost - baseline;
    return Math.max(-1, Math.min(1, upliftScore));
}

function getUpliftSegment(upliftScore, sentimentLevel) {
    if (upliftScore > 0.3 && sentimentLevel !== 'negative') {
        return { segment: 'persuadables', label: 'Persuadables', color: '#10b981' };
    } else if (upliftScore > 0 && sentimentLevel === 'positive') {
        return { segment: 'valeurs-sures', label: 'Valeurs Sûres', color: '#3b82f6' };
    } else if (upliftScore < -0.2 || sentimentLevel === 'negative') {
        return { segment: 'cas-perdus', label: 'Cas Perdus', color: '#ef4444' };
    } else {
        return { segment: 'chiens-dormants', label: 'Chiens Dormants', color: '#fb923c' };
    }
}

// ===== NBA ACTION HELPERS =====
function getActionIcon(actionText) {
    const t = (actionText || '').toLowerCase();
    if (/appel|téléphon|call|rappel/.test(t))
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.63 1.2 2 2 0 012.62 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.1 6.1l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`;
    if (/email|mail|envoyer|message|sms|whatsapp/.test(t))
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
    if (/invit|événement|event|preview|vip|soirée/.test(t))
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    if (/produit|recommand|suggér|sac|montre|bijou|maroquin/.test(t))
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`;
    if (/visite|rendez-vous|rdv|passage|boutique/.test(t))
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    if (/cadeau|offrir|gift/.test(t))
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>`;
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
}

function getActionCategory(actionText) {
    const t = (actionText || '').toLowerCase();
    if (/appel|téléphon|call|rappel/.test(t)) return 'Appel';
    if (/whatsapp|sms/.test(t)) return 'Message';
    if (/email|mail/.test(t)) return 'Email';
    if (/invit|événement|preview|vip|soirée/.test(t)) return 'Événement';
    if (/produit|recommand|sac|montre|bijou|maroquin/.test(t)) return 'Produit';
    if (/visite|rendez-vous|rdv|boutique/.test(t)) return 'Visite';
    if (/cadeau|offrir/.test(t)) return 'Cadeau';
    return 'Action';
}

// ===== RENDER: NBA WITH UPLIFT =====
function renderNBA() {
    const grid = $('nbaGrid');
    if (!grid) return;
    grid.innerHTML = ''; // FIX: clear before render to prevent duplication

    const withNBA = DATA.filter(p => p.nba && Array.isArray(p.nba) && p.nba.length > 0);

    if (withNBA.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><p>Aucune action NBA disponible.<br>Ajoutez des clients via la dictée vocale.</p></div>';
        return;
    }

    const clientsWithUplift = withNBA.map(client => {
        const upliftScore = calculateUpliftScore(client);
        const sentimentLevel = (client.sentiment && typeof client.sentiment === 'object') ? client.sentiment.level : 'neutral';
        return { ...client, upliftScore, segment: getUpliftSegment(upliftScore, sentimentLevel || 'neutral') };
    });

    const segmentCounts = {
        'all': clientsWithUplift.length,
        'persuadables': clientsWithUplift.filter(c => c.segment.segment === 'persuadables').length,
        'valeurs-sures': clientsWithUplift.filter(c => c.segment.segment === 'valeurs-sures').length,
        'chiens-dormants': clientsWithUplift.filter(c => c.segment.segment === 'chiens-dormants').length,
        'cas-perdus': clientsWithUplift.filter(c => c.segment.segment === 'cas-perdus').length
    };

    const segments = [
        { key: 'all', label: 'Tous', desc: `${clientsWithUplift.length} clients`, color: '#B8965A', icon: '◈' },
        { key: 'persuadables', label: 'Persuadables', desc: 'ROI élevé', color: '#10b981', icon: '↑' },
        { key: 'valeurs-sures', label: 'Valeurs Sûres', desc: 'Achètent naturellement', color: '#3b82f6', icon: '✓' },
        { key: 'chiens-dormants', label: 'À Réveiller', desc: 'Approche douce requise', color: '#fb923c', icon: '◎' },
        { key: 'cas-perdus', label: 'Cas Perdus', desc: 'Ne pas solliciter', color: '#ef4444', icon: '↓' }
    ];

    const header = document.createElement('div');
    header.className = 'nba-header';
    header.innerHTML = `
        <div class="nba-segments">
            ${segments.map(s => `
                <button class="nba-seg-btn ${s.key === 'all' ? 'active' : ''}" data-filter="${s.key}" style="--seg-color:${s.color}">
                    <span class="nba-seg-icon">${s.icon}</span>
                    <span class="nba-seg-count">${segmentCounts[s.key]}</span>
                    <span class="nba-seg-label">${s.label}</span>
                    <span class="nba-seg-desc">${s.desc}</span>
                </button>
            `).join('')}
        </div>
    `;

    const container = document.createElement('div');
    container.className = 'nba-container';
    container.appendChild(header);

    const gridEl = document.createElement('div');
    gridEl.className = 'nba-cards-grid';
    gridEl.id = 'nbaGridContent';

    const sorted = clientsWithUplift.sort((a, b) => b.upliftScore - a.upliftScore);
    const typeLabels = { immediate: 'Immédiat', short_term: 'Court terme', long_term: 'Long terme' };
    const typeClasses = { immediate: 'immediate', short_term: 'shortterm', long_term: 'longterm' };

    sorted.forEach(p => {
        const tags = Array.isArray(p.tags) ? p.tags : [];
        const nbaList = Array.isArray(p.nba) ? p.nba : [];
        if (nbaList.length === 0) return;

        const upliftPct = Math.abs((p.upliftScore * 100)).toFixed(0);
        const upliftSign = p.upliftScore >= 0 ? '+' : '-';
        const roiLabel = p.upliftScore > 0.3 ? 'Élevé' : p.upliftScore > 0 ? 'Moyen' : 'Faible';
        const sentScore = (p.sentiment && p.sentiment.score) ? p.sentiment.score : 50;
        const av = getAvatarPalette(p.ca);
        const initials = getInitials(p.ca);
        const roi = estimateClientROI(p);

        const card = document.createElement('div');
        card.className = `nba-card segment-${p.segment.segment}`;
        card.setAttribute('data-segment', p.segment.segment);
        card.innerHTML = `
            <div class="nba-card-stripe" style="background:${p.segment.color}"></div>
            <div class="nba-card-body">
                <div class="nba-card-head">
                    <div class="nba-client-av" style="background:${av.bg};color:${av.color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;font-family:var(--font-display);flex-shrink:0">${initials}</div>
                    <div class="nba-card-identity">
                        <span class="nba-client-name">${p.ca || p.id}</span>
                        <span class="nba-seg-pill" style="color:${p.segment.color};border-color:${p.segment.color}20;background:${p.segment.color}10">${p.segment.label}</span>
                    </div>
                </div>

                <div class="nba-info-core">
                    <div class="nba-kpis">
                        <div class="nba-kpi">
                            <span class="nba-kpi-val">${upliftSign}${upliftPct}%</span>
                            <span class="nba-kpi-lbl">Uplift</span>
                        </div>
                        <div class="nba-kpi">
                            <span class="nba-kpi-val">${roiLabel}</span>
                            <span class="nba-kpi-lbl">ROI</span>
                        </div>
                        <div class="nba-kpi">
                            <span class="nba-kpi-val">${sentScore}%</span>
                            <span class="nba-kpi-lbl">Sentiment</span>
                        </div>
                    </div>

                    ${tags.length > 0 ? `
                    <div class="nba-tag-strip">
                        ${tags.slice(0, 5).map(t => `<span class="nba-tag-pill">${t.t}</span>`).join('')}
                        ${tags.length > 5 ? `<span class="nba-tag-more">+${tags.length - 5}</span>` : ''}
                    </div>
                    ` : ''}
                </div>

                <div class="nba-actions-list">
                    ${nbaList.map((a, i) => {
            const cls = typeClasses[a.type] || 'shortterm';
            const icon = getActionIcon(a.action);
            const cat = getActionCategory(a.action);
            return `<div class="nba-action-row">
                            <span class="nba-action-num">${i + 1}</span>
                            <div class="nba-action-content">
                                <div class="nba-action-meta">
                                    <span class="nba-action-icon">${icon}</span>
                                    <span class="nba-action-cat">${cat}</span>
                                    <span class="nba-action-badge ${cls}">${typeLabels[a.type] || a.type}</span>
                                </div>
                                <span class="nba-action-text">${a.action}</span>
                            </div>
                        </div>`;
        }).join('')}
                </div>

                <div class="nba-roi-badge">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v14M5 4h4.5a2.5 2.5 0 010 5H5M5 9h5a2.5 2.5 0 010 5H5"/></svg>
                    €${roi.min.toLocaleString()} – €${roi.max.toLocaleString()}
                </div>

                <div class="nba-card-footer">
                    <button class="nba-followup-btn" data-client-id="${p.id}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Générer Follow-up
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.nba-followup-btn').addEventListener('click', () => {
            window._selectedClient = p;
            if (typeof navigateTo === 'function') navigateTo('followup');
            showToast(`Follow-up ouvert pour ${p.ca}`, 'info');
        });

        gridEl.appendChild(card);
    });

    container.appendChild(gridEl);
    grid.appendChild(container);

    container.querySelectorAll('.nba-seg-btn').forEach(btn => {
        btn.onclick = () => {
            container.querySelectorAll('.nba-seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            gridEl.querySelectorAll('.nba-card').forEach(card => {
                card.style.display = (filter === 'all' || card.getAttribute('data-segment') === filter) ? '' : 'none';
            });
        };
    });
}

// ===== ENHANCED PRIVACY COACHING =====
function getEnhancedCoaching(violations, level) {
    const coaching = [];
    const microLearning = [];

    if (violations.orientation > 0) {
        coaching.push({
            priority: 'critical',
            message: `${violations.orientation} mention(s) d'orientation. Ne JAMAIS demander ou noter l'orientation sexuelle d'un client.`,
            action: 'Supprimer immédiatement ces mentions et revoir le protocole RGPD.'
        });
        microLearning.push({
            title: 'Données sensibles : Orientation',
            duration: '1min',
            icon: '🔒',
            url: '#module-orientation'
        });
    }

    if (violations.politics > 0) {
        coaching.push({
            priority: 'critical',
            message: `${violations.politics} mention(s) d'opinion politique. Interdites par le RGPD.`,
            action: 'Nettoyer les notes et rappeler la neutralité obligatoire.'
        });
        microLearning.push({
            title: 'RGPD : Opinions politiques',
            duration: '1min',
            icon: '⚖️',
            url: '#module-politics'
        });
    }

    if (violations.religion > 0) {
        coaching.push({
            priority: 'critical',
            message: `${violations.religion} mention(s) religieuse(s). Catégorie sensible interdite.`,
            action: 'Retirer ces informations et former le conseiller.'
        });
        microLearning.push({
            title: 'Respect des convictions',
            duration: '1min',
            icon: '🕊️',
            url: '#module-religion'
        });
    }

    if (violations.health > 0) {
        coaching.push({
            priority: 'high',
            message: `${violations.health} mention(s) de santé. Données médicales non pertinentes pour la vente.`,
            action: 'Anonymiser et rappeler le périmètre autorisé.'
        });
        microLearning.push({
            title: 'Données de santé : Limites',
            duration: '1min',
            icon: '🏥',
            url: '#module-health'
        });
    }

    if (level === 'critical') {
        coaching.push({
            priority: 'critical',
            message: 'Score critique : risque d\'amende jusqu\'à 4% du CA groupe LVMH.',
            action: 'Audit immédiat + formation obligatoire dans 48h.'
        });
    } else if (level === 'warning') {
        coaching.push({
            priority: 'medium',
            message: 'Score en zone de vigilance. Renforcer les bonnes pratiques.',
            action: 'Révision du protocole de prise de notes recommandée.'
        });
    }

    return { coaching, microLearning };
}

// ===== RENDER: PRIVACY SCORE WITH ENHANCEMENTS =====
function renderPrivacy() {
    const overview = $('privacyOverview');
    if (!overview) return;

    // Aggregate violation types
    const violationsByType = {
        orientation: 0,
        politics: 0,
        religion: 0,
        health: 0,
        other: 0
    };

    PRIVACY_SCORES.forEach(p => {
        violationsByType.orientation += p.violations_detail?.orientation || 0;
        violationsByType.politics += p.violations_detail?.politics || 0;
        violationsByType.religion += p.violations_detail?.religion || 0;
        violationsByType.health += p.violations_detail?.health || 0;
        violationsByType.other += Math.max(0, p.violations -
            (p.violations_detail?.orientation || 0) -
            (p.violations_detail?.politics || 0) -
            (p.violations_detail?.religion || 0) -
            (p.violations_detail?.health || 0));
    });

    const totalViolations = PRIVACY_SCORES.reduce((s, p) => s + p.violations, 0);
    const criticalCount = PRIVACY_SCORES.filter(p => p.level === 'critical').length;
    const avgLevel = STATS.privacyAvg >= 90 ? 'excellent' : STATS.privacyAvg >= 75 ? 'good' : STATS.privacyAvg >= 60 ? 'warning' : 'critical';
    const levelLabels = { excellent: 'Excellent', good: 'Bon', warning: 'Attention', critical: 'Critique' };
    const levelLabel = levelLabels[avgLevel] || avgLevel;
    const scoreColors = { excellent: '#10b981', good: '#3b82f6', warning: '#f59e0b', critical: '#ef4444' };
    const scoreColor = scoreColors[avgLevel] || '#888880';

    // Calculate trend — compare première moitié vs score actuel (sans Math.random)
    let previousAvg = STATS.privacyAvg;
    const scores = Object.values(PRIVACY_SCORES || {});
    if (scores.length >= 2) {
        const half = Math.floor(scores.length / 2);
        const firstHalf = scores.slice(0, half);
        const firstHalfSum = firstHalf.reduce(function (s, v) { return s + (v.score || v || 0); }, 0);
        previousAvg = firstHalf.length > 0 ? firstHalfSum / firstHalf.length : STATS.privacyAvg;
    }
    const trend = previousAvg ? Math.round(STATS.privacyAvg - previousAvg) : 0;
    const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
    const trendText = trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;

    const violationBreakdownHTML = totalViolations > 0 ? `
        <div class="prv-violations">
            <div class="prv-violations-title">Répartition des violations RGPD</div>
            <div class="prv-violations-bars">
                ${Object.entries(violationsByType).filter(([, v]) => v > 0).map(([type, count]) => {
        const vLabels = { orientation: 'Orientation sexuelle', politics: 'Politique', religion: 'Religion', health: 'Santé', other: 'Autres' };
        const vColors = { orientation: '#ef4444', politics: '#f97316', religion: '#fb923c', health: '#fbbf24', other: '#94a3b8' };
        const pct = Math.round((count / totalViolations) * 100);
        return `
                    <div class="prv-vbar-row">
                        <span class="prv-vbar-label">${vLabels[type] || type}</span>
                        <div class="prv-vbar-track">
                            <div class="prv-vbar-fill" style="width:${pct}%;background:${vColors[type] || '#94a3b8'}"></div>
                        </div>
                        <span class="prv-vbar-count">${count}</span>
                    </div>
                `;
    }).join('')}
            </div>
        </div>
    ` : '';

    overview.innerHTML = `
        <div class="prv-header">
            <div class="prv-header-text">
                <h2 class="prv-title">Privacy Score</h2>
                <p class="prv-subtitle">Conformité RGPD · Analyse par Client Advisor</p>
            </div>
            <div class="prv-global-score">
                <div class="prv-score-num" style="color:${scoreColor}">${STATS.privacyAvg}<span class="prv-score-pct">%</span></div>
                <div class="prv-score-level prv-level-${avgLevel}">${levelLabel}</div>
                <div class="prv-trend">${trendIcon} ${trendText} vs période précédente</div>
            </div>
        </div>
        <div class="prv-kpis">
            <div class="prv-kpi">
                <div class="prv-kpi-val">${PRIVACY_SCORES.length}</div>
                <div class="prv-kpi-lbl">Vendeurs analysés</div>
            </div>
            <div class="prv-kpi prv-kpi--ok">
                <div class="prv-kpi-val" style="color:#10b981">${PRIVACY_SCORES.filter(p => p.score >= 75).length}</div>
                <div class="prv-kpi-lbl">Conformes (≥75%)</div>
            </div>
            <div class="prv-kpi ${totalViolations > 0 ? 'prv-kpi--alert' : ''}">
                <div class="prv-kpi-val" style="color:${totalViolations > 0 ? '#ef4444' : '#10b981'}">${totalViolations}</div>
                <div class="prv-kpi-lbl">Violations détectées</div>
            </div>
            <div class="prv-kpi ${criticalCount > 0 ? 'prv-kpi--alert' : ''}">
                <div class="prv-kpi-val" style="color:${criticalCount > 0 ? '#ef4444' : '#10b981'}">${criticalCount}</div>
                <div class="prv-kpi-lbl">CA en alerte critique</div>
            </div>
        </div>
        ${violationBreakdownHTML}
    `;

    const grid = $('privacyGrid');
    if (!grid) return;
    grid.innerHTML = '';

    PRIVACY_SCORES.forEach(p => {
        const lvlColors = { excellent: '#10b981', good: '#3b82f6', warning: '#f59e0b', critical: '#ef4444' };
        const lvlLabelsMap = { excellent: 'Excellent', good: 'Bon', warning: 'Attention', critical: 'Critique' };
        const lvlColor = lvlColors[p.level] || '#888880';
        const lvlLabel = lvlLabelsMap[p.level] || p.level;

        const violations = p.violations_detail || { orientation: 0, politics: 0, religion: 0, health: 0 };
        const enhanced = getEnhancedCoaching(violations, p.level);

        // 5 segments de 20%, colorés selon le score atteint
        const segmentsHTML = [20, 40, 60, 80, 100].map(threshold => {
            const filled = p.score >= threshold;
            const partial = !filled && p.score > threshold - 20;
            const partialPct = partial ? ((p.score - (threshold - 20)) / 20) * 100 : 0;
            const style = filled
                ? `background:${lvlColor}`
                : partial
                    ? `background:linear-gradient(to right,${lvlColor} ${partialPct}%,var(--border) ${partialPct}%)`
                    : '';
            return `<div class="prv-segment ${filled ? 'filled' : ''}" style="${style}"></div>`;
        }).join('');

        const coachingHTML = enhanced.coaching.length > 0 ? `
            <div class="prv-coaching">
                <div class="prv-coaching-title">Actions prioritaires</div>
                ${enhanced.coaching.map(c => `
                    <div class="prv-coaching-item" style="border-left-color:${{ critical: '#ef4444', high: '#f97316', medium: '#f59e0b' }[c.priority] || '#94a3b8'}">
                        <span class="prv-coaching-priority prv-priority-${c.priority}">${c.priority}</span>
                        <div class="prv-coaching-msg">${c.message}</div>
                        <div class="prv-coaching-action">→ ${c.action}</div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const microLearningHTML = enhanced.microLearning.length > 0 ? `
            <div class="prv-learning">
                <div class="prv-learning-title">Formation recommandée</div>
                ${enhanced.microLearning.map(ml => `
                    <a href="${ml.url}" class="prv-learning-item" target="_blank" rel="noopener">
                        <span class="prv-learning-icon">${ml.icon}</span>
                        <div>
                            <div class="prv-learning-name">${ml.title}</div>
                            <div class="prv-learning-dur">${ml.duration}</div>
                        </div>
                    </a>
                `).join('')}
            </div>
        ` : '';

        const card = document.createElement('div');
        card.className = 'prv-card';
        card.innerHTML = `
            <div class="prv-card-top">
                <div class="prv-card-info">
                    <div class="prv-card-name">${p.ca}</div>
                    <span class="prv-card-badge" style="color:${lvlColor};border-color:${lvlColor}33;background:${lvlColor}0D">${lvlLabel}</span>
                </div>
                <div class="prv-card-score" style="color:${lvlColor}">${p.score}<span class="prv-card-score-pct">%</span></div>
            </div>
            <div class="prv-segments">${segmentsHTML}</div>
            <div class="prv-card-meta">${p.total} notes analysées · ${p.violations} violation${p.violations !== 1 ? 's' : ''}</div>
            ${coachingHTML}
            ${microLearningHTML}
        `;
        grid.appendChild(card);
    });
}

// ===== RENDER: CROSS-BRAND =====

// ===== TREND VELOCITY CALCULATION =====
function calculateTrendVelocity() {
    if (DATA.length < 4) {
        return { velocities: new Map(), emerging: [] };
    }

    // Split data into first half and second half
    const midPoint = Math.floor(DATA.length / 2);
    const firstHalf = DATA.slice(0, midPoint);
    const secondHalf = DATA.slice(midPoint);

    // Count tag frequencies in each period
    const firstHalfFreq = new Map();
    const secondHalfFreq = new Map();

    firstHalf.forEach(row => {
        row.tags.forEach(t => {
            firstHalfFreq.set(t.t, (firstHalfFreq.get(t.t) || 0) + 1);
        });
    });

    secondHalf.forEach(row => {
        row.tags.forEach(t => {
            secondHalfFreq.set(t.t, (secondHalfFreq.get(t.t) || 0) + 1);
        });
    });

    // Calculate velocity for each tag
    const velocities = new Map();
    const allTags = new Set([...firstHalfFreq.keys(), ...secondHalfFreq.keys()]);

    allTags.forEach(tag => {
        const firstCount = firstHalfFreq.get(tag) || 0;
        const secondCount = secondHalfFreq.get(tag) || 0;
        const totalCount = firstCount + secondCount;

        // Velocity = percentage change from first to second period
        let velocity = 0;
        if (firstCount === 0 && secondCount > 0) {
            velocity = 100; // New emerging tag
        } else if (firstCount > 0) {
            velocity = ((secondCount - firstCount) / firstCount) * 100;
        }

        velocities.set(tag, {
            total: totalCount,
            velocity: Math.round(velocity),
            firstCount,
            secondCount,
            isEmerging: firstCount === 0 && secondCount > 0
        });
    });

    // Identify emerging topics (new in second half)
    const emerging = Array.from(velocities.entries())
        .filter(([, data]) => data.isEmerging && data.secondCount >= 2)
        .sort((a, b) => b[1].secondCount - a[1].secondCount)
        .slice(0, 5);

    return { velocities, emerging };
}

// ===== ROI MATRIX — Signal → Action → Revenue =====
function buildROIMatrix({ giftingClients, keyAccounts, travelClients, persuadables, dormants, atRisk }) {
    const matrix = [];

    if (atRisk > 0) {
        matrix.push({
            priority: 'urgent',
            signal: 'Clients à sentiment négatif / churn critique',
            clients: atRisk,
            action: 'Service Recovery — appel Store Manager + geste commercial dans les 24h',
            roiPer: 2000,
            roi: atRisk * 2000,
            effort: 'Urgent',
            timeline: 'Immédiat'
        });
    }

    if (persuadables > 0) {
        matrix.push({
            priority: 'high',
            signal: 'Uplift élevé — fort potentiel d\'achat détecté',
            clients: persuadables,
            action: 'Smart Follow-up IA personnalisé dans les 48h avec produits LV matchés',
            roiPer: 450,
            roi: persuadables * 450,
            effort: 'Faible',
            timeline: '< 48h'
        });
    }

    if (giftingClients > 0) {
        matrix.push({
            priority: 'high',
            signal: 'Occasions gifting / célébrations (tags Contexte)',
            clients: giftingClients,
            action: 'Activer sélection cadeaux ciblée + message IA avec produits LV adaptés',
            roiPer: 800,
            roi: giftingClients * 800,
            effort: 'Faible',
            timeline: '< 24h'
        });
    }

    if (keyAccounts > 0) {
        matrix.push({
            priority: 'high',
            signal: 'Key Accounts identifiés dans les notes CA',
            clients: keyAccounts,
            action: 'Programme VIC dédié — accès CA attitré, preview exclusive collections',
            roiPer: 5000,
            roi: keyAccounts * 5000,
            effort: 'Moyen',
            timeline: '1 semaine'
        });
    }

    if (travelClients > 0) {
        matrix.push({
            priority: 'medium',
            signal: 'Profils voyageurs identifiés (tags Voyage)',
            clients: travelClients,
            action: 'Upsell bagagerie LV — Keepall, Horizon, Pégase, Delta',
            roiPer: 1200,
            roi: travelClients * 1200,
            effort: 'Moyen',
            timeline: '1 semaine'
        });
    }

    if (dormants > 0) {
        matrix.push({
            priority: 'medium',
            signal: 'Clients dormants — uplift faible, engagement bas',
            clients: dormants,
            action: 'Campagne réactivation — newsletter personnalisée avec nouveautés collection',
            roiPer: 600,
            roi: dormants * 600,
            effort: 'Moyen',
            timeline: '2 semaines'
        });
    }

    return matrix;
}

// ===== RENDER: LUXURY PULSE — ROI DASHBOARD =====
function renderPulse() {
    const tagFreq = new Map();
    const catFreq = new Map();
    DATA.forEach(row => {
        row.tags.forEach(t => {
            tagFreq.set(t.t, (tagFreq.get(t.t) || 0) + 1);
            catFreq.set(t.c, (catFreq.get(t.c) || 0) + 1);
        });
    });

    // ── Business metrics ──────────────────────────────────────────
    const giftingClients = DATA.filter(d => d.tags.some(t => t.c === 'contexte')).length;
    const keyAccounts = tagFreq.get('Key_Account') || 0;
    const travelClients = DATA.filter(d => d.tags.some(t => t.c === 'voyage')).length;

    const segments = DATA.map(d => {
        const u = calculateUpliftScore(d);
        const sl = (d.sentiment && d.sentiment.level) || 'neutral';
        return getUpliftSegment(u, sl).segment;
    });
    const persuadables = segments.filter(s => s === 'persuadables').length;
    const dormants = segments.filter(s => s === 'chiens-dormants').length;
    const atRisk = segments.filter(s => s === 'cas-perdus').length;

    const roiMatrix = buildROIMatrix({ giftingClients, keyAccounts, travelClients, persuadables, dormants, atRisk });
    const totalROI = roiMatrix.reduce((s, r) => s + r.roi, 0);

    const fmt = v => v >= 1000 ? `${(v / 1000).toFixed(0)}k€` : `${v}€`;

    // ── Section 1: Business KPI row ───────────────────────────────
    const ps = $('pulseStats');
    if (ps) ps.innerHTML = `
        <div class="pulse-stat">
            <div class="pulse-stat-value">${giftingClients}</div>
            <div class="pulse-stat-label">Gifting Opportunities</div>
            <div class="pulse-kpi-sub">${fmt(giftingClients * 800)} estimés</div>
        </div>
        <div class="pulse-stat">
            <div class="pulse-stat-value">${keyAccounts}</div>
            <div class="pulse-stat-label">Key Accounts</div>
            <div class="pulse-kpi-sub">${keyAccounts > 0 ? fmt(keyAccounts * 5000) + ' potentiel' : 'Aucun détecté'}</div>
        </div>
        <div class="pulse-stat">
            <div class="pulse-stat-value">${persuadables}</div>
            <div class="pulse-stat-label">Persuadables</div>
            <div class="pulse-kpi-sub">Uplift +30% conv.</div>
        </div>
        <div class="pulse-stat${atRisk > 0 ? ' pulse-stat-alert' : ''}">
            <div class="pulse-stat-value">${atRisk}</div>
            <div class="pulse-stat-label">Clients à Risque</div>
            <div class="pulse-kpi-sub">${atRisk > 0 ? 'Churn critique' : 'Aucun à risque'}</div>
        </div>
        <div class="pulse-stat pulse-stat-roi">
            <div class="pulse-stat-value">${fmt(totalROI)}</div>
            <div class="pulse-stat-label">ROI Total Estimé</div>
            <div class="pulse-kpi-sub">Potentiel activable</div>
        </div>
    `;

    // ── Section 2: Signal → Action → ROI table ───────────────────
    const trendsEl = $('pulseTrends');
    if (trendsEl) {
        trendsEl.innerHTML = '';
        const tableWrap = document.createElement('div');
        tableWrap.className = 'pulse-roi-section';

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'pulse-section-title';
        sectionHeader.textContent = 'Signal → Action → Revenue';
        tableWrap.appendChild(sectionHeader);

        if (DATA.length === 0) {
            tableWrap.innerHTML += '<div class="pulse-empty-state">Importez des données pour générer le tableau de ROI.</div>';
        } else {
            const table = document.createElement('div');
            table.className = 'pulse-roi-table';
            table.innerHTML = `
                <div class="pulse-roi-header">
                    <div class="pulse-roi-col-prio">Priorité</div>
                    <div class="pulse-roi-col-signal">Signal détecté</div>
                    <div class="pulse-roi-col-clients">Clients</div>
                    <div class="pulse-roi-col-action">Action recommandée</div>
                    <div class="pulse-roi-col-timeline">Délai</div>
                    <div class="pulse-roi-col-roi">ROI estimé*</div>
                </div>
            `;

            if (roiMatrix.length === 0) {
                table.innerHTML += '<div class="pulse-empty-state">Pas assez de données. Importez plus de notes clients.</div>';
            } else {
                const prioConfig = {
                    urgent: { label: 'URGENT', bg: '#ef4444', color: '#fff' },
                    high: { label: 'HIGH', bg: '#fb923c', color: '#fff' },
                    medium: { label: 'MEDIUM', bg: '#2563EB', color: '#fff' }
                };
                roiMatrix.forEach(row => {
                    const pc = prioConfig[row.priority] || { label: row.priority.toUpperCase(), bg: '#888', color: '#fff' };
                    const tr = document.createElement('div');
                    tr.className = 'pulse-roi-row';
                    tr.innerHTML = `
                        <div class="pulse-roi-col-prio">
                            <span class="pulse-prio-badge" style="background:${pc.bg};color:${pc.color}">${pc.label}</span>
                        </div>
                        <div class="pulse-roi-col-signal">${row.signal}</div>
                        <div class="pulse-roi-col-clients">${row.clients}</div>
                        <div class="pulse-roi-col-action">${row.action}</div>
                        <div class="pulse-roi-col-timeline">${row.timeline}</div>
                        <div class="pulse-roi-col-roi">
                            <div class="pulse-roi-value">${fmt(row.roi)}</div>
                            <div class="pulse-roi-per">${fmt(row.roiPer)}/client</div>
                        </div>
                    `;
                    table.appendChild(tr);
                });
            }

            tableWrap.appendChild(table);
            const note = document.createElement('div');
            note.className = 'pulse-roi-note';
            note.textContent = '* Estimations indicatives — panier moyen LV 1 500€. Uplift persuadables +30% conversion. Rétention churn évaluée à 2 000€/client.';
            tableWrap.appendChild(note);
        }

        trendsEl.appendChild(tableWrap);
    }

    // ── Section 3: Charts row (tag bars + category donut) ─────────
    const emergingEl = $('pulseEmerging');
    if (emergingEl) {
        emergingEl.innerHTML = '';
        const chartsRow = document.createElement('div');
        chartsRow.className = 'pulse-charts-row';

        // Left: horizontal bar chart — Top Tags
        const leftBlock = document.createElement('div');
        leftBlock.className = 'pulse-chart-block';
        leftBlock.innerHTML = '<div class="pulse-chart-title">Distribution des Tags</div>';

        const { velocities } = calculateTrendVelocity();
        const sorted = Array.from(tagFreq.entries()).sort((a, b) => b[1] - a[1]);
        const top10 = sorted.slice(0, 10);
        const maxCount = top10.length > 0 ? top10[0][1] : 1;

        if (top10.length === 0) {
            leftBlock.innerHTML += '<div style="color:var(--text-secondary);font-size:0.82rem;text-align:center;padding:20px">Aucune donnée</div>';
        } else {
            top10.forEach(([tag, count]) => {
                const vel = (velocities.get(tag) || { velocity: 0 }).velocity;
                const velClass = vel > 10 ? 'up' : vel < -10 ? 'down' : 'stable';
                const velLabel = vel > 10 ? `+${vel}%` : vel < -10 ? `${vel}%` : '—';
                const widthPct = Math.round((count / maxCount) * 100);
                const displayName = tag.replace(/_/g, ' ');
                const barRow = document.createElement('div');
                barRow.className = 'pulse-bar-row';
                barRow.innerHTML = `
                    <span class="pulse-bar-label" title="${displayName}">${displayName}</span>
                    <div class="pulse-bar-track"><div class="pulse-bar-fill" style="width:${widthPct}%"></div></div>
                    <span class="pulse-bar-count">${count}</span>
                    <span class="pulse-velocity ${velClass}">${velLabel}</span>
                `;
                leftBlock.appendChild(barRow);
            });
        }

        // Right: donut — Répartition par catégorie
        const rightBlock = document.createElement('div');
        rightBlock.className = 'pulse-chart-block';
        rightBlock.innerHTML = '<div class="pulse-chart-title">Répartition par Catégorie</div>';

        const catTotal = Array.from(catFreq.values()).reduce((s, v) => s + v, 0);
        if (catTotal === 0) {
            rightBlock.innerHTML += '<div style="color:var(--text-secondary);font-size:0.82rem;text-align:center;padding:40px 0">Aucune donnée</div>';
        } else {
            const circumference = 2 * Math.PI * 44;
            let offset = 0;
            const slices = Array.from(catFreq.entries()).sort((a, b) => b[1] - a[1]).map(([cat, cnt]) => {
                const dash = (cnt / catTotal) * circumference;
                const gap = circumference - dash;
                const color = legendColors[cat] || '#888';
                const sl = { cat, cnt, color, dash, gap, offset };
                offset += dash;
                return sl;
            });

            rightBlock.innerHTML += `
                <div class="pulse-donut-wrap">
                    <svg viewBox="0 0 120 120" width="120" height="120">
                        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="16"/>
                        ${slices.map(sl => `<circle cx="60" cy="60" r="44" fill="none" stroke="${sl.color}" stroke-width="16" stroke-dasharray="${sl.dash.toFixed(2)} ${sl.gap.toFixed(2)}" stroke-dashoffset="${(-sl.offset + circumference / 4).toFixed(2)}"/>`).join('')}
                    </svg>
                    <div class="pulse-donut-legend">
                        ${slices.map(sl => `
                            <div class="pulse-donut-legend-item">
                                <span class="pulse-donut-dot" style="background:${sl.color}"></span>
                                <span class="pulse-donut-legend-label">${CAT_NAMES[sl.cat] || sl.cat}</span>
                                <span class="pulse-donut-legend-count">${sl.cnt}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        chartsRow.appendChild(leftBlock);
        chartsRow.appendChild(rightBlock);
        emergingEl.appendChild(chartsRow);
    }

    // ── Section 4: Prioritized action pipeline ────────────────────
    const recoSection = $('pulseRecommendations');
    if (recoSection) {
        recoSection.innerHTML = '';
        if (roiMatrix.length > 0) {
            const pipelineWrap = document.createElement('div');

            const pipelineHeader = document.createElement('div');
            pipelineHeader.className = 'pulse-section-title';
            pipelineHeader.textContent = 'Pipeline d\'Actions Prioritaires';
            pipelineWrap.appendChild(pipelineHeader);

            const pipeline = document.createElement('div');
            pipeline.className = 'pulse-pipeline';

            const effortColors = { 'Urgent': '#ef4444', 'Faible': '#10b981', 'Moyen': '#fb923c', 'Immédiat': '#ef4444' };

            roiMatrix.forEach((row, i) => {
                const effortColor = effortColors[row.effort] || '#888';
                const item = document.createElement('div');
                item.className = 'pulse-pipeline-item';
                item.innerHTML = `
                    <div class="pulse-pipeline-rank">#${i + 1}</div>
                    <div class="pulse-pipeline-content">
                        <div class="pulse-pipeline-title">${row.action}</div>
                        <div class="pulse-pipeline-meta">
                            <span class="pulse-pipeline-signal">${row.signal}</span>
                            <span class="pulse-pipeline-sep">·</span>
                            <span class="pulse-pipeline-clients">${row.clients} client${row.clients > 1 ? 's' : ''}</span>
                            <span class="pulse-pipeline-sep">·</span>
                            <span class="pulse-pipeline-effort" style="color:${effortColor}">Effort : ${row.effort}</span>
                            <span class="pulse-pipeline-sep">·</span>
                            <span class="pulse-pipeline-timeline">${row.timeline}</span>
                        </div>
                    </div>
                    <div class="pulse-pipeline-roi">
                        <div class="pulse-pipeline-roi-value">${fmt(row.roi)}</div>
                        <div class="pulse-pipeline-roi-label">estimé</div>
                    </div>
                `;
                pipeline.appendChild(item);
            });

            pipelineWrap.appendChild(pipeline);
            recoSection.appendChild(pipelineWrap);
        }
    }

    // ── Section 5: Clear legacy container ────────────────────────
    const signalsEl = $('pulseSignals');
    if (signalsEl) signalsEl.innerHTML = '';
}

// ===== RENDER: SMART FOLLOW-UP v2 =====
async function renderSmartFollowup(client) {
    const container = $('followup-container');
    if (!container) return;

    // Loading state
    container.innerHTML = `
        <div class="followup-loading">
            <div class="followup-loading__spinner"></div>
            <p>Génération en cours via Mistral AI…</p>
        </div>`;

    // Top 3 products via Product Matcher
    let topProducts = [];
    try {
        const matched = matchProductsToClient(client.tags, client.clean || '');
        topProducts = (matched || []).slice(0, 3).map(m => ({
            name: m.product.title || '',
            price: m.product.price || '',
            category: m.product.category1_code || m.product.category || '',
            image: m.product.imageurl || '',
            link: m.product.itemurl || ''
        }));
    } catch (e) {
        console.warn('[smart-followup] matchProductsToClient failed:', e);
    }

    let currentChannel = 'email';

    async function callAndRender(channel) {
        currentChannel = channel;

        container.querySelectorAll('.channel-btn').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.channel === channel)
        );

        const msgBody = container.querySelector('.followup-message__body');
        const msgSubject = container.querySelector('.followup-message__subject');
        const badgeAI = container.querySelector('.badge-ai');

        if (msgBody) msgBody.innerHTML = '<div class="followup-loading__spinner followup-loading__spinner--small"></div>';

        const house = $('followupHouse')?.value || 'Louis Vuitton';

        let result;
        try {
            const resp = await fetch(`${API_BASE}/api/smart-followup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: client.id,
                    client_name: client.ca || '',
                    tags: client.tags || [],
                    clean_text: (client.clean || '').substring(0, 400),
                    products: topProducts,
                    channel: channel,
                    house: house,
                    language: client.lang || 'FR'
                })
            });
            result = await resp.json();
        } catch (e) {
            console.error('[smart-followup] fetch error:', e);
            result = { error: 'network' };
        }

        // Fallback on timeout or network error
        if (result.error || result.fallback) {
            result = generateFollowupLocal(client, house, channel);
            if (badgeAI) badgeAI.textContent = '↺ Généré localement';
        } else {
            if (badgeAI) badgeAI.textContent = '✦ Généré par Mistral';
        }

        if (msgSubject) {
            msgSubject.style.display = (channel === 'email' && result.subject) ? 'block' : 'none';
            msgSubject.textContent = result.subject || '';
        }
        if (msgBody) {
            msgBody.innerHTML = (result.body || '').replace(/\n/g, '<br>');
        }

        container._currentResult = result;
        container._currentChannel = channel;
    }

    // Render layout
    container.innerHTML = `
        <div class="followup-v2">
            <div class="followup-channels">
                <button class="channel-btn active" data-channel="email">Email</button>
                <button class="channel-btn" data-channel="whatsapp">WhatsApp</button>
                <button class="channel-btn" data-channel="sms">SMS</button>
            </div>
            <div class="followup-split">
                <div class="followup-message">
                    <div class="followup-message__header">
                        <span class="badge-ai">✦ Généré par Mistral</span>
                        <div class="followup-message__actions">
                            <button class="btn-followup-copy">Copier</button>
                            <button class="btn-followup-regen">↺ Régénérer</button>
                        </div>
                    </div>
                    <div class="followup-message__subject" style="display:none"></div>
                    <div class="followup-message__body">
                        <div class="followup-loading__spinner followup-loading__spinner--small"></div>
                    </div>
                </div>
                <div class="followup-products">
                    <h4 class="followup-products__title">Produits recommandés</h4>
                    <div class="followup-products__grid">
                        ${topProducts.length > 0
            ? topProducts.map(p => `
                                <div class="followup-product-card">
                                    ${p.image
                    ? `<img class="followup-product-card__img" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">`
                    : '<div class="followup-product-card__img-placeholder"></div>'}
                                    <div class="followup-product-card__info">
                                        <div class="followup-product-card__name">${p.name}</div>
                                        <div class="followup-product-card__cat">${(p.category || '').replace(/_/g, ' ')}</div>
                                    </div>
                                </div>`).join('')
            : '<p class="followup-products__empty">Aucun produit matché</p>'}
                    </div>
                </div>
            </div>
        </div>`;

    // Event listeners
    container.querySelectorAll('.channel-btn').forEach(btn =>
        btn.addEventListener('click', () => callAndRender(btn.dataset.channel))
    );

    container.querySelector('.btn-followup-copy').addEventListener('click', function () {
        const r = container._currentResult || {};
        const text = (container._currentChannel === 'email' && r.subject)
            ? r.subject + '\n\n' + r.body
            : r.body || '';
        navigator.clipboard.writeText(text).then(() => {
            this.textContent = '✓ Copié';
            setTimeout(() => { this.textContent = 'Copier'; }, 2000);
        });
    });

    container.querySelector('.btn-followup-regen').addEventListener('click', () => {
        callAndRender(container._currentChannel || 'email');
    });

    await callAndRender('email');
}

// ===== RENDER: FOLLOW-UP PAGE (entry point) =====
function renderFollowup() {
    const grid = $('followupGrid');
    const container = $('followup-container');
    if (!grid) return;

    // Channel is now handled by v2 inline buttons — hide legacy select
    const channelSel = $('followupChannel');
    if (channelSel) channelSel.style.display = 'none';

    const withTags = DATA.filter(p => p.tags.length > 0);

    grid.innerHTML = '';
    if (container) container.innerHTML = '';

    if (withTags.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-secondary);font-size:.85rem;padding:12px 0">Aucun client avec tags pour générer un follow-up.</p>';
        return;
    }

    grid.innerHTML = `
        <div class="followup-selector-row">
            <span class="followup-selector-label">Client</span>
            <select class="select-input" id="followupClientSelect">
                ${withTags.map(p => `<option value="${p.id}">${p.ca || p.id}</option>`).join('')}
            </select>
        </div>`;

    const clientSelect = grid.querySelector('#followupClientSelect');

    function onClientChange() {
        const selected = withTags.find(p => p.id === clientSelect.value) || withTags[0];
        if (selected) renderSmartFollowup(selected);
    }

    clientSelect.addEventListener('change', onClientChange);
    onClientChange();
}

async function triggerSmartFollowup(card, client, channel, house) {
    const zone = card.querySelector('.sf-generate-zone');
    zone.innerHTML = '<div class="sf-spinner"></div>';

    // Récupération des top 3 produits via le Product Matcher
    const matches = matchProductsToClient(client.tags, client.clean || '');
    const top3 = matches.slice(0, 3);
    const productsPayload = top3.map(m => ({
        name: m.product.title || '',
        price: m.product.price || '',
        category: m.product.category1_code || m.product.category || '',
        imageurl: m.product.imageurl || '',
        itemurl: m.product.itemurl || ''
    }));

    try {
        const resp = await fetch(`${API_BASE}/api/smart-followup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: client.id,
                tags: client.tags,
                clean_text: (client.clean || '').substring(0, 150),
                products: productsPayload,
                channel: document.getElementById('followupChannel')?.value || 'email',
                house: document.getElementById('followupHouse')?.value || 'Louis Vuitton'
            })
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        renderSmartFollowupResult(card, zone, client, top3, data);
    } catch (err) {
        zone.innerHTML = `
            <div class="sf-error">
                <span class="sf-error-msg">Le service IA est momentanément indisponible.</span>
                <button class="sf-btn-generate" data-id="${client.id}">Réessayer</button>
            </div>
        `;
        zone.querySelector('.sf-btn-generate').addEventListener('click', () => {
            triggerSmartFollowup(card, client, channel, house);
        });
    }
}

function renderSmartFollowupResult(card, zone, client, top3, data) {
    const subject = data.subject || '';
    const body = data.body || data.message || '';

    // Ajouter le badge IA dans le header de la card
    const header = card.querySelector('.followup-card-header');
    if (header && !header.querySelector('.sf-badge-ai')) {
        const badge = document.createElement('span');
        badge.className = 'sf-badge-ai';
        badge.innerHTML = '&#10022; IA';
        header.appendChild(badge);
    }

    const productsHtml = top3.length > 0
        ? top3.map(m => {
            const p = m.product;
            const imgSrc = p.imageurl || '';
            const link = p.itemurl || '#';
            const title = (p.title || '').substring(0, 48);
            const cat = (p.category1_code || p.category || '').replace(/_/g, ' ');
            return `
                <a href="${link}" target="_blank" rel="noopener" class="sf-product-mini">
                    <div class="sf-product-img-wrap">
                        ${imgSrc ? `<img class="sf-product-img" src="${imgSrc}" alt="${title}" loading="lazy">` : '<div class="sf-product-img sf-product-img-placeholder"></div>'}
                    </div>
                    <div class="sf-product-info">
                        <div class="sf-product-name">${title}</div>
                        <div class="sf-product-cat">${cat}</div>
                        ${p.price ? `<div class="sf-product-price">${p.price}</div>` : ''}
                    </div>
                </a>
            `;
        }).join('')
        : '<p class="sf-no-products">Aucun produit correspondant trouvé.</p>';

    zone.innerHTML = `
        <div class="sf-result-wrap">
            <div class="sf-message-col">
                ${subject ? `<div class="sf-message-subject">${subject}</div>` : ''}
                <div class="sf-message-body">${body.replace(/\n/g, '<br>')}</div>
                <div class="sf-result-actions">
                    <button class="sf-btn-copy">Copier</button>
                    <button class="sf-btn-regen">Régénérer</button>
                </div>
            </div>
            <div class="sf-products-col">
                <div class="sf-products-label">Produits recommandés</div>
                ${productsHtml}
            </div>
        </div>
    `;

    zone.querySelector('.sf-btn-copy').addEventListener('click', function () {
        const textToCopy = (subject ? subject + '\n\n' : '') + body;
        navigator.clipboard.writeText(textToCopy).then(() => {
            this.textContent = 'Copié';
            setTimeout(() => { this.textContent = 'Copier'; }, 1500);
        });
    });

    const channel = document.getElementById('followupChannel')?.value || 'email';
    const house = document.getElementById('followupHouse')?.value || 'Louis Vuitton';
    zone.querySelector('.sf-btn-regen').addEventListener('click', () => {
        zone.innerHTML = '<div class="sf-spinner"></div>';
        triggerSmartFollowup(card, client, channel, house);
    });
}

function generateFollowupLocal(client, house, channel) {
    const tags = client.tags.map(t => t.t);
    const name = client.ca || client.id;
    const occasions = tags.filter(t => ['Anniversaire', 'Union', 'Naissance', 'Événement_Vie', 'Promotion', 'Réussite_Business', 'Retraite'].includes(t));
    const styles = tags.filter(t => ['Intemporel', 'Contemporain', 'Tendance', 'Quiet_Luxury', 'Signature_Logo'].includes(t));
    const interests = tags.filter(t => ['Golf', 'Tennis', 'Nautisme_Yachting', 'Sports_Endurance', 'Wellness_Yoga', 'Art_Contemporain', 'Gastronomie_Fine_Dining'].includes(t));

    let subject, body;
    if (channel === 'email') {
        subject = occasions.length > 0 ? `${house} — Attention pour votre ${occasions[0].toLowerCase().replace(/_/g, ' ')}` : `${house} — Suite à notre échange, ${name}`;
        body = `Cher(e) ${name},\n\nCe fut un réel plaisir de vous accueillir chez ${house}.\n\n`;
        if (styles.length) body += `Votre sensibilité pour un style ${styles.join(' et ').toLowerCase().replace(/_/g, ' ')} m'a inspiré(e). `;
        if (interests.length) body += `Suite à votre intérêt pour ${interests.join(', ').toLowerCase().replace(/_/g, ' ')}, de nouvelles pièces sont arrivées.\n\n`;
        if (occasions.length) body += `Pour votre ${occasions[0].toLowerCase().replace(/_/g, ' ')}, j'ai pré-sélectionné des pièces.\n\n`;
        body += `N'hésitez pas à me contacter.\n\nAvec toute mon attention,\nVotre Client Advisor\n${house}`;
    } else {
        subject = `WhatsApp — ${name}`;
        body = `Bonjour ${name} 😊\n\nMerci pour votre visite chez ${house} ! `;
        if (interests.length) { body += '\n\nCentres d\'intérêt :\n'; interests.forEach(pr => body += `→ ${pr.replace(/_/g, ' ')}\n`); }
        if (occasions.length) body += `\nPour votre ${occasions[0].toLowerCase().replace(/_/g, ' ')}, je vous prépare une sélection ✨\n`;
        if (styles.length) body += `\nNouveautés ${styles[0].toLowerCase().replace(/_/g, ' ')} pour vous.\n`;
        body += `\nJe reste disponible.\nBelle journée ! 🤍\n— CA ${house}`;
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

// ===== INTELLIGENT PRODUCT MATCHING (OPTIMIZED) =====
// Cache pour éviter de recalculer les mêmes correspondances
const _matchCache = new Map();

// Maps each client tag to real LV product categories with weights
const TAG_TO_CATEGORIES = {
    // === PROFIL ===
    'Femme': [{ cat1: 'FEMME', w: 35 }, { cat1: 'JOAILLERIE', w: 20 }, { cat1: 'PARFUMS', w: 15 }],
    'Homme': [{ cat1: 'HOMME', w: 35 }, { cat1: 'MONTRES', w: 20 }],
    'Executive_Leadership': [{ cat1: 'HOMME', cat2: 'NEW FORMAL', w: 30 }, { cat1: 'HOMME', cat2: 'PORTEFEUILLES ET PETITE MAROQUINERIE', w: 25 }, { cat1: 'HOMME', cat2: 'VOYAGE', w: 20 }],
    'Entrepreneur': [{ cat1: 'HOMME', cat2: 'PORTEFEUILLES ET PETITE MAROQUINERIE', w: 25 }, { cat1: 'HOMME', cat2: 'ACCESSOIRES', w: 20 }, { cat1: 'NOUVEAUTES', w: 10 }],
    'Expertise_Médicale': [{ cat1: 'HOMME', cat2: 'ACCESSOIRES', w: 20 }, { cat1: 'FEMME', cat2: 'ACCESSOIRES', w: 20 }],
    'Marchés_Financiers': [{ cat1: 'HOMME', cat2: 'NEW FORMAL', w: 25 }, { cat1: 'MONTRES', w: 20 }],

    // === INTÉRÊTS ===
    'Golf': [{ cat1: 'ART DE VIVRE', cat2: 'SPORT ET LIFESTYLE', w: 45 }, { cat1: 'HOMME', cat2: 'ACCESSOIRES', w: 15 }],
    'Tennis': [{ cat1: 'ART DE VIVRE', cat2: 'SPORT ET LIFESTYLE', w: 40 }, { cat1: 'HOMME', cat2: 'ACCESSOIRES', w: 15 }],
    'Sports_Raquette': [{ cat1: 'ART DE VIVRE', cat2: 'SPORT ET LIFESTYLE', w: 40 }],
    'Nautisme_Yachting': [{ cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 35 }, { cat1: 'SACS', cat2: 'VOYAGE', w: 30 }],
    'Sports_Endurance': [{ cat1: 'ART DE VIVRE', cat2: 'SPORT ET LIFESTYLE', w: 40 }, { cat1: 'NOUVEAUTES', cat2: 'LV SKI', w: 20 }],
    'Wellness_Yoga': [{ cat1: 'ART DE VIVRE', cat2: 'SPORT ET LIFESTYLE', w: 35 }, { cat1: 'PARFUMS', w: 15 }],
    'Automobile_Collection': [{ cat1: 'ART DE VIVRE', cat2: 'MAISON', w: 30 }, { cat1: 'HOMME', cat2: 'ACCESSOIRES', w: 20 }],
    'Motorsport_Experience': [{ cat1: 'ART DE VIVRE', cat2: 'SPORT ET LIFESTYLE', w: 35 }],
    'Art_Contemporain': [{ cat1: 'ART DE VIVRE', cat2: 'LIVRES ET PAPETERIE', w: 35 }, { cat1: 'ART DE VIVRE', cat2: 'MAISON', w: 25 }],
    'Art_Classique': [{ cat1: 'ART DE VIVRE', cat2: 'LIVRES ET PAPETERIE', w: 35 }, { cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 20 }],
    'Opéra_Musique_Symphonique': [{ cat1: 'FEMME', cat2: 'SACS A MAIN', w: 25 }, { cat1: 'JOAILLERIE', w: 25 }, { cat1: 'PARFUMS', w: 15 }],
    'Jazz_Contemporary': [{ cat1: 'NOUVEAUTES', w: 20 }, { cat1: 'FEMME', cat2: 'ACCESSOIRES', w: 20 }],
    'Horlogerie_Vintage': [{ cat1: 'MONTRES', cat2: 'MONTRES TRADITIONNELLES', w: 55 }, { cat1: 'ART DE VIVRE', cat2: 'MAISON', w: 15 }],
    'Haute_Horlogerie': [{ cat1: 'MONTRES', cat2: 'MONTRES TRADITIONNELLES', w: 55 }, { cat1: 'MONTRES', cat2: 'MONTRES CONNECTEES', w: 20 }],
    'Livres_Rares': [{ cat1: 'ART DE VIVRE', cat2: 'LIVRES ET PAPETERIE', w: 55 }],
    'Vins_Spiritueux_Prestige': [{ cat1: 'ART DE VIVRE', cat2: 'MAISON', w: 35 }, { cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 20 }],
    'Gastronomie_Fine_Dining': [{ cat1: 'ART DE VIVRE', cat2: 'MAISON', w: 30 }, { cat1: 'CADEAUX', w: 15 }],

    // === CONTEXTE / OCCASION ===
    'Anniversaire': [{ cat1: 'CADEAUX', w: 40 }, { cat1: 'JOAILLERIE', w: 25 }, { cat1: 'PARFUMS', w: 20 }],
    'Union': [{ cat1: 'JOAILLERIE', w: 45 }, { cat1: 'CADEAUX', w: 25 }, { cat1: 'PARFUMS', w: 15 }],
    'Naissance': [{ cat1: 'CADEAUX', cat2: 'CADEAUX DE NAISSANCE', w: 55 }],
    'Cadeau_Proche': [{ cat1: 'CADEAUX', w: 40 }, { cat1: 'PARFUMS', w: 25 }, { cat1: 'FEMME', cat2: 'PORTEFEUILLES ET PETITE MAROQUINERIE', w: 20 }],
    'Cadeau_Famille': [{ cat1: 'CADEAUX', w: 40 }, { cat1: 'PARFUMS', w: 20 }],
    'Cadeau_Professionnel': [{ cat1: 'CADEAUX', w: 35 }, { cat1: 'ART DE VIVRE', cat2: 'LIVRES ET PAPETERIE', w: 20 }, { cat1: 'HOMME', cat2: 'ACCESSOIRES', w: 15 }],
    'Cadeau_Lui': [{ cat1: 'CADEAUX', cat2: 'CADEAUX POUR LUI', w: 55 }],
    'Cadeau_Elle': [{ cat1: 'CADEAUX', cat2: 'CADEAUX POUR ELLE', w: 55 }],
    'Intemporel': [{ cat1: 'FEMME', cat2: 'SACS A MAIN', w: 30 }, { cat1: 'SACS', w: 25 }],
    'Quiet_Luxury': [{ cat1: 'FEMME', cat2: 'PRET A PORTER', w: 25 }, { cat1: 'HOMME', cat2: 'PRET A PORTER', w: 25 }, { cat1: 'JOAILLERIE', w: 15 }],
    'Signature_Logo': [{ cat1: 'SACS', w: 30 }, { cat1: 'FEMME', cat2: 'SACS A MAIN', w: 25 }, { cat1: 'NOUVEAUTES', w: 15 }],
    'Design_Minimaliste': [{ cat1: 'HOMME', cat2: 'ACCESSOIRES', w: 25 }, { cat1: 'FEMME', cat2: 'ACCESSOIRES', w: 25 }],
    'Contemporain': [{ cat1: 'NOUVEAUTES', w: 30 }, { cat1: 'FEMME', cat2: 'PRET A PORTER', w: 20 }],
    'Tendance': [{ cat1: 'NOUVEAUTES', w: 40 }],
    'Promotion': [{ cat1: 'HOMME', cat2: 'ACCESSOIRES', w: 20 }, { cat1: 'MONTRES', w: 20 }, { cat1: 'CADEAUX', w: 15 }],
    'Réussite_Business': [{ cat1: 'MONTRES', w: 30 }, { cat1: 'HOMME', cat2: 'NEW FORMAL', w: 25 }, { cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 20 }],

    // === VOYAGE ===
    'Business_Travel': [{ cat1: 'HOMME', cat2: 'VOYAGE', w: 45 }, { cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 35 }, { cat1: 'SACS', cat2: 'VOYAGE', w: 30 }, { cat1: 'HOMME', cat2: 'PORTEFEUILLES ET PETITE MAROQUINERIE', w: 15 }],
    'Loisir_Premium': [{ cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 35 }, { cat1: 'FEMME', cat2: 'SACS A MAIN', w: 20 }, { cat1: 'SACS', w: 20 }],
    'Expédition_Nature': [{ cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 35 }, { cat1: 'ART DE VIVRE', cat2: 'SPORT ET LIFESTYLE', w: 25 }],
    'Itinérance_Culturelle': [{ cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 30 }, { cat1: 'ART DE VIVRE', cat2: 'LIVRES ET PAPETERIE', w: 20 }],
    'APAC': [{ cat1: 'FEMME', cat2: 'SACS A MAIN', w: 20 }, { cat1: 'JOAILLERIE', w: 20 }],
    'Americas': [{ cat1: 'NOUVEAUTES', w: 20 }, { cat1: 'ART DE VIVRE', cat2: 'SPORT ET LIFESTYLE', w: 15 }],
    'Europe': [{ cat1: 'JOAILLERIE', w: 15 }, { cat1: 'PARFUMS', w: 15 }],

    // === MARQUE ===
    'Lignes_Iconiques': [{ cat1: 'FEMME', cat2: 'SACS A MAIN', w: 35 }, { cat1: 'SACS', w: 30 }],
    'Art_de_Vivre_Malles': [{ cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 55 }],
    'Cuirs_Exotiques': [{ cat1: 'FEMME', cat2: 'SACS A MAIN', w: 40 }, { cat1: 'FEMME', cat2: 'PORTEFEUILLES ET PETITE MAROQUINERIE', w: 25 }],
    'Client_Historique': [{ cat1: 'SACS', w: 30 }, { cat1: 'ART DE VIVRE', cat2: 'MALLES ET VOYAGE', w: 30 }],
    'Lignes_Animation': [{ cat1: 'NOUVEAUTES', w: 45 }],
};

// Human-readable labels for product categories
const CATEGORY_LABELS = {
    'SACS A MAIN': 'Maroquinerie',
    'PORTEFEUILLES ET PETITE MAROQUINERIE': 'Petite Maroquinerie',
    'VOYAGE': 'Voyage',
    'MALLES ET VOYAGE': 'Malles & Voyage',
    'SPORT ET LIFESTYLE': 'Sport & Lifestyle',
    'LIVRES ET PAPETERIE': 'Livres & Papeterie',
    'MAISON': 'Art de Vivre',
    'PRET A PORTER': 'Prêt-à-Porter',
    'ACCESSOIRES': 'Accessoires',
    'SOULIERS': 'Souliers',
    'BIJOUX': 'Bijoux',
    'NEW FORMAL': 'Formal',
    'MONTRES TRADITIONNELLES': 'Horlogerie',
    'MONTRES CONNECTEES': 'Montres Connect.',
    'COLLECTIONS': 'Joaillerie',
    'CADEAUX DE NAISSANCE': 'Naissance',
    'CADEAUX POUR LUI': 'Cadeau Homme',
    'CADEAUX POUR ELLE': 'Cadeau Femme',
    'LV SKI': 'LV Ski',
};

function getCategoryLabel(cat1, cat2) {
    if (cat2 && CATEGORY_LABELS[cat2]) return CATEGORY_LABELS[cat2];
    return cat1.charAt(0) + cat1.slice(1).toLowerCase();
}

function matchProductsToClient(clientTags, clientText) {
    if (!PRODUCTS_LOADED || LV_PRODUCTS.length === 0) return [];

    // Quick return if no tags
    if (!Array.isArray(clientTags) || clientTags.length === 0) return [];

    // Check cache
    const cacheKey = clientTags.map(t => t.t).sort().join('|');
    if (_matchCache.has(cacheKey)) {
        return _matchCache.get(cacheKey);
    }

    const matches = [];

    // Limit products to process (first 500 for speed)
    const productsToProcess = LV_PRODUCTS.slice(0, 500);

    productsToProcess.forEach(product => {
        const cat1 = (product.category1_code || '').toUpperCase().trim();
        const cat2 = (product.category2_code || '').toUpperCase().trim();
        const productName = (product.title || '').toLowerCase();

        let rawScore = 0;
        const matchedLabels = new Set();
        let hasCategoryMatch = false;

        // 1. CATEGORY SCORING — tag → category rules
        clientTags.forEach(tag => {
            const rules = TAG_TO_CATEGORIES[tag.t];
            if (!rules) return;

            rules.forEach(rule => {
                const rulecat1 = rule.cat1.toUpperCase().trim();
                const rulecat2 = rule.cat2 ? rule.cat2.toUpperCase().trim() : null;

                // cat1 must match; if cat2 is specified it must also match
                if (cat1 === rulecat1 && (!rulecat2 || cat2 === rulecat2)) {
                    rawScore += rule.w;
                    hasCategoryMatch = true;
                    matchedLabels.add(getCategoryLabel(rulecat1, rulecat2));
                }
            });
        });

        const categoryScore = Math.min(100, rawScore);

        // 2. NAME BONUS — iconic products and new collection interest (0–20)
        let nameBonus = 0;
        const tagValues = clientTags.map(t => t.t);

        if (tagValues.includes('Lignes_Iconiques')) {
            if (/speedy|neverfull|alma|keepall/.test(productName)) {
                nameBonus += 15;
            }
        }
        if (tagValues.includes('Lignes_Animation') && cat1 === 'NOUVEAUTES') {
            nameBonus += 10;
        }

        const totalScore = categoryScore + nameBonus;

        // 3. THRESHOLD — score >= 25 AND at least one category match
        if (totalScore >= 25 && hasCategoryMatch) {
            matches.push({
                product,
                score: totalScore,
                matchReasons: [...matchedLabels].slice(0, 3),
            });
        }
    });

    // Sort by score descending
    const sortedMatches = matches.sort((a, b) => b.score - a.score);

    // Cache result
    _matchCache.set(cacheKey, sortedMatches);

    // Limit cache size to 50 entries
    if (_matchCache.size > 50) {
        const firstKey = _matchCache.keys().next().value;
        _matchCache.delete(firstKey);
    }

    return sortedMatches;
}

// ===== RENDER: PRODUCT MATCHER WITH ENHANCED DISPLAY =====
async function renderProducts() {
    const grid = $('productGrid');
    if (!grid) return;

    // Ensure products are loaded
    if (!PRODUCTS_LOADED) {
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:#999"><div class="spinner" style="margin:0 auto 16px"></div><p>Chargement de la base de données produits Louis Vuitton...</p></div>';
        await loadLVProducts();
    }

    const withTags = DATA.filter(p => p.tags.length > 0);
    if (withTags.length === 0) {
        grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucun client avec tags pour le matching produit.</p>';
        return;
    }

    if (LV_PRODUCTS.length === 0) {
        grid.innerHTML = '<p style="color:#ef4444;font-size:.85rem;padding:20px">⚠️ Erreur de chargement de la base de données produits. Vérifiez que le fichier JSON est accessible.</p>';
        return;
    }

    // Calculate all matches for all clients
    const allClientMatches = withTags.map(p => ({
        client: p,
        matches: matchProductsToClient(p.tags, p.clean)
    })).filter(cm => cm.matches.length > 0);

    const totalMatches = allClientMatches.reduce((sum, cm) => sum + cm.matches.length, 0);

    // Collect unique category codes from the top 3 matches of each client
    const allCats = new Set();
    allClientMatches.forEach(cm => {
        cm.matches.slice(0, 3).forEach(m => {
            const c = (m.product.category1_code || '').toUpperCase().trim();
            if (c) allCats.add(c);
        });
    });
    const CAT_LABELS = {
        'FEMME': 'Femme', 'HOMME': 'Homme', 'SACS': 'Sacs',
        'JOAILLERIE': 'Joaillerie', 'MONTRES': 'Montres', 'PARFUMS': 'Parfums',
        'ART DE VIVRE': 'Art de Vivre', 'NOUVEAUTES': 'Nouveautés', 'CADEAUX': 'Cadeaux'
    };
    const CAT_ORDER = ['FEMME','HOMME','SACS','JOAILLERIE','MONTRES','PARFUMS','ART DE VIVRE','NOUVEAUTES','CADEAUX'];
    const sortedCats = CAT_ORDER.filter(c => allCats.has(c));
    const remainingCats = [...allCats].filter(c => !CAT_ORDER.includes(c)).sort();
    const allCategories = [...sortedCats, ...remainingCats];
    const filterBtnsHTML = ['all', ...allCategories].map((c, i) =>
        `<button class="pm-filter-btn${i === 0 ? ' active' : ''}" data-filter="${c}">${i === 0 ? 'Tous' : (CAT_LABELS[c] || c)}</button>`
    ).join('');

    // Create header with search and counter
    const header = document.createElement('div');
    header.className = 'product-matcher-header';
    header.innerHTML = `
        <div class="product-matcher-stats">
            <div class="pm-stat">
                <div class="pm-stat-value">${totalMatches}</div>
                <div class="pm-stat-label">Matchs totaux</div>
            </div>
            <div class="pm-stat">
                <div class="pm-stat-value">${allClientMatches.length}</div>
                <div class="pm-stat-label">Clients servis</div>
            </div>
            <div class="pm-stat">
                <div class="pm-stat-value">${LV_PRODUCTS.length}</div>
                <div class="pm-stat-label">Produits catalogue</div>
            </div>
        </div>
        <div class="pm-toolbar">
            <div class="pm-filters">
                ${filterBtnsHTML}
            </div>
            <div class="pm-sort">
                <button class="pm-sort-btn active" data-sort="score">↓ Meilleur match</button>
                <button class="pm-sort-btn" data-sort="products">Nb produits</button>
                <button class="pm-sort-btn" data-sort="name">A → Z</button>
            </div>
        </div>
        <div class="product-matcher-search">
            <input type="text" id="pmSearch" placeholder="🔍 Rechercher un client ou un tag..." class="pm-search-input" />
        </div>
    `;

    const container = document.createElement('div');
    container.appendChild(header);

    const gridEl = document.createElement('div');
    gridEl.className = 'product-matcher-grid';
    gridEl.id = 'productMatcherGridContent';

    allClientMatches.forEach(({ client, matches }) => {
        const top3 = matches.slice(0, 3);

        const card = document.createElement('div');
        card.className = 'product-match-card';
        card.setAttribute('data-client', (client.ca || client.id).toLowerCase());
        card.setAttribute('data-tags', client.tags.map(t => t.t.toLowerCase()).join(' '));
        const cardCats = [...new Set(top3.map(m => (m.product.category1_code || '').toUpperCase().trim()))].join('|');
        card.setAttribute('data-categories', cardCats);
        card.setAttribute('data-score', matches[0]?.score || 0);
        card.setAttribute('data-matches-count', matches.length);
        card.setAttribute('data-name', (client.ca || client.id || '').toLowerCase());

        card.innerHTML = `
            <div class="product-match-header">
                <span class="product-match-client">${client.ca || client.id}</span>
                <span style="color:#666;font-size:.72rem">${matches.length} produit${matches.length > 1 ? 's' : ''} trouvé${matches.length > 1 ? 's' : ''}</span>
            </div>
            <div class="product-match-tags">${client.tags.slice(0, 6).map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
            <div class="product-items">
                ${top3.map(match => {
            const prod = match.product;
            const imageUrl = prod.imageurl || '';
            const priceRaw = prod.price;
            const price = priceRaw ? `${parseFloat(priceRaw).toLocaleString('fr-FR')} €` : 'Prix sur demande';
            const matchTags = match.matchReasons.join(', ');
            const productName = prod.title || 'Produit Louis Vuitton';
            const productCategory = [prod.category1_code, prod.category2_code, prod.category3_code].filter(c => c).join(' · ');
            const productUrl = prod.itemurl;

            // Qualitative relevance label
            const relevanceBadge = match.score >= 60
                ? '<div class="product-relevance-badge best">Idéal</div>'
                : match.score >= 35
                    ? '<div class="product-relevance-badge good">Recommandé</div>'
                    : '<div class="product-relevance-badge ok">Suggéré</div>';

            return `
                        <div class="product-item">
                            <div class="product-item-img" style="background-image:url('${imageUrl}');background-size:cover;background-position:center;width:100px;height:100px;border-radius:8px;flex-shrink:0;${imageUrl ? '' : 'background-color:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:2rem'}">
                                ${imageUrl ? '' : '🛍️'}
                                ${relevanceBadge}
                            </div>
                            <div class="product-item-info">
                                <div class="product-item-name">${productName}</div>
                                <div class="product-item-desc">${productCategory}</div>
                                <div class="product-item-price-row">
                                    <span class="product-item-price">${price}</span>
                                </div>
                                <div class="product-item-match-row" title="Match: ${matchTags}">
                                    <span class="product-item-match">🎯 ${matchTags}</span>
                                </div>
                                ${productUrl ? `<a href="${productUrl}" target="_blank" class="product-lv-link">Voir sur LouisVuitton.com →</a>` : ''}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
        gridEl.appendChild(card);
    });

    container.appendChild(gridEl);
    grid.innerHTML = '';
    grid.appendChild(container);

    function applyFiltersAndSort() {
        const activeFilter = container.querySelector('.pm-filter-btn.active')?.dataset.filter || 'all';
        const activeSort = container.querySelector('.pm-sort-btn.active')?.dataset.sort || 'score';
        const searchQuery = (document.getElementById('pmSearch')?.value || '').toLowerCase();

        const cards = [...gridEl.querySelectorAll('.product-match-card')];

        cards.forEach(card => {
            const cats = card.getAttribute('data-categories') || '';
            const clientName = card.getAttribute('data-client') || '';
            const tags = card.getAttribute('data-tags') || '';
            const matchesFilter = activeFilter === 'all' || cats.includes(activeFilter);
            const matchesSearch = !searchQuery || clientName.includes(searchQuery) || tags.includes(searchQuery);
            card.style.display = (matchesFilter && matchesSearch) ? '' : 'none';
        });

        const visibleCards = cards.filter(c => c.style.display !== 'none');
        visibleCards.sort((a, b) => {
            if (activeSort === 'score') return Number(b.dataset.score) - Number(a.dataset.score);
            if (activeSort === 'products') return Number(b.dataset.matchesCount) - Number(a.dataset.matchesCount);
            if (activeSort === 'name') return (a.dataset.name || '').localeCompare(b.dataset.name || '');
            return 0;
        });
        visibleCards.forEach(card => gridEl.appendChild(card));
    }

    // Wire filter buttons
    container.querySelectorAll('.pm-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.pm-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFiltersAndSort();
        });
    });

    // Wire sort buttons
    container.querySelectorAll('.pm-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.pm-sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFiltersAndSort();
        });
    });

    // Wire search
    const searchInput = document.getElementById('pmSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => applyFiltersAndSort());
    }
}

// ===== CHURN RISK CALCULATION =====
function calculateChurnRisk(sentimentScore, sentimentLevel, tagCount = 0, isKeyAccount = false, hasNegativeFeedback = false) {
    let churnScore = 0;

    // Base sentiment (recalibré — moins agressif)
    if (sentimentLevel === 'negative') {
        churnScore += 45;
    } else if (sentimentLevel === 'neutral') {
        churnScore += 18;
    } else {
        // positive : risque résiduel si score faible
        churnScore += Math.max(0, (100 - sentimentScore) * 0.2);
    }

    // Feedback négatif explicite aggrave
    if (hasNegativeFeedback) churnScore += 20;

    // Engagement client (plus de tags = plus engagé = moins de churn)
    if (tagCount >= 10)     churnScore -= 20;
    else if (tagCount >= 6) churnScore -= 12;
    else if (tagCount >= 3) churnScore -= 5;

    // Key Account à risque → escalade en critique
    if (isKeyAccount && churnScore >= 35) churnScore += 15;

    churnScore = Math.min(100, Math.max(0, Math.round(churnScore)));

    if (churnScore >= 65) return { risk: 'critical', label: 'Critique', color: '#ef4444' };
    if (churnScore >= 40) return { risk: 'high',     label: 'Élevé',    color: '#fb923c' };
    if (churnScore >= 20) return { risk: 'medium',   label: 'Modéré',   color: '#fbbf24' };
    return                       { risk: 'low',      label: 'Faible',   color: '#10b981' };
}

function getServiceRecoveryActions(churnRisk) {
    const actions = [];

    if (churnRisk === 'critical') {
        actions.push({
            priority: 'critique',
            action: 'Appel personnel du Store Manager dans les 24h',
            icon: '📞',
            color: '#ef4444'
        });
        actions.push({
            priority: 'critique',
            action: 'Invitation à un événement privé exclusif',
            icon: '🎁',
            color: '#ef4444'
        });
    } else if (churnRisk === 'high') {
        actions.push({
            priority: 'haute',
            action: 'Message personnalisé + offre privilège',
            icon: '💌',
            color: '#fb923c'
        });
        actions.push({
            priority: 'haute',
            action: 'Consultation stylistique offerte',
            icon: '👔',
            color: '#fb923c'
        });
    } else if (churnRisk === 'medium') {
        actions.push({
            priority: 'moyenne',
            action: 'Email de suivi avec recommandations produits',
            icon: '📧',
            color: '#fbbf24'
        });
    }

    return actions;
}

// ===== OPTIMAL OUTREACH WINDOW =====
function getOutreachWindow(sentimentLevel, sentimentScore, clientTags) {
    const tags = clientTags || [];
    const hasGifting   = tags.some(t => ['Anniversaire','Union','Naissance','Cadeau_Proche','Cadeau_Famille','Cadeau_Lui','Cadeau_Elle'].includes(t.t));
    const isKeyAccount = tags.some(t => t.t === 'Key_Account');
    const hasEvent     = tags.some(t => t.c === 'contexte');
    const hasNegFeed   = tags.some(t => t.t === 'Feedback_Negatif');

    if (sentimentLevel === 'negative' || hasNegFeed)
        return { window: '48h',     action: 'Service Recovery',          urgency: 'urgent',  color: '#ef4444' };
    if (sentimentLevel === 'positive' && hasGifting)
        return { window: '24h',     action: 'Opportunité gifting',        urgency: 'urgent',  color: '#f59e0b' };
    if (sentimentLevel === 'positive' && isKeyAccount)
        return { window: '3 jours', action: 'Private viewing VIC',        urgency: 'haute',   color: '#B8965A' };
    if (sentimentLevel === 'positive')
        return { window: '7 jours', action: 'Upsell · Programme VIC',     urgency: 'normale', color: '#10b981' };
    if (sentimentLevel === 'neutral' && hasEvent)
        return { window: '7 jours', action: 'Relance occasion détectée',  urgency: 'normale', color: '#f59e0b' };
    return   { window: '14 jours', action: 'Relance douce',              urgency: 'basse',   color: '#6b7280' };
}

// ===== RENDER: SENTIMENT WITH SERVICE RECOVERY =====
function renderSentiment() {
    const overview = $('sentimentOverview');
    if (!overview) return;

    const posCount = SENTIMENT_DATA.filter(s => s.level === 'positive').length;
    const neuCount = SENTIMENT_DATA.filter(s => s.level === 'neutral').length;
    const negCount = SENTIMENT_DATA.filter(s => s.level === 'negative').length;
    const avgScore = SENTIMENT_DATA.length > 0 ? Math.round(SENTIMENT_DATA.reduce((s, d) => s + d.score, 0) / SENTIMENT_DATA.length) : 0;

    // Calculate churn stats
    const clientsWithChurn = SENTIMENT_DATA.map(s => ({
        ...s,
        churn: (() => {
            const clientData = DATA.find(d => d.id === s.id || d.ca === s.id);
            const tags = clientData ? (clientData.tags || []) : [];
            const tagCount = tags.length;
            const isKeyAccount = tags.some(t => t.t === 'Key_Account');
            const hasNegFeedback = tags.some(t => t.t === 'Feedback_Negatif');
            return calculateChurnRisk(s.score, s.level, tagCount, isKeyAccount, hasNegFeedback);
        })()
    }));

    const criticalChurn = clientsWithChurn.filter(c => c.churn.risk === 'critical').length;
    const highChurn = clientsWithChurn.filter(c => c.churn.risk === 'high').length;

    const scoreColor = avgScore >= 60 ? '#10b981' : avgScore >= 40 ? '#f59e0b' : '#ef4444';
    overview.innerHTML = `
        <div class="snt-header">
            <div class="snt-header-text">
                <h2 class="snt-title">Sentiment &amp; Retention</h2>
                <p class="snt-subtitle">Analyse émotionnelle · Alertes churn · Service Recovery</p>
            </div>
            <div class="snt-avg-score" style="color:${scoreColor}">
                <span class="snt-avg-num">${avgScore}</span><span class="snt-avg-pct">%</span>
                <div class="snt-avg-label">Score moyen</div>
            </div>
        </div>
        <div class="snt-kpis">
            <div class="snt-kpi snt-kpi--positive">
                <div class="snt-kpi-val">${posCount}</div>
                <div class="snt-kpi-lbl">Positifs</div>
            </div>
            <div class="snt-kpi snt-kpi--neutral">
                <div class="snt-kpi-val">${neuCount}</div>
                <div class="snt-kpi-lbl">Neutres</div>
            </div>
            <div class="snt-kpi snt-kpi--negative">
                <div class="snt-kpi-val">${negCount}</div>
                <div class="snt-kpi-lbl">Négatifs</div>
            </div>
            <div class="snt-kpi ${criticalChurn > 0 ? 'snt-kpi--alert' : ''}">
                <div class="snt-kpi-val" style="color:${criticalChurn > 0 ? '#ef4444' : '#10b981'}">${criticalChurn}</div>
                <div class="snt-kpi-lbl">Churn critique</div>
            </div>
            <div class="snt-kpi ${highChurn > 0 ? 'snt-kpi--warn' : ''}">
                <div class="snt-kpi-val" style="color:${highChurn > 0 ? '#f59e0b' : '#10b981'}">${highChurn}</div>
                <div class="snt-kpi-lbl">Churn élevé</div>
            </div>
        </div>
        <div class="snt-distrib">
            <div class="snt-distrib-label">Distribution</div>
            <div class="snt-distrib-bar">
                ${SENTIMENT_DATA.length > 0 ? `
                <div class="snt-distrib-seg snt-seg--positive" style="width:${Math.round(posCount / SENTIMENT_DATA.length * 100)}%" title="Positifs: ${posCount}"></div>
                <div class="snt-distrib-seg snt-seg--neutral"  style="width:${Math.round(neuCount / SENTIMENT_DATA.length * 100)}%" title="Neutres: ${neuCount}"></div>
                <div class="snt-distrib-seg snt-seg--negative" style="width:${Math.round(negCount / SENTIMENT_DATA.length * 100)}%" title="Négatifs: ${negCount}"></div>
                ` : ''}
            </div>
            <div class="snt-distrib-legend">
                <span class="snt-leg-dot snt-leg--positive"></span> Positif (${posCount})
                <span class="snt-leg-dot snt-leg--neutral" style="margin-left:16px"></span> Neutre (${neuCount})
                <span class="snt-leg-dot snt-leg--negative" style="margin-left:16px"></span> Négatif (${negCount})
            </div>
        </div>
    `;

    const alerts = $('sentimentAlerts');
    if (alerts) {
        alerts.innerHTML = '';

        // Build smart triggers
        const triggers = [];
        SENTIMENT_DATA.forEach(s => {
            const cd = DATA.find(d => d.id === s.id || d.ca === s.id);
            if (!cd) return;
            const tags = cd.tags || [];

            if (s.level === 'positive' && tags.some(t => ['Anniversaire','Union','Naissance'].includes(t.t)))
                triggers.push({ type: 'gifting',    client: s.id, ca: s.ca,
                    msg: 'Opportunité gifting',
                    detail: 'Sentiment positif + occasion — service emballage cadeau recommandé',
                    urgency: 'haute', color: '#f59e0b' });

            if (s.level === 'positive' && tags.some(t => t.t === 'Key_Account'))
                triggers.push({ type: 'vic',        client: s.id, ca: s.ca,
                    msg: 'VIC en disposition d\'achat',
                    detail: 'Key Account + sentiment positif — proposer private viewing ou pré-commande',
                    urgency: 'haute', color: '#B8965A' });

            if (s.level === 'negative' && tags.some(t => t.t === 'Feedback_Negatif'))
                triggers.push({ type: 'escalation', client: s.id, ca: s.ca,
                    msg: 'Escalade Store Manager',
                    detail: 'Feedback négatif explicite — intervention dans les 24h requise',
                    urgency: 'critique', color: '#ef4444' });

            if (s.level === 'neutral' && tags.some(t => t.t === 'Churn_Risk'))
                triggers.push({ type: 'churn',      client: s.id, ca: s.ca,
                    msg: 'Signal churn précoce',
                    detail: 'Client neutre avec signal churn — follow-up prioritaire sous 7j',
                    urgency: 'modérée', color: '#fb923c' });
        });

        if (triggers.length > 0) {
            const triggersEl = document.createElement('div');
            triggersEl.className = 'snt-triggers';
            triggersEl.innerHTML = `
                <div class="snt-triggers-header">
                    <div class="snt-triggers-title">Opportunités commerciales</div>
                    <div class="snt-triggers-sub">${triggers.length} déclencheur${triggers.length > 1 ? 's' : ''} détecté${triggers.length > 1 ? 's' : ''} — Sentiment × Tags</div>
                </div>
                <div class="snt-triggers-grid">
                    ${triggers.map(tr => `
                        <div class="snt-trigger" style="border-left-color:${tr.color}">
                            <div class="snt-trigger-top">
                                <span class="snt-trigger-urgency" style="color:${tr.color}">${tr.urgency.toUpperCase()}</span>
                                <span class="snt-trigger-client">${tr.client}</span>
                                <span class="snt-trigger-ca">CA : ${tr.ca}</span>
                            </div>
                            <div class="snt-trigger-msg">${tr.msg}</div>
                            <div class="snt-trigger-detail">${tr.detail}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            alerts.appendChild(triggersEl);
        }

        const sortedByChurn = clientsWithChurn
            .filter(c => c.churn.risk === 'critical' || c.churn.risk === 'high')
            .sort((a, b) => ({ critical: 2, high: 1 }[b.churn.risk] - { critical: 2, high: 1 }[a.churn.risk]));

        if (sortedByChurn.length > 0) {
            const alertsSection = document.createElement('div');
            alertsSection.className = 'snt-recovery';
            alertsSection.innerHTML = `
                <div class="snt-recovery-header">
                    <div class="snt-recovery-title">Service Recovery</div>
                    <div class="snt-recovery-sub">Actions prioritaires — ${sortedByChurn.length} client${sortedByChurn.length > 1 ? 's' : ''} à risque</div>
                </div>
            `;

            sortedByChurn.forEach(s => {
                const recoveryActions = getServiceRecoveryActions(s.churn.risk);
                const al = document.createElement('div');
                al.className = `snt-alert snt-alert--${s.churn.risk}`;

                const actionsHTML = recoveryActions.map(action => `
                    <div class="snt-action" style="border-left-color:${action.color}">
                        <span class="snt-action-priority">${action.priority.toUpperCase()}</span>
                        <span class="snt-action-desc">${action.action}</span>
                    </div>
                `).join('');

                al.innerHTML = `
                    <div class="snt-alert-top">
                        <div class="snt-alert-client">
                            <div class="snt-alert-name">${s.id}</div>
                            <div class="snt-alert-meta">CA: ${s.ca} · Score: <span style="color:${s.level === 'negative' ? '#ef4444' : '#f59e0b'};font-weight:600">${s.score}%</span></div>
                        </div>
                        <div class="snt-churn-badge snt-churn--${s.churn.risk}">${s.churn.label}</div>
                    </div>
                    ${s.negFound.length > 0 ? `<div class="snt-alert-signals">Signaux : ${s.negFound.join(' · ')}</div>` : ''}
                    ${actionsHTML ? `<div class="snt-actions">${actionsHTML}</div>` : ''}
                `;
                alertsSection.appendChild(al);
            });

            alerts.appendChild(alertsSection);
        } else {
            alerts.innerHTML = '<div class="snt-no-alert">Aucun client à risque critique actuellement</div>';
        }
    }

    const grid = $('sentimentGrid');
    if (!grid) return;
    grid.innerHTML = '';

    clientsWithChurn.sort((a, b) => a.score - b.score).forEach(s => {
        const color = s.level === 'positive' ? '#10b981' : s.level === 'negative' ? '#ef4444' : '#6b7280';
        const lvlLabel = s.level === 'positive' ? 'Positif' : s.level === 'negative' ? 'Négatif' : 'Neutre';
        const clientData = DATA.find(d => d.id === s.id || d.ca === s.id);
        const clientTags = clientData ? (clientData.tags || []) : [];
        const outreach = getOutreachWindow(s.level, s.score, clientTags);
        const card = document.createElement('div');
        card.className = 'snt-card';
        card.innerHTML = `
            <div class="snt-card-top">
                <div class="snt-card-info">
                    <div class="snt-card-name">${s.id}</div>
                    <span class="snt-card-badge" style="color:${color};border-color:${color}20;background:${color}0D">${lvlLabel}</span>
                </div>
                <div class="snt-card-score" style="color:${color}">${s.score}<span class="snt-card-score-pct">%</span></div>
            </div>
            <div class="snt-card-bar">
                <div class="snt-card-bar-fill" style="width:${s.score}%;background:${color}"></div>
            </div>
            <div class="snt-card-ca">CA : ${s.ca} · Churn : <span style="color:${s.churn.color};font-weight:600">${s.churn.label}</span></div>
            <div class="snt-outreach snt-outreach--${outreach.urgency}" style="border-left-color:${outreach.color}">
                <span class="snt-outreach-window" style="color:${outreach.color}">${outreach.window}</span>
                <span class="snt-outreach-sep">·</span>
                <span class="snt-outreach-action">${outreach.action}</span>
            </div>
            ${(s.posFound.length > 0 || s.negFound.length > 0) ? `
            <div class="snt-card-kws">
                ${s.posFound.map(k => `<span class="snt-kw snt-kw--pos">${k}</span>`).join('')}
                ${s.negFound.map(k => `<span class="snt-kw snt-kw--neg">${k}</span>`).join('')}
            </div>` : ''}
            ${s.excerpt ? `<div class="snt-card-excerpt">"${s.excerpt}..."</div>` : ''}
            <div class="snt-card-rec">
                ${s.churn.risk === 'critical' ? '→ Intervention immédiate requise' :
                  s.level === 'negative' ? '→ Privilégier le contact personnel' :
                  s.level === 'neutral' ? '→ Proposer une expérience différenciante' :
                  '→ Fidéliser avec programme VIC'}
            </div>
        `;
        grid.appendChild(card);
    });
}

// ===== RENDER: BOUTIQUE MANAGER =====
function renderBoutique() {
    const kpis = $('boutiqueKPIs');
    if (!kpis) return;

    const avgSentiment = SENTIMENT_DATA.length > 0 ? Math.round(SENTIMENT_DATA.reduce((s, d) => s + d.score, 0) / SENTIMENT_DATA.length) : 0;
    const atRiskPct = STATS.clients > 0 ? Math.round((STATS.atRisk / STATS.clients) * 100) : 0;

    kpis.innerHTML = `
        <div class="boutique-kpi"><div class="boutique-kpi-value">${STATS.clients}</div><div class="boutique-kpi-label">Notes traitées</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:#10b981">${STATS.tags}</div><div class="boutique-kpi-label">Tags extraits</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:#d4af37">${STATS.nba}</div><div class="boutique-kpi-label">Actions NBA</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:${avgSentiment >= 60 ? '#10b981' : '#ef4444'}">${avgSentiment}%</div><div class="boutique-kpi-label">Satisfaction</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:${atRiskPct > 10 ? '#ef4444' : '#10b981'}">${atRiskPct}%</div><div class="boutique-kpi-label">À risque</div></div>
    `;

    const tagFreq = new Map();
    DATA.forEach(r => r.tags.forEach(t => tagFreq.set(t.t, (tagFreq.get(t.t) || 0) + 1)));
    const top5 = Array.from(tagFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCount = top5.length > 0 ? top5[0][1] : 1;

    const topList = $('boutiqueTopList');
    if (topList) topList.innerHTML = top5.map(([tag, count], i) => `
        <div class="top5-item"><div class="top5-rank r${i + 1}">${i + 1}</div><div class="top5-info"><div class="top5-name">${tag}</div><div class="top5-bar"><div class="top5-bar-fill" style="width:${(count / maxCount * 100).toFixed(0)}%"></div></div></div><div class="top5-count">${count}</div></div>
    `).join('');

    const actionsList = $('boutiqueActionsList');
    if (actionsList) {
        const actions = [];
        if (top5.length > 0) actions.push({ icon: '📦', text: `Réapprovisionner "${top5[0][0]}"`, priority: 'high' });
        const negClients = SENTIMENT_DATA.filter(s => s.level === 'negative');
        if (negClients.length > 0) actions.push({ icon: '📞', text: `Contacter ${negClients.length} client${negClients.length > 1 ? 's' : ''} insatisfait${negClients.length > 1 ? 's' : ''}`, priority: 'high' });
        const occasionTags = DATA.filter(r => r.tags.some(t => t.c === 'contexte'));
        if (occasionTags.length > 0) actions.push({ icon: '🎁', text: `${occasionTags.length} opportunités gifting`, priority: 'medium' });
        const vipCount = DATA.filter(r => r.tags.some(t => t.t === 'Key_Account')).length;
        if (vipCount > 0) actions.push({ icon: '⭐', text: `${vipCount} Key Accounts — planifier private viewing`, priority: 'medium' });
        actions.push({ icon: '📊', text: 'Diffuser le rapport hebdomadaire', priority: 'low' });
        actionsList.innerHTML = actions.map(a => `<div class="action-item"><div class="action-icon">${a.icon}</div><div><div class="action-text">${a.text}</div><span class="action-priority ${a.priority}">${a.priority === 'high' ? 'Urgent' : a.priority === 'medium' ? 'Cette semaine' : 'Planifié'}</span></div></div>`).join('');
    }

    const caPerf = $('boutiqueCAPerfList');
    if (caPerf) {
        const caMap = new Map();
        DATA.forEach(r => {
            if (!caMap.has(r.ca)) caMap.set(r.ca, { notes: 0, tags: 0, sentiment: 0 });
            const entry = caMap.get(r.ca);
            entry.notes++;
            entry.tags += r.tags.length;
            entry.sentiment += r.sentiment ? (r.sentiment.score || 50) : 50;
        });
        caPerf.innerHTML = Array.from(caMap.entries()).map(([ca, data]) => {
            const avgSent = Math.round(data.sentiment / data.notes);
            const color = avgSent >= 70 ? '#10b981' : avgSent >= 40 ? '#fb923c' : '#ef4444';
            return `<div class="ca-perf-item"><span class="ca-perf-name">${ca}</span><div class="ca-perf-bar"><div class="ca-perf-bar-fill" style="width:${avgSent}%;background:${color}"></div></div><div class="ca-perf-stats"><span>${data.notes} notes</span><span>${data.tags} tags</span><span style="color:${color}">${avgSent}%</span></div></div>`;
        }).join('');
    }

    const stockList = $('boutiqueStockList');
    if (stockList) {
        const stockRecs = [];
        top5.forEach(([tag, count]) => {
            if (count > 2) {
                stockRecs.push({ icon: '📦', text: `${tag}: ${count} demandes — vérifier stocks produits associés`, urgency: count > 3 ? 'high' : 'medium' });
            }
        });
        if (stockRecs.length === 0) stockRecs.push({ icon: '✅', text: 'Pas de recommandation urgente', urgency: 'medium' });
        stockList.innerHTML = stockRecs.map(s => `<div class="stock-item"><div class="stock-icon">${s.icon}</div><div class="stock-text">${s.text}</div><span class="stock-urgency ${s.urgency}">${s.urgency === 'high' ? 'Urgent' : 'À suivre'}</span></div>`).join('');
    }
}

// ===== CLIENT READINESS BRIEF =====
function renderBrief() {
    const select = $('briefClientSelect');
    const content = $('briefContent');
    if (!select || !content) return;

    // Populate dropdown
    const currentVal = select.value;
    select.innerHTML = '<option value="">— Choisir un client —</option>';
    DATA.forEach(client => {
        const opt = document.createElement('option');
        opt.value = client.id;
        opt.textContent = client.ca || client.id;
        if (client.id === currentVal) opt.selected = true;
        select.appendChild(opt);
    });

    // Restore previous selection if still valid
    if (currentVal && select.value === currentVal) {
        generateBriefContent(currentVal, content);
    } else {
        content.innerHTML = '<div class="brief-placeholder"><p>Selectionnez un client pour generer son brief de preparation.</p></div>';
    }

    // Remove previous listener to avoid duplication
    select.onchange = null;
    select.onchange = () => {
        if (select.value) {
            generateBriefContent(select.value, content);
        } else {
            content.innerHTML = '<div class="brief-placeholder"><p>Selectionnez un client pour generer son brief de preparation.</p></div>';
        }
    };
}

function generateBriefContent(clientId, container) {
    const client = DATA.find(c => c.id === clientId);
    if (!client) {
        container.innerHTML = '<div class="brief-placeholder"><p>Client introuvable.</p></div>';
        return;
    }

    const tags = Array.isArray(client.tags) ? client.tags : [];
    const profilTags = tags.filter(t => t.c === 'profil');
    const interetTags = tags.filter(t => t.c === 'interet');
    const contexteTags = tags.filter(t => t.c === 'contexte');
    const voyageTags = tags.filter(t => t.c === 'voyage');
    const marqueTags = tags.filter(t => t.c === 'marque');
    const serviceTags = tags.filter(t => t.c === 'service');

    // NBA
    const nbaItems = Array.isArray(client.nba) ? client.nba.slice(0, 3) : [];

    // Uplift
    const upliftScore = calculateUpliftScore(client);
    const sentimentLevel = (client.sentiment && typeof client.sentiment === 'object') ? (client.sentiment.level || 'neutral') : 'neutral';
    const segment = getUpliftSegment(upliftScore, sentimentLevel);

    // Churn risk
    const sentimentScore = (client.sentiment && typeof client.sentiment === 'object') ? (client.sentiment.score || 50) : 50;
    const visitFrequency = DATA.filter(d => d.ca === client.ca && client.ca).length || 1;
    const churnRisk = calculateChurnRisk(sentimentScore, sentimentLevel, visitFrequency);

    // Products
    const products = (typeof matchProductsToClient === 'function' && PRODUCTS_LOADED)
        ? matchProductsToClient(client.tags, client.clean || client.orig || '').slice(0, 3)
        : [];

    // Helper: render pill list
    function pills(tagArr) {
        if (!tagArr.length) return '<span class="brief-empty-hint">Aucune information</span>';
        return tagArr.map(t => `<span class="brief-pill">${t.t.replace(/_/g, ' ')}</span>`).join('');
    }

    // Helper: price tier
    function priceTier(price) {
        const p = parseFloat(price) || 0;
        if (p >= 3000) return '€€€€';
        if (p >= 1000) return '€€€';
        if (p >= 300) return '€€';
        return '€';
    }

    // Section 1 — Profil
    const section1 = `
        <div class="brief-card">
            <div class="brief-section-title">Profil client</div>
            <div class="brief-meta-row">
                <span class="brief-meta-item"><span class="brief-meta-key">Langue</span><span class="brief-meta-val">${client.lang || '—'}</span></span>
                <span class="brief-meta-item"><span class="brief-meta-key">Boutique</span><span class="brief-meta-val">${client.store || '—'}</span></span>
                <span class="brief-meta-item"><span class="brief-meta-key">Derniere note</span><span class="brief-meta-val">${client.date || '—'}</span></span>
            </div>
            <div class="brief-pills">${pills(profilTags)}</div>
        </div>`;

    // Section 2 — Centres d'intérêt
    const section2 = `
        <div class="brief-card">
            <div class="brief-section-title">Centres d'interet</div>
            <div class="brief-pills">${pills(interetTags)}</div>
        </div>`;

    // Section 3 — Contexte & historique
    const contextGroups = [];
    if (contexteTags.length) contextGroups.push({ label: 'Contexte', tags: contexteTags });
    if (voyageTags.length) contextGroups.push({ label: 'Voyage', tags: voyageTags });
    if (marqueTags.length) contextGroups.push({ label: 'Marques', tags: marqueTags });

    const section3 = `
        <div class="brief-card">
            <div class="brief-section-title">Contexte et historique</div>
            ${contextGroups.length ? contextGroups.map(g => `
                <div class="brief-group">
                    <span class="brief-group-label">${g.label}</span>
                    <div class="brief-pills brief-pills--inline">${pills(g.tags)}</div>
                </div>`).join('') : '<span class="brief-empty-hint">Aucun contexte renseigne</span>'}
        </div>`;

    // Section 4 — Recommandations produits
    const productsHtml = products.length ? products.map(p => `
        <div class="brief-product-item">
            <img class="brief-product-img" src="${p.imageurl || ''}" alt="${p.title || ''}" onerror="this.style.display='none'">
            <div class="brief-product-info">
                <div class="brief-product-name">${p.title || 'Produit sans titre'}</div>
                <div class="brief-product-cat">${p.category || ''}</div>
                <div class="brief-product-price">${priceTier(p.price)}</div>
                ${p.reasons && p.reasons.length ? `<div class="brief-product-reasons">${p.reasons.slice(0, 2).map(r => `<span class="brief-reason">${r}</span>`).join('')}</div>` : ''}
                ${p.itemurl ? `<a class="brief-product-link" href="${p.itemurl}" target="_blank" rel="noopener">Voir le produit</a>` : ''}
            </div>
        </div>`).join('')
        : '<span class="brief-empty-hint">Catalogue non charge ou aucun match disponible</span>';

    const section4 = `
        <div class="brief-card">
            <div class="brief-section-title">Recommandations produits</div>
            <div class="brief-products-list">${productsHtml}</div>
        </div>`;

    // Section 5 — Next Best Actions + Uplift
    const nbaHtml = nbaItems.length ? nbaItems.map(a => `
        <div class="brief-nba-item">
            <span class="brief-nba-dot"></span>
            <div class="brief-nba-body">
                <span class="brief-nba-action">${a.action || a}</span>
                ${a.type ? `<span class="brief-nba-type">${a.type}</span>` : ''}
                ${a.category ? `<span class="brief-nba-cat">${a.category}</span>` : ''}
            </div>
        </div>`).join('')
        : '<span class="brief-empty-hint">Aucune action NBA disponible</span>';

    const upliftPct = Math.round((upliftScore + 1) / 2 * 100);

    const section5 = `
        <div class="brief-card">
            <div class="brief-section-title">Next Best Actions</div>
            <div class="brief-segment-row">
                <span class="brief-segment-badge" style="border-color:${segment.color};color:${segment.color}">${segment.label}</span>
                <span class="brief-uplift-label">Uplift score : <strong>${upliftPct}%</strong></span>
            </div>
            <div class="brief-nba-list">${nbaHtml}</div>
        </div>`;

    // Section 6 — Points d'attention
    const sentimentObj = client.sentiment && typeof client.sentiment === 'object' ? client.sentiment : {};
    const sentimentLevelLabel = sentimentLevel === 'positive' ? 'Positif' : sentimentLevel === 'negative' ? 'Negatif' : 'Neutre';
    const sentimentColor = sentimentLevel === 'positive' ? '#10b981' : sentimentLevel === 'negative' ? '#ef4444' : '#888880';

    const rgpdWarning = (client.sensitiveCount > 0)
        ? `<div class="brief-rgpd-warning"><span class="brief-rgpd-icon">⚠</span><span>Donnees sensibles detectees : ${client.sensitiveCount} occurrence(s). Consulter avec precaution.</span></div>`
        : '';

    const section6 = `
        <div class="brief-card brief-attention">
            <div class="brief-section-title">Points d'attention</div>
            <div class="brief-attention-grid">
                <div class="brief-attention-block">
                    <span class="brief-attention-label">Services requis</span>
                    <div class="brief-pills brief-pills--sm">${pills(serviceTags)}</div>
                </div>
                <div class="brief-attention-block">
                    <span class="brief-attention-label">Sentiment</span>
                    <div class="brief-sentiment-badge" style="color:${sentimentColor}">
                        <span class="brief-sentiment-level">${sentimentLevelLabel}</span>
                        <span class="brief-sentiment-score">${sentimentObj.score || 0}%</span>
                    </div>
                    ${sentimentObj.justification ? `<p class="brief-sentiment-justification">${sentimentObj.justification}</p>` : ''}
                </div>
                <div class="brief-attention-block">
                    <span class="brief-attention-label">Risque churn</span>
                    <span class="brief-churn-badge" style="color:${churnRisk.color}">${churnRisk.icon} ${churnRisk.label}</span>
                </div>
            </div>
            ${rgpdWarning}
        </div>`;

    // Date du brief
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    container.innerHTML = `
        <div class="brief-header-bar">
            <div class="brief-client-name">${client.ca || client.id}</div>
            <div class="brief-date-label">Brief genere le ${today}</div>
        </div>
        ${section1}
        ${section2}
        ${section3}
        ${section4}
        ${section5}
        ${section6}
    `;
}

// ===== EXPORTS =====
function exportCSV() {
    const lines = ['ID,Date,Langue,CA,Transcription_AI_Clean,Tags,NBA_Actions'];
    DATA.forEach(r => {
        lines.push([
            r.id, r.date, r.lang, r.ca,
            '"' + (r.clean || '').replace(/"/g, '""') + '"',
            '"' + r.tags.map(t => t.t).join('|') + '"',
            '"' + (r.nba || []).map(a => a.action).join(' | ') + '"'
        ].join(','));
    });
    dl(lines.join('\n'), 'lvmh_ai_platform.csv', 'text/csv');
}
function exportJSON() {
    const payload = DATA.map(r => ({
        id: r.id, date: r.date, lang: r.lang, ca: r.ca,
        clean: r.clean, tags: r.tags, nba: r.nba,
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

// ===== COACH RGPD — FORMATION COMPLÈTE =====

const COACH_SCENARIOS = [
    { id:1, level:'facile', levelLabel:'Facile', levelColor:'#22c55e',
      title:'Prénom d\'un tiers',
      note:"Cliente Mme Laurent est venue avec son mari Jean-Pierre qui souhaitait lui choisir un sac pour leur anniversaire de mariage. Elle a finalement opté pour le Neverfull en cuir.",
      violations:['Jean-Pierre'],
      hint:"Un prénom de tiers (conjoint, enfant, ami) est une donnée personnelle tierce. Remplacez par « son mari » ou « son compagnon ».",
      category:'Tiers' },
    { id:2, level:'facile', levelLabel:'Facile', levelColor:'#22c55e',
      title:'Âge exact',
      note:"Cliente de 47 ans cherche un cadeau pour ses 48 ans en juin. Intéressée par la maroquinerie iconique, budget autour de 2000€.",
      violations:['47 ans','48 ans'],
      hint:"L'âge exact est une donnée biométrique. Préférez des tranches générationnelles : « quadragénaire », « génération X », « femme d'une quarantaine d'années ».",
      category:'Biométrique' },
    { id:3, level:'facile', levelLabel:'Facile', levelColor:'#22c55e',
      title:'Profession + lieu de travail',
      note:"Cliente chirurgienne à l'Hôpital Lariboisière, venue dans notre boutique après une longue journée. Cherche un sac professionnel élégant. Budget illimité.",
      violations:['chirurgienne','Hôpital Lariboisière'],
      hint:"Le lieu de travail précis combiné à la profession permet d'identifier la personne. Préférez : « cliente du secteur médical », supprimez le nom de l'établissement.",
      category:'Identification' },
    { id:4, level:'intermediaire', levelLabel:'Intermédiaire', levelColor:'#f59e0b',
      title:'Origine ethnique',
      note:"Cliente d'origine chinoise, en visite depuis Shanghai pour 3 jours à Paris. Parle peu français. Très intéressée par les modèles Speedy et Alma. Fort pouvoir d'achat.",
      violations:["d'origine chinoise"],
      hint:"L'origine ethnique est une donnée sensible Art. 9 RGPD. Notez les préférences linguistiques sans mentionner l'origine : « parle mandarin », « cliente internationale ».",
      category:'Origine' },
    { id:5, level:'intermediaire', levelLabel:'Intermédiaire', levelColor:'#f59e0b',
      title:'Situation familiale douloureuse',
      note:"Cliente récemment divorcée souhaitant se faire plaisir. Budget important, environ 5000€. Vient régulièrement depuis sa séparation il y a 6 mois. Intéressée par la bijouterie.",
      violations:['récemment divorcée','depuis sa séparation il y a 6 mois'],
      hint:"La situation matrimoniale et les événements de vie privée sont des données sensibles. Notez simplement « cliente régulière » et le budget sans contexte personnel.",
      category:'Vie privée' },
    { id:6, level:'intermediaire', levelLabel:'Intermédiaire', levelColor:'#f59e0b',
      title:'Religion',
      note:"Cliente très pieuse, musulmane pratiquante qui fait le ramadan. Souhaite un cadeau pour l'Aïd. Préfère les articles sans cuir d'origine porcine. Intéressée par la toile Monogram.",
      violations:['très pieuse','musulmane pratiquante','fait le ramadan'],
      hint:"La religion est une donnée sensible Art. 9. Vous pouvez noter la préférence matière (évite cuir porcin) et l'occasion (fête) sans mentionner la religion.",
      category:'Religion' },
    { id:7, level:'avance', levelLabel:'Avancé', levelColor:'#ef4444',
      title:'Données de santé implicites',
      note:"Cliente enceinte de 6 mois cherche un sac pratique mais élégant. Préfère les modèles portés épaule pour soulager son dos. Budget 1500€. A mentionné un suivi médical à Paris.",
      violations:['enceinte de 6 mois','soulager son dos'],
      hint:"La grossesse est une donnée de santé. Reformulez : « cherche un sac ergonomique à porter épaule » sans mentionner la grossesse ni les symptômes physiques.",
      category:'Santé' },
    { id:8, level:'avance', levelLabel:'Avancé', levelColor:'#ef4444',
      title:'Données financières précises',
      note:"Client PDG d'une PME, chiffre d'affaires annuel de 2M€. A mentionné investir dans l'immobilier de luxe à Neuilly. Cherche une montre Tambour. Achète 3-4 fois par an.",
      violations:["chiffre d'affaires annuel de 2M€","investir dans l'immobilier de luxe à Neuilly"],
      hint:"Les données financières précises (revenus, investissements) sont des données sensibles. Notez simplement le segment (« HNWI », « grand compte ») et la fréquence d'achat.",
      category:'Finance' },
    { id:9, level:'avance', levelLabel:'Avancé', levelColor:'#ef4444',
      title:'Vie sexuelle et tiers identifié',
      note:"Cliente venue avec sa partenaire Sophie pour choisir des cadeaux assortis pour leur PACS le mois prochain. Budget 3000€ chacune. Intérêt fort pour les accessoires en toile.",
      violations:['partenaire Sophie','leur PACS'],
      hint:"Supprimez le prénom « Sophie » (tiers identifié) et reformulez « PACS » en « célébration importante » ou « événement personnel » sans révéler la nature du lien.",
      category:'Vie sexuelle / Tiers' },
    { id:10, level:'expert', levelLabel:'Expert', levelColor:'#7c3aed',
      title:'Violations multiples — cas réel',
      note:"M. Ahmed Bensalem, 52 ans, directeur d'une clinique privée à Neuilly, d'origine tunisienne. Sa femme Samira l'accompagnait. Il est diabétique et cherche un portefeuille léger. Budget 2500€. Vote habituellement à gauche selon ses propres mots.",
      violations:['Ahmed Bensalem','52 ans',"d'origine tunisienne",'Samira','diabétique','Vote habituellement à gauche'],
      hint:"6 violations : nom+prénom (identifiant), âge (biométrique), origine (Art.9), prénom conjoint (tiers), santé (Art.9), opinion politique (Art.9). Tout doit être reformulé ou supprimé.",
      category:'Multiple' }
];

const RGPD_REFERENCE_CARDS = [
    { icon:'🧬', title:'Origine ethnique', article:'Art. 9 RGPD',
      forbidden:'"d\'origine marocaine", "cliente asiatique", "d\'origine africaine"',
      allowed:'"Cliente internationale", "parle mandarin", "en visite de Shanghai"',
      color:'#ef4444', why:'Révèle l\'origine raciale ou ethnique. Aucune finalité CRM légitime.' },
    { icon:'⛪', title:'Religion', article:'Art. 9 RGPD',
      forbidden:'"musulmane pratiquante", "fait le ramadan", "va à la messe"',
      allowed:'"Évite le cuir porcin", "célèbre une fête religieuse", "régime halal"',
      color:'#f97316', why:'Les croyances religieuses sont strictement protégées. Seules les contraintes pratiques (régime, matière) sont notables.' },
    { icon:'🏥', title:'Santé', article:'Art. 9 RGPD',
      forbidden:'"diabétique", "enceinte de 6 mois", "souffre de dos", "sous traitement"',
      allowed:'"Préfère les sacs légers", "préfère porter à l\'épaule", "évite le cuir épais"',
      color:'#ec4899', why:'Les données de santé sont les plus sensibles du RGPD. Notez uniquement les contraintes pratiques, jamais le diagnostic.' },
    { icon:'💑', title:'Vie sexuelle', article:'Art. 9 RGPD',
      forbidden:'"homosexuelle", "partenaire du même sexe", "PACS avec"',
      allowed:'"Venue avec son partenaire", "achat pour une célébration", "cadeau pour son partenaire"',
      color:'#a855f7', why:'L\'orientation sexuelle ne peut jamais être enregistrée. Notez l\'occasion sans préciser la nature du lien.' },
    { icon:'🗳️', title:'Opinion politique', article:'Art. 9 RGPD',
      forbidden:'"vote à gauche", "militant pour...", "soutient Macron", "manifestant"',
      allowed:'— Aucune formulation acceptable. Supprimer entièrement.',
      color:'#6366f1', why:'Les opinions politiques sont totalement interdites en CRM. Aucune finalité commerciale ne justifie leur collecte.' },
    { icon:'👥', title:'Tiers identifiés', article:'Art. 5 RGPD',
      forbidden:'"venue avec son mari Jean-Pierre", "sa fille Emma, 8 ans", "son ami Marco"',
      allowed:'"Venue avec son conjoint", "accompagnée de sa fille", "en compagnie d\'un ami"',
      color:'#0ea5e9', why:'Les tiers n\'ont pas consenti à être dans votre CRM. Mentionnez le lien (conjoint, enfant) mais jamais leur prénom.' },
    { icon:'📅', title:'Âge exact', article:'Art. 5 RGPD',
      forbidden:'"47 ans", "née en 1976", "fête ses 50 ans en mars prochain"',
      allowed:'"Génération X", "quinquagénaire", "femme d\'une quarantaine d\'années", "senior"',
      color:'#14b8a6', why:'L\'âge exact permet d\'identifier une personne. Utilisez des tranches générationnelles qui préservent l\'utilité CRM sans être précis.' },
    { icon:'💰', title:'Finance détaillée', article:'Art. 9 RGPD',
      forbidden:'"gagne 15k/mois", "CA de 2M€", "en faillite", "surendetté"',
      allowed:'"Segment HNWI", "budget premium", "profil grand compte", "achète régulièrement"',
      color:'#84cc16', why:'Les données financières précises (revenus, dettes) révèlent la situation patrimoniale. Utilisez des segments ou des comportements d\'achat.' }
];

function loadCoachProgress() {
    try {
        const s = localStorage.getItem('lvmh_coach_progress');
        return s ? JSON.parse(s) : { perfect: 0, attempts: 0, scenariosDone: [], streak: 0 };
    } catch(e) { return { perfect: 0, attempts: 0, scenariosDone: [], streak: 0 }; }
}

function saveCoachProgress(data) {
    try { localStorage.setItem('lvmh_coach_progress', JSON.stringify(data)); } catch(e) {}
}

function getCoachLevel(perfect) {
    if (perfect >= 20) return { label:'Certifié RGPD', color:'#B8965A', next: Infinity, stars:4 };
    if (perfect >= 10) return { label:'Expert', color:'#3b82f6', next: 20, stars:3 };
    if (perfect >= 4)  return { label:'Confirmé', color:'#10b981', next: 10, stars:2 };
    return { label:'Novice', color:'#9ca3af', next: 4, stars:1 };
}

function renderCoach() {
    const container = document.querySelector('#page-coach .coach-container');
    if (!container) return;

    const prog = loadCoachProgress();
    const lvl = getCoachLevel(prog.perfect);
    const nextTarget = lvl.next === Infinity ? prog.perfect : lvl.next;
    const fillPct = lvl.next === Infinity ? 100 : Math.min(100, Math.round((prog.perfect / lvl.next) * 100));

    container.innerHTML = `
        <div class="coach-progress-banner">
            <div class="coach-level-badge" style="border-color:${lvl.color};color:${lvl.color}">
                <span class="coach-level-stars">${Array(lvl.stars).fill('◈').join('')}</span>
                <span class="coach-level-label">${lvl.label}</span>
            </div>
            <div class="coach-progress-track">
                <div class="coach-progress-fill" style="width:${fillPct}%;background:${lvl.color}"></div>
            </div>
            <div class="coach-progress-info">
                <span class="coach-perfect-count">${prog.perfect} note${prog.perfect !== 1 ? 's' : ''} parfaite${prog.perfect !== 1 ? 's' : ''}</span>
                ${lvl.next !== Infinity ? `<span class="coach-next-level">encore ${lvl.next - prog.perfect} pour <strong>${getCoachLevel(lvl.next).label}</strong></span>` : `<span class="coach-next-level" style="color:${lvl.color}">Niveau maximum atteint !</span>`}
            </div>
            ${prog.streak > 1 ? `<div class="coach-streak-badge">🔥 ${prog.streak} sessions</div>` : ''}
        </div>

        <div class="coach-tabs">
            <button class="coach-tab coach-tab--active" data-tab="train" onclick="switchCoachTab(this,'train')">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8l3.5 3.5L14 3"/></svg>
                Entraînement
            </button>
            <button class="coach-tab" data-tab="reference" onclick="switchCoachTab(this,'reference')">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="1" width="9" height="13" rx="1"/><path d="M5 5h5M5 8h4M5 11h3"/><path d="M13 7l2 2-2 2"/></svg>
                Référence RGPD
            </button>
        </div>

        <div id="coach-panel-train" class="coach-tab-panel">
            <div class="coach-mode-switcher">
                <button class="coach-mode-btn coach-mode-btn--active" data-mode="free" onclick="switchCoachMode(this,'free')">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 14l1-4L11 2l3 3-8 8-4 1z"/></svg>
                    Mode Libre
                </button>
                <button class="coach-mode-btn" data-mode="scenario" onclick="switchCoachMode(this,'scenario')">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="2" width="14" height="12" rx="1"/><path d="M1 6h14M5 2v4M11 2v4"/></svg>
                    Scénarios guidés
                    <span class="coach-mode-count">${COACH_SCENARIOS.length}</span>
                </button>
            </div>

            <div id="coach-mode-free">
                <div class="coach-input-section">
                    <label class="coach-label">Votre note (fictive)</label>
                    <div class="coach-textarea-wrap">
                        <textarea id="coachInput" class="coach-textarea" placeholder="Tapez ou dictez une note fictive... Ex: « Cliente d'origine japonaise, 43 ans, enceinte de 5 mois, cherche un sac léger pour son mari Jean-Luc »"></textarea>
                        <button id="coachMic" class="coach-mic-btn" title="Dicter">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        </button>
                    </div>
                    <div id="coach-live-violations" class="coach-live-violations coach-live-violations--empty">
                        <span class="coach-live-idle">Commencez à taper — les violations s'afficheront en direct</span>
                    </div>
                    <button id="coachAnalyze" class="coach-analyze-btn">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                        Analyser avec l'IA
                    </button>
                </div>
                <div id="coachResults" class="coach-results"></div>
            </div>

            <div id="coach-mode-scenario" style="display:none">
                ${buildScenarioPanel(prog)}
            </div>
        </div>

        <div id="coach-panel-reference" class="coach-tab-panel" style="display:none">
            <div class="coach-ref-intro">
                <p>Les <strong>8 catégories interdites</strong> selon l'Art. 9 du RGPD. Cliquez sur une carte pour voir comment reformuler.</p>
            </div>
            <div class="coach-ref-grid">
                ${RGPD_REFERENCE_CARDS.map((card, i) => `
                    <div class="coach-ref-card" onclick="this.classList.toggle('coach-ref-card--flipped')">
                        <div class="coach-ref-card-inner">
                            <div class="coach-ref-front" style="border-top:3px solid ${card.color}">
                                <div class="coach-ref-icon">${card.icon}</div>
                                <div class="coach-ref-title">${card.title}</div>
                                <div class="coach-ref-article" style="color:${card.color}">${card.article}</div>
                                <div class="coach-ref-flip-hint">Cliquer pour voir →</div>
                            </div>
                            <div class="coach-ref-back" style="border-top:3px solid ${card.color}">
                                <div class="coach-ref-back-section">
                                    <div class="coach-ref-back-label" style="color:#ef4444">❌ Interdit</div>
                                    <div class="coach-ref-back-text">${card.forbidden}</div>
                                </div>
                                <div class="coach-ref-back-section">
                                    <div class="coach-ref-back-label" style="color:#22c55e">✓ Reformuler</div>
                                    <div class="coach-ref-back-text">${card.allowed}</div>
                                </div>
                                <div class="coach-ref-back-why">${card.why}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    setupCoachFreeMode();
}

function buildScenarioPanel(prog) {
    const idx = window._coachScenarioIdx || 0;
    const sc = COACH_SCENARIOS[idx];
    const doneScenariosCount = (prog.scenariosDone || []).length;
    const allDots = COACH_SCENARIOS.map((s, i) => {
        const done = (prog.scenariosDone || []).includes(s.id);
        return `<span class="coach-sc-dot ${done ? 'done' : ''} ${i === idx ? 'active' : ''}"></span>`;
    }).join('');

    return `
        <div class="coach-scenario-wrap">
            <div class="coach-sc-header">
                <button class="coach-sc-nav" onclick="moveScenario(-1)" ${idx === 0 ? 'disabled' : ''}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="10 12 6 8 10 4"/></svg>
                </button>
                <div class="coach-sc-meta">
                    <span class="coach-sc-counter">${idx + 1} / ${COACH_SCENARIOS.length}</span>
                    <span class="coach-sc-level-badge" style="background:${sc.levelColor}20;color:${sc.levelColor};border-color:${sc.levelColor}40">${sc.levelLabel}</span>
                    <span class="coach-sc-category">${sc.category}</span>
                </div>
                <button class="coach-sc-nav" onclick="moveScenario(1)" ${idx === COACH_SCENARIOS.length - 1 ? 'disabled' : ''}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 12 10 8 6 4"/></svg>
                </button>
            </div>
            <div class="coach-sc-dots">${allDots}</div>

            <div class="coach-sc-title">${sc.title}</div>

            <div class="coach-sc-original-label">Note originale (avec violations)</div>
            <div class="coach-sc-original">${escapeHtml(sc.note)}</div>

            <div class="coach-sc-instruction">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1l2 4 4.5.7-3.25 3.15.77 4.5L8 11.25 3.98 13.35l.77-4.5L1.5 5.7 6 5z"/></svg>
                Corrigez la note ci-dessous — supprimez ou reformulez les violations RGPD
            </div>

            <div class="coach-textarea-wrap">
                <textarea id="scenarioInput" class="coach-textarea coach-scenario-textarea" spellcheck="false">${escapeHtml(sc.note)}</textarea>
            </div>

            <div class="coach-sc-actions">
                <button class="coach-hint-btn" onclick="toggleScenarioHint()">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5h.01"/></svg>
                    Indice
                </button>
                <button class="coach-validate-btn" onclick="validateScenario(${sc.id})">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8l4 4 8-8"/></svg>
                    Valider ma correction
                </button>
            </div>

            <div id="coach-sc-hint" class="coach-sc-hint" style="display:none">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5h.01"/></svg>
                ${sc.hint}
            </div>

            <div id="coach-sc-result" class="coach-sc-result" style="display:none"></div>
        </div>
    `;
}

function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function switchCoachTab(btn, tab) {
    document.querySelectorAll('.coach-tab').forEach(t => t.classList.remove('coach-tab--active'));
    btn.classList.add('coach-tab--active');
    document.getElementById('coach-panel-train').style.display = tab === 'train' ? '' : 'none';
    document.getElementById('coach-panel-reference').style.display = tab === 'reference' ? '' : 'none';
}

function switchCoachMode(btn, mode) {
    document.querySelectorAll('.coach-mode-btn').forEach(b => b.classList.remove('coach-mode-btn--active'));
    btn.classList.add('coach-mode-btn--active');
    document.getElementById('coach-mode-free').style.display = mode === 'free' ? '' : 'none';
    document.getElementById('coach-mode-scenario').style.display = mode === 'scenario' ? '' : 'none';
    if (mode === 'scenario') refreshScenarioPanel();
}

function setupCoachFreeMode() {
    const input = document.getElementById('coachInput');
    const results = document.getElementById('coachResults');
    const analyzeBtn = document.getElementById('coachAnalyze');
    const micBtn = document.getElementById('coachMic');
    let liveTimer = null;

    if (input) {
        input.addEventListener('input', () => {
            clearTimeout(liveTimer);
            liveTimer = setTimeout(() => updateLiveViolations(input.value), 400);
        });
    }

    if (micBtn) {
        micBtn.onclick = () => {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) { showToast('Reconnaissance vocale non supportée', 'error'); return; }
            const rec = new SR();
            rec.lang = 'fr-FR';
            rec.interimResults = false;
            micBtn.classList.add('recording');
            rec.start();
            rec.onresult = e => {
                input.value = e.results[0][0].transcript;
                micBtn.classList.remove('recording');
                updateLiveViolations(input.value);
            };
            rec.onerror = () => micBtn.classList.remove('recording');
            rec.onend = () => micBtn.classList.remove('recording');
        };
    }

    if (!analyzeBtn) return;
    analyzeBtn.onclick = async () => {
        const text = (input ? input.value : '').trim();
        if (!text) { showToast('Entrez une note à analyser', 'error'); return; }
        results.innerHTML = '<div class="coach-spinner-wrap"><div class="coach-spinner"></div><span>Analyse IA en cours...</span></div>';
        try {
            const res = await fetch(`${API_BASE}/api/coach-rgpd`, {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ text, language:'FR' })
            });
            if (!res.ok) throw new Error('Erreur serveur');
            const data = await res.json();
            renderCoachResults(results, text, data);
            // Update progress if no violations
            if ((data.rgpd_score || 0) >= 100 || (data.violations || []).length === 0) {
                const prog = loadCoachProgress();
                prog.perfect = (prog.perfect || 0) + 1;
                prog.attempts = (prog.attempts || 0) + 1;
                saveCoachProgress(prog);
                updateCoachProgressBanner();
                showToast('Note parfaite ! Progression mise à jour.', 'success');
            } else {
                const prog = loadCoachProgress();
                prog.attempts = (prog.attempts || 0) + 1;
                saveCoachProgress(prog);
            }
        } catch(e) {
            results.innerHTML = `<div class="coach-error">Erreur lors de l'analyse. Vérifiez que le serveur est lancé.</div>`;
        }
    };
}

function updateLiveViolations(text) {
    const panel = document.getElementById('coach-live-violations');
    if (!panel) return;
    if (!text || text.trim().length < 5) {
        panel.className = 'coach-live-violations coach-live-violations--empty';
        panel.innerHTML = '<span class="coach-live-idle">Commencez à taper — les violations s\'afficheront en direct</span>';
        return;
    }
    let detections = [];
    if (typeof RGPD !== 'undefined' && RGPD.scanText) {
        const res = RGPD.scanText(text, 'FR');
        detections = res.detections || [];
    }
    const catLabels = {
        accessCodes:'Codes d\'accès', identity:'Identité', orientation:'Vie sexuelle',
        politics:'Opinion politique', religion:'Religion', familyConflict:'Conflit familial',
        finance:'Finance', appearance:'Apparence dégradante'
    };
    if (detections.length === 0) {
        panel.className = 'coach-live-violations coach-live-violations--clean';
        panel.innerHTML = `<span class="coach-live-ok"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8l4 4 8-8"/></svg> Aucune violation détectée pour l'instant</span>`;
    } else {
        panel.className = 'coach-live-violations coach-live-violations--violations';
        panel.innerHTML = `
            <div class="coach-live-header">
                <span class="coach-live-count">${detections.length}</span>
                <span class="coach-live-label">violation${detections.length > 1 ? 's' : ''} détectée${detections.length > 1 ? 's' : ''} en direct</span>
            </div>
            <div class="coach-live-list">
                ${detections.map(d => `
                    <div class="coach-live-item">
                        <span class="coach-live-word">"${d.match}"</span>
                        <span class="coach-live-cat">${catLabels[d.category] || d.category}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function updateCoachProgressBanner() {
    const prog = loadCoachProgress();
    const lvl = getCoachLevel(prog.perfect);
    const fillPct = lvl.next === Infinity ? 100 : Math.min(100, Math.round((prog.perfect / lvl.next) * 100));
    const badge = document.querySelector('.coach-level-badge');
    const fill = document.querySelector('.coach-progress-fill');
    const info = document.querySelector('.coach-progress-info');
    if (badge) { badge.style.borderColor = lvl.color; badge.style.color = lvl.color; badge.querySelector('.coach-level-label').textContent = lvl.label; }
    if (fill) { fill.style.width = fillPct + '%'; fill.style.background = lvl.color; }
    if (info) {
        const pc = info.querySelector('.coach-perfect-count');
        if (pc) pc.textContent = `${prog.perfect} note${prog.perfect !== 1 ? 's' : ''} parfaite${prog.perfect !== 1 ? 's' : ''}`;
    }
}

function moveScenario(delta) {
    window._coachScenarioIdx = Math.max(0, Math.min(COACH_SCENARIOS.length - 1, (window._coachScenarioIdx || 0) + delta));
    refreshScenarioPanel();
}

function refreshScenarioPanel() {
    const wrap = document.getElementById('coach-mode-scenario');
    if (!wrap) return;
    const prog = loadCoachProgress();
    wrap.innerHTML = buildScenarioPanel(prog);
}

function toggleScenarioHint() {
    const hint = document.getElementById('coach-sc-hint');
    if (!hint) return;
    hint.style.display = hint.style.display === 'none' ? 'flex' : 'none';
}

function validateScenario(scenarioId) {
    const sc = COACH_SCENARIOS.find(s => s.id === scenarioId);
    if (!sc) return;
    const input = document.getElementById('scenarioInput');
    const result = document.getElementById('coach-sc-result');
    if (!input || !result) return;

    const reformulation = input.value;
    const lowerRef = reformulation.toLowerCase();
    const remaining = sc.violations.filter(v => lowerRef.includes(v.toLowerCase()));
    const fixed = sc.violations.filter(v => !lowerRef.includes(v.toLowerCase()));
    const passed = remaining.length === 0;
    const score = Math.round((fixed.length / sc.violations.length) * 100);

    result.style.display = 'block';
    if (passed) {
        result.className = 'coach-sc-result coach-sc-result--pass';
        result.innerHTML = `
            <div class="coach-sc-result-icon">✓</div>
            <div>
                <div class="coach-sc-result-title">Parfait ! Note conforme RGPD</div>
                <div class="coach-sc-result-detail">Toutes les violations ont été supprimées ou reformulées.</div>
            </div>
        `;
        // Save progress
        const prog = loadCoachProgress();
        if (!(prog.scenariosDone || []).includes(sc.id)) {
            prog.scenariosDone = [...(prog.scenariosDone || []), sc.id];
            prog.perfect = (prog.perfect || 0) + 1;
            prog.attempts = (prog.attempts || 0) + 1;
            saveCoachProgress(prog);
            updateCoachProgressBanner();
            refreshScenarioDots();
        }
    } else if (score > 0) {
        result.className = 'coach-sc-result coach-sc-result--partial';
        result.innerHTML = `
            <div class="coach-sc-result-icon">~</div>
            <div>
                <div class="coach-sc-result-title">Presque ! ${fixed.length}/${sc.violations.length} violation${fixed.length > 1 ? 's' : ''} corrigée${fixed.length > 1 ? 's' : ''}</div>
                <div class="coach-sc-result-detail">Il reste encore : ${remaining.map(r => `<strong>"${r}"</strong>`).join(', ')}</div>
            </div>
        `;
        const prog = loadCoachProgress();
        prog.attempts = (prog.attempts || 0) + 1;
        saveCoachProgress(prog);
    } else {
        result.className = 'coach-sc-result coach-sc-result--fail';
        result.innerHTML = `
            <div class="coach-sc-result-icon">✗</div>
            <div>
                <div class="coach-sc-result-title">Les violations sont toujours présentes</div>
                <div class="coach-sc-result-detail">Retrouvez : ${sc.violations.map(v => `<strong>"${v}"</strong>`).join(', ')}</div>
            </div>
        `;
        const prog = loadCoachProgress();
        prog.attempts = (prog.attempts || 0) + 1;
        saveCoachProgress(prog);
    }

    if (passed) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'coach-next-scenario-btn';
        nextBtn.innerHTML = `Scénario suivant <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 12 10 8 6 4"/></svg>`;
        nextBtn.onclick = () => {
            const maxIdx = COACH_SCENARIOS.length - 1;
            window._coachScenarioIdx = Math.min(maxIdx, (window._coachScenarioIdx || 0) + 1);
            refreshScenarioPanel();
        };
        result.appendChild(nextBtn);
    }
}

function refreshScenarioDots() {
    const prog = loadCoachProgress();
    const idx = window._coachScenarioIdx || 0;
    const dotsEl = document.querySelector('.coach-sc-dots');
    if (!dotsEl) return;
    dotsEl.innerHTML = COACH_SCENARIOS.map((s, i) => {
        const done = (prog.scenariosDone || []).includes(s.id);
        return `<span class="coach-sc-dot ${done ? 'done' : ''} ${i === idx ? 'active' : ''}"></span>`;
    }).join('');
}

function renderCoachResults(container, originalText, data) {
    const rgpd_score = data.rgpd_score || 0;
    const quality_score = data.quality_score || 0;
    const violations = data.violations || [];
    const extractable_tags_count = data.extractable_tags_count || 0;
    const tags = data.tags || [];
    const feedback = data.feedback || '';
    const suggestions = data.suggestions || [];

    const rgpdColor = rgpd_score >= 80 ? '#22c55e' : rgpd_score >= 50 ? '#f59e0b' : '#ef4444';

    let highlighted = escapeHtml(originalText);
    const sortedV = [...violations].sort((a, b) => ((b.word || b.text || '').length) - ((a.word || a.text || '').length));
    sortedV.forEach(v => {
        const word = v.word || v.text || v.value || v.found || '';
        if (!word) return;
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        highlighted = highlighted.replace(new RegExp(escaped, 'gi'), match =>
            `<span class="coach-violation-hl" title="${v.cat || v.category || 'Donnée sensible'}">${match}</span>`
        );
    });

    const tagPills = tags.map(tg =>
        `<span class="coach-tag-pill tag-${(tg.c || '').toLowerCase()}">${tg.t || tg}</span>`
    ).join('');

    const suggestionsHTML = suggestions.length ? `
        <div class="coach-section">
            <h3 class="coach-section-title">Suggestions de reformulation</h3>
            ${suggestions.map(s => `
                <div class="coach-suggestion">
                    <div class="coach-suggestion-original"><s>${s.original}</s></div>
                    <div class="coach-suggestion-arrow">→</div>
                    <div class="coach-suggestion-new">${s.reformulation}</div>
                    <div class="coach-suggestion-reason">${s.reason}</div>
                </div>
            `).join('')}
        </div>
    ` : '';

    container.innerHTML = `
        <div class="coach-results-header">Résultats de l'analyse IA</div>
        <div class="coach-scores">
            <div class="coach-score-item">
                <div class="coach-score-label">Conformité RGPD</div>
                <div class="coach-score-bar-wrap"><div class="coach-score-bar" style="width:${rgpd_score}%;background:${rgpdColor}"></div></div>
                <div class="coach-score-value" style="color:${rgpdColor}">${rgpd_score}%</div>
            </div>
            <div class="coach-score-item">
                <div class="coach-score-label">Richesse de la note</div>
                <div class="coach-score-bar-wrap"><div class="coach-score-bar" style="width:${quality_score}%;background:#3b82f6"></div></div>
                <div class="coach-score-value" style="color:#3b82f6">${quality_score}%</div>
            </div>
        </div>
        <div class="coach-section">
            <h3 class="coach-section-title">Votre note analysée</h3>
            <div class="coach-highlighted-text">${highlighted}</div>
            ${violations.length ? `<p class="coach-violation-count">${violations.length} violation(s) RGPD détectée(s)</p>` : '<p class="coach-ok">✓ Aucune violation RGPD détectée</p>'}
        </div>
        ${suggestionsHTML}
        ${feedback ? `<div class="coach-section"><h3 class="coach-section-title">Feedback IA</h3><p class="coach-feedback">${feedback}</p></div>` : ''}
        ${tags.length ? `<div class="coach-section"><h3 class="coach-section-title">Tags CRM extractibles (${extractable_tags_count})</h3><div class="coach-tags-wrap">${tagPills}</div></div>` : ''}
        <button class="coach-retry-btn" onclick="document.getElementById('coachInput').value='';document.getElementById('coachResults').innerHTML='';document.getElementById('coach-live-violations').innerHTML='<span class=coach-live-idle>Commencez à taper — les violations s\\'afficheront en direct</span>';document.getElementById('coach-live-violations').className='coach-live-violations coach-live-violations--empty';document.getElementById('coachInput').focus()">
            Réessayer
        </button>
    `;
}
