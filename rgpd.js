/**
 * LVMH Voice-to-Tag - Module RGPD Compliance
 * Détection et suppression des données sensibles selon RGPD Art. 9
 */

const RGPD = {
    stats: { total: 0, health: 0, orientation: 0, politics: 0, religion: 0, family: 0, finance: 0, appearance: 0 },
    detectedItems: [],

    patterns: {
        health: {
            FR: ['burnout', 'dépression', 'anxiété', 'cancer', 'maladie', 'traitement médical', 'opération', 'chirurgie', 'handicap', 'thérapie', 'psychiatre', 'psychologue', 'hôpital', 'médicament', 'diabète', 'allergie sévère', 'asthme', 'épilepsie', 'trouble', 'santé mentale', 'addiction', 'alcool', 'drogue', 'obésité', 'anorexie', 'boulimie', 'insomnie', 'fatigue chronique', 'stress post-traumatique', 'bipol'],
            EN: ['burnout', 'depression', 'anxiety', 'cancer', 'disease', 'medical treatment', 'surgery', 'disability', 'therapy', 'psychiatrist', 'psychologist', 'hospital', 'medication', 'diabetes', 'severe allergy', 'asthma', 'epilepsy', 'disorder', 'mental health', 'addiction', 'alcohol', 'drug', 'obesity', 'anorexia', 'bulimia', 'insomnia', 'chronic fatigue', 'ptsd', 'bipolar', 'high cholesterol', 'gout'],
            ES: ['burnout', 'depresión', 'ansiedad', 'cáncer', 'enfermedad', 'tratamiento médico', 'cirugía', 'discapacidad', 'terapia', 'psiquiatra', 'psicólogo', 'hospital', 'medicamento', 'diabetes', 'alergia severa'],
            IT: ['burnout', 'depressione', 'ansia', 'cancro', 'malattia', 'trattamento medico', 'chirurgia', 'disabilità', 'terapia', 'psichiatra', 'psicologo', 'ospedale', 'farmaco', 'diabete'],
            DE: ['burnout', 'depression', 'angst', 'krebs', 'krankheit', 'medizinische behandlung', 'operation', 'behinderung', 'therapie', 'psychiater', 'psychologe', 'krankenhaus', 'medikament', 'diabetes']
        },
        orientation: {
            FR: ['homosexuel', 'gay', 'lesbienne', 'bisexuel', 'transgenre', 'trans', 'lgbtq', 'orientation sexuelle', 'identité de genre', 'coming out', 'asexuel', 'pansexuel', 'queer', 'non-binaire'],
            EN: ['homosexual', 'gay', 'lesbian', 'bisexual', 'transgender', 'trans', 'lgbtq', 'sexual orientation', 'gender identity', 'coming out', 'asexual', 'pansexual', 'queer', 'non-binary', 'by choice'],
            ES: ['homosexual', 'gay', 'lesbiana', 'bisexual', 'transgénero', 'orientación sexual', 'identidad de género'],
            IT: ['omosessuale', 'gay', 'lesbica', 'bisessuale', 'transgender', 'orientamento sessuale'],
            DE: ['homosexuell', 'schwul', 'lesbisch', 'bisexuell', 'transgender', 'sexuelle orientierung']
        },
        politics: {
            FR: ['vote', 'électeur', 'parti politique', 'gauche', 'droite', 'extrême', 'militant', 'manifestation', 'grève', 'syndicat', 'président', 'gouvernement', 'politique', 'élection', 'macron', 'le pen', 'mélenchon', 'communiste', 'socialiste', 'républicain'],
            EN: ['vote', 'voter', 'political party', 'left wing', 'right wing', 'extremist', 'activist', 'protest', 'strike', 'union', 'president', 'government', 'politics', 'election', 'democrat', 'republican', 'conservative', 'liberal', 'trump', 'biden'],
            ES: ['voto', 'votante', 'partido político', 'izquierda', 'derecha', 'militante', 'manifestación', 'huelga', 'sindicato', 'gobierno', 'elección'],
            IT: ['voto', 'elettore', 'partito politico', 'sinistra', 'destra', 'militante', 'manifestazione', 'sciopero', 'governo', 'elezione'],
            DE: ['wahl', 'wähler', 'politische partei', 'links', 'rechts', 'aktivist', 'demonstration', 'streik', 'gewerkschaft', 'regierung']
        },
        religion: {
            FR: ['catholique', 'musulman', 'juif', 'protestant', 'bouddhiste', 'hindou', 'athée', 'église', 'mosquée', 'synagogue', 'temple', 'prière', 'ramadan', 'carême', 'kippour', 'noël religieux', 'pâques', 'religion', 'croyant', 'foi', 'dieu', 'allah', 'jésus', 'coran', 'bible', 'torah', 'halal', 'casher', 'voile', 'hijab'],
            EN: ['catholic', 'muslim', 'jewish', 'protestant', 'buddhist', 'hindu', 'atheist', 'church', 'mosque', 'synagogue', 'temple', 'prayer', 'ramadan', 'lent', 'religious', 'believer', 'faith', 'god', 'jesus', 'quran', 'bible', 'torah', 'halal', 'kosher', 'hijab'],
            ES: ['católico', 'musulmán', 'judío', 'budista', 'ateo', 'iglesia', 'mezquita', 'sinagoga', 'oración', 'religión', 'creyente', 'fe', 'dios'],
            IT: ['cattolico', 'musulmano', 'ebreo', 'buddista', 'ateo', 'chiesa', 'moschea', 'sinagoga', 'preghiera', 'religione', 'credente', 'fede', 'dio'],
            DE: ['katholisch', 'muslimisch', 'jüdisch', 'buddhistisch', 'atheist', 'kirche', 'moschee', 'synagoge', 'gebet', 'religion', 'gläubig', 'glaube', 'gott']
        },
        family: {
            FR: ['divorce', 'séparation', 'garde des enfants', 'pension alimentaire', 'conflit familial', 'violence conjugale', 'violence domestique', 'adultère', 'tromperie', 'procès famille', 'litige succession', 'héritage contesté', 'abandon', 'maltraitance', 'famille recomposée difficile', 'ex-mari', 'ex-femme', 'rupture difficile'],
            EN: ['divorce', 'separation', 'child custody', 'alimony', 'family conflict', 'domestic violence', 'adultery', 'cheating', 'family court', 'inheritance dispute', 'abandonment', 'abuse', 'difficult breakup', 'ex-husband', 'ex-wife', 'divorced recently', 'post-marriage'],
            ES: ['divorcio', 'separación', 'custodia', 'pensión', 'conflicto familiar', 'violencia doméstica', 'adulterio', 'herencia', 'abandono', 'maltrato', 'divorciada recientemente'],
            IT: ['divorzio', 'separazione', 'affidamento', 'alimenti', 'conflitto familiare', 'violenza domestica', 'adulterio', 'eredità', 'abbandono', 'maltrattamento', 'divorziata'],
            DE: ['scheidung', 'trennung', 'sorgerecht', 'unterhalt', 'familienkonflikt', 'häusliche gewalt', 'untreue', 'erbschaft', 'misshandlung', 'geschieden']
        },
        finance: {
            FR: ['dette', 'faillite', 'banqueroute', 'surendettement', 'crédit refusé', 'problèmes d\'argent', 'insolvable', 'huissier', 'saisie', 'liquidation', 'chômage', 'rsa', 'aide sociale', 'difficultés financières', 'pauvreté', 'précarité'],
            EN: ['debt', 'bankruptcy', 'overindebted', 'credit refused', 'money problems', 'insolvent', 'bailiff', 'seizure', 'liquidation', 'unemployment', 'welfare', 'financial difficulties', 'poverty', 'broke'],
            ES: ['deuda', 'bancarrota', 'embargo', 'problemas de dinero', 'insolvente', 'desempleo', 'ayuda social', 'pobreza', 'dificultades financieras'],
            IT: ['debito', 'bancarotta', 'pignoramento', 'problemi di soldi', 'insolvente', 'disoccupazione', 'povertà', 'difficoltà finanziarie'],
            DE: ['schulden', 'insolvenz', 'pleite', 'geldprobleme', 'arbeitslos', 'sozialhilfe', 'armut', 'finanzielle schwierigkeiten']
        },
        appearance: {
            FR: ['obèse', 'trop gros', 'trop maigre', 'laid', 'moche', 'disgracieux', 'vieux', 'rides', 'calvitie', 'défiguré', 'cicatrice', 'difformité', 'nain', 'géant', 'physique ingrat'],
            EN: ['obese', 'too fat', 'too skinny', 'ugly', 'unattractive', 'old looking', 'wrinkles', 'bald', 'disfigured', 'scar', 'deformity', 'dwarf', 'giant', 'physical appearance'],
            ES: ['obeso', 'gordo', 'flaco', 'feo', 'viejo', 'arrugas', 'calvo', 'cicatriz', 'deformidad'],
            IT: ['obeso', 'grasso', 'magro', 'brutto', 'vecchio', 'rughe', 'calvo', 'cicatrice', 'deformità'],
            DE: ['fettleibig', 'dick', 'dünn', 'hässlich', 'alt', 'falten', 'kahl', 'narbe', 'missbildung']
        }
    },

    escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); },

    scanText(text, language = 'FR') {
        if (!text) return { cleanedText: text, detections: [], totalDetected: 0 };
        const detections = [];
        let cleanedText = text;

        for (const [category, langPatterns] of Object.entries(this.patterns)) {
            const patterns = [...(langPatterns[language] || []), ...(langPatterns['FR'] || []), ...(langPatterns['EN'] || [])];
            const uniquePatterns = [...new Set(patterns)];

            for (const pattern of uniquePatterns) {
                const regex = new RegExp(`\\b${this.escapeRegex(pattern)}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        detections.push({ category, pattern, match, position: text.indexOf(match) });
                        this.stats[category]++;
                        this.stats.total++;
                    });
                    cleanedText = cleanedText.replace(regex, '[RGPD-REMOVED]');
                }
            }
        }

        // Clean up multiple [RGPD-REMOVED] and surrounding text
        cleanedText = cleanedText.replace(/(\[RGPD-REMOVED\]\s*)+/g, '[RGPD-REMOVED] ');
        return { cleanedText, detections, totalDetected: detections.length };
    },

    async processData(data, progressCallback = null) {
        this.stats = { total: 0, health: 0, orientation: 0, politics: 0, religion: 0, family: 0, finance: 0, appearance: 0 };
        this.detectedItems = [];
        const results = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const text = row.cleanedText || row.Transcription || '';
            const lang = row.language || 'FR';

            const { cleanedText, detections, totalDetected } = this.scanText(text, lang);

            if (detections.length > 0) {
                this.detectedItems.push({ id: row.ID || row.id, detections });
            }

            results.push({
                ...row,
                cleanedText,
                rgpd: {
                    detectedCount: totalDetected,
                    detections,
                    isCompliant: totalDetected === 0,
                    wasModified: totalDetected > 0
                }
            });

            if (progressCallback) progressCallback(50 + (i + 1) / data.length * 30, 'Analyse RGPD...');
        }

        return results;
    },

    getStats() { return { ...this.stats }; },

    generateReport() {
        return {
            summary: this.stats,
            detailedFindings: this.detectedItems,
            timestamp: new Date().toISOString(),
            complianceRate: this.stats.total === 0 ? 100 : 0
        };
    }
};
