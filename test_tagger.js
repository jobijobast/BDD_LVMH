
const Tagger = require('./tagger.js');

const testCases = [
    {
        name: "Chirurgien Cardiothoracique",
        text: "Il est chirurgien cardiothoracique à Paris.",
        expected: ["Chirurgien_Cardiothoracique"]
    },
    {
        name: "Intérêts Multiples",
        text: "Elle adore le yoga, collectionne les montres vintage et voyage souvent aux Maldives.",
        expected: ["Yoga_Expert", "Montres_Vintage", "Voyage_Loisir_Luxe"]
    },
    {
        name: "Sécurité & Allergies",
        text: "Attention, allergie sévère aux arachides et intolérance au lactose.",
        expected: ["DANGER_Allergie_Arachides", "Intolérance_Lactose"]
    },
    {
        name: "Univers LV & Achats",
        text: "Fan de Pharrell, possède déjà un Speedy et un Keepall. Cherche un cadeau pour son mari.",
        expected: ["Style_Pharrell", "Owns_Sac_TopHandle", "Owns_Bagage_Souple", "Pour_Partner"]
    }
];

console.log("=== DÉBUT DES TESTS TAGGER ===\n");

let passed = 0;
testCases.forEach(test => {
    console.log(`Test: ${test.name}`);
    console.log(`Texte: "${test.text}"`);
    const tags = Tagger.extractTags(test.text).map(t => t.tag);
    console.log(`Tags trouvés: ${JSON.stringify(tags)}`);

    const missing = test.expected.filter(e => !tags.includes(e));
    if (missing.length === 0) {
        console.log("✅ SUCCÈS");
        passed++;
    } else {
        console.log(`❌ ÉCHEC. Manque: ${missing.join(', ')}`);
    }
    console.log('---');
});

console.log(`\nRÉSULTAT: ${passed}/${testCases.length} tests passés.`);
