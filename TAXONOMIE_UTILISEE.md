# Taxonomie utilisée — LVMH Voice-to-Tag

Document de référence aligné sur la taxonomie LVMH. Les tags sont extraits des transcriptions via des règles regex dans `server.py` (variable `TAG_RULES`). Chaque tag a une **catégorie** (`c`) et un **libellé** (`t`).

---

## 1. PROFILS (Business Intelligence)

Objectif : définir le potentiel sans juger la personne.

### GENRE
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Femme | femme, woman, elle (contexte) |
| Homme | homme, man, monsieur, client homme |
| Non-Binaire | non-binaire, nonbinary |
| Collectif/Couple | couple, collectif, mariés, ensemble pour/en |

### SEGMENTATION GÉNÉRATIONNELLE
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| U-25 | 18–24 ans, under 25, jeune client |
| 25-40 | 25–40 ans, trentaine, thirty, quarante |
| 40-60 | 40–60 ans, cinquantaine, soixantaine, quadra, quinqua |
| 60-80 | 60–80 ans, soixante, retraité |
| 80+ | 80 ans, octogénaire |

### STATUT RELATIONNEL
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Prospect | prospect |
| Nouveau_Client | nouveau client, new client, première visite, premier achat |
| Client_Actif | client actif, achète régulièrement |
| Client_Fidèle | client fidèle, fidèle, regular client, depuis 20xx |
| Ambassadeur | ambassadeur, recommande |
| Key_Account | key account, compte clé, vip client, gros client |
| A_Réactiver | à réactiver, réactivation, inactif depuis |

### COMMUNICATION
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Français | français, parle français |
| Anglais | anglais, english |
| Italien | italien, italian |
| Espagnol | espagnol, spanish |
| Allemand | allemand, german |
| Mandarin | mandarin, chinese |
| Japonais | japonais, japanese |
| Arabe | arabe, arabic |
| Russe | russe, russian |

### VISIBILITÉ PUBLIQUE
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Audience_Niche | audience niche |
| Audience_Large | audience large |
| Audience_Masse | audience masse |
| Personnalité_Publique | personnalité publique, public figure |
| Expert_Sectoriel | expert sectoriel, sector expert |

### ÉCOSYSTÈME DIGITAL
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Social_Native | social native, réseaux sociaux, instagram, influenceur digital |
| Pro_Network | pro network, linkedin, réseau pro |
| Web3_Interests | web3, blockchain, crypto, nft |

### DOMAINE D'EXPERTISE
| Domaine | Libellés |
|---------|----------|
| Sciences & Santé | Expertise_Chirurgie, Expertise_Médicale, Recherche_Pharma |
| Finance & Conseil | Marchés_Financiers, Private_Equity_VC, Banque_Conseil, Fintech_Blockchain |
| Droit & Institutionnel | Conseil_Juridique, Officier_Public, Expertise_Légale |
| Arts & Design | Marché_de_l_Art, Architecture_Design, Production_Artistique |
| Corporate | Executive_Leadership, Entrepreneur, Real_Estate_Dev |

---

## 2. CENTRES D'INTÉRÊT (Lifestyle & Circles)

Logique de préférence d'invitation, pas de fichage.

### RÉSEAUX & CLUBS
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Sports_Clubs_Prestige | sports club prestige, club privé sport |
| Social_Arts_Clubs | social arts club, club art |
| Business_Networks | business network, réseau affaires |
| Alumni_Grandes_Ecoles | alumni, grande école, hec, essec, polytechnique, ena |

### COLLECTIONS
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Horlogerie_Vintage | horlogerie vintage, vintage watch |
| Haute_Horlogerie | haute horlogerie, fine watchmaking, complications |
| Livres_Rares | livres rares, rare books |
| Art_Contemporain | art contemporain, contemporary art |
| Art_Classique | art classique, classical art |
| Vins_Spiritueux_Prestige | vins spiritueux, prestige wine, spirits, oenolog |

### LOISIRS & PERFORMANCE
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Sports_Raquette | sports raquette, tennis, squash, padel |
| Golf | golf, golfeur |
| Nautisme_Yachting | nautisme, yachting, voilier, bateau de luxe |
| Sports_Endurance | sports endurance, marathon, triathlon, running |
| Wellness_Yoga | wellness, yoga, pilates, méditation |
| Automobile_Collection | automobile collection, collection voitures |
| Motorsport_Experience | motorsport, formula, circuit |

### CULTURE & ESTHÉTIQUE
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Design_Minimaliste | design minimaliste, minimalist design |
| Opéra_Musique_Symphonique | opéra, musique symphonique, orchestre |
| Jazz_Contemporary | jazz, contemporary music |
| Gastronomie_Fine_Dining | gastronomie, fine dining, étoilé michelin |
| Oenologie | oenolog, sommelier, vins, cave à vin |

### ENGAGEMENTS (CSR)
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Sustainability_Focus | sustainability, durable, écolog, recyclé, green |
| Handicraft_Heritage | handicraft, artisanat, savoir-faire, heritage |
| Philanthropy_Inclusion | philanthrop, inclusion, mécénat, charity |

---

## 3. VOYAGE (Mobility)

### PROFIL VOYAGEUR
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Loisir_Premium | loisir premium, voyage luxe, premium travel |
| Expédition_Nature | expédition, nature, aventure, safari |
| Retraite_Bien_être | retraite bien-être, wellness retreat, spa resort |
| Itinérance_Culturelle | itinérance culturelle, cultural travel |
| Business_Travel | business travel, voyage pro, déplacement pro |

### ZONES GÉOGRAPHIQUES
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| APAC | apac, asie pacifique, japon, chine, singapore |
| Americas | americas, amérique, usa, new york, miami |
| Europe | europe, paris, milan, londres |
| MEA | mea, moyen-orient, dubai, émirats |

---

## 4. CONTEXTE D'ACHAT (Sales Trigger)

### BÉNÉFICIAIRE
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Usage_Personnel | usage personnel, pour moi, pour lui, pour elle |
| Cadeau_Proche | cadeau proche, proche, conjoint, ami |
| Cadeau_Famille | cadeau famille, enfant, parent, petit-enfant |
| Cadeau_Professionnel | cadeau professionnel, client pro, partenaire business |
| Cadeau_Protocolaire | cadeau protocolaire, protocol, officiel |

### CÉLÉBRATION
| Type | Libellés |
|------|----------|
| Personnel | Anniversaire, Union, Naissance, Événement_Vie |
| Professionnel | Promotion, Réussite_Business, Retraite |
| Saisonnier | Fêtes_Fin_Année, Nouvel_An_Lunaire, Fête_Maternelle_Paternelle |

### STYLE
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Intemporel | intemporel, timeless, classique intemporel |
| Contemporain | contemporain, modern |
| Tendance | tendance, trendy |
| Signature_Logo | signature logo, logo visible, monogramme |
| Quiet_Luxury | quiet luxury, luxe discret, understated luxury |

---

## 5. SERVICE & HOSPITALITY (Operational Safety)

On ne note pas une pathologie, mais une **restriction de service**.

### RESTRICTIONS ALIMENTAIRES (Priorité Sécurité)
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Alerte_Allergène_Majeur | allergie majeur, allergène majeur, alerte allerg |
| Régime_Sans_Gluten | sans gluten, régime sans gluten, gluten-free, celiac |
| Régime_Sans_Lactose | sans lactose, intolérance lactose |

### PRÉFÉRENCES DIÉTÉTIQUES
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Végétarien | végétarien, vegetarian |
| Végétalien | végétalien, vegan, végane |
| Sans_Alcool | sans alcool, no alcohol |
| Sélection_Produits_Halal | halal, produits halal |

### BOISSONS
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Premium_Tea_Matcha | premium tea, matcha, thé premium |
| Champagne_Spirits | champagne, spirits, spiritueux |
| Soft_Only | soft only, boisson sans alcool |
| Eau_Tempérée | eau tempérée, eau tiède |

### CONFORT & ACCÈS
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Accès_Mobilité_Réduite | mobilité réduite, accès mobilité, fauteuil, handicap |
| Besoin_Assise_Prioritaire | assise prioritaire, siège prioritaire |

### CONFIDENTIALITÉ
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Protocole_Discrétion_Haute | protocole discrétion, entrée dédiée, discretion |
| No_Photo_Policy | no photo, pas de photo, interdit photo |

---

## 6. UNIVERS DE MARQUE & HISTORIQUE (Ownership)

### PRÉFÉRENCES PRODUITS
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Lignes_Iconiques | lignes iconiques, iconic line |
| Lignes_Animation | lignes animation, animation line |
| Cuirs_Exotiques | cuirs exotiques, exotic leather, crocodile, python |
| Haute_Horlogerie | haute horlogerie, fine watchmaking |
| Art_de_Vivre_Malles | art de vivre, malles, trunk |

### NIVEAU D'ENGAGEMENT
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Client_Historique | client historique, depuis longtemps, ancien client |
| Client_Commandes_Spéciales | commande spéciale, special order, sur mesure |
| Invité_Événements_Maison | invité événement, événement maison, house event |

*Inventaire (Possède_XXX) et Sizing restent gérés côté données transactionnelles.*

---

## 7. OPPORTUNITÉS & SUIVI (CRM Action)

### STATUT DISPONIBILITÉ
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| En_Attente_Stock | en attente stock, waiting stock |
| Waitlist_Active | waitlist, liste d'attente |
| Taille_Non_Disponible | taille non disponible, size unavailable |

### FEEDBACK CLIENT
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Sensibilité_Délais | sensibilité délais, délais important, urgent |
| Souhaite_Alerte_Nouveautés | alerte nouveautés, new arrivals, wishlist |

### ACTION CRM
| Libellé | Mots-clés / patterns (exemples) |
|--------|----------------------------------|
| Contact_Stock | contact stock, prévenir stock, dispo à |
| Invitation_Avant_Première | avant-première, preview, private preview |
| Attention_Personnalisée | attention personnalisée, personalized attention |
| Follow_up_Digital | follow-up, rappel, rappeler, suivi |

---

## Résumé des catégories (codes utilisés dans le code)

| Code catégorie | Bloc métier |
|----------------|-------------|
| **profil** | 1. PROFILS (Genre, Génération, Statut relationnel, Communication, Visibilité, Digital, Domaine d'expertise) |
| **interet** | 2. CENTRES D'INTÉRÊT (Réseaux, Collections, Loisirs, Culture, Engagements) |
| **voyage** | 3. VOYAGE (Profil voyageur, Zones) |
| **contexte** | 4. CONTEXTE D'ACHAT (Bénéficiaire, Célébration, Style) |
| **service** | 5. SERVICE & HOSPITALITY (Restrictions, Diététique, Boissons, Confort, Confidentialité) |
| **marque** | 6. UNIVERS DE MARQUE (Préférences produits, Niveau d'engagement) |
| **crm** | 7. OPPORTUNITÉS & SUIVI (Disponibilité, Feedback, Action CRM) |

---

## Stockage en base (Supabase)

En plus du champ **tags** (liste plate de `{c, t}`), les données sont stockées sous forme **structurée par catégorie** dans le champ **`taxonomy`** (JSONB).

### Format `taxonomy`

```json
{
  "profil": ["Femme", "25-40", "Client_Fidèle", "Français"],
  "interet": ["Golf", "Haute_Horlogerie", "Sustainability_Focus"],
  "voyage": ["Europe", "Business_Travel"],
  "contexte": ["Cadeau_Proche", "Anniversaire", "Quiet_Luxury"],
  "service": ["Régime_Sans_Gluten", "Champagne_Spirits"],
  "marque": ["Lignes_Iconiques", "Client_Historique"],
  "crm": ["Follow_up_Digital", "Souhaite_Alerte_Nouveautés"]
}
```

- Chaque clé = une catégorie de la taxonomie (profil, interet, voyage, contexte, service, marque, crm).
- Chaque valeur = liste des **libellés** extraits pour cette catégorie (sans doublon).

### Intérêt

- **Requêtes ciblées** : ex. tous les clients ayant un libellé donné dans une catégorie :
  - `taxonomy->'profil' @> '["Client_Fidèle"]'::jsonb`
  - `taxonomy->'interet' @> '["Golf"]'::jsonb`
  - L’index GIN sur `taxonomy` permet des recherches rapides sur ces champs.
- **Rapports par bloc** : agrégations par catégorie (nombre de clients par centre d’intérêt, par statut relationnel, etc.).
- **Alignement** avec la structure de TAXONOMIE_UTILISEE.md.

### Migration

Si la table `clients` existait déjà sans la colonne `taxonomy`, exécuter le script **`supabase_migration_taxonomy.sql`** dans le SQL Editor Supabase.

---

*Source : `server.py`, variable `TAG_RULES`. Extraction via `extract_tags()` (regex sur le texte nettoyé). Construction de `taxonomy` via `build_taxonomy_from_tags()`. Fallback NBA adapté aux catégories `contexte`, `interet`, `profil`, `crm`.*
