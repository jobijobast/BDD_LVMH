/**
 * VERSION LOCALE - Sans Supabase
 * Utilise localStorage pour stocker les données temporairement
 * À utiliser UNIQUEMENT pour les tests si Supabase ne fonctionne pas
 */

// Remplacer la fonction login
async function loginLocal(firstName, lastName, code) {
    // Simulation de boutiques locales
    const boutiques = [
        { id: '1', name: 'LVMH Champs-Elysees', code: 'LVMH2024' },
        { id: '2', name: 'LVMH Monaco', code: 'LVMH2025' }
    ];
    
    const boutique = boutiques.find(b => b.code === code);
    if (!boutique) throw new Error('Code boutique invalide');
    
    // Simulation de sellers locaux
    const sellers = [
        { id: '1', first_name: 'Bruno', last_name: 'Lopes', role: 'manager', boutique_id: '1' },
        { id: '2', first_name: 'Marie', last_name: 'Martin', role: 'manager', boutique_id: '1' },
        { id: '3', first_name: 'Jean', last_name: 'Dupont', role: 'vendeur', boutique_id: '1' }
    ];
    
    const seller = sellers.find(s => 
        s.first_name.toLowerCase() === firstName.toLowerCase() &&
        s.last_name.toLowerCase() === lastName.toLowerCase() &&
        s.boutique_id === boutique.id
    );
    
    if (!seller) throw new Error('Utilisateur non trouvé');
    
    currentUser = { ...seller, boutique };
    localStorage.setItem('lvmh_session', JSON.stringify(currentUser));
    return currentUser;
}

// Remplacer la fonction loadClientsFromDB
async function loadClientsFromDBLocal() {
    showLoading('Chargement des données locales...');
    try {
        // Charger depuis localStorage
        const stored = localStorage.getItem('lvmh_clients_' + currentUser.boutique.id);
        const clients = stored ? JSON.parse(stored) : [];
        
        // Filtrer par vendeur si nécessaire
        let filteredClients = clients;
        if ((currentUser.role || '').toLowerCase() === 'vendeur') {
            filteredClients = clients.filter(c => c.seller_id === currentUser.id);
        }
        
        // Transform
        DATA = filteredClients.map(c => ({
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
        
        recomputeStats();
        hideLoading();
    } catch (err) {
        hideLoading();
        console.error('Error loading clients:', err);
        showToast('Erreur chargement données: ' + err.message, 'error');
    }
}

// Fonction pour sauvegarder localement après traitement
async function saveToLocalStorage(result) {
    try {
        const stored = localStorage.getItem('lvmh_clients_' + currentUser.boutique.id);
        const existing = stored ? JSON.parse(stored) : [];
        
        // Ajouter les nouvelles données
        result.data.forEach(newClient => {
            const client = {
                id: Date.now() + Math.random(),
                external_id: newClient.id,
                seller_id: currentUser.id,
                boutique_id: currentUser.boutique.id,
                date: newClient.date,
                language: newClient.lang,
                original_text: newClient.orig,
                cleaned_text: newClient.clean,
                tags: newClient.tags,
                nba: newClient.nba,
                sentiment: newClient.sentiment,
                sensitive_count: newClient.sensitiveCount,
                sensitive_found: newClient.sensitiveFound,
                rgpd_masked: newClient.rgpdMasked,
                store: newClient.store,
                client_name: newClient.ca,
                created_at: new Date().toISOString()
            };
            existing.push(client);
        });
        
        localStorage.setItem('lvmh_clients_' + currentUser.boutique.id, JSON.stringify(existing));
        console.log('✅ Saved to localStorage');
    } catch (err) {
        console.error('⚠️ Error saving to localStorage:', err);
    }
}

console.log('🔧 MODE LOCAL ACTIVÉ - Les données sont stockées dans localStorage');
console.log('Pour revenir au mode Supabase, rechargez la page sans ce script');
