/**
 * Familien-Wochenplaner – App-Logik
 *
 * Ablauf:
 * 1. Nutzer füllt das Formular aus (Personen, Budget, Allergien,
 *    Vorlieben/Abneigungen, vorhandene Zutaten).
 * 2. Wir filtern die Rezept-Datenbank (RECIPES aus data/recipes.js).
 * 3. Wir bewerten (scoren) jedes verbleibende Rezept.
 * 4. Wir wählen Tag für Tag ein Rezept aus (Budget- und Abwechslungs-
 *    bewusst) -> Wochenplan.
 * 5. Aus dem Wochenplan berechnen wir eine zusammengefasste Einkaufsliste.
 */

const ALLERGEN_LABELS = {
  gluten: "Gluten",
  laktose: "Laktose",
  ei: "Ei",
  nuesse: "Nüsse",
  fisch: "Fisch",
  soja: "Soja",
  senf: "Senf"
};

const CATEGORY_LABELS = {
  fleisch: "Fleisch",
  fisch: "Fisch",
  vegetarisch: "Vegetarisch",
  vegan: "Vegan"
};

const WEEKDAYS = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag"
];

const SHOP_CATEGORIES = [
  {
    label: "Obst & Gemüse",
    keywords: [
      "zwiebel", "karotte", "paprika", "tomate", "gurke", "zucchini",
      "brokkoli", "blumenkohl", "lauch", "sellerie", "kartoffel",
      "aubergine", "champignon", "salat", "spinat", "süßkartoffel", "mais"
    ]
  },
  {
    label: "Fleisch & Fisch",
    keywords: ["hackfleisch", "hähnchen", "puten", "fisch", "speck"]
  },
  {
    label: "Milchprodukte & Eier",
    keywords: ["milch", "sahne", "käse", "joghurt", "butter", " ei", "parmesan"]
  },
  {
    label: "Trockenwaren & Getreide",
    keywords: [
      "nudeln", "spaghetti", "reis", "mehl", "couscous", "spätzle",
      "gnocchi", "lasagneplatten", "pizzateig", "tortilla", "taco",
      "pita", "fladenbrot", "blätterteig", "kichererbsen", "bohnen",
      "linsen", "brühe", "currypaste", "kokosmilch", "sojasauce",
      "passierte tomaten"
    ]
  }
];

const STORAGE_KEY = "mealplanner_form_v1";

function categorizeIngredient(name) {
  const lower = name.toLowerCase();
  let bestLabel = "Sonstiges";
  let bestLength = 0;
  for (const group of SHOP_CATEGORIES) {
    for (const kw of group.keywords) {
      if (lower.includes(kw) && kw.length > bestLength) {
        bestLabel = group.label;
        bestLength = kw.length;
      }
    }
  }
  return bestLabel;
}

function parseCommaList(value) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function filterRecipes(recipes, allergies, dislikes) {
  const dislikesLower = dislikes.map((d) => d.toLowerCase());
  return recipes.filter((r) => {
    if (r.allergens.some((a) => allergies.includes(a))) return false;
    if (
      dislikesLower.length &&
      r.ingredients.some((ing) =>
        dislikesLower.some((d) => ing.name.toLowerCase().includes(d))
      )
    ) {
      return false;
    }
    return true;
  });
}

function scoreRecipe(recipe, preferences, available) {
  let score = 0;
  if (preferences.length && preferences.includes(recipe.category)) {
    score += 3;
  }
  if (recipe.kidFriendly) {
    score += 1;
  }
  const availLower = available.map((a) => a.toLowerCase());
  const matches = recipe.ingredients.filter((ing) =>
    availLower.some(
      (a) => ing.name.toLowerCase().includes(a) || a.includes(ing.name.toLowerCase())
    )
  );
  score += matches.length * 2;
  return score;
}

function generateWeekPlan(scoredRecipes, budget, personen, days = 7) {
  const pool = scoredRecipes.slice();
  const plan = [];
  const usedIds = new Set();
  let lastCategory = null;
  let totalCost = 0;

  for (let day = 0; day < days; day++) {
    const canRepeat = pool.length < days;
    const candidates = pool
      .filter((r) => canRepeat || !usedIds.has(r.id))
      .map((r) => {
        const cost = round1(r.pricePerPerson * personen);
        const adjScore = r.score - (r.category === lastCategory ? 5 : 0);
        return { ...r, cost, adjScore };
      })
      .sort((a, b) => b.adjScore - a.adjScore || a.cost - b.cost);

    if (candidates.length === 0) break;

    const remainingDays = days - day;
    const remainingBudget = budget - totalCost;
    const avgAllowed = remainingBudget / remainingDays;

    let chosen =
      candidates.find((r) => r.cost <= Math.max(avgAllowed * 1.3, 0)) || null;
    if (!chosen) {
      chosen = candidates.reduce((a, b) => (a.cost < b.cost ? a : b));
    }

    plan.push(chosen);
    usedIds.add(chosen.id);
    lastCategory = chosen.category;
    totalCost += chosen.cost;
  }

  return { plan, totalCost: round1(totalCost) };
}

function roundAmount(amount) {
  if (amount >= 20) return Math.round(amount / 5) * 5;
  if (amount >= 5) return Math.round(amount);
  return Math.round(amount * 10) / 10;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function buildShoppingList(plan, personen, available) {
  const map = new Map();
  plan.forEach((recipe) => {
    const factor = personen / recipe.portions;
    recipe.ingredients.forEach((ing) => {
      const key = ing.name + "|" + ing.unit;
      const amount = ing.amount * factor;
      map.set(key, (map.get(key) || 0) + amount);
    });
  });

  const availLower = available.map((a) => a.toLowerCase());
  const toBuy = [];
  const haveAlready = [];

  map.forEach((amount, key) => {
    const [name, unit] = key.split("|");
    const item = { name, unit, amount: roundAmount(amount) };
    const isAvailable = availLower.some(
      (a) => name.toLowerCase().includes(a) || a.includes(name.toLowerCase())
    );
    if (isAvailable) {
      haveAlready.push(item);
    } else {
      toBuy.push(item);
    }
  });

  return { toBuy, haveAlready };
}

// ---------- Rendering ----------

function renderPlan(plan, totalCost, budget, personen) {
  const container = document.getElementById("plan-results");
  container.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "budget-summary";
  const diff = round1(budget - totalCost);
  const overBudget = diff < 0;
  summary.innerHTML = `
    <p><strong>Geschätzte Gesamtkosten der Woche:</strong> ${totalCost.toFixed(2)} €
    von ${budget.toFixed(2)} € Budget</p>
    <p class="${overBudget ? "warning" : "ok"}">
      ${
        overBudget
          ? `Das Budget reicht leider nicht ganz aus (${Math.abs(diff).toFixed(2)} € zu wenig). Versuche günstigere Vorlieben oder ein höheres Budget.`
          : `Du bleibst ${diff.toFixed(2)} € unter deinem Budget.`
      }
    </p>
  `;
  container.appendChild(summary);

  const grid = document.createElement("div");
  grid.className = "plan-grid";

  plan.forEach((recipe, i) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <h3>${WEEKDAYS[i]}</h3>
      <h4>${recipe.name}</h4>
      <div class="tags">
        <span class="tag category-${recipe.category}">${CATEGORY_LABELS[recipe.category]}</span>
        ${recipe.kidFriendly ? '<span class="tag kid">Kinderfreundlich</span>' : ""}
        ${recipe.allergens
          .map((a) => `<span class="tag allergen">${ALLERGEN_LABELS[a]}</span>`)
          .join("")}
      </div>
      <p class="meta">${recipe.prepMinutes} Min. Zubereitung · ca. ${recipe.cost.toFixed(2)} € für ${personen} Person(en)</p>
      <details>
        <summary>Zutaten anzeigen</summary>
        <ul>
          ${recipe.ingredients
            .map((ing) => {
              const factor = personen / recipe.portions;
              const amt = roundAmount(ing.amount * factor);
              return `<li>${amt} ${ing.unit} ${ing.name}</li>`;
            })
            .join("")}
        </ul>
      </details>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderShoppingList(list) {
  const container = document.getElementById("shopping-results");
  container.innerHTML = "";

  if (list.toBuy.length === 0) {
    container.innerHTML = "<p>Du hast schon alles zuhause! 🎉</p>";
  } else {
    const byCategory = new Map();
    list.toBuy.forEach((item) => {
      const cat = categorizeIngredient(item.name);
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(item);
    });

    const orderedCats = [
      "Obst & Gemüse",
      "Fleisch & Fisch",
      "Milchprodukte & Eier",
      "Trockenwaren & Getreide",
      "Sonstiges"
    ];

    orderedCats.forEach((cat) => {
      if (!byCategory.has(cat)) return;
      const section = document.createElement("div");
      section.className = "shopping-category";
      section.innerHTML = `<h4>${cat}</h4>`;
      const ul = document.createElement("ul");
      ul.className = "shopping-list";
      byCategory.get(cat).forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <label>
            <input type="checkbox" />
            ${item.amount} ${item.unit} ${item.name}
          </label>
        `;
        ul.appendChild(li);
      });
      section.appendChild(ul);
      container.appendChild(section);
    });
  }

  if (list.haveAlready.length > 0) {
    const note = document.createElement("p");
    note.className = "already-have-note";
    note.textContent =
      "Bereits vorhanden (nicht auf der Liste): " +
      list.haveAlready.map((i) => i.name).join(", ");
    container.appendChild(note);
  }
}

function readForm() {
  const personen = Math.max(1, parseInt(document.getElementById("personen").value, 10) || 1);
  const budget = Math.max(0, parseFloat(document.getElementById("budget").value) || 0);
  const allergies = Array.from(
    document.querySelectorAll('input[name="allergie"]:checked')
  ).map((el) => el.value);
  const preferences = Array.from(
    document.querySelectorAll('input[name="vorliebe"]:checked')
  ).map((el) => el.value);
  const dislikes = parseCommaList(document.getElementById("abneigungen").value);
  const available = parseCommaList(document.getElementById("zutaten").value);

  return { personen, budget, allergies, preferences, dislikes, available };
}

function saveFormToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage evtl. nicht verfügbar (z. B. privater Modus) - ignorieren
  }
}

function loadFormFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function applyFormFromStorage(data) {
  if (!data) return;
  if (data.personen) document.getElementById("personen").value = data.personen;
  if (data.budget) document.getElementById("budget").value = data.budget;
  if (data.dislikes) document.getElementById("abneigungen").value = data.dislikes.join(", ");
  if (data.available) document.getElementById("zutaten").value = data.available.join(", ");
  (data.allergies || []).forEach((val) => {
    const el = document.querySelector(`input[name="allergie"][value="${val}"]`);
    if (el) el.checked = true;
  });
  (data.preferences || []).forEach((val) => {
    const el = document.querySelector(`input[name="vorliebe"][value="${val}"]`);
    if (el) el.checked = true;
  });
}

function handleGenerate(event) {
  event.preventDefault();
  const form = readForm();
  saveFormToStorage(form);

  const filtered = filterRecipes(RECIPES, form.allergies, form.dislikes);

  if (filtered.length === 0) {
    document.getElementById("plan-results").innerHTML =
      "<p class='warning'>Mit diesen Angaben passt leider kein Rezept aus unserer Datenbank. Bitte lockere Allergien oder Abneigungen.</p>";
    document.getElementById("shopping-results").innerHTML = "";
    return;
  }

  const scored = filtered.map((r) => ({
    ...r,
    score: scoreRecipe(r, form.preferences, form.available)
  }));

  const { plan, totalCost } = generateWeekPlan(scored, form.budget, form.personen);
  renderPlan(plan, totalCost, form.budget, form.personen);

  const shoppingList = buildShoppingList(plan, form.personen, form.available);
  renderShoppingList(shoppingList);

  document.getElementById("results-section").scrollIntoView({ behavior: "smooth" });
}

function init() {
  const saved = loadFormFromStorage();
  applyFormFromStorage(saved);

  document.getElementById("plan-form").addEventListener("submit", handleGenerate);
}

document.addEventListener("DOMContentLoaded", init);
