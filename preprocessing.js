/**
 * LVMH Voice-to-Tag - Module de Preprocessing
 * Nettoyage filler words multilingue (FR, EN, ES, IT, DE)
 */

const Preprocessing = {
    stats: { totalNotes: 0, fillerWordsRemoved: 0, duplicatesRemoved: 0 },

    fillerWords: {
        FR: ['euh', 'hum', 'hein', 'bah', 'ben', 'quoi', 'genre', 'style', 'truc', 'machin', 'chose', 'du coup', 'en fait', 'en gros', 'tu vois', 'tu sais', 'vous savez', 'on va dire', 'disons', 'plutôt', 'enfin', 'bon', 'bref', 'voilà', 'donc', 'alors', 'là', 'en quelque sorte', 'pour ainsi dire', 'à peu près', 'plus ou moins', 'je veux dire', 'un peu', 'un tantinet', 'grosso modo', 'c\'est-à-dire', 'si tu veux', 'si vous voulez', 'eh bien', 'en quelque manière', 'en quelque façon'],
        EN: ['uh', 'um', 'er', 'ah', 'hmm', 'like', 'you know', 'I mean', 'sort of', 'kind of', 'basically', 'actually', 'well', 'so', 'right', 'ok', 'yep', 'yeah', 'I guess', 'I suppose', 'let me see', 'more or less', 'roughly', 'approximately', 'in a way', 'as it were', 'if you will', 'something like', 'or so', 'pretty much', 'you know what I mean', 'to some extent', 'in a manner of speaking', 'in some way'],
        ES: ['eh', 'pues', 'bueno', 'vale', 'ok', 'tipo', 'o sea', 'ya sabes', 'más o menos', 'digamos', 'como', 'en plan', 'es decir', 'entonces', 'vamos a ver', 'por así decirlo', 'de alguna manera', 'aproximadamente', 'alrededor de', 'en cierto modo', 'si queréis', 'un poco', 'un poquito', 'ya veis', 'pues sí', 'en alguna forma', 'em', 'un tantito', 'en realidad', 'por ahí', 'por ejemplo'],
        IT: ['ehm', 'eh', 'beh', 'allora', 'tipo', 'cioè', 'insomma', 'praticamente', 'diciamo', 'capisci', 'capito', 'sai', 'in pratica', 'più o meno', 'circa', 'in qualche modo', 'per così dire', 'pressappoco', 'se capite', 'va bene', 'un po\'', 'un pochino', 'tipo così', 'piuttosto', 'se vuoi', 'quindi', 'all\'incirca', 'in un certo senso', 'se capisci', 'diciamo che', 'bene', 'ok', 'in qualche maniera'],
        DE: ['äh', 'ähm', 'naja', 'halt', 'also', 'quasi', 'sozusagen', 'eigentlich', 'genau', 'weißt du', 'ja', 'irgendwie', 'gewissermaßen', 'in gewisser Weise', 'mehr oder weniger', 'ungefähr', 'circa', 'etwa', 'sagen wir', 'sag mal', 'auf eine Art', 'so gesehen', 'ziemlich', 'ein bisschen', 'ein wenig', 'ein Tick', 'ok', 'wenn du willst', 'so ungefähr', 'zum Beispiel', 'wie', 'okay']
    },

    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        const headers = this.parseCSVLine(lines[0]);
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((h, idx) => row[h.trim()] = values[idx]);
                data.push(row);
            }
        }
        this.stats.totalNotes = data.length;
        return data;
    },

    parseCSVLine(line) {
        const result = [];
        let current = '', inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                else inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else current += char;
        }
        result.push(current.trim());
        return result;
    },

    escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); },

    removeFillerWords(text, language = 'FR') {
        if (!text) return { cleanedText: text, removedCount: 0 };
        const allFillers = [...new Set(Object.values(this.fillerWords).flat())];
        allFillers.sort((a, b) => b.length - a.length);
        let cleanedText = text, removedCount = 0;
        for (const filler of allFillers) {
            const regex = new RegExp(`(^|[\\s,;:.!?])${this.escapeRegex(filler)}([\\s,;:.!?]|$)`, 'gi');
            const matches = cleanedText.match(regex);
            if (matches) { removedCount += matches.length; cleanedText = cleanedText.replace(regex, '$1$2'); }
        }
        cleanedText = cleanedText.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').trim();
        this.stats.fillerWordsRemoved += removedCount;
        return { cleanedText, removedCount };
    },

    removeDuplicates(data) {
        const seen = new Set(), unique = [];
        for (const row of data) {
            const id = row.ID || row.id;
            if (id && !seen.has(id)) { seen.add(id); unique.push(row); }
            else if (id) this.stats.duplicatesRemoved++;
        }
        return unique;
    },

    async processData(data, progressCallback = null) {
        this.stats = { totalNotes: data.length, fillerWordsRemoved: 0, duplicatesRemoved: 0 };
        let processedData = this.removeDuplicates(data);
        const results = [];
        for (let i = 0; i < processedData.length; i++) {
            const row = processedData[i];
            const lang = (row.Language || row.language || 'FR').toUpperCase();
            const originalText = row.Transcription || row.transcription || '';
            if (!originalText.trim()) continue;
            const { cleanedText, removedCount } = this.removeFillerWords(originalText, lang);
            results.push({ ...row, originalText, cleanedText, language: lang, preprocessing: { fillerWordsRemoved: removedCount, wasModified: removedCount > 0 } });
            if (progressCallback) progressCallback((i + 1) / processedData.length * 50, 'Nettoyage...');
        }
        return results;
    },

    getStats() { return { ...this.stats }; }
};
