/**
 * LVMH Voice-to-Tag - Module Tagger
 * Extraction de tags ultra-précis pour enrichir la taxonomie CRM
 * Basé sur la Taxonomie 360° - Louis Vuitton (Version Ultra-Deep)
 */

const Tagger = {
    stats: { totalTags: 0, categories: {} },
    extractedTags: [],

    patterns: {
        // 1. PROFILS (Identity & Power)
        identity: {
            patterns: [
                { regex: /\b(femme|woman|donna|mujer|frau)\b/gi, tag: 'Genre_Femme' },
                { regex: /\b(homme|man|uomo|hombre|mann)\b/gi, tag: 'Genre_Homme' },
                { regex: /\b(couple|pareja|coppia|paar)\b/gi, tag: 'Genre_Couple' },
                { regex: /\b(non[\s-]?binaire|non[\s-]?binary)\b/gi, tag: 'Genre_Non-Binaire' },
                // Générations (approximatif via âge si mentionné, sinon keywords)
                { regex: /\b(gen z|zoommers?|<25|moins de 25)\b/gi, tag: 'Gen_Z' },
                { regex: /\b(millennial|y|25[\s-]?40)\b/gi, tag: 'Millennial' },
                { regex: /\b(gen x|40[\s-]?60)\b/gi, tag: 'Gen_X' },
                { regex: /\b(boomer|60[\s-]?80|60\+)\b/gi, tag: 'Boomer' },
                { regex: /\b(silent|80\+|plus de 80)\b/gi, tag: 'Silent_Generation' },
                // Langues
                { regex: /\b(français|french|francese)\b/gi, tag: 'Langue_Français' },
                { regex: /\b(anglais|english|inglese)\b/gi, tag: 'Langue_Anglais' },
                { regex: /\b(italien|italian|italiano)\b/gi, tag: 'Langue_Italien' },
                { regex: /\b(espagnol|spanish|spagnolo)\b/gi, tag: 'Langue_Espagnol' },
                { regex: /\b(allemand|german|deutsch)\b/gi, tag: 'Langue_Allemand' },
                { regex: /\b(mandarin|chinese|cinese|chino)\b/gi, tag: 'Langue_Mandarin' },
                { regex: /\b(japonais|japanese|giapponese)\b/gi, tag: 'Langue_Japonais' },
                { regex: /\b(arabe|arabic|arabo)\b/gi, tag: 'Langue_Arabe' },
                { regex: /\b(russe|russian|russo)\b/gi, tag: 'Langue_Russe' }
            ],
            category: 'PROFIL_IDENTITÉ'
        },
        // Santé & Médecine
        profession_sante: {
            patterns: [
                { regex: /\b(chirurgien|surgeon).{0,20}(cardi|thorac)/gi, tag: 'Chirurgien_Cardiothoracique' },
                { regex: /\b(chirurgien|surgeon).{0,20}(ortho)/gi, tag: 'Chirurgien_Orthopédique' },
                { regex: /\b(chirurgien|surgeon).{0,20}(maxillo|facial)/gi, tag: 'Chirurgien_Maxillo_Facial' },
                { regex: /\b(chirurgien|surgeon).{0,20}(esthétique|plastique|plastic)/gi, tag: 'Chirurgien_Esthetique' },
                { regex: /\b(neurologue|neurologist)\b/gi, tag: 'Neurologue' },
                { regex: /\b(cardiologue|cardiologist)\b/gi, tag: 'Cardiologue' },
                { regex: /\b(dermatologue|dermatologist|derma)\b/gi, tag: 'Dermatologue' },
                { regex: /\b(dentiste|dentist|orthodontiste)\b/gi, tag: 'Dentiste_Orthodontiste' },
                { regex: /\b(pharmacien|pharmacist).{0,20}(titulaire|owner)/gi, tag: 'Pharmacien_Titulaire' },
                { regex: /\b(chercheur|researcher).{0,20}(bio|tech|pharma)/gi, tag: 'Chercheur_Biotech' },
                { regex: /\b(médecin|doctor|docteur)\b/gi, tag: 'Médecin_Généraliste' }
            ],
            category: 'PROFIL_PRO_SANTÉ'
        },
        // Finance
        profession_finance: {
            patterns: [
                { regex: /\b(hedge fund|fonds spéculatif)\b/gi, tag: 'Hedge_Fund_Manager' },
                { regex: /\b(trader).{0,15}(forex|commodit|matières|bourse)/gi, tag: 'Trader_Forex_Commodities' },
                { regex: /\b(asset manager|gestionnaire d'actifs)\b/gi, tag: 'Asset_Manager' },
                { regex: /\b(private equity|capital investissement)\b/gi, tag: 'Partner_Private_Equity' },
                { regex: /\b(venture capital|vc|capital risque)\b/gi, tag: 'Venture_Capitalist' },
                { regex: /\b(angel investor|business angel)\b/gi, tag: 'Angel_Investor' },
                { regex: /\b(investment bank|banquier d'affaires|m&a)\b/gi, tag: 'Investment_Banker_M&A' },
                { regex: /\b(wealth manager|banquier privé|gestion de fortune)\b/gi, tag: 'Banquier_Privé' },
                { regex: /\b(crypto|bitcoin|eth|blockchain|nft).{0,20}(expert|whale|investor)/gi, tag: 'Expert_Crypto_Blockchain' },
                { regex: /\b(finance|banque|bank).{0,20}(directeur|director|vp|head)/gi, tag: 'Finance_Executive' }
            ],
            category: 'PROFIL_PRO_FINANCE'
        },
        // Droit & Légal
        profession_legal: {
            patterns: [
                { regex: /\b(avocat|lawyer|attorney).{0,20}(m&a|corporate|affaires)/gi, tag: 'Avocat_M&A_Corporate' },
                { regex: /\b(avocat|lawyer).{0,20}(propriété|intellectuelle|ip|brevet)/gi, tag: 'Avocat_IP' },
                { regex: /\b(avocat|lawyer).{0,20}(famille|divorce)/gi, tag: 'Avocat_Droit_Famille' },
                { regex: /\b(avocat|lawyer).{0,20}(droits de l'homme|human rights|ong)/gi, tag: 'Avocat_Droits_Homme' },
                { regex: /\b(magistrat|juge|judge)\b/gi, tag: 'Magistrat_Juge' },
                { regex: /\b(notaire|notary)\b/gi, tag: 'Notaire' },
                { regex: /\b(commissaire priseur|auctioneer)\b/gi, tag: 'Commissaire_Priseur' }
            ],
            category: 'PROFIL_PRO_LÉGAL'
        },
        // Art & Créatif
        profession_art: {
            patterns: [
                { regex: /\b(galeriste|gallery owner)\b/gi, tag: 'Galeriste' },
                { regex: /\b(curateur|curator)\b/gi, tag: 'Curateur_Musée' },
                { regex: /\b(art advisor|conseiller art)\b/gi, tag: 'Consultant_Art' },
                { regex: /\b(architecte|architect).{0,10}(dplg|senior|principal)?\b/gi, tag: 'Architecte' },
                { regex: /\b(designer|décorateur).{0,20}(intérieur|interior)/gi, tag: 'Designer_Intérieur' },
                { regex: /\b(paysagiste|landscape)\b/gi, tag: 'Paysagiste' },
                { regex: /\b(chef d'orchestre|conductor)\b/gi, tag: 'Chef_Orchestre' },
                { regex: /\b(soliste|soloist|pianiste|violoniste)\b/gi, tag: 'Soliste_Classique' },
                { regex: /\b(producteur|producer).{0,10}(cinéma|film|movie)/gi, tag: 'Producteur_Cinema' },
                { regex: /\b(agent artistique|talent agent)\b/gi, tag: 'Agent_Artistique' },
                { regex: /\b(artiste|artist|peintre|sculpteur)\b/gi, tag: 'Artiste' }
            ],
            category: 'PROFIL_PRO_ART'
        },
        // Corporate Business
        profession_biz: {
            patterns: [
                { regex: /\b(ceo|pdg|dg|directeur général|chief executive)\b/gi, tag: 'CEO_Dirigeant' },
                { regex: /\b(board member|conseil d'administration|administrateur)\b/gi, tag: 'Board_Member' },
                { regex: /\b(fondateur|founder|cofondateur).{0,20}(family office)/gi, tag: 'Fondateur_Family_Office' },
                { regex: /\b(immobilier|real estate|promoteur).{0,20}(luxe|luxury)/gi, tag: 'Immobilier_Luxe' },
                { regex: /\b(tech|startup).{0,10}(founder|fondateur|entrepreneur)/gi, tag: 'Tech_Founder' },
                { regex: /\b(fashion|mode|pr|communication)\b/gi, tag: 'Fashion_PR_Com' }
            ],
            category: 'PROFIL_PRO_BIZ'
        },
        // Sphère Publique
        profession_public: {
            patterns: [
                { regex: /\b(diplomate|diplomat|ambassadeur|ambassador)\b/gi, tag: 'Diplomate_Ambassadeur' },
                { regex: /\b(athlète|athlete|sportif|player|joueur).{0,10}(pro|haut niveau)/gi, tag: 'Athlète_Pro' },
                { regex: /\b(football|tennis|f1|formule 1)/gi, tag: 'Athlète_Pro_Sport' },
                { regex: /\b(politique|politician|deputé|senateur|ministre)\b/gi, tag: 'Politique' }
            ],
            category: 'PROFIL_PRO_PUBLIC'
        },
        // Influence
        influence: {
            patterns: [
                { regex: /\b(micro).{0,10}(influence|follower)/gi, tag: 'Influence_Micro' },
                { regex: /\b(macro).{0,10}(influence|follower)/gi, tag: 'Influence_Macro' },
                { regex: /\b(mega|million).{0,10}(influence|follower)/gi, tag: 'Influence_Mega' },
                { regex: /\b(célébrité|celebrity|star|famous)/gi, tag: 'Célébrité_Mondiale' },
                { regex: /\b(opinion leader|b2b|linkedin)/gi, tag: 'Leader_Opinion_B2B' },
                { regex: /\b(instagram|tiktok|linkedin|twitch|crypto native)/gi, tag: 'Digital_Active' }
            ],
            category: 'PROFIL_INFLUENCE'
        },

        // 2. INTÉRÊTS & CERCLES (Passion Points)
        cercles: {
            patterns: [
                { regex: /\b(racing club|lagardère|boulie|stade français)/gi, tag: 'Club_Sportif_Paris' },
                { regex: /\b(queens club|hurlingham|mcc|lords|wentworth)/gi, tag: 'Club_Sportif_UK' },
                { regex: /\b(soho house|cercle interallié|arts club|silencio)/gi, tag: 'Club_Social_Arts' },
                { regex: /\b(yacht club|monaco|ycm)/gi, tag: 'Club_Yachting' },
                { regex: /\b(alumni|ancien élève).{0,20}(harvard|yale|oxford|cambridge)/gi, tag: 'Alumni_Ivy_League' },
                { regex: /\b(alumni|ancien élève).{0,20}(hec|polytechnique|sorbonne|essec|ena)/gi, tag: 'Alumni_Grandes_Ecoles' }
            ],
            category: 'PASSION_CERCLES'
        },
        collection: {
            patterns: [
                { regex: /\b(montre|watch).{0,15}(vintage|ancienne)/gi, tag: 'Montres_Vintage' },
                { regex: /\b(montre|watch).{0,15}(complication|tourbillon)/gi, tag: 'Montres_Complications' },
                { regex: /\b(patek|rolex|audemars)/gi, tag: 'Montres_Collector' },
                { regex: /\b(livre|book|bibliophil).{0,15}(rare|ancien|manuscrit|édition originale)/gi, tag: 'Bibliophilie' },
                { regex: /\b(art).{0,15}(contemporain|emergent|jeune création)/gi, tag: 'Art_Contemporain' },
                { regex: /\b(maître|master|ancien).{0,15}(peinture|tableau)/gi, tag: 'Art_Maîtres_Anciens' },
                { regex: /\b(photo).{0,15}(fine art|tirage|print)/gi, tag: 'Photographie_Art' },
                { regex: /\b(nft|digital art)/gi, tag: 'NFT_Art' },
                { regex: /\b(vin|wine|grand cru|bordeaux|modena|mouton)/gi, tag: 'Vins_Grands_Crus' },
                { regex: /\b(bourgogne|burgundy|romanée|tâche)/gi, tag: 'Vins_Bourgogne_Rare' },
                { regex: /\b(whisky|whiskey).{0,15}(japon|japan|suntory)/gi, tag: 'Whisky_Japonais' },
                { regex: /\b(cognac|armagnac).{0,15}(prestige|louis xiii)/gi, tag: 'Cognac_Prestige' }
            ],
            category: 'PASSION_COLLECTION'
        },
        sport: {
            patterns: [
                { regex: /\b(tennis).{0,20}(compétition|tournoi|match)/gi, tag: 'Tennis_Compétition' },
                { regex: /\b(padel|paddle)/gi, tag: 'Padel' },
                { regex: /\b(squash)/gi, tag: 'Squash' },
                { regex: /\b(real tennis|jeu de paume)/gi, tag: 'Jeu_de_Paume' },
                { regex: /\b(golf).{0,20}(handicap|bas| <10|single)/gi, tag: 'Golf_Expert' },
                { regex: /\b(golf).{0,30}(collection|matériel|equipment)/gi, tag: 'Golf_Collectionneur' },
                { regex: /\b(yacht|superyacht|boat|bateau).{0,20}(owner|propriétaire)/gi, tag: 'Propriétaire_Yacht' },
                { regex: /\b(voile|sail|regatta|régate)/gi, tag: 'Voile_Compétition' },
                { regex: /\b(kitesurf|kite|surf|windsurf)/gi, tag: 'Surf_Kite_Freestyle' },
                { regex: /\b(triathlon|ironman)/gi, tag: 'Triathlon_Ironman' },
                { regex: /\b(marathon|major)/gi, tag: 'Marathon_Six_Majors' },
                { regex: /\b(alpinisme|himalaya|climbing|everest|mont blanc)/gi, tag: 'Alpinisme_Extreme' },
                { regex: /\b(yoga).{0,20}(ashtanga|vinyasa)/gi, tag: 'Yoga_Expert' },
                { regex: /\b(pilates).{0,20}(reformer|machine)/gi, tag: 'Pilates_Reformer' },
                { regex: /\b(méditation|meditation|mindfulness)/gi, tag: 'Méditation' },
                { regex: /\b(pilote|driver|racing).{0,20}(gentleman|amateur)/gi, tag: 'Pilote_Gentleman_Driver' },
                { regex: /\b(ferrari|porsche|lamborghini|aston).{0,20}(collection)/gi, tag: 'Collectionneur_Cars' },
                { regex: /\b(f1|paddock|club)/gi, tag: 'F1_Paddock_Club' }
            ],
            category: 'PASSION_SPORT'
        },
        culture: {
            patterns: [
                { regex: /\b(ukiyo-e|estampe|japon)/gi, tag: 'Art_Japonais' },
                { regex: /\b(minimalis)/gi, tag: 'Art_Minimalisme' },
                { regex: /\b(wabi.?sabi)/gi, tag: 'Art_Wabi_Sabi' },
                { regex: /\b(bauhaus)/gi, tag: 'Art_Bauhaus' },
                { regex: /\b(art déco|art deco)/gi, tag: 'Art_Déco' },
                { regex: /\b(opéra|opera).{0,20}(bayreuth|scala|garnier|met)/gi, tag: 'Opéra_Expert' },
                { regex: /\b(classique|symphoni|philharmoni)/gi, tag: 'Musique_Symphonique' },
                { regex: /\b(jazz).{0,20}(festival|montreux)/gi, tag: 'Jazz_Festival' },
                { regex: /\b(michelin|étoilé|starred).{0,20}(chef|restaurant)/gi, tag: 'Gastro_Michelin' },
                { regex: /\b(kaiseki|omakase)/gi, tag: 'Gastro_Japonaise' },
                { regex: /\b(chef).{0,20}(domicile|privé|private)/gi, tag: 'Chef_à_Domicile' },
                { regex: /\b(botanique|botanic|orchidée|orchid)/gi, tag: 'Botanique_Orchidées' },
                { regex: /\b(paysagisme|jardin).{0,20}(japonais|anglais)/gi, tag: 'Jardin_Paysagisme' }
            ],
            category: 'PASSION_CULTURE'
        },
        valeurs: {
            patterns: [
                { regex: /\b(écologie|ecolo|durability|sustainab).{0,20}(éco|eco)/gi, tag: 'Écologie_Durabilité' },
                { regex: /\b(zéro déchet|zero waste|upcycling)/gi, tag: 'Zéro_Déchet' },
                { regex: /\b(vegan).{0,10}(strict)/gi, tag: 'Vegan_Strict' },
                { regex: /\b(cruelty.?free|sans cruauté)/gi, tag: 'Cruelty_Free' },
                { regex: /\b(héritage|heritage|patrimoine)/gi, tag: 'Héritage_Patrimoine' },
                { regex: /\b(artisanat|crafts|métiers d'art)/gi, tag: 'Artisanat_Art' },
                { regex: /\b(made in france|fabriqué en france)/gi, tag: 'Made_In_France' }
            ],
            category: 'VALEURS'
        },

        // 3. VOYAGE
        voyage: {
            patterns: [
                // Types
                { regex: /\b(resort|palace|grand hotel|5 stars).{0,20}(maldives|seychelles|poly)/gi, tag: 'Voyage_Loisir_Luxe' },
                { regex: /\b(chalet|ski).{0,20}(privé|private|courchevel|gstaad)/gi, tag: 'Voyage_Ski_Luxe' },
                { regex: /\b(safari).{0,20}(big 5|botswana|kenya|tanzani|africa)/gi, tag: 'Voyage_Safari' },
                { regex: /\b(polaire|polar|antarctique|arctic)/gi, tag: 'Expédition_Polaire' },
                { regex: /\b(trek|hike).{0,20}(himalaya|nepal|andes)/gi, tag: 'Trekking_Aventure' },
                { regex: /\b(retraite|retreat|ashram).{0,20}(ayurved|inde|india)/gi, tag: 'Retraite_Ayurvédique' },
                { regex: /\b(detox|clinic|clinique).{0,20}(suisse|swiss|chenot|laprairie)/gi, tag: 'Detox_Clinic_Suisse' },
                { regex: /\b(grand tour|italie|italy|venise|rome|florence)/gi, tag: 'Grand_Tour_Italie' },
                { regex: /\b(tour).{0,20}(japon|japan|kyoto|temple)/gi, tag: 'Immersion_Japon' },
                { regex: /\b(festival).{0,20}(cannes|venise|berlin)/gi, tag: 'Festival_Cinéma' },
                { regex: /\b(roadshow|déplacement pro|business trip)/gi, tag: 'Voyage_Business' },
                { regex: /\b(fashion week|fw|pfw|mfw|nyfw)/gi, tag: 'Voyage_Fashion_Week' },
                // Destinations
                { regex: /\b(tokyo|kyoto|naoshima|seoul|bali|australi)/gi, tag: 'Dest_Asie_Pacifique' },
                { regex: /\b(nyc|new york|manhattan|hamptons|miami|basel|aspen|vail|st barth|patagoni)/gi, tag: 'Dest_Amériques' },
                { regex: /\b(londres|london|mayfair|chelsea|paris|triangle d'or|côte d'azur|monaco|st tropez|cap ferrat)/gi, tag: 'Dest_Europe_Luxe' },
                { regex: /\b(gstaad|verbier|st moritz|zermatt)/gi, tag: 'Dest_Alpes_Suisses' },
                { regex: /\b(toscane|tuscany|como|côme|amalfi)/gi, tag: 'Dest_Italie' },
                { regex: /\b(dubaï|dubai|abu dhabi|marrakech|cap|cape town)/gi, tag: 'Dest_Afrique_MO' }
            ],
            category: 'VOYAGE'
        },

        // 4. INTENTION D'ACHAT
        intention_destinataire: {
            patterns: [
                { regex: /\b(pour moi|for me|mon plaisir|my treat|auto.cadeau)/gi, tag: 'Pour_Soi_Reward' },
                { regex: /\b(conjoint|mari|femme|époux|épouse|partner|husband|wife).{0,10}(cadeau|gift)/gi, tag: 'Pour_Partner' },
                { regex: /\b(amant|mistress|lover|discret)/gi, tag: 'Pour_Amant_Secret' },
                { regex: /\b(mère|mother|maman|père|father|papa).{0,10}(cadeau|gift)/gi, tag: 'Pour_Parents' },
                { regex: /\b(enfant|kid|child|teen|ado).{0,10}(cadeau|gift)/gi, tag: 'Pour_Enfant' },
                { regex: /\b(assistant|pa|secrétaire).{0,10}(cadeau|gift)/gi, tag: 'Pour_Assistant' },
                { regex: /\b(client|business).{0,10}(cadeau|gift|deal)/gi, tag: 'Pour_Client_VIP' },
                { regex: /\b(employé|employee|staff|équipe).{0,10}(cadeau|reward)/gi, tag: 'Pour_Employé' },
                { regex: /\b(host|hote|hotesse|invitation).{0,10}(cadeau|gift)/gi, tag: 'Cadeau_Hôtesse' },
                { regex: /\b(wedding list|liste mariage)/gi, tag: 'Pour_Liste_Mariage' }
            ],
            category: 'SALES_DESTINATAIRE'
        },
        intention_occasion: {
            patterns: [
                { regex: /\b(18|21|30|40|50|60).{0,5}(ans|years|bday|anniversaire)/gi, tag: 'Anniversaire_Marquant' },
                { regex: /\b(naissance|birth|babyshower|baby shower)/gi, tag: 'Naissance_Babyshower' },
                { regex: /\b(baptême|communion|christening)/gi, tag: 'Baptême_Communion' },
                { regex: /\b(mariage|wedding|fiançailles|engagement)/gi, tag: 'Mariage_Fiançailles' },
                { regex: /\b(divorce|separation|breakup).{0,10}(party|fête)/gi, tag: 'Divorce_Party' },
                { regex: /\b(premier job|first job|embauche|promotion|bonus)/gi, tag: 'Carrière_Milestone' },
                { regex: /\b(retraite|retirement|départ)/gi, tag: 'Retraite' },
                { regex: /\b(vente|sale|exit).{0,10}(entreprise|company|business)/gi, tag: 'Vente_Entreprise_Exit' },
                { regex: /\b(diplôme|graduation|phd|master|bachelor)/gi, tag: 'Diplomation' },
                { regex: /\b(noël|christmas|xmas|hanoucca|hanukkah)/gi, tag: 'Fêtes_Fin_Année' },
                { regex: /\b(nouvel an chinois|cny|lunar)/gi, tag: 'Nouvel_An_Chinois' },
                { regex: /\b(ramadan|eid|aïd)/gi, tag: 'Ramadan_Eid' },
                { regex: /\b(diwali)/gi, tag: 'Diwali' },
                { regex: /\b(saint valentin|valentine)/gi, tag: 'Saint_Valentin' },
                { regex: /\b(fête des mères|fête des pères|mothers day|fathers day)/gi, tag: 'Fête_Parents' }
            ],
            category: 'SALES_OCCASION'
        },
        intention_nature: {
            patterns: [
                { regex: /\b(coup de tête|impuls|impulsif|craquage)/gi, tag: 'Achat_Impulsif' },
                { regex: /\b(thérapie|therapy|remonter le moral|consolation)/gi, tag: 'Shopping_Thérapie' },
                { regex: /\b(souvenir|paris).{0,10}(trip|voyage)/gi, tag: 'Souvenir_Voyage' }
            ],
            category: 'SALES_NATURE'
        },

        // 5. SÉCURITÉ & HOSPITALITY (RGPD - Justification Service)
        securite_sante: {
            patterns: [
                { regex: /\b(arachide|peanut|fruit à coque|nut|noisette|hazelnut)/gi, tag: 'DANGER_Allergie_Arachides' },
                { regex: /\b(crustacé|shellfish|fruit de mer)/gi, tag: 'DANGER_Allergie_Crustacés' },
                { regex: /\b(latex)/gi, tag: 'Allergie_Contact_Latex' },
                { regex: /\b(nickel|bijoux|metal)/gi, tag: 'Allergie_Contact_Nickel' },
                { regex: /\b(laine|wool|mohair|alpaga)/gi, tag: 'Allergie_Contact_Laine' },
                { regex: /\b(parfum|fragrance|scent).{0,20}(asthme|toux|gêne)/gi, tag: 'Allergie_Parfum_Asthme' },
                { regex: /\b(poussière|dust|acarien)/gi, tag: 'Allergie_Poussière' },
                { regex: /\b(fleur|flower|pollen|bouquet)/gi, tag: 'Allergie_Fleurs_Pollen' },
                { regex: /\b(gluten|céliaque|celiac)/gi, tag: 'Maladie_Céliaque_Sans_Gluten' },
                { regex: /\b(lactose|lait|milk|dairy)/gi, tag: 'Intolérance_Lactose' },
                { regex: /\b(diabète|diabétique|diabetes|sucre|sugar)/gi, tag: 'Régime_Diabétique' },
                { regex: /\b(keto|low carb|cétogène)/gi, tag: 'Régime_Keto' },
                { regex: /\b(vegan|végétalien).{0,20}(cuir|leather|laine|wool)/gi, tag: 'Vegan_Strict_No_Leather' },
                { regex: /\b(végétarien|vegetarian)/gi, tag: 'Végétarien' },
                { regex: /\b(halal)/gi, tag: 'Halal' },
                { regex: /\b(casher|kosher)/gi, tag: 'Casher' },
                { regex: /\b(alcool|alcohol|vin|wine).{0,10}(pas|no|zero|0)/gi, tag: 'Teetotaler_Zéro_Alcool' },
                { regex: /\b(fauteuil|wheelchair|roulant)/gi, tag: 'Access_Fauteuil_Roulant' },
                { regex: /\b(marcher|walk|escalier|stairs).{0,20}(difficil|hard|pain)/gi, tag: 'Access_Difficulté_Marche' },
                { regex: /\b(assis|sit|chair|chaise).{0,10}(besoin|need|immédiat)/gi, tag: 'Besoin_Assise_Immédiate' }
            ],
            category: 'SÉCURITÉ_HOSPITALITY'
        },
        privacy: {
            patterns: [
                { regex: /\b(entrée privée|private entrance|back door)/gi, tag: 'MANDATORY_Entrée_Privée' },
                { regex: /\b(salon privé|private room|salon isolé)/gi, tag: 'MANDATORY_Salon_Privé' },
                { regex: /\b(photo|picture|camera).{0,10}(pas|no|interdit)/gi, tag: 'MANDATORY_Pas_de_Photos' }
            ],
            category: 'SÉCURITÉ_PRIVACY'
        },

        // 6. UNIVERS LV
        relation_lv: {
            patterns: [
                { regex: /\b(monogram).{0,20}(aime|love|fan|adore)/gi, tag: 'Profil_Amoureux_Monogram' },
                { regex: /\b(damier).{0,20}(aime|love|fan|adore)/gi, tag: 'Profil_Fan_Damier' },
                { regex: /\b(exotique|exotic|croco|python|leZard).{0,20}(aime|love|fan|adore|cherche|buy)/gi, tag: 'Profil_Cuirs_Exotiques' },
                { regex: /\b(haute horlogerie|high watch|tambour)/gi, tag: 'Profil_Haute_Horlogerie' },
                { regex: /\b(malle|trunk).{0,20}(propriétaire|owner|collection)/gi, tag: 'Profil_Propriétaire_Malles' },
                { regex: /\b(objets nomades|furniture|meuble)/gi, tag: 'Profil_Objets_Nomades' },
                { regex: /\b(génération|famille|mère|fille).{0,30}(client|lv|vuitton)/gi, tag: 'Client_Multi-Générationnel' },
                { regex: /\b(commande spéciale|special order|mto|sur mesure)/gi, tag: 'Client_Commande_Spéciale' },
                { regex: /\b(défilé|show|catwalk).{0,20}(invité|guest)/gi, tag: 'Invité_Défilé' },
                { regex: /\b(ghesquière|nicolas).{0,20}(style|fan)/gi, tag: 'Style_Ghesquière' },
                { regex: /\b(pharrell|williams|homme).{0,20}(style|fan)/gi, tag: 'Style_Pharrell' }
            ],
            category: 'UNIVERS_LV'
        },

        // 7. HISTORIQUE & PRODUITS (Succès)
        historique_produit: {
            patterns: [
                // Sacs Femme
                { regex: /\b(neverfull|loop|diane)\b/gi, tag: 'Owns_Sac_Épaule' },
                { regex: /\b(pochette métis|metis|multi pochette)\b/gi, tag: 'Owns_Sac_Crossbody' },
                { regex: /\b(capucines|alma|speedy)\b/gi, tag: 'Owns_Sac_TopHandle' },
                { regex: /\b(onthego)\b/gi, tag: 'Owns_Cabas_Tote' },
                { regex: /\b(petite malle|twist|coussin)\b/gi, tag: 'Owns_Sac_Soir' },
                { regex: /\b(palm springs)\b/gi, tag: 'Owns_Sac_Dos_F' },
                // SLG Femme
                { regex: /\b(zippy|sarah|victorine)\b/gi, tag: 'Owns_Portefeuille_F' },
                { regex: /\b(recto verso|rosalie)\b/gi, tag: 'Owns_Porte-Cartes_F' },
                // Voyage
                { regex: /\b(keepall)\b/gi, tag: 'Owns_Bagage_Souple' },
                { regex: /\b(horizon|valise|rolling)\b/gi, tag: 'Owns_Valise' },
                { regex: /\b(malle courrier|coffret montre|watch case)\b/gi, tag: 'Owns_Malle_Rigide' },
                // Homme
                { regex: /\b(christopher|discovery|dean).{0,10}(back|dos)/gi, tag: 'Owns_Sac_Dos_H' },
                { regex: /\b(trio|messenger|district|s-lock|slock)/gi, tag: 'Owns_Messenger_H' },
                { regex: /\b(porte-documents|pdv|business bag)/gi, tag: 'Owns_Business_Bag' },
                { regex: /\b(bumbag|body bag|keepall xs)/gi, tag: 'Owns_Body_Bag' },
                { regex: /\b(sac plat|tote)\b/gi, tag: 'Owns_Tote_H' },
                { regex: /\b(organizer|pocket|poche).{0,10}(organise|organiz)/gi, tag: 'Owns_Pocket_Organizer' },
                { regex: /\b(brazza|multiple).{0,10}(wallet|portefeuille)/gi, tag: 'Owns_Portefeuille_H' },
                // Wear
                { regex: /\b(taille|size|tag).{0,10}(34|36|38|40|42|44)\b/gi, tag: 'Taille_Femme_Connu' },
                { regex: /\b(taille|size|tag).{0,10}(48|50|52|54|56)\b/gi, tag: 'Taille_Homme_Connu' },
                { regex: /\b(taille|size|tag|pointure).{0,10}(36|37|38|39|40|41|42|43|44|45)\b/gi, tag: 'Pointure_Soulier_Connu' }
            ],
            category: 'HISTORIQUE_POSSESSION'
        },

        // 8. OPÉRATIONNEL (Actions)
        action_crm: {
            patterns: [
                { regex: /\b(rappeler|call back|recontacter).{0,20}(urgent|demain|soon)/gi, tag: 'ACTION_Rappeler_Urgent' },
                { regex: /\b(whatsapp|message|sms|text).{0,20}(envoyer|send)/gi, tag: 'ACTION_Message_WhatsApp' },
                { regex: /\b(email|mail).{0,20}(envoyer|send|confirmer)/gi, tag: 'ACTION_Email' },
                { regex: /\b(invit|invite).{0,20}(défilé|event|show|dîner)/gi, tag: 'ACTION_Invitation' },
                { regex: /\b(envoyer|send|livrer).{0,20}(cadeau|gift|fleur)/gi, tag: 'ACTION_Envoi_Cadeau' },
                { regex: /\b(fin du mois|end of month)\b/gi, tag: 'TIMING_Fin_Mois' },
                { regex: /\b(saison prochaine|next season|collection prochaine)/gi, tag: 'TIMING_Saison_Prochaine' }
            ],
            category: 'ACTION_REQUISE'
        },

        // 9. DOULEURS & MANQUÉS
        douleurs: {
            patterns: [
                { regex: /\b(rupture|out of stock|unavailable|pas disponible)/gi, tag: 'MISS_Rupture_Stock' },
                { regex: /\b(taille|size|fit).{0,20}(pas bon|wrong|indisponible|trop grand|trop petit)/gi, tag: 'MISS_Problème_Taille' },
                { regex: /\b(voulait|wanted).{0,20}(or|gold).{0,20}(vu|saw).{0,20}(argent|silver)/gi, tag: 'MISS_Finition_Non_Dispo' },
                { regex: /\b(déçu|disappointed|frustré|frustrated|attente|wait)\b/gi, tag: 'PAIN_Expérience_Négative' },
                { regex: /\b(livraison|delivery).{0,20}(retard|late|long|problème)/gi, tag: 'PAIN_Problème_Logistique' },
                { regex: /\b(sav|repair|réparation).{0,20}(long|problème|cours)/gi, tag: 'PAIN_SAV_En_Cours' }
            ],
            category: 'OPPORTUNITÉ_MANQUÉE'
        }
    },

    extractTags(text) {
        if (!text) return [];
        const tags = [];
        // Normalisation légère pour la recherche (garder accents pour précision FR)
        // Mais regex sont généralement case-insensitive (/gi)
        
        for (const [groupName, group] of Object.entries(this.patterns)) {
            for (const pattern of group.patterns) {
                // Reset lastIndex à chaque fois car on utilise le pattern plusieurs fois
                pattern.regex.lastIndex = 0;
                if (pattern.regex.test(text)) {
                    if (!tags.find(t => t.tag === pattern.tag)) {
                        tags.push({ 
                            tag: pattern.tag, 
                            category: group.category, 
                            group: groupName,
                            confidence: 'Haute (Regex Expert)'
                        });
                    }
                }
            }
        }

        return tags;
    },

    // Méthode pour obtenir des statistiques sur un dataset complet
    processDataset(dataset) {
        this.stats = { totalTags: 0, categories: {} };
        const results = dataset.map(row => {
            const text = row.clean || row.cleanedText || row.Transcription || '';
            const tags = this.extractTags(text);
            
            tags.forEach(t => {
                this.stats.totalTags++;
                if (!this.stats.categories[t.category]) this.stats.categories[t.category] = 0;
                this.stats.categories[t.category]++;
            });

            return { ...row, tags };
        });
        return results;
    }
};

// Export pour utilisation module ou browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tagger;
} else {
    window.Tagger = Tagger;
}
