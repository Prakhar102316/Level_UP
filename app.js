const quests = [
  { id: "gym", title: "Gym Check-In", xp: 100, stat: "strength" },
  { id: "workout", title: "Complete Workout", xp: 120, stat: "strength" },
  { id: "meal", title: "Healthy Meal", xp: 40, stat: "health" },
  { id: "water", title: "Drink 3L Water", xp: 30, stat: "discipline" },
  { id: "steps", title: "Walk 8000 Steps", xp: 60, stat: "consistency" },
  { id: "sleep", title: "Sleep 8 Hours", xp: 50, stat: "health" }
];

const questDifficulty = {
  easy: { label: "Easy", xp: 20 },
  medium: { label: "Medium", xp: 50 },
  hard: { label: "Hard", xp: 100 }
};

const ranks = [
  { name: "Sunday League", level: 1 },
  { name: "District Player", level: 5 },
  { name: "Academy Player", level: 10 },
  { name: "Semi-Pro", level: 15 },
  { name: "Professional", level: 22 },
  { name: "National Team", level: 30 },
  { name: "Legend", level: 40 }
];

const titles = [
  { id: "rookie", label: "Rookie", test: () => true },
  { id: "boss_slayer", label: "Boss Slayer", test: (s) => s.weeklyBossDamage >= 100 },
  { id: "the_grinder", label: "The Grinder", test: (s) => s.streak >= 7 },
  { id: "iron_mind", label: "Iron Mind", test: (s) => s.stats.discipline >= 60 },
  { id: "protein_king", label: "Protein King", test: (s) => s.meals.length >= 20 },
  { id: "barbell_knight", label: "Barbell Knight", test: (s) => s.workouts.length >= 20 }
];

const achievements = [
  { id: "first_xp", title: "First XP", text: "Earn your first XP.", test: (s) => s.totalXp > 0 },
  { id: "quest_complete", title: "Quest Complete", text: "Finish every quest in one day.", test: (s) => getQuestList(s).every((q) => s.completed[q.id]) },
  { id: "gym_hero", title: "Gym Hero", text: "Complete 10 gym check-ins.", test: (s) => s.lifetime.gym >= 10 },
  { id: "water_warrior", title: "Water Warrior", text: "Hit your water goal 7 times.", test: (s) => s.lifetime.water >= 7 },
  { id: "streak_7", title: "7 Day Flame", text: "Build a 7-day streak.", test: (s) => s.streak >= 7 },
  { id: "protein_king", title: "Protein King", text: "Log 20 meals.", test: (s) => s.meals.length >= 20 },
  { id: "iron_log", title: "Iron Log", text: "Log 10 workout entries.", test: (s) => s.workouts.length >= 10 },
  { id: "quest_builder", title: "Quest Builder", text: "Create your first custom quest.", test: (s) => s.customQuests.length > 0 }
];

const statColors = {
  health: "#00a676",
  strength: "#e4572e",
  discipline: "#f4b400",
  knowledge: "#2e86ab",
  consistency: "#6c63ff"
};

const defaultState = {
  name: "Partner",
  totalXp: 0,
  todayXp: 0,
  completed: {},
  waterMl: 0,
  streak: 0,
  meals: [],
  workouts: [],
  moods: {},
  customQuests: [],
  history: {},
  previousState: null,
  currentDate: todayKey(),
  currentWeek: weekKey(),
  weeklyBossDamage: 0,
  activeTitle: "rookie",
  stats: {
    health: 20,
    strength: 20,
    discipline: 20,
    knowledge: 12,
    consistency: 20
  },
  lifetime: {
    gym: 0,
    workout: 0,
    meal: 0,
    water: 0,
    steps: 0,
    sleep: 0
  }
};

const storageKey = "level-up-pwa-save";
let state = loadState();
let deferredInstallPrompt = null;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weekKey(date = new Date()) {
  const weekDate = new Date(date);
  const day = weekDate.getDay() || 7;
  weekDate.setDate(weekDate.getDate() + 4 - day);
  const yearStart = new Date(weekDate.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((weekDate - yearStart) / 86400000) + 1) / 7);
  return `${weekDate.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  const parsed = saved ? JSON.parse(saved) : {};
  const loaded = {
    ...structuredClone(defaultState),
    ...parsed,
    stats: { ...structuredClone(defaultState.stats), ...parsed.stats },
    lifetime: { ...structuredClone(defaultState.lifetime), ...parsed.lifetime }
  };
  return syncCalendar(loaded);
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getQuestList(sourceState = state) {
  return [...quests, ...(sourceState.customQuests || [])];
}

function xpForLevel(level) {
  return level * 500;
}

function getLevel() {
  let level = 1;
  let remaining = state.totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, current: remaining, next: xpForLevel(level), progress: remaining / xpForLevel(level) };
}

function getRank(level) {
  return ranks.reduce((current, rank) => level >= rank.level ? rank : current, ranks[0]).name;
}

function addXp(xp) {
  const key = todayKey();
  state.totalXp = Math.max(0, state.totalXp + xp);
  state.todayXp = Math.max(0, state.todayXp + xp);
  state.history[key] = Math.max(0, (state.history[key] || 0) + xp);
}

function boostStat(stat, amount) {
  state.stats[stat] = Math.max(0, Math.min(100, state.stats[stat] + amount));
}

function finishDay(targetState, saveUndo) {
  const completedAny = Object.values(targetState.completed).some(Boolean);
  const nextState = saveUndo ? structuredClone(targetState) : null;

  targetState.streak = completedAny ? targetState.streak + 1 : Math.max(0, targetState.streak - 1);
  targetState.todayXp = 0;
  targetState.waterMl = 0;
  targetState.completed = {};
  targetState.currentDate = todayKey();

  if (saveUndo) {
    targetState.previousState = nextState;
  }
}

function syncCalendar(targetState) {
  const today = todayKey();
  const thisWeek = weekKey();

  if (!targetState.currentDate) {
    targetState.currentDate = today;
  }

  if (!targetState.currentWeek) {
    targetState.currentWeek = thisWeek;
  }

  if (targetState.currentDate !== today) {
    finishDay(targetState, false);
    targetState.previousState = null;
  }

  if (targetState.currentWeek !== thisWeek) {
    targetState.currentWeek = thisWeek;
    targetState.weeklyBossDamage = 0;
  }

  return targetState;
}

function render() {
  syncCalendar(state);
  const levelInfo = getLevel();
  const rank = getRank(levelInfo.level);
  const earned = achievements.filter((badge) => badge.test(state));
  const activeTitle = titles.find((title) => title.id === state.activeTitle && title.test(state)) || titles[0];

  state.activeTitle = activeTitle.id;
  setText("playerName", state.name);
  setText("rankLine", `Level ${levelInfo.level} - ${rank} - ${activeTitle.label}`);
  setText("levelNumber", levelInfo.level);
  setText("xpLabel", `${levelInfo.current} / ${levelInfo.next}`);
  setWidth("xpBar", levelInfo.progress);
  setText("totalXp", state.totalXp);
  setText("streak", state.streak);
  setText("todayXp", state.todayXp);
  setText("badgeCount", earned.length);
  setText("questCount", `${getQuestList().filter((q) => state.completed[q.id]).length} / ${getQuestList().length}`);

  renderQuests();
  renderStats();
  renderMeals();
  renderWorkouts();
  renderMood();
  renderProgress();
  renderBadges();
  renderTitles();
  renderSeason();
  renderBoss();
  renderWater();
  document.querySelector("#nameInput").value = state.name;
  saveState();
}

function renderQuests() {
  const list = document.querySelector("#questList");
  list.innerHTML = "";
  getQuestList().forEach((quest) => {
    const button = document.createElement("button");
    button.className = `quest-item ${state.completed[quest.id] ? "complete" : ""}`;
    button.innerHTML = `
      <span class="check">${state.completed[quest.id] ? "✓" : ""}</span>
      <span>
        <strong>${quest.title}</strong><br />
        <span class="quest-meta">+${quest.xp} XP - ${quest.stat}${quest.custom ? " - custom" : ""}</span>
      </span>
    `;
    button.addEventListener("click", () => toggleQuest(quest));
    list.appendChild(button);
  });
}

function toggleQuest(quest) {
  syncCalendar(state);
  const complete = Boolean(state.completed[quest.id]);
  state.completed[quest.id] = !complete;
  addXp(complete ? -quest.xp : quest.xp);
  boostStat(quest.stat, complete ? -4 : 4);
  state.lifetime[quest.id] = Math.max(0, (state.lifetime[quest.id] || 0) + (complete ? -1 : 1));
  if (quest.id === "gym") {
    state.weeklyBossDamage = Math.max(0, state.weeklyBossDamage + (complete ? -18 : 18));
  }
  render();
}

function renderStats() {
  const list = document.querySelector("#statList");
  list.innerHTML = "";
  Object.entries(state.stats).forEach(([stat, value]) => {
    const item = document.createElement("article");
    item.className = "stat-item";
    item.innerHTML = `
      <div class="stat-top"><span>${titleCase(stat)}</span><span>${value}/100</span></div>
      <div class="bar"><span style="width:${value}%; background:${statColors[stat]}"></span></div>
    `;
    list.appendChild(item);
  });
}

function renderWorkouts() {
  const list = document.querySelector("#workoutList");
  const count = document.querySelector("#workoutCount");
  if (!list || !count) return;

  count.textContent = `${state.workouts.length} entries`;
  list.innerHTML = "";
  if (!state.workouts.length) {
    list.innerHTML = `<article class="workout-item"><strong>No workouts yet</strong><p>Log your first exercise.</p></article>`;
    return;
  }

  state.workouts.slice(0, 14).forEach((workout) => {
    const item = document.createElement("article");
    item.className = "workout-item";
    item.innerHTML = `
      <div>
        <strong>${workout.exercise}</strong>
        <p>${workout.date}</p>
      </div>
      <strong>${workout.weight}kg - ${workout.sets}x${workout.reps}</strong>
    `;
    list.appendChild(item);
  });
}

function renderMood() {
  const mood = state.moods[todayKey()];
  const moodLabel = document.querySelector("#moodToday");
  if (moodLabel) {
    moodLabel.textContent = mood ? `Today's energy: ${mood}` : "No mood logged today.";
  }
}

function renderMeals() {
  const list = document.querySelector("#mealList");
  list.innerHTML = "";
  if (!state.meals.length) {
    list.innerHTML = `<article class="meal-item"><strong>No meals yet</strong><p>Log your first meal.</p></article>`;
    return;
  }
  state.meals.slice(0, 12).forEach((meal) => {
    const item = document.createElement("article");
    item.className = "meal-item";
    item.innerHTML = `<div><strong>${meal.name}</strong><p>${meal.date}</p></div><strong>${meal.calories} cal - ${meal.protein}g</strong>`;
    list.appendChild(item);
  });
}

function renderProgress() {
  const chart = document.querySelector("#chart");
  chart.innerHTML = "";
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return state.history[date.toISOString().slice(0, 10)] || 0;
  });
  const max = Math.max(120, ...days);
  days.forEach((xp) => {
    const bar = document.createElement("span");
    bar.style.height = `${Math.max(6, (xp / max) * 126)}px`;
    bar.style.opacity = xp ? "1" : "0.22";
    chart.appendChild(bar);
  });
}

function renderBadges() {
  const list = document.querySelector("#badgeList");
  list.innerHTML = "";
  achievements.forEach((badge) => {
    const earned = badge.test(state);
    const item = document.createElement("article");
    item.className = `badge-item ${earned ? "" : "locked"}`;
    item.innerHTML = `<div><strong>${earned ? "*" : "-"} ${badge.title}</strong><p>${badge.text}</p></div>`;
    list.appendChild(item);
  });
}

function renderTitles() {
  const list = document.querySelector("#titleList");
  if (!list) return;
  const active = titles.find((title) => title.id === state.activeTitle && title.test(state)) || titles[0];
  state.activeTitle = active.id;
  setText("activeTitle", active.label);
  list.innerHTML = "";

  titles.forEach((title) => {
    const unlocked = title.test(state);
    const button = document.createElement("button");
    button.className = `title-chip ${state.activeTitle === title.id ? "active" : ""}`;
    button.disabled = !unlocked;
    button.textContent = unlocked ? title.label : `Locked: ${title.label}`;
    button.addEventListener("click", () => {
      if (!unlocked) return;
      state.activeTitle = title.id;
      render();
    });
    list.appendChild(button);
  });
}

function renderSeason() {
  const now = new Date();
  const monthKey = todayKey().slice(0, 7);
  const monthName = now.toLocaleString("en", { month: "long", year: "numeric" });
  const seasonXp = Object.entries(state.history)
    .filter(([date]) => date.startsWith(monthKey))
    .reduce((sum, [, xp]) => sum + xp, 0);
  const seasonWorkouts = state.workouts.filter((item) => item.date.startsWith(monthKey)).length;
  const seasonMeals = state.meals.filter((item) => item.date.startsWith(monthKey)).length;
  const latestMood = Object.entries(state.moods)
    .filter(([date]) => date.startsWith(monthKey))
    .sort(([a], [b]) => b.localeCompare(a))[0]?.[1] || "-";

  setText("seasonName", `Season: ${monthName}`);
  setText("seasonXp", seasonXp);
  setText("seasonWorkouts", seasonWorkouts);
  setText("seasonMeals", seasonMeals);
  setText("seasonMood", latestMood);
}

function renderBoss() {
  const hp = Math.max(0, 100 - state.weeklyBossDamage);
  setText("bossHp", `${hp} HP`);
  setWidth("bossBar", hp / 100);
}

function renderWater() {
  setText("waterLabel", `${state.waterMl} / 3000 ml`);
  setWidth("waterBar", state.waterMl / 3000);
}

function setText(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) {
    element.textContent = value;
  }
}

function setWidth(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) {
    element.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  }
}

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function updateDayTimer() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const remaining = Math.max(0, midnight - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  setText(
    "dayTimer",
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  );
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab, .screen").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.screen}`).classList.add("active");
  });
});

document.querySelector("#newDayButton").addEventListener("click", () => {
  syncCalendar(state);
  const confirmed = confirm("Start a new day? Today's checked quests will be cleared.");
  if (!confirmed) return;

  finishDay(state, true);
  render();
});

document.querySelector("#customQuestForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#customQuestTitle").value.trim();
  const difficulty = document.querySelector("#customQuestDifficulty").value;
  if (!title) return;

  const reward = questDifficulty[difficulty] || questDifficulty.medium;
  state.customQuests.push({
    id: `custom_${Date.now()}`,
    title,
    xp: reward.xp,
    stat: "discipline",
    custom: true,
    difficulty
  });
  event.target.reset();
  document.querySelector("#customQuestDifficulty").value = "medium";
  render();
});

document.querySelector("#undoDayButton").addEventListener("click", () => {
  if (!state.previousState) {
    alert("There is no new day action to undo yet.");
    return;
  }

  state = structuredClone(state.previousState);
  state.previousState = null;
  render();
});

document.querySelector("#resetButton").addEventListener("click", () => {
  const confirmed = confirm("Reset all LEVEL UP progress? This cannot be undone.");
  if (!confirmed) return;

  state = structuredClone(defaultState);
  render();
});

document.querySelector("#saveNameButton").addEventListener("click", () => {
  state.name = document.querySelector("#nameInput").value.trim() || "Partner";
  render();
});

document.querySelector("#mealForm").addEventListener("submit", (event) => {
  event.preventDefault();
  syncCalendar(state);
  const name = document.querySelector("#mealName").value.trim();
  if (!name) return;
  state.meals.unshift({
    name,
    calories: Number(document.querySelector("#mealCalories").value) || 0,
    protein: Number(document.querySelector("#mealProtein").value) || 0,
    date: todayKey()
  });
  state.lifetime.meal += 1;
  addXp(40);
  boostStat("health", 3);
  boostStat("knowledge", 2);
  event.target.reset();
  render();
});

document.querySelector("#workoutForm").addEventListener("submit", (event) => {
  event.preventDefault();
  syncCalendar(state);
  const exercise = document.querySelector("#exerciseName").value.trim();
  if (!exercise) return;

  state.workouts.unshift({
    exercise,
    weight: Number(document.querySelector("#exerciseWeight").value) || 0,
    reps: Number(document.querySelector("#exerciseReps").value) || 0,
    sets: Number(document.querySelector("#exerciseSets").value) || 0,
    date: todayKey()
  });
  addXp(80);
  boostStat("strength", 4);
  boostStat("discipline", 2);
  event.target.reset();
  render();
});

document.querySelectorAll("[data-mood]").forEach((button) => {
  button.addEventListener("click", () => {
    syncCalendar(state);
    state.moods[todayKey()] = button.dataset.mood;
    if (button.dataset.mood === "Strong") {
      boostStat("consistency", 1);
    }
    render();
  });
});

document.querySelector("#water250").addEventListener("click", () => addWater(250));
document.querySelector("#water500").addEventListener("click", () => addWater(500));

function addWater(amount) {
  syncCalendar(state);
  const before = state.waterMl;
  state.waterMl = Math.min(5000, state.waterMl + amount);
  if (before < 3000 && state.waterMl >= 3000) {
    state.completed.water = true;
    state.lifetime.water += 1;
    addXp(30);
    boostStat("discipline", 3);
  }
  render();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.querySelector("#installButton").hidden = false;
});

document.querySelector("#installButton").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.querySelector("#installButton").hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}

setInterval(() => {
  const beforeDate = state.currentDate;
  const beforeWeek = state.currentWeek;
  syncCalendar(state);
  updateDayTimer();
  if (state.currentDate !== beforeDate || state.currentWeek !== beforeWeek) {
    render();
  }
}, 1000);

render();
updateDayTimer();
