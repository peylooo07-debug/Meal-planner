(function () {
  "use strict";

  // ================= CONSTANTS =================
  const AVATARS = ["🙂","😎","🤩","🥳","😈","🤖","👽","🦊","🐱","🐼","🦁","🐸","🐧","🦄","👾","🎮","🔥","⚡","🌟","💀","🍕","🎧"];
  const TIME_BY_DIFF = { 1: 14, 2: 17, 3: 20, 4: 24 };
  const DIFF_LABEL = { 1: "★ Leicht", 2: "★★ Mittel", 3: "★★★ Schwer", 4: "★★★★ Experte" };
  const LENGTH_OPTIONS = [
    { id: "short", label: "Kurz · 6", rounds: 6 },
    { id: "standard", label: "Standard · 10", rounds: 10 },
    { id: "long", label: "Lang · 15", rounds: 15 },
  ];
  const BOT_DIFFICULTIES = [
    { id: "easy", label: "Leicht 🙂" },
    { id: "medium", label: "Mittel 😐" },
    { id: "hard", label: "Schwer 😈" },
  ];
  const QUESTION_DIFFICULTY_MODES = [
    { id: "mixed", label: "Gemischt" },
    { id: "hard", label: "Schwer 🔥" },
    { id: "expert", label: "Experte 💀" },
  ];
  const PROFILE_KEY = "quizfight_profile_v1";
  const MUTE_KEY = "quizfight_muted_v1";

  function levelForXp(xp) { return 1 + Math.floor(xp / 250); }
  function xpIntoLevel(xp) { return xp - (levelForXp(xp) - 1) * 250; }

  const ACHIEVEMENTS = [
    { id: "first_match", emoji: "🎉", title: "Erste Schritte", desc: "Spiele dein erstes Match.", check: s => s.stats.gamesPlayed >= 1 },
    { id: "five_wins", emoji: "🏅", title: "Serientäter", desc: "Gewinne 5 Duelle.", check: s => s.stats.wins >= 5 },
    { id: "perfect_game", emoji: "💯", title: "Perfektionist", desc: "100% richtig in einem Match (min. 6 Fragen).", check: s => s.stats.perfectGames >= 1 },
    { id: "speedy", emoji: "⚡", title: "Blitzschnell", desc: "10x eine Antwort mit über 80% Restzeit richtig.", check: s => s.stats.fastAnswers >= 10 },
    { id: "streak8", emoji: "🔥", title: "Streak-Master", desc: "Erreiche Streak 8 in einem Match.", check: s => s.stats.bestStreak >= 8 },
    { id: "daily7", emoji: "📅", title: "Wochen-Grinder", desc: "7 Tage in Folge Tages-Challenge gespielt.", check: s => s.daily.bestStreak >= 7 },
    { id: "jokerless", emoji: "🧠", title: "Purist", desc: "Gewinne ein Duell ganz ohne Joker.", check: s => s.stats.jokerlessWins >= 1 },
    { id: "sudden_death", emoji: "💥", title: "Nervenstark", desc: "Gewinne ein Duell im Sudden Death.", check: s => s.stats.suddenDeathWins >= 1 },
    { id: "allrounder", emoji: "🌍", title: "Allrounder", desc: "5 richtige Antworten in jeder Kategorie.", check: s => CATEGORIES.every(c => (s.stats.categoryStats[c.id] && s.stats.categoryStats[c.id].correct || 0) >= 5) },
    { id: "level5", emoji: "🚀", title: "Aufsteiger", desc: "Erreiche Level 5.", check: s => levelForXp(s.xp) >= 5 },
    { id: "level10", emoji: "👑", title: "Legende", desc: "Erreiche Level 10.", check: s => levelForXp(s.xp) >= 10 },
    { id: "games25", emoji: "🕹️", title: "Vielspieler", desc: "Spiele 25 Matches.", check: s => s.stats.gamesPlayed >= 25 },
  ];

  // ================= PROFILE / STORAGE =================
  function defaultProfile() {
    return {
      name: "", avatar: "🙂", xp: 0,
      daily: { lastDate: null, streak: 0, bestStreak: 0 },
      achievementsUnlocked: [],
      stats: { gamesPlayed: 0, wins: 0, perfectGames: 0, fastAnswers: 0, bestStreak: 0, jokerlessWins: 0, suddenDeathWins: 0, categoryStats: {} },
    };
  }
  let profile = loadProfile();
  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      const d = defaultProfile();
      return Object.assign(d, p, { daily: Object.assign(d.daily, p.daily), stats: Object.assign(d.stats, p.stats) });
    } catch (e) { return null; }
  }
  function saveProfile() { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }

  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  // ================= SOUND =================
  let actx = null;
  function ensureAudio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } }
  function tone(freq, start, dur, type, gain) {
    if (muted || !actx) return;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, actx.currentTime + start);
    g.gain.setValueAtTime(0, actx.currentTime + start);
    g.gain.linearRampToValueAtTime(gain || 0.15, actx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + start + dur);
    osc.connect(g); g.connect(actx.destination);
    osc.start(actx.currentTime + start);
    osc.stop(actx.currentTime + start + dur + 0.05);
  }
  const sfx = {
    correct: () => { tone(523, 0, 0.12, "triangle"); tone(784, 0.1, 0.18, "triangle"); },
    wrong: () => { tone(220, 0, 0.15, "sawtooth", 0.12); tone(140, 0.12, 0.22, "sawtooth", 0.1); },
    tick: () => tone(880, 0, 0.05, "square", 0.05),
    win: () => { tone(523, 0, 0.1, "triangle"); tone(659, 0.1, 0.1, "triangle"); tone(784, 0.2, 0.1, "triangle"); tone(1046, 0.3, 0.25, "triangle"); },
    click: () => tone(440, 0, 0.05, "sine", 0.06),
    joker: () => { tone(660, 0, 0.08, "sine", 0.1); tone(990, 0.06, 0.1, "sine", 0.08); },
  };

  // ================= DOM HELPERS =================
  const $ = id => document.getElementById(id);
  function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo(0, 0);
  }
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function toast(msg) {
    const t = el("div", "toast", msg);
    $("toast-container").appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function confettiBurst(n) {
    const colors = ["#a855f7", "#ec4899", "#22d3ee", "#22c55e", "#f59e0b"];
    for (let i = 0; i < (n || 40); i++) {
      const p = el("div", "confetti-piece");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDuration = (1.6 + Math.random() * 1.2) + "s";
      p.style.opacity = "0.9";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 3000);
    }
  }

  // ================= TIMER =================
  function createTimer(limitSec, onTick, onExpire) {
    let remaining = limitSec;
    let stopped = false;
    onTick(remaining, limitSec);
    const iv = setInterval(() => {
      if (stopped) return;
      remaining -= 0.1;
      if (remaining <= 0) { remaining = 0; onTick(remaining, limitSec); stop(); onExpire(); return; }
      onTick(remaining, limitSec);
    }, 100);
    function stop() { stopped = true; clearInterval(iv); }
    return {
      stop,
      addTime: sec => { remaining += sec; limitSec += sec; },
      getRemaining: () => remaining,
    };
  }

  // ================= MATCH STATE =================
  let M = null; // active match

  function newPlayer(name, avatar, isBot) {
    return { name, avatar: avatar || "🤖", isBot: !!isBot, score: 0, streak: 0, bestStreak: 0, correctCount: 0, totalCount: 0, jokers: { fifty: true, audience: true, freeze: true }, usedAnyJoker: false };
  }

  function pickQuestion(catId, roundIndex, totalRounds) {
    let pool = QUESTIONS.filter(q => q.cat === catId && !M.usedQuestionIds.has(q.id));
    if (!pool.length) pool = QUESTIONS.filter(q => !M.usedQuestionIds.has(q.id));
    if (!pool.length) { M.usedQuestionIds.clear(); pool = QUESTIONS.filter(q => q.cat === catId); if (!pool.length) pool = QUESTIONS.slice(); }

    const mode = (M && M.difficultyMode) || "mixed";
    let filtered;
    if (mode === "expert") {
      filtered = pool.filter(q => q.diff === 4);
    } else if (mode === "hard") {
      filtered = pool.filter(q => q.diff >= 3);
    } else {
      const progress = totalRounds > 1 ? roundIndex / (totalRounds - 1) : 1;
      const minDiff = 1 + Math.floor(progress * 3); // steigt von 1 auf 4 im Laufe des Matches
      filtered = pool.filter(q => q.diff >= minDiff);
    }
    if (!filtered.length) filtered = pool;
    const q = filtered[Math.floor(Math.random() * filtered.length)];
    M.usedQuestionIds.add(q.id);
    return q;
  }

  function computeScore(question, remaining, limit, streakAfter) {
    const base = question.diff * 100;
    const ratio = Math.max(0, Math.min(1, remaining / limit));
    let pts = Math.round(base * (0.5 + 0.5 * ratio));
    let mult = 1;
    if (streakAfter >= 5) mult = 2;
    else if (streakAfter >= 3) mult = 1.5;
    pts = Math.round(pts * mult);
    return { pts, mult, ratio };
  }

  // ================= HOME / PROFILE RENDER =================
  function renderProfileChip() {
    if (!profile || !profile.name) { $("profile-chip").hidden = true; return; }
    $("profile-chip").hidden = false;
    $("chip-avatar").textContent = profile.avatar;
    $("chip-name").textContent = profile.name;
    $("chip-level").textContent = "Lvl " + levelForXp(profile.xp);
  }

  function renderHome() {
    $("home-avatar").textContent = profile.avatar;
    $("home-name").textContent = profile.name;
    const lvl = levelForXp(profile.xp);
    $("home-level-label").textContent = "Level " + lvl;
    $("home-xp-fill").style.width = Math.round((xpIntoLevel(profile.xp) / 250) * 100) + "%";
    const today = todayStr();
    const playedToday = profile.daily.lastDate === today;
    $("daily-sub").textContent = playedToday ? ("🔥 Streak: " + profile.daily.streak + " Tage") : "Jeden Tag 5 neue Fragen";
    renderProfileChip();
  }

  function todayStr() { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

  // ================= ONBOARDING =================
  let onboardingAvatar = AVATARS[0];
  function renderOnboardingAvatars() {
    const grid = $("onboarding-avatars");
    grid.innerHTML = "";
    AVATARS.forEach(a => {
      const b = el("button", "avatar-option" + (a === onboardingAvatar ? " selected" : ""), a);
      b.addEventListener("click", () => { onboardingAvatar = a; renderOnboardingAvatars(); });
      grid.appendChild(b);
    });
  }

  $("btn-onboarding-start").addEventListener("click", () => {
    ensureAudio();
    const name = $("onboarding-name").value.trim() || "Spieler";
    profile = defaultProfile();
    profile.name = name.slice(0, 16);
    profile.avatar = onboardingAvatar;
    saveProfile();
    renderHome();
    show("screen-home");
  });

  $("btn-edit-profile").addEventListener("click", () => {
    $("onboarding-name").value = profile.name;
    onboardingAvatar = profile.avatar;
    renderOnboardingAvatars();
    show("screen-onboarding");
  });

  // ================= SOUND TOGGLE =================
  function updateSoundBtn() { $("btn-sound").textContent = muted ? "🔇" : "🔊"; }
  $("btn-sound").addEventListener("click", () => {
    ensureAudio();
    muted = !muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    updateSoundBtn();
  });

  // ================= HOME MODE SELECTION =================
  let pendingMode = null;
  document.querySelectorAll(".mode-card").forEach(btn => {
    btn.addEventListener("click", () => {
      ensureAudio(); sfx.click();
      pendingMode = btn.dataset.mode;
      if (pendingMode === "solo") { renderSoloSetup(); show("screen-solo-setup"); }
      else if (pendingMode === "pvp" || pendingMode === "bot") { renderDuellSetup(pendingMode); show("screen-duell-setup"); }
      else if (pendingMode === "daily") { renderDailyIntro(); show("screen-daily-intro"); }
    });
  });

  document.querySelectorAll(".back-btn").forEach(b => b.addEventListener("click", () => { renderHome(); show("screen-home"); }));
  $("btn-achievements").addEventListener("click", () => { renderAchievements(); show("screen-achievements"); });
  $("btn-stats").addEventListener("click", () => { renderStats(); show("screen-stats"); });

  // ================= SOLO SETUP =================
  let soloCategory = "mix";
  let soloLength = "standard";
  let soloDifficulty = "mixed";
  function renderSoloSetup() {
    const grid = $("solo-category-grid");
    grid.innerHTML = "";
    const mixTile = el("button", "cat-tile" + (soloCategory === "mix" ? " selected" : ""), '<span class="cat-emoji">🔀</span><span>Mix</span>');
    mixTile.addEventListener("click", () => { soloCategory = "mix"; renderSoloSetup(); });
    grid.appendChild(mixTile);
    CATEGORIES.forEach(c => {
      const t = el("button", "cat-tile" + (soloCategory === c.id ? " selected" : ""), `<span class="cat-emoji">${c.emoji}</span><span>${c.name}</span>`);
      t.addEventListener("click", () => { soloCategory = c.id; renderSoloSetup(); });
      grid.appendChild(t);
    });
    const chips = $("solo-length-chips");
    chips.innerHTML = "";
    LENGTH_OPTIONS.forEach(o => {
      const c = el("button", "chip" + (soloLength === o.id ? " selected" : ""), o.label);
      c.addEventListener("click", () => { soloLength = o.id; renderSoloSetup(); });
      chips.appendChild(c);
    });
    const diffChips = $("solo-difficulty-chips");
    diffChips.innerHTML = "";
    QUESTION_DIFFICULTY_MODES.forEach(o => {
      const c = el("button", "chip" + (soloDifficulty === o.id ? " selected" : ""), o.label);
      c.addEventListener("click", () => { soloDifficulty = o.id; renderSoloSetup(); });
      diffChips.appendChild(c);
    });
  }
  $("btn-solo-start").addEventListener("click", () => { startSoloMatch(soloCategory, LENGTH_OPTIONS.find(o => o.id === soloLength).rounds, soloDifficulty); });

  // ================= DUELL SETUP =================
  let duellLength = "standard";
  let botDifficulty = "medium";
  let duellDifficulty = "mixed";
  function renderDuellSetup(mode) {
    $("duell-setup-title").textContent = mode === "bot" ? "🤖 Duell vs. Bot" : "⚔️ Duell (2 Spieler)";
    $("duell-player2-wrap").hidden = mode === "bot";
    $("bot-difficulty-wrap").hidden = mode !== "bot";
    if (!$("duell-player2-name").value) $("duell-player2-name").value = "Spieler 2";
    const bd = $("bot-difficulty-chips");
    bd.innerHTML = "";
    BOT_DIFFICULTIES.forEach(o => {
      const c = el("button", "chip" + (botDifficulty === o.id ? " selected" : ""), o.label);
      c.addEventListener("click", () => { botDifficulty = o.id; renderDuellSetup(mode); });
      bd.appendChild(c);
    });
    const lc = $("duell-length-chips");
    lc.innerHTML = "";
    LENGTH_OPTIONS.forEach(o => {
      const c = el("button", "chip" + (duellLength === o.id ? " selected" : ""), o.label);
      c.addEventListener("click", () => { duellLength = o.id; renderDuellSetup(mode); });
      lc.appendChild(c);
    });
    const diffChips = $("duell-difficulty-chips");
    diffChips.innerHTML = "";
    QUESTION_DIFFICULTY_MODES.forEach(o => {
      const c = el("button", "chip" + (duellDifficulty === o.id ? " selected" : ""), o.label);
      c.addEventListener("click", () => { duellDifficulty = o.id; renderDuellSetup(mode); });
      diffChips.appendChild(c);
    });
  }
  $("btn-duell-start").addEventListener("click", () => {
    const rounds = LENGTH_OPTIONS.find(o => o.id === duellLength).rounds;
    if (pendingMode === "bot") startDuellMatch("bot", rounds, botDifficulty, null, duellDifficulty);
    else startDuellMatch("pvp", rounds, null, ($("duell-player2-name").value.trim() || "Spieler 2").slice(0, 16), duellDifficulty);
  });

  // ================= START MATCHES =================
  function startSoloMatch(catId, rounds, difficultyMode) {
    M = {
      mode: "solo", players: [newPlayer(profile.name, profile.avatar, false)],
      totalRounds: rounds, roundIndex: 0, usedQuestionIds: new Set(),
      soloLives: 3, soloCategory: catId, difficultyMode: difficultyMode || "mixed",
      session: { fastAnswers: 0, categoryStats: {} },
    };
    nextSoloQuestion();
  }

  function startDuellMatch(kind, rounds, botDiff, player2Name, difficultyMode) {
    const p0 = newPlayer(profile.name, profile.avatar, false);
    const p1 = kind === "bot" ? newPlayer("Bot", "🤖", true) : newPlayer(player2Name, pickOtherAvatar(), false);
    M = {
      mode: kind, players: [p0, p1], botDifficulty: botDiff, difficultyMode: difficultyMode || "mixed",
      totalRounds: rounds, roundsPlayed: 0, usedQuestionIds: new Set(),
      usedCategories: [], blockedCategories: [],
      pickerIndex: 0, isSuddenDeath: false,
      session: { fastAnswers: 0, categoryStats: {} },
    };
    startCategoryBlockPhase();
  }

  function pickOtherAvatar() { const opts = AVATARS.filter(a => a !== profile.avatar); return opts[Math.floor(Math.random() * opts.length)]; }

  // ================= DAILY =================
  function seededRandom(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function hashStr(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; } return Math.abs(h) || 1; }

  function renderDailyIntro() {
    const today = todayStr();
    const already = profile.daily.lastDate === today;
    $("daily-already-msg").hidden = !already;
    $("btn-daily-start").hidden = already;
    $("daily-streak-display").textContent = "🔥 Aktuelle Streak: " + profile.daily.streak + " Tage · Beste: " + profile.daily.bestStreak;
  }
  $("btn-daily-start").addEventListener("click", () => startDailyMatch());

  function startDailyMatch() {
    const seed = hashStr(todayStr());
    const rand = seededRandom(seed);
    const shuffled = QUESTIONS.slice().sort(() => rand() - 0.5);
    const dailyQs = shuffled.slice(0, 5);
    M = {
      mode: "daily", players: [newPlayer(profile.name, profile.avatar, false)],
      totalRounds: 5, roundIndex: 0, usedQuestionIds: new Set(),
      dailyQuestions: dailyQs, session: { fastAnswers: 0, categoryStats: {} },
    };
    nextDailyQuestion();
  }

  function nextDailyQuestion() {
    if (M.roundIndex >= M.totalRounds) { finishDaily(); return; }
    const q = M.dailyQuestions[M.roundIndex];
    askQuestion(q, { playerIndex: 0, showBadgePlayer: false, onDone: onDailyAnswered });
  }
  function onDailyAnswered() {
    M.roundIndex++;
    nextDailyQuestion();
  }

  function finishDaily() {
    const today = todayStr();
    const wasYesterday = profile.daily.lastDate === yesterdayStr();
    profile.daily.streak = wasYesterday ? profile.daily.streak + 1 : 1;
    profile.daily.bestStreak = Math.max(profile.daily.bestStreak, profile.daily.streak);
    profile.daily.lastDate = today;
    mergeSessionIntoProfile(M.players[0]);
    profile.stats.gamesPlayed++;
    const xpGain = Math.round(M.players[0].score / 15) + 15;
    profile.xp += xpGain;
    const newAch = checkAchievements();
    saveProfile();
    showSummary({
      title: "Tages-Challenge geschafft!", emoji: "📅",
      scores: [{ name: profile.name, score: M.players[0].score, winner: true }],
      xpGain, achievements: newAch, replay: () => { renderDailyIntro(); show("screen-daily-intro"); },
    });
  }

  // ================= SOLO FLOW =================
  function nextSoloQuestion() {
    if (M.roundIndex >= M.totalRounds || M.soloLives <= 0) { finishSolo(); return; }
    const catId = M.soloCategory === "mix" ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].id : M.soloCategory;
    const q = pickQuestion(catId, M.roundIndex, M.totalRounds);
    askQuestion(q, { playerIndex: 0, showBadgePlayer: false, extraInfo: "❤️".repeat(M.soloLives), onDone: onSoloAnswered });
  }
  function onSoloAnswered(wasCorrect) {
    M.roundIndex++;
    if (!wasCorrect) M.soloLives--;
    nextSoloQuestion();
  }
  function finishSolo() {
    mergeSessionIntoProfile(M.players[0]);
    profile.stats.gamesPlayed++;
    const p = M.players[0];
    const isPerfect = p.totalCount >= 6 && p.correctCount === p.totalCount;
    if (isPerfect) profile.stats.perfectGames++;
    const xpGain = Math.round(p.score / 20) + (isPerfect ? 20 : 0);
    profile.xp += xpGain;
    const newAch = checkAchievements();
    saveProfile();
    showSummary({
      title: M.soloLives <= 0 ? "Game Over!" : "Training beendet!", emoji: M.soloLives <= 0 ? "💀" : "🎯",
      scores: [{ name: profile.name, score: p.score, winner: true }],
      xpGain, achievements: newAch, replay: () => startSoloMatch(M.soloCategory, M.totalRounds),
    });
  }

  // ================= DUELL FLOW (pvp / bot) =================
  function startCategoryBlockPhase() {
    M.blockedCategories = [];
    showCategoryBlockScreen(0);
  }

  function showCategoryBlockScreen(playerIndex) {
    const player = M.players[playerIndex];
    $("block-turn-banner").textContent = player.isBot ? "🤖 Bot sperrt eine Kategorie für dich..." : `${player.name}: Sperre eine Kategorie für den Gegner!`;
    const grid = $("block-category-grid");
    grid.innerHTML = "";
    CATEGORIES.forEach(c => {
      const blocked = M.blockedCategories.includes(c.id);
      const t = el("button", "cat-tile" + (blocked ? " blocked" : ""), `<span class="cat-emoji">${c.emoji}</span><span>${c.name}</span>`);
      t.disabled = blocked || player.isBot;
      if (!blocked && !player.isBot) t.addEventListener("click", () => confirmBlock(playerIndex, c.id));
      grid.appendChild(t);
    });
    show("screen-category-block");

    if (player.isBot) {
      setTimeout(() => {
        const avail = CATEGORIES.map(c => c.id).filter(id => !M.blockedCategories.includes(id));
        const chosen = avail[Math.floor(Math.random() * avail.length)];
        toast("🤖 Bot sperrt: " + CATEGORIES.find(c => c.id === chosen).name);
        setTimeout(() => confirmBlock(playerIndex, chosen), 700);
      }, 800);
    }
  }

  function confirmBlock(playerIndex, catId) {
    M.blockedCategories.push(catId);
    sfx.click();
    if (playerIndex === 0) {
      if (M.players[1].isBot) showCategoryBlockScreen(1);
      else showPassDevice(M.players[1].name, () => showCategoryBlockScreen(1));
    } else {
      toast("🚫 Gesperrt: " + M.blockedCategories.map(id => CATEGORIES.find(c => c.id === id).name).join(" & "));
      showBoard();
    }
  }

  function isDuellShowdownRound() {
    return (M.mode === "pvp" || M.mode === "bot") && !M.isSuddenDeath && M.roundsPlayed === M.totalRounds - 1;
  }

  function showBoard() {
    const sb = $("board-scoreboard");
    sb.innerHTML = "";
    M.players.forEach((p, i) => {
      const pill = el("div", "score-pill" + (M.pickerIndex === i ? " active" : ""));
      pill.innerHTML = `<div class="sp-name">${p.avatar} ${p.name}</div><div class="sp-score">${p.score}</div>`;
      sb.appendChild(pill);
    });
    const picker = M.players[M.pickerIndex];
    const showdownNote = isDuellShowdownRound() ? " 🔥 SHOWDOWN – doppelte Punkte!" : "";
    $("board-turn-banner").textContent = (M.isSuddenDeath ? "⚡ SUDDEN DEATH – Entscheidungsfrage!" : (picker.isBot ? "🤖 Bot wählt eine Kategorie..." : `${picker.name} ist dran – wähle eine Kategorie!`)) + showdownNote;

    const grid = $("board-category-grid");
    grid.innerHTML = "";
    CATEGORIES.forEach(c => {
      const blocked = M.blockedCategories.includes(c.id);
      const used = M.usedCategories.includes(c.id) && !M.isSuddenDeath;
      const unavailable = blocked || used;
      const t = el("button", "cat-tile" + (blocked ? " blocked" : used ? " used" : ""), `<span class="cat-emoji">${c.emoji}</span><span>${c.name}</span>`);
      if (!unavailable && !picker.isBot) t.addEventListener("click", () => choosePickCategory(c.id));
      t.disabled = unavailable || picker.isBot;
      grid.appendChild(t);
    });
    show("screen-board");

    if (picker.isBot) {
      setTimeout(() => {
        const avail = CATEGORIES.map(c => c.id).filter(id => !M.blockedCategories.includes(id) && (M.isSuddenDeath || !M.usedCategories.includes(id)));
        const chosen = avail[Math.floor(Math.random() * avail.length)];
        toast("🤖 Bot wählt: " + CATEGORIES.find(c => c.id === chosen).name);
        setTimeout(() => choosePickCategory(chosen), 700);
      }, 800);
    }
  }

  function choosePickCategory(catId) {
    if (!M.isSuddenDeath) M.usedCategories.push(catId);
    M.wasShowdownRound = isDuellShowdownRound();
    const q = pickQuestion(catId, M.roundsPlayed, M.totalRounds);
    M.currentRoundQuestion = q;
    M.roundResults = [];
    askDuellPlayer(0, q);
  }

  function askDuellPlayer(playerIndex, q) {
    const player = M.players[playerIndex];
    const goNext = () => {
      if (playerIndex === 0) {
        if (M.players[1].isBot) { showBotThinking(q); }
        else { showPassDevice(M.players[1].name, () => askQuestion(q, { playerIndex: 1, showBadgePlayer: true, onDone: () => onDuellPlayerDone() })); }
      } else {
        onDuellPlayerDone();
      }
    };
    askQuestion(q, { playerIndex, showBadgePlayer: true, onDone: goNext });
  }

  function showPassDevice(name, cb) {
    $("pass-device-text").textContent = "Gib das Gerät weiter an " + name;
    show("screen-pass-device");
    $("btn-pass-continue").onclick = () => { sfx.click(); cb(); };
  }

  function showBotThinking(q) {
    show("screen-bot-thinking");
    const thinkTime = 900 + Math.random() * 1200;
    setTimeout(() => {
      const res = simulateBotAnswer(q, M.botDifficulty);
      M.roundResults.push(res);
      onDuellPlayerDone();
    }, thinkTime);
  }

  function simulateBotAnswer(q, difficulty) {
    const accByDiff = {
      easy: { 1: 0.85, 2: 0.65, 3: 0.4, 4: 0.25 },
      medium: { 1: 0.92, 2: 0.8, 3: 0.6, 4: 0.4 },
      hard: { 1: 0.97, 2: 0.92, 3: 0.85, 4: 0.7 },
    }[difficulty];
    const correctChance = accByDiff[q.diff];
    const isCorrect = Math.random() < correctChance;
    const limit = TIME_BY_DIFF[q.diff];
    const speedFactor = { easy: 0.35, medium: 0.55, hard: 0.75 }[difficulty];
    const remaining = Math.max(1, limit * (speedFactor + Math.random() * 0.25));
    const player = M.players[1];
    let scoreInfo = { pts: 0, mult: 1 };
    if (isCorrect) {
      player.streak++; player.bestStreak = Math.max(player.bestStreak, player.streak);
      scoreInfo = computeScore(q, remaining, limit, player.streak);
      if (isDuellShowdownRound()) scoreInfo.pts *= 2;
      player.score += scoreInfo.pts; player.correctCount++;
    } else { player.streak = 0; }
    player.totalCount++;
    return { playerIndex: 1, correct: isCorrect, chosen: -1, pts: scoreInfo.pts, mult: scoreInfo.mult, ratio: remaining / limit };
  }

  function onDuellPlayerDone() {
    M.roundsPlayed++;
    revealDuellResults();
  }

  function revealDuellResults() {
    const q = M.currentRoundQuestion;
    const results = M.roundResults;
    const p0 = M.players[0], p1 = M.players[1];
    const r0 = results.find(r => r.playerIndex === 0);
    const r1 = results.find(r => r.playerIndex === 1);
    $("reveal-icon").textContent = "📊";
    $("reveal-title").textContent = "Runde beendet!";
    $("reveal-answer").textContent = "Richtige Antwort: " + q.options[q.correct];
    $("reveal-fact").textContent = q.fact || "";
    let pointsHtml = `<div>${p0.avatar} ${p0.name}: ${r0.correct ? "✅ +" + r0.pts : "❌ +0"}</div>`;
    pointsHtml += `<div>${p1.avatar} ${p1.name}: ${r1.correct ? "✅ +" + r1.pts : "❌ +0"}</div>`;
    if (M.wasShowdownRound) pointsHtml += `<div>🔥 Showdown-Runde – Punkte verdoppelt!</div>`;
    $("reveal-points").innerHTML = pointsHtml;
    (r0.correct || r1.correct) ? sfx.correct() : sfx.wrong();
    $("btn-reveal-continue").onclick = () => { sfx.click(); afterDuellReveal(); };
    show("screen-reveal");
  }

  function afterDuellReveal() {
    if (M.isSuddenDeath) {
      const p0 = M.players[0], p1 = M.players[1];
      if (p0.score !== p1.score) { finishDuell(); return; }
      toast("⚡ Unentschieden – noch eine Runde!");
      M.pickerIndex = Math.floor(Math.random() * 2);
      showBoard();
      return;
    }
    M.pickerIndex = 1 - M.pickerIndex;
    const boardExhausted = M.usedCategories.length >= (CATEGORIES.length - M.blockedCategories.length);
    if (M.roundsPlayed >= M.totalRounds || boardExhausted) {
      const p0 = M.players[0], p1 = M.players[1];
      if (p0.score === p1.score) {
        toast("⚡ Unentschieden! Sudden Death entscheidet...");
        M.isSuddenDeath = true;
        M.pickerIndex = Math.floor(Math.random() * 2);
        showBoard();
      } else { finishDuell(); }
    } else { showBoard(); }
  }

  function finishDuell() {
    const p0 = M.players[0], p1 = M.players[1];
    const humanWon = p0.score > p1.score;
    mergeSessionIntoProfile(p0);
    profile.stats.gamesPlayed++;
    if (humanWon) {
      profile.stats.wins++;
      if (!p0.usedAnyJoker) profile.stats.jokerlessWins++;
      if (M.isSuddenDeath) profile.stats.suddenDeathWins++;
    }
    const isPerfect = p0.totalCount >= 6 && p0.correctCount === p0.totalCount;
    if (isPerfect) profile.stats.perfectGames++;
    const xpGain = Math.round(p0.score / 20) + (humanWon ? 30 : 5) + (isPerfect ? 20 : 0);
    profile.xp += xpGain;
    const newAch = checkAchievements();
    saveProfile();
    if (humanWon) { confettiBurst(50); sfx.win(); }
    showSummary({
      title: humanWon ? "Du hast gewonnen! 🎉" : (p0.score === p1.score ? "Unentschieden!" : p1.name + " gewinnt!"),
      emoji: humanWon ? "🏆" : "🤝",
      scores: [
        { name: p0.name + " " + p0.avatar, score: p0.score, winner: humanWon },
        { name: p1.name + " " + p1.avatar, score: p1.score, winner: !humanWon },
      ],
      xpGain, achievements: newAch,
      replay: () => { pendingMode === "bot" ? renderDuellSetup("bot") : renderDuellSetup("pvp"); show("screen-duell-setup"); },
    });
  }

  // ================= SHARED QUESTION SCREEN =================
  let currentTimerCtrl = null;
  function askQuestion(q, opts) {
    const playerIndex = opts.playerIndex;
    const player = M.players[playerIndex];
    const cat = CATEGORIES.find(c => c.id === q.cat);
    $("q-cat-badge").textContent = cat.emoji + " " + cat.name;
    $("q-diff-badge").textContent = DIFF_LABEL[q.diff];
    $("q-player-badge").textContent = opts.showBadgePlayer ? (player.avatar + " " + player.name) : (opts.extraInfo || "");
    $("q-player-badge").style.visibility = (opts.showBadgePlayer || opts.extraInfo) ? "visible" : "hidden";
    $("question-text").textContent = q.q;
    $("audience-panel").hidden = true;
    $("audience-panel").innerHTML = "";

    const answersGrid = $("answers-grid");
    answersGrid.innerHTML = "";
    const letters = ["A", "B", "C", "D"];
    let answered = false;
    const order = shuffleArr([0, 1, 2, 3]);
    const posOfOrig = [];
    order.forEach((origIdx, pos) => { posOfOrig[origIdx] = pos; });
    const btns = order.map((origIdx, pos) => {
      const b = el("button", "answer-btn", `<span class="opt-letter">${letters[pos]}</span><span>${q.options[origIdx]}</span>`);
      b.addEventListener("click", () => submitAnswer(origIdx));
      answersGrid.appendChild(b);
      return b;
    });

    const limit = TIME_BY_DIFF[q.diff];
    const jr = $("joker-row");
    jr.innerHTML = "";
    const jokerDefs = [
      { key: "fifty", emoji: "➗", label: "50:50" },
      { key: "audience", emoji: "👥", label: "Publikum" },
      { key: "freeze", emoji: "❄️", label: "+7 Sek" },
    ];
    jokerDefs.forEach(jd => {
      const available = player.jokers[jd.key];
      const b = el("button", "joker-btn", `<span class="joker-emoji">${jd.emoji}</span><span>${jd.label}</span>`);
      b.disabled = !available;
      b.addEventListener("click", () => useJoker(jd.key, q, btns, player, b, posOfOrig));
      jr.appendChild(b);
    });

    function submitAnswer(idx) {
      if (answered) return;
      answered = true;
      currentTimerCtrl.stop();
      btns.forEach(b => (b.disabled = true));
      const remaining = currentTimerCtrl.getRemaining();
      const isCorrect = idx === q.correct;
      btns[posOfOrig[q.correct]].classList.add("correct");
      if (!isCorrect && idx >= 0) btns[posOfOrig[idx]].classList.add("wrong");
      finalizeAnswer(q, playerIndex, isCorrect, remaining, limit, idx, opts);
    }

    currentTimerCtrl = createTimer(limit, (remaining, lim) => {
      const pct = Math.max(0, (remaining / lim) * 100);
      $("timer-fill").style.width = pct + "%";
      $("timer-fill").classList.toggle("warn", pct <= 50 && pct > 20);
      $("timer-fill").classList.toggle("danger", pct <= 20);
      $("timer-num").textContent = Math.ceil(remaining);
      if (remaining <= 5 && remaining > 0 && Math.abs(remaining - Math.floor(remaining)) < 0.15) sfx.tick();
    }, () => { if (!answered) submitAnswer(-1); });

    show("screen-question");
  }

  function useJoker(key, q, btns, player, btnEl, posOfOrig) {
    if (!player.jokers[key]) return;
    player.jokers[key] = false;
    player.usedAnyJoker = true;
    sfx.joker();
    btnEl.disabled = true;
    if (key === "freeze") { currentTimerCtrl.addTime(7); toast("❄️ +7 Sekunden!"); }
    else if (key === "fifty") {
      const wrongIdx = q.options.map((_, i) => i).filter(i => i !== q.correct);
      wrongIdx.sort(() => Math.random() - 0.5);
      wrongIdx.slice(0, 2).forEach(i => { btns[posOfOrig[i]].classList.add("eliminated"); btns[posOfOrig[i]].disabled = true; });
      toast("➗ Zwei falsche Antworten entfernt!");
    } else if (key === "audience") {
      let correctPct = 50 + Math.round(Math.random() * 35);
      const rest = 100 - correctPct;
      const others = q.options.map((_, i) => i).filter(i => i !== q.correct && !btns[posOfOrig[i]].classList.contains("eliminated"));
      const shares = splitRandom(rest, others.length || 1);
      const panel = $("audience-panel");
      panel.hidden = false;
      panel.innerHTML = "";
      const letters = ["A", "B", "C", "D"];
      const orderedIdx = posOfOrig.map((pos, origIdx) => origIdx).sort((a, b) => posOfOrig[a] - posOfOrig[b]);
      orderedIdx.forEach(i => {
        if (btns[posOfOrig[i]].classList.contains("eliminated")) return;
        const pct = i === q.correct ? correctPct : shares.pop();
        const row = el("div", "audience-bar-row");
        row.innerHTML = `<span>${letters[posOfOrig[i]]}</span><div class="audience-bar-track"><div class="audience-bar-fill" style="width:${pct}%"></div></div><span class="audience-pct">${pct}%</span>`;
        panel.appendChild(row);
      });
    }
  }
  function shuffleArr(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function splitRandom(total, parts) {
    if (parts <= 0) return [];
    const cuts = [];
    for (let i = 0; i < parts; i++) cuts.push(Math.random());
    const sum = cuts.reduce((a, b) => a + b, 0);
    return cuts.map(c => Math.round((c / sum) * total));
  }

  function finalizeAnswer(q, playerIndex, isCorrect, remaining, limit, chosenIdx, opts) {
    const player = M.players[playerIndex];
    let scoreInfo = { pts: 0, mult: 1, ratio: remaining / limit };
    if (isCorrect) {
      player.streak++; player.bestStreak = Math.max(player.bestStreak, player.streak);
      scoreInfo = computeScore(q, remaining, limit, player.streak);
      if ((M.mode === "pvp" || M.mode === "bot") && isDuellShowdownRound()) scoreInfo.pts *= 2;
      player.score += scoreInfo.pts;
      player.correctCount++;
      sfx.correct();
    } else {
      player.streak = 0;
      sfx.wrong();
    }
    player.totalCount++;

    if (playerIndex === 0) {
      const cs = M.session.categoryStats[q.cat] || { correct: 0, total: 0 };
      cs.total++; if (isCorrect) cs.correct++;
      M.session.categoryStats[q.cat] = cs;
      if (isCorrect && scoreInfo.ratio > 0.8) M.session.fastAnswers++;
    }

    if (M.mode === "solo" || M.mode === "daily") {
      showSoloReveal(q, isCorrect, scoreInfo, player, opts.onDone, isCorrect);
    } else {
      M.roundResults.push({ playerIndex, correct: isCorrect, chosen: chosenIdx, pts: scoreInfo.pts, mult: scoreInfo.mult, ratio: scoreInfo.ratio });
      opts.onDone(isCorrect);
    }
  }

  function showSoloReveal(q, isCorrect, scoreInfo, player, onDone) {
    $("reveal-icon").textContent = isCorrect ? "✅" : "❌";
    $("reveal-title").textContent = isCorrect ? "Richtig!" : "Leider falsch!";
    $("reveal-answer").textContent = "Richtige Antwort: " + q.options[q.correct];
    $("reveal-fact").textContent = q.fact || "";
    let pointsTxt = isCorrect ? "+" + scoreInfo.pts + " Punkte" : "+0 Punkte";
    if (isCorrect && scoreInfo.mult > 1) pointsTxt += " (x" + scoreInfo.mult + " Streak-Bonus!)";
    if (M.mode === "solo") pointsTxt += " · ❤️ " + M.soloLives;
    $("reveal-points").textContent = pointsTxt;
    $("btn-reveal-continue").onclick = () => { sfx.click(); onDone(isCorrect); };
    show("screen-reveal");
  }

  // ================= SUMMARY =================
  function showSummary(cfg) {
    $("summary-emoji").textContent = cfg.emoji;
    $("summary-title").textContent = cfg.title;
    const sc = $("summary-scores");
    sc.innerHTML = "";
    cfg.scores.forEach(s => {
      const item = el("div", "summary-score-item" + (s.winner ? " winner" : ""));
      item.innerHTML = `<div class="ssi-name">${s.name}</div><div class="ssi-score">${s.score}</div>`;
      sc.appendChild(item);
    });
    $("summary-xp").textContent = "+" + cfg.xpGain + " XP verdient · Level " + levelForXp(profile.xp);
    const ach = $("summary-achievements");
    ach.innerHTML = "";
    (cfg.achievements || []).forEach(a => {
      const t = el("div", "achievement-toast", `<span style="font-size:1.4rem">${a.emoji}</span><div><b>${a.title}</b> freigeschaltet!<br><span class="muted">${a.desc}</span></div>`);
      ach.appendChild(t);
    });
    $("btn-summary-home").onclick = () => { renderHome(); show("screen-home"); };
    $("btn-summary-again").onclick = cfg.replay;
    show("screen-summary");
  }

  function mergeSessionIntoProfile(player) {
    profile.stats.fastAnswers += M.session.fastAnswers;
    profile.stats.bestStreak = Math.max(profile.stats.bestStreak, player.bestStreak);
    Object.keys(M.session.categoryStats).forEach(catId => {
      const cur = profile.stats.categoryStats[catId] || { correct: 0, total: 0 };
      cur.correct += M.session.categoryStats[catId].correct;
      cur.total += M.session.categoryStats[catId].total;
      profile.stats.categoryStats[catId] = cur;
    });
  }

  function checkAchievements() {
    const newly = [];
    ACHIEVEMENTS.forEach(a => {
      if (profile.achievementsUnlocked.includes(a.id)) return;
      if (a.check(profile)) { profile.achievementsUnlocked.push(a.id); profile.xp += 15; newly.push(a); }
    });
    return newly;
  }

  // ================= ACHIEVEMENTS / STATS SCREENS =================
  function renderAchievements() {
    const grid = $("achievements-grid");
    grid.innerHTML = "";
    ACHIEVEMENTS.forEach(a => {
      const unlocked = profile.achievementsUnlocked.includes(a.id);
      const card = el("div", "achievement-card" + (unlocked ? "" : " locked"));
      card.innerHTML = `<span class="ac-emoji">${a.emoji}</span><div><div class="ac-title">${a.title}</div><div class="ac-desc">${a.desc}</div></div>`;
      grid.appendChild(card);
    });
  }

  function renderStats() {
    const s = profile.stats;
    const grid = $("stats-grid");
    grid.innerHTML = "";
    const boxes = [
      ["Matches", s.gamesPlayed], ["Siege", s.wins], ["Bester Streak", s.bestStreak],
      ["Level", levelForXp(profile.xp)], ["Tages-Streak", profile.daily.streak], ["Erfolge", profile.achievementsUnlocked.length + "/" + ACHIEVEMENTS.length],
    ];
    boxes.forEach(([label, num]) => {
      const b = el("div", "stat-box", `<div class="stat-num">${num}</div><div class="stat-label">${label}</div>`);
      grid.appendChild(b);
    });
    const catWrap = $("cat-stats");
    catWrap.innerHTML = "";
    CATEGORIES.forEach(c => {
      const cs = s.categoryStats[c.id] || { correct: 0, total: 0 };
      const pct = cs.total ? Math.round((cs.correct / cs.total) * 100) : 0;
      const row = el("div", "cat-stat-row");
      row.innerHTML = `<span class="cs-name">${c.emoji} ${c.name}</span><div class="cs-track"><div class="cs-fill" style="width:${pct}%;background:${c.color}"></div></div><span class="cs-pct">${pct}%</span>`;
      catWrap.appendChild(row);
    });
  }

  // ================= INIT =================
  updateSoundBtn();
  if (profile && profile.name) { renderHome(); show("screen-home"); }
  else { renderOnboardingAvatars(); show("screen-onboarding"); }
})();
