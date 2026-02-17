const Tagger = require('./tagger.js');

const examples = [
    {
        id: 'CA_001',
        text: "Mme Laurent, avocate affaires 45 ans, cliente occasionnelle. Cherche cadeau anniversaire mari 50 ans fin mars. Il est passionné golf, membre Racing Club Paris. Hésite entre portefeuille et petit sac weekend. Partent souvent Provence et côte basque. Mari collectionne montres vintage. Elle intolérante produits chimiques forts. Rappeler fin février."
    },
    {
        id: 'CA_002',
        text: "Mr. Anderson, first time customer, investment banker from London, around 38. Looking for travel bag, travels frequently Asia for work. He plays tennis weekends at Queens Club. Prefers black or navy leather, classic style but modern touch. Pescatarian diet. Wife's birthday coming up. Follow up end of month."
    },
    {
        id: 'CA_003',
        text: "Signora Rossi e figlia insieme, cliente fedele. Signora 58 anni cerca borse nuove stagione, figlia 28 anni laureata medicina cerca regalo se stessa nuovo lavoro. Signora ama cuoio bordeaux, stile classico, colleziona arte contemporanea. Figlia stile giovane moderno, pratica yoga pilates. Madre allergica nichel. Figlia vegetariana stretta. Viaggiano Toscana. Ottimo potenziale multi-generazionale."
    }
];

console.log('=== TEST GOLD STANDARD ===\n');

examples.forEach(ex => {
    console.log(`--- Client ${ex.id} ---`);
    const tags = Tagger.extractTags(ex.text);
    console.log(tags.map(t => t.tag).join(', '));
    console.log('\n');
});
