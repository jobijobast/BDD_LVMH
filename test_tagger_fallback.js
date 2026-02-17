
const Tagger = require('./tagger.js');

const testCases = [
    {
        name: "Tennis Générique (Fallback)",
        text: "Il joue au tennis le dimanche.",
        expected: ["Sport_Raquette_Général"] // Expect Fallback
    },
    {
        name: "Tennis Compétition (Specific)",
        text: "Il participe à une compétition de tennis.",
        expected: ["Raquette_Tennis_Compétition"] // Expect Specific, NO Fallback needed (or acceptable if absent)
    },
    {
        name: "Intérêts Multiples (Specific + Fallback)",
        text: "Adore le yoga ashtanga et regarde la F1 à la télé.",
        expected: ["Bien-être_Yoga_Ashtanga", "Mécanique_F1_Paddock_Club"]
        // Note: 'regarde la F1' might trigger F1 Paddock Club specific tag based on current regex
        // Let's adjust expectation if F1 regex is strict. 
        // Current F1 regex: /\b(f1|paddock)\b/gi -> Matches 'f1'. So Level 3.
    },
    {
        name: "Finance Générale (Fallback)",
        text: "Il travaille dans la banque.",
        expected: ["Banque_Générale"]
    }
];

console.log("=== DÉBUT DES TESTS TAGGER (FALLBACKS) ===\n");

let passed = 0;
testCases.forEach(test => {
    console.log(`Test: ${test.name}`);
    console.log(`Texte: "${test.text}"`);
    const tags = Tagger.extractTags(test.text).map(t => t.tag);
    console.log(`Tags trouvés: ${JSON.stringify(tags)}`);

    // Check coverage
    const missing = test.expected.filter(e => !tags.includes(e));

    // Logic check: If specific tag found, fallback should NOT be valid? 
    // My code logic: if (!foundInGroup && group.fallbacks). So if Level 3 found, no fallback.

    if (missing.length === 0) {
        console.log("✅ SUCCÈS");
        passed++;
    } else {
        console.log(`❌ ÉCHEC. Manque: ${missing.join(', ')}`);
    }
    console.log('---');
});

console.log(`\nRÉSULTAT: ${passed}/${testCases.length} tests passés.`);
