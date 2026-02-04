/**
 * LVMH Voice-to-Tag - Application Simplifiée
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('App loaded');

    // Cache l'overlay au démarrage
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';

    // State
    let rawData = [];
    let processedData = [];

    // Elements
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadSection = document.getElementById('uploadSection');
    const processingSection = document.getElementById('processingSection');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');

    // Click handler
    selectFileBtn.onclick = () => fileInput.click();

    // File handler
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log('File selected:', file.name);
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
        document.getElementById('fileInfo').hidden = false;

        loadingText.textContent = 'Lecture du fichier...';
        loadingOverlay.style.display = 'flex';

        try {
            const text = await file.text();
            console.log('File read, length:', text.length);

            loadingText.textContent = 'Parsing CSV...';
            rawData = parseCSV(text);
            console.log('Parsed rows:', rawData.length);

            loadingText.textContent = 'Traitement en cours...';
            processedData = processAllData(rawData);
            console.log('Processed:', processedData.length);

            // Show results
            uploadSection.hidden = true;
            processingSection.hidden = false;
            loadingOverlay.style.display = 'none';

            updateUI();

        } catch (error) {
            console.error('Error:', error);
            alert('Erreur: ' + error.message);
            loadingOverlay.style.display = 'none';
        }
    };

    // Simple CSV Parser
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            // Simple parse - handle quoted values
            const values = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((h, idx) => row[h] = values[idx] || '');
                data.push(row);
            }
        }
        return data;
    }

    // Process all data
    function processAllData(data) {
        // Extended filler words list - sorted longest first to avoid partial replacements
        const fillerWords = [
            // Multi-word expressions (longest first)
            'in a manner of speaking', 'you know what I mean', 'what I mean', 'in some way',
            'to some extent', 'for example', 'let me see', 'as it were', 'pretty much',
            'more or less', 'if you will', 'I suppose', 'I guess', 'you see', 'you know',
            'let\'s see', 'sort of', 'kind of', 'I mean', 'I see', 'or so',
            'en quelque manière', 'en quelque façon', 'en quelque sorte', 'pour ainsi dire',
            'si vous voulez', 'on va dire', 'plus ou moins', 'à peu près', 'je veux dire',
            'grosso modo', 'c\'est-à-dire', 'un petit peu', 'un tantinet', 'si tu veux',
            'du coup', 'en fait', 'en gros', 'tu vois', 'tu sais', 'par exemple',
            'más o menos', 'por así decirlo', 'de alguna manera', 'en alguna forma',
            'alrededor de', 'por ejemplo', 'en cierto modo', 'si queréis', 'digamos que',
            'ya sabes', 'ya veis', 'un poco', 'un poquito', 'un tantito', 'vamos a ver',
            'en plan', 'en realidad', 'es decir', 'o sea',
            'in un certo senso', 'in qualche modo', 'in qualche maniera', 'per così dire',
            'più o meno', 'se capisci', 'se capite', 'se vuoi', 'un po\'', 'un pochino',
            'un tantino', 'diciamo che', 'per esempio', 'all\'incirca', 'pressappoco',
            'in pratica', 'va bene',
            'in gewisser Weise', 'mehr oder weniger', 'auf eine Art', 'wenn du willst',
            'weißt du', 'sagen wir', 'sag mal', 'ein bisschen', 'ein wenig', 'ein Tick',
            'zum Beispiel', 'gewissermaßen', 'sozusagen',
            // Single words FR
            'euh', 'hum', 'hein', 'bah', 'ben', 'quoi', 'genre', 'style', 'truc', 'machin',
            'chose', 'donc', 'voilà', 'enfin', 'bon', 'bref', 'là', 'bien', 'que',
            // Single words EN
            'uh', 'um', 'er', 'ah', 'hmm', 'like', 'basically', 'actually', 'well', 'so',
            'right', 'ok', 'okay', 'yep', 'yeah', 'about', 'roughly', 'something',
            'approximately', 'what', 'or',
            // Single words ES
            'eh', 'pues', 'bueno', 'vale', 'tipo', 'como', 'sí', 'entonces', 'digamos',
            'aproximadamente', 'em', 'ok',
            // Single words IT
            'ehm', 'beh', 'allora', 'tipo', 'cioè', 'insomma', 'diciamo', 'capisci',
            'capito', 'sai', 'circa', 'piuttosto', 'quindi', 'così', 'bene', 'ok',
            // Single words DE
            'äh', 'ähm', 'naja', 'halt', 'also', 'quasi', 'eigentlich', 'genau', 'ja',
            'irgendwie', 'ungefähr', 'circa', 'etwa', 'ziemlich', 'okay', 'wie', 'gesehen'
        ];

        // RGPD: seulement les données VRAIMENT sensibles (pas de justification business)
        // Allergies, régimes, préférences = données LÉGITIMES pour le service LVMH
        const rgpdPatterns = [
            { cat: 'accessCodes', words: ['code porte', 'digicode', 'mot de passe', 'password', 'pin code'] },
            { cat: 'identity', words: ['numéro sécurité sociale', 'iban', 'passport number', 'credit card'] },
            { cat: 'orientation', words: ['homosexuel', 'gay', 'lesbienne', 'bisexuel', 'transgenre', 'lgbtq'] },
            { cat: 'politics', words: ['vote pour', 'électeur de', 'militant', 'parti politique'] },
            { cat: 'religion', words: ['pratiquant', 'converti', 'croyant fervent', 'fait le ramadan'] },
            { cat: 'familyConflict', words: ['violence conjugale', 'violence domestique', 'maltraitance', 'domestic violence'] },
            { cat: 'finance', words: ['dette', 'faillite', 'surendettement', 'bankruptcy', 'debt'] },
            { cat: 'appearance', words: ['obèse', 'trop gros', 'laid', 'moche', 'ugly', 'fat'] }
        ];

        const stats = { filler: 0, rgpd: { health: 0, orientation: 0, politics: 0, religion: 0, family: 0, finance: 0, appearance: 0 }, tags: 0 };
        const allTags = {};

        return data.map(row => {
            let text = row.Transcription || row.transcription || '';
            const originalText = text;
            const lang = (row.Language || row.language || 'FR').toUpperCase();

            // Remove filler words
            let fillerCount = 0;
            fillerWords.forEach(fw => {
                const regex = new RegExp('\\b' + fw + '\\b', 'gi');
                const matches = text.match(regex);
                if (matches) {
                    fillerCount += matches.length;
                    text = text.replace(regex, '');
                }
            });
            text = text.replace(/\s+/g, ' ').trim();
            stats.filler += fillerCount;

            // RGPD detection
            const rgpdDetections = [];
            rgpdPatterns.forEach(pattern => {
                pattern.words.forEach(word => {
                    if (text.toLowerCase().includes(word.toLowerCase())) {
                        rgpdDetections.push({ cat: pattern.cat, word });
                        stats.rgpd[pattern.cat]++;
                        text = text.replace(new RegExp(word, 'gi'), '[RGPD]');
                    }
                });
            });

            // Extract tags
            const tags = extractTags(text);
            tags.forEach(t => {
                const key = t.category + ':' + t.tag;
                allTags[key] = (allTags[key] || 0) + 1;
                stats.tags++;
            });

            return {
                ...row,
                originalText,
                cleanedText: text,
                language: lang,
                fillerCount,
                rgpdDetections,
                tags,
                wasModified: fillerCount > 0 || rgpdDetections.length > 0
            };
        });
    }

    // Tag extraction
    function extractTags(text) {
        const tags = [];
        const t = text.toLowerCase();

        // Professions
        if (/dentist|médecin|doctor/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Médecin/Dentiste' });
        if (/avocat|lawyer|attorney/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Avocat' });
        if (/architecte|architect/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Architecte' });
        if (/ceo|directeur|director|dirigeant/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Dirigeant' });
        if (/entrepreneur/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Entrepreneur' });
        if (/banquier|banker/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Banquier' });
        if (/consultant/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Consultant' });
        if (/journaliste|journalist/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Journaliste' });
        if (/chirurgien|surgeon/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Chirurgien' });
        if (/cardiologue|cardiologist/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Cardiologue' });
        if (/pharmacien|pharmacist/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Pharmacien' });
        if (/psychologue|psychologist/.test(t)) tags.push({ category: 'PROFESSION', tag: 'Psychologue' });

        // Budget
        if (/budget.{0,10}(3|4|5)k/i.test(t)) tags.push({ category: 'BUDGET', tag: '3-5K' });
        if (/budget.{0,10}(5|6|7|8|9|10)k/i.test(t)) tags.push({ category: 'BUDGET', tag: '5-10K' });
        if (/budget.{0,10}1[0-5]k/i.test(t)) tags.push({ category: 'BUDGET', tag: '10-15K' });
        if (/flexible|très flexible/i.test(t)) tags.push({ category: 'BUDGET', tag: 'Flexible' });
        if (/vip/i.test(t)) tags.push({ category: 'SEGMENT', tag: 'VIP' });

        // Couleurs
        if (/\bnoir\b|\bblack\b/i.test(t)) tags.push({ category: 'COULEUR', tag: 'Noir' });
        if (/\bbeige\b/i.test(t)) tags.push({ category: 'COULEUR', tag: 'Beige' });
        if (/\bcognac\b|\bcamel\b/i.test(t)) tags.push({ category: 'COULEUR', tag: 'Cognac' });
        if (/\bmarine\b|\bnavy\b/i.test(t)) tags.push({ category: 'COULEUR', tag: 'Navy' });
        if (/\bor\b|\bgold\b/i.test(t)) tags.push({ category: 'HARDWARE', tag: 'Or' });
        if (/rose gold|or rose/i.test(t)) tags.push({ category: 'HARDWARE', tag: 'Rose Gold' });
        if (/\bargent\b|\bsilver\b/i.test(t)) tags.push({ category: 'HARDWARE', tag: 'Argent' });

        // Style
        if (/classique|classic/i.test(t)) tags.push({ category: 'STYLE', tag: 'Classique' });
        if (/moderne|modern/i.test(t)) tags.push({ category: 'STYLE', tag: 'Moderne' });
        if (/élégant|elegant/i.test(t)) tags.push({ category: 'STYLE', tag: 'Élégant' });
        if (/discret|understated/i.test(t)) tags.push({ category: 'STYLE', tag: 'Discret' });
        if (/minimaliste|minimalist/i.test(t)) tags.push({ category: 'STYLE', tag: 'Minimaliste' });

        // Sports/Lifestyle
        if (/yoga/i.test(t)) tags.push({ category: 'SPORT', tag: 'Yoga' });
        if (/pilates/i.test(t)) tags.push({ category: 'SPORT', tag: 'Pilates' });
        if (/golf/i.test(t)) tags.push({ category: 'SPORT', tag: 'Golf' });
        if (/tennis/i.test(t)) tags.push({ category: 'SPORT', tag: 'Tennis' });
        if (/équitation|horse|riding/i.test(t)) tags.push({ category: 'SPORT', tag: 'Équitation' });
        if (/ski/i.test(t)) tags.push({ category: 'SPORT', tag: 'Ski' });
        if (/running|marathon|course/i.test(t)) tags.push({ category: 'SPORT', tag: 'Running' });

        // Régime
        if (/végétarien|vegetarian/i.test(t)) tags.push({ category: 'RÉGIME', tag: 'Végétarien' });
        if (/vegan/i.test(t)) tags.push({ category: 'RÉGIME', tag: 'Vegan' });
        if (/pescetarien|pescatarian/i.test(t)) tags.push({ category: 'RÉGIME', tag: 'Pescetarien' });

        // Occasions
        if (/anniversaire|birthday/i.test(t)) tags.push({ category: 'OCCASION', tag: 'Anniversaire' });
        if (/mariage|wedding/i.test(t)) tags.push({ category: 'OCCASION', tag: 'Mariage' });
        if (/cadeau|gift/i.test(t)) tags.push({ category: 'OCCASION', tag: 'Cadeau' });

        // Allergies (service)
        if (/allergi.{0,10}nickel/i.test(t)) tags.push({ category: 'ALLERGIE', tag: 'Nickel' });
        if (/allergi.{0,10}gluten/i.test(t)) tags.push({ category: 'ALLERGIE', tag: 'Gluten' });
        if (/allergi.{0,10}arachide|allergi.{0,10}peanut/i.test(t)) tags.push({ category: 'ALLERGIE', tag: 'Arachides' });

        return tags;
    }

    // Update UI
    function updateUI() {
        // Stats
        let fillerTotal = 0, rgpdTotal = 0, tagsTotal = 0;
        const rgpdStats = { health: 0, orientation: 0, politics: 0, religion: 0, family: 0, finance: 0, appearance: 0 };
        const allTags = {};

        processedData.forEach(row => {
            fillerTotal += row.fillerCount || 0;
            row.rgpdDetections?.forEach(d => {
                rgpdStats[d.cat]++;
                rgpdTotal++;
            });
            row.tags?.forEach(t => {
                const key = t.category + ':' + t.tag;
                allTags[key] = (allTags[key] || 0) + 1;
                tagsTotal++;
            });
        });

        document.getElementById('totalNotes').textContent = processedData.length;
        document.getElementById('fillerRemoved').textContent = fillerTotal;
        document.getElementById('rgpdDetected').textContent = rgpdTotal;
        document.getElementById('tagsExtracted').textContent = tagsTotal;

        // RGPD Report
        document.getElementById('rgpdHealth').textContent = rgpdStats.health;
        document.getElementById('rgpdOrientation').textContent = rgpdStats.orientation;
        document.getElementById('rgpdPolitics').textContent = rgpdStats.politics;
        document.getElementById('rgpdReligion').textContent = rgpdStats.religion;
        document.getElementById('rgpdFamily').textContent = rgpdStats.family;
        document.getElementById('rgpdFinance').textContent = rgpdStats.finance;
        document.getElementById('rgpdAppearance').textContent = rgpdStats.appearance;

        // Preview table
        const tbody = document.getElementById('previewBody');
        tbody.innerHTML = '';
        processedData.slice(0, 50).forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.ID || '-'}</td>
                <td>${row.Date || '-'}</td>
                <td>${row.language || '-'}</td>
                <td class="transcription">${(row.cleanedText || '').substring(0, 80)}...</td>
                <td><span class="status-badge ${row.wasModified ? 'modified' : 'clean'}">${row.wasModified ? '⚠️ Modifié' : '✓ Clean'}</span></td>
            `;
            tbody.appendChild(tr);
        });

        // Note selector
        const selector = document.getElementById('noteSelector');
        selector.innerHTML = '';
        processedData.forEach((row, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${row.ID || 'Note ' + (i + 1)} - ${row.language}`;
            selector.appendChild(opt);
        });
        selector.onchange = updateComparison;
        updateComparison();

        // Tags grid
        updateTagsGrid(allTags);

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
            };
        });

        // Exports
        document.getElementById('exportCSV').onclick = exportCSV;
        document.getElementById('exportTags').onclick = exportTags;
        document.getElementById('exportReport').onclick = exportReport;
    }

    function updateComparison() {
        const idx = parseInt(document.getElementById('noteSelector').value);
        const row = processedData[idx];
        if (!row) return;
        document.getElementById('originalText').textContent = row.originalText || '';
        document.getElementById('cleanedText').innerHTML = (row.cleanedText || '').replace(/\[RGPD\]/g, '<span style="background:#ef4444;color:white;padding:2px 4px;border-radius:4px">[RGPD]</span>');
    }

    function updateTagsGrid(allTags) {
        const grid = document.getElementById('tagsGrid');
        grid.innerHTML = '';
        Object.entries(allTags).sort((a, b) => b[1] - a[1]).forEach(([key, count]) => {
            const [cat, tag] = key.split(':');
            const div = document.createElement('div');
            div.className = 'tag-item';
            div.innerHTML = `<span class="tag-category">${cat}</span><span class="tag-value">${tag}</span><span class="tag-count">${count}</span>`;
            grid.appendChild(div);
        });

        document.getElementById('tagSearch').oninput = (e) => {
            const filter = e.target.value.toLowerCase();
            grid.querySelectorAll('.tag-item').forEach(item => {
                item.style.display = item.textContent.toLowerCase().includes(filter) ? '' : 'none';
            });
        };
    }

    function exportCSV() {
        const lines = ['ID,Date,Language,Cleaned_Transcription,RGPD_Modified,Tags'];
        processedData.forEach(row => {
            lines.push([
                row.ID || '',
                row.Date || '',
                row.language || '',
                '"' + (row.cleanedText || '').replace(/"/g, '""') + '"',
                row.wasModified ? 'Yes' : 'No',
                '"' + (row.tags || []).map(t => t.tag).join(', ') + '"'
            ].join(','));
        });
        download(lines.join('\n'), 'lvmh_cleaned.csv', 'text/csv');
    }

    function exportTags() {
        const data = { notes: processedData.map(r => ({ id: r.ID, tags: r.tags })) };
        download(JSON.stringify(data, null, 2), 'lvmh_tags.json', 'application/json');
    }

    function exportReport() {
        const rgpd = { health: 0, orientation: 0, politics: 0, religion: 0, family: 0, finance: 0, appearance: 0 };
        processedData.forEach(r => r.rgpdDetections?.forEach(d => rgpd[d.cat]++));
        download(JSON.stringify({ summary: rgpd, date: new Date().toISOString() }, null, 2), 'lvmh_rgpd_report.json', 'application/json');
    }

    function download(content, name, type) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([content], { type }));
        a.download = name;
        a.click();
    }
});
