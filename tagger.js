/**
 * LVMH Voice-to-Tag - Module Tagger
 * Extraction de tags ultra-précis pour enrichir la taxonomie CRM
 * Basé sur le Guide d'Utilisation de la Taxonomie (taxo.pdf)
 */

const Tagger = {
    stats: { totalTags: 0, categories: {} },
    extractedTags: [],

    patterns: {
        // ==========================================
        // 1. PROFILS (Identity & Power)
        // ==========================================
        identity_genre: {
            patterns: [
                { regex: /\b(femme|woman|donna|mujer|frau)\b/gi, tag: 'Genre_Femme' },
                { regex: /\b(homme|man|uomo|hombre|mann)\b/gi, tag: 'Genre_Homme' },
                { regex: /\b(couple|pareja|coppia|paar)\b/gi, tag: 'Genre_Couple' },
                { regex: /\b(non[\s-]?binaire|non[\s-]?binary)\b/gi, tag: 'Genre_Non-Binaire' }
            ],
            category: 'PROFIL_GENRE'
        },
        identity_generation: {
            patterns: [
                { regex: /\b(gen z|zoommers?|<25|moins de 25)\b/gi, tag: 'Gen_Z' },
                { regex: /\b(millennial|y|25[\s-]?40)\b/gi, tag: 'Millennial' },
                { regex: /\b(gen x|40[\s-]?60)\b/gi, tag: 'Gen_X' },
                { regex: /\b(boomer|60[\s-]?80|60\+)\b/gi, tag: 'Boomer' },
                { regex: /\b(silent|80\+|plus de 80)\b/gi, tag: 'Silent_Generation' }
            ],
            category: 'PROFIL_GÉNÉRATION'
        },
        identity_status: {
            patterns: [
                { regex: /\b(prospect|potentiel)\b/gi, tag: 'Status_Prospect' },
                { regex: /\b(nouveau client|new client|première visite)\b/gi, tag: 'Status_Nouveau_Client' },
                { regex: /\b(occasionnel|parfois|rarement)\b/gi, tag: 'Status_Client_Occasionnel' },
                { regex: /\b(régulier|habituel|fidèle|regular)\b/gi, tag: 'Status_Client_Régulier' },
                { regex: /\b(vip|top client|très bon client)\b/gi, tag: 'Status_VIP' },
                { regex: /\b(vvip|top tier|elite)\b/gi, tag: 'Status_VVIP_Top_Tier' },
                { regex: /\b(dormant|inactif|pausé)\b/gi, tag: 'Status_Client_Dormant' },
                { regex: /\b(ancien|ex).{0,10}(top|vip|client)\b/gi, tag: 'Status_Ancien_Top_Client' }
            ],
            category: 'PROFIL_STATUS'
        },
        identity_langue: {
            patterns: [
                { regex: /\b(français|french)\b/gi, tag: 'Langue_Français' },
                { regex: /\b(anglais|english)\b/gi, tag: 'Langue_Anglais' },
                { regex: /\b(italien|italian)\b/gi, tag: 'Langue_Italien' },
                { regex: /\b(espagnol|spanish)\b/gi, tag: 'Langue_Espagnol' },
                { regex: /\b(allemand|german)\b/gi, tag: 'Langue_Allemand' },
                { regex: /\b(mandarin|chinese|chinois)\b/gi, tag: 'Langue_Mandarin' },
                { regex: /\b(japonais|japanese)\b/gi, tag: 'Langue_Japonais' },
                { regex: /\b(arabe|arabic)\b/gi, tag: 'Langue_Arabe' },
                { regex: /\b(russe|russian)\b/gi, tag: 'Langue_Russe' }
            ],
            category: 'PROFIL_LANGUE'
        },
        identity_influence: {
            patterns: [
                { regex: /\b(micro).{0,10}(influence|follower)\b/gi, tag: 'Influence_Micro' },
                { regex: /\b(macro).{0,10}(influence|follower)\b/gi, tag: 'Influence_Macro' },
                { regex: /\b(mega|million).{0,10}(influence|follower)\b/gi, tag: 'Influence_Mega' },
                { regex: /\b(célébrité|star|famous|mondiale)\b/gi, tag: 'Influence_Célébrité_Mondiale' },
                { regex: /\b(opinion|b2b|linkedin).{0,10}(leader|expert)\b/gi, tag: 'Influence_Leader_Opinion_B2B' }
            ],
            category: 'PROFIL_INFLUENCE'
        },
        identity_digital: {
            patterns: [
                { regex: /\b(instagram|insta)\b/gi, tag: 'Digital_Instagram' },
                { regex: /\b(tiktok)\b/gi, tag: 'Digital_TikTok' },
                { regex: /\b(linkedin)\b/gi, tag: 'Digital_LinkedIn' },
                { regex: /\b(twitch)\b/gi, tag: 'Digital_Twitch' },
                { regex: /\b(crypto|web3|native)\b/gi, tag: 'Digital_Crypto_Native' }
            ],
            category: 'PROFIL_DIGITAL'
        },

        // ==========================================
        // PROFESSION & EXPERTISE
        // ==========================================
        pro_sante: {
            patterns: [
                { regex: /\b(chirurgien|surgeon).{0,20}(cardi|thorac)/gi, tag: 'Chirurgien_Cardiothoracique' },
                { regex: /\b(chirurgien|surgeon).{0,20}(ortho)/gi, tag: 'Chirurgien_Orthopédique' },
                { regex: /\b(chirurgien|surgeon).{0,20}(maxillo|facial)/gi, tag: 'Chirurgien_Maxillo_Facial' },
                { regex: /\b(chirurgien|surgeon).{0,20}(esthétique|plastique)/gi, tag: 'Chirurgien_Esthetique' },
                // Fallback Niveau 2
                { regex: /\b(chirurgien|surgeon)\b/gi, tag: 'Chirurgien_Général' },

                { regex: /\b(neurologue|neurologist)\b/gi, tag: 'Médecin_Spé_Neurologue' },
                { regex: /\b(cardiologue|cardiologist)\b/gi, tag: 'Médecin_Spé_Cardiologue' },
                { regex: /\b(dermatologue|dermatologist)\b/gi, tag: 'Médecin_Spé_Dermatologue' },
                { regex: /\b(dentiste|orthodontiste)\b/gi, tag: 'Médecin_Spé_Dentiste' },
                // Fallback Niveau 2
                { regex: /\b(médecin|doctor|spécialiste)\b/gi, tag: 'Médecin_Spécialiste' },

                { regex: /\b(pharmacien).{0,10}(titulaire|owner)|\btitulaire\b/gi, tag: 'Pharma_Titulaire' },
                { regex: /\b(chercheur|researcher).{0,10}(bio|tech)\b/gi, tag: 'Pharma_Chercheur_Biotech' }
            ],
            category: 'PROFESSION_SANTÉ',
            // Fallbacks Level 2
            fallbacks: [
                { regex: /\b(chirurgien|surgeon)\b/gi, tag: 'Chirurgien_Général' },
                { regex: /\b(médecin|doctor|spécialiste|cardiologue|neurologue|dermatologue|dentiste|orthodontiste)\b/gi, tag: 'Médecin_Spécialiste_Général' },
                { regex: /\b(pharma|pharmacien|chercheur)\b/gi, tag: 'Pharmacie_Générale' },
                { regex: /\b(chirurgien|surgeon|médecin|doctor|cardiologue|neurologue|dermatologue|dentiste|pharmacien|chercheur)\b/gi, tag: 'Profession_Santé_Médecine' }
            ]
        },
        pro_finance: {
            patterns: [
                { regex: /\b(hedge fund|fonds spéculatif)\b/gi, tag: 'Marchés_Hedge_Fund_Manager' },
                { regex: /\b(trader).{0,20}(forex|commo|matières)\b/gi, tag: 'Marchés_Trader' },
                { regex: /\b(asset manager|gestionnaire d'actifs)\b/gi, tag: 'Marchés_Asset_Manager' },

                { regex: /\b(private equity|capital investissement)\b/gi, tag: 'Capital_Partner_PE' },
                { regex: /\b(vc|venture capital|capital risque)\b/gi, tag: 'Capital_Venture_Capitalist' },
                { regex: /\b(angel|investisseur).{0,10}(angel|business)\b/gi, tag: 'Capital_Angel_Investor' },

                { regex: /\b(banquier|banker).{0,10}(m&a|fusion|acquis)/gi, tag: 'Banque_Investment_Banker' },
                { regex: /\b(banquier|banker|gestion).{0,10}(privé|private|wealth|fortune)/gi, tag: 'Banque_Wealth_Manager' },

                { regex: /\b(crypto|bitcoin).{0,10}(whale|gros)/gi, tag: 'Fintech_Crypto_Whale' },
                { regex: /\b(expert|consultant).{0,10}(blockchain|nft)/gi, tag: 'Fintech_Expert_Blockchain' }
            ],
            category: 'PROFESSION_FINANCE',
            fallbacks: [
                { regex: /\b(marché|market|trader|bourse|stock)\b/gi, tag: 'Marchés_Financiers_Général' },
                { regex: /\b(capital|investis|investor)\b/gi, tag: 'Capital_Investissement_Général' },
                { regex: /\b(banque|bank|bancaire)\b/gi, tag: 'Banque_Générale' },
                { regex: /\b(fintech|crypto|blockchain)\b/gi, tag: 'Fintech_Générale' }
            ]
        },
        pro_legal: {
            patterns: [
                { regex: /\b(avocate?).{0,20}(m&a|corporate|affaires)/gi, tag: 'Avocature_M&A_Corporate' },
                { regex: /\b(avocate?).{0,20}(pi|propriété|intellectuelle)/gi, tag: 'Avocature_PI' },
                { regex: /\b(avocate?).{0,20}(famille|divorce)/gi, tag: 'Avocature_Droit_Famille' },
                { regex: /\b(avocate?).{0,20}(droits|homme|ong)/gi, tag: 'Avocature_Droits_Homme' },

                { regex: /\b(magistrat|juge|judge)\b/gi, tag: 'Institutionnel_Magistrat' },
                { regex: /\b(notaire)\b/gi, tag: 'Institutionnel_Notaire' },
                { regex: /\b(commissaire priseur)\b/gi, tag: 'Institutionnel_Commissaire_Priseur' }
            ],
            category: 'PROFESSION_LÉGAL',
            fallbacks: [
                { regex: /\b(avocate?|lawyer|barreau)\b/gi, tag: 'Avocature_Générale' },
                { regex: /\b(magistrat|juge|notaire|huissier)\b/gi, tag: 'Institutionnel_Général' },
                { regex: /\b(avocate?|droit|juriste|legal|magistrat|juge|notaire)\b/gi, tag: 'Profession_Juridique_Générale' }
            ]
        },
        pro_creatif: {
            patterns: [
                { regex: /\b(galeriste)\b/gi, tag: 'ArtMarket_Galeriste' },
                { regex: /\b(curateur|musée)\b/gi, tag: 'ArtMarket_Curateur' },
                { regex: /\b(consultant|advisor).{0,10}(art)\b/gi, tag: 'ArtMarket_Consultant_Advisor' },

                { regex: /\b(architecte).{0,10}(dplg)\b/gi, tag: 'Design_Architecte_DPLG' },
                { regex: /\b(designer|décorateur).{0,10}(intérieur)/gi, tag: 'Design_Designer_Intérieur' },
                { regex: /\b(paysagiste)\b/gi, tag: 'Design_Paysagiste' },

                { regex: /\b(chef|orchestre|conductor)\b/gi, tag: 'Performance_Chef_Orchestre' },
                { regex: /\b(soliste|concertiste)\b/gi, tag: 'Performance_Soliste_Classique' },
                { regex: /\b(producteur).{0,10}(cinéma|film)\b/gi, tag: 'Performance_Producteur_Cinema' },
                { regex: /\b(agent).{0,10}(artistique|talent)\b/gi, tag: 'Performance_Agent_Artistique' }
            ],
            category: 'PROFESSION_CRÉATIF',
            fallbacks: [
                { regex: /\b(art|galerie|curat|musée)\b/gi, tag: 'Art_Market_Général' },
                { regex: /\b(design|archi|déco)\b/gi, tag: 'Design_Archi_Général' },
                { regex: /\b(musique|cinéma|film|théâtre|spectacle)\b/gi, tag: 'Performance_Arts_Général' }
            ]
        },
        pro_business: {
            patterns: [
                { regex: /\b(ceo|dirigeant|dg)\b/gi, tag: 'Leadership_CEO_Dirigeant' },
                { regex: /\b(board|conseil).{0,10}(administration|membre)\b/gi, tag: 'Leadership_Board_Member' },
                { regex: /\b(fondateur|founder).{0,10}(family office)\b/gi, tag: 'Leadership_Fondateur_Family_Office' },

                { regex: /\b(immobilier|développeur).{0,10}(luxe|prestige)\b/gi, tag: 'Secteurs_Immobilier_Luxe' },
                { regex: /\b(tech|startup).{0,10}(founder|fondateur)\b/gi, tag: 'Secteurs_Tech_Founder' },
                { regex: /\b(pr|relation).{0,10}(presse|public|fashion)\b/gi, tag: 'Secteurs_Fashion_PR' }
            ],
            category: 'PROFESSION_BUSINESS'
        },
        pro_public: {
            patterns: [
                { regex: /\b(diplomate|ambassadeur)\b/gi, tag: 'Public_Diplomate_Ambassadeur' },
                { regex: /\b(athlète|sportif).{0,10}(pro|haut niveau)\b/gi, tag: 'Public_Athlète_Pro' },
                { regex: /\b(politique|ministre|député|sénateur)\b/gi, tag: 'Public_Politique' }
            ],
            category: 'PROFESSION_PUBLIC'
        },

        // ==========================================
        // 2. INTÉRÊTS & CERCLES (Passion Points)
        // ==========================================
        passions_cercles: {
            patterns: [
                { regex: /\b(racing club|lagardère|polo de paris)/gi, tag: 'Clubs_Sportifs_Prestige_Paris' },
                { regex: /\b(queens|hurlingham|mcc|lords|wentworth)/gi, tag: 'Clubs_Sportifs_Prestige_UK' },
                { regex: /\b(soho house|cercle interallié|arts club)\b/gi, tag: 'Clubs_Sociaux_Arts' },
                { regex: /\b(yacht club|monaco|ycm)/gi, tag: 'Réseaux_Exclusifs_Yachting' },
                { regex: /\b(alumni|ancien).{0,10}(ivy|harvard|yale|columbia)/gi, tag: 'Réseaux_Exclusifs_Ivy_League' },
                { regex: /\b(alumni|ancien).{0,10}(hec|polytechnique|ena|essec)/gi, tag: 'Réseaux_Exclusifs_Grandes_Ecoles' }
            ],
            category: 'PASSION_CERCLES'
        },
        passions_collection: {
            patterns: [
                { regex: /\b(montre|watch).{0,10}(vintage|ancienne)/gi, tag: 'Horlogerie_Vintage' },
                { regex: /\b(montre|watch).{0,10}(complication)/gi, tag: 'Horlogerie_Complications' },
                { regex: /\b(patek|rolex).{0,10}(collector|collection)/gi, tag: 'Horlogerie_Patek_Rolex' },

                { regex: /\b(livre|manuscrit).{0,10}(rare|ancien|précieux)/gi, tag: 'Bibliophilie_Rares' },
                { regex: /\b(carte).{0,10}(géographique|ancienne)/gi, tag: 'Bibliophilie_Cartes' },

                { regex: /\b(art).{0,10}(contemporain)/gi, tag: 'Art_Contemporain' },
                { regex: /\b(maître|master).{0,10}(ancien)/gi, tag: 'Art_Maîtres_Anciens' },
                { regex: /\b(photo).{0,10}(art|fine)/gi, tag: 'Art_Photographie' },
                { regex: /\b(nft|digital art)\b/gi, tag: 'Art_NFT' },

                { regex: /\b(bordeaux|grand cru)\b/gi, tag: 'Vins_Grands_Crus_Bordeaux' },
                { regex: /\b(bourgogne).{0,10}(rare|romanée)/gi, tag: 'Vins_Bourgogne_Rare' },
                { regex: /\b(whisky).{0,10}(japonais|yamazaki)/gi, tag: 'Vins_Whisky_Japonais' },
                { regex: /\b(cognac).{0,10}(prestige|louis xiii)/gi, tag: 'Vins_Cognac_Prestige' }
            ],
            category: 'PASSION_COLLECTION'
        },
        passions_sport: {
            patterns: [
                { regex: /\b(tennis).{0,10}(compétition|tournoi)|(compétition|tournoi).{0,10}(tennis)\b/gi, tag: 'Raquette_Tennis_Compétition' },
                { regex: /\b(padel)\b/gi, tag: 'Raquette_Padel' },
                { regex: /\b(squash)\b/gi, tag: 'Raquette_Squash' },
                { regex: /\b(real tennis|jeu de paume)\b/gi, tag: 'Raquette_Real_Tennis' },

                { regex: /\b(golf).{0,15}(handicap|bas| <10)\b/gi, tag: 'Golf_Handicap_Bas' },
                { regex: /\b(golf).{0,15}(collection|matériel)\b/gi, tag: 'Golf_Collectionneur_Matériel' },

                { regex: /\b(yacht|superyacht).{0,10}(propriétaire|owner)/gi, tag: 'Nautisme_Propriétaire_Superyacht' },
                { regex: /\b(voile|régate|sailing)\b/gi, tag: 'Nautisme_Voile_Régate' },
                { regex: /\b(kitesurf|kite)\b/gi, tag: 'Nautisme_Kitesurf' },
                { regex: /\b(surf).{0,10}(big|gros|wave|vague)/gi, tag: 'Nautisme_Surf_Big_Wave' },

                { regex: /\b(triathlon|ironman)\b/gi, tag: 'Endurance_Triathlon_Ironman' },
                { regex: /\b(marathon).{0,10}(major|six|6)/gi, tag: 'Endurance_Marathon_Six_Majors' },
                { regex: /\b(alpinisme|himalaya|sommet)\b/gi, tag: 'Endurance_Alpinisme' },

                // Allow generic Yoga if Ashtanga not specified (User wants max tags)
                { regex: /\b(yoga).{0,10}(ashtanga|vinyasa)|\b(yoga)\b/gi, tag: 'Bien-être_Yoga_Ashtanga' },
                { regex: /\b(pilates).{0,10}(reformer)/gi, tag: 'Bien-être_Pilates_Reformer' },
                { regex: /\b(méditation|pleine conscience)\b/gi, tag: 'Bien-être_Méditation' },

                { regex: /\b(pilote|driver).{0,10}(gentleman|amateur)/gi, tag: 'Mécanique_Pilote_Gentleman' },
                { regex: /\b(collection).{0,10}(ferrari|porsche)/gi, tag: 'Mécanique_Collectionneur_Ferrari' },
                { regex: /\b(f1|paddock)\b/gi, tag: 'Mécanique_F1_Paddock_Club' }
            ],
            category: 'PASSION_SPORT',
            fallbacks: [
                { regex: /\b(tennis|padel|squash|raquette)\b/gi, tag: 'Sport_Raquette_Général' },
                { regex: /\b(golf)\b/gi, tag: 'Sport_Golf_Général' },
                { regex: /\b(voile|bateau|nautisme|surf|mer)\b/gi, tag: 'Sport_Nautisme_Général' },
                { regex: /\b(course|running|marathon|triathlon|vélo|cyclisme)\b/gi, tag: 'Sport_Endurance_Général' },
                { regex: /\b(yoga|pilates|meditation|bien-être)\b/gi, tag: 'Sport_Bien_être_Général' },
                { regex: /\b(auto|moto|f1|course|mecanique)\b/gi, tag: 'Sport_Mécanique_Général' }
            ]
        },
        passions_culture: {
            patterns: [
                { regex: /\b(ukiyo|estampe|japon)\b/gi, tag: 'ArtVisuel_Ukiyo-e' },
                { regex: /\b(minimalis)\b/gi, tag: 'ArtVisuel_Minimalisme' },
                { regex: /\b(wabi sabi)\b/gi, tag: 'ArtVisuel_Wabi-Sabi' },
                { regex: /\b(bauhaus)\b/gi, tag: 'ArtVisuel_Bauhaus' },
                { regex: /\b(art déco|déco)\b/gi, tag: 'ArtVisuel_Art_Déco' },

                { regex: /\b(opéra|bayreuth|wagner)\b/gi, tag: 'Musique_Opéra' },
                { regex: /\b(symphoni|classique)\b/gi, tag: 'Musique_Symphonique' },
                { regex: /\b(jazz).{0,10}(festival|montreux)/gi, tag: 'Musique_Jazz_Festival' },

                { regex: /\b(michelin|étoilé|starred)\b/gi, tag: 'Gastronomie_Chasseur_Etoiles' },
                { regex: /\b(kaiseki)\b/gi, tag: 'Gastronomie_Cuisine_Kaiseki' },
                { regex: /\b(chef).{0,10}(domicile|privé)/gi, tag: 'Gastronomie_Chef_Domicile' },

                { regex: /\b(botanique|orchidée)\b/gi, tag: 'Nature_Botanique' },
                { regex: /\b(paysagisme|jardin).{0,10}(japonais)/gi, tag: 'Nature_Paysagisme_Japonais' }
            ],
            category: 'PASSION_CULTURE',
            fallbacks: [
                { regex: /\b(art|peinture|sculpture|visuel)\b/gi, tag: 'Culture_Art_Visuel_Général' },
                { regex: /\b(musique|concert|opéra|jazz)\b/gi, tag: 'Culture_Musique_Générale' },
                { regex: /\b(cuisine|gastro|repas|food)\b/gi, tag: 'Culture_Gastronomie_Générale' },
                { regex: /\b(nature|jardin|fleur|botanique)\b/gi, tag: 'Culture_Nature_Générale' }
            ]
        },
        valeurs: {
            patterns: [
                { regex: /\b(écologie|durabilité|sustainab)\b/gi, tag: 'Valeurs_Durabilité' },
                { regex: /\b(zéro déchet|vrac)\b/gi, tag: 'Valeurs_Zéro_Déchet' },
                { regex: /\b(upcycling)\b/gi, tag: 'Valeurs_Upcycling' },
                { regex: /\b(vegan).{0,10}(strict)\b/gi, tag: 'Valeurs_Vegan_Strict' },
                { regex: /\b(cruelty free|sans cruauté)\b/gi, tag: 'Valeurs_Cruelty_Free' },
                { regex: /\b(artisanat|métier d'art)\b/gi, tag: 'Valeurs_Artisanat' },
                { regex: /\b(transmission|héritage)\b/gi, tag: 'Valeurs_Transmission' },
                { regex: /\b(made in france)\b/gi, tag: 'Valeurs_Made_In_France' },
                { regex: /\b(web3|ownership)\b/gi, tag: 'Valeurs_Tech_Web3' },
                { regex: /\b(transhumanisme|bio-hacking)\b/gi, tag: 'Valeurs_Tech_Transhumanisme' },
                { regex: /\b(philanthropie|mécénat)\b/gi, tag: 'Valeurs_Société_Philanthropie' },
                { regex: /\b(inclusivité|diversité)\b/gi, tag: 'Valeurs_Société_Inclusivité' },
                { regex: /\b(droits humains)\b/gi, tag: 'Valeurs_Société_Droits_Humains' }
            ],
            category: 'VALEURS_ÉTHIQUE'
        },

        // ==========================================
        // 3. VOYAGE (Travel)
        // ==========================================
        voyage_type: {
            patterns: [
                { regex: /\b(loisir|resort|palace|maldives|seychelles|polynésie).{0,10}(luxe)?\b/gi, tag: 'Voyage_Loisir_Luxe' },
                { regex: /\b(aventure|safari|nature)\b/gi, tag: 'Voyage_Aventure_Nature' },
                { regex: /\b(bien-être|retraite|detox)\b/gi, tag: 'Voyage_Bien_être' },
                { regex: /\b(culturel|tour|musée)\b/gi, tag: 'Voyage_Culturel' },
                { regex: /\b(business|roadshow|pro)\b/gi, tag: 'Voyage_Business' }
            ],
            category: 'VOYAGE_TYPE'
        },
        voyage_dest: {
            patterns: [
                { regex: /\b(japon|tokyo|kyoto|corée|séoul|bali|australie)\b/gi, tag: 'Dest_Asie_Pacifique' },
                { regex: /\b(nyc|miami|aspen|st barth|patagonie)\b/gi, tag: 'Dest_Amériques' },
                { regex: /\b(londres|paris|côte d'azur|alpes|suisse|italie|toscane)\b/gi, tag: 'Dest_Europe' },
                { regex: /\b(dubaï|marrakech|le cap|safari)\b/gi, tag: 'Dest_Afrique_Moyen_Orient' }
            ],
            category: 'VOYAGE_DESTINATION'
        },

        // ==========================================
        // 4. INTENTION D'ACHAT (Sales Context)
        // ==========================================
        achat_destinataire: {
            patterns: [
                { regex: /\b(pour soi|moi|me faire plaisir)\b/gi, tag: 'Dest_Intime_Pour_Soi' },
                { regex: /\b(pour|sa|son|cadeau).{0,10}(conjoint|mari|époux|épouse)\b/gi, tag: 'Dest_Intime_Pour_Conjoint' },
                { regex: /\b(pour).{0,10}(sa femme|son homme)\b/gi, tag: 'Dest_Intime_Pour_Conjoint' },
                { regex: /\b(amant|maitresse)\b/gi, tag: 'Dest_Intime_Pour_Amant' },
                { regex: /\b(parent|mère|père)\b/gi, tag: 'Dest_Famille_Pour_Parents' },
                { regex: /\b(enfant|fils|fille)\b/gi, tag: 'Dest_Famille_Pour_Enfant' },
                { regex: /\b(ado|teen).{0,10}(premier luxe)\b/gi, tag: 'Dest_Famille_Pour_Ado_First_Luxury' },
                { regex: /\b(petit-enfant)\b/gi, tag: 'Dest_Famille_Pour_Petit_Enfant' },
                { regex: /\b(assistant|pa)\b/gi, tag: 'Dest_Pro_Pour_Assistant' },
                { regex: /\b(client|vip).{0,10}(cadeau)\b/gi, tag: 'Dest_Pro_Pour_Client_VIP' },
                { regex: /\b(employé|staff)\b/gi, tag: 'Dest_Pro_Pour_Employé' },
                { regex: /\b(hote|hotesse|invitation)\b/gi, tag: 'Dest_Social_Pour_Hôte' },
                { regex: /\b(mariés|wedding list)\b/gi, tag: 'Dest_Social_Pour_Mariés' }
            ],
            category: 'INTENTION_DESTINATAIRE'
        },
        achat_occasion: {
            patterns: [
                { regex: /\b(anniversaire|marquant|18|20|30|40|50|60)\b/gi, tag: 'Occasion_Anniversaire_Marquant' },
                { regex: /\b(naissance|babyshower)\b/gi, tag: 'Occasion_Naissance' },
                { regex: /\b(mariage|divorce)\b/gi, tag: 'Occasion_Mariage_Divorce' },
                { regex: /\b(premier job|embauche)\b/gi, tag: 'Occasion_Carrière_Premier_Job' },
                { regex: /\b(promotion|bonus)\b/gi, tag: 'Occasion_Carrière_Promotion' },
                { regex: /\b(retraite)\b/gi, tag: 'Occasion_Carrière_Retraite' },
                { regex: /\b(vente|exit).{0,10}(entreprise)\b/gi, tag: 'Occasion_Carrière_Exit_Vente' },
                { regex: /\b(diplomation|diplôme)\b/gi, tag: 'Occasion_Carrière_Diplomation' },
                { regex: /\b(noël|fin d'année|fêtes)\b/gi, tag: 'TempsFort_Cadeaux_Fin_Année' },
                { regex: /\b(renouveau|nouvel an|cny)\b/gi, tag: 'TempsFort_Célébration_Renouveau' },
                { regex: /\b(ramadan|eid|diwali)\b/gi, tag: 'TempsFort_Traditionnel' },
                { regex: /\b(saint valentin|romantique)\b/gi, tag: 'TempsFort_Occasion_Romantique' },
                { regex: /\b(fête des mères|pères)\b/gi, tag: 'TempsFort_Célébration_Parentale' },
                { regex: /\b(impulsion|coup de tête)\b/gi, tag: 'Plaisir_Impulsion' },
                { regex: /\b(thérapie|moral)\b/gi, tag: 'Plaisir_Shopping_Thérapie' },
                { regex: /\b(souvenir|voyage)\b/gi, tag: 'Plaisir_Souvenir' }
            ],
            category: 'INTENTION_OCCASION'
        },
        achat_style: {
            patterns: [
                { regex: /\b(classique|classic)\b/gi, tag: 'Style_Classique' },
                { regex: /\b(moderne|modern)\b/gi, tag: 'Style_Moderne' },
                { regex: /\b(trendy|tendance)\b/gi, tag: 'Style_Trendy' },
                { regex: /\b(logo|monogram)\b/gi, tag: 'Style_Logo' },
                { regex: /\b(quiet|discret)\b/gi, tag: 'Style_Quiet_Luxury' }
            ],
            category: 'INTENTION_STYLE'
        },

        // ==========================================
        // 5. SÉCURITÉ & HOSPITALITY (Risk Management)
        // ==========================================
        securite_risque: {
            patterns: [
                { regex: /\b(arachide|cacahuète)s?\b/gi, tag: 'Anaphylaxie_Arachides' },
                { regex: /\b(fruit à coque|noisette|noix|nut)s?\b/gi, tag: 'Anaphylaxie_Fruits_Coque' },
                { regex: /\b(crustacé|fruit de mer|shellfish)s?\b/gi, tag: 'Anaphylaxie_Crustacés' },
                { regex: /\b(latex)\b/gi, tag: 'Contact_Latex' },
                { regex: /\b(nickel)\b/gi, tag: 'Contact_Nickel' },
                { regex: /\b(laine|mohair|alpaga)\b/gi, tag: 'Contact_Laine' },
                { regex: /\b(parfum|fragrance)\b/gi, tag: 'Environnement_Parfum' },
                { regex: /\b(poussière|acarien)s?\b/gi, tag: 'Environnement_Poussière' },
                { regex: /\b(fleur|pollen)s?\b/gi, tag: 'Environnement_Fleurs' },
                { regex: /\b(soleil|photo|sensib).{0,20}(lumière)\b/gi, tag: 'Environnement_Photosensibilité' }
            ],
            category: 'SÉCURITÉ_RISQUE'
        },
        securite_pref_alim: {
            patterns: [
                { regex: /\b(végan|végétalien).{0,10}(strict)\b/gi, tag: 'Régime_Végétalien_Strict' },
                { regex: /\b(végétarien)\b/gi, tag: 'Régime_Végétarien' },
                { regex: /\b(pescatarien)\b/gi, tag: 'Régime_Pescatarien' },
                { regex: /\b(porc).{0,10}(sans|pas)\b/gi, tag: 'Régime_Sans_Porc' },
                { regex: /\b(alcool).{0,10}(sans|pas|cuisine)\b/gi, tag: 'Régime_Sans_Alcool_Cuisine' },
                { regex: /\b(céliaque|gluten).{0,10}(sans|free|intoléran)\b/gi, tag: 'Santé_Céliaque_Sans_Gluten' },
                { regex: /\b(lactose|lait).{0,20}(sans|intoléran)|(intoléran).{0,20}(lactose|lait)\b/gi, tag: 'Santé_Sans_Lactose' },
                { regex: /\b(diabète|diabétique)\b/gi, tag: 'Santé_Diabétique' },
                { regex: /\b(keto|cétogène)\b/gi, tag: 'Santé_Keto' },
                { regex: /\b(alcool).{0,10}(zero|0|teetotaler)\b/gi, tag: 'Boissons_Teetotaler_Zero_Alcool' },
                { regex: /\b(champagne).{0,10}(amateur)\b/gi, tag: 'Boissons_Amateur_Champagne' },
                { regex: /\b(thé|matcha).{0,10}(amateur)\b/gi, tag: 'Boissons_Amateur_Thé_Matcha' },
                { regex: /\b(eau).{0,10}(tempérée|ambiante)\b/gi, tag: 'Boissons_Eau_Tempérée' }
            ],
            category: 'SÉCURITÉ_ALIM'
        },
        securite_confort: {
            patterns: [
                { regex: /\b(fauteuil roulant|pmr)\b/gi, tag: 'Mobilité_Fauteuil_Roulant' },
                { regex: /\b(marche|escalier).{0,10}(difficile)\b/gi, tag: 'Mobilité_Difficulté_Marche' },
                { regex: /\b(assise|asseoir).{0,10}(besoin)\b/gi, tag: 'Mobilité_Besoin_Assise' },
                { regex: /\b(entrée privée)\b/gi, tag: 'Privacy_Entrée_Privée' },
                { regex: /\b(salon isolé|privé)\b/gi, tag: 'Privacy_Salon_Isolé' },
                { regex: /\b(photo).{0,10}(pas|no|interdit)\b/gi, tag: 'Privacy_Pas_de_Photos' }
            ],
            category: 'SÉCURITÉ_CONFORT'
        },

        // ==========================================
        // 6. L'UNIVERS LOUIS VUITTON
        // ==========================================
        univers_lv: {
            patterns: [
                { regex: /\b(monogram).{0,20}(fan|aime|love|adore)\b/gi, tag: 'Profil_Amoureux_Monogram' },
                { regex: /\b(damier).{0,20}(fan|aime|love|adore)\b/gi, tag: 'Profil_Fan_Damier' },
                { regex: /\b(exotique|croco|python)\b/gi, tag: 'Profil_Cuirs_Exotiques' },
                { regex: /\b(haute horlogerie)\b/gi, tag: 'Profil_Haute_Horlogerie' },
                { regex: /\b(malle|coffret).{0,10}(propriétaire)\b/gi, tag: 'Profil_Propriétaire_Malles' },
                { regex: /\b(objets nomades|meuble)\b/gi, tag: 'Profil_Objets_Nomades' },
                { regex: /\b(multi).{0,10}(génération)\b/gi, tag: 'Relation_Multi-Générationnel' },
                { regex: /\b(commande spéciale|sur mesure)\b/gi, tag: 'Relation_Commande_Spéciale' },
                { regex: /\b(défilé|show).{0,10}(invité)\b/gi, tag: 'Relation_Invité_Défilé' },
                { regex: /\b(style|fan|aime).{0,20}(ghesquière)\b/gi, tag: 'Relation_Style_Ghesquière' },
                { regex: /\b(style|fan|aime).{0,20}(pharrell)\b/gi, tag: 'Relation_Style_Pharrell' }
            ],
            category: 'UNIVERS_LV'
        },

        // ==========================================
        // 7. HISTORIQUE & POSSESSIONS
        // ==========================================
        histo_maro_femme: {
            patterns: [
                { regex: /\b(neverfull)\b/gi, tag: 'Possède_Neverfull' },
                { regex: /\b(loop)\b/gi, tag: 'Possède_Loop' },
                { regex: /\b(diane)\b/gi, tag: 'Possède_Diane' },
                { regex: /\b(pochette métis|metis)\b/gi, tag: 'Possède_Pochette_Métis' },
                { regex: /\b(multi pochette)\b/gi, tag: 'Possède_Multi_Pochette' },
                { regex: /\b(capucines)\b/gi, tag: 'Possède_Capucines' },
                { regex: /\b(alma)\b/gi, tag: 'Possède_Alma' },
                { regex: /\b(speedy)\b/gi, tag: 'Possède_Speedy' },
                { regex: /\b(onthego)\b/gi, tag: 'Possède_OnTheGo' },
                { regex: /\b(petite malle)\b/gi, tag: 'Possède_Petite_Malle' },
                { regex: /\b(twist)\b/gi, tag: 'Possède_Twist' },
                { regex: /\b(coussin)\b/gi, tag: 'Possède_Coussin' },
                { regex: /\b(palm springs)\b/gi, tag: 'Possède_Palm_Springs' },
                { regex: /\b(zippy)\b/gi, tag: 'Possède_Zippy' },
                { regex: /\b(sarah)\b/gi, tag: 'Possède_Sarah' },
                { regex: /\b(victorine)\b/gi, tag: 'Possède_Victorine' },
                { regex: /\b(recto verso)\b/gi, tag: 'Possède_Recto_Verso' }
            ],
            category: 'HISTO_MARO_FEMME'
        },
        histo_maro_homme: {
            patterns: [
                { regex: /\b(christopher)\b/gi, tag: 'Possède_Christopher' },
                { regex: /\b(discovery)\b/gi, tag: 'Possède_Discovery' },
                { regex: /\b(dean)\b/gi, tag: 'Possède_Dean' },
                { regex: /\b(trio)\b/gi, tag: 'Possède_Trio' },
                { regex: /\b(district)\b/gi, tag: 'Possède_District' },
                { regex: /\b(s-lock|slock)\b/gi, tag: 'Possède_S-Lock' },
                { regex: /\b(pdv|porte-documents)\b/gi, tag: 'Possède_PDV' },
                { regex: /\b(discovery bumbag)\b/gi, tag: 'Possède_Discovery_Bumbag' },
                { regex: /\b(keepall xs)\b/gi, tag: 'Possède_Keepall_XS' },
                { regex: /\b(sac plat)\b/gi, tag: 'Possède_Sac_Plat' },
                { regex: /\b(pocket organizer)\b/gi, tag: 'Possède_Pocket_Organizer' },
                { regex: /\b(multiple)\b/gi, tag: 'Possède_Multiple' },
                { regex: /\b(brazza)\b/gi, tag: 'Possède_Brazza' }
            ],
            category: 'HISTO_MARO_HOMME'
        },
        histo_voyage: {
            patterns: [
                { regex: /\b(keepall)\b/gi, tag: 'Possède_Keepall' },
                { regex: /\b(horizon|valise)\b/gi, tag: 'Possède_Horizon' },
                { regex: /\b(malle courrier)\b/gi, tag: 'Possède_Malle_Courrier' },
                { regex: /\b(coffret montre)\b/gi, tag: 'Possède_Coffret_Montre' }
            ],
            category: 'HISTO_VOYAGE'
        },
        histo_sizing: {
            patterns: [
                { regex: /\b(taille).{0,5}(34)\b/gi, tag: 'Femme_Taille_34' },
                { regex: /\b(taille).{0,5}(36)\b/gi, tag: 'Femme_Taille_36' },
                { regex: /\b(taille).{0,5}(38)\b/gi, tag: 'Femme_Taille_38' },
                { regex: /\b(taille).{0,5}(40)\b/gi, tag: 'Femme_Taille_40' },
                { regex: /\b(taille).{0,5}(42)\b/gi, tag: 'Femme_Taille_42' },
                { regex: /\b(taille).{0,5}(48)\b/gi, tag: 'Homme_Taille_48' },
                { regex: /\b(taille).{0,5}(50)\b/gi, tag: 'Homme_Taille_50' },
                { regex: /\b(taille).{0,5}(52)\b/gi, tag: 'Homme_Taille_52' },
                { regex: /\b(pointure).{0,5}(36)\b/gi, tag: 'Pointure_36' },
                { regex: /\b(pointure).{0,5}(37)\b/gi, tag: 'Pointure_37' },
                { regex: /\b(pointure).{0,5}(38)\b/gi, tag: 'Pointure_38' },
                { regex: /\b(pointure).{0,5}(39)\b/gi, tag: 'Pointure_39' },
                { regex: /\b(pointure).{0,5}(40)\b/gi, tag: 'Pointure_40' },
                { regex: /\b(pointure).{0,5}(41)\b/gi, tag: 'Pointure_41' },
                { regex: /\b(pointure).{0,5}(42)\b/gi, tag: 'Pointure_42' },
                { regex: /\b(pointure).{0,5}(43)\b/gi, tag: 'Pointure_43' },
                { regex: /\b(pointure).{0,5}(44)\b/gi, tag: 'Pointure_44' }
            ],
            category: 'HISTO_SIZING'
        },
        histo_style: {
            patterns: [
                { regex: /\b(escarpin)\b/gi, tag: 'Possède_Escarpins' },
                { regex: /\b(sandale).{0,10}(talon)\b/gi, tag: 'Possède_Sandales_Talons' },
                { regex: /\b(mule|plat)\b/gi, tag: 'Possède_Sandales_Plates_Mules' },
                { regex: /\b(botte|bottine)\b/gi, tag: 'Possède_Bottes_Bottines' },
                { regex: /\b(sneaker).{0,10}(femme)\b/gi, tag: 'Possède_Sneakers_Femme' },
                { regex: /\b(ballerine|mocassin)\b/gi, tag: 'Possède_Ballerines_Mocassins' },
                { regex: /\b(sneaker).{0,10}(homme)\b/gi, tag: 'Possède_Sneakers_Homme' },
                { regex: /\b(soulier).{0,10}(ville)\b/gi, tag: 'Possède_Souliers_Ville' },
                { regex: /\b(mocassin).{0,10}(homme)\b/gi, tag: 'Possède_Mocassins_Homme' },
                { regex: /\b(lv trainer|trainer)\b/gi, tag: 'Possède_LV_Trainer' }
            ],
            category: 'HISTO_STYLE'
        },

        // ==========================================
        // 8. OPPORTUNITÉS & OPÉRATIONNEL
        // ==========================================
        opportunites: {
            patterns: [
                // Shadow Order - Raison Échec
                { regex: /\b(rupture|sold out)\b/gi, tag: 'Raison_Echec_Rupture_Mondiale' },
                { regex: /\b(waitlist|liste d'attente)\b/gi, tag: 'Raison_Echec_Waitlist_Fermée' },
                { regex: /\b(taille).{0,10}(indispo|pas de)\b/gi, tag: 'Raison_Echec_Taille_Indispo' },
                { regex: /\b(couleur).{0,10}(indispo|pas de)\b/gi, tag: 'Raison_Echec_Couleur_Indispo' },
                // Douleur Client
                { regex: /\b(déçu|déception)\b/gi, tag: 'Douleur_Déception_Dispo' },
                { regex: /\b(attente|frustration)\b/gi, tag: 'Douleur_Frustration_Attente' },
                { regex: /\b(retard).{0,15}(livraison)|(livraison).{0,15}(retard)\b/gi, tag: 'Douleur_Livraison_Retardée' },
                // Shadow Order - Femme Sacs
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(speedy|neverfull|alma|noé)\b/gi, tag: 'Shadow_Sacs_Icônes_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(épaule|croisé|bandoulière)\b/gi, tag: 'Shadow_Sacs_Épaule_Croisé_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(cabas|seau)\b/gi, tag: 'Shadow_Cabas_Seau_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(mini sac|sac à dos|petit sac)\b/gi, tag: 'Shadow_Mini_Sacs_Dos_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(exotique|croco|python)\b/gi, tag: 'Shadow_Cuirs_Exotiques' },
                // Shadow Order - Femme Petite Maro
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(portefeuille|compact)\b/gi, tag: 'Shadow_Portefeuilles_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(porte-carte|porte-monnaie)\b/gi, tag: 'Shadow_Porte_Cartes_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(pochette|accessoire de sac)\b/gi, tag: 'Shadow_Pochettes_Femme' },
                // Shadow Order - Femme PAP
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(manteau|veste|blazer)\b/gi, tag: 'Shadow_Manteaux_Vestes_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(robe|jupe)\b/gi, tag: 'Shadow_Robes_Jupes' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(haut|maille|t-shirt|pull)\b/gi, tag: 'Shadow_Hauts_Mailles_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(pantalon|denim|jean)\b/gi, tag: 'Shadow_Pantalons_Denim' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(maillot de bain|swimwear)\b/gi, tag: 'Shadow_Maillots_Bain' },
                // Shadow Order - Femme Souliers
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sneaker|archlight)\b/gi, tag: 'Shadow_Sneakers_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(bottine|botte)\b/gi, tag: 'Shadow_Bottes_Bottines' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(escarpin|mule)\b/gi, tag: 'Shadow_Escarpins_Mules' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sandale|compensée)\b/gi, tag: 'Shadow_Sandales_Femme' },
                // Shadow Order - Femme Accessoires
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(carré|foulard|bandeau|soie)\b/gi, tag: 'Shadow_Carrés_Soie' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(écharpe|châle)\b/gi, tag: 'Shadow_Écharpes_Châles' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(lunettes|soleil)\b/gi, tag: 'Shadow_Lunettes_Soleil' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(ceinture|belt)\b/gi, tag: 'Shadow_Ceintures' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(bijou|chapeau)\b/gi, tag: 'Shadow_Bijoux_Chapeaux' },
                // Shadow Order - Homme Sacs
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sac business|porte-documents)\b/gi, tag: 'Shadow_Sacs_Business_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sac à dos|sac banane|bumbag)\b/gi, tag: 'Shadow_Sacs_Dos_Banane_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(messenger|cabas)\b/gi, tag: 'Shadow_Messenger_Cabas_Homme' },
                // Shadow Order - Homme PAP
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(costume|blazer)\b/gi, tag: 'Shadow_Costumes_Blazers_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(blouson|ext[ée]rieur)\b/gi, tag: 'Shadow_Blousons_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(chemise|tricot)\b/gi, tag: 'Shadow_Chemises_Tricots_Homme' },
                // Shadow Order - Homme Souliers
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sneaker).{0,10}(homme)\b/gi, tag: 'Shadow_Sneakers_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(mocassin|soulier de ville)\b/gi, tag: 'Shadow_Mocassins_Ville_Homme' },
                // Shadow Order - Homme Accessoires
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(cravate|nœud papillon)\b/gi, tag: 'Shadow_Cravates_Homme' },
                // Shadow Order - Voyage
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(bagage|valise|roulette)\b/gi, tag: 'Shadow_Bagages_Roulettes' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sac de voyage|keepall)\b/gi, tag: 'Shadow_Sacs_Voyage_Souples' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(accessoire de voyage|trousse)\b/gi, tag: 'Shadow_Accessoires_Voyage' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(malle|rigide)\b/gi, tag: 'Shadow_Malles_Rigides' },
                // Shadow Order - Montres & Joaillerie
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(joailler|bijou fin|bague|collier|bracelet)\b/gi, tag: 'Shadow_Joaillerie' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(haute joaillerie)\b/gi, tag: 'Shadow_Haute_Joaillerie' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(montre|tambour|tambour)\b/gi, tag: 'Shadow_Montres' },
                // Shadow Order - Parfums
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(parfum|fragrance|cologne|extrait)\b/gi, tag: 'Shadow_Parfums' },
                // Shadow Order - Art de Vivre
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(objet nomade|meuble|déco)\b/gi, tag: 'Shadow_Objets_Nomades' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(jeu|sport|skateboard|ballon)\b/gi, tag: 'Shadow_Sport_Jeux' }
            ],
            category: 'OPPORTUNITÉS_MANQUÉES'
        },
        action_crm: {
            patterns: [
                { regex: /\b(rappeler|stock).{0,10}(dès que)\b/gi, tag: 'Action_Rappeler_Stock' },
                { regex: /\b(alerte|restock)\b/gi, tag: 'Action_Alerte_Restock' },
                { regex: /\b(invitation|inviter)\b/gi, tag: 'Action_Invitation' },
                { regex: /\b(cadeau).{0,10}(envoyer|offrir)|(envoyer|offrir).{0,10}(cadeau)\b/gi, tag: 'Action_Cadeau' },
                { regex: /\b(whatsapp|message).{0,10}(envoyer|contacter)\b/gi, tag: 'Action_Message_WhatsApp' },
                { regex: /\b(urgent)\b/gi, tag: 'Timing_Urgent' },
                { regex: /\b(fin (du )?mois)\b/gi, tag: 'Timing_Fin_Mois' },
                { regex: /\b(prochaine saison|saison prochaine)\b/gi, tag: 'Timing_Saison_Prochaine' },
                { regex: /\b(date fixe|date précise)\b/gi, tag: 'Timing_Date_Fixe' }
            ],
            category: 'ACTION_CRM'
        }
    },

    extractTags(text) {
        if (!text) return [];
        const tags = [];

        // Checklist order: PROFIL → INTÉRÊTS → VOYAGE → INTENTION → SÉCURITÉ → UNIVERS LV → HISTORIQUE → OPPORTUNITÉS
        for (const [groupName, group] of Object.entries(this.patterns)) {

            // 1. Level 3 (Specific Tags)
            for (const pattern of group.patterns) {
                pattern.regex.lastIndex = 0;
                if (pattern.regex.test(text)) {
                    if (!tags.find(t => t.tag === pattern.tag)) {
                        tags.push({
                            tag: pattern.tag,
                            category: group.category,
                            group: groupName,
                            confidence: 'Haute'
                        });
                    }
                }
            }

            // 2. Level 2 (Additive Fallbacks — Hierarchy)
            // ALWAYS check parent-level tags, even if specific tags were found.
            // "Si Cardiologue → Médecin_Spécialiste ET Santé & Médecine"
            // This ensures maximum coverage & hierarchy respect.
            if (group.fallbacks) {
                for (const fallback of group.fallbacks) {
                    fallback.regex.lastIndex = 0;
                    if (fallback.regex.test(text)) {
                        if (!tags.find(t => t.tag === fallback.tag)) {
                            tags.push({
                                tag: fallback.tag,
                                category: group.category,
                                group: groupName,
                                confidence: 'Moyenne (Parent)'
                            });
                        }
                    }
                }
            }
        }

        return tags;
    },

    processDataset(dataset) {
        const results = dataset.map(row => {
            const text = row.clean || row.cleanedText || row.Transcription || '';
            return { ...row, tags: this.extractTags(text) };
        });
        return results;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tagger;
} else {
    window.Tagger = Tagger;
}
