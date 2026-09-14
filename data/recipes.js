/**
 * Rezept-Datenbank für den Familien-Wochenplaner.
 *
 * Jedes Rezept ist für 4 Personen berechnet (portions: 4).
 * Beim Generieren des Wochenplans wird die Menge auf die
 * eingegebene Personenzahl hochgerechnet.
 *
 * allergens: Liste der enthaltenen Allergene, mögliche Werte:
 *   "gluten", "laktose", "ei", "nuesse", "fisch", "soja", "senf"
 *
 * category: "fleisch" | "fisch" | "vegetarisch" | "vegan"
 */

const RECIPES = [
  {
    id: "spaghetti-bolognese",
    name: "Spaghetti Bolognese",
    category: "fleisch",
    allergens: ["gluten"],
    kidFriendly: true,
    prepMinutes: 35,
    pricePerPerson: 2.8,
    portions: 4,
    ingredients: [
      { name: "Spaghetti", amount: 400, unit: "g" },
      { name: "Hackfleisch (gemischt)", amount: 400, unit: "g" },
      { name: "Passierte Tomaten", amount: 500, unit: "ml" },
      { name: "Zwiebel", amount: 1, unit: "Stück" },
      { name: "Knoblauchzehe", amount: 2, unit: "Stück" },
      { name: "Karotte", amount: 1, unit: "Stück" },
      { name: "Geriebener Käse", amount: 100, unit: "g" }
    ]
  },
  {
    id: "kartoffelgratin",
    name: "Kartoffelgratin mit Salat",
    category: "vegetarisch",
    allergens: ["laktose"],
    kidFriendly: true,
    prepMinutes: 60,
    pricePerPerson: 2.4,
    portions: 4,
    ingredients: [
      { name: "Kartoffeln", amount: 1000, unit: "g" },
      { name: "Sahne", amount: 300, unit: "ml" },
      { name: "Milch", amount: 200, unit: "ml" },
      { name: "Geriebener Käse", amount: 150, unit: "g" },
      { name: "Gemischter Salat", amount: 200, unit: "g" }
    ]
  },
  {
    id: "haehnchen-reis",
    name: "Hähnchen mit Reis und Gemüse",
    category: "fleisch",
    allergens: [],
    kidFriendly: true,
    prepMinutes: 40,
    pricePerPerson: 3.2,
    portions: 4,
    ingredients: [
      { name: "Hähnchenbrust", amount: 500, unit: "g" },
      { name: "Reis", amount: 300, unit: "g" },
      { name: "Brokkoli", amount: 300, unit: "g" },
      { name: "Karotte", amount: 2, unit: "Stück" },
      { name: "Sojasauce", amount: 3, unit: "EL" }
    ]
  },
  {
    id: "gemuesecurry",
    name: "Gemüsecurry mit Kokosmilch",
    category: "vegan",
    allergens: [],
    kidFriendly: false,
    prepMinutes: 30,
    pricePerPerson: 2.2,
    portions: 4,
    ingredients: [
      { name: "Kokosmilch", amount: 400, unit: "ml" },
      { name: "Kichererbsen (Dose)", amount: 400, unit: "g" },
      { name: "Süßkartoffel", amount: 400, unit: "g" },
      { name: "Paprika", amount: 2, unit: "Stück" },
      { name: "Currypaste", amount: 2, unit: "EL" },
      { name: "Reis", amount: 300, unit: "g" }
    ]
  },
  {
    id: "fischstaebchen",
    name: "Fischstäbchen mit Kartoffelpüree",
    category: "fisch",
    allergens: ["gluten", "fisch"],
    kidFriendly: true,
    prepMinutes: 30,
    pricePerPerson: 2.6,
    portions: 4,
    ingredients: [
      { name: "Fischstäbchen", amount: 16, unit: "Stück" },
      { name: "Kartoffeln", amount: 800, unit: "g" },
      { name: "Milch", amount: 100, unit: "ml" },
      { name: "Butter", amount: 30, unit: "g" },
      { name: "Erbsen", amount: 200, unit: "g" }
    ]
  },
  {
    id: "pfannkuchen",
    name: "Herzhafte Pfannkuchen",
    category: "vegetarisch",
    allergens: ["gluten", "ei", "laktose"],
    kidFriendly: true,
    prepMinutes: 25,
    pricePerPerson: 1.8,
    portions: 4,
    ingredients: [
      { name: "Mehl", amount: 250, unit: "g" },
      { name: "Milch", amount: 400, unit: "ml" },
      { name: "Ei", amount: 3, unit: "Stück" },
      { name: "Salz", amount: 1, unit: "TL" },
      { name: "Gemischter Salat", amount: 150, unit: "g" }
    ]
  },
  {
    id: "chili-sin-carne",
    name: "Chili sin Carne",
    category: "vegan",
    allergens: [],
    kidFriendly: false,
    prepMinutes: 35,
    pricePerPerson: 2.0,
    portions: 4,
    ingredients: [
      { name: "Kidneybohnen (Dose)", amount: 400, unit: "g" },
      { name: "Mais (Dose)", amount: 300, unit: "g" },
      { name: "Passierte Tomaten", amount: 500, unit: "ml" },
      { name: "Paprika", amount: 2, unit: "Stück" },
      { name: "Zwiebel", amount: 1, unit: "Stück" },
      { name: "Reis", amount: 250, unit: "g" }
    ]
  },
  {
    id: "lasagne",
    name: "Klassische Lasagne",
    category: "fleisch",
    allergens: ["gluten", "laktose", "ei"],
    kidFriendly: true,
    prepMinutes: 70,
    pricePerPerson: 3.0,
    portions: 4,
    ingredients: [
      { name: "Lasagneplatten", amount: 250, unit: "g" },
      { name: "Hackfleisch (gemischt)", amount: 400, unit: "g" },
      { name: "Passierte Tomaten", amount: 500, unit: "ml" },
      { name: "Sahne", amount: 200, unit: "ml" },
      { name: "Geriebener Käse", amount: 200, unit: "g" }
    ]
  },
  {
    id: "gemuesesuppe",
    name: "Bunte Gemüsesuppe",
    category: "vegan",
    allergens: [],
    kidFriendly: false,
    prepMinutes: 40,
    pricePerPerson: 1.6,
    portions: 4,
    ingredients: [
      { name: "Karotte", amount: 3, unit: "Stück" },
      { name: "Kartoffeln", amount: 400, unit: "g" },
      { name: "Lauch", amount: 1, unit: "Stück" },
      { name: "Sellerie", amount: 1, unit: "Stück" },
      { name: "Gemüsebrühe", amount: 1000, unit: "ml" }
    ]
  },
  {
    id: "pommes-nuggets",
    name: "Ofenpommes mit Hähnchen-Nuggets",
    category: "fleisch",
    allergens: ["gluten"],
    kidFriendly: true,
    prepMinutes: 30,
    pricePerPerson: 2.5,
    portions: 4,
    ingredients: [
      { name: "Tiefkühl-Pommes", amount: 600, unit: "g" },
      { name: "Hähnchen-Nuggets", amount: 400, unit: "g" },
      { name: "Ketchup", amount: 1, unit: "Flasche" },
      { name: "Gemischter Salat", amount: 150, unit: "g" }
    ]
  },
  {
    id: "nudelsalat",
    name: "Bunter Nudelsalat",
    category: "vegetarisch",
    allergens: ["gluten", "ei"],
    kidFriendly: true,
    prepMinutes: 25,
    pricePerPerson: 2.0,
    portions: 4,
    ingredients: [
      { name: "Nudeln (kurz)", amount: 400, unit: "g" },
      { name: "Mais (Dose)", amount: 200, unit: "g" },
      { name: "Paprika", amount: 2, unit: "Stück" },
      { name: "Mayonnaise", amount: 150, unit: "g" },
      { name: "Gurke", amount: 1, unit: "Stück" }
    ]
  },
  {
    id: "pizza",
    name: "Selbstgemachte Pizza",
    category: "vegetarisch",
    allergens: ["gluten", "laktose"],
    kidFriendly: true,
    prepMinutes: 50,
    pricePerPerson: 2.3,
    portions: 4,
    ingredients: [
      { name: "Pizzateig", amount: 2, unit: "Stück" },
      { name: "Passierte Tomaten", amount: 200, unit: "ml" },
      { name: "Geriebener Käse", amount: 250, unit: "g" },
      { name: "Champignons", amount: 200, unit: "g" },
      { name: "Paprika", amount: 1, unit: "Stück" }
    ]
  },
  {
    id: "tacos",
    name: "Tacos mit Hackfleisch",
    category: "fleisch",
    allergens: ["gluten", "laktose"],
    kidFriendly: true,
    prepMinutes: 30,
    pricePerPerson: 2.9,
    portions: 4,
    ingredients: [
      { name: "Taco-Schalen", amount: 12, unit: "Stück" },
      { name: "Hackfleisch (gemischt)", amount: 400, unit: "g" },
      { name: "Tomate", amount: 2, unit: "Stück" },
      { name: "Salat", amount: 150, unit: "g" },
      { name: "Geriebener Käse", amount: 150, unit: "g" }
    ]
  },
  {
    id: "risotto",
    name: "Cremiges Gemüse-Risotto",
    category: "vegetarisch",
    allergens: ["laktose"],
    kidFriendly: false,
    prepMinutes: 40,
    pricePerPerson: 2.4,
    portions: 4,
    ingredients: [
      { name: "Risotto-Reis", amount: 320, unit: "g" },
      { name: "Gemüsebrühe", amount: 1000, unit: "ml" },
      { name: "Zucchini", amount: 2, unit: "Stück" },
      { name: "Parmesan", amount: 80, unit: "g" },
      { name: "Zwiebel", amount: 1, unit: "Stück" }
    ]
  },
  {
    id: "kartoffel-lauch-suppe",
    name: "Kartoffel-Lauch-Suppe",
    category: "vegetarisch",
    allergens: ["laktose"],
    kidFriendly: false,
    prepMinutes: 35,
    pricePerPerson: 1.5,
    portions: 4,
    ingredients: [
      { name: "Kartoffeln", amount: 600, unit: "g" },
      { name: "Lauch", amount: 2, unit: "Stück" },
      { name: "Gemüsebrühe", amount: 800, unit: "ml" },
      { name: "Sahne", amount: 100, unit: "ml" }
    ]
  },
  {
    id: "ofengemuese-couscous",
    name: "Ofengemüse mit Couscous",
    category: "vegan",
    allergens: ["gluten"],
    kidFriendly: false,
    prepMinutes: 40,
    pricePerPerson: 2.1,
    portions: 4,
    ingredients: [
      { name: "Couscous", amount: 300, unit: "g" },
      { name: "Zucchini", amount: 2, unit: "Stück" },
      { name: "Paprika", amount: 2, unit: "Stück" },
      { name: "Aubergine", amount: 1, unit: "Stück" },
      { name: "Olivenöl", amount: 3, unit: "EL" }
    ]
  },
  {
    id: "bratkartoffeln-ei",
    name: "Bratkartoffeln mit Spiegelei",
    category: "vegetarisch",
    allergens: ["ei"],
    kidFriendly: true,
    prepMinutes: 30,
    pricePerPerson: 1.7,
    portions: 4,
    ingredients: [
      { name: "Kartoffeln", amount: 800, unit: "g" },
      { name: "Ei", amount: 4, unit: "Stück" },
      { name: "Speckwürfel", amount: 100, unit: "g" },
      { name: "Zwiebel", amount: 1, unit: "Stück" }
    ]
  },
  {
    id: "linsensuppe",
    name: "Deftige Linsensuppe",
    category: "vegan",
    allergens: [],
    kidFriendly: false,
    prepMinutes: 45,
    pricePerPerson: 1.6,
    portions: 4,
    ingredients: [
      { name: "Rote Linsen", amount: 300, unit: "g" },
      { name: "Karotte", amount: 2, unit: "Stück" },
      { name: "Kartoffeln", amount: 300, unit: "g" },
      { name: "Gemüsebrühe", amount: 1000, unit: "ml" },
      { name: "Zwiebel", amount: 1, unit: "Stück" }
    ]
  },
  {
    id: "falafel-pita",
    name: "Falafel im Pitabrot",
    category: "vegan",
    allergens: ["gluten"],
    kidFriendly: false,
    prepMinutes: 35,
    pricePerPerson: 2.2,
    portions: 4,
    ingredients: [
      { name: "Falafel (TK)", amount: 20, unit: "Stück" },
      { name: "Pitabrot", amount: 4, unit: "Stück" },
      { name: "Gurke", amount: 1, unit: "Stück" },
      { name: "Tomate", amount: 2, unit: "Stück" },
      { name: "Joghurt-Dip", amount: 150, unit: "g" }
    ]
  },
  {
    id: "gemueseauflauf",
    name: "Gemüseauflauf mit Käse",
    category: "vegetarisch",
    allergens: ["laktose"],
    kidFriendly: true,
    prepMinutes: 45,
    pricePerPerson: 2.0,
    portions: 4,
    ingredients: [
      { name: "Brokkoli", amount: 300, unit: "g" },
      { name: "Blumenkohl", amount: 300, unit: "g" },
      { name: "Sahne", amount: 200, unit: "ml" },
      { name: "Geriebener Käse", amount: 200, unit: "g" },
      { name: "Kartoffeln", amount: 300, unit: "g" }
    ]
  },
  {
    id: "putengeschnetzeltes",
    name: "Putengeschnetzeltes mit Nudeln",
    category: "fleisch",
    allergens: ["gluten", "laktose"],
    kidFriendly: true,
    prepMinutes: 30,
    pricePerPerson: 3.1,
    portions: 4,
    ingredients: [
      { name: "Putenbrust", amount: 500, unit: "g" },
      { name: "Nudeln", amount: 400, unit: "g" },
      { name: "Champignons", amount: 200, unit: "g" },
      { name: "Sahne", amount: 200, unit: "ml" }
    ]
  },
  {
    id: "kaesespaetzle",
    name: "Käsespätzle mit Röstzwiebeln",
    category: "vegetarisch",
    allergens: ["gluten", "ei", "laktose"],
    kidFriendly: true,
    prepMinutes: 30,
    pricePerPerson: 2.2,
    portions: 4,
    ingredients: [
      { name: "Spätzle", amount: 500, unit: "g" },
      { name: "Geriebener Käse", amount: 250, unit: "g" },
      { name: "Röstzwiebeln", amount: 80, unit: "g" },
      { name: "Gemischter Salat", amount: 150, unit: "g" }
    ]
  },
  {
    id: "chicken-wrap",
    name: "Chicken Wrap",
    category: "fleisch",
    allergens: ["gluten", "laktose"],
    kidFriendly: true,
    prepMinutes: 25,
    pricePerPerson: 2.7,
    portions: 4,
    ingredients: [
      { name: "Tortilla-Wraps", amount: 8, unit: "Stück" },
      { name: "Hähnchenbrust", amount: 400, unit: "g" },
      { name: "Salat", amount: 150, unit: "g" },
      { name: "Joghurt-Dip", amount: 150, unit: "g" },
      { name: "Tomate", amount: 2, unit: "Stück" }
    ]
  },
  {
    id: "shakshuka",
    name: "Shakshuka",
    category: "vegetarisch",
    allergens: ["ei"],
    kidFriendly: false,
    prepMinutes: 30,
    pricePerPerson: 1.9,
    portions: 4,
    ingredients: [
      { name: "Ei", amount: 6, unit: "Stück" },
      { name: "Passierte Tomaten", amount: 500, unit: "ml" },
      { name: "Paprika", amount: 2, unit: "Stück" },
      { name: "Zwiebel", amount: 1, unit: "Stück" },
      { name: "Fladenbrot", amount: 2, unit: "Stück" }
    ]
  },
  {
    id: "gnocchi-pfanne",
    name: "Gnocchi-Pfanne mit Spinat",
    category: "vegetarisch",
    allergens: ["laktose"],
    kidFriendly: false,
    prepMinutes: 20,
    pricePerPerson: 2.1,
    portions: 4,
    ingredients: [
      { name: "Gnocchi", amount: 500, unit: "g" },
      { name: "Blattspinat (TK)", amount: 300, unit: "g" },
      { name: "Sahne", amount: 200, unit: "ml" },
      { name: "Parmesan", amount: 80, unit: "g" }
    ]
  },
  {
    id: "bohneneintopf",
    name: "Herzhafter Bohneneintopf",
    category: "vegan",
    allergens: [],
    kidFriendly: false,
    prepMinutes: 40,
    pricePerPerson: 1.7,
    portions: 4,
    ingredients: [
      { name: "Weiße Bohnen (Dose)", amount: 400, unit: "g" },
      { name: "Karotte", amount: 2, unit: "Stück" },
      { name: "Kartoffeln", amount: 300, unit: "g" },
      { name: "Gemüsebrühe", amount: 800, unit: "ml" },
      { name: "Sellerie", amount: 1, unit: "Stück" }
    ]
  },
  {
    id: "fischfilet-gemuese",
    name: "Fischfilet mit Ofengemüse",
    category: "fisch",
    allergens: ["fisch"],
    kidFriendly: false,
    prepMinutes: 35,
    pricePerPerson: 3.5,
    portions: 4,
    ingredients: [
      { name: "Fischfilet", amount: 500, unit: "g" },
      { name: "Zucchini", amount: 2, unit: "Stück" },
      { name: "Paprika", amount: 2, unit: "Stück" },
      { name: "Kartoffeln", amount: 400, unit: "g" },
      { name: "Olivenöl", amount: 2, unit: "EL" }
    ]
  },
  {
    id: "gemuese-quiche",
    name: "Gemüse-Quiche",
    category: "vegetarisch",
    allergens: ["gluten", "ei", "laktose"],
    kidFriendly: true,
    prepMinutes: 50,
    pricePerPerson: 2.3,
    portions: 4,
    ingredients: [
      { name: "Blätterteig", amount: 1, unit: "Rolle" },
      { name: "Ei", amount: 4, unit: "Stück" },
      { name: "Sahne", amount: 200, unit: "ml" },
      { name: "Lauch", amount: 1, unit: "Stück" },
      { name: "Geriebener Käse", amount: 150, unit: "g" }
    ]
  },
  {
    id: "haehnchen-curry",
    name: "Hähnchen-Curry mit Reis",
    category: "fleisch",
    allergens: [],
    kidFriendly: true,
    prepMinutes: 35,
    pricePerPerson: 3.0,
    portions: 4,
    ingredients: [
      { name: "Hähnchenbrust", amount: 500, unit: "g" },
      { name: "Kokosmilch", amount: 400, unit: "ml" },
      { name: "Currypaste", amount: 2, unit: "EL" },
      { name: "Reis", amount: 300, unit: "g" },
      { name: "Paprika", amount: 1, unit: "Stück" }
    ]
  }
];

// Für den Fall, dass die Datei später als Modul importiert wird.
if (typeof module !== "undefined") {
  module.exports = { RECIPES };
}
