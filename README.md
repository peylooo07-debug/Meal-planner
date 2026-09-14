# Familien-Wochenplaner

Eine einfache Web-App für Familien: Aus Personenanzahl, Budget, Allergien,
Vorlieben/Abneigungen und vorhandenen Zutaten wird automatisch ein
7-Tage-Speiseplan mit passender Einkaufsliste erstellt.

## Das ist die erste Version (V1)

Bewusst einfach gehalten, damit du als Anfänger den Code nachvollziehen
kannst:

- **Kein Server, kein Build-Tool, keine Installation nötig.** Nur reines
  HTML, CSS und JavaScript, das direkt im Browser läuft.
- **Rezept-Datenbank lokal** in `data/recipes.js` (30 familienfreundliche
  Rezepte mit Preis-Schätzung, Allergenen, Zubereitungszeit usw.).
- Alle Berechnungen (Filtern, Bewerten, Wochenplan erstellen,
  Einkaufsliste zusammenfassen) passieren direkt im Browser in
  `app.js`.

## App starten

Du brauchst nur einen Browser. Zwei Möglichkeiten:

**Variante A – Datei direkt öffnen**
Öffne `index.html` einfach per Doppelklick im Browser.

**Variante B – kleiner lokaler Server (empfohlen)**
Manche Browser sind bei lokalen Dateien etwas zickig. Deshalb ist ein
kleiner lokaler Server oft die stabilere Wahl:

```bash
# Python (meistens schon installiert)
python3 -m http.server 8000

# oder, falls du Node.js hast
npx serve .
```

Danach im Browser öffnen: `http://localhost:8000`

## Wie die App funktioniert

1. **Formular ausfüllen**: Personenanzahl, Wochenbudget, Allergien
   (schließen Rezepte komplett aus), Vorlieben (Fleisch/Fisch/
   Vegetarisch/Vegan), Zutaten, die du nicht magst, und Zutaten, die du
   schon zuhause hast.
2. **Filtern** (`filterRecipes` in `app.js`): Rezepte mit ausgeschlossenen
   Allergenen oder unerwünschten Zutaten fliegen raus.
3. **Bewerten** (`scoreRecipe`): Übrig gebliebene Rezepte bekommen Punkte
   für passende Vorlieben, Kinderfreundlichkeit und Überschneidung mit
   deinen vorhandenen Zutaten.
4. **Wochenplan erstellen** (`generateWeekPlan`): Tag für Tag wird das am
   besten passende Rezept gewählt – dabei wird versucht, das Budget
   einzuhalten und nicht zwei Tage hintereinander dieselbe Kategorie zu
   wiederholen.
5. **Einkaufsliste bauen** (`buildShoppingList`): Alle Zutaten der Woche
   werden auf deine Personenzahl hochgerechnet, zusammengefasst und nach
   Supermarkt-Kategorien sortiert. Zutaten, die du schon hast, werden
   herausgefiltert.

Deine letzten Eingaben werden im Browser (`localStorage`) gespeichert,
damit du sie beim nächsten Öffnen nicht neu eintippen musst. Es werden
dabei keine Daten irgendwohin gesendet – alles bleibt in deinem Browser.

## Projektstruktur

```
index.html        # Formular + Ergebnis-Bereich
style.css         # Design
app.js            # gesamte Logik (Filtern, Bewerten, Planen, Einkaufsliste)
data/recipes.js   # Rezept-Datenbank (hier neue Rezepte ergänzen)
```

## Eigene Rezepte hinzufügen

Öffne `data/recipes.js` und füge ein neues Objekt in das `RECIPES`-Array
ein, z. B.:

```js
{
  id: "mein-rezept",
  name: "Mein Rezept",
  category: "vegetarisch", // fleisch | fisch | vegetarisch | vegan
  allergens: ["laktose"],   // gluten, laktose, ei, nuesse, fisch, soja, senf
  kidFriendly: true,
  prepMinutes: 30,
  pricePerPerson: 2.5,       // geschätzter Preis pro Person in €
  portions: 4,                // die Mengen unten gelten für 4 Personen
  ingredients: [
    { name: "Zutat", amount: 200, unit: "g" }
  ]
}
```

## Mögliche nächste Schritte (V2 und später)

Ideen, wenn du weitermachen willst – am besten eine nach der anderen:

1. **Mehr Rezepte** und echte Fotos pro Rezept.
2. **"Neu mischen"-Button**, um eine Alternative für einen einzelnen Tag
   zu bekommen, ohne den ganzen Plan neu zu generieren.
3. **Frühstück/Mittag/Abendessen** statt nur einer Mahlzeit pro Tag.
4. **Nutzerkonten + echte Datenbank** (z. B. mit Firebase oder Supabase),
   damit Pläne geräteübergreifend gespeichert werden.
5. **Einkaufsliste teilen** (z. B. als Link oder Export für WhatsApp).
6. **Mobile App** (z. B. mit React Native), sobald das Web-Konzept steht.

## Warum dieser Ansatz für den Start?

Reines HTML/CSS/JS ganz ohne Framework oder Backend ist der einfachste
Weg, die Idee schnell testbar zu machen und als Anfänger jede Zeile Code
zu verstehen. Sobald du mit den Grundlagen (Formular, Funktionen, DOM)
vertraut bist, lässt sich die Logik aus `app.js` später fast unverändert
in ein größeres Framework (z. B. React) übernehmen.
