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

// ===== LVMH HOUSES =====
const LVMH_HOUSES = ['Louis Vuitton', 'Dior', 'Fendi', 'Givenchy', 'Celine', 'Loewe', 'Berluti', 'Loro Piana', 'Tiffany & Co.', 'Bulgari', 'TAG Heuer', 'Hublot', 'Moët Hennessy', 'Sephora', 'Rimowa'];

// ===== HELPERS =====
const CAT_NAMES = { profil: 'Profil', interet: 'Intérêt', voyage: 'Voyage', contexte: 'Contexte', service: 'Service', marque: 'Marque', crm: 'CRM' };
const legendColors = { profil: '#60a5fa', interet: '#d4af37', voyage: '#34d399', contexte: '#c084fc', service: '#f472b6', marque: '#fb923c', crm: '#facc15' };

// ===== RENDER: DASHBOARD (Manager) =====
// ===== RENDER: DASHBOARD (Manager - COCKPIT) =====
function renderDashboard() {
    console.log("Rendering Cockpit Dashboard...");

    // 1. Mini KPIs (Sparklines)
    renderSparkline('spark1', [10, 15, 12, 18, 20, 15, 22, 25, 20, 28], '#10b981'); // Clients
    renderSparkline('spark3', [40, 35, 30, 32, 28, 25, 20, 18, 15, 12], '#ef4444'); // Tags (down)
    renderSparkline('spark4', [10, 10, 12, 12, 15, 15, 18, 18, 20, 20], '#aaa');    // NBA

    // 2. Main Graph
    renderCockpitMain();

    // 3. Calendar
    renderCalendar();

    // 4. Donuts & Radar
    renderPrivacyDonut();
    renderRadar();
    renderTagsCockpit();

    // 5. Wire Buttons
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) settingsBtn.onclick = () => alert('Paramètres du cockpit');
}

// --- COCKPIT WIDGETS ---

function renderSparkline(id, data, color) {
    const el = document.getElementById(id);
    if (!el) return;
    const width = 100;
    const height = 40; // Slightly taller for area
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padding = 0; // No padding for full area effect

    // Points for the line
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height * 0.8); // Leave some headroom
        return `${x},${y}`;
    });

    // Close the loop for area (bottom-right, bottom-left)
    const areaPoints = [
        ...points,
        `${width},${height}`,
        `0,${height}`
    ].join(' ');

    const linePoints = points.join(' ');

    // Create unique ID for gradient
    const gradId = `grad_${id}`;

    el.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible">
            <defs>
                <linearGradient id="${gradId}" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
                </linearGradient>
            </defs>
            <!-- Area Fill -->
            <polygon points="${areaPoints}" fill="url(#${gradId})" stroke="none"/>
            <!-- Top Line (thicker) -->
            <polyline points="${linePoints}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
}

function renderCockpitMain() {
    const el = document.getElementById('cockpitMainChart');
    if (!el) return;

    // Mock data for weekly activity
    const dataA = [40, 25, 50, 30, 60, 75, 45];
    const dataB = [20, 35, 20, 50, 40, 50, 30];
    const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const height = 150;
    const width = 400; // viewBox width

    // Generate paths
    const makePath = (data) => {
        return data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - (val / 100) * height;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    el.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible">
            <!-- Grid lines -->
            <line x1="0" y1="0" x2="${width}" y2="0" stroke="#333" stroke-width="1" stroke-dasharray="4"/>
            <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="#333" stroke-width="1" stroke-dasharray="4"/>
            <line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="#333" stroke-width="1"/>
            
            <!-- Areas/Lines -->
            <path d="${makePath(dataA)}" fill="none" stroke="#D4AF37" stroke-width="2" />
            <path d="${makePath(dataA)} L ${width} ${height} L 0 ${height} Z" fill="rgba(212, 175, 55, 0.1)" stroke="none" />
            
            <path d="${makePath(dataB)}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4"/>
            
            <!-- Labels -->
            ${labels.map((l, i) => `<text x="${(i / (labels.length - 1)) * width}" y="${height + 15}" fill="#666" font-size="10" text-anchor="middle">${l}</text>`).join('')}
        </svg>
    `;
}

function renderCalendar() {
    const el = document.getElementById('cockpitCalendar');
    if (!el) return;

    let html = '';
    // Week headers
    const week = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    week.forEach(d => html += `<div class="cal-day" style="color:#888">${d}</div>`);

    // Days
    for (let i = 1; i <= 35; i++) {
        const d = i - 2; // Offset
        let cls = 'cal-day';
        if (d === 17) cls += ' today'; // Today
        if (d === 20 || d === 25) cls += ' active'; // Event days

        let content = d > 0 && d <= 28 ? d : '';
        html += `<div class="${cls}">${content}</div>`;
    }
    el.innerHTML = html;
}

function renderRadar() {
    const el = document.getElementById('cockpitRadar');
    if (!el) return;
    // Simple 5-axis radar
    // Center 50,50 radius 45
    const axes = 5;
    const radius = 45;
    const center = 50;
    const data = [0.8, 0.6, 0.9, 0.4, 0.7]; // value 0-1

    const getPoint = (val, i) => {
        const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const r = val * radius;
        return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    };

    const points = data.map((v, i) => getPoint(v, i).join(',')).join(' ');

    // Background web
    let web = '';
    [0.5, 1].forEach(scale => {
        const webPoints = Array.from({ length: axes }).map((_, i) => getPoint(scale, i).join(',')).join(' ');
        web += `<polygon points="${webPoints}" fill="none" stroke="#333" stroke-width="1"/>`;
    });

    el.innerHTML = `
        <svg viewBox="0 0 100 100" style="width:80%;height:80%">
            ${web}
            <polygon points="${points}" fill="rgba(212, 175, 55, 0.4)" stroke="#D4AF37" stroke-width="2"/>
        </svg>
    `;
}

function renderPrivacyDonut() {
    const el = document.getElementById('cockpitPrivacyDonut');
    if (!el) return;
    const val = 85;
    const r = 40;
    const c = 2 * Math.PI * r;
    const off = c - (val / 100) * c;

    el.innerHTML = `
        <svg viewBox="0 0 100 100" style="width:80%;height:80%">
            <circle cx="50" cy="50" r="${r}" fill="none" stroke="#222" stroke-width="10"/>
            <circle cx="50" cy="50" r="${r}" fill="none" stroke="#10b981" stroke-width="10" 
                stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 50 50)" stroke-linecap="round"/>
            <text x="50" y="55" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold">${val}%</text>
        </svg>
    `;
}

function renderTagsCockpit() {
    // Reusing tag logic but generating simpler HTML
    const el = document.getElementById('cockpitTags');
    if (!el) return;

    const tagCounts = {};
    if (typeof DATA !== 'undefined') {
        DATA.forEach(c => c.tags.forEach(t => tagCounts[t.t] = (tagCounts[t.t] || 0) + 1));
    }
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

    // Mock if empty
    const displayList = sorted.length ? sorted : [['Maroquinerie', 120], ['Souliers', 95], ['Parfums', 80], ['Voyage', 60]];

    el.innerHTML = displayList.map(([tag, count]) => `
       <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;font-size:0.75rem;color:#aaa;">
         <span>${tag}</span>
         <span style="color:#fff">${count}</span>
       </div>
       <div style="height:4px;background:#222;border-radius:2px;width:100%"><div style="height:100%;width:${Math.min(100, Math.max(20, count))}%;background:#666;border-radius:2px"></div></div>
    `).join('');
}

// ===== RENDER: CLIENTS (shared) =====
function renderClients() {
    const legend = $('tagLegend');
    if (legend) {
        legend.innerHTML = Object.entries(CAT_NAMES).map(([k, v]) =>
            `<div class="legend-item"><span class="legend-dot" style="background:${legendColors[k] || '#888'}"></span>${v}</div>`
        ).join('');
    }
    renderGrid();
    const search = $('personSearch');
    if (search) search.oninput = e => renderGrid(e.target.value);
}

function renderGrid(filter) {
    filter = filter || '';
    const g = $('personGrid');
    if (!g) return;
    g.innerHTML = '';
    const f = filter.toLowerCase();
    const filtered = DATA.filter(p => !f || p.id.toLowerCase().includes(f) || (p.ca || '').toLowerCase().includes(f) || p.tags.some(t => t.t.toLowerCase().includes(f)) || p.clean.toLowerCase().includes(f));

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

// ===== RENDER: NBA =====
function renderNBA() {
    const grid = $('nbaGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const withNBA = DATA.filter(p => p.nba && p.nba.length > 0);
    if (withNBA.length === 0) {
        grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucune action NBA disponible.</p>';
        return;
    }

    const typeLabels = { immediate: 'Immédiat', short_term: 'Court terme', long_term: 'Long terme' };
    const typeClasses = { immediate: 'immediate', short_term: 'shortterm', long_term: 'longterm' };

    withNBA.forEach(p => {
        let html = `<div class="nba-card-header"><span class="nba-client-id">${p.ca || p.id}</span><div class="person-meta"><span>${p.tags.length} tags</span><span>${p.lang}</span></div></div>`;
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
    if (!overview) return;

    const totalViolations = PRIVACY_SCORES.reduce((s, p) => s + p.violations, 0);
    const criticalCount = PRIVACY_SCORES.filter(p => p.level === 'critical').length;
    const avgLevel = STATS.privacyAvg >= 90 ? 'excellent' : STATS.privacyAvg >= 75 ? 'good' : STATS.privacyAvg >= 60 ? 'warning' : 'critical';

    overview.innerHTML = `
        <div class="privacy-score-card"><div class="privacy-score-circle ${avgLevel}">${STATS.privacyAvg}%</div><div style="color:#888;font-size:.8rem">Score Global</div></div>
        <div class="privacy-score-card"><div style="font-size:2.2rem;font-weight:700;color:${totalViolations > 0 ? '#ef4444' : '#10b981'};margin-bottom:8px">${totalViolations}</div><div style="color:#888;font-size:.8rem">Violations</div></div>
        <div class="privacy-score-card"><div style="font-size:2.2rem;font-weight:700;color:${criticalCount > 0 ? '#ef4444' : '#10b981'};margin-bottom:8px">${criticalCount}</div><div style="color:#888;font-size:.8rem">CA en alerte</div></div>
    `;

    const grid = $('privacyGrid');
    if (!grid) return;
    grid.innerHTML = '';

    PRIVACY_SCORES.forEach(p => {
        const badgeClass = p.level === 'critical' ? 'alert' : p.level === 'warning' ? 'warn' : 'ok';
        const barColor = p.level === 'critical' ? '#ef4444' : p.level === 'warning' ? '#fb923c' : p.level === 'good' ? '#3b82f6' : '#10b981';

        let html = `
            <div class="privacy-card-header"><span class="privacy-ca-name">${p.ca}</span><span class="privacy-badge ${badgeClass}">${p.score}% — ${p.level.toUpperCase()}</span></div>
            <div class="privacy-bar"><div class="privacy-bar-fill" style="width:${p.score}%;background:${barColor}"></div></div>
            <div class="privacy-detail">${p.total} notes · ${p.violations} violation${p.violations > 1 ? 's' : ''}</div>
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
    if (!grid) return;
    grid.innerHTML = '';

    DATA.forEach(p => {
        if (p.tags.length < 2) return;
        const numHouses = Math.min(Math.floor(Math.random() * 3) + 1, 3);
        const houses = [...LVMH_HOUSES].sort(() => Math.random() - .5).slice(0, numHouses);
        const anonId = 'USP-' + btoa(p.id).substring(0, 8).toUpperCase();
        const styleTags = p.tags.filter(t => ['contexte', 'interet'].includes(t.c));
        const productTags = p.tags.filter(t => ['marque', 'voyage'].includes(t.c));
        const segmentTags = p.tags.filter(t => ['profil', 'crm'].includes(t.c));

        let html = `<div class="crossbrand-header"><span class="crossbrand-id">${anonId}</span><div class="crossbrand-houses">${houses.map(h => `<span class="crossbrand-house">${h}</span>`).join('')}</div></div>`;
        if (styleTags.length > 0) html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Style DNA</div><div class="crossbrand-tags">${styleTags.map(t => `<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;
        if (productTags.length > 0) html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Univers Produit</div><div class="crossbrand-tags">${productTags.map(t => `<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;
        if (segmentTags.length > 0) html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Segment</div><div class="crossbrand-tags">${segmentTags.map(t => `<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;

        const card = document.createElement('div');
        card.className = 'crossbrand-card';
        card.innerHTML = html;
        grid.appendChild(card);
    });
}

// ===== RENDER: LUXURY PULSE =====
function renderPulse() {
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

    const ps = $('pulseStats');
    if (ps) ps.innerHTML = `
        <div class="pulse-stat"><div class="pulse-stat-value">${sorted.length}</div><div class="pulse-stat-label">Tags uniques</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${totalTags}</div><div class="pulse-stat-label">Mentions totales</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${DATA.length}</div><div class="pulse-stat-label">Notes analysées</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${Array.from(catFreq.keys()).length}</div><div class="pulse-stat-label">Catégories actives</div></div>
    `;

    const trends = $('pulseTrends');
    if (trends) {
        trends.innerHTML = '';
        sorted.slice(0, 12).forEach(([tag, count]) => {
            const pct = ((count / DATA.length) * 100).toFixed(0);
            const change = Math.floor(Math.random() * 30) - 10;
            const changeClass = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
            const changeLabel = change > 0 ? `+${change}%` : `${change}%`;
            const bars = Array.from({ length: 8 }, () => {
                const h = Math.max(4, Math.floor(Math.random() * 28) + 2);
                return `<div class="pulse-bar-segment" style="height:${h}px;flex:1"></div>`;
            }).join('');
            const card = document.createElement('div');
            card.className = 'pulse-trend-card';
            card.innerHTML = `
                <div class="pulse-trend-header"><span class="pulse-trend-name">${tag}</span><span class="pulse-trend-change ${changeClass}">${changeLabel}</span></div>
                <div class="pulse-trend-bar">${bars}</div>
                <div class="pulse-trend-meta"><span>${count} mentions</span><span>${pct}% des clients</span></div>
            `;
            trends.appendChild(card);
        });
    }

    const signals = $('pulseSignals');
    if (signals) {
        signals.innerHTML = '<h3 style="margin-bottom:14px;font-size:1.05rem">🔔 Signaux Faibles</h3>';
        generateSignals(tagFreq, catFreq).forEach(s => {
            const sig = document.createElement('div');
            sig.className = `pulse-signal ${s.level}`;
            sig.innerHTML = `<div class="pulse-signal-icon">${s.icon}</div><div class="pulse-signal-content"><div class="pulse-signal-title">${s.title}</div><div class="pulse-signal-desc">${s.desc}</div></div><span class="pulse-signal-badge ${s.level}">${s.level === 'hot' ? 'Signal fort' : s.level === 'warm' ? 'Signal moyen' : 'Signal faible'}</span>`;
            signals.appendChild(sig);
        });
    }
}

function generateSignals(tagFreq, catFreq) {
    const signals = [];
    const total = DATA.length || 1;

    const durability = tagFreq.get('Sustainability_Focus') || 0;
    if (durability > 0) {
        const pct = ((durability / total) * 100).toFixed(0);
        signals.push({ icon: '🌍', title: `Durabilité: ${pct}% mentionnent des matériaux responsables`, desc: `${durability} mentions détectées.`, level: durability / total > 0.1 ? 'hot' : 'warm' });
    }
    const lifestyleCount = catFreq.get('interet') || 0;
    if (lifestyleCount > total * 0.3) signals.push({ icon: '🏃', title: `Lifestyle actif dominant: ${lifestyleCount} mentions`, desc: 'Opportunité collections sport-chic.', level: 'hot' });
    const occasionCount = catFreq.get('contexte') || 0;
    if (occasionCount > 0) signals.push({ icon: '🎁', title: `${occasionCount} occasions de gifting`, desc: 'Activer les campagnes de gifting personnalisé.', level: 'warm' });
    const vipCount = tagFreq.get('Key_Account') || 0;
    if (vipCount > 0) signals.push({ icon: '💎', title: `${vipCount} clients high-value`, desc: `${vipCount} Key Accounts identifiés.`, level: 'hot' });
    const mini = tagFreq.get('Design_Minimaliste') || 0;
    if (mini > 0) signals.push({ icon: '⚪', title: 'Tendance minimalisme', desc: `${mini} clients orientés minimaliste.`, level: 'warm' });
    const netCount = catFreq.get('profil') || 0;
    if (netCount > 0) signals.push({ icon: '📱', title: `${netCount} connexions réseau`, desc: 'Potentiel UGC et ambassadeurs.', level: 'cool' });
    if (signals.length === 0) signals.push({ icon: '📊', title: 'Analyse en cours...', desc: 'Importez plus de données.', level: 'cool' });
    return signals;
}

// ===== RENDER: FOLLOW-UP =====
function renderFollowup() {
    const grid = $('followupGrid');
    const house = $('followupHouse') ? $('followupHouse').value : 'Louis Vuitton';
    const channel = $('followupChannel') ? $('followupChannel').value : 'email';
    if (!grid) return;
    grid.innerHTML = '';

    const withTags = DATA.filter(p => p.tags.length > 0);
    if (withTags.length === 0) {
        grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucun client avec tags pour générer un follow-up.</p>';
        return;
    }

    withTags.forEach(p => {
        const msg = generateFollowupLocal(p, house, channel);
        const card = document.createElement('div');
        card.className = 'followup-card';
        card.innerHTML = `
            <div class="followup-card-header"><span class="followup-client-id">${p.ca || p.id}</span><span class="followup-channel ${channel}">${channel === 'email' ? '📧 Email' : '💬 WhatsApp'}</span></div>
            <div class="followup-subject">${msg.subject}</div>
            <div class="followup-body">${msg.body}</div>
            <div class="followup-actions"><button class="followup-btn copy" onclick="copyFollowup(this)">📋 Copier</button></div>
        `;
        grid.appendChild(card);
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
                <span class="product-match-client">${p.ca || p.id}</span>
                <span style="color:#666;font-size:.72rem">${matches.length} produit${matches.length > 1 ? 's' : ''} trouvé${matches.length > 1 ? 's' : ''}</span>
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
    if (!overview) return;

    const posCount = SENTIMENT_DATA.filter(s => s.level === 'positive').length;
    const neuCount = SENTIMENT_DATA.filter(s => s.level === 'neutral').length;
    const negCount = SENTIMENT_DATA.filter(s => s.level === 'negative').length;
    const avgScore = SENTIMENT_DATA.length > 0 ? Math.round(SENTIMENT_DATA.reduce((s, d) => s + d.score, 0) / SENTIMENT_DATA.length) : 0;

    overview.innerHTML = `
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#10b981">${posCount}</div><div class="sentiment-stat-label">Positifs</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#888">${neuCount}</div><div class="sentiment-stat-label">Neutres</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#ef4444">${negCount}</div><div class="sentiment-stat-label">Négatifs</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#d4af37">${avgScore}%</div><div class="sentiment-stat-label">Score moyen</div></div>
    `;

    const alerts = $('sentimentAlerts');
    if (alerts) {
        alerts.innerHTML = '';
        const negatives = SENTIMENT_DATA.filter(s => s.level === 'negative');
        if (negatives.length > 0) {
            alerts.innerHTML = '<h3 style="margin-bottom:12px;font-size:1rem;color:#ef4444">🚨 Clients à risque</h3>';
            negatives.forEach(s => {
                const al = document.createElement('div');
                al.className = 'sentiment-alert';
                al.innerHTML = `<div class="sentiment-alert-icon">⚠️</div><div class="sentiment-alert-content"><div class="sentiment-alert-title">${s.id} — Score ${s.score}% (CA: ${s.ca})</div><div class="sentiment-alert-desc">Mots: ${s.negFound.join(', ')}. Action immédiate recommandée.</div></div><span class="sentiment-alert-badge">À risque</span>`;
                alerts.appendChild(al);
            });
        }
    }

    const grid = $('sentimentGrid');
    if (!grid) return;
    grid.innerHTML = '';
    SENTIMENT_DATA.sort((a, b) => a.score - b.score).forEach(s => {
        const color = s.level === 'positive' ? '#10b981' : s.level === 'negative' ? '#ef4444' : '#888';
        const card = document.createElement('div');
        card.className = 'sentiment-card';
        card.innerHTML = `
            <div class="sentiment-card-header"><span class="sentiment-client">${s.id}</span><div class="sentiment-gauge"><div class="sentiment-gauge-bar"><div class="sentiment-gauge-fill" style="width:${s.score}%;background:${color}"></div></div><span class="sentiment-gauge-label" style="color:${color}">${s.score}%</span></div></div>
            <div class="sentiment-keywords">${s.posFound.map(k => `<span class="sentiment-kw positive">${k}</span>`).join('')}${s.negFound.map(k => `<span class="sentiment-kw negative">${k}</span>`).join('')}${s.posFound.length === 0 && s.negFound.length === 0 ? '<span class="sentiment-kw neutral">neutre</span>' : ''}</div>
            <div class="sentiment-excerpt">"${s.excerpt}..."</div>
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
