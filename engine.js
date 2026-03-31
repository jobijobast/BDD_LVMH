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
const CAT_NAMES = { profil:'Profil', interet:'Intérêt', voyage:'Voyage', contexte:'Contexte', service:'Service', marque:'Marque', crm:'CRM' };
const legendColors = { profil:'#60a5fa', interet:'#d4af37', voyage:'#34d399', contexte:'#c084fc', service:'#f472b6', marque:'#fb923c', crm:'#facc15' };

// ===== DASHBOARD HELPERS =====
function groupByDate(arr, valueFn) {
    const map = {};
    (arr || []).forEach(function(row) {
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

// ===== RENDER: DASHBOARD (Manager - COCKPIT) =====
function renderDashboard() {
    // Calculs réels
    var totalClients = DATA.length;
    var totalTags = DATA.reduce(function(s,r){ return s+(r.tags||[]).length; },0);
    var totalNBA = DATA.reduce(function(s,r){ return s+(r.nba||[]).length; },0);
    var privacyAvg = Math.round(STATS.privacyAvg || 0);

    // TOP BAR
    var setEl = function(id, val) { var el = document.getElementById(id); if(el) el.textContent = val; };
    setEl('ck-tb-clients', totalClients.toLocaleString('fr-FR'));
    setEl('ck-tb-tags', totalTags.toLocaleString('fr-FR'));
    setEl('ck-tb-privacy', privacyAvg);
    setEl('ck-tb-nba', totalNBA.toLocaleString('fr-FR'));
    setEl('ck-tb-date', new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'}));

    // HERO
    setEl('ck-hero-num', totalClients.toLocaleString('fr-FR'));
    setEl('ck-hs-privacy', privacyAvg + '%');
    setEl('ck-hs-tags', totalTags > 999 ? (totalTags/1000).toFixed(1)+'k' : totalTags);
    setEl('ck-hs-nba', totalNBA);

    // KPI CARDS
    setEl('ck-kval-1', totalClients.toLocaleString('fr-FR'));
    setEl('ck-kval-2', totalTags > 999 ? (totalTags/1000).toFixed(1)+'k' : totalTags);
    setEl('ck-kval-3', totalNBA);
    setEl('ck-kval-4', privacyAvg + '%');

    // Privacy bar
    var bar = document.getElementById('ck-privacy-bar');
    if(bar) {
        bar.style.width = privacyAvg + '%';
        bar.style.background = privacyAvg >= 90 ? '#059669' : privacyAvg >= 75 ? '#2563EB' : privacyAvg >= 60 ? '#D97706' : '#DC2626';
    }

    // Sparklines
    renderSparkline('spark1', lastNDays(groupByDate(DATA), 10), '#B8965A');
    renderSparkline('spark3', lastNDays(groupByDate(DATA, function(r){ return (r.tags||[]).length; }), 10), '#B8965A');
    renderSparkline('spark4', lastNDays(groupByDate(DATA, function(r){ return (r.nba||[]).length; }), 10), '#B8965A');

    // Charts
    renderCockpitMain();
    renderPrivacyDonut();
    renderRadar();
    renderCalendar();
    renderCockpitTags();

    // Date
    var calMonth = document.getElementById('ck-cal-month');
    if(calMonth) calMonth.textContent = new Date().toLocaleDateString('fr-FR', {month:'long', year:'numeric'});
}

// --- COCKPIT WIDGETS ---

function renderSparkline(id, data, color) {
    var el = document.getElementById(id);
    if (!el) return;
    var W = 200, H = 40;
    var max = Math.max.apply(null, data), min = Math.min.apply(null, data);
    var range = max - min || 1;
    var PAD = 4;

    function px(i) { return PAD + (i / (data.length - 1)) * (W - PAD*2); }
    function py(v) { return H - PAD - ((v - min) / range) * (H - PAD*2); }

    var path = data.map(function(v, i) {
        if (i === 0) return 'M ' + px(i) + ' ' + py(v);
        var cx = (px(i-1) + px(i)) / 2;
        return 'C ' + cx + ' ' + py(data[i-1]) + ' ' + cx + ' ' + py(v) + ' ' + px(i) + ' ' + py(v);
    }).join(' ');

    var lastX = px(data.length - 1), lastY = py(data[data.length-1]);
    var area = path + ' L ' + (W - PAD) + ' ' + H + ' L ' + PAD + ' ' + H + ' Z';
    var gid = 'spk_' + id + '_g';

    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:100%;display:block">'
        + '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1">'
        + '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.35"/>'
        + '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>'
        + '</linearGradient></defs>'
        + '<path d="' + area + '" fill="url(#' + gid + ')" stroke="none"/>'
        + '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<circle cx="' + lastX + '" cy="' + lastY + '" r="3" fill="' + color + '" stroke="#0A0A0C" stroke-width="1.5"/>'
        + '</svg>';
}

function renderCockpitMain() {
    var el = document.getElementById('cockpitMainChart');
    if (!el) return;

    var dayMapNotes = groupByDate(DATA);
    var dayMapTags = groupByDate(DATA, function(r){ return (r.tags||[]).length; });
    var allDays = Array.from(new Set(Object.keys(dayMapNotes).concat(Object.keys(dayMapTags)))).sort().slice(-14);
    var dataA = allDays.length ? allDays.map(function(d){ return dayMapNotes[d]||0; }) : [0,0,0,0,0,0,0];
    var dataB = allDays.length ? allDays.map(function(d){ return dayMapTags[d]||0; }) : [0,0,0,0,0,0,0];
    var labels = allDays.length ? allDays.map(function(d){
        var dt = new Date(d);
        return dt.getDate() + '/' + (dt.getMonth()+1);
    }) : ['1','2','3','4','5','6','7'];

    var W = 600, H = 180, PL = 32, PR = 16, PT = 16, PB = 28;
    var W2 = W - PL - PR, H2 = H - PT - PB;
    var allVals = dataA.concat(dataB);
    var maxVal = Math.max.apply(null, allVals) || 1;

    function cx(i, len) { return PL + (i / (len-1)) * W2; }
    function cy(v) { return PT + H2 - (v / maxVal) * H2; }

    function smoothPath(data) {
        return data.map(function(v, i) {
            if (i === 0) return 'M ' + cx(i, data.length) + ' ' + cy(v);
            var cpx = (cx(i-1, data.length) + cx(i, data.length)) / 2;
            return 'C ' + cpx + ' ' + cy(data[i-1]) + ' ' + cpx + ' ' + cy(v) + ' ' + cx(i, data.length) + ' ' + cy(v);
        }).join(' ');
    }

    function areaPath(data) {
        var last = data.length - 1;
        return smoothPath(data) + ' L ' + cx(last, data.length) + ' ' + (PT+H2) + ' L ' + PL + ' ' + (PT+H2) + ' Z';
    }

    // Grid
    var grids = '';
    for (var gi = 0; gi <= 4; gi++) {
        var gy = PT + (gi / 4) * H2;
        var gVal = Math.round(maxVal - (gi/4) * maxVal);
        grids += '<line x1="' + PL + '" y1="' + gy + '" x2="' + (W-PR) + '" y2="' + gy + '" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>';
        grids += '<text x="' + (PL-4) + '" y="' + (gy+4) + '" fill="rgba(255,255,255,0.25)" font-size="8" text-anchor="end" font-family="DM Sans,sans-serif">' + gVal + '</text>';
    }

    // X Labels
    var step = Math.ceil(labels.length / 7);
    var xlabels = labels.map(function(l, i) {
        if (i % step !== 0 && i !== labels.length - 1) return '';
        return '<text x="' + cx(i, labels.length) + '" y="' + (H-4) + '" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="middle" font-family="DM Sans,sans-serif">' + l + '</text>';
    }).join('');

    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:100%;display:block">'
        + '<defs>'
        + '<linearGradient id="gradMain_A" x1="0" x2="0" y1="0" y2="1">'
        + '<stop offset="0%" stop-color="#B8965A" stop-opacity="0.4"/>'
        + '<stop offset="100%" stop-color="#B8965A" stop-opacity="0"/>'
        + '</linearGradient>'
        + '<linearGradient id="gradMain_B" x1="0" x2="0" y1="0" y2="1">'
        + '<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2"/>'
        + '<stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>'
        + '</linearGradient>'
        + '</defs>'
        + grids
        + '<path d="' + areaPath(dataA) + '" fill="url(#gradMain_A)"/>'
        + '<path d="' + smoothPath(dataA) + '" fill="none" stroke="#B8965A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="' + areaPath(dataB) + '" fill="url(#gradMain_B)"/>'
        + '<path d="' + smoothPath(dataB) + '" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5,3"/>'
        + xlabels
        + '</svg>';
}

function renderCalendar() {
    var el = document.getElementById('cockpitCalendar');
    if (!el) return;
    var now = new Date();
    var year = now.getFullYear(), month = now.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month+1, 0).getDate();
    var today = now.getDate();

    // Event dates from DATA
    var eventDays = {};
    DATA.forEach(function(row){
        if(!row.date) return;
        var d = new Date(row.date);
        if(d.getFullYear()===year && d.getMonth()===month) eventDays[d.getDate()] = true;
    });

    var dayNames = ['L','M','M','J','V','S','D'];
    var html = dayNames.map(function(d){ return '<div class="ck-cal-head">'+d+'</div>'; }).join('');

    // Offset (lundi=0)
    var offset = firstDay === 0 ? 6 : firstDay - 1;
    for(var o = 0; o < offset; o++) html += '<div class="ck-cal-day empty"></div>';

    for(var day = 1; day <= daysInMonth; day++) {
        var cls = 'ck-cal-day';
        if(day === today) cls += ' today';
        if(eventDays[day]) cls += ' has-event';
        html += '<div class="'+cls+'">'+day+'</div>';
    }

    el.innerHTML = html;
}

function renderRadar() {
    var el = document.getElementById('cockpitRadar');
    if (!el) return;
    var axes = 5, r = 36, cx2 = 50, cy2 = 50;
    var cats = ['profil','interet','voyage','contexte','service'];
    var catLabels = ['Profil','Intérêts','Voyage','Contexte','Service'];
    var totalTags = DATA.reduce(function(s,row){ return s+(row.tags||[]).length; },0);
    var data = cats.map(function(cat){
        if(!totalTags) return 0.15;
        var count = DATA.reduce(function(s,row){ return s+(row.tags||[]).filter(function(t){ return t.c===cat; }).length; },0);
        return Math.min(count/totalTags*cats.length, 1);
    });

    function pt(val, i) {
        var angle = (Math.PI*2*i/axes) - Math.PI/2;
        return [cx2 + val*r*Math.cos(angle), cy2 + val*r*Math.sin(angle)];
    }
    function ptStr(val, i) { var p = pt(val,i); return p[0]+','+p[1]; }

    var webs = '';
    [0.25,0.5,0.75,1].forEach(function(sc){
        webs += '<polygon points="'+Array.from({length:axes}).map(function(_,i){ return ptStr(sc,i); }).join(' ')+'" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>';
    });
    var axLines = Array.from({length:axes}).map(function(_,i){
        var p = pt(1,i); return '<line x1="'+cx2+'" y1="'+cy2+'" x2="'+p[0]+'" y2="'+p[1]+'" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>';
    }).join('');

    var polygon = '<polygon points="'+data.map(function(v,i){ return ptStr(v,i); }).join(' ')+'" fill="rgba(184,150,90,0.2)" stroke="#B8965A" stroke-width="1.5"/>';

    var lbls = catLabels.map(function(l,i){
        var p = pt(1.35, i);
        return '<text x="'+p[0]+'" y="'+(p[1]+3)+'" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="6" font-family="DM Sans,sans-serif">'+l+'</text>';
    }).join('');

    el.innerHTML = '<svg viewBox="0 0 100 100" class="ck-radar-svg">'
        + webs + axLines + polygon + lbls + '</svg>';
}

function renderPrivacyDonut() {
    var el = document.getElementById('cockpitPrivacyDonut');
    if (!el) return;
    var val = Math.round(STATS.privacyAvg || 0);
    var col = val >= 90 ? '#059669' : val >= 75 ? '#2563EB' : val >= 60 ? '#D97706' : '#DC2626';
    var label = val >= 90 ? 'Excellent' : val >= 75 ? 'Bon' : val >= 60 ? 'Moyen' : 'Critique';
    var r = 42, circ = 2 * Math.PI * r;
    var offset = circ - (val / 100) * circ;

    el.innerHTML = '<div class="ck-donut-inner">'
        + '<svg viewBox="0 0 100 100" class="ck-donut-svg">'
        + '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/>'
        + '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="10"'
        + ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"'
        + ' transform="rotate(-90 50 50)" stroke-linecap="round"/>'
        + '</svg>'
        + '<div class="ck-donut-center">'
        + '<div class="ck-donut-val">' + val + '</div>'
        + '<div class="ck-donut-pct">/ 100</div>'
        + '</div>'
        + '</div>'
        + '<div class="ck-donut-label" style="color:' + col + '">' + label + '</div>'
        + '<div class="ck-donut-sub">Score RGPD moyen</div>';
}

function renderTagsCockpit() {
    renderCockpitTags();
}

function renderCockpitTags() {
    var el = document.getElementById('cockpitTags');
    if (!el) return;
    var cats = ['profil','interet','voyage','contexte','service','marque','crm'];
    var catNames = {'profil':'Profil','interet':'Intérêts','voyage':'Voyage','contexte':'Contexte','service':'Service','marque':'Marque','crm':'CRM'};
    var catColors = {'profil':'#60a5fa','interet':'#B8965A','voyage':'#34d399','contexte':'#c084fc','service':'#f472b6','marque':'#fb923c','crm':'#facc15'};

    var totals = {};
    var grand = 0;
    DATA.forEach(function(row){
        (row.tags||[]).forEach(function(t){
            totals[t.c] = (totals[t.c]||0) + 1;
            grand++;
        });
    });

    if(!grand) { el.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:16px 0">Aucune donnée</div>'; return; }

    var sorted = cats.filter(function(c){ return totals[c]; }).sort(function(a,b){ return (totals[b]||0)-(totals[a]||0); });
    var maxV = totals[sorted[0]] || 1;

    el.innerHTML = sorted.map(function(cat){
        var count = totals[cat] || 0;
        var pct = Math.round(count/grand*100);
        var w = Math.round(count/maxV*100);
        var col = catColors[cat] || '#B8965A';
        return '<div class="ck-tag-bar-row">'
            + '<div class="ck-tag-bar-label">'+catNames[cat]+'</div>'
            + '<div class="ck-tag-bar-track"><div class="ck-tag-bar-fill" style="width:'+w+'%;background:'+col+'"></div></div>'
            + '<div class="ck-tag-bar-val">'+pct+'%</div>'
            + '</div>';
    }).join('');
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
    
    // Calculate trend — compare première moitié vs score actuel (sans Math.random)
    let previousAvg = STATS.privacyAvg;
    const scores = Object.values(PRIVACY_SCORES || {});
    if (scores.length >= 2) {
        const half = Math.floor(scores.length / 2);
        const firstHalf = scores.slice(0, half);
        const firstHalfSum = firstHalf.reduce(function(s, v) { return s + (v.score || v || 0); }, 0);
        previousAvg = firstHalf.length > 0 ? firstHalfSum / firstHalf.length : STATS.privacyAvg;
    }
    const trend = previousAvg ? Math.round(STATS.privacyAvg - previousAvg) : 0;
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
    const giftingClients  = DATA.filter(d => d.tags.some(t => t.c === 'contexte')).length;
    const keyAccounts     = tagFreq.get('Key_Account') || 0;
    const travelClients   = DATA.filter(d => d.tags.some(t => t.c === 'voyage')).length;

    const segments = DATA.map(d => {
        const u = calculateUpliftScore(d);
        const sl = (d.sentiment && d.sentiment.level) || 'neutral';
        return getUpliftSegment(u, sl).segment;
    });
    const persuadables = segments.filter(s => s === 'persuadables').length;
    const dormants     = segments.filter(s => s === 'chiens-dormants').length;
    const atRisk       = segments.filter(s => s === 'cas-perdus').length;

    const roiMatrix = buildROIMatrix({ giftingClients, keyAccounts, travelClients, persuadables, dormants, atRisk });
    const totalROI  = roiMatrix.reduce((s, r) => s + r.roi, 0);

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
                    high:   { label: 'HIGH',   bg: '#fb923c', color: '#fff' },
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
                const gap  = circumference - dash;
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

// ===== RENDER: FOLLOW-UP =====
// State du mode follow-up : 'classic' | 'ai'
let sfMode = 'classic';

function renderFollowup() {
    const grid = $('followupGrid');
    const house = $('followupHouse') ? $('followupHouse').value : 'Louis Vuitton';
    const channel = $('followupChannel') ? $('followupChannel').value : 'email';
    if (!grid) return;

    // Injecter la barre de toggle si elle n'existe pas encore
    const pageContent = grid.closest('.page-content');
    if (pageContent && !pageContent.querySelector('.sf-toggle-bar')) {
        const toggleBar = document.createElement('div');
        toggleBar.className = 'sf-toggle-bar';
        toggleBar.innerHTML = `
            <button class="sf-toggle-btn ${sfMode === 'classic' ? 'active' : ''}" data-mode="classic">Mode classique</button>
            <button class="sf-toggle-btn ${sfMode === 'ai' ? 'active' : ''}" data-mode="ai">Mode IA</button>
        `;
        toggleBar.addEventListener('click', e => {
            const btn = e.target.closest('.sf-toggle-btn');
            if (!btn) return;
            sfMode = btn.dataset.mode;
            toggleBar.querySelectorAll('.sf-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === sfMode));
            renderFollowup();
        });
        const controls = pageContent.querySelector('.followup-controls');
        if (controls) {
            controls.insertAdjacentElement('afterend', toggleBar);
        } else {
            pageContent.insertBefore(toggleBar, grid);
        }
    } else if (pageContent) {
        // Mettre à jour l'état actif du toggle existant
        pageContent.querySelectorAll('.sf-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === sfMode));
    }

    grid.innerHTML = '';

    const withTags = DATA.filter(p => p.tags.length > 0);
    if (withTags.length === 0) {
        grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucun client avec tags pour générer un follow-up.</p>';
        return;
    }

    if (sfMode === 'classic') {
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
    } else {
        withTags.forEach(p => {
            const card = document.createElement('div');
            card.className = 'followup-card sf-ai-card';
            card.dataset.clientId = p.id;
            const tagsSummary = p.tags.slice(0, 4).map(t => `<span class="sf-tag-chip">${t.t.replace(/_/g,' ')}</span>`).join('');
            card.innerHTML = `
                <div class="followup-card-header">
                    <span class="followup-client-id">${p.ca || p.id}</span>
                    <span class="followup-channel ${channel}">${channel==='email'?'📧 Email':'💬 WhatsApp'}</span>
                </div>
                <div class="sf-tags-row">${tagsSummary}</div>
                <div class="sf-generate-zone">
                    <button class="sf-btn-generate" data-id="${p.id}">Générer avec IA</button>
                </div>
            `;
            card.querySelector('.sf-btn-generate').addEventListener('click', () => {
                triggerSmartFollowup(card, p, channel, house);
            });
            grid.appendChild(card);
        });
    }
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

    zone.querySelector('.sf-btn-copy').addEventListener('click', function() {
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
        churn: calculateChurnRisk(s.score, s.level, DATA.filter(d => d.ca === s.ca && s.ca).length || 1)
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
    const profilTags   = tags.filter(t => t.c === 'profil');
    const interetTags  = tags.filter(t => t.c === 'interet');
    const contexteTags = tags.filter(t => t.c === 'contexte');
    const voyageTags   = tags.filter(t => t.c === 'voyage');
    const marqueTags   = tags.filter(t => t.c === 'marque');
    const serviceTags  = tags.filter(t => t.c === 'service');

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
    if (voyageTags.length)   contextGroups.push({ label: 'Voyage',   tags: voyageTags });
    if (marqueTags.length)   contextGroups.push({ label: 'Marques',  tags: marqueTags });

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
                ${p.reasons && p.reasons.length ? `<div class="brief-product-reasons">${p.reasons.slice(0,2).map(r => `<span class="brief-reason">${r}</span>`).join('')}</div>` : ''}
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

// ===== COACH RGPD =====
function renderCoach() {
    const btn = document.getElementById('coachAnalyze');
    const input = document.getElementById('coachInput');
    const results = document.getElementById('coachResults');
    const micBtn = document.getElementById('coachMic');

    // Micro — Web Speech API
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
            };
            rec.onerror = () => micBtn.classList.remove('recording');
            rec.onend = () => micBtn.classList.remove('recording');
        };
    }

    if (!btn) return;
    btn.onclick = async () => {
        const text = (input ? input.value : '').trim();
        if (!text) { showToast('Entrez une note à analyser', 'error'); return; }

        results.innerHTML = '<div class="coach-spinner-wrap"><div class="coach-spinner"></div><span>Analyse en cours...</span></div>';

        try {
            const res = await fetch(`${API_BASE}/api/coach-rgpd`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language: 'FR' })
            });
            if (!res.ok) throw new Error('Erreur serveur');
            const data = await res.json();
            renderCoachResults(results, text, data);
        } catch (e) {
            results.innerHTML = `<div class="coach-error">Erreur lors de l'analyse. Vérifiez que le serveur est lancé.</div>`;
        }
    };
}

function renderCoachResults(container, originalText, data) {
    const rgpd_score = data.rgpd_score || 0;
    const quality_score = data.quality_score || 0;
    const violations = data.violations || [];
    const extractable_tags_count = data.extractable_tags_count || 0;
    const tags = data.tags || [];
    const feedback = data.feedback || '';
    const suggestions = data.suggestions || [];

    // Couleur barre RGPD
    const rgpdColor = rgpd_score >= 80 ? '#22c55e' : rgpd_score >= 50 ? '#f59e0b' : '#ef4444';

    // Texte surligné : wrap les violations dans des spans rouges
    let highlighted = originalText;
    const sortedV = [...violations].sort((a, b) => ((b.word || b.text || b.value || '').length) - ((a.word || a.text || a.value || '').length));
    sortedV.forEach(v => {
        const word = v.word || v.text || v.value || v.found || '';
        if (!word) return;
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        highlighted = highlighted.replace(new RegExp(escaped, 'gi'), match =>
            `<span class="coach-violation-hl" title="${v.cat || v.category || v.type || 'Donnée sensible'}">${match}</span>`
        );
    });

    // Pills tags
    const tagPills = tags.map(tg =>
        `<span class="coach-tag-pill tag-${(tg.c || '').toLowerCase()}">${tg.t || tg}</span>`
    ).join('');

    // Suggestions Mistral
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
        <div class="coach-scores">
            <div class="coach-score-item">
                <div class="coach-score-label">Conformité RGPD</div>
                <div class="coach-score-bar-wrap">
                    <div class="coach-score-bar" style="width:${rgpd_score}%;background:${rgpdColor}"></div>
                </div>
                <div class="coach-score-value" style="color:${rgpdColor}">${rgpd_score}%</div>
            </div>
            <div class="coach-score-item">
                <div class="coach-score-label">Richesse de la note</div>
                <div class="coach-score-bar-wrap">
                    <div class="coach-score-bar" style="width:${quality_score}%;background:#3b82f6"></div>
                </div>
                <div class="coach-score-value" style="color:#3b82f6">${quality_score}%</div>
            </div>
        </div>

        <div class="coach-section">
            <h3 class="coach-section-title">Votre note analysée</h3>
            <div class="coach-highlighted-text">${highlighted}</div>
            ${violations.length ? `<p class="coach-violation-count">${violations.length} violation(s) RGPD détectée(s)</p>` : '<p class="coach-ok">Aucune violation RGPD détectée</p>'}
        </div>

        ${suggestionsHTML}

        ${feedback ? `
        <div class="coach-section">
            <h3 class="coach-section-title">Feedback</h3>
            <p class="coach-feedback">${feedback}</p>
        </div>` : ''}

        ${tags.length ? `
        <div class="coach-section">
            <h3 class="coach-section-title">Tags extractibles (${extractable_tags_count})</h3>
            <div class="coach-tags-wrap">${tagPills}</div>
        </div>` : ''}

        <button class="coach-retry-btn" onclick="document.getElementById('coachInput').value='';document.getElementById('coachResults').innerHTML='';document.getElementById('coachInput').focus()">
            Réessayer
        </button>
    `;
}
