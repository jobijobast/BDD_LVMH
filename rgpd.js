/**
 * LVMH Voice-to-Tag - Module RGPD Compliance
 * Détection et suppression des données sensibles selon RGPD Art. 9
 */

const RGPD = {
    stats: { total: 0, health: 0, orientation: 0, politics: 0, religion: 0, family: 0, finance: 0, appearance: 0 },
    detectedItems: [],

    // DONNÉES À SUPPRIMER : compromettent la vie privée, aucune justification business possible
    // Les allergies, régimes, professions, préférences = données LÉGITIMES avec justification LVMH
    patterns: {
        // Codes et identifiants sensibles
        accessCodes: {
            FR: ['code porte', 'digicode', 'mot de passe', 'code secret', 'pin', 'code d\'accès', 'code carte', 'code bancaire'],
            EN: ['door code', 'password', 'pin code', 'access code', 'secret code', 'card code', 'bank code'],
            ES: ['código puerta', 'contraseña', 'código secreto', 'código acceso', 'pin'],
            IT: ['codice porta', 'password', 'codice segreto', 'codice accesso', 'pin'],
            DE: ['türcode', 'passwort', 'geheimcode', 'zugangscode', 'pin']
        },
        // Numéros d'identité
        identity: {
            FR: ['numéro sécurité sociale', 'numéro passeport', 'numéro permis', 'numéro carte identité', 'iban', 'numéro carte bancaire'],
            EN: ['social security number', 'passport number', 'driver license', 'id number', 'iban', 'credit card number', 'bank account'],
            ES: ['número seguridad social', 'número pasaporte', 'número dni', 'iban', 'número tarjeta'],
            IT: ['codice fiscale', 'numero passaporto', 'numero carta identità', 'iban', 'numero carta'],
            DE: ['sozialversicherungsnummer', 'passnummer', 'personalausweis', 'iban', 'kontonummer']
        },
        // Orientation sexuelle explicite
        orientation: {
            FR: ['homosexuel', 'gay', 'lesbienne', 'bisexuel', 'transgenre', 'lgbtq', 'orientation sexuelle', 'coming out'],
            EN: ['homosexual', 'gay', 'lesbian', 'bisexual', 'transgender', 'lgbtq', 'sexual orientation', 'coming out'],
            ES: ['homosexual', 'gay', 'lesbiana', 'bisexual', 'transgénero', 'orientación sexual'],
            IT: ['omosessuale', 'gay', 'lesbica', 'bisessuale', 'transgender', 'orientamento sessuale'],
            DE: ['homosexuell', 'schwul', 'lesbisch', 'bisexuell', 'transgender', 'sexuelle orientierung']
        },
        // Opinions politiques
        politics: {
            FR: ['vote pour', 'électeur de', 'militant', 'parti politique', 'extrême gauche', 'extrême droite', 'communiste', 'macroniste', 'lepéniste'],
            EN: ['voted for', 'supporter of', 'political party', 'democrat voter', 'republican voter', 'activist for'],
            ES: ['voto por', 'militante', 'partido político', 'izquierda', 'derecha'],
            IT: ['voto per', 'militante', 'partito politico', 'sinistra', 'destra'],
            DE: ['wähler von', 'aktivist', 'politische partei', 'links', 'rechts']
        },
        // Religion détaillée
        religion: {
            FR: ['pratiquant', 'converti', 'croyant fervent', 'fait le ramadan', 'va à la messe', 'prie tous les jours'],
            EN: ['practicing', 'converted to', 'devout', 'observes ramadan', 'attends church', 'prays daily'],
            ES: ['practicante', 'convertido', 'devoto', 'hace ramadán', 'va a misa'],
            IT: ['praticante', 'convertito', 'devoto', 'fa ramadan', 'va a messa'],
            DE: ['praktizierend', 'konvertiert', 'gläubig', 'fastet ramadan', 'geht zur kirche']
        },
        // Conflits familiaux graves
        familyConflict: {
            FR: ['violence conjugale', 'violence domestique', 'maltraitance', 'conflit garde', 'pension contestée', 'procès famille'],
            EN: ['domestic violence', 'abuse', 'custody battle', 'alimony dispute', 'family court'],
            ES: ['violencia doméstica', 'maltrato', 'batalla custodia'],
            IT: ['violenza domestica', 'maltrattamento', 'battaglia affidamento'],
            DE: ['häusliche gewalt', 'misshandlung', 'sorgerechtsstreit']
        },
        // Problèmes financiers
        finance: {
            FR: ['dette', 'faillite', 'surendettement', 'huissier', 'saisie', 'interdit bancaire', 'rsa', 'chômeur'],
            EN: ['debt', 'bankruptcy', 'bailiff', 'foreclosure', 'welfare', 'unemployed broke'],
            ES: ['deuda', 'bancarrota', 'embargo', 'desempleado'],
            IT: ['debito', 'bancarotta', 'pignoramento', 'disoccupato'],
            DE: ['schulden', 'insolvenz', 'pleite', 'arbeitslos', 'hartz']
        },
        // Jugements physiques dégradants
        appearance: {
            FR: ['obèse', 'trop gros', 'trop maigre', 'laid', 'moche', 'vieux', 'ridé', 'défiguré'],
            EN: ['obese', 'too fat', 'ugly', 'unattractive', 'old looking', 'disfigured'],
            ES: ['obeso', 'gordo', 'feo', 'viejo'],
            IT: ['obeso', 'grasso', 'brutto', 'vecchio'],
            DE: ['fettleibig', 'hässlich', 'alt']
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
