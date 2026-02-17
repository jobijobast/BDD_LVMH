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
                { regex: /\b(femme|dame|madame|mme|mlle|miss|mrs|ms|lady|woman|signora|donna)\b/gi, tag: 'Genre_Femme' },
                { regex: /\b(homme|sieur|monsieur|mr|mister|man|gentleman|signore|uomo)\b/gi, tag: 'Genre_Homme' },
                { regex: /\b(couple|mariés|conjoints|époux)\b/gi, tag: 'Genre_Couple' },
                { regex: /\b(non-binaire|non binaire|nb|iel)\b/gi, tag: 'Genre_Non-Binaire' }
            ],
            category: 'PROFIL_GENRE'
        },
        identity_generation: {
            patterns: [
                // Numerical Age Detection
                { regex: /\b(1[89]|[2][0-4])\s?(ans|years|anni)?\b/gi, tag: 'Gen_Z (<25)' },
                { regex: /\b([2][5-9]|[3][0-9])\s?(ans|years|anni)?\b/gi, tag: 'Millennial (25-40)' },
                { regex: /\b([4][0-9]|[5][0-9]|gen x)\s?(ans|years|anni)?\b/gi, tag: 'Gen_X (40-60)' },
                { regex: /\b([6-7][0-9]|boomer)\s?(ans|years|anni)?\b/gi, tag: 'Boomer (60+)' },
                { regex: /\b([8-9][0-9]|100)\s?(ans|years|anni)?\b/gi, tag: 'Silent_Generation (>80)' },
                // Classic Keywords
                { regex: /\b(gen z|étudiant|student|studente)\b/gi, tag: 'Gen_Z (<25)' },
                { regex: /\b(millennial|jeune actif|young pro)\b/gi, tag: 'Millennial (25-40)' },
                { regex: /\b(retraité|retired|pensionato)\b/gi, tag: 'Boomer (60+)' }
            ],
            category: 'PROFIL_GÉNÉRATION'
        },
        identity_status: {
            patterns: [
                { regex: /\b(prospect|inconnu|unknown)\b/gi, tag: 'Status_Prospect' },
                { regex: /\b(nouveau|premier achat|first time|new client|nuovo)\b/gi, tag: 'Status_Nouveau_Client' },
                { regex: /\b(occasionnel|de passage|occasional|sometimes)\b/gi, tag: 'Status_Client_Occasionnel' },
                { regex: /\b(régulier|fidèle|habitué|regular|loyal|fedele)\b/gi, tag: 'Status_Client_Regulier' },
                { regex: /\b(vip|vic|very important)\b/gi, tag: 'Status_VIP' },
                { regex: /\b(vvip|top tier|élite|elite)\b/gi, tag: 'Status_VVIP_Top_Tier' },
                { regex: /\b(dormant|inactif|inactive)\b/gi, tag: 'Status_Client_Dormant' },
                { regex: /\b(ancien top|churn|lost)\b/gi, tag: 'Status_Ancien_Top_Client' }
            ],
            category: 'PROFIL_STATUS'
        },
        identity_langue: {
            patterns: [
                { regex: /\b(français|french|francese|paris)\b/gi, tag: 'Langue_Francais' },
                { regex: /\b(anglais|english|inglese|uk|usa|london)\b/gi, tag: 'Langue_Anglais' },
                { regex: /\b(italien|italian|italiano|rome|milano)\b/gi, tag: 'Langue_Italien' },
                { regex: /\b(espagnol|spanish|spagnolo)\b/gi, tag: 'Langue_Espagnol' },
                { regex: /\b(allemand|german|tedesco)\b/gi, tag: 'Langue_Allemand' },
                { regex: /\b(mandarin|chinois|chinese|cinese)\b/gi, tag: 'Langue_Mandarin' },
                { regex: /\b(japonais|japanese|giapponese)\b/gi, tag: 'Langue_Japonais' },
                { regex: /\b(arabe|arabic|arabo)\b/gi, tag: 'Langue_Arabe' },
                { regex: /\b(russe|russian|russo)\b/gi, tag: 'Langue_Russe' }
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
                { regex: /\b(chirurgien|surgeon|chirurgo).{0,20}(coeur|cardio)\b/gi, tag: 'Médecin_Spé_Chirurgien_Cardiothoracique' },
                { regex: /\b(chirurgien|surgeon|chirurgo).{0,20}(ortho|os)\b/gi, tag: 'Médecin_Spé_Chirurgien_Orthopédique' },
                { regex: /\b(chirurgien|surgeon|chirurgo).{0,20}(maxillo|visage)\b/gi, tag: 'Médecin_Spé_Chirurgien_Maxillo_Facial' },
                { regex: /\b(chirurgien|surgeon|chirurgo).{0,20}(esthétique|plastique|plastic)\b/gi, tag: 'Médecin_Spé_Chirurgien_Esthetique' },
                { regex: /\b(neurologue|neurologist|neurologo)\b/gi, tag: 'Médecin_Spé_Neurologue' },
                { regex: /\b(cardiologue|cardiologist|cardiologo)\b/gi, tag: 'Médecin_Spé_Cardiologue' },
                { regex: /\b(dermatologue|dermatologist|dermatologo|derma)\b/gi, tag: 'Médecin_Spé_Dermatologue' },
                { regex: /\b(dentiste|orthodontiste|dentist|dentista)\b/gi, tag: 'Médecin_Spé_Dentiste' },
                { regex: /\b(pharmacien|pharmacist|farmacista)\b/gi, tag: 'Pharma_Pharmacien_Titulaire' },
                { regex: /\b(biotech|recherche|research|ricerca)\b/gi, tag: 'Pharma_Chercheur_Biotech' }
            ],
            category: 'PROFESSION_SANTÉ',
            fallbacks: [
                { regex: /\b(chirurgien|surgeon|chirurgo)\b/gi, tag: 'Médecin_Spé_Chirurgien_Général' },
                { regex: /\b(médecin|docteur|doctor|medico|dottore|spécialiste|specialist|specialista|medicina)\b/gi, tag: 'Médecin_Spécialiste_Général' },
                { regex: /\b(santé|soin|médical|pharma|biologie|medical|health|sanità)\b/gi, tag: 'Profession_Santé_Médecine' }
            ]
        },
        pro_finance: {
            patterns: [
                { regex: /\b(hedge fund|fonds|fund manager)\b/gi, tag: 'Marchés_Hedge_Fund_Manager' },
                { regex: /\b(trader|trading|forex|commodities)\b/gi, tag: 'Marchés_Trader' },
                { regex: /\b(asset|gestion actif|wealth|patrimoine)\b/gi, tag: 'Marchés_Asset_Manager' },
                { regex: /\b(private equity|pe|partner)\b/gi, tag: 'Capital_Partner_PE' },
                { regex: /\b(vc|venture|capitalist|investisseur)\b/gi, tag: 'Capital_VC' },
                { regex: /\b(angel|business angel)\b/gi, tag: 'Capital_Angel_Investor' },
                { regex: /\b(m&a|fusion|investment bank(er)?|banquier d'affaire|banque d'affaire)\b/gi, tag: 'Banque_Investment_Banker' },
                { regex: /\b(banquier privé|banque privée|private bank|banchiere)\b/gi, tag: 'Banque_Banquier_Privé' },
                { regex: /\b(crypto|bitcoin|ethereum|whale)\b/gi, tag: 'Fintech_Crypto_Whale' },
                { regex: /\b(blockchain|nft|web3)\b/gi, tag: 'Fintech_Expert_Blockchain' }
            ],
            category: 'PROFESSION_FINANCE',
            fallbacks: [
                { regex: /\b(banquier|banker|banchiere|banque|bank|banca)\b/gi, tag: 'Banque_Générale' },
                { regex: /\b(investisseur|investor|investitore|finance|financial|finanza)\b/gi, tag: 'Profession_Finance_Investissement' }
            ]
        },
        pro_legal: {
            patterns: [
                { regex: /\b(avocat|lawyer|attorney|avvocato).{0,20}(m&a|corporate|affari|affaires)\b/gi, tag: 'Avocature_Avocat_M&A_Corporate' },
                { regex: /\b(avocat|lawyer|attorney|avvocato).{0,20}(pi|ip|intellectuelle)\b/gi, tag: 'Avocature_Avocat_PI' },
                { regex: /\b(avocat|lawyer|attorney|avvocato).{0,20}(famille|family|famiglia)\b/gi, tag: 'Avocature_Avocat_Droit_Famille' },
                { regex: /\b(avocat|lawyer|attorney|avvocato).{0,20}(droits de l'homme|human rights)\b/gi, tag: 'Avocature_Avocat_Droits_Homme' },
                { regex: /\b(magistrat|juge|judge|giudice)\b/gi, tag: 'Institutionnel_Magistrat_Juge' },
                { regex: /\b(notaire|notary|notaio)\b/gi, tag: 'Institutionnel_Notaire' },
                { regex: /\b(commissaire priseur|auctioneer)\b/gi, tag: 'Institutionnel_Commissaire_Priseur' }
            ],
            category: 'PROFESSION_LÉGAL',
            fallbacks: [
                { regex: /\b(avocat|avocate|lawyer|attorney|counsel|juriste|avvocato)\b/gi, tag: 'Avocature_Générale' },
                { regex: /\b(droit|légal|juridique|loi|legal|law|legale)\b/gi, tag: 'Profession_Juridique_Générale' }
            ]
        },
        pro_creatif: {
            patterns: [
                { regex: /\b(galeriste|gallery|art dealer|galleria)\b/gi, tag: 'Art_Market_Galeriste' },
                { regex: /\b(curateur|curator|musée|museum|museo)\b/gi, tag: 'Art_Market_Curateur' },
                { regex: /\b(advisor|consultant).{0,10}(art)/gi, tag: 'Art_Market_Advisor' },
                { regex: /\b(architecte|architect|architetto).{0,10}(dplg)?\b/gi, tag: 'Design_Archi_Architecte' },
                { regex: /\b(designer|id|intérieur|interior).{0,10}(design)/gi, tag: 'Design_Archi_Designer_Intérieur' },
                { regex: /\b(paysagiste|landscape|paesaggista)\b/gi, tag: 'Design_Archi_Paysagiste' },
                { regex: /\b(chef d'orchestre|conductor|maestro)\b/gi, tag: 'Performance_Chef_Orchestre' },
                { regex: /\b(soliste|soloist|concertiste)\b/gi, tag: 'Performance_Soliste' },
                { regex: /\b(producteur|producer|produttore).{0,10}(cinema|film|movie)\b/gi, tag: 'Performance_Producteur' },
                { regex: /\b(agent).{0,10}(artistique|talent)\b/gi, tag: 'Performance_Agent' }
            ],
            category: 'PROFESSION_CRÉATIF',
            fallbacks: [
                { regex: /\b(art|artiste|artist|creatif|creative)\b/gi, tag: 'Profession_Art_Culture_Générale' },
                { regex: /\b(design|architecte|architect)\b/gi, tag: 'Profession_Design_Générale' },
                { regex: /\b(musique|cinéma|film|théâtre|spectacle)\b/gi, tag: 'Performance_Arts_Général' }
            ]
        },
        pro_business: {
            patterns: [
                { regex: /\b(ceo|dirigeant|head|directeur général|pdg|founder|fondateur|owner|proprio)\b/gi, tag: 'Leadership_CEO' },
                { regex: /\b(board|administrateur|conseil administration)\b/gi, tag: 'Leadership_Board_Member' },
                { regex: /\b(family office)\b/gi, tag: 'Leadership_Family_Office' },
                { regex: /\b(immobilier|real estate|property|developer|immobiliare)\b/gi, tag: 'Secteur_Immobilier_Luxe' },
                { regex: /\b(tech|start-?up|software|saas)\b/gi, tag: 'Secteur_Tech_Founder' },
                { regex: /\b(fashion|mode|luxe|luxury|moda).{0,10}(pr|communication)\b/gi, tag: 'Secteur_Fashion_PR' }
            ],
            category: 'PROFESSION_BUSINESS',
            fallbacks: [
                { regex: /\b(business|affaire|entreprise|patron|boss|manager|exec)\b/gi, tag: 'Business_Leadership_Général' }
            ]
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
                { regex: /\b(racing club|lagardère)\b/gi, tag: 'Clubs_Sportifs_Prestige_Paris' },
                { regex: /\b(queen.?s club|hurlingham|mcc|lords)\b/gi, tag: 'Clubs_Sportifs_Prestige_UK' },
                { regex: /\b(wentworth|sunningdale)\b/gi, tag: 'Clubs_Sportifs_Prestige_Golf' },
                { regex: /\b(soho house|annabel|arts club)\b/gi, tag: 'Clubs_Sociaux_Arts_London' },
                { regex: /\b(interallié|automobile club|travellers)\b/gi, tag: 'Clubs_Sociaux_Arts_Paris' },
                { regex: /\b(yacht club|ycm|monaco)\b/gi, tag: 'Réseaux_Yacht_Club_Monaco' },
                { regex: /\b(alumni|harvard|incead|hec|polytechnique|bocconi|oxbridge)\b/gi, tag: 'Réseaux_Alumni_Elite' }
            ],
            category: 'PASSION_CERCLES'
        },
        passions_collection: {
            patterns: [
                { regex: /\b(montre|watch|orologio).{0,10}(vintage|cienne|collection)\b/gi, tag: 'Horlogerie_Vintage' },
                { regex: /\b(complication|tourbillon|patek|rolex|audemars)\b/gi, tag: 'Horlogerie_Haute_Collection' },
                { regex: /\b(livre|book|libri).{0,10}(rare|ancien|old|antico)\b/gi, tag: 'Bibliophilie_Livres_Rares' },
                { regex: /\b(carte).{0,10}(géographique|ancienne)/gi, tag: 'Bibliophilie_Cartes' },
                { regex: /\b(art|arte).{0,10}(contemporain|contemporary|contemporanea)\b/gi, tag: 'Art_Collection_Contemporain' },
                { regex: /\b(maître|master|maestri).{0,10}(ancien|old|antichi)\b/gi, tag: 'Art_Collection_Maîtres_Anciens' },
                { regex: /\b(photo).{0,10}(art|fine)/gi, tag: 'Art_Photographie' },
                { regex: /\b(nft|digital art)\b/gi, tag: 'Art_NFT' },
                { regex: /\b(vin|wine|vino|grand cru|bordeaux|burgundy|borgogna)\b/gi, tag: 'Vins_Grands_Crus_Bordeaux' },
                { regex: /\b(whisky|scotch|yamazaki|hibiki)\b/gi, tag: 'Vins_Spiritueux_Rare' },
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
                { regex: /\b(sport|club|membre|member|membro)\b/gi, tag: 'Vie_Sociale_Club_Général' },
                { regex: /\b(collection|collect|collezione)\b/gi, tag: 'Collectionnisme_Général' },
                { regex: /\b(tennis|padel|squash|raquette|racket|racchetta)\b/gi, tag: 'Sport_Raquette_Général' },
                { regex: /\b(golf|green|handicap)\b/gi, tag: 'Sport_Golf_Général' },
                { regex: /\b(yacht|voile|sailing|boat|barca|regatta)\b/gi, tag: 'Sport_Nautisme_Général' },
                { regex: /\b(triathlon|marathon|ironman|cycling|vélo|running)\b/gi, tag: 'Sport_Endurance_Général' },
                { regex: /\b(yoga|pilates|meditation)\b/gi, tag: 'Bien-être_Yoga_Ashtanga' }, // Simplified default
                { regex: /\b(f1|formule 1|racing|ferrari|porsche|lamborghini|aston)\b/gi, tag: 'Sport_Mécanique_Général' }
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
                { regex: /\b(vegan).{0,10}(strict)?\b/gi, tag: 'Valeurs_Vegan_Strict' }, // "strict" optional now
                { regex: /\b(cruelty free|sans cruauté)\b/gi, tag: 'Valeurs_Cruelty_Free' },
                { regex: /(pas de|sans|évite|arrete|arrête).{0,10}(cuir|fourrure|peau)/gi, tag: 'Valeurs_Cruelty_Free' },
                { regex: /\b(cuir).{0,10}(vegan|végétal)\b/gi, tag: 'Valeurs_Cruelty_Free' },
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
                { regex: /\b(loisir|resort|palace|maldives|seychelles|polynésie|leisure|vacanza)\b/gi, tag: 'Voyage_Loisir_Luxe' },
                { regex: /\b(aventure|safari|nature|adventure|avventura)\b/gi, tag: 'Voyage_Aventure_Nature' },
                { regex: /\b(bien-être|retraite|detox|wellness|benessere|spa)\b/gi, tag: 'Voyage_Bien_être' },
                { regex: /\b(culturel|tour|musée|cultural)\b/gi, tag: 'Voyage_Culturel' },
                { regex: /\b(business|roadshow|pro|work|travail|lavoro)\b/gi, tag: 'Voyage_Business' }
            ],
            category: 'VOYAGE_TYPE'
        },
        voyage_dest: {
            patterns: [
                { regex: /\b(japon|tokyo|kyoto|corée|séoul|bali|australie|japan|asia|asie|asia)\b/gi, tag: 'Dest_Asie_Pacifique' },
                { regex: /\b(nyc|miami|aspen|st barth|patagonie|usa|america)\b/gi, tag: 'Dest_Amériques' },
                { regex: /\b(londres|paris|côte d'azur|alpes|suisse|italie|toscane|tuscany|toscana|europe|europa|london|basque|provence)\b/gi, tag: 'Dest_Europe' },
                { regex: /\b(dubaï|marrakech|le cap|safari|africa|middle east)\b/gi, tag: 'Dest_Afrique_Moyen_Orient' }
            ],
            category: 'VOYAGE_DESTINATION'
        },

        // ==========================================
        // 4. INTENTION D'ACHAT (Sales Context)
        // ==========================================
        achat_destinataire: {
            patterns: [
                { regex: /\b(pour soi|moi|me faire plaisir|myself|stessa)\b/gi, tag: 'Dest_Intime_Pour_Soi' },
                { regex: /\b(pour|sa|son|cadeau).{0,30}(conjoint|mari|époux|épouse|husband|wife|marito|moglie)\b/gi, tag: 'Dest_Intime_Pour_Conjoint' },
                { regex: /\b(mari|époux|épouse|husband|wife|marito|moglie).{0,30}(anniversaire|birthday|bday)\b/gi, tag: 'Dest_Intime_Pour_Conjoint' },
                { regex: /\b(pour).{0,10}(sa femme|son homme)\b/gi, tag: 'Dest_Intime_Pour_Conjoint' },
                { regex: /\b(amant|maitresse|lover|amante)\b/gi, tag: 'Dest_Intime_Pour_Amant' },
                { regex: /\b(parent|mère|père|mother|father|dad|mum|madre|padre)\b/gi, tag: 'Dest_Famille_Pour_Parents' },
                { regex: /\b(enfant|fils|fille|kid|child|son|daughter|figlio|figlia)\b/gi, tag: 'Dest_Famille_Pour_Enfant' },
                { regex: /\b(ado|teen).{0,10}(premier luxe|first|primo)\b/gi, tag: 'Dest_Famille_Pour_Ado_First_Luxury' },
                { regex: /\b(petit-enfant|grandchild|nipote)\b/gi, tag: 'Dest_Famille_Pour_Petit_Enfant' },
                { regex: /\b(assistant|pa|assistante)\b/gi, tag: 'Dest_Pro_Pour_Assistant' },
                { regex: /\b(client|vip).{0,10}(cadeau|gift|regalo)\b/gi, tag: 'Dest_Pro_Pour_Client_VIP' },
                { regex: /\b(employé|staff|employee|dipendente)\b/gi, tag: 'Dest_Pro_Pour_Employé' },
                { regex: /\b(hote|hotesse|invitation|host)\b/gi, tag: 'Dest_Social_Pour_Hôte' },
                { regex: /\b(mariés|wedding list|marriage|nozze|sposi)\b/gi, tag: 'Dest_Social_Pour_Mariés' }
            ],
            category: 'INTENTION_DESTINATAIRE'
        },
        achat_occasion: {
            patterns: [
                { regex: /\b(anniversaire|marquant|18|20|30|40|50|60|birthday|bday|compleanno)\b/gi, tag: 'Occasion_Anniversaire_Marquant' },
                { regex: /\b(naissance|babyshower|birth|nascita)\b/gi, tag: 'Occasion_Naissance' },
                { regex: /\b(mariage|divorce|wedding|matrimonio)\b/gi, tag: 'Occasion_Mariage_Divorce' },
                { regex: /\b(premier job|embauche|first job|lavoro)\b/gi, tag: 'Occasion_Carrière_Premier_Job' },
                { regex: /\b(promotion|bonus|promozione)\b/gi, tag: 'Occasion_Carrière_Promotion' },
                { regex: /\b(retraite|retirement|pensione)\b/gi, tag: 'Occasion_Carrière_Retraite' },
                { regex: /\b(vente|exit).{0,10}(entreprise|company|azienda)\b/gi, tag: 'Occasion_Carrière_Exit_Vente' },
                { regex: /\b(diplomation|diplôme|graduation|degree|laurea|laureata)\b/gi, tag: 'Occasion_Carrière_Diplomation' },
                { regex: /\b(noël|fin d'année|fêtes|christmas|natale)\b/gi, tag: 'TempsFort_Cadeaux_Fin_Année' },
                { regex: /\b(renouveau|nouvel an|cny|new year|capodanno)\b/gi, tag: 'TempsFort_Célébration_Renouveau' },
                { regex: /\b(ramadan|eid|diwali)\b/gi, tag: 'TempsFort_Traditionnel' },
                { regex: /\b(saint valentin|romantique|valentines|san valentino)\b/gi, tag: 'TempsFort_Occasion_Romantique' },
                { regex: /\b(fête des mères|pères|mother|father|mamma|papà)\b/gi, tag: 'TempsFort_Célébration_Parentale' },
                { regex: /\b(impulsion|coup de tête|impulse)\b/gi, tag: 'Plaisir_Impulsion' },
                { regex: /\b(thérapie|moral|retail therapy)\b/gi, tag: 'Plaisir_Shopping_Thérapie' },
                { regex: /\b(souvenir|voyage|travel|ricordo)\b/gi, tag: 'Plaisir_Souvenir' },
                // Timing / ActionCRM
                { regex: /\b(fin|end).{0,10}(mois|month|mese|février|february)\b/gi, tag: 'Timing_Fin_Mois' }
            ],
            category: 'INTENTION_OCCASION'
        },
        achat_style: {
            patterns: [
                { regex: /\b(classique|classic|classico)\b/gi, tag: 'Style_Classique' },
                { regex: /\b(moderne|modern|moderno|jeune|young)\b/gi, tag: 'Style_Moderne' },
                { regex: /\b(trendy|tendance|fashion)\b/gi, tag: 'Style_Trendy' },
                { regex: /\b(logo|monogram)\b/gi, tag: 'Style_Logo' },
                { regex: /\b(quiet|discret|discrete)\b/gi, tag: 'Style_Quiet_Luxury' }
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
                { regex: /\b(crustacé|fruit de mer|shellfish|crostacei)\b/gi, tag: 'Anaphylaxie_Crustacés' },
                { regex: /\b(latex)\b/gi, tag: 'Contact_Latex' },
                { regex: /\b(nickel|nichel)\b/gi, tag: 'Contact_Nickel' },
                { regex: /\b(laine|mohair|alpaga|wool|lana)\b/gi, tag: 'Contact_Laine' },
                { regex: /\b(parfum|fragrance|chimique|chemical)s?\b/gi, tag: 'Environnement_Parfum' },
                { regex: /\b(poussière|acarien|dust|polvere)\b/gi, tag: 'Environnement_Poussière' },
                { regex: /\b(fleur|pollen|flower)\b/gi, tag: 'Environnement_Fleurs' },
                { regex: /\b(soleil|photo|sensib).{0,20}(lumière)\b/gi, tag: 'Environnement_Photosensibilité' }
            ],
            category: 'SÉCURITÉ_RISQUE'
        },
        securite_pref_alim: {
            patterns: [
                { regex: /\b(végan|végétalien|vegan).{0,10}(strict)?\b/gi, tag: 'Régime_Végétalien_Strict' }, // "strict" optional
                { regex: /\b(végétarien|vegetarian|vegetariana)\b/gi, tag: 'Régime_Végétarien' },
                { regex: /\b(pescatarien|pescatarian|pescetariano)\b/gi, tag: 'Régime_Pescatarien' },
                { regex: /\b(porc|pork|maiale).{0,10}(sans|pas|no)\b/gi, tag: 'Régime_Sans_Porc' },
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
                { regex: /\b(objets nomades|meuble)\b/gi, tag: 'Profil_Objets_Nomades' }
            ],
            category: 'UNIVERS_PROFIL_PRODUIT'
        },
        univers_relation: {
            patterns: [
                { regex: /\b(multi-?génération|mère.*fille|père.*fils|family.*shopping)\b/gi, tag: 'Relation_Maison_Client_Multi_Générationnel' },
                { regex: /\b(commande spéciale|special order|mto|mtm)\b/gi, tag: 'Relation_Maison_Commande_Spéciale' },
                { regex: /\b(défilé|show|fashion week|invitation)\b/gi, tag: 'Relation_Maison_Invité_Défilé' },
                { regex: /\b(nicolas|ghesquière)\b/gi, tag: 'Relation_Maison_Style_Ghesquière' },
                { regex: /\b(pharrell|williams|homme)\b/gi, tag: 'Relation_Maison_Style_Pharrell' }
            ],
            category: 'UNIVERS_RELATION_MAISON'
        },

        // ==========================================
        // 7. HISTORIQUE & POSSESSIONS
        // ==========================================
        histo_maro_femme: {
            patterns: [
                { regex: /\b(alma|noé|speedy|neverfull)\b/gi, tag: 'Shadow_Sacs_Icônes_Femme' },
                { regex: /\b(sac|bag|borsa).{0,20}(épaule|shoulder|spalla|croisé|cross|tracolla)\b/gi, tag: 'Shadow_Sacs_Portés_Épaule_Croisé' },
                { regex: /\b(cabas|tote|seau|bucket)\b/gi, tag: 'Shadow_Sacs_Cabas_Seau' },
                { regex: /\b(mini|nano|backpack|dos)\b/gi, tag: 'Shadow_Sacs_Mini_Sacs_Dos' },
                { regex: /\b(exotique|crocodile|python|autruche|exotic)\b/gi, tag: 'Shadow_Sacs_Exotiques' },
                // Generic Fallbacks
                { regex: /\b(sac|bag|borsa|handbag).{0,20}(work|travail|lavoro|business|day|jour)\b/gi, tag: 'Shadow_Sacs_Cabas_Seau' }, // Generic work bag -> Cabas often
                { regex: /\b(sac|bag|borsa).{0,10}(soir|night|sera|event)\b/gi, tag: 'Shadow_Sacs_Mini_Sacs_Dos' }, // Evening -> Mini usually
                { regex: /\b(sac|bag|borsa|handbag)\b/gi, tag: 'Shadow_Sacs_Icônes_Femme' }, // Default for "sac" if nothing else matches

                { regex: /\b(portefeuille|wallet|portafoglio).{0,20}(long|brazza|zippy|compact|zoé|victorine)\b/gi, tag: 'Shadow_SLG_Portefeuilles' },
                { regex: /\b(porte-carte|card holder|porte-monnaie|coin purse)\b/gi, tag: 'Shadow_SLG_Porte_Cartes' },
                { regex: /\b(pochette|clutch|accessoire)\b/gi, tag: 'Shadow_SLG_Pochettes' },
                // Generic Fallback SLG
                { regex: /\b(portefeuille|wallet|portafoglio)\b/gi, tag: 'Shadow_SLG_Portefeuilles' },

                { regex: /\b(manteau|veste|coat|jacket|blouson)\b/gi, tag: 'Shadow_PAP_Manteaux_Vestes' },
                { regex: /\b(robe|jupe|dress|skirt)\b/gi, tag: 'Shadow_PAP_Robes_Jupes' },
                { regex: /\b(haut|maille|t-shirt|top|knit|tricot)\b/gi, tag: 'Shadow_PAP_Hauts_Mailles' },
                { regex: /\b(pantalon|denim|jean|pants|trousers)\b/gi, tag: 'Shadow_PAP_Pantalons_Denim' },
                { regex: /\b(bain|swim|plage|beach)\b/gi, tag: 'Shadow_PAP_Maillots_Bain' },

                { regex: /\b(sneakers?|baskets?|tennis|run)\b/gi, tag: 'Shadow_Souliers_Sneakers' },
                { regex: /\b(bottine|botte|boot|stivali)\b/gi, tag: 'Shadow_Souliers_Bottines' },
                { regex: /\b(escarpin|mule|pump|heel|tacco)\b/gi, tag: 'Shadow_Souliers_Escarpins' },
                { regex: /\b(sandale|sandal|compensée|wedge)\b/gi, tag: 'Shadow_Souliers_Sandales' },

                { regex: /\b(carré|soie|bandeau|silk|seta)\b/gi, tag: 'Shadow_Acc_Soie_Bandeaux' },
                { regex: /\b(écharpe|châle|scarf|shawl)\b/gi, tag: 'Shadow_Acc_Echarpes_Châles' },
                { regex: /\b(lunette|sunglass|occhiali)\b/gi, tag: 'Shadow_Acc_Lunettes_Soleil' },
                { regex: /\b(ceinture|belt|cintura)\b/gi, tag: 'Shadow_Acc_Ceintures' },
                { regex: /\b(bijoux?|jewel|gioielli|chapeau|hat)\b/gi, tag: 'Shadow_Acc_Bijoux_Chapeaux' },

                // Homme / Voyage Generic overrides
                { regex: /\b(sac voyage|travel bag|week-?end|duffle|keepall)\b/gi, tag: 'Shadow_Sacs_Voyage_Souples' },
                { regex: /\b(valise|trolley|horizon|luggage|suitcase)\b/gi, tag: 'Shadow_Voyage_Bagages_Roulettes' },
                { regex: /\b(malle|trunk|hard|coffret)\b/gi, tag: 'Shadow_Voyage_Malles' },
                { regex: /\b(district)\b/gi, tag: 'Possède_District' },
                { regex: /\b(s-lock|slock)\b/gi, tag: 'Possède_S-Lock' },
                { regex: /\b(pdv|porte-documents)\b/gi, tag: 'Possède_PDV' },
                { regex: /\b(discovery bumbag)\b/gi, tag: 'Possède_Discovery_Bumbag' },
                { regex: /\b(keepall xs)\b/gi, tag: 'Possède_Keepall_XS' },
            ],
            category: 'HISTO_MARO_FEMME'
        },
        histo_maro_homme: {
            patterns: [
                { regex: /\b(christopher)\b/gi, tag: 'Possède_Christopher' },
                { regex: /\b(discovery)\b/gi, tag: 'Possède_Discovery' },
                { regex: /\b(dean)\b/gi, tag: 'Possède_Dean' },
                { regex: /\b(trio)\b/gi, tag: 'Possède_Trio' },
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
                // Shadow Order - 1. Femme
                // Sacs à main
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(speedy|neverfull|alma|noé)\b/gi, tag: 'Shadow_Sacs_Icônes_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(épaule|croisé|bandoulière)\b/gi, tag: 'Shadow_Sacs_Épaule_Croisé_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(cabas|seau)\b/gi, tag: 'Shadow_Cabas_Seau_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(mini sac|sac à dos|petit sac)\b/gi, tag: 'Shadow_Mini_Sacs_Dos_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(exotique|croco|python)\b/gi, tag: 'Shadow_Cuirs_Exotiques' },
                // Petite Maroquinerie Femme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(portefeuille|compact)\b/gi, tag: 'Shadow_Portefeuilles_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(porte-carte|porte-monnaie)\b/gi, tag: 'Shadow_Porte_Cartes_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(pochette|accessoire de sac)\b/gi, tag: 'Shadow_Pochettes_Femme' },
                // Prêt-à-porter Femme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(manteau|veste|blazer)\b/gi, tag: 'Shadow_Manteaux_Vestes_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(robe|jupe)\b/gi, tag: 'Shadow_Robes_Jupes' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(haut|maille|t-shirt|pull)\b/gi, tag: 'Shadow_Hauts_Mailles_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(pantalon|denim|jean)\b/gi, tag: 'Shadow_Pantalons_Denim' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(maillot de bain|swimwear)\b/gi, tag: 'Shadow_Maillots_Bain' },
                // Souliers Femme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sneaker|archlight|run away|time out)\b/gi, tag: 'Shadow_Sneakers_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(bottine|botte|star trail|silhouette)\b/gi, tag: 'Shadow_Btines_Bottes_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(escarpin|mule|pump|heel)\b/gi, tag: 'Shadow_Escarpins_Mules_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sandale|compensée)\b/gi, tag: 'Shadow_Sandales_Femme' },
                // Accessoires Femme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(carré|foulard|bandeau|soie)\b/gi, tag: 'Shadow_Acc_Soie' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(écharpe|châle)\b/gi, tag: 'Shadow_Acc_Echarpes_Chales' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(lunettes|soleil)\b/gi, tag: 'Shadow_Acc_Lunettes_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(ceinture|belt)\b/gi, tag: 'Shadow_Acc_Ceintures_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(bijou|chapeau)\b/gi, tag: 'Shadow_Acc_Bijoux_Chapeaux' },

                // Shadow Order - 2. Homme (Men's Universe)
                // Sacs Homme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(business|porte-documents|serviette|briefcase)\b/gi, tag: 'Shadow_Sacs_Business_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sac à dos|backpack|christopher|discovery)\b/gi, tag: 'Shadow_Sacs_Dos_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(messenger|besace|district|trio)\b/gi, tag: 'Shadow_Sacs_Messenger_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(keepall|duffle).{0,20}(ville|city|xs|25)\b/gi, tag: 'Shadow_Sacs_Keepall_Ville' },
                // Petite Maro Homme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(portefeuille|wallet|brazza|multiple)\b/gi, tag: 'Shadow_Portefeuilles_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(porte-carte|card holder|pince)\b/gi, tag: 'Shadow_Porte_Cartes_Homme' },
                // PAP Homme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(costume|suit|blazer|veste de costume)\b/gi, tag: 'Shadow_PAP_Costumes_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(manteau|blouson|outerwear|jacket)\b/gi, tag: 'Shadow_PAP_Outerwear_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(pantalon|jean|denim|short)\b/gi, tag: 'Shadow_PAP_Pantalons_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(chemise|shirt|tricot|knit|pull)\b/gi, tag: 'Shadow_PAP_Hauts_Homme' },
                // Souliers Homme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(sneaker|basket|trainer|runner)\b/gi, tag: 'Shadow_Souliers_Sneakers_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(mocassin|loafer|richelieu|derby|ville)\b/gi, tag: 'Shadow_Souliers_Ville_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(botte|boot|rangers)\b/gi, tag: 'Shadow_Souliers_Bottes_Homme' },
                // Accessoires Homme
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(cravate|tie|noeud)\b/gi, tag: 'Shadow_Acc_Cravates_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(ceinture|belt)\b/gi, tag: 'Shadow_Acc_Ceintures_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(lunette|sunglass)\b/gi, tag: 'Shadow_Acc_Lunettes_Homme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(bijoux|chaîne|bague|chevalière)\b/gi, tag: 'Shadow_Acc_Bijoux_Homme' },

                // Shadow Order - 3. Voyage
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(valise|trolley|horizon|roulette|rolling)\b/gi, tag: 'Shadow_Voyage_Rolling_Luggage' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(keepall|sac de voyage|duffle|45|50|55)\b/gi, tag: 'Shadow_Voyage_Sacs_Souples' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(accessoire voyage|trousse|packing)\b/gi, tag: 'Shadow_Voyage_Accessoires' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(malle|trunk|courrier|wardrobe)\b/gi, tag: 'Shadow_Voyage_Malles_Rigides' },

                // Shadow Order - 4. Montres & Joaillerie
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(bijoux|bague|collier|bracelet|boucle).{0,20}(or|diamant|fine)\b/gi, tag: 'Shadow_Fine_Jewelry' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(haute joaillerie|high jewelry|parure)\b/gi, tag: 'Shadow_Haute_Joaillerie' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(montre|watch|tambour|escale)\b/gi, tag: 'Shadow_Montres' },

                // Shadow Order - 5. Parfums
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(parfum femme|fragrance for her)\b/gi, tag: 'Shadow_Parfums_Femme' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(parfum homme|fragrance for him|cologne|immensité)\b/gi, tag: 'Shadow_Parfums_Homme_Cologne' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(extrait|sympony)\b/gi, tag: 'Shadow_Parfums_Extraits' },

                // Shadow Order - 6. Art de Vivre
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(objet nomade|meuble|furniture|sofa|chair)\b/gi, tag: 'Shadow_ArtDeVivre_Objets_Nomades' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(déco|vase|coussin|plaid|home)\b/gi, tag: 'Shadow_ArtDeVivre_Decoration' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(livre|book|édition|travel book|city guide)\b/gi, tag: 'Shadow_ArtDeVivre_Edition' },
                { regex: /\b(cherch|veut|aimerait|rêve|envie).{0,30}(jeu|game|billard|babyfoot|sport)\b/gi, tag: 'Shadow_ArtDeVivre_Sport_Jeux' }
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
