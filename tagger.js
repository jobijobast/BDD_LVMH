/**
 * LVMH Voice-to-Tag - Module Tagger
 * Extraction de tags ultra-précis pour enrichir la taxonomie CRM
 */

const Tagger = {
    stats: { totalTags: 0, categories: {} },
    extractedTags: [],

    patterns: {
        // Professions
        profession: {
            patterns: [
                { regex: /\b(dentist[ea]?|doctor|médecin|doctora?|arzt|ärztin)\b/gi, tag: 'Dentiste/Médecin' },
                { regex: /\b(avocat[ea]?|lawyer|attorney|abogad[oa]|rechtsanwalt)\b/gi, tag: 'Avocat' },
                { regex: /\b(architecte?|architect[oa]?|architekt)\b/gi, tag: 'Architecte' },
                { regex: /\b(chirurgien|surgeon|cirujano|chirurgo?)\b/gi, tag: 'Chirurgien' },
                { regex: /\b(cardiologue|cardiol|heart specialist)\b/gi, tag: 'Cardiologue' },
                { regex: /\b(oncologue|oncologist|oncologo)\b/gi, tag: 'Oncologue' },
                { regex: /\b(pharmacien|pharmacist|farmacéutico|farmacista)\b/gi, tag: 'Pharmacien' },
                { regex: /\b(professeur|professor|profesor[ea]?)\b/gi, tag: 'Professeur' },
                { regex: /\b(journaliste?|journalist[ea]?)\b/gi, tag: 'Journaliste' },
                { regex: /\b(influenceur|influencer|influencer)\b/gi, tag: 'Influenceur' },
                { regex: /\b(entrepreneur|empresari[oa]|unternehmer)\b/gi, tag: 'Entrepreneur' },
                { regex: /\b(CEO|directeur|director[ea]?|geschäftsführer)\b/gi, tag: 'Dirigeant' },
                { regex: /\b(designer|créateur|diseñador|stilista)\b/gi, tag: 'Designer' },
                { regex: /\b(chef|cuisinier|cocinero|cuoco|koch)\b/gi, tag: 'Chef Cuisinier' },
                { regex: /\b(photographe?|fotograf[oa]?)\b/gi, tag: 'Photographe' },
                { regex: /\b(développeur|developer|desarrollador|sviluppatore)\b/gi, tag: 'Développeur' },
                { regex: /\b(banquier|banker|banquero|banchiere)\b/gi, tag: 'Banquier' },
                { regex: /\b(consultant[ea]?|berater)\b/gi, tag: 'Consultant' },
                { regex: /\b(producteur|producer|productor|produttore)\b/gi, tag: 'Producteur' },
                { regex: /\b(galeriste?|gallery owner|galerista)\b/gi, tag: 'Galeriste' },
                { regex: /\b(sommelier[ea]?)\b/gi, tag: 'Sommelier' },
                { regex: /\b(pâtissier|pâtissière|pastry chef)\b/gi, tag: 'Pâtissier' },
                { regex: /\b(éditeur|editor|editore|verleger)\b/gi, tag: 'Éditeur' },
                { regex: /\b(pilote?|pilot[oa]?)\b/gi, tag: 'Pilote' },
                { regex: /\b(musicien|musician|músico|musicista)\b/gi, tag: 'Musicien' },
                { regex: /\b(danseur|dancer|bailarín|ballerino)\b/gi, tag: 'Danseur' },
                { regex: /\b(psy(chologue|chiatre|chotérapeute)|psychologist|therapist)\b/gi, tag: 'Psychologue' }
            ],
            category: 'PROFIL_CLIENT'
        },
        // Segment client
        segment: {
            patterns: [
                { regex: /\bVIP\b/gi, tag: 'VIP' },
                { regex: /\b(haut potentiel|high potential|altissimo potenziale|alto potencial|hohes potenzial)\b/gi, tag: 'High_Potential' },
                { regex: /\b(nouveau client|new client|nuovo cliente|new customer|neuer kunde)\b/gi, tag: 'Nouveau_Client' },
                { regex: /\b(client régulier|regular client|cliente regolare|cliente habitual)\b/gi, tag: 'Client_Régulier' },
                { regex: /\b(depuis 20\d{2}|since 20\d{2}|dal 20\d{2}|desde 20\d{2}|seit 20\d{2})\b/gi, tag: 'Client_Fidèle' }
            ],
            category: 'PROFIL_CLIENT'
        },
        // Budget
        budget: {
            patterns: [
                { regex: /\b(\d+)[Kk€$]\s*(flexible|très flexible|very flexible|molto flessibile|muy flexible|sehr flexibel)/gi, tag: 'Budget_Flexible' },
                { regex: /budget.{0,20}(3|4|5)[Kk€$]/gi, tag: 'Budget_3-5K' },
                { regex: /budget.{0,20}(5|6|7|8|9|10)[Kk€$]/gi, tag: 'Budget_5-10K' },
                { regex: /budget.{0,20}(1[0-4])[Kk€$]/gi, tag: 'Budget_10-15K' },
                { regex: /budget.{0,20}(1[5-9]|2\d)[Kk€$]/gi, tag: 'Budget_15K+' },
                { regex: /budget.{0,20}(extrêmement|extremely|très|very) flexibl/gi, tag: 'Budget_Très_Flexible' }
            ],
            category: 'BUDGET'
        },
        // Préférences couleurs
        colors: {
            patterns: [
                { regex: /\b(noir|black|nero|negro|schwarz)\b/gi, tag: 'Couleur_Noir' },
                { regex: /\b(beige)\b/gi, tag: 'Couleur_Beige' },
                { regex: /\b(cognac|camel)\b/gi, tag: 'Couleur_Cognac' },
                { regex: /\b(navy|marine|blu navy)\b/gi, tag: 'Couleur_Navy' },
                { regex: /\b(marron|brown|marrón|marrone|braun)\b/gi, tag: 'Couleur_Marron' },
                { regex: /\b(gris|grey|gray|grigio)\b/gi, tag: 'Couleur_Gris' },
                { regex: /\b(rose gold|or rose|oro rosa)\b/gi, tag: 'Hardware_Rose_Gold' },
                { regex: /\b(gold|doré|oro|or)\b/gi, tag: 'Hardware_Or' },
                { regex: /\b(argent|silver|plata|argento|silber)\b/gi, tag: 'Hardware_Argent' },
                { regex: /\b(champagne)\b/gi, tag: 'Couleur_Champagne' },
                { regex: /\b(bordeaux|burgundy)\b/gi, tag: 'Couleur_Bordeaux' }
            ],
            category: 'PRÉFÉRENCES_PRODUIT'
        },
        // Style
        style: {
            patterns: [
                { regex: /\b(classique|classic|clásico|classico|klassisch)\b/gi, tag: 'Style_Classique' },
                { regex: /\b(moderne|modern|moderno)\b/gi, tag: 'Style_Moderne' },
                { regex: /\b(avant-garde|avantgardistisch|avant garde)\b/gi, tag: 'Style_Avant-Garde' },
                { regex: /\b(élégant|elegant[ea]?)\b/gi, tag: 'Style_Élégant' },
                { regex: /\b(discret|discrete|understated)\b/gi, tag: 'Style_Discret' },
                { regex: /\b(sophistiqué|sophisticated|sofisticad[oa]|sofisticato)\b/gi, tag: 'Style_Sophistiqué' },
                { regex: /\b(minimaliste|minimalist[ea]?)\b/gi, tag: 'Style_Minimaliste' },
                { regex: /\b(artistique|artistic[oa]?|künstlerisch)\b/gi, tag: 'Style_Artistique' }
            ],
            category: 'PRÉFÉRENCES_PRODUIT'
        },
        // Lifestyle - Sports
        sports: {
            patterns: [
                { regex: /\b(yoga)\b/gi, tag: 'Sport_Yoga' },
                { regex: /\b(pilates)\b/gi, tag: 'Sport_Pilates' },
                { regex: /\b(golf)\b/gi, tag: 'Sport_Golf' },
                { regex: /\b(tennis)\b/gi, tag: 'Sport_Tennis' },
                { regex: /\b(équitation|equitation|horse riding|reit)\b/gi, tag: 'Sport_Équitation' },
                { regex: /\b(natation|swimming|nuoto|schwimmen)\b/gi, tag: 'Sport_Natation' },
                { regex: /\b(running|course|marathon|corsa|lauf)\b/gi, tag: 'Sport_Running' },
                { regex: /\b(ski|skiing)\b/gi, tag: 'Sport_Ski' },
                { regex: /\b(crossfit)\b/gi, tag: 'Sport_CrossFit' },
                { regex: /\b(surf|surfing)\b/gi, tag: 'Sport_Surf' },
                { regex: /\b(escalade|climbing|klettern|arrampicata)\b/gi, tag: 'Sport_Escalade' },
                { regex: /\b(randonnée|hiking|senderismo|escursion|wandern)\b/gi, tag: 'Sport_Randonnée' },
                { regex: /\b(vélo|cycling|ciclismo|radfahren)\b/gi, tag: 'Sport_Cyclisme' },
                { regex: /\b(méditation|meditation|meditazione)\b/gi, tag: 'Wellness_Méditation' }
            ],
            category: 'LIFESTYLE'
        },
        // Régime alimentaire
        diet: {
            patterns: [
                { regex: /\b(végétarien|vegetarian[oa]?|vegetariano|vegetarier)\b/gi, tag: 'Régime_Végétarien' },
                { regex: /\b(vega?n[ea]?|vegano)\b/gi, tag: 'Régime_Vegan' },
                { regex: /\b(pescetarien|pescatarian|pescetariano)\b/gi, tag: 'Régime_Pescetarien' },
                { regex: /\b(plant.based|plant based)\b/gi, tag: 'Régime_Plant_Based' }
            ],
            category: 'LIFESTYLE'
        },
        // Collections/Hobbies
        hobbies: {
            patterns: [
                { regex: /\bcollectionn?e?\b.{0,30}(art|kunst|arte)/gi, tag: 'Hobby_Collection_Art' },
                { regex: /\bcollectionn?e?\b.{0,30}(montr|watch|orologio|reloj|uhr)/gi, tag: 'Hobby_Collection_Montres' },
                { regex: /\bcollectionn?e?\b.{0,30}(vin|wine|vino|wein)/gi, tag: 'Hobby_Collection_Vins' },
                { regex: /\bcollectionn?e?\b.{0,30}(livre|book|libro|buch)/gi, tag: 'Hobby_Collection_Livres' },
                { regex: /\b(opéra|opera|oper)\b/gi, tag: 'Hobby_Opéra' },
                { regex: /\b(théâtre|theater|teatro)\b/gi, tag: 'Hobby_Théâtre' },
                { regex: /\b(musée|museum|museo)\b/gi, tag: 'Hobby_Musées' },
                { regex: /\b(photographie|photography|fotografia)\b/gi, tag: 'Hobby_Photographie' }
            ],
            category: 'LIFESTYLE'
        },
        // Voyages
        travel: {
            patterns: [
                { regex: /\b(voyage|travel|viaggio|viaja?|reise).{0,30}(fréquent|constant|frequent|häufig)/gi, tag: 'Voyage_Fréquent' },
                { regex: /\b(safari)\b/gi, tag: 'Voyage_Safari' },
                { regex: /\b(croisière|cruise|crucero|crociera|kreuzfahrt)/gi, tag: 'Voyage_Croisière' },
                { regex: /\b(fashion week|défilé|sfilata|desfile|modenschau)/gi, tag: 'Voyage_Fashion_Week' },
                { regex: /\b(conférence|conference|congreso|conferenza|konferenz)/gi, tag: 'Voyage_Conférences' }
            ],
            category: 'LIFESTYLE'
        },
        // Allergies (légitimes pour le service)
        allergies: {
            patterns: [
                { regex: /allerg.{0,10}(nickel|niquel)/gi, tag: 'Allergie_Nickel' },
                { regex: /allerg.{0,10}(latex)/gi, tag: 'Allergie_Latex' },
                { regex: /allerg.{0,10}(arachide|peanut|cacahuète|maní)/gi, tag: 'Allergie_Arachides' },
                { regex: /allerg.{0,10}(gluten|coeliaque|celiac)/gi, tag: 'Allergie_Gluten' },
                { regex: /allerg.{0,10}(crustacé|shellfish|crostacei)/gi, tag: 'Allergie_Crustacés' },
                { regex: /allerg.{0,10}(pollen)/gi, tag: 'Allergie_Pollen' },
                { regex: /intolérance.{0,10}(lactose)/gi, tag: 'Intolérance_Lactose' }
            ],
            category: 'ALLERGIES_SERVICE'
        },
        // Occasions
        occasions: {
            patterns: [
                { regex: /\b(anniversaire|birthday|compleanno|cumpleaños|geburtstag)\b/gi, tag: 'Occasion_Anniversaire' },
                { regex: /\b(mariage|wedding|matrimonio|boda|hochzeit)\b/gi, tag: 'Occasion_Mariage' },
                { regex: /\b(cadeau|gift|regalo|geschenk)\b/gi, tag: 'Occasion_Cadeau' },
                { regex: /\b(noël|christmas|navidad|natale|weihnachten)/gi, tag: 'Occasion_Noël' },
                { regex: /\b(saint.?valentin|valentine)/gi, tag: 'Occasion_Saint_Valentin' }
            ],
            category: 'OCCASIONS'
        },
        // Follow-up
        followup: {
            patterns: [
                { regex: /\b(rappeler|follow.?up|richiama|llamar|anrufen).{0,20}(janvier|january|enero|gennaio|januar)/gi, tag: 'Followup_Janvier' },
                { regex: /\b(rappeler|follow.?up|richiama|llamar).{0,20}(février|february|febrero|febbraio|februar)/gi, tag: 'Followup_Février' },
                { regex: /\b(rappeler|follow.?up|richiama|llamar).{0,20}(mars|march|marzo|märz)/gi, tag: 'Followup_Mars' },
                { regex: /\b(rappeler|follow.?up|richiama|llamar).{0,20}(avril|april|aprile|abril)/gi, tag: 'Followup_Avril' },
                { regex: /\b(rappeler|follow.?up|richiama|llamar).{0,20}(mai|may|maggio|mayo)/gi, tag: 'Followup_Mai' },
                { regex: /\b(rappeler|follow.?up|richiama|llamar).{0,20}(juin|june|giugno|junio|juni)/gi, tag: 'Followup_Juin' },
                { regex: /\b(preview|avant.?première|anteprima)/gi, tag: 'Followup_Preview' },
                { regex: /\b(hebdomadaire|weekly|semanal|settimanale|wöchentlich)/gi, tag: 'Followup_Hebdo' }
            ],
            category: 'FOLLOW_UP'
        },
        // Network/Influence
        network: {
            patterns: [
                { regex: /\b(\d{3,})k?\s*(followers|abonnés|seguidores|follower|anhänger)/gi, tag: 'Influence_Social_Media' },
                { regex: /\b(référ|refer|empfehl|raccoman).{0,20}(ami|friend|amigo|amici|freund)/gi, tag: 'Potentiel_Référencement' },
                { regex: /\b(réseau|network|red|rete|netzwerk).{0,20}(excellent|exceptionnel|excepcional|eccellente)/gi, tag: 'Network_Excellent' }
            ],
            category: 'NETWORK'
        },
        // Intérêts produit
        interests: {
            patterns: [
                { regex: /\b(durabilité|sustainability|sostenibilidad|sostenibilità|nachhaltigkeit)/gi, tag: 'Intérêt_Durabilité' },
                { regex: /\b(artisanat|craftsmanship|artigianato|artesanía|handwerk)/gi, tag: 'Intérêt_Artisanat' },
                { regex: /\b(édition limitée|limited edition|edición limitada|edizione limitata)/gi, tag: 'Intérêt_Édition_Limitée' },
                { regex: /\b(innovation|innovación|innovazione)/gi, tag: 'Intérêt_Innovation' },
                { regex: /\b(histoire|history|historia|storia|geschichte)/gi, tag: 'Intérêt_Histoire' }
            ],
            category: 'INTÉRÊTS'
        }
    },

    extractTags(text) {
        if (!text) return [];
        const tags = [];

        for (const [groupName, group] of Object.entries(this.patterns)) {
            for (const pattern of group.patterns) {
                if (pattern.regex.test(text)) {
                    pattern.regex.lastIndex = 0;
                    if (!tags.find(t => t.tag === pattern.tag)) {
                        tags.push({ tag: pattern.tag, category: group.category, group: groupName });
                    }
                }
            }
        }

        return tags;
    },

    async processData(data, progressCallback = null) {
        this.stats = { totalTags: 0, categories: {} };
        this.extractedTags = [];
        const results = [];
        const tagCounts = {};

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const text = row.cleanedText || row.Transcription || '';
            const tags = this.extractTags(text);

            tags.forEach(t => {
                const key = `${t.category}:${t.tag}`;
                tagCounts[key] = (tagCounts[key] || 0) + 1;
                if (!this.stats.categories[t.category]) this.stats.categories[t.category] = 0;
                this.stats.categories[t.category]++;
            });

            this.stats.totalTags += tags.length;

            results.push({ ...row, tags });

            if (progressCallback) progressCallback(80 + (i + 1) / data.length * 20, 'Extraction tags...');
        }

        this.extractedTags = Object.entries(tagCounts)
            .map(([key, count]) => {
                const [category, tag] = key.split(':');
                return { category, tag, count };
            })
            .sort((a, b) => b.count - a.count);

        return results;
    },

    getStats() { return { ...this.stats }; },
    getAllTags() { return this.extractedTags; }
};
