
const Tagger = require('./tagger.js');

const testCases = [
    {
        name: "Chirurgien Cardiothoracique",
        text: "Il est chirurgien cardiothoracique à Paris.",
        expected: ["Chirurgien_Cardiothoracique", "Dest_Europe"]
    },
    {
        name: "Intérêts Multiples",
        text: "Elle adore le yoga, collectionne les montres vintage et voyage souvent aux Maldives.",
        expected: ["Bien-être_Yoga_Ashtanga", "Horlogerie_Vintage", "Voyage_Loisir_Luxe"]
    },
    {
        name: "Sécurité & Allergies",
        text: "Attention, allergie sévère aux arachides et intolérance au lactose.",
        expected: ["Anaphylaxie_Arachides", "Santé_Sans_Lactose"]
    },
    {
        name: "Univers LV & Achats",
        text: "Fan de Pharrell, possède déjà un Speedy et un Keepall. Cherche un cadeau pour son mari.",
        expected: ["Relation_Style_Pharrell", "Possède_Speedy", "Possède_Keepall", "Dest_Intime_Pour_Conjoint"]
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
