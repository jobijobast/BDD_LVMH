/**
 * LVMH Voice-to-Tag — App Controller
 * Router, Auth, Supabase client, Speech Recognition, State management
 */

// ===== CONFIG =====
const SUPABASE_URL = 'https://vgkklymckkwrcpjrnzhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna2tseW1ja2t3cmNwanJuemhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDY2ODMsImV4cCI6MjA4NjM4MjY4M30.xSXtpyfaPSVkqVFDN8lDV-rzgQVgOWbVgdi5GfXmPkI';
const API_BASE = '';  // Same origin (Flask serves everything)

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

// ===== NAV DEFINITIONS =====
const VENDEUR_NAV = [
    { id: 'v-home', icon: '🎤', label: 'Accueil', page: 'page-v-home', title: 'Accueil' },
    { id: 'clients', icon: '👤', label: 'Mes Clients', page: 'page-clients', title: 'Mes Clients' },
    { id: 'nba', icon: '🎯', label: 'NBA', page: 'page-nba', title: 'Next Best Action' },
    { id: 'products', icon: '🛍', label: 'Produits', page: 'page-products', title: 'Product Matcher' },
    { id: 'followup', icon: '✉️', label: 'Follow-up', page: 'page-followup', title: 'Follow-up' },
];

const MANAGER_NAV = [
    { id: 'm-dashboard', icon: '📊', label: 'Dashboard', page: 'page-m-dashboard', title: 'Dashboard' },
    { id: 'clients', icon: '👥', label: 'Tous les Clients', page: 'page-clients', title: 'Tous les Clients' },
    { id: 'nba', icon: '🎯', label: 'NBA', page: 'page-nba', title: 'Next Best Action' },
    { id: 'products', icon: '🛍', label: 'Produits', page: 'page-products', title: 'Product Matcher' },
    { id: 'followup', icon: '✉️', label: 'Follow-up', page: 'page-followup', title: 'Follow-up' },
    { id: 'sep1', sep: true },
    { id: 'm-privacy', icon: '🛡', label: 'Privacy', page: 'page-m-privacy', title: 'Privacy Score' },
    { id: 'm-crossbrand', icon: '🏛', label: 'Cross-Brand', page: 'page-m-crossbrand', title: 'Cross-Brand Intelligence' },
    { id: 'm-sentiment', icon: '💬', label: 'Sentiment', page: 'page-m-sentiment', title: 'Sentiment & Retention' },
    { id: 'm-boutique', icon: '🏪', label: 'Boutique', page: 'page-m-boutique', title: 'Dashboard Boutique' },
    { id: 'm-pulse', icon: '📈', label: 'Pulse', page: 'page-m-pulse', title: 'The Luxury Pulse' },
    { id: 'sep2', sep: true },
    { id: 'm-import', icon: '📁', label: 'Import CSV', page: 'page-m-import', title: 'Import CSV' },
    { id: 'm-team', icon: '👥', label: 'Equipe', page: 'page-m-team', title: 'Gestion Equipe' },
];

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
    } catch(e) { localStorage.removeItem('lvmh_session'); }
    return false;
}

// ===== SIDEBAR & ROUTING =====
let currentPage = null;

function buildSidebar() {
    const nav = $('sidebarNav');
    const mobileNav = $('mobileNav');
    const isManager = (currentUser.role || '').toLowerCase() === 'manager';
    const items = isManager ? MANAGER_NAV : VENDEUR_NAV;

    // Build sidebar HTML in one go (avoids innerHTML += which destroys event handlers)
    let sidebarHTML = '';
    let mobileHTML = '';
    items.forEach(item => {
        if (item.sep) {
            sidebarHTML += '<div class="sidebar-nav-sep"></div>';
            return;
        }
        sidebarHTML += `<div class="sidebar-nav-item" data-nav-id="${item.id}" data-page="${item.page}" data-title="${item.title}"><span class="nav-icon">${item.icon}</span><span>${item.label}</span></div>`;
        mobileHTML += `<button class="mobile-nav-item" data-nav-id="${item.id}"><span class="nav-icon">${item.icon}</span><span>${item.label}</span></button>`;
    });
    nav.innerHTML = sidebarHTML;
    mobileNav.innerHTML = mobileHTML;

    // Event delegation on sidebar nav container - ONE listener handles ALL items
    nav.onclick = function(e) {
        const item = e.target.closest('.sidebar-nav-item');
        if (!item) return;
        navigateTo(item.dataset.navId);
    };

    // Event delegation on mobile nav container - ONE listener handles ALL items
    mobileNav.onclick = function(e) {
        const item = e.target.closest('.mobile-nav-item');
        if (!item) return;
        navigateTo(item.dataset.navId);
    };

    // Update user info
    $('userNameDisplay').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    $('userRoleDisplay').textContent = currentUser.role;
    $('boutiqueNameDisplay').textContent = currentUser.boutique.name;
}

function navigateTo(navId) {
    const items = (currentUser.role || '').toLowerCase() === 'manager' ? MANAGER_NAV : VENDEUR_NAV;
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

    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.querySelector(`.sidebar-nav-item[data-nav-id="${navId}"]`);
    if (activeEl) activeEl.classList.add('active');
    const activeMob = document.querySelector(`.mobile-nav-item[data-nav-id="${navId}"]`);
    if (activeMob) activeMob.classList.add('active');

    // Update page title
    $('pageTitle').textContent = item.title;

    // Close mobile sidebar
    $('sidebar').classList.remove('open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('active');

    currentPage = navId;

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
        switch(navId) {
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
            case 'followup':
                renderFollowup();
                const houseSelect = $('followupHouse');
                const channelSelect = $('followupChannel');
                if (houseSelect) houseSelect.onchange = () => renderFollowup();
                if (channelSelect) channelSelect.onchange = () => renderFollowup();
                break;
            case 'm-dashboard': 
                renderDashboard(); 
                break;
            case 'm-privacy': 
                renderPrivacy(); 
                break;
            case 'm-crossbrand': 
                renderCrossBrand(); 
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
        DATA = (clients || []).map(c => ({
            id: c.external_id || c.id,
            date: c.date || '',
            lang: c.language || 'FR',
            ca: c.client_name || '',
            store: c.store || '',
            orig: c.original_text || '',
            clean: c.cleaned_text || '',
            tags: Array.isArray(c.tags) ? c.tags : [],
            nba: Array.isArray(c.nba) ? c.nba : [],
            sentiment: c.sentiment || {},
            sensitiveCount: c.sensitive_count || 0,
            sensitiveFound: Array.isArray(c.sensitive_found) ? c.sensitive_found : [],
            rgpdMasked: c.rgpd_masked || 0,
            _dbId: c.id,
            _sellerId: c.seller_id,
        }));

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
    DATA = [...newData, ...DATA]; // Prepend new data

    // Re-derive stats, RGPD, sentiment, privacy from full DATA
    recomputeStats();
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
            try { recognition.start(); } catch(e) { stopRecording(); }
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
    } catch(e) {
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
    } catch(e) {
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
        try { recognition.stop(); } catch(e) {}
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
    showLoading('Import en cours...');
    updateLoading('Envoi et traitement (nettoyage IA, tags, NBA, privacy, sentiment)...', 0, 1);

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('seller_id', currentUser.id);
        formData.append('boutique_id', currentUser.boutique.id);

        const resp = await fetch(API_BASE + '/api/process', {
            method: 'POST',
            body: formData
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Erreur serveur ' + resp.status }));
            throw new Error(err.error || 'Erreur serveur');
        }

        const result = await resp.json();
        populateStateFromPipeline(result);

        hideLoading();
        showToast(`Import reussi: ${result.data.length} clients traites`, 'success');

        // Show result
        const resultDiv = $('importResult');
        const summary = $('importSummary');
        if (resultDiv && summary) {
            resultDiv.classList.remove('hidden');
            summary.innerHTML = `
                <div class="stats-row" style="grid-template-columns:repeat(4,1fr)">
                    <div class="stat-card"><div><div class="stat-value">${result.stats.clients}</div><div class="stat-label">Clients</div></div></div>
                    <div class="stat-card accent"><div><div class="stat-value">${result.stats.tags}</div><div class="stat-label">Tags</div></div></div>
                    <div class="stat-card green"><div><div class="stat-value">${result.stats.nba}</div><div class="stat-label">Actions NBA</div></div></div>
                    <div class="stat-card red"><div><div class="stat-value">${result.stats.rgpd}</div><div class="stat-label">RGPD masques</div></div></div>
                </div>
            `;
        }
    } catch (err) {
        hideLoading();
        showToast('Erreur import: ' + err.message, 'error');
        console.error(err);
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
});

async function startApp() {
    $('loginPage').classList.add('hidden');
    $('appShell').classList.remove('hidden');
    $('mobileNav').classList.remove('hidden');

    buildSidebar();

    // Load data from Supabase
    await loadClientsFromDB();

    // Navigate to first page
    const firstNav = (currentUser.role || '').toLowerCase() === 'manager' ? 'm-dashboard' : 'v-home';
    navigateTo(firstNav);
}
