/**
 * LVMH Voice-to-Tag — Rendering Engine
 * All rendering functions for vendeur & manager views.
 * State (DATA, STATS, etc.) is managed by app.js.
 */

// ===== PRODUCT CATALOG (LVMH simulated) =====
const PRODUCT_CATALOG = {
    'Golf': [
        { name: 'LV Damier Golf Bag', desc: 'Sac de golf en toile Damier enduite, finitions cuir', price: '4 200\u20AC', img: '\u26F3' },
        { name: 'Berluti Golf Glove', desc: 'Gant de golf en cuir patin\u00E9 Venezia', price: '580\u20AC', img: '\uD83E\uDDE4' },
        { name: 'Loro Piana Cashmere Polo', desc: 'Polo en baby cashmere, coupe sport-chic', price: '1 150\u20AC', img: '\uD83D\uDC55' }
    ],
    'Ski': [
        { name: 'LV Ski Capsule Jacket', desc: 'Doudoune monogram r\u00E9versible', price: '3 800\u20AC', img: '\uD83C\uDFBF' },
        { name: 'Fendi Ski Goggles', desc: 'Masque FF logo, verres anti-bu\u00E9e', price: '690\u20AC', img: '\uD83E\uDD7D' },
        { name: 'Rimowa Original Cabin', desc: 'Valise aluminium pour week-end ski', price: '1 340\u20AC', img: '\uD83E\uDDF3' }
    ],
    'Tennis': [
        { name: 'LV Tennis Sneakers', desc: 'Baskets Charlie en cuir, semelle technique', price: '1 080\u20AC', img: '\uD83C\uDFBE' },
        { name: 'Celine Sport Band', desc: 'Bandeau \u00E9ponge Triomphe en coton bio', price: '320\u20AC', img: '\uD83C\uDFC5' },
        { name: 'Berluti Leather Racket Cover', desc: 'Housse raquette en cuir Venezia patin\u00E9', price: '1 450\u20AC', img: '\uD83C\uDF92' }
    ],
    'Yoga': [
        { name: 'Loewe Yoga Mat Case', desc: 'Housse tapis yoga en cuir Anagram', price: '890\u20AC', img: '\uD83E\uDDD8' },
        { name: 'Loro Piana Stretch Cashmere Set', desc: 'Ensemble yoga en cashmere stretch', price: '2 400\u20AC', img: '\uD83D\uDC57' },
        { name: 'Dior Wellness Candle', desc: 'Bougie parfum\u00E9e relaxation Maison Dior', price: '180\u20AC', img: '\uD83D\uDD6F\uFE0F' }
    ],
    'Running': [
        { name: 'LV Run Away Sneakers', desc: 'Sneakers running en mesh et cuir technique', price: '980\u20AC', img: '\uD83C\uDFC3' },
        { name: 'Givenchy Sport Hoodie', desc: 'Sweat \u00E0 capuche en jersey technique', price: '1 190\u20AC', img: '\uD83E\uDDE5' },
        { name: 'TAG Heuer Connected', desc: 'Montre connect\u00E9e, GPS et cardio int\u00E9gr\u00E9s', price: '2 150\u20AC', img: '\u231A' }
    ],
    'Montres': [
        { name: 'TAG Heuer Carrera', desc: 'Chronographe automatique, bo\u00EEtier 42mm', price: '5 950\u20AC', img: '\u231A' },
        { name: 'Hublot Big Bang', desc: 'Mouvement UNICO, bo\u00EEtier c\u00E9ramique noire', price: '18 500\u20AC', img: '\u231A' },
        { name: 'Bulgari Octo Finissimo', desc: 'Ultra-plat automatique', price: '12 800\u20AC', img: '\u231A' }
    ],
    'Bijoux': [
        { name: 'Tiffany T Wire Bracelet', desc: 'Bracelet en or rose 18k', price: '1 850\u20AC', img: '\uD83D\uDC8E' },
        { name: 'Bulgari Serpenti Necklace', desc: 'Collier Serpenti Viper en or blanc et diamants', price: '8 900\u20AC', img: '\uD83D\uDC8E' },
        { name: 'Chaumet Jos\u00E9phine Tiara Ring', desc: 'Bague tiare en or blanc et diamants', price: '5 200\u20AC', img: '\uD83D\uDC8D' }
    ],
    'Parfums': [
        { name: 'Dior Sauvage Elixir', desc: 'Parfum concentr\u00E9, notes bois\u00E9es intenses', price: '165\u20AC', img: '\uD83E\uDDF4' },
        { name: "Givenchy L'Interdit", desc: 'Eau de parfum, tub\u00E9reuse et v\u00E9tiver noir', price: '145\u20AC', img: '\uD83E\uDDF4' },
        { name: 'MFK Baccarat Rouge', desc: 'Extrait de parfum, ambre et jasmin', price: '325\u20AC', img: '\uD83E\uDDF4' }
    ],
    'Anniversaire': [
        { name: 'LV Petite Malle', desc: 'Sac iconique en cuir Epi', price: '5 500\u20AC', img: '\uD83C\uDF81' },
        { name: 'Tiffany Heart Tag Pendant', desc: 'Pendentif c\u0153ur en argent 925', price: '280\u20AC', img: '\uD83D\uDC9D' },
        { name: 'Dom P\u00E9rignon Vintage', desc: 'Champagne mill\u00E9sim\u00E9', price: '250\u20AC', img: '\uD83C\uDF7E' }
    ],
    'Mariage': [
        { name: 'Tiffany Setting Engagement', desc: 'Solitaire diamant 1ct, platine', price: '14 500\u20AC', img: '\uD83D\uDC8D' },
        { name: 'Bulgari Wedding Band', desc: 'Alliance B.zero1 en or rose', price: '1 290\u20AC', img: '\uD83D\uDC8D' },
        { name: 'LV Trunk Gift Box', desc: 'Malle cadeau personnalis\u00E9e', price: '3 200\u20AC', img: '\uD83C\uDF81' }
    ],
    'Cadeau': [
        { name: 'Dior Prestige Coffret', desc: 'Coffret soins prestige', price: '420\u20AC', img: '\uD83C\uDF81' },
        { name: 'LV Pocket Organizer', desc: 'Organiseur Monogram Eclipse', price: '420\u20AC', img: '\uD83D\uDC5B' },
        { name: 'Rimowa Personal Case', desc: 'Trousse en aluminium', price: '680\u20AC', img: '\uD83E\uDDF3' }
    ],
    'Vegan': [
        { name: 'Stella McCartney x LV Capsule', desc: 'Sac en mat\u00E9riaux recycl\u00E9s', price: '1 295\u20AC', img: '\uD83C\uDF31' },
        { name: 'Loewe Cactus Leather Bag', desc: 'Sac en cuir de cactus', price: '2 100\u20AC', img: '\uD83C\uDF35' },
        { name: 'Sephora Clean Beauty Set', desc: 'Coffret cosm\u00E9tiques vegan', price: '89\u20AC', img: '\uD83E\uDDF4' }
    ],
    'Durabilit\u00E9': [
        { name: 'LV Felt Line Collection', desc: 'Sac en feutre recycl\u00E9', price: '2 200\u20AC', img: '\uD83C\uDF0D' },
        { name: 'Loro Piana Gift of Kings', desc: '\u00C9charpe laine m\u00E9rinos tra\u00E7able', price: '890\u20AC', img: '\uD83E\uDDE3' },
        { name: 'Berluti Upcycled Wallet', desc: 'Portefeuille cuirs revaloris\u00E9s', price: '580\u20AC', img: '\uD83D\uDC5B' }
    ],
    'Classique': [
        { name: 'LV Capucines MM', desc: 'Sac en cuir Taurillon', price: '5 900\u20AC', img: '\uD83D\uDC5C' },
        { name: 'Dior Lady Dior Medium', desc: 'Sac iconique cannage en agneau noir', price: '5 500\u20AC', img: '\uD83D\uDC5C' },
        { name: 'Celine Triomphe Canvas Bag', desc: 'Sac en toile Triomphe', price: '2 100\u20AC', img: '\uD83D\uDC5C' }
    ],
    'Minimaliste': [
        { name: 'Celine Trio Bag', desc: 'Pochette triple en agneau lisse', price: '1 050\u20AC', img: '\uD83D\uDC5D' },
        { name: 'Loewe Puzzle Small', desc: 'Sac Puzzle g\u00E9om\u00E9trique', price: '2 650\u20AC', img: '\uD83D\uDC5C' },
        { name: 'Berluti Scritto Card Holder', desc: 'Porte-cartes cuir Venezia', price: '380\u20AC', img: '\uD83D\uDCB3' }
    ],
    'VIP': [
        { name: 'LV Malle Personnalisation', desc: 'Service sur-mesure', price: 'Sur devis', img: '\u2728' },
        { name: 'Tiffany High Jewelry Viewing', desc: 'Invitation haute joaillerie priv\u00E9', price: 'Sur invitation', img: '\uD83D\uDC8E' },
        { name: 'Dior Atelier Experience', desc: 'Visite priv\u00E9e atelier couture', price: 'Exclusif', img: '\uD83C\uDFDB\uFE0F' }
    ]
};

// ===== LVMH HOUSES =====
const LVMH_HOUSES = ['Louis Vuitton','Dior','Fendi','Givenchy','Celine','Loewe','Berluti','Loro Piana','Tiffany & Co.','Bulgari','TAG Heuer','Hublot','Mo\u00EBt Hennessy','Sephora','Rimowa'];

// ===== HELPERS =====
const CAT_NAMES = { profession:'Profession', product:'Produit', pref:'Pr\u00E9f\u00E9rence', style:'Style', lifestyle:'Lifestyle', occasion:'Occasion', budget:'Budget', service:'Service', network:'R\u00E9seau' };
const legendColors = { profession:'#60a5fa', product:'#d4af37', pref:'#34d399', style:'#c084fc', lifestyle:'#f472b6', occasion:'#fb923c', budget:'#facc15', service:'#a5b4fc', network:'#2dd4bf' };

// ===== RENDER: DASHBOARD (Manager) =====
function renderDashboard() {
    $('statClients').textContent = STATS.clients;
    $('statTags').textContent = STATS.tags;
    $('statAI').textContent = STATS.ai;
    $('statRGPD').textContent = STATS.rgpd;
    $('statNBA').textContent = STATS.nba;
    $('statPrivacy').textContent = STATS.privacyAvg + '%';

    if (DATA.length > 0) {
        $('beforeText').textContent = DATA[0].orig.substring(0, 400) || '(aucune donnee brute)';
        $('afterText').textContent = DATA[0].clean.substring(0, 400) || '(aucune donnee nettoyee)';
    }

    const bl = $('rgpdBadList');
    const rs = $('rgpdSection');
    if (RGPD_BAD.length === 0) { if (rs) rs.style.display = 'none'; }
    else {
        if (rs) rs.style.display = '';
        if (bl) bl.innerHTML = RGPD_BAD.map(i => `<div class="rgpd-bad-item"><span class="id">${i.id}</span><span class="cat">${i.cat}</span>${i.w}</div>`).join('');
    }

    if ($('exportCsv')) $('exportCsv').onclick = exportCSV;
    if ($('exportJson')) $('exportJson').onclick = exportJSON;
    if ($('exportReport')) $('exportReport').onclick = exportReport;
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

        if (Object.keys(cats).length === 0) html += '<div class="no-tags">Aucun tag detect\u00E9</div>';
        else {
            Object.entries(cats).forEach(([c, tags]) => {
                html += `<div class="tag-section"><div class="tag-section-title">${CAT_NAMES[c]||c}</div><div class="tag-row">${tags.map(t => `<span class="tag ${c}">${t}</span>`).join('')}</div></div>`;
            });
        }

        if (p.nba && p.nba.length > 0) {
            html += `<div class="tag-section"><div class="tag-section-title">Next Best Action</div><div class="tag-row">${p.nba.slice(0,2).map(a => `<span class="tag nba">\uD83C\uDFAF ${a.action.substring(0,50)}...</span>`).join('')}</div></div>`;
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

    const typeLabels = { immediate:'Imm\u00E9diat', short_term:'Court terme', long_term:'Long terme' };
    const typeClasses = { immediate:'immediate', short_term:'shortterm', long_term:'longterm' };

    withNBA.forEach(p => {
        let html = `<div class="nba-card-header"><span class="nba-client-id">${p.ca || p.id}</span><div class="person-meta"><span>${p.tags.length} tags</span><span>${p.lang}</span></div></div>`;
        html += `<div class="nba-context">${p.tags.map(t => t.t).join(' \u00B7 ')}</div>`;
        html += '<div class="nba-actions">';
        p.nba.forEach((a, i) => {
            const cls = typeClasses[a.type] || 'shortterm';
            html += `<div class="nba-action"><div class="nba-action-num">${i+1}</div><div><div class="nba-action-text">${a.action}</div><span class="nba-action-type ${cls}">${typeLabels[a.type]||a.type}</span></div></div>`;
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
        <div class="privacy-score-card"><div style="font-size:2.2rem;font-weight:700;color:${totalViolations>0?'#ef4444':'#10b981'};margin-bottom:8px">${totalViolations}</div><div style="color:#888;font-size:.8rem">Violations</div></div>
        <div class="privacy-score-card"><div style="font-size:2.2rem;font-weight:700;color:${criticalCount>0?'#ef4444':'#10b981'};margin-bottom:8px">${criticalCount}</div><div style="color:#888;font-size:.8rem">CA en alerte</div></div>
    `;

    const grid = $('privacyGrid');
    if (!grid) return;
    grid.innerHTML = '';

    PRIVACY_SCORES.forEach(p => {
        const badgeClass = p.level === 'critical' ? 'alert' : p.level === 'warning' ? 'warn' : 'ok';
        const barColor = p.level === 'critical' ? '#ef4444' : p.level === 'warning' ? '#fb923c' : p.level === 'good' ? '#3b82f6' : '#10b981';

        let html = `
            <div class="privacy-card-header"><span class="privacy-ca-name">${p.ca}</span><span class="privacy-badge ${badgeClass}">${p.score}% \u2014 ${p.level.toUpperCase()}</span></div>
            <div class="privacy-bar"><div class="privacy-bar-fill" style="width:${p.score}%;background:${barColor}"></div></div>
            <div class="privacy-detail">${p.total} notes \u00B7 ${p.violations} violation${p.violations>1?'s':''}</div>
        `;
        if (p.coaching.length > 0) {
            html += '<div class="coaching-alert">\u26A0\uFE0F Coaching requis:<br>' + p.coaching.map(c => '\u2192 ' + c).join('<br>') + '</div>';
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
        const numHouses = Math.min(Math.floor(Math.random()*3)+1, 3);
        const houses = [...LVMH_HOUSES].sort(() => Math.random()-.5).slice(0, numHouses);
        const anonId = 'USP-' + btoa(p.id).substring(0,8).toUpperCase();
        const styleTags = p.tags.filter(t => ['style','pref','lifestyle'].includes(t.c));
        const productTags = p.tags.filter(t => ['product','occasion'].includes(t.c));
        const segmentTags = p.tags.filter(t => ['budget','network'].includes(t.c));

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

// ===== RENDER: LUXURY PULSE =====
function renderPulse() {
    const tagFreq = new Map();
    const catFreq = new Map();
    DATA.forEach(row => {
        row.tags.forEach(t => {
            tagFreq.set(t.t, (tagFreq.get(t.t)||0)+1);
            catFreq.set(t.c, (catFreq.get(t.c)||0)+1);
        });
    });
    const sorted = Array.from(tagFreq.entries()).sort((a,b) => b[1]-a[1]);
    const totalTags = sorted.reduce((s,[,c]) => s+c, 0);

    const ps = $('pulseStats');
    if (ps) ps.innerHTML = `
        <div class="pulse-stat"><div class="pulse-stat-value">${sorted.length}</div><div class="pulse-stat-label">Tags uniques</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${totalTags}</div><div class="pulse-stat-label">Mentions totales</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${DATA.length}</div><div class="pulse-stat-label">Notes analys\u00E9es</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${Array.from(catFreq.keys()).length}</div><div class="pulse-stat-label">Cat\u00E9gories actives</div></div>
    `;

    const trends = $('pulseTrends');
    if (trends) {
        trends.innerHTML = '';
        sorted.slice(0,12).forEach(([tag, count]) => {
            const pct = ((count/DATA.length)*100).toFixed(0);
            const change = Math.floor(Math.random()*30)-10;
            const changeClass = change>5?'up':change<-5?'down':'stable';
            const changeLabel = change>0?`+${change}%`:`${change}%`;
            const bars = Array.from({length:8}, () => {
                const h = Math.max(4, Math.floor(Math.random()*28)+2);
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
        signals.innerHTML = '<h3 style="margin-bottom:14px;font-size:1.05rem">\uD83D\uDD14 Signaux Faibles</h3>';
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

    const durability = tagFreq.get('Durabilit\u00E9') || 0;
    if (durability > 0) {
        const pct = ((durability/total)*100).toFixed(0);
        signals.push({ icon:'\uD83C\uDF0D', title:`Durabilit\u00E9: ${pct}% mentionnent des mat\u00E9riaux responsables`, desc:`${durability} mentions d\u00E9tect\u00E9es.`, level: durability/total>0.1?'hot':'warm' });
    }
    const lifestyleCount = catFreq.get('lifestyle') || 0;
    if (lifestyleCount > total*0.3) signals.push({ icon:'\uD83C\uDFC3', title:`Lifestyle actif dominant: ${lifestyleCount} mentions`, desc:'Opportunit\u00E9 collections sport-chic.', level:'hot' });
    const occasionCount = catFreq.get('occasion') || 0;
    if (occasionCount > 0) signals.push({ icon:'\uD83C\uDF81', title:`${occasionCount} occasions de gifting`, desc:'Activer les campagnes de gifting personnalis\u00E9.', level:'warm' });
    const vipCount = tagFreq.get('VIP') || 0;
    const highBudget = (tagFreq.get('15K+')||0) + (tagFreq.get('10-15K')||0);
    if (vipCount > 0 || highBudget > 0) signals.push({ icon:'\uD83D\uDC8E', title:`${vipCount+highBudget} clients high-value`, desc:`${vipCount} VIP + ${highBudget} budgets > 10K.`, level:'hot' });
    const mini = tagFreq.get('Minimaliste') || 0;
    if (mini > 0) signals.push({ icon:'\u26AA', title:'Tendance minimalisme', desc:`${mini} clients orient\u00E9s minimaliste.`, level:'warm' });
    const netCount = catFreq.get('network') || 0;
    if (netCount > 0) signals.push({ icon:'\uD83D\uDCF1', title:`${netCount} connexions r\u00E9seau`, desc:'Potentiel UGC et ambassadeurs.', level:'cool' });
    if (signals.length === 0) signals.push({ icon:'\uD83D\uDCCA', title:'Analyse en cours...', desc:'Importez plus de donn\u00E9es.', level:'cool' });
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
        grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucun client avec tags pour g\u00E9n\u00E9rer un follow-up.</p>';
        return;
    }

    withTags.forEach(p => {
        const msg = generateFollowupLocal(p, house, channel);
        const card = document.createElement('div');
        card.className = 'followup-card';
        card.innerHTML = `
            <div class="followup-card-header"><span class="followup-client-id">${p.ca || p.id}</span><span class="followup-channel ${channel}">${channel==='email'?'\uD83D\uDCE7 Email':'\uD83D\uDCAC WhatsApp'}</span></div>
            <div class="followup-subject">${msg.subject}</div>
            <div class="followup-body">${msg.body}</div>
            <div class="followup-actions"><button class="followup-btn copy" onclick="copyFollowup(this)">\uD83D\uDCCB Copier</button></div>
        `;
        grid.appendChild(card);
    });
}

function generateFollowupLocal(client, house, channel) {
    const tags = client.tags.map(t => t.t);
    const name = client.ca || client.id;
    const occasions = tags.filter(t => ['Anniversaire','Mariage','Cadeau','Nouveau d\u00E9part','Retraite','Promotion'].includes(t));
    const styles = tags.filter(t => ['Classique','Moderne','\u00C9l\u00E9gant','Discret','Minimaliste'].includes(t));
    const products = tags.filter(t => ['Montres','Bijoux','Parfums','Sac Pro','Sac Voyage','Chaussures','Foulards','Lunettes'].includes(t));
    const prefs = tags.filter(t => ['Noir','Navy','Beige','Cognac','Or','Rose Gold','Durabilit\u00E9','Artisanat'].includes(t));

    let subject, body;
    if (channel === 'email') {
        subject = occasions.length > 0 ? `${house} \u2014 Attention pour votre ${occasions[0].toLowerCase()}` : `${house} \u2014 Suite \u00E0 notre \u00E9change, ${name}`;
        body = `Cher(e) ${name},\n\nCe fut un r\u00E9el plaisir de vous accueillir chez ${house}.\n\n`;
        if (styles.length) body += `Votre sensibilit\u00E9 pour un style ${styles.join(' et ').toLowerCase()} m'a inspir\u00E9(e). `;
        if (products.length) body += `Suite \u00E0 votre int\u00E9r\u00EAt pour nos ${products.join(', ').toLowerCase()}, de nouvelles pi\u00E8ces sont arriv\u00E9es.\n\n`;
        if (occasions.length) body += `Pour votre ${occasions[0].toLowerCase()}, j'ai pr\u00E9-s\u00E9lectionn\u00E9 des pi\u00E8ces.\n\n`;
        if (prefs.length) body += `Les tons ${prefs.join(', ').toLowerCase()} de notre derni\u00E8re collection sauront vous s\u00E9duire.\n\n`;
        body += `N'h\u00E9sitez pas \u00E0 me contacter.\n\nAvec toute mon attention,\nVotre Client Advisor\n${house}`;
    } else {
        subject = `WhatsApp \u2014 ${name}`;
        body = `Bonjour ${name} \uD83D\uDE42\n\nMerci pour votre visite chez ${house} ! `;
        if (products.length) { body += '\n\nR\u00E9f\u00E9rences :\n'; products.forEach(pr => body += `\u2192 ${pr}\n`); }
        if (occasions.length) body += `\nPour votre ${occasions[0].toLowerCase()}, je vous pr\u00E9pare une s\u00E9lection \u2728\n`;
        if (styles.length) body += `\nNouveaut\u00E9s ${styles[0].toLowerCase()} pour vous.\n`;
        body += `\nJe reste disponible.\nBelle journ\u00E9e ! \uD83E\uDD0D\n\u2014 CA ${house}`;
    }
    return { subject, body };
}

window.copyFollowup = function(btn) {
    const body = btn.closest('.followup-card').querySelector('.followup-body').textContent;
    navigator.clipboard.writeText(body).then(() => {
        btn.textContent = '\u2705 Copi\u00E9 !';
        setTimeout(() => { btn.textContent = '\uD83D\uDCCB Copier'; }, 1500);
    });
};

// ===== RENDER: PRODUCT MATCHER =====
function renderProducts() {
    const grid = $('productGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const withTags = DATA.filter(p => p.tags.length > 0);
    if (withTags.length === 0) {
        grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucun client avec tags pour le matching produit.</p>';
        return;
    }

    withTags.forEach(p => {
        const matchedProducts = [];
        const usedNames = new Set();
        p.tags.forEach(tag => {
            const catalog = PRODUCT_CATALOG[tag.t];
            if (catalog) {
                catalog.forEach(prod => {
                    if (!usedNames.has(prod.name)) {
                        matchedProducts.push({ ...prod, matchTag: tag.t });
                        usedNames.add(prod.name);
                    }
                });
            }
        });
        if (matchedProducts.length === 0) return;
        const top3 = matchedProducts.slice(0, 3);

        const card = document.createElement('div');
        card.className = 'product-match-card';
        card.innerHTML = `
            <div class="product-match-header"><span class="product-match-client">${p.ca || p.id}</span><span style="color:#666;font-size:.72rem">${matchedProducts.length} produits</span></div>
            <div class="product-match-tags">${p.tags.slice(0,6).map(t=>`<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
            <div class="product-items">
                ${top3.map(prod => `
                    <div class="product-item">
                        <div class="product-item-img">${prod.img}</div>
                        <div class="product-item-info">
                            <div class="product-item-name">${prod.name}</div>
                            <div class="product-item-desc">${prod.desc}</div>
                            <div style="display:flex;align-items:center;gap:8px;margin-top:3px">
                                <span class="product-item-price">${prod.price}</span>
                                <span class="product-item-match">Match: ${prod.matchTag}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        grid.appendChild(card);
    });
}

// ===== RENDER: SENTIMENT =====
function renderSentiment() {
    const overview = $('sentimentOverview');
    if (!overview) return;

    const posCount = SENTIMENT_DATA.filter(s => s.level==='positive').length;
    const neuCount = SENTIMENT_DATA.filter(s => s.level==='neutral').length;
    const negCount = SENTIMENT_DATA.filter(s => s.level==='negative').length;
    const avgScore = SENTIMENT_DATA.length > 0 ? Math.round(SENTIMENT_DATA.reduce((s,d)=>s+d.score,0)/SENTIMENT_DATA.length) : 0;

    overview.innerHTML = `
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#10b981">${posCount}</div><div class="sentiment-stat-label">Positifs</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#888">${neuCount}</div><div class="sentiment-stat-label">Neutres</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#ef4444">${negCount}</div><div class="sentiment-stat-label">N\u00E9gatifs</div></div>
        <div class="sentiment-stat"><div class="sentiment-stat-value" style="color:#d4af37">${avgScore}%</div><div class="sentiment-stat-label">Score moyen</div></div>
    `;

    const alerts = $('sentimentAlerts');
    if (alerts) {
        alerts.innerHTML = '';
        const negatives = SENTIMENT_DATA.filter(s => s.level === 'negative');
        if (negatives.length > 0) {
            alerts.innerHTML = '<h3 style="margin-bottom:12px;font-size:1rem;color:#ef4444">\uD83D\uDEA8 Clients \u00E0 risque</h3>';
            negatives.forEach(s => {
                const al = document.createElement('div');
                al.className = 'sentiment-alert';
                al.innerHTML = `<div class="sentiment-alert-icon">\u26A0\uFE0F</div><div class="sentiment-alert-content"><div class="sentiment-alert-title">${s.id} \u2014 Score ${s.score}% (CA: ${s.ca})</div><div class="sentiment-alert-desc">Mots: ${s.negFound.join(', ')}. Action imm\u00E9diate recommand\u00E9e.</div></div><span class="sentiment-alert-badge">\u00C0 risque</span>`;
                alerts.appendChild(al);
            });
        }
    }

    const grid = $('sentimentGrid');
    if (!grid) return;
    grid.innerHTML = '';
    SENTIMENT_DATA.sort((a,b) => a.score-b.score).forEach(s => {
        const color = s.level==='positive'?'#10b981':s.level==='negative'?'#ef4444':'#888';
        const card = document.createElement('div');
        card.className = 'sentiment-card';
        card.innerHTML = `
            <div class="sentiment-card-header"><span class="sentiment-client">${s.id}</span><div class="sentiment-gauge"><div class="sentiment-gauge-bar"><div class="sentiment-gauge-fill" style="width:${s.score}%;background:${color}"></div></div><span class="sentiment-gauge-label" style="color:${color}">${s.score}%</span></div></div>
            <div class="sentiment-keywords">${s.posFound.map(k=>`<span class="sentiment-kw positive">${k}</span>`).join('')}${s.negFound.map(k=>`<span class="sentiment-kw negative">${k}</span>`).join('')}${s.posFound.length===0&&s.negFound.length===0?'<span class="sentiment-kw neutral">neutre</span>':''}</div>
            <div class="sentiment-excerpt">"${s.excerpt}..."</div>
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
        <div class="boutique-kpi"><div class="boutique-kpi-value">${STATS.clients}</div><div class="boutique-kpi-label">Notes trait\u00E9es</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:#10b981">${STATS.tags}</div><div class="boutique-kpi-label">Tags extraits</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:#d4af37">${STATS.nba}</div><div class="boutique-kpi-label">Actions NBA</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:${avgSentiment>=60?'#10b981':'#ef4444'}">${avgSentiment}%</div><div class="boutique-kpi-label">Satisfaction</div></div>
        <div class="boutique-kpi"><div class="boutique-kpi-value" style="color:${atRiskPct>10?'#ef4444':'#10b981'}">${atRiskPct}%</div><div class="boutique-kpi-label">\u00C0 risque</div></div>
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
        if (top5.length > 0) actions.push({ icon:'\uD83D\uDCE6', text:`R\u00E9approvisionner "${top5[0][0]}"`, priority:'high' });
        const negClients = SENTIMENT_DATA.filter(s => s.level === 'negative');
        if (negClients.length > 0) actions.push({ icon:'\uD83D\uDCDE', text:`Contacter ${negClients.length} client${negClients.length>1?'s':''} insatisfait${negClients.length>1?'s':''}`, priority:'high' });
        const occasionTags = DATA.filter(r => r.tags.some(t => t.c==='occasion'));
        if (occasionTags.length > 0) actions.push({ icon:'\uD83C\uDF81', text:`${occasionTags.length} opportunit\u00E9s gifting`, priority:'medium' });
        const vipCount = DATA.filter(r => r.tags.some(t => t.t==='VIP')).length;
        if (vipCount > 0) actions.push({ icon:'\u2B50', text:`${vipCount} VIP \u2014 planifier private viewing`, priority:'medium' });
        actions.push({ icon:'\uD83D\uDCCA', text:'Diffuser le rapport hebdomadaire', priority:'low' });
        actionsList.innerHTML = actions.map(a => `<div class="action-item"><div class="action-icon">${a.icon}</div><div><div class="action-text">${a.text}</div><span class="action-priority ${a.priority}">${a.priority==='high'?'Urgent':a.priority==='medium'?'Cette semaine':'Planifi\u00E9'}</span></div></div>`).join('');
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
            const catalog = PRODUCT_CATALOG[tag];
            if (catalog) stockRecs.push({ icon:'\uD83D\uDCE6', text:`${tag}: ${count} demandes \u2014 v\u00E9rifier stocks ${catalog[0].name}`, urgency: count>3?'high':'medium' });
        });
        if (stockRecs.length === 0) stockRecs.push({ icon:'\u2705', text:'Pas de recommandation urgente', urgency:'medium' });
        stockList.innerHTML = stockRecs.map(s => `<div class="stock-item"><div class="stock-icon">${s.icon}</div><div class="stock-text">${s.text}</div><span class="stock-urgency ${s.urgency}">${s.urgency==='high'?'Urgent':'\u00C0 suivre'}</span></div>`).join('');
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
