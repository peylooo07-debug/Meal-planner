# 🎮 QuizFight – Duell der Köpfe

Ein Quizduell-artiges Wissensspiel, komplett neu gedacht für ein junges
Publikum (ca. 15–25 Jahre): Gaming, Social Media, Serien & Streaming,
Musik, Sport, krasses Wissen, Geo, Pop-/Viral-Momente, Alltag/Lifestyle
und 2000er/2010er-Nostalgie – **350 handgeschriebene Fragen** in vier
Schwierigkeitsstufen (viele davon bewusst richtig schwer/Experten-Niveau),
kein Framework, kein Server nötig.

## Starten

Nur ein Browser nötig:

```bash
# im Ordner quiz-duell/
python3 -m http.server 8000
# oder
npx serve .
```

Dann `http://localhost:8000` öffnen, oder `index.html` direkt per
Doppelklick starten.

## Spielmodi

- **🎯 Solo-Training** – allein üben, mit 3 Leben, wähl eine Kategorie
  oder "Mix" für alles durcheinander.
- **⚔️ Duell (2 Spieler)** – Pass-&-Play auf einem Gerät. Vor dem Match
  sperrt jede*r Spieler*in eine Kategorie für den Gegner (Draft-Phase),
  danach wird abwechselnd eine der verbleibenden Kategorien gewählt,
  beide beantworten dieselbe Frage, Geschwindigkeit zählt. Die letzte
  Runde ist immer eine **🔥 Showdown-Runde mit doppelten Punkten**.
- **🤖 Duell vs. Bot** – wie das Duell (inkl. Kategorie-Sperre &
  Showdown-Runde), aber gegen eine simulierte KI in drei
  Schwierigkeitsstufen.
- **📅 Tages-Challenge** – jeden Tag 5 neue, für alle gleiche Fragen
  (per Datum "geseedet"), mit Serien-Zähler für aufeinanderfolgende
  Tage.

## Punkte & Extras

- **Schwierigkeitsgrad wählbar**: "Gemischt" (wird im Match-Verlauf
  automatisch schwerer), "Schwer" (nur schwere/Experten-Fragen) oder
  "Experte" (nur die härtesten Fragen) – für Solo-Training und Duell
  getrennt einstellbar.
- **Zeitbonus**: Je schneller die richtige Antwort, desto mehr Punkte
  (Basis richtet sich nach Schwierigkeit: 100/200/300/400).
- **Streak-Multiplikator**: 3 richtige in Folge = x1.5, 5 in Folge = x2.
- **Joker** (je einmal pro Spieler und Match): 50:50, Publikums-Joker
  (simulierte Meinungsverteilung) und ❄️ +7 Sekunden.
- **Kategorie-Sperre**: Vor jedem Duell blockiert jede*r Spieler*in eine
  Kategorie für den Gegner – die bleibt fürs ganze Match tabu.
- **Showdown-Runde**: Die letzte Runde eines Duells zählt doppelt.
- **Sudden Death**: Bei Gleichstand nach allen Runden entscheidet eine
  Extra-Frage.
- **XP & Level**, **Erfolge/Achievements** (12 Stück) und eine
  **Statistik-Seite** mit Kategorien-Genauigkeit – alles lokal im
  Browser gespeichert (`localStorage`), es werden keine Daten
  irgendwohin gesendet.
- Eigene Soundeffekte (per Web Audio erzeugt, keine externen Dateien)
  und ein Mute-Button oben rechts.

## Projektstruktur

```
index.html        # Alle Bildschirme (Screens) als HTML-Sections
style.css         # Dunkles Neon-Design, mobile-first
app.js            # Komplette Spiellogik (State Machine, Scoring, Jokers, Achievements)
data/questions.js # 350 Fragen in 10 Kategorien (CATEGORIES + QUESTIONS)
```

## Eigene Fragen ergänzen

In `data/questions.js` ein neues Objekt ins `QUESTIONS`-Array einfügen:

```js
{ id: "eindeutige-id", cat: "gaming", diff: 2, q: "Frage...?",
  options: ["Richtig", "Falsch A", "Falsch B", "Falsch C"],
  correct: 0, fact: "Kurzer, spannender Fakt zur Antwort." }
```

`diff` ist 1 (leicht) bis 4 (Experte), `cat` muss eine der IDs aus dem
`CATEGORIES`-Array sein.
