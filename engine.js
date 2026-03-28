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

// ===== LVMH HOUSES =====
const LVMH_HOUSES = ['Louis Vuitton','Dior','Fendi','Givenchy','Celine','Loewe','Berluti','Loro Piana','Tiffany & Co.','Bulgari','TAG Heuer','Hublot','Moët Hennessy','Sephora','Rimowa'];

// ===== HELPERS =====
const CAT_NAMES = { profil:'Profil', interet:'Intérêt', voyage:'Voyage', contexte:'Contexte', service:'Service', marque:'Marque', crm:'CRM' };
const legendColors = { profil:'#60a5fa', interet:'#d4af37', voyage:'#34d399', contexte:'#c084fc', service:'#f472b6', marque:'#fb923c', crm:'#facc15' };

// ===== RENDER: DASHBOARD (Manager - COCKPIT) =====
function renderDashboard() {

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
            `<div class="legend-item"><span class="legend-dot" style="background:${legendColors[k]||'#888'}"></span>${v}</div>`
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
    const filtered = DATA.filter(p => !f || p.id.toLowerCase().includes(f) || (p.ca||'').toLowerCase().includes(f) || p.tags.some(t => t.t.toLowerCase().includes(f)) || p.clean.toLowerCase().includes(f));

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
                html += `<div class="tag-section"><div class="tag-section-title">${CAT_NAMES[c]||c}</div><div class="tag-row">${tags.map(t => `<span class="tag ${c}">${t}</span>`).join('')}</div></div>`;
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

// ===== RENDER: NBA WITH UPLIFT =====
function renderNBA() {
    const grid = $('nbaGrid');
    if (!grid) return;
    grid.innerHTML = ''; // FIX: clear before render to prevent duplication

    const withNBA = DATA.filter(p => p.nba && Array.isArray(p.nba) && p.nba.length > 0);

    if (withNBA.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><p>Aucune action NBA disponible.</p></div>';
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

    // Segment cards = filters (combined, no duplication)
    const segments = [
        { key: 'all',            label: 'Tous',           desc: `${clientsWithUplift.length} clients`, color: '#B8965A', icon: '◈' },
        { key: 'persuadables',   label: 'Persuadables',   desc: 'ROI élevé',                          color: '#10b981', icon: '↑' },
        { key: 'valeurs-sures',  label: 'Valeurs Sûres',  desc: 'Achètent naturellement',             color: '#3b82f6', icon: '✓' },
        { key: 'chiens-dormants',label: 'À Réveiller',    desc: 'Approche douce requise',             color: '#fb923c', icon: '◎' },
        { key: 'cas-perdus',     label: 'Cas Perdus',     desc: 'Ne pas solliciter',                  color: '#ef4444', icon: '↓' }
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

        const card = document.createElement('div');
        card.className = `nba-card segment-${p.segment.segment}`;
        card.setAttribute('data-segment', p.segment.segment);
        card.innerHTML = `
            <div class="nba-card-stripe" style="background:${p.segment.color}"></div>
            <div class="nba-card-body">
                <div class="nba-card-head">
                    <div class="nba-card-identity">
                        <span class="nba-client-name">${p.ca || p.id}</span>
                        <span class="nba-seg-pill" style="color:${p.segment.color};border-color:${p.segment.color}20;background:${p.segment.color}10">${p.segment.label}</span>
                    </div>
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
                </div>
                ${tags.length > 0 ? `<div class="nba-tag-strip">${tags.slice(0, 5).map(t => `<span class="nba-tag-pill">${t.t}</span>`).join('')}${tags.length > 5 ? `<span class="nba-tag-more">+${tags.length - 5}</span>` : ''}</div>` : ''}
                <div class="nba-actions-list">
                    ${nbaList.map((a, i) => {
                        const cls = typeClasses[a.type] || 'shortterm';
                        return `<div class="nba-action-row">
                            <span class="nba-action-num">${i + 1}</span>
                            <div class="nba-action-content">
                                <span class="nba-action-text">${a.action}</span>
                                <span class="nba-action-badge ${cls}">${typeLabels[a.type] || a.type}</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
        gridEl.appendChild(card);
    });

    container.appendChild(gridEl);
    grid.appendChild(container);

    // Segment buttons = filters
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
    
    // Calculate trend (mock: compare to previous period)
    const previousAvg = STATS.privacyAvg - (Math.random() * 10 - 5);
    const trend = STATS.privacyAvg - previousAvg;
    const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
    const trendText = trend > 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`;

    overview.innerHTML = `
        <div class="privacy-overview-grid">
            <div class="privacy-gauge-container">
                <div class="privacy-gauge-visual">
                    <svg width="180" height="180" viewBox="0 0 180 180">
                        <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="12"/>
                        <circle cx="90" cy="90" r="70" fill="none" stroke="${avgLevel === 'excellent' ? '#10b981' : avgLevel === 'good' ? '#3b82f6' : avgLevel === 'warning' ? '#fb923c' : '#ef4444'}" stroke-width="12" stroke-dasharray="${(STATS.privacyAvg / 100) * 440} 440" stroke-linecap="round" transform="rotate(-90 90 90)"/>
                        <text x="90" y="85" text-anchor="middle" font-size="32" font-weight="700" fill="#f1e5ac">${STATS.privacyAvg}%</text>
                        <text x="90" y="105" text-anchor="middle" font-size="12" fill="rgba(241,229,172,0.6)">Score Global</text>
                    </svg>
                </div>
                <div class="privacy-trend">
                    ${trendIcon} ${trendText} vs période précédente
                </div>
            </div>
            <div class="privacy-violations-chart">
                <div class="privacy-chart-title">Répartition des violations</div>
                <div class="privacy-violations-bars">
                    ${Object.entries(violationsByType).map(([type, count]) => {
                        const labels = { orientation: 'Orientation', politics: 'Politique', religion: 'Religion', health: 'Santé', other: 'Autres' };
                        const colors = { orientation: '#ef4444', politics: '#f97316', religion: '#fb923c', health: '#fbbf24', other: '#94a3b8' };
                        const maxCount = Math.max(...Object.values(violationsByType), 1);
                        const percent = (count / maxCount) * 100;
                        return count > 0 ? `
                            <div class="privacy-violation-bar-item">
                                <div class="privacy-violation-bar-label">${labels[type]}</div>
                                <div class="privacy-violation-bar-container">
                                    <div class="privacy-violation-bar-fill" style="width:${percent}%;background:${colors[type]}"></div>
                                    <span class="privacy-violation-bar-value">${count}</span>
                                </div>
                            </div>
                        ` : '';
                    }).join('')}
                </div>
            </div>
            <div class="privacy-stats-cards">
                <div class="privacy-stat-mini">
                    <div class="privacy-stat-mini-value" style="color:${totalViolations>0?'#ef4444':'#10b981'}">${totalViolations}</div>
                    <div class="privacy-stat-mini-label">Violations totales</div>
                </div>
                <div class="privacy-stat-mini">
                    <div class="privacy-stat-mini-value" style="color:${criticalCount>0?'#ef4444':'#10b981'}">${criticalCount}</div>
                    <div class="privacy-stat-mini-label">CA en alerte</div>
                </div>
            </div>
        </div>
    `;

    const grid = $('privacyGrid');
    if (!grid) return;
    grid.innerHTML = '';

    PRIVACY_SCORES.forEach(p => {
        const badgeClass = p.level === 'critical' ? 'alert' : p.level === 'warning' ? 'warn' : 'ok';
        const barColor = p.level === 'critical' ? '#ef4444' : p.level === 'warning' ? '#fb923c' : p.level === 'good' ? '#3b82f6' : '#10b981';
        
        const violations = p.violations_detail || { orientation: 0, politics: 0, religion: 0, health: 0 };
        const enhanced = getEnhancedCoaching(violations, p.level);

        let html = `
            <div class="privacy-card-header">
                <span class="privacy-ca-name">${p.ca}</span>
                <span class="privacy-badge ${badgeClass}">${p.score}% — ${p.level.toUpperCase()}</span>
            </div>
            <div class="privacy-bar"><div class="privacy-bar-fill" style="width:${p.score}%;background:${barColor}"></div></div>
            <div class="privacy-detail">${p.total} notes · ${p.violations} violation${p.violations>1?'s':''}</div>
        `;
        
        if (enhanced.coaching.length > 0) {
            html += '<div class="coaching-section"><div class="coaching-title">🎯 Actions prioritaires</div>';
            enhanced.coaching.forEach(c => {
                const priorityColors = { critical: '#ef4444', high: '#fb923c', medium: '#fbbf24' };
                html += `
                    <div class="coaching-item" style="border-left:3px solid ${priorityColors[c.priority]}">
                        <div class="coaching-priority">${c.priority.toUpperCase()}</div>
                        <div class="coaching-message">${c.message}</div>
                        <div class="coaching-action">→ ${c.action}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        if (enhanced.microLearning.length > 0) {
            html += '<div class="microlearning-section"><div class="microlearning-title">📚 Micro-learning recommandé</div>';
            enhanced.microLearning.forEach(ml => {
                html += `
                    <a href="${ml.url}" class="microlearning-card">
                        <span class="microlearning-icon">${ml.icon}</span>
                        <div class="microlearning-info">
                            <div class="microlearning-name">${ml.title}</div>
                            <div class="microlearning-duration">${ml.duration}</div>
                        </div>
                    </a>
                `;
            });
            html += '</div>';
        }

        const card = document.createElement('div');
        card.className = 'privacy-card privacy-card-enhanced';
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
        const numHouses = Math.min(Math.floor(Math.random()*3)+1, 3);
        const houses = [...LVMH_HOUSES].sort(() => Math.random()-.5).slice(0, numHouses);
        const anonId = 'USP-' + btoa(p.id).substring(0,8).toUpperCase();
        const styleTags = p.tags.filter(t => ['contexte','interet'].includes(t.c));
        const productTags = p.tags.filter(t => ['marque','voyage'].includes(t.c));
        const segmentTags = p.tags.filter(t => ['profil','crm'].includes(t.c));

        let html = `<div class="crossbrand-header"><span class="crossbrand-id">${anonId}</span><div class="crossbrand-houses">${houses.map(h=>`<span class="crossbrand-house">${h}</span>`).join('')}</div></div>`;
        if (styleTags.length>0) html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Style DNA</div><div class="crossbrand-tags">${styleTags.map(t=>`<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;
        if (productTags.length>0) html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Univers Produit</div><div class="crossbrand-tags">${productTags.map(t=>`<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;
        if (segmentTags.length>0) html += `<div class="crossbrand-section"><div class="crossbrand-section-title">Segment</div><div class="crossbrand-tags">${segmentTags.map(t=>`<span class="crossbrand-tag">${t.t}</span>`).join('')}</div></div>`;

        const card = document.createElement('div');
        card.className = 'crossbrand-card';
        card.innerHTML = html;
        grid.appendChild(card);
    });
}

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

function getStrategicRecommendations(topTrends, emerging, catFreq) {
    const recommendations = [];
    
    // Analyze top trends
    const topTrendTags = topTrends.slice(0, 3).map(t => t.tag);
    
    if (topTrendTags.some(t => t.includes('Sustainability') || t.includes('Eco') || t.includes('Vegan'))) {
        recommendations.push({
            priority: 'high',
            category: 'Product Strategy',
            icon: '🌿',
            title: 'Accélérer les collections durables',
            action: 'Forte demande pour matériaux éco-responsables. Recommandation: mettre en avant la ligne "Conscious Craft".',
            impact: 'Hausse prévue de 20% des ventes sur ce segment'
        });
    }
    
    if (topTrendTags.some(t => t.includes('Travel') || t.includes('Voyage'))) {
        recommendations.push({
            priority: 'high',
            category: 'Marketing Campaign',
            icon: '✈️',
            title: 'Campagne "Horizons Luxueux"',
            action: 'Spike de mentions voyage. Lancer une activation autour des bagages et accessoires de voyage.',
            impact: 'Opportunité cross-sell avec aviation privée'
        });
    }
    
    if (emerging.length > 0) {
        const emergingTag = emerging[0][0];
        recommendations.push({
            priority: 'medium',
            category: 'Weak Signal',
            icon: '🔮',
            title: `Tendance émergente: ${emergingTag}`,
            action: `Signal faible détecté. Surveiller l'évolution et préparer une réponse produit/marketing si confirmation.`,
            impact: 'Avantage stratégique si anticipation réussie'
        });
    }
    
    const lifestyleCount = catFreq.get('interet') || 0;
    if (lifestyleCount > DATA.length * 0.4) {
        recommendations.push({
            priority: 'high',
            category: 'Customer Experience',
            icon: '🏋️',
            title: 'Programme VIC Lifestyle',
            action: 'Clients très engagés sur lifestyle. Créer des événements expérientiels (golf, tennis, voyages).',
            impact: 'Renforcement NPS et fidélisation'
        });
    }
    
    const contextCount = catFreq.get('contexte') || 0;
    if (contextCount > 0) {
        recommendations.push({
            priority: 'medium',
            category: 'Sales Training',
            icon: '🎓',
            title: 'Formation "Écoute Active"',
            action: 'Nombreux contextes détectés. Former les CAs à exploiter ces moments clés pour proposer NBA.',
            impact: 'Augmentation du taux de conversion'
        });
    }
    
    return recommendations;
}

// ===== RENDER: LUXURY PULSE WITH REAL VELOCITY =====
function renderPulse() {
    const tagFreq = new Map();
    const catFreq = new Map();
    DATA.forEach(row => {
        row.tags.forEach(t => {
            tagFreq.set(t.t, (tagFreq.get(t.t)||0)+1);
            catFreq.set(t.c, (catFreq.get(t.c)||0)+1);
        });
    });
    
    const { velocities, emerging } = calculateTrendVelocity();
    
    // Sort by total count
    const sorted = Array.from(tagFreq.entries()).sort((a,b) => b[1]-a[1]);
    const totalTags = sorted.reduce((s,[,c]) => s+c, 0);
    
    // Get top trends with velocity
    const topTrends = sorted.slice(0, 12).map(([tag, count]) => {
        const velocityData = velocities.get(tag) || { velocity: 0, firstCount: 0, secondCount: 0 };
        return {
            tag,
            count,
            velocity: velocityData.velocity,
            firstCount: velocityData.firstCount,
            secondCount: velocityData.secondCount
        };
    });

    const ps = $('pulseStats');
    if (ps) ps.innerHTML = `
        <div class="pulse-stat"><div class="pulse-stat-value">${sorted.length}</div><div class="pulse-stat-label">Tags uniques</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${totalTags}</div><div class="pulse-stat-label">Mentions totales</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${emerging.length}</div><div class="pulse-stat-label">Topics émergents</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${Array.from(catFreq.keys()).length}</div><div class="pulse-stat-label">Catégories actives</div></div>
    `;

    const trends = $('pulseTrends');
    if (trends) {
        trends.innerHTML = '';
        topTrends.forEach(trend => {
            const pct = ((trend.count/DATA.length)*100).toFixed(0);
            const velocity = trend.velocity;
            const changeClass = velocity > 10 ? 'up' : velocity < -10 ? 'down' : 'stable';
            const changeLabel = velocity > 0 ? `+${velocity}%` : `${velocity}%`;
            
            // Create realistic bars based on actual data
            const maxCount = Math.max(trend.firstCount, trend.secondCount, 1);
            const bars = Array.from({length: 8}, (_, i) => {
                const progress = (i + 1) / 8;
                const interpolated = trend.firstCount + (trend.secondCount - trend.firstCount) * progress;
                const h = Math.max(4, Math.round((interpolated / maxCount) * 28));
                return `<div class="pulse-bar-segment" style="height:${h}px;flex:1"></div>`;
            }).join('');
            
            const card = document.createElement('div');
            card.className = 'pulse-trend-card';
            card.innerHTML = `
                <div class="pulse-trend-header">
                    <span class="pulse-trend-name">${trend.tag}</span>
                    <span class="pulse-trend-change ${changeClass}">${changeLabel}</span>
                </div>
                <div class="pulse-trend-bar">${bars}</div>
                <div class="pulse-trend-meta">
                    <span>${trend.count} mentions</span>
                    <span>${pct}% des clients</span>
                    <span class="pulse-velocity-badge">Velocity: ${changeLabel}</span>
                </div>
            `;
            trends.appendChild(card);
        });
    }

    // Emerging topics section
    const emergingSection = $('pulseEmerging');
    if (emergingSection && emerging.length > 0) {
        emergingSection.innerHTML = '<h3 style="margin-bottom:14px;font-size:1.05rem">🌱 Topics Émergents</h3>';
        emerging.forEach(([tag, data]) => {
            const card = document.createElement('div');
            card.className = 'pulse-emerging-card';
            card.innerHTML = `
                <div class="pulse-emerging-icon">🆕</div>
                <div class="pulse-emerging-content">
                    <div class="pulse-emerging-name">${tag}</div>
                    <div class="pulse-emerging-desc">${data.secondCount} mentions dans période récente</div>
                </div>
                <span class="pulse-emerging-badge">Nouveau</span>
            `;
            emergingSection.appendChild(card);
        });
    }

    // Strategic recommendations
    const recommendations = getStrategicRecommendations(topTrends, emerging, catFreq);
    const recoSection = $('pulseRecommendations');
    if (recoSection && recommendations.length > 0) {
        recoSection.innerHTML = '<h3 style="margin-bottom:14px;font-size:1.05rem">💡 Recommandations Stratégiques</h3>';
        recommendations.forEach(reco => {
            const card = document.createElement('div');
            card.className = `pulse-reco-card priority-${reco.priority}`;
            card.innerHTML = `
                <div class="pulse-reco-header">
                    <span class="pulse-reco-icon">${reco.icon}</span>
                    <div class="pulse-reco-meta">
                        <span class="pulse-reco-category">${reco.category}</span>
                        <span class="pulse-reco-priority ${reco.priority}">${reco.priority.toUpperCase()}</span>
                    </div>
                </div>
                <div class="pulse-reco-title">${reco.title}</div>
                <div class="pulse-reco-action">${reco.action}</div>
                <div class="pulse-reco-impact">📊 Impact: ${reco.impact}</div>
            `;
            recoSection.appendChild(card);
        });
    }

    const signals = $('pulseSignals');
    if (signals) {
        signals.innerHTML = '<h3 style="margin-bottom:14px;font-size:1.05rem">🔔 Signaux Faibles</h3>';
        generateSignals(tagFreq, catFreq).forEach(s => {
            const sig = document.createElement('div');
            sig.className = `pulse-signal ${s.level}`;
            sig.innerHTML = `<div class="pulse-signal-icon">${s.icon}</div><div class="pulse-signal-content"><div class="pulse-signal-title">${s.title}</div><div class="pulse-signal-desc">${s.desc}</div></div><span class="pulse-signal-badge ${s.level}">${s.level==='hot'?'Signal fort':s.level==='warm'?'Signal moyen':'Signal faible'}</span>`;
            signals.appendChild(sig);
        });
    }
}

function generateSignals(tagFreq, catFreq) {
    const signals = [];
    const total = DATA.length || 1;

    const durability = tagFreq.get('Sustainability_Focus') || 0;
    if (durability > 0) {
        const pct = ((durability/total)*100).toFixed(0);
        signals.push({ icon:'🌍', title:`Durabilité: ${pct}% mentionnent des matériaux responsables`, desc:`${durability} mentions détectées.`, level: durability/total>0.1?'hot':'warm' });
    }
    const lifestyleCount = catFreq.get('interet') || 0;
    if (lifestyleCount > total*0.3) signals.push({ icon:'🏃', title:`Lifestyle actif dominant: ${lifestyleCount} mentions`, desc:'Opportunité collections sport-chic.', level:'hot' });
    const occasionCount = catFreq.get('contexte') || 0;
    if (occasionCount > 0) signals.push({ icon:'🎁', title:`${occasionCount} occasions de gifting`, desc:'Activer les campagnes de gifting personnalisé.', level:'warm' });
    const vipCount = tagFreq.get('Key_Account') || 0;
    if (vipCount > 0) signals.push({ icon:'💎', title:`${vipCount} clients high-value`, desc:`${vipCount} Key Accounts identifiés.`, level:'hot' });
    const mini = tagFreq.get('Design_Minimaliste') || 0;
    if (mini > 0) signals.push({ icon:'⚪', title:'Tendance minimalisme', desc:`${mini} clients orientés minimaliste.`, level:'warm' });
    const netCount = catFreq.get('profil') || 0;
    if (netCount > 0) signals.push({ icon:'📱', title:`${netCount} connexions réseau`, desc:'Potentiel UGC et ambassadeurs.', level:'cool' });
    if (signals.length === 0) signals.push({ icon:'📊', title:'Analyse en cours...', desc:'Importez plus de données.', level:'cool' });
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
            <div class="followup-card-header"><span class="followup-client-id">${p.ca || p.id}</span><span class="followup-channel ${channel}">${channel==='email'?'📧 Email':'💬 WhatsApp'}</span></div>
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
    const occasions = tags.filter(t => ['Anniversaire','Union','Naissance','Événement_Vie','Promotion','Réussite_Business','Retraite'].includes(t));
    const styles = tags.filter(t => ['Intemporel','Contemporain','Tendance','Quiet_Luxury','Signature_Logo'].includes(t));
    const interests = tags.filter(t => ['Golf','Tennis','Nautisme_Yachting','Sports_Endurance','Wellness_Yoga','Art_Contemporain','Gastronomie_Fine_Dining'].includes(t));

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

window.copyFollowup = function(btn) {
    const body = btn.closest('.followup-card').querySelector('.followup-body').textContent;
    navigator.clipboard.writeText(body).then(() => {
        btn.textContent = '✅ Copié !';
        setTimeout(() => { btn.textContent = '📋 Copier'; }, 1500);
    });
};

// ===== INTELLIGENT PRODUCT MATCHING (OPTIMIZED) =====
// Cache pour éviter de recalculer les mêmes correspondances
const _matchCache = new Map();

function matchProductsToClient(clientTags, clientText) {
    if (!PRODUCTS_LOADED || LV_PRODUCTS.length === 0) return [];
    
    // Check cache
    const cacheKey = clientTags.map(t => t.t).sort().join('|');
    if (_matchCache.has(cacheKey)) {
        return _matchCache.get(cacheKey);
    }
    
    const matches = [];
    const clientTextLower = (clientText || '').toLowerCase();
    
    // Quick return if no tags
    if (!Array.isArray(clientTags) || clientTags.length === 0) {
        return [];
    }
    
    // Limit products to process (first 500 for speed)
    const productsToProcess = LV_PRODUCTS.slice(0, 500);
    
    // Extract relevant info from tags (optimized with early filtering)
    const profil = clientTags.filter(t => t.c === 'profil').map(t => t.t);
    const interet = clientTags.filter(t => t.c === 'interet').map(t => t.t);
    const contexte = clientTags.filter(t => t.c === 'contexte').map(t => t.t);
    const voyage = clientTags.filter(t => t.c === 'voyage').map(t => t.t);
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
    
    // Score each product (optimized - process limited set)
    productsToProcess.forEach(product => {
        let score = 0;
        let matchReasons = [];
        
        // Build comprehensive product text from Hugging Face dataset structure
        const productName = (product.title || '').toLowerCase();
        const productCategory = (product.category1_code || '').toLowerCase();
        const productSubcategory = ((product.category2_code || '') + ' ' + (product.category3_code || '')).toLowerCase();
        
        // Complete product text for matching
        const productText = `${productName} ${productCategory} ${productSubcategory}`;
        
        // 1. SEMANTIC MATCHING - Use ALL product information
        clientTags.forEach(tag => {
            const tagLabel = tag.t;
            const keywords = matchingRules[tagLabel] || [];
            
            // Match keywords in product text
            for (const keyword of keywords) {
                if (productText.includes(keyword)) {
                    score += 12;
                    if (!matchReasons.includes(tagLabel)) {
                        matchReasons.push(tagLabel);
                    }
                }
            }

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
                productName.includes('organiseur') || productName.includes('portefeuille')) {
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
        
        // Style matching
        if (contexte.includes('Intemporel') || contexte.includes('Quiet_Luxury')) {
            if (productName.includes('monogram')) {
                score += 12;
                matchReasons.push('Style Classique');
            }
        }

        // 3. CLIENT TEXT SEMANTIC MATCHING
        const clientWords = clientTextLower.split(/\s+/).filter(w => w.length > 4);
        clientWords.forEach(word => {
            if (productName.includes(word)) score += 8;
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
        
        // Only include products with meaningful matches (optimized threshold)
        if (score >= 15 && matchReasons.length > 0) {
            matches.push({
                product,
                score,
                matchReasons: [...new Set(matchReasons)].slice(0, 3)
            });
        }
        
        // Early exit if we have enough high-quality matches
        if (matches.length >= 20 && matches.some(m => m.score > 50)) {
            return matches.sort((a, b) => b.score - a.score).slice(0, 10);
        }
    });
    
    // Sort by score and return top matches
    const sortedMatches = matches.sort((a, b) => b.score - a.score);
    
    // Cache result
    _matchCache.set(cacheKey, sortedMatches);
    
    // Limit cache size
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
        
        card.innerHTML = `
            <div class="product-match-header">
                <span class="product-match-client">${client.ca || client.id}</span>
                <span style="color:#666;font-size:.72rem">${matches.length} produit${matches.length > 1 ? 's' : ''} trouvé${matches.length > 1 ? 's' : ''}</span>
            </div>
            <div class="product-match-tags">${client.tags.slice(0,6).map(t=>`<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
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
            
            // Calculate similarity percentage (normalize against max score)
            const similarityPercent = Math.min(100, Math.round((match.score / 100) * 100));

            return `
                        <div class="product-item">
                            <div class="product-item-img" style="background-image:url('${imageUrl}');background-size:cover;background-position:center;width:100px;height:100px;border-radius:8px;flex-shrink:0;${imageUrl ? '' : 'background-color:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:2rem'}">
                                ${imageUrl ? '' : '🛍️'}
                                <div class="product-similarity-badge">${similarityPercent}%</div>
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

    // Wire search
    const searchInput = document.getElementById('pmSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.product-match-card').forEach(card => {
                const clientName = card.getAttribute('data-client');
                const tags = card.getAttribute('data-tags');
                if (clientName.includes(query) || tags.includes(query)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// ===== CHURN RISK CALCULATION =====
function calculateChurnRisk(sentimentScore, sentimentLevel, visitFrequency = 1) {
    // visitFrequency: mocked as 1 (average) - in real system, would come from CRM
    let churnScore = 0;
    
    // Sentiment impact (60% weight)
    if (sentimentLevel === 'negative') {
        churnScore += 60;
    } else if (sentimentLevel === 'neutral') {
        churnScore += 30;
    } else {
        churnScore += Math.max(0, (100 - sentimentScore) * 0.4);
    }
    
    // Visit frequency impact (40% weight)
    const frequencyScore = Math.max(0, (1 - visitFrequency) * 40);
    churnScore += frequencyScore;
    
    churnScore = Math.min(100, Math.round(churnScore));
    
    if (churnScore >= 70) {
        return { risk: 'critical', label: 'Critique', color: '#ef4444', icon: '🔴' };
    } else if (churnScore >= 50) {
        return { risk: 'high', label: 'Élevé', color: '#fb923c', icon: '🟠' };
    } else if (churnScore >= 30) {
        return { risk: 'medium', label: 'Modéré', color: '#fbbf24', icon: '🟡' };
    } else {
        return { risk: 'low', label: 'Faible', color: '#10b981', icon: '🟢' };
    }
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

// ===== RENDER: SENTIMENT WITH SERVICE RECOVERY =====
function renderSentiment() {
    const overview = $('sentimentOverview');
    if (!overview) return;

    const posCount = SENTIMENT_DATA.filter(s => s.level==='positive').length;
    const neuCount = SENTIMENT_DATA.filter(s => s.level==='neutral').length;
    const negCount = SENTIMENT_DATA.filter(s => s.level==='negative').length;
    const avgScore = SENTIMENT_DATA.length > 0 ? Math.round(SENTIMENT_DATA.reduce((s,d)=>s+d.score,0)/SENTIMENT_DATA.length) : 0;

    // Calculate churn stats
    const clientsWithChurn = SENTIMENT_DATA.map(s => ({
        ...s,
        churn: calculateChurnRisk(s.score, s.level, 1)
    }));
    
    const criticalChurn = clientsWithChurn.filter(c => c.churn.risk === 'critical').length;
    const highChurn = clientsWithChurn.filter(c => c.churn.risk === 'high').length;

    overview.innerHTML = `
        <div class="sentiment-overview-grid">
            <div class="sentiment-distribution-chart">
                <div class="sentiment-chart-title">Distribution des sentiments</div>
                <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#ef4444" stroke-width="40" stroke-dasharray="${(negCount / SENTIMENT_DATA.length) * 503} 503" transform="rotate(-90 100 100)"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#888" stroke-width="40" stroke-dasharray="${(neuCount / SENTIMENT_DATA.length) * 503} 503" stroke-dashoffset="${-(negCount / SENTIMENT_DATA.length) * 503}" transform="rotate(-90 100 100)"/>
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" stroke-width="40" stroke-dasharray="${(posCount / SENTIMENT_DATA.length) * 503} 503" stroke-dashoffset="${-((negCount + neuCount) / SENTIMENT_DATA.length) * 503}" transform="rotate(-90 100 100)"/>
                    <text x="100" y="95" text-anchor="middle" font-size="36" font-weight="700" fill="#f1e5ac">${avgScore}%</text>
                    <text x="100" y="115" text-anchor="middle" font-size="12" fill="rgba(241,229,172,0.6)">Score moyen</text>
                </svg>
                <div class="sentiment-legend">
                    <div class="sentiment-legend-item"><span class="sentiment-legend-dot" style="background:#10b981"></span>Positifs: ${posCount}</div>
                    <div class="sentiment-legend-item"><span class="sentiment-legend-dot" style="background:#888"></span>Neutres: ${neuCount}</div>
                    <div class="sentiment-legend-item"><span class="sentiment-legend-dot" style="background:#ef4444"></span>Négatifs: ${negCount}</div>
                </div>
            </div>
            <div class="sentiment-stats-grid">
                <div class="sentiment-stat-card">
                    <div class="sentiment-stat-value" style="color:#10b981">${posCount}</div>
                    <div class="sentiment-stat-label">Positifs</div>
                </div>
                <div class="sentiment-stat-card">
                    <div class="sentiment-stat-value" style="color:#888">${neuCount}</div>
                    <div class="sentiment-stat-label">Neutres</div>
                </div>
                <div class="sentiment-stat-card">
                    <div class="sentiment-stat-value" style="color:#ef4444">${negCount}</div>
                    <div class="sentiment-stat-label">Négatifs</div>
                </div>
                <div class="sentiment-stat-card">
                    <div class="sentiment-stat-value" style="color:#ef4444">${criticalChurn}</div>
                    <div class="sentiment-stat-label">Churn Critique</div>
                </div>
                <div class="sentiment-stat-card">
                    <div class="sentiment-stat-value" style="color:#fb923c">${highChurn}</div>
                    <div class="sentiment-stat-label">Churn Élevé</div>
                </div>
            </div>
        </div>
    `;

    // Enhanced alerts with priority
    const alerts = $('sentimentAlerts');
    if (alerts) {
        alerts.innerHTML = '';
        
        const sortedByChurn = clientsWithChurn
            .filter(c => c.churn.risk === 'critical' || c.churn.risk === 'high')
            .sort((a, b) => {
                const priority = { critical: 3, high: 2, medium: 1, low: 0 };
                return priority[b.churn.risk] - priority[a.churn.risk];
            });
        
        if (sortedByChurn.length > 0) {
            alerts.innerHTML = '<h3 style="margin-bottom:16px;font-size:1.1rem;color:#ef4444">🚨 Service Recovery - Actions Prioritaires</h3>';
            
            sortedByChurn.forEach(s => {
                const recoveryActions = getServiceRecoveryActions(s.churn.risk);
                const al = document.createElement('div');
                al.className = `sentiment-alert-enhanced priority-${s.churn.risk}`;
                
                let actionsHTML = '';
                if (recoveryActions.length > 0) {
                    actionsHTML = '<div class="recovery-actions">';
                    recoveryActions.forEach(action => {
                        actionsHTML += `
                            <div class="recovery-action" style="border-left-color:${action.color}">
                                <span class="recovery-icon">${action.icon}</span>
                                <div class="recovery-action-text">
                                    <div class="recovery-action-priority">${action.priority.toUpperCase()}</div>
                                    <div class="recovery-action-desc">${action.action}</div>
                                </div>
                            </div>
                        `;
                    });
                    actionsHTML += '</div>';
                }
                
                al.innerHTML = `
                    <div class="sentiment-alert-header">
                        <div class="sentiment-alert-client-info">
                            <span class="sentiment-alert-client-name">${s.id}</span>
                            <span class="sentiment-alert-score" style="color:${s.level==='negative'?'#ef4444':'#fb923c'}">${s.score}%</span>
                        </div>
                        <div class="sentiment-alert-badges">
                            <span class="churn-risk-badge" style="background:${s.churn.color}">${s.churn.icon} ${s.churn.label}</span>
                        </div>
                    </div>
                    <div class="sentiment-alert-details">
                        <div class="sentiment-alert-keywords">Signaux: ${s.negFound.join(', ')}</div>
                        <div class="sentiment-alert-ca">CA: ${s.ca}</div>
                    </div>
                    ${actionsHTML}
                `;
                alerts.appendChild(al);
            });
        } else {
            alerts.innerHTML = '<p style="color:#10b981;font-size:.9rem">✅ Aucun client à risque critique actuellement.</p>';
        }
    }

    const grid = $('sentimentGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    clientsWithChurn.sort((a,b) => a.score-b.score).forEach(s => {
        const color = s.level==='positive'?'#10b981':s.level==='negative'?'#ef4444':'#888';
        const card = document.createElement('div');
        card.className = 'sentiment-card-enhanced';
        card.innerHTML = `
            <div class="sentiment-card-header">
                <span class="sentiment-client">${s.id}</span>
                <div style="display:flex;align-items:center;gap:8px">
                    <span class="churn-risk-badge-mini" style="background:${s.churn.color}">${s.churn.icon}</span>
                    <div class="sentiment-gauge">
                        <div class="sentiment-gauge-bar">
                            <div class="sentiment-gauge-fill" style="width:${s.score}%;background:${color}"></div>
                        </div>
                        <span class="sentiment-gauge-label" style="color:${color}">${s.score}%</span>
                    </div>
                </div>
            </div>
            <div class="sentiment-keywords">${s.posFound.map(k=>`<span class="sentiment-kw positive">${k}</span>`).join('')}${s.negFound.map(k=>`<span class="sentiment-kw negative">${k}</span>`).join('')}${s.posFound.length===0&&s.negFound.length===0?'<span class="sentiment-kw neutral">neutre</span>':''}</div>
            <div class="sentiment-excerpt">"${s.excerpt}..."</div>
            <div class="sentiment-recommendations">
                <div class="sentiment-rec-title">💡 Recommandations</div>
                ${s.churn.risk === 'critical' ? '<div class="sentiment-rec">→ Intervention immédiate requise</div>' : ''}
                ${s.level === 'negative' ? '<div class="sentiment-rec">→ Privilégier le contact personnel</div>' : ''}
                ${s.level === 'neutral' ? '<div class="sentiment-rec">→ Proposer une expérience différenciante</div>' : ''}
                ${s.level === 'positive' ? '<div class="sentiment-rec">→ Fidéliser avec programme VIC</div>' : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

// ===== RENDER: BOUTIQUE MANAGER =====
function renderBoutique() {
    const kpis = $('boutiqueKPIs');
    if (!kpis) return;

    const avgSentiment = SENTIMENT_DATA.length > 0 ? Math.round(SENTIMENT_DATA.reduce((s,d)=>s+d.score,0)/SENTIMENT_DATA.length) : 0;
    const atRiskPct = STATS.clients > 0 ? Math.round((STATS.atRisk/STATS.clients)*100) : 0;

    kpis.innerHTML = `
        <div class="boutique-kpi"><div class="boutique-kpi-value">${STATS.clients}</div><div class="boutique-kpi-label">Notes traitées</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:#10b981">${STATS.tags}</div><div class="boutique-kpi-label">Tags extraits</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:#d4af37">${STATS.nba}</div><div class="boutique-kpi-label">Actions NBA</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:${avgSentiment>=60?'#10b981':'#ef4444'}">${avgSentiment}%</div><div class="boutique-kpi-label">Satisfaction</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:${atRiskPct>10?'#ef4444':'#10b981'}">${atRiskPct}%</div><div class="boutique-kpi-label">À risque</div></div>
    `;

    const tagFreq = new Map();
    DATA.forEach(r => r.tags.forEach(t => tagFreq.set(t.t, (tagFreq.get(t.t)||0)+1)));
    const top5 = Array.from(tagFreq.entries()).sort((a,b) => b[1]-a[1]).slice(0,5);
    const maxCount = top5.length > 0 ? top5[0][1] : 1;

    const topList = $('boutiqueTopList');
    if (topList) topList.innerHTML = top5.map(([tag,count],i) => `
        <div class="top5-item"><div class="top5-rank r${i+1}">${i+1}</div><div class="top5-info"><div class="top5-name">${tag}</div><div class="top5-bar"><div class="top5-bar-fill" style="width:${(count/maxCount*100).toFixed(0)}%"></div></div></div><div class="top5-count">${count}</div></div>
    `).join('');

    const actionsList = $('boutiqueActionsList');
    if (actionsList) {
        const actions = [];
        if (top5.length > 0) actions.push({ icon:'📦', text:`Réapprovisionner "${top5[0][0]}"`, priority:'high' });
        const negClients = SENTIMENT_DATA.filter(s => s.level === 'negative');
        if (negClients.length > 0) actions.push({ icon:'📞', text:`Contacter ${negClients.length} client${negClients.length>1?'s':''} insatisfait${negClients.length>1?'s':''}`, priority:'high' });
        const occasionTags = DATA.filter(r => r.tags.some(t => t.c==='contexte'));
        if (occasionTags.length > 0) actions.push({ icon:'🎁', text:`${occasionTags.length} opportunités gifting`, priority:'medium' });
        const vipCount = DATA.filter(r => r.tags.some(t => t.t==='Key_Account')).length;
        if (vipCount > 0) actions.push({ icon:'⭐', text:`${vipCount} Key Accounts — planifier private viewing`, priority:'medium' });
        actions.push({ icon:'📊', text:'Diffuser le rapport hebdomadaire', priority:'low' });
        actionsList.innerHTML = actions.map(a => `<div class="action-item"><div class="action-icon">${a.icon}</div><div><div class="action-text">${a.text}</div><span class="action-priority ${a.priority}">${a.priority==='high'?'Urgent':a.priority==='medium'?'Cette semaine':'Planifié'}</span></div></div>`).join('');
    }

    const caPerf = $('boutiqueCAPerfList');
    if (caPerf) {
        const caMap = new Map();
        DATA.forEach(r => {
            if (!caMap.has(r.ca)) caMap.set(r.ca, { notes:0, tags:0, sentiment:0 });
            const entry = caMap.get(r.ca);
            entry.notes++;
            entry.tags += r.tags.length;
            entry.sentiment += r.sentiment ? (r.sentiment.score||50) : 50;
        });
        caPerf.innerHTML = Array.from(caMap.entries()).map(([ca, data]) => {
            const avgSent = Math.round(data.sentiment/data.notes);
            const color = avgSent>=70?'#10b981':avgSent>=40?'#fb923c':'#ef4444';
            return `<div class="ca-perf-item"><span class="ca-perf-name">${ca}</span><div class="ca-perf-bar"><div class="ca-perf-bar-fill" style="width:${avgSent}%;background:${color}"></div></div><div class="ca-perf-stats"><span>${data.notes} notes</span><span>${data.tags} tags</span><span style="color:${color}">${avgSent}%</span></div></div>`;
        }).join('');
    }

    const stockList = $('boutiqueStockList');
    if (stockList) {
        const stockRecs = [];
        top5.forEach(([tag, count]) => {
            if (count > 2) {
                stockRecs.push({ icon:'📦', text:`${tag}: ${count} demandes — vérifier stocks produits associés`, urgency: count>3?'high':'medium' });
            }
        });
        if (stockRecs.length === 0) stockRecs.push({ icon:'✅', text:'Pas de recommandation urgente', urgency:'medium' });
        stockList.innerHTML = stockRecs.map(s => `<div class="stock-item"><div class="stock-icon">${s.icon}</div><div class="stock-text">${s.text}</div><span class="stock-urgency ${s.urgency}">${s.urgency==='high'?'Urgent':'À suivre'}</span></div>`).join('');
    }
}

// ===== EXPORTS =====
function exportCSV() {
    const lines = ['ID,Date,Langue,CA,Transcription_AI_Clean,Tags,NBA_Actions'];
    DATA.forEach(r => {
        lines.push([
            r.id, r.date, r.lang, r.ca,
            '"' + (r.clean||'').replace(/"/g,'""') + '"',
            '"' + r.tags.map(t=>t.t).join('|') + '"',
            '"' + (r.nba||[]).map(a=>a.action).join(' | ') + '"'
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
        tagDistribution: (() => { const m = {}; DATA.forEach(r => r.tags.forEach(t => { m[t.t]=(m[t.t]||0)+1; })); return m; })()
    };
    dl(JSON.stringify(report, null, 2), 'lvmh_full_report.json', 'application/json');
}
function dl(content, name, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
}
