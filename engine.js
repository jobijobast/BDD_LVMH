/**
 * LVMH Voice-to-Tag — Rendering Engine
 * All rendering functions for vendeur & manager views.
 * State (DATA, STATS, etc.) is managed by app.js.
 */

// ===== LOUIS VUITTON PRODUCT DATABASE =====
let LV_PRODUCTS = [];
let PRODUCTS_LOADED = false;
let PRODUCTS_INDEX = null; // Index optimisé pour recherche rapide
let MATCH_CACHE = new Map(); // Cache des résultats de matching

// Load LV products from JSON file
async function loadLVProducts() {
    if (PRODUCTS_LOADED) return;
    
    try {
        const response = await fetch('louis_vuitton_products.json');
        if (!response.ok) throw new Error('Failed to load product database');
        
        LV_PRODUCTS = await response.json();
        
        // Créer un index pour accélérer les recherches
        PRODUCTS_INDEX = buildProductIndex(LV_PRODUCTS);
        
        PRODUCTS_LOADED = true;
        console.log(`✅ Loaded ${LV_PRODUCTS.length} Louis Vuitton products from Hugging Face dataset`);
        console.log(`✅ Product index built with ${Object.keys(PRODUCTS_INDEX.byCategory).length} categories`);
    } catch (error) {
        console.error('❌ Error loading LV products:', error);
        LV_PRODUCTS = [];
    }
}

// Construire un index pour recherche rapide
function buildProductIndex(products) {
    const index = {
        byCategory: {},
        byGender: { femme: [], homme: [], unisex: [] },
        byPriceRange: { low: [], mid: [], high: [], luxury: [] },
        searchTerms: {}
    };
    
    products.forEach((product, idx) => {
        const cat1 = (product.category1_code || '').toLowerCase();
        const cat2 = (product.category2_code || '').toLowerCase();
        const title = (product.title || '').toLowerCase();
        const price = product.price_eur || 0;
        
        // Index par catégorie
        if (!index.byCategory[cat1]) index.byCategory[cat1] = [];
        index.byCategory[cat1].push(idx);
        
        if (!index.byCategory[cat2]) index.byCategory[cat2] = [];
        index.byCategory[cat2].push(idx);
        
        // Index par genre
        if (cat1.includes('femme')) index.byGender.femme.push(idx);
        else if (cat1.includes('homme')) index.byGender.homme.push(idx);
        else index.byGender.unisex.push(idx);
        
        // Index par gamme de prix
        if (price < 500) index.byPriceRange.low.push(idx);
        else if (price < 2000) index.byPriceRange.mid.push(idx);
        else if (price < 10000) index.byPriceRange.high.push(idx);
        else index.byPriceRange.luxury.push(idx);
        
        // Index des termes de recherche (mots clés du titre)
        const words = title.split(/\s+/).filter(w => w.length > 3);
        words.forEach(word => {
            if (!index.searchTerms[word]) index.searchTerms[word] = [];
            index.searchTerms[word].push(idx);
        });
    });
    
    return index;
}

// Initialize product loading on page load
if (typeof window !== 'undefined') {
    loadLVProducts();
}

// ===== LVMH HOUSES =====
const LVMH_HOUSES = ['Louis Vuitton','Dior','Fendi','Givenchy','Celine','Loewe','Berluti','Loro Piana','Tiffany & Co.','Bulgari','TAG Heuer','Hublot','Moët Hennessy','Sephora','Rimowa'];

// ===== PRODUCT MATCHING HELPERS =====
function getRelevantCategories(clientTags) {
    const categories = new Set();
    
    clientTags.forEach(tag => {
        const tagLabel = tag.t.toLowerCase();
        
        // Voyage -> Bagages, Voyage
        if (tagLabel.includes('travel') || tagLabel.includes('voyage') || tagLabel.includes('business_travel')) {
            categories.add('voyage');
            categories.add('bagages');
            categories.add('tous les bagages');
        }
        
        // Sport -> Accessoires sportifs, Sacs pratiques
        if (tagLabel.includes('sport') || tagLabel.includes('golf') || tagLabel.includes('tennis')) {
            categories.add('accessoires');
            categories.add('sacs');
            categories.add('sport et lifestyle');
        }
        
        // Professionnel -> Maroquinerie, Portefeuilles, Sacs élégants
        if (tagLabel.includes('executive') || tagLabel.includes('entrepreneur') || tagLabel.includes('business')) {
            categories.add('portefeuilles et petite maroquinerie');
            categories.add('sacs');
            categories.add('accessoires');
        }
        
        // Cadeau -> Accessoires, Petite maroquinerie, Bijoux
        if (tagLabel.includes('cadeau') || tagLabel.includes('anniversaire') || tagLabel.includes('gift')) {
            categories.add('accessoires');
            categories.add('petite maroquinerie');
            categories.add('bijoux');
            categories.add('portefeuilles');
        }
        
        // Mode/Style -> Prêt-à-porter, Accessoires
        if (tagLabel.includes('mode') || tagLabel.includes('fashion') || tagLabel.includes('tendance')) {
            categories.add('pret a porter');
            categories.add('accessoires');
            categories.add('souliers');
        }
        
        // Horlogerie -> Montres, Bijoux
        if (tagLabel.includes('horlogerie') || tagLabel.includes('watch') || tagLabel.includes('montre')) {
            categories.add('montres');
            categories.add('bijoux');
            categories.add('accessoires');
        }
        
        // Art de vivre -> Art de vivre, Maison
        if (tagLabel.includes('art') || tagLabel.includes('culture') || tagLabel.includes('collection')) {
            categories.add('art de vivre');
            categories.add('maison');
        }
    });
    
    // Si aucune catégorie spécifique, ajouter les catégories principales
    if (categories.size === 0) {
        categories.add('sacs a main');
        categories.add('accessoires');
        categories.add('portefeuilles et petite maroquinerie');
    }
    
    return Array.from(categories);
}

// ===== HELPERS =====
const CAT_NAMES = { profil:'Profil', interet:'Intérêt', voyage:'Voyage', contexte:'Contexte', service:'Service', marque:'Marque', crm:'CRM' };
const legendColors = { profil:'#60a5fa', interet:'#d4af37', voyage:'#34d399', contexte:'#c084fc', service:'#f472b6', marque:'#fb923c', crm:'#facc15' };

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

        if (Object.keys(cats).length === 0) html += '<div class="no-tags">Aucun tag détecté</div>';
        else {
            Object.entries(cats).forEach(([c, tags]) => {
                html += `<div class="tag-section"><div class="tag-section-title">${CAT_NAMES[c]||c}</div><div class="tag-row">${tags.map(t => `<span class="tag ${c}">${t}</span>`).join('')}</div></div>`;
            });
        }

        if (p.nba && p.nba.length > 0) {
            html += `<div class="tag-section"><div class="tag-section-title">Next Best Action</div><div class="tag-row">${p.nba.slice(0,2).map(a => `<span class="tag nba">🎯 ${a.action.substring(0,50)}...</span>`).join('')}</div></div>`;
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

    const typeLabels = { immediate:'Immédiat', short_term:'Court terme', long_term:'Long terme' };
    const typeClasses = { immediate:'immediate', short_term:'shortterm', long_term:'longterm' };

    withNBA.forEach(p => {
        let html = `<div class="nba-card-header"><span class="nba-client-id">${p.ca || p.id}</span><div class="person-meta"><span>${p.tags.length} tags</span><span>${p.lang}</span></div></div>`;
        html += `<div class="nba-context">${p.tags.map(t => t.t).join(' · ')}</div>`;
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
            <div class="privacy-card-header"><span class="privacy-ca-name">${p.ca}</span><span class="privacy-badge ${badgeClass}">${p.score}% — ${p.level.toUpperCase()}</span></div>
            <div class="privacy-bar"><div class="privacy-bar-fill" style="width:${p.score}%;background:${barColor}"></div></div>
            <div class="privacy-detail">${p.total} notes · ${p.violations} violation${p.violations>1?'s':''}</div>
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
        <div class="pulse-stat"><div class="pulse-stat-value">${DATA.length}</div><div class="pulse-stat-label">Notes analysées</div></div>
        <div class="pulse-stat"><div class="pulse-stat-value">${Array.from(catFreq.keys()).length}</div><div class="pulse-stat-label">Catégories actives</div></div>
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

// ===== INTELLIGENT PRODUCT MATCHING =====
function matchProductsToClient(clientTags, clientText) {
    if (!PRODUCTS_LOADED || LV_PRODUCTS.length === 0 || !PRODUCTS_INDEX) return [];
    
    // Vérifier le cache
    const cacheKey = JSON.stringify(clientTags.map(t => t.t).sort());
    if (MATCH_CACHE.has(cacheKey)) {
        console.log('✅ Using cached product matches');
        return MATCH_CACHE.get(cacheKey);
    }
    
    const clientTextLower = (clientText || '').toLowerCase();
    
    // Extract relevant info from tags
    const profil = clientTags.filter(t => t.c === 'profil').map(t => t.t);
    const interet = clientTags.filter(t => t.c === 'interet').map(t => t.t);
    const contexte = clientTags.filter(t => t.c === 'contexte').map(t => t.t);
    const voyage = clientTags.filter(t => t.c === 'voyage').map(t => t.t);
    const service = clientTags.filter(t => t.c === 'service').map(t => t.t);
    const marque = clientTags.filter(t => t.c === 'marque').map(t => t.t);
    
    // Pré-filtrage rapide : ne considérer qu'un sous-ensemble pertinent de produits
    let candidateIndices = new Set();
    
    // Filtrer par genre si disponible
    if (profil.includes('Femme')) {
        PRODUCTS_INDEX.byGender.femme.forEach(idx => candidateIndices.add(idx));
    } else if (profil.includes('Homme')) {
        PRODUCTS_INDEX.byGender.homme.forEach(idx => candidateIndices.add(idx));
    } else {
        // Si pas de genre spécifié, prendre tous les produits unisex et un échantillon des autres
        PRODUCTS_INDEX.byGender.unisex.forEach(idx => candidateIndices.add(idx));
        PRODUCTS_INDEX.byGender.femme.slice(0, 500).forEach(idx => candidateIndices.add(idx));
        PRODUCTS_INDEX.byGender.homme.slice(0, 500).forEach(idx => candidateIndices.add(idx));
    }
    
    // Si trop de candidats, filtrer par catégories pertinentes
    if (candidateIndices.size > 1000) {
        const relevantCategories = getRelevantCategories(clientTags);
        const filteredIndices = new Set();
        
        relevantCategories.forEach(cat => {
            if (PRODUCTS_INDEX.byCategory[cat]) {
                PRODUCTS_INDEX.byCategory[cat].forEach(idx => {
                    if (candidateIndices.has(idx)) {
                        filteredIndices.add(idx);
                    }
                });
            }
        });
        
        // Si on a trouvé des produits dans les catégories pertinentes, les utiliser
        if (filteredIndices.size > 0) {
            candidateIndices = filteredIndices;
        }
    }
    
    const matches = [];
    
    // Règles de matching optimisées basées sur les vraies catégories LV
    const categoryMapping = {
        // Voyage & Déplacements
        'Business_Travel': ['voyage', 'valise', 'bagage', 'horizon', 'keepall', 'cabine', 'pegase'],
        'Loisir_Premium': ['voyage', 'weekend', 'sac', 'bagage', 'keepall'],
        'Expédition_Nature': ['voyage', 'sac', 'backpack', 'outdoor'],
        'Itinérance_Culturelle': ['voyage', 'sac', 'messenger', 'city'],
        
        // Sport & Lifestyle
        'Golf': ['sport', 'sac', 'accessoire', 'lifestyle'],
        'Tennis': ['sport', 'sac', 'accessoire', 'lifestyle'],
        'Sports_Raquette': ['sport', 'sac', 'accessoire'],
        'Sports_Endurance': ['sport', 'sac', 'sneaker', 'running'],
        'Wellness_Yoga': ['sport', 'lifestyle', 'wellness'],
        
        // Professionnel
        'Executive_Leadership': ['portefeuille', 'organiseur', 'attaché', 'porte-documents', 'ceinture', 'maroquinerie'],
        'Entrepreneur': ['portefeuille', 'sac', 'organiseur', 'maroquinerie', 'accessoire'],
        'Expertise_Médicale': ['portefeuille', 'organiseur', 'maroquinerie'],
        'Marchés_Financiers': ['portefeuille', 'organiseur', 'ceinture', 'maroquinerie'],
        
        // Cadeaux
        'Cadeau_Proche': ['portefeuille', 'pochette', 'accessoire', 'bijoux', 'ceinture', 'foulard'],
        'Cadeau_Famille': ['portefeuille', 'pochette', 'accessoire', 'bijoux'],
        'Cadeau_Professionnel': ['portefeuille', 'organiseur', 'ceinture', 'accessoire', 'maroquinerie'],
        'Anniversaire': ['bijoux', 'accessoire', 'portefeuille', 'pochette', 'parfum'],
        'Union': ['bijoux', 'accessoire', 'mariage'],
        'Naissance': ['accessoire', 'cadeau'],
        
        // Style & Mode
        'Intemporel': ['monogram', 'classique', 'speedy', 'neverfull', 'alma'],
        'Contemporain': ['nouveautes', 'collection', 'tendance'],
        'Tendance': ['nouveautes', 'pret a porter', 'souliers', 'accessoire'],
        'Quiet_Luxury': ['empreinte', 'cuir', 'sobre', 'elegant'],
        'Signature_Logo': ['monogram', 'damier', 'signature', 'logo'],
        'Design_Minimaliste': ['sobre', 'minimal', 'elegant'],
        
        // Accessoires & Horlogerie
        'Horlogerie_Vintage': ['montre', 'tambour', 'accessoire'],
        'Haute_Horlogerie': ['montre', 'tambour', 'complications'],
        
        // Art de Vivre
        'Art_Contemporain': ['art de vivre', 'maison', 'collection'],
        'Art_Classique': ['art de vivre', 'maison'],
        'Livres_Rares': ['papeterie', 'art de vivre'],
        'Art_de_Vivre_Malles': ['malle', 'trunk', 'art de vivre'],
        
        // Produits Iconiques LV
        'Lignes_Iconiques': ['speedy', 'neverfull', 'alma', 'keepall', 'noé', 'twist', 'capucines'],
        'Client_Historique': ['monogram', 'damier', 'speedy', 'neverfull', 'keepall'],
        'Lignes_Animation': ['nouveautes', 'collection'],
        'Cuirs_Exotiques': ['crocodile', 'python', 'alligator', 'exotique'],
    };
    
    // Score uniquement les produits candidats (beaucoup plus rapide)
    Array.from(candidateIndices).forEach(idx => {
        const product = LV_PRODUCTS[idx];
        let score = 0;
        let matchReasons = [];
        
        // Build comprehensive product text from ALL available fields
        // New Hugging Face dataset structure
        const productName = (product.title || '').toLowerCase();
        const productDesc = '';  // No description in new dataset
        const productCategory = (product.category1_code || '').toLowerCase();
        const productSubcategory = ((product.category2_code || '') + ' ' + (product.category3_code || '')).toLowerCase();
        const productMaterials = '';  // Not available in new dataset
        const productColors = '';  // Not available in new dataset
        const productSKU = (product.product_code || '').toLowerCase();
        
        // Complete product text for matching
        const productText = `${productName} ${productCategory} ${productSubcategory}`;
        
        // 1. MATCHING OPTIMISÉ PAR CATÉGORIES
        clientTags.forEach(tag => {
            const tagLabel = tag.t;
            const keywords = categoryMapping[tagLabel] || [];
            
            // Match rapide par mots-clés
            let matched = false;
            for (const keyword of keywords) {
                if (productText.includes(keyword)) {
                    score += 15;
                    matched = true;
                    break;
                }
            }
            
            if (matched && !matchReasons.includes(tagLabel)) {
                matchReasons.push(tagLabel);
            }
        });
        
        // 2. BONUS CONTEXTUELS RAPIDES
        
        // Voyage
        if (voyage.length > 0 && (productCategory.includes('voyage') || productName.includes('valise') || productName.includes('sac'))) {
            score += 25;
            matchReasons.push('Voyage');
        }
        
        // Sport
        if (interet.some(i => i.includes('Sport')) && (productName.includes('sac') || productCategory.includes('sport'))) {
            score += 20;
            matchReasons.push('Sport');
        }
        
        // Professionnel
        if (profil.some(p => p.includes('Executive') || p.includes('Entrepreneur')) && 
            (productName.includes('portefeuille') || productName.includes('organiseur') || productCategory.includes('maroquinerie'))) {
            score += 20;
            matchReasons.push('Professionnel');
        }
        
        // Cadeau
        if (contexte.some(c => c.includes('Cadeau')) && 
            (productCategory.includes('accessoires') || productCategory.includes('bijoux') || productCategory.includes('petite maroquinerie'))) {
            score += 20;
            matchReasons.push('Cadeau');
        }
        
        // 3. MATCHING TEXTE CLIENT (simplifié)
        if (clientTextLower.length > 10) {
            const clientWords = clientTextLower.split(/\s+/).filter(w => w.length > 4).slice(0, 5); // Limiter à 5 mots
            clientWords.forEach(word => {
                if (productName.includes(word)) {
                    score += 10;
                }
            });
        }
        
        // 4. GENRE
        if (profil.includes('Femme') && productCategory.includes('femme')) {
            score += 15;
        } else if (profil.includes('Homme') && productCategory.includes('homme')) {
            score += 15;
        }
        
        // 5. PRODUITS ICONIQUES
        if (productName.includes('speedy') || productName.includes('neverfull') || 
            productName.includes('alma') || productName.includes('keepall')) {
            score += 10;
            matchReasons.push('Iconique');
        }
        
        // Seuil de pertinence plus élevé pour de meilleurs résultats
        if (score >= 20 && matchReasons.length > 0) {
            matches.push({
                product,
                score,
                matchReasons: [...new Set(matchReasons)].slice(0, 3)
            });
        }
    });
    
    // Trier par score et limiter aux meilleurs résultats
    const sortedMatches = matches.sort((a, b) => b.score - a.score).slice(0, 50); // Max 50 produits
    
    // Mettre en cache
    MATCH_CACHE.set(cacheKey, sortedMatches);
    
    // Limiter la taille du cache
    if (MATCH_CACHE.size > 100) {
        const firstKey = MATCH_CACHE.keys().next().value;
        MATCH_CACHE.delete(firstKey);
    }
    
    console.log(`✅ Found ${sortedMatches.length} matching products (from ${candidateIndices.size} candidates)`);
    return sortedMatches;
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
    
    // Afficher un message de chargement pendant le matching
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#999"><div class="spinner" style="margin:0 auto 16px"></div><p>Analyse des profils clients et matching des produits...</p></div>';

    // Utiliser setTimeout pour permettre au spinner de s'afficher
    setTimeout(() => {
        const withTags = DATA.filter(p => p.tags.length > 0);
        if (withTags.length === 0) {
            grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px">Aucun client avec tags pour le matching produit.</p>';
            return;
        }
        
        if (LV_PRODUCTS.length === 0) {
            grid.innerHTML = '<p style="color:#ef4444;font-size:.85rem;padding:20px">⚠️ Erreur de chargement de la base de données produits. Vérifiez que le fichier JSON est accessible.</p>';
            return;
        }

        grid.innerHTML = ''; // Effacer le spinner
        let totalMatches = 0;
        let cardsRendered = 0;

        // Limiter le nombre de clients affichés pour de meilleures performances
        const clientsToShow = withTags.slice(0, 20); // Max 20 clients

        clientsToShow.forEach(p => {
            const matches = matchProductsToClient(p.tags, p.clean);
            
            // Only show clients with actual matches
            if (matches.length === 0) return;
            
            totalMatches += matches.length;
            const top3 = matches.slice(0, 3);
            cardsRendered++;

        const card = document.createElement('div');
        card.className = 'product-match-card';
        card.innerHTML = `
            <div class="product-match-header">
                <span class="product-match-client">${p.ca || p.id}</span>
                <span style="color:#666;font-size:.72rem">${matches.length} produit${matches.length > 1 ? 's' : ''} trouvé${matches.length > 1 ? 's' : ''}</span>
            </div>
            <div class="product-match-tags">${p.tags.slice(0,6).map(t=>`<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>
            <div class="product-items">
                ${top3.map(match => {
                    const prod = match.product;
                    
                    // New Hugging Face dataset structure
                    const imageUrl = prod.imageurl || '';
                    const price = prod.price_eur ? `${prod.price_eur.toLocaleString('fr-FR')} €` : 'Prix sur demande';
                    const matchTags = match.matchReasons.join(', ');
                    const productName = prod.title || 'Produit Louis Vuitton';
                    const productCategory = [prod.category1_code, prod.category2_code, prod.category3_code].filter(Boolean).join(' › ');
                    const productUrl = prod.itemurl || '';
                    
                    return `
                        <div class="product-item">
                            <div class="product-item-img" style="background-image:url('${imageUrl}');background-size:cover;background-position:center;width:100px;height:100px;border-radius:8px;flex-shrink:0;${imageUrl ? '' : 'background-color:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:2rem'}">
                                ${imageUrl ? '' : '🛍️'}
                            </div>
                            <div class="product-item-info">
                                <div class="product-item-name">${productName}</div>
                                <div class="product-item-desc">${productCategory}</div>
                                <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap">
                                    <span class="product-item-price">${price}</span>
                                    <span class="product-item-match" title="Match: ${matchTags}">Match: ${matchTags}</span>
                                </div>
                                ${productUrl ? `<a href="${productUrl}" target="_blank" style="font-size:.7rem;color:#d4af37;margin-top:4px;display:inline-block">Voir sur LV →</a>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
            grid.appendChild(card);
        });
        
        // Afficher un résumé
        if (cardsRendered > 0) {
            const summary = document.createElement('div');
            summary.style.cssText = 'text-align:center;padding:20px;color:#999;font-size:.85rem;border-top:1px solid #E5E5E5;margin-top:20px';
            summary.innerHTML = `✅ ${cardsRendered} client${cardsRendered > 1 ? 's' : ''} avec ${totalMatches} produit${totalMatches > 1 ? 's' : ''} correspondant${totalMatches > 1 ? 's' : ''}`;
            grid.appendChild(summary);
        } else {
            grid.innerHTML = '<p style="color:#999;font-size:.85rem;padding:20px;text-align:center">Aucun produit Louis Vuitton ne correspond aux profils clients actuels. Le matching est basé sur les tags et descriptions des clients.</p>';
        }
    }, 100); // Petit délai pour afficher le spinner
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
