/**
 * LVMH Voice-to-Tag — App Controller
 * Router, Auth, Supabase client, Speech Recognition, State management
 */

// ===== CONFIG =====
const SUPABASE_URL = 'https://vgkklymckkwrcpjrnzhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna2tseW1ja2t3cmNwanJuemhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDY2ODMsImV4cCI6MjA4NjM4MjY4M30.xSXtpyfaPSVkqVFDN8lDV-rzgQVgOWbVgdi5GfXmPkI';
// Backend API : si l'app est servie sur le port 8000 (serveur statique), appeler le Flask sur 5001
const API_BASE = (typeof window !== 'undefined' && (window.location.port === '8000' || (window.location.port === '' && !window.location.hostname.includes('5001'))))
    ? 'http://localhost:5001'
    : '';

// ===== SUPABASE CLIENT =====
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DOM HELPER =====
const $ = id => document.getElementById(id);

// ===== STATE =====
let currentUser = null;   // { id, first_name, last_name, role, boutique_id, boutique: { id, name, code } }
let DATA = [];
let RGPD_BAD = [];
let PRIVACY_SCORES = [];
let SENTIMENT_DATA = [];
let STATS = { clients: 0, tags: 0, ai: 0, rgpd: 0, nba: 0, privacyAvg: 0, atRisk: 0 };

// ===== ICONS (SVG) =====
const ICONS = {
    mic: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
    user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    target: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    bag: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
    mail: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    chart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    users: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    column: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`,
    chat: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    store: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"></path></svg>`,
    pulse: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
    upload: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    admin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
};

// ===== NAV DEFINITIONS =====
const VENDEUR_NAV = [
    { id: 'v-home', icon: ICONS.mic, label: 'Accueil', page: 'page-v-home', title: 'Accueil' },
    { id: 'clients', icon: ICONS.user, label: 'Mes Clients', page: 'page-clients', title: 'Mes Clients' },
    { id: 'nba', icon: ICONS.target, label: 'NBA', page: 'page-nba', title: 'Next Best Action' },
    { id: 'products', icon: ICONS.bag, label: 'Produits', page: 'page-products', title: 'Product Matcher' },
    { id: 'brief', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`, label: 'Brief', page: 'page-v-brief', title: 'Client Readiness Brief' },
    { id: 'followup', icon: ICONS.mail, label: 'Follow-up', page: 'page-followup', title: 'Follow-up' },
    { id: 'v-coach', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`, label: 'Coach RGPD', page: 'page-coach', title: 'Coach RGPD' },
];

const MANAGER_NAV = [
    { id: 'm-dashboard', icon: ICONS.chart, label: 'Dashboard', page: 'page-m-dashboard', title: 'Dashboard' },
    { id: 'clients', icon: ICONS.users, label: 'Tous les Clients', page: 'page-clients', title: 'Tous les Clients' },
    { id: 'nba', icon: ICONS.target, label: 'NBA', page: 'page-nba', title: 'Next Best Action' },
    { id: 'products', icon: ICONS.bag, label: 'Produits', page: 'page-products', title: 'Product Matcher' },
    { id: 'brief', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`, label: 'Brief', page: 'page-v-brief', title: 'Client Readiness Brief' },
    { id: 'followup', icon: ICONS.mail, label: 'Follow-up', page: 'page-followup', title: 'Follow-up' },
    { id: 'sep1', sep: true },
    { id: 'm-privacy', icon: ICONS.shield, label: 'Privacy', page: 'page-m-privacy', title: 'Privacy Score' },
    { id: 'm-coach', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`, label: 'Coach RGPD', page: 'page-coach', title: 'Coach RGPD' },
    { id: 'm-sentiment', icon: ICONS.chat, label: 'Sentiment', page: 'page-m-sentiment', title: 'Sentiment & Retention' },
    { id: 'm-boutique', icon: ICONS.store, label: 'Boutique', page: 'page-m-boutique', title: 'Dashboard Boutique' },
    { id: 'm-pulse', icon: ICONS.pulse, label: 'Pulse', page: 'page-m-pulse', title: 'The Luxury Pulse' },
    { id: 'sep2', sep: true },
    { id: 'm-import', icon: ICONS.upload, label: 'Import CSV', page: 'page-m-import', title: 'Import CSV' },
    { id: 'm-team', icon: ICONS.users, label: 'Equipe', page: 'page-m-team', title: 'Gestion Equipe' },
];

function isBrunoLopes() {
    if (!currentUser) return false;
    const fn = (currentUser.first_name || '').trim().toLowerCase();
    const ln = (currentUser.last_name || '').trim().toLowerCase();
    return fn === 'bruno' && ln === 'lopes';
}

function getNavItems() {
    const base = (currentUser.role || '').toLowerCase() === 'manager' ? MANAGER_NAV : VENDEUR_NAV;
    if (!isBrunoLopes()) return base;
    return [...base, { id: 'sep-admin', sep: true }, { id: 'admin', icon: ICONS.admin, label: 'Admin', page: 'page-admin', title: 'Supprimer les donnees' }];
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    const c = $('toastContainer');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ===== LOADING =====
function showLoading(msg) {
    $('loadingMsg').textContent = msg || 'Chargement...';
    $('progressFill').style.width = '0%';
    $('loadingProgress').textContent = '';
    $('loading').classList.add('active');
}
function updateLoading(msg, current, total) {
    $('loadingMsg').textContent = msg;
    $('loadingProgress').textContent = total > 0 ? `${current}/${total}` : '';
    const pct = total > 0 ? (current / total * 100) : 0;
    $('progressFill').style.width = pct + '%';
}
function hideLoading() { $('loading').classList.remove('active'); }

// ===== AUTH =====
async function login(firstName, lastName, code) {
    // Find boutique by code
    const { data: boutiques, error: bErr } = await sb.from('boutiques').select('*').eq('code', code);
    if (bErr || !boutiques || boutiques.length === 0) throw new Error('Code boutique invalide');
    const boutique = boutiques[0];

    // Find seller in that boutique
    const { data: sellers, error: sErr } = await sb
        .from('sellers')
        .select('*')
        .ilike('first_name', firstName.trim())
        .ilike('last_name', lastName.trim())
        .eq('boutique_id', boutique.id);

    if (sErr || !sellers || sellers.length === 0) throw new Error('Utilisateur non trouve. Verifiez votre nom et le code boutique.');
    const seller = sellers[0];

    currentUser = { ...seller, boutique };
    localStorage.setItem('lvmh_session', JSON.stringify(currentUser));
    return currentUser;
}

function logout() {
    currentUser = null;
    DATA = [];
    RGPD_BAD = [];
    PRIVACY_SCORES = [];
    SENTIMENT_DATA = [];
    STATS = { clients: 0, tags: 0, ai: 0, rgpd: 0, nba: 0, privacyAvg: 0, atRisk: 0 };
    localStorage.removeItem('lvmh_session');
    $('loginPage').classList.remove('hidden');
    $('appShell').classList.add('hidden');
    $('mobileNav').classList.add('hidden');
    $('loginFirstName').value = '';
    $('loginLastName').value = '';
    $('loginCode').value = '';
}

function restoreSession() {
    try {
        const saved = localStorage.getItem('lvmh_session');
        if (saved) {
            currentUser = JSON.parse(saved);
            return true;
        }
    } catch (e) { localStorage.removeItem('lvmh_session'); }
    return false;
}

// ===== SIDEBAR & ROUTING =====
let currentPage = null;

function buildSidebar() {
    const nav = $('sidebarNav');
    const mobileNav = $('mobileNav');
    const items = getNavItems().filter(i => !i.sep); // Ignore separators for radio logic
    const totalItems = items.length;

    // Build sidebar HTML with Radio Glider structure
    let sidebarHTML = `<div class="radio-container" style="--total-radio: ${totalItems}">`;

    // 1. Inputs
    items.forEach((item, index) => {
        const checked = index === 0 ? 'checked' : ''; // Default first one checked, updated later
        sidebarHTML += `<input type="radio" name="nav" id="nav-${item.id}" value="${item.id}" ${checked}>`;
    });

    // 2. Glider container
    sidebarHTML += `
        <div class="glider-container">
            <div class="glider"></div>
        </div>
    `;

    // 3. Labels
    items.forEach(item => {
        sidebarHTML += `<label for="nav-${item.id}"><span class="nav-icon">${item.icon}</span>${item.label}</label>`;
    });

    sidebarHTML += `</div>`; // Close container

    // Mobile nav remains button-based for simplicity or we can adapt it later if requested
    let mobileHTML = '';
    items.forEach(item => {
        mobileHTML += `<button class="mobile-nav-item" data-nav-id="${item.id}"><span class="nav-icon">${item.icon}</span><span>${item.label}</span></button>`;
    });

    nav.innerHTML = sidebarHTML;
    mobileNav.innerHTML = mobileHTML;

    // Event listener for Radio Inputs
    const radios = nav.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            navigateTo(e.target.value);
        });
    });

    // Event delegation on mobile nav container
    mobileNav.onclick = function (e) {
        const item = e.target.closest('.mobile-nav-item');
        if (!item) return;
        navigateTo(item.dataset.navId);
    };

    // Update user info
    $('userNameDisplay').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    $('userRoleDisplay').textContent = currentUser.role;
    $('boutiqueNameDisplay').textContent = currentUser.boutique.name;

    // Sync current page if already set
    if (currentPage) {
        const activeRadio = nav.querySelector(`input[value="${currentPage}"]`);
        if (activeRadio) activeRadio.checked = true;
    }
}

function navigateTo(navId) {
    const items = getNavItems();
    const item = items.find(i => i.id === navId);

    if (!item || item.sep) return;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    // Show target page
    const page = $(item.page);
    if (page) {
        page.classList.remove('hidden');
    } else {
        showToast('Erreur: Page non trouvée', 'error');
        return;
    }

    // Update sidebar active state (Radio Sync)
    const sidebarNav = $('sidebarNav');
    const activeRadio = sidebarNav.querySelector(`input[value="${navId}"]`);
    if (activeRadio) activeRadio.checked = true;

    // Update mobile nav styling
    document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
    const activeMob = document.querySelector(`.mobile-nav-item[data-nav-id="${navId}"]`);
    if (activeMob) activeMob.classList.add('active');

    // Update page title (legacy element + new layout element)
    const legacyTitle = $('pageTitle');
    if (legacyTitle) legacyTitle.textContent = item.title;
    const newTitle = $('page-title');
    if (newTitle) newTitle.textContent = item.title;

    // Close mobile sidebar
    $('sidebar').classList.remove('open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('active');

    currentPage = navId;

    // Update new layout meta elements (no-op if elements don't exist yet)
    _updatePageMeta(navId);

    // Render page content
    try {
        renderPage(navId);
    } catch (err) {
        console.error('Error rendering page:', err);
        showToast('Erreur lors du rendu de la page', 'error');
    }
}

function renderPage(navId) {
    try {
        switch (navId) {
            case 'v-home':
                renderVendeurHome();
                break;
            case 'clients':
                renderClients();
                break;
            case 'nba':
                renderNBA();
                break;
            case 'products':
                renderProducts();
                break;
            case 'brief':
                renderBrief();
                break;
            case 'followup':
                renderFollowup();
                const houseSelect = $('followupHouse');
                if (houseSelect) houseSelect.onchange = () => renderFollowup();
                break;
            case 'm-dashboard':
                renderDashboard();
                break;
            case 'm-privacy':
                renderPrivacy();
                break;
            case 'm-sentiment':
                renderSentiment();
                break;
            case 'm-boutique':
                renderBoutique();
                break;
            case 'm-pulse':
                renderPulse();
                break;
            case 'm-import':
                setupCSVImport();
                break;
            case 'm-team':
                renderTeam();
                break;
            case 'v-coach':
            case 'm-coach':
                renderCoach();
                break;
            case 'admin':
                renderAdmin();
                break;
            default:
                console.warn('Unknown page:', navId);
        }
        console.log('Page rendered successfully:', navId);
    } catch (err) {
        console.error('Error in renderPage:', navId, err);
        throw err;
    }
}

// ===== DATA LOADING FROM SUPABASE =====
async function loadClientsFromDB() {
    showLoading('Chargement des donnees...');
    try {
        let query = sb.from('clients').select('*').eq('boutique_id', currentUser.boutique.id);

        // Vendeur only sees their own clients
        if ((currentUser.role || '').toLowerCase() === 'vendeur') {
            query = query.eq('seller_id', currentUser.id);
        }

        const { data: clients, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Transform DB rows to the format rendering functions expect
        DATA = (clients || []).map(c => {
            // Parse JSON fields if they are strings
            let tags = c.tags;
            if (typeof tags === 'string') {
                try { tags = JSON.parse(tags); } catch (e) { tags = []; }
            }
            if (!Array.isArray(tags)) tags = [];

            let nba = c.nba;
            if (typeof nba === 'string') {
                try { nba = JSON.parse(nba); } catch (e) { nba = []; }
            }
            if (!Array.isArray(nba)) nba = [];

            let sentiment = c.sentiment;
            if (typeof sentiment === 'string') {
                try { sentiment = JSON.parse(sentiment); } catch (e) { sentiment = {}; }
            }
            if (typeof sentiment !== 'object' || sentiment === null) sentiment = {};

            let sensitiveFound = c.sensitive_found;
            if (typeof sensitiveFound === 'string') {
                try { sensitiveFound = JSON.parse(sensitiveFound); } catch (e) { sensitiveFound = []; }
            }
            if (!Array.isArray(sensitiveFound)) sensitiveFound = [];

            return {
                id: c.external_id || c.id,
                date: c.date || '',
                lang: c.language || 'FR',
                ca: c.client_name || '',
                store: c.store || '',
                orig: c.original_text || '',
                clean: c.cleaned_text || '',
                tags: tags,
                nba: nba,
                sentiment: sentiment,
                sensitiveCount: c.sensitive_count || 0,
                sensitiveFound: sensitiveFound,
                rgpdMasked: c.rgpd_masked || 0,
                _dbId: c.id,
                _sellerId: c.seller_id,
            };
        });

        // Recompute stats from data
        recomputeStats();
        hideLoading();
    } catch (err) {
        hideLoading();
        console.error('Error loading clients:', err);
        showToast('Erreur chargement donnees: ' + err.message, 'error');
    }
}

function recomputeStats() {
    STATS = { clients: DATA.length, tags: 0, ai: DATA.length, rgpd: 0, nba: 0, privacyAvg: 0, atRisk: 0 };
    RGPD_BAD = [];
    SENTIMENT_DATA = [];

    DATA.forEach(row => {
        STATS.tags += (row.tags || []).length;
        STATS.rgpd += row.rgpdMasked || 0;
        STATS.nba += (row.nba || []).length;

        if (row.rgpdMasked > 0) {
            const masks = (row.clean || '').match(/\[[A-Z]+-MASQU[ÉE]+\]/gi) || [];
            masks.forEach(m => RGPD_BAD.push({ id: row.id, cat: m.replace(/[\[\]]/g, ''), w: 'Masque par IA' }));
        }

        const s = row.sentiment || {};
        if (s.level === 'negative') STATS.atRisk++;
        SENTIMENT_DATA.push({
            id: row.id,
            ca: row.ca,
            score: s.score || 50,
            level: s.level || 'neutral',
            posFound: s.posFound || [],
            negFound: s.negFound || [],
            excerpt: (row.clean || '').substring(0, 150),
        });
    });

    // Privacy scores per CA
    const caMap = {};
    DATA.forEach(row => {
        const ca = row.ca || 'Unknown';
        if (!caMap[ca]) caMap[ca] = { ca, total: 0, violations: 0, categories: {}, notes: [] };
        const entry = caMap[ca];
        entry.total++;
        if (row.sensitiveCount > 0) {
            entry.violations += row.sensitiveCount;
            const sensitiveFound = Array.isArray(row.sensitiveFound) ? row.sensitiveFound : [];
            sensitiveFound.forEach(sf => {
                if (sf && sf.cat) {
                    entry.categories[sf.cat] = (entry.categories[sf.cat] || 0) + 1;
                }
            });
            entry.notes.push(row.id);
        }
    });

    const COACHING_RULES = {
        orientation: 'Formation RGPD: donnees orientation sexuelle interdites',
        politics: 'Formation RGPD: opinions politiques non-collectables',
        religion: 'Formation RGPD: croyances religieuses a ne pas enregistrer',
        familyConflict: 'Sensibilisation: conflits familiaux = donnees ultra-sensibles',
        appearance: 'Rappel: jugements physiques = non conforme',
        finance: 'Formation: donnees financieres personnelles interdites',
        accessCodes: 'Alerte securite: ne jamais enregistrer de codes d\'acces',
    };

    PRIVACY_SCORES = Object.values(caMap).map(entry => {
        const score = Math.max(0, Math.round(100 - (entry.violations / (entry.total || 1)) * 50 - entry.violations * 5));
        const level = score < 60 ? 'critical' : score < 75 ? 'warning' : score < 90 ? 'good' : 'excellent';
        const coaching = [];
        Object.entries(COACHING_RULES).forEach(([cat, msg]) => { if (entry.categories[cat]) coaching.push(msg); });
        return { ...entry, score, level, coaching };
    }).sort((a, b) => a.score - b.score);

    STATS.privacyAvg = PRIVACY_SCORES.length > 0
        ? Math.round(PRIVACY_SCORES.reduce((s, p) => s + p.score, 0) / PRIVACY_SCORES.length)
        : 0;
}

// ===== POPULATE STATE FROM PIPELINE RESULT =====
function populateStateFromPipeline(result) {
    const newData = result.data || [];

    // Deduplicate: only add items that are not already in DATA
    const uniqueNewData = newData.filter(newItem => !DATA.some(existing => existing.id === newItem.id));

    DATA = [...uniqueNewData, ...DATA]; // Prepend new unique data

    // Re-derive stats, RGPD, sentiment, privacy from full DATA
    recomputeStats();

    // Refresh active views that depend on DATA
    if (currentPage === 'clients') {
        if (typeof renderClients === 'function') renderClients();
    }
    if (currentPage === 'v-home') {
        if (typeof renderVendeurHome === 'function') renderVendeurHome();
    }
}

// ===== WEB SPEECH API =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;
let finalTranscript = '';
let speechTimeout = null;

function initSpeechRecognition() {
    if (!SpeechRecognition) {
        // No support — the fallback textarea is always visible anyway
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        // Clear no-result timeout
        if (speechTimeout) { clearTimeout(speechTimeout); speechTimeout = null; }

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interim += transcript;
            }
        }
        const area = $('transcriptArea');
        if (area) {
            area.value = finalTranscript + interim;
            $('submitVocal').disabled = !(finalTranscript.trim().length > 0 || area.value.trim().length > 0);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        const status = $('micStatus');
        if (!status) return;

        if (event.error === 'not-allowed') {
            status.textContent = 'Micro refuse. Autorisez dans les parametres du navigateur.';
            showToast('Acces au micro refuse', 'error');
        } else if (event.error === 'no-speech') {
            status.textContent = 'Aucune parole detectee. Reessayez.';
        } else {
            status.textContent = 'Erreur: ' + event.error;
        }
        stopRecording();
    };

    recognition.onend = () => {
        if (isRecording) {
            // Restart automatically unless explicitly stopped
            try { recognition.start(); } catch (e) { stopRecording(); }
        }
    };
}

async function startRecording() {
    if (!recognition) {
        showToast('Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Edge.', 'error');
        return;
    }

    // Check microphone permission first
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop()); // Release immediately
    } catch (e) {
        showToast('Impossible d\'acceder au microphone. Autorisez l\'acces dans les parametres.', 'error');
        const status = $('micStatus');
        if (status) status.textContent = 'Micro non autorise';
        return;
    }

    const area = $('transcriptArea');
    finalTranscript = area ? (area.value || '') : '';
    isRecording = true;

    const btn = $('micBtn');
    const status = $('micStatus');
    if (btn) btn.classList.add('recording');
    if (status) { status.textContent = 'Ecoute en cours...'; status.classList.add('active'); }

    try {
        recognition.start();
    } catch (e) {
        // Already started
    }

    // Timeout: if no result after 5s, show message
    speechTimeout = setTimeout(() => {
        if (isRecording) {
            const s = $('micStatus');
            if (s && s.textContent === 'Ecoute en cours...') {
                s.textContent = 'Parlez plus fort ou rapprochez-vous du micro...';
            }
        }
    }, 5000);
}

function stopRecording() {
    isRecording = false;
    if (speechTimeout) { clearTimeout(speechTimeout); speechTimeout = null; }

    const btn = $('micBtn');
    const status = $('micStatus');
    if (btn) btn.classList.remove('recording');
    if (status) { status.textContent = 'Enregistrement termine'; status.classList.remove('active'); }

    if (recognition) {
        try { recognition.stop(); } catch (e) { }
    }

    const area = $('transcriptArea');
    if (area) $('submitVocal').disabled = !(area.value.trim().length > 0);
}

// ===== VOCAL SUBMIT =====
async function submitVocalTranscript() {
    const area = $('transcriptArea');
    const text = area ? area.value.trim() : '';
    if (!text) return;

    stopRecording();

    const clientName = ($('clientNameInput') || {}).value || '';
    const ca = clientName.trim() || `${currentUser.first_name} ${currentUser.last_name}`;

    showLoading('Analyse de la transcription...');

    try {
        const resp = await fetch(API_BASE + '/api/process-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                ca,
                seller_id: currentUser.id,
                boutique_id: currentUser.boutique.id,
                client_name: clientName.trim()
            })
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Erreur serveur ' + resp.status }));
            throw new Error(err.error || 'Erreur serveur');
        }

        const result = await resp.json();
        populateStateFromPipeline(result);

        hideLoading();
        showToast('Client analyse et sauvegarde !', 'success');

        // Clear inputs
        if (area) area.value = '';
        if ($('clientNameInput')) $('clientNameInput').value = '';
        $('submitVocal').disabled = true;
        finalTranscript = '';

        // Refresh vendeur home
        if (currentPage === 'v-home') renderVendeurHome();

    } catch (err) {
        hideLoading();
        showToast('Erreur: ' + err.message, 'error');
        console.error(err);
    }
}

// ===== CSV IMPORT (Manager) =====
function setupCSVImport() {
    const uploadArea = $('csvUploadArea');
    const fileInput = $('csvFileInput');
    const selectBtn = $('csvSelectBtn');

    if (!uploadArea || !fileInput || !selectBtn) return;

    selectBtn.onclick = (e) => { e.stopPropagation(); fileInput.click(); };
    uploadArea.onclick = (e) => { if (e.target.id !== 'csvSelectBtn') fileInput.click(); };

    uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); };
    uploadArea.ondragleave = () => uploadArea.classList.remove('dragover');
    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) processCSVImport(file);
    };

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) processCSVImport(file);
    };
}

async function processCSVImport(file) {
    if (!currentUser) {
        showToast('Vous devez être connecté pour importer un CSV.', 'error');
        return;
    }

    showLoading('Import en cours...');
    updateLoading('Envoi et traitement (nettoyage IA, tags, NBA, privacy, sentiment)...', 0, 1);

    try {
        const formData = new FormData();
        formData.append('file', file);
        if (currentUser.id) formData.append('seller_id', String(currentUser.id));
        if (currentUser.boutique && currentUser.boutique.id) formData.append('boutique_id', String(currentUser.boutique.id));

        const url = (API_BASE || '') + '/api/process';
        const resp = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const result = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            const msg = result.error || result.message || 'Erreur serveur ' + resp.status;
            throw new Error(msg);
        }

        if (!result.data || !Array.isArray(result.data)) {
            throw new Error('Réponse serveur invalide (données manquantes).');
        }

        populateStateFromPipeline(result);

        hideLoading();
        showToast(`Import réussi : ${result.data.length} client(s) traité(s)`, 'success');

        const resultDiv = $('importResult');
        const summary = $('importSummary');
        if (resultDiv && summary) {
            resultDiv.classList.remove('hidden');
            const stats = result.stats || {};
            summary.innerHTML = `
                <div class="stats-row" style="grid-template-columns:repeat(4,1fr)">
                    <div class="stat-card"><div><div class="stat-value">${stats.clients ?? result.data.length}</div><div class="stat-label">Clients</div></div></div>
                    <div class="stat-card accent"><div><div class="stat-value">${stats.tags ?? 0}</div><div class="stat-label">Tags</div></div></div>
                    <div class="stat-card green"><div><div class="stat-value">${stats.nba ?? 0}</div><div class="stat-label">Actions NBA</div></div></div>
                    <div class="stat-card red"><div><div class="stat-value">${stats.rgpd ?? 0}</div><div class="stat-label">RGPD masques</div></div></div>
                </div>
            `;
        }
    } catch (err) {
        hideLoading();
        const msg = err.message || 'Erreur inconnue';
        showToast('Erreur import : ' + msg, 'error');
        console.error('CSV import error:', err);
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
            showToast('Vérifiez que le serveur backend (port 5001) est démarré.', 'error');
        }
    }
}

// ===== TEAM MANAGEMENT =====
async function renderTeam() {
    const list = $('teamList');
    if (!list) return;

    const { data: sellers, error } = await sb
        .from('sellers')
        .select('*')
        .eq('boutique_id', currentUser.boutique.id)
        .order('role', { ascending: true })
        .order('last_name', { ascending: true });

    if (error) { showToast('Erreur chargement equipe', 'error'); return; }

    list.innerHTML = (sellers || []).map(s => {
        const initials = (s.first_name[0] + s.last_name[0]).toUpperCase();
        return `<div class="team-card">
            <div class="team-avatar">${initials}</div>
            <div class="team-info"><div class="team-name">${s.first_name} ${s.last_name}</div><div class="team-role">${s.role}</div></div>
        </div>`;
    }).join('');

    // Add seller form
    const form = $('addSellerForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const first = $('newSellerFirst').value.trim();
            const last = $('newSellerLast').value.trim();
            const role = $('newSellerRole').value;
            if (!first || !last) return;

            const { error } = await sb.from('sellers').insert({
                first_name: first,
                last_name: last,
                role: role,
                boutique_id: currentUser.boutique.id
            });

            if (error) {
                showToast('Erreur ajout vendeur: ' + error.message, 'error');
            } else {
                showToast(`${first} ${last} ajoute(e) avec succes`, 'success');
                $('newSellerFirst').value = '';
                $('newSellerLast').value = '';
                renderTeam();
            }
        };
    }
}

// ===== ADMIN (Bruno Lopes - suppression donnees) =====
let adminCodeUnlocked = '';

function renderAdmin() {
    const codeSection = $('adminCodeSection');
    const actionsSection = $('adminActionsSection');
    const codeInput = $('adminCodeInput');
    const codeBtn = $('adminCodeBtn');
    const codeError = $('adminCodeError');
    const resultDiv = $('adminResult');

    if (!codeSection || !actionsSection) return;

    // Reset state when entering the page (code en session, toujours trimé)
    adminCodeUnlocked = (sessionStorage.getItem('lvmh_admin_code') || '').trim();
    if (adminCodeUnlocked) {
        codeSection.classList.add('hidden');
        actionsSection.classList.remove('hidden');
    } else {
        codeSection.classList.remove('hidden');
        actionsSection.classList.add('hidden');
    }
    if (codeInput) codeInput.value = '';
    if (codeError) { codeError.classList.add('hidden'); codeError.textContent = ''; }
    if (resultDiv) { resultDiv.classList.add('hidden'); resultDiv.textContent = ''; }

    if (codeBtn) {
        codeBtn.onclick = () => {
            const code = (codeInput && codeInput.value) ? codeInput.value.trim() : '';
            if (!code) {
                if (codeError) { codeError.textContent = 'Entrez le code admin.'; codeError.classList.remove('hidden'); }
                return;
            }
            adminCodeUnlocked = code;
            sessionStorage.setItem('lvmh_admin_code', code);
            codeSection.classList.add('hidden');
            actionsSection.classList.remove('hidden');
            if (codeError) codeError.classList.add('hidden');
        };
    }

    const clearClientsBtn = $('adminClearClients');
    const clearAllBtn = $('adminClearAll');
    function showResult(msg, isError) {
        if (!resultDiv) return;
        resultDiv.textContent = msg;
        resultDiv.className = 'admin-result ' + (isError ? 'error' : 'success');
        resultDiv.classList.remove('hidden');
    }
    async function doClear(endpoint, body = {}) {
        const key = (adminCodeUnlocked || '').trim();
        if (!key) { showResult('Code admin requis.', true); return; }
        showResult('Suppression en cours...', false);
        try {
            const resp = await fetch(API_BASE + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
                body: JSON.stringify({ admin_key: key, ...body })
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && data.success) {
                showResult(data.message || (data.deleted ? JSON.stringify(data.deleted) : 'OK'), false);
                if (typeof loadClientsFromDB === 'function') loadClientsFromDB();
            } else {
                showResult(data.error || 'Erreur ' + resp.status, true);
                if (resp.status === 403) sessionStorage.removeItem('lvmh_admin_code');
            }
        } catch (e) {
            showResult('Erreur reseau: ' + e.message, true);
        }
    }
    if (clearClientsBtn) clearClientsBtn.onclick = () => { if (confirm('Vider toute la table clients ? Action irreversible.')) doClear('/api/admin/clear-clients'); };
    if (clearAllBtn) clearAllBtn.onclick = () => { if (confirm('Vider clients ET vendeurs ? Action irreversible.')) doClear('/api/admin/clear-all', { sellers: true }); };
}

// ===== VENDEUR HOME =====
function renderVendeurHome() {
    // Quick stats
    $('vStatClients').textContent = DATA.length;
    $('vStatTags').textContent = DATA.reduce((s, r) => s + (r.tags || []).length, 0);
    if (DATA.length > 0) {
        const last = DATA[0];
        $('vStatLast').textContent = last.date || 'Aujourd\'hui';
    } else {
        $('vStatLast').textContent = '--';
    }

    // Recent clients (last 5)
    const recent = $('vRecentClients');
    if (!recent) return;

    const last5 = DATA.slice(0, 5);
    if (last5.length === 0) {
        recent.innerHTML = '<p style="color:#999;font-size:.82rem">Aucun client pour le moment. Utilisez le micro ci-dessus pour commencer.</p>';
        return;
    }

    recent.innerHTML = last5.map(c => `
        <div class="recent-card">
            <div class="recent-card-name">${c.ca || c.id}</div>
            <div class="recent-card-date">${c.date}</div>
            <div class="recent-card-tags">${(c.tags || []).slice(0, 4).map(t => `<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
        </div>
    `).join('');
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
    const toggle = $('menuToggle');
    const sidebar = $('sidebar');

    // Create overlay
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    toggle.onclick = () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    };

    overlay.onclick = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    };
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    initSpeechRecognition();
    setupMobileMenu();

    // Wire rail icon clicks (new layout — no-op if elements don't exist yet)
    document.querySelectorAll('.rail-icon[data-page]').forEach(icon => {
        icon.addEventListener('click', () => showPage(icon.dataset.page));
    });

    // ── Sidebar toggle (expand / collapse) ──
    const sidebarToggle = $('sidebarToggle');
    const sidebarEl = $('sidebar');
    if (sidebarToggle && sidebarEl) {
        // Restore state from localStorage (default: expanded)
        const savedState = localStorage.getItem('lvmh_sidebar_collapsed');
        if (savedState === 'true') {
            sidebarEl.classList.add('collapsed');
        }
        sidebarToggle.addEventListener('click', () => {
            sidebarEl.classList.toggle('collapsed');
            localStorage.setItem('lvmh_sidebar_collapsed', sidebarEl.classList.contains('collapsed'));
        });
    }

    // Check for existing session
    if (restoreSession()) {
        await startApp();
    } else {
        $('loginPage').classList.remove('hidden');
    }

    // Login form
    $('loginForm').onsubmit = async (e) => {
        e.preventDefault();
        const firstName = $('loginFirstName').value.trim();
        const lastName = $('loginLastName').value.trim();
        const code = $('loginCode').value.trim();
        const errDiv = $('loginError');

        if (!firstName || !lastName || !code) {
            errDiv.textContent = 'Veuillez remplir tous les champs.';
            errDiv.classList.remove('hidden');
            return;
        }

        errDiv.classList.add('hidden');
        $('loginBtn').disabled = true;
        $('loginBtn').textContent = 'Connexion...';

        try {
            await login(firstName, lastName, code);
            await startApp();
        } catch (err) {
            errDiv.textContent = err.message;
            errDiv.classList.remove('hidden');
        } finally {
            $('loginBtn').disabled = false;
            $('loginBtn').textContent = 'Se connecter';
        }
    };

    // Logout
    $('logoutBtn').onclick = logout;

    // Vendeur vocal controls
    const micBtn = $('micBtn');
    if (micBtn) {
        micBtn.onclick = () => {
            if (isRecording) stopRecording();
            else startRecording();
        };
    }

    const transcriptArea = $('transcriptArea');
    if (transcriptArea) {
        transcriptArea.oninput = () => {
            $('submitVocal').disabled = !(transcriptArea.value.trim().length > 0);
        };
    }

    const submitBtn = $('submitVocal');
    if (submitBtn) {
        submitBtn.onclick = submitVocalTranscript;
    }

    // Mobile Sidebar
    const menuToggle = $('menuToggle');
    const sidebar = $('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.onclick = () => {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        };

        overlay.onclick = () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        };
    }
});

async function startApp() {
    $('loginPage').classList.add('hidden');
    $('appShell').classList.remove('hidden');
    $('mobileNav').classList.remove('hidden');

    buildSidebar();

    // Expose currentUser as window.CURRENT_USER for PAGE_CONFIG role checks
    window.CURRENT_USER = currentUser;

    // ── Populate sidebar user info ──
    const railUserName = document.getElementById('rail-user-name');
    const railUserRole = document.getElementById('rail-user-role');
    const railAvatar = $('rail-user-avatar');
    if (railUserName && currentUser) {
        railUserName.textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    }
    if (railUserRole && currentUser) {
        railUserRole.textContent = currentUser.role || 'Vendeur';
    }
    if (railAvatar && currentUser) {
        railAvatar.textContent = ((currentUser.first_name || '')[0] + (currentUser.last_name || '')[0]).toUpperCase();
    }

    // Load data from Supabase
    await loadClientsFromDB();

    // Expose DATA globally for PAGE_CONFIG badge
    window.DATA = DATA;

    // Navigate to first page
    const firstNav = (currentUser.role || '').toLowerCase() === 'manager' ? 'm-dashboard' : 'v-home';
    navigateTo(firstNav);

    // Apply role visibility for new layout elements (rail icons etc.)
    applyRoleVisibility();
}

// ═══════════════════════════════════════════════
// NEW LAYOUT — PAGE_CONFIG + showPage() system
// Rail icons, top nav tabs, page header badge
// All DOM manipulations are null-guarded:
// elements from the new layout may not exist yet.
// ═══════════════════════════════════════════════

// Maps PAGE_CONFIG logical IDs → existing nav IDs and HTML page IDs
const PAGE_CONFIG = {
    accueil: {
        _navId: 'v-home',
        title: 'Dictée vocale',
        badge: 'Nouveau client',
        navItems: [],
        headerActions: `<button class="btn btn-primary" onclick="startRecording()">+ Démarrer dictée</button>`,
        roles: ['vendeur', 'manager', 'admin']
    },
    clients: {
        _navId: 'clients',
        title: 'Mes clients',
        badge: '',
        navItems: ['Tous', 'Nouveaux', 'Prioritaires', 'À relancer'],
        headerActions: `
            <button class="btn" id="btn-filtres-clients" onclick="openClientFilters(this)">Filtres</button>
            <button class="btn" onclick="navigateTo('m-import')">Import CSV</button>
            <button class="btn btn-primary" onclick="navigateTo('v-home')">+ Nouvelle note</button>
        `,
        roles: ['vendeur', 'manager', 'admin']
    },
    nba: {
        _navId: 'nba',
        title: 'Next Best Actions',
        badge: '',
        navItems: ['Toutes', 'Conversion', 'Engagement', 'Nurture'],
        headerActions: `<button class="btn">Exporter</button>`,
        roles: ['vendeur', 'manager', 'admin']
    },
    produits: {
        _navId: 'products',
        title: 'Produits',
        badge: 'Louis Vuitton',
        navItems: ['Tous', 'Maroquinerie', 'Prêt-à-porter', 'Accessoires'],
        headerActions: ``,
        roles: ['vendeur', 'manager', 'admin']
    },
    followup: {
        _navId: 'followup',
        title: 'Follow-up IA',
        badge: 'Smart',
        navItems: [],
        headerActions: ``,
        roles: ['vendeur', 'manager', 'admin']
    },
    brief: {
        _navId: 'brief',
        title: 'Client Brief',
        badge: 'Auto-généré',
        navItems: [],
        headerActions: ``,
        roles: ['vendeur', 'manager', 'admin']
    },
    dashboard: {
        _navId: 'm-dashboard',
        title: 'Dashboard',
        badge: 'Manager',
        navItems: ['Vue globale', 'Performance', 'Équipe'],
        headerActions: `<button class="btn">Exporter</button>`,
        roles: ['manager', 'admin']
    },
    privacy: {
        _navId: 'm-privacy',
        title: 'Privacy Score',
        badge: 'RGPD',
        navItems: ['Par vendeur', 'Violations', 'Historique'],
        headerActions: ``,
        roles: ['manager', 'admin']
    },
    coach: {
        _navId: 'v-coach',  // navigateTo handles both v-coach and m-coach
        title: 'Coach RGPD',
        badge: 'Formation',
        navItems: [],
        headerActions: ``,
        roles: ['vendeur', 'manager', 'admin']
    },
    sentiment: {
        _navId: 'm-sentiment',
        title: 'Analyse Sentiment',
        badge: 'IA',
        navItems: ['Global', 'Par vendeur', 'Timeline'],
        headerActions: ``,
        roles: ['manager', 'admin']
    },
    equipe: {
        _navId: 'm-team',
        title: 'Équipe',
        badge: '',
        navItems: [],
        headerActions: ``,
        roles: ['manager', 'admin']
    },
    pulse: {
        _navId: 'm-pulse',
        title: 'Luxury Pulse',
        badge: 'ROI',
        navItems: ['Signaux', 'ROI', 'Tendances'],
        headerActions: `<button class="btn">Exporter rapport</button>`,
        roles: ['manager', 'admin']
    },
    boutique: {
        _navId: 'm-boutique',
        title: 'Dashboard Boutique',
        badge: 'Manager',
        navItems: ['KPIs', 'Stock', 'Performance'],
        headerActions: `<button class="btn">Rapport</button>`,
        roles: ['manager', 'admin']
    },
    import: {
        _navId: 'm-import',
        title: 'Import CSV',
        badge: '',
        navItems: [],
        headerActions: ``,
        roles: ['manager', 'admin']
    },
    admin: {
        _navId: 'admin',
        title: 'Administration',
        badge: 'Admin uniquement',
        navItems: [],
        headerActions: ``,
        roles: ['admin']
    }
};

// Aliases: old navIds or alternate names → PAGE_CONFIG keys
const PAGE_ALIASES = {
    'v-home': 'accueil',
    'home': 'accueil',
    'products': 'produits',
    'm-dashboard': 'dashboard',
    'cockpit': 'dashboard',
    'm-privacy': 'privacy',
    'v-coach': 'coach',
    'm-coach': 'coach',
    'm-sentiment': 'sentiment',
    'm-team': 'equipe',
    'm-pulse': 'pulse',
    'm-boutique': 'boutique',
    'm-import': 'import',
};

// Public entry point — accepts both PAGE_CONFIG keys and legacy nav IDs
function showPage(pageId) {
    const key = PAGE_ALIASES[pageId] || pageId;
    const config = PAGE_CONFIG[key];

    if (config) {
        // Role check
        const role = (currentUser && currentUser.role) ? currentUser.role.toLowerCase() : 'vendeur';
        const allowed = config.roles;
        if (!allowed.includes(role) && role !== 'admin') {
            console.warn('showPage: accès refusé à', key, 'pour le rôle', role);
            return;
        }
        navigateTo(config._navId);
    } else {
        // Fallback: treat as a direct navId
        navigateTo(pageId);
    }
}

// Called by navigateTo() — updates new layout elements if they exist
function _updatePageMeta(navId) {
    // Find PAGE_CONFIG entry for this navId
    const configKey = PAGE_ALIASES[navId] || Object.keys(PAGE_CONFIG).find(k => PAGE_CONFIG[k]._navId === navId);
    const config = configKey ? PAGE_CONFIG[configKey] : null;
    if (!config) return;

    // Badge
    const badgeEl = $('page-badge');
    if (badgeEl) {
        let badge = config.badge || '';
        if (configKey === 'clients') {
            const count = (window.DATA || DATA || []).length;
            const role = (currentUser && currentUser.role) || 'vendeur';
            badge = `${count} client${count > 1 ? 's' : ''} · ${role}`;
        }
        badgeEl.textContent = badge;
        badgeEl.style.display = badge ? 'inline-flex' : 'none';
    }

    // Header actions
    const actionsEl = $('page-header-actions');
    if (actionsEl) actionsEl.innerHTML = config.headerActions || '';

    // Top nav tabs
    renderTopNav(navId, config.navItems);

    // Rail icon active state
    document.querySelectorAll('.rail-icon').forEach(icon => {
        icon.classList.toggle('active', icon.dataset.page === configKey || icon.dataset.page === navId);
    });
}

function renderTopNav(navId, navItems) {
    const nav = $('top-nav');
    if (!nav) return;

    if (!navItems || navItems.length === 0) {
        nav.style.display = 'none';
        return;
    }

    nav.style.display = 'flex';
    nav.innerHTML = navItems.map((item, i) =>
        `<div class="nav-item${i === 0 ? ' active' : ''}" onclick="switchNavTab(this,'${navId}','${item}')">${item}</div>`
    ).join('') + '<div class="nav-right" id="nav-right-slot"></div>';
}

function switchNavTab(el, navId, tab) {
    document.querySelectorAll('#top-nav .nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    onNavTab(navId, tab);
}

function onNavTab(navId, tab) {
    if (navId === 'clients') {
        const data = window.DATA || DATA || [];
        let filtered = data;
        if (tab === 'Nouveaux') {
            filtered = data.filter(c => {
                const days = Math.floor((Date.now() - new Date(c.date || Date.now())) / 86400000);
                return days <= 3;
            });
        } else if (tab === 'Prioritaires') {
            filtered = data.filter(c => (c.sentiment && c.sentiment.score != null ? c.sentiment.score : 50) < 50);
        } else if (tab === 'À relancer') {
            filtered = data.filter(c => {
                const days = Math.floor((Date.now() - new Date(c.date || Date.now())) / 86400000);
                return days > 14;
            });
        }
        if (typeof renderClients === 'function') renderClients(filtered);
    }
}

// ===== FILTRES CLIENTS =====
function openClientFilters(btn) {
    // Toggle : fermer si déjà ouvert
    const existing = document.getElementById('client-filter-panel');
    if (existing) { existing.remove(); btn.classList.remove('active'); return; }
    btn.classList.add('active');

    const cats = [
        { key: '', label: 'Tous' },
        { key: 'profil', label: 'Profil' },
        { key: 'interet', label: 'Intérêt' },
        { key: 'voyage', label: 'Voyage' },
        { key: 'contexte', label: 'Contexte' },
        { key: 'service', label: 'Service' },
        { key: 'marque', label: 'Marque' },
        { key: 'crm', label: 'CRM' },
    ];

    const stores = [...new Set((DATA || []).map(c => c.store).filter(Boolean))];

    const panel = document.createElement('div');
    panel.id = 'client-filter-panel';
    panel.className = 'filter-panel';
    panel.innerHTML = `
        <div class="filter-panel-title">Filtrer les clients</div>
        <div class="filter-panel-label">Catégorie de tag</div>
        <div class="filter-panel-cats">
            ${cats.map(c => `<button class="filter-cat-btn${!c.key ? ' active' : ''}" data-cat="${c.key}" onclick="applyClientCategoryFilter('${c.key}',this)">${c.label}</button>`).join('')}
        </div>
        <div class="filter-panel-row">
            <div style="flex:1">
                <div class="filter-panel-label">Sentiment</div>
                <select id="filter-sentiment" onchange="applyClientAdvancedFilter()" class="filter-select">
                    <option value="">Tous</option>
                    <option value="positive">Positif</option>
                    <option value="neutral">Neutre</option>
                    <option value="negative">Négatif</option>
                </select>
            </div>
            ${stores.length ? `<div style="flex:1">
                <div class="filter-panel-label">Boutique</div>
                <select id="filter-store" onchange="applyClientAdvancedFilter()" class="filter-select">
                    <option value="">Toutes</option>
                    ${stores.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>` : ''}
        </div>
        <button class="filter-reset-btn" onclick="resetClientFilters()">Réinitialiser</button>
    `;

    const rect = btn.getBoundingClientRect();
    panel.style.cssText = `position:fixed;top:${rect.bottom + 8}px;right:20px;z-index:500`;
    document.body.appendChild(panel);

    setTimeout(() => {
        document.addEventListener('click', function handler(e) {
            if (!panel.contains(e.target) && e.target !== btn) {
                panel.remove();
                btn.classList.remove('active');
                document.removeEventListener('click', handler);
            }
        });
    }, 50);
}

function applyClientCategoryFilter(cat, btn) {
    document.querySelectorAll('.filter-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyClientAdvancedFilter();
}

function applyClientAdvancedFilter() {
    const cat = (document.querySelector('.filter-cat-btn.active') || {}).dataset?.cat || '';
    const sentiment = (document.getElementById('filter-sentiment') || {}).value || '';
    const store = (document.getElementById('filter-store') || {}).value || '';

    let filtered = DATA || [];
    if (cat) filtered = filtered.filter(c => c.tags && c.tags.some(t => t.c === cat));
    if (sentiment) filtered = filtered.filter(c => c.sentiment && c.sentiment.level === sentiment);
    if (store) filtered = filtered.filter(c => c.store === store);

    if (typeof renderClients === 'function') renderClients(filtered);
}

function resetClientFilters() {
    document.querySelectorAll('.filter-cat-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    const s = document.getElementById('filter-sentiment'); if (s) s.value = '';
    const st = document.getElementById('filter-store'); if (st) st.value = '';
    if (typeof renderClients === 'function') renderClients(DATA);
}

function applyRoleVisibility() {
    const role = (currentUser && currentUser.role) ? currentUser.role.toLowerCase() : 'vendeur';
    const isManager = role === 'manager' || role === 'admin';

    document.querySelectorAll('.manager-only').forEach(el => {
        if (!isManager) {
            el.style.display = 'none';
        } else {
            // Section labels are block, rail icons are flex
            el.style.display = el.classList.contains('rail-section-label') ? 'block' : 'flex';
        }
    });

    // Update rail avatar if it exists
    const av = $('rail-user-avatar');
    if (av && currentUser) {
        const name = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
        av.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    }
}
