const Tagger = require('./tagger.js');

console.log('=== TEST ALERTE QUALITÉ : SOUS-TAGGING ===');

const text = "Avocate, elle adore le yoga et cherche un cadeau pour son mari. Elle a déjà un Neverfull mais évite le cuir car elle est vegan.";

console.log(`\nTexte : "${text}"`);

const tags = Tagger.extractTags(text);

console.log('\nTags détectés :');
tags.forEach(t => console.log(`- [${t.category}] ${t.tag} (${t.confidence})`));

// Vérification des attentes
const expected = [
    'Avocature_Générale', // ou M&A si précisé, ici Générale OK
    'Bien-être_Yoga_Ashtanga', // ou Sport_Bien_être_Général
    'Dest_Intime_Pour_Conjoint',
    'Possède_Neverfull',
    'Régime_Végétalien_Strict', // ou Valeurs_Vegan_Strict
    'Valeurs_Cruelty_Free' // "évite le cuir"
];

console.log('\nAnalyse des manquants :');
const foundTags = tags.map(t => t.tag);
expected.forEach(exp => {
    const found = foundTags.some(t => t.includes(exp) || exp.includes(t)); // Souple pour le test
    console.log(`- ${exp} : ${found ? '✅ TROUVÉ' : '❌ MANQUANT'}`);
});
