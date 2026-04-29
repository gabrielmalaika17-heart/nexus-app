const categoryColors = {
  fitness: "#a6ff4d",
  travail: "#25f3ff",
  sommeil: "#b89cff",
  focus: "#ffd166",
  perso: "#ff7a59"
};

const storageKey = "nexus-pwa-state-v2";
let focusInterval;
let currentExercise = null;

const defaultTasks = [
  { id: "t-1", title: "Préparer le plan de cours", category: "travail", time: "09:00", done: true },
  { id: "t-2", title: "Séance force haut du corps", category: "fitness", time: "12:30", done: false },
  { id: "t-3", title: "Bloc focus réseaux sociaux", category: "focus", time: "14:00", done: true },
  { id: "t-4", title: "Révision du cahier des charges", category: "travail", time: "16:15", done: false },
  { id: "t-5", title: "Routine sommeil sans écran", category: "sommeil", time: "22:30", done: false }
];

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeExercise(name, place, level, primary, secondary, equipment, group, sets = "3-4", reps = "8-12", rest = "60-90 s") {
  const home = place === "maison";
  return {
    id: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-"),
    name,
    place,
    level,
    group,
    primary,
    secondary,
    equipment,
    sets,
    reps,
    rest,
    video: "Démonstration animée intégrée. Lien vidéo réel à connecter plus tard.",
    description: `${name} travaille surtout ${primary}. C'est un exercice ${level.toLowerCase()} adapté ${home ? "à la maison" : "à la salle"}.`,
    steps: [
      "Installe-toi dans une position stable, avec le dos neutre et le regard devant toi.",
      "Gaine le ventre avant de démarrer le mouvement.",
      "Effectue la phase descendante lentement, sans perdre le contrôle.",
      "Pousse ou tire jusqu'à la position finale en gardant les articulations alignées.",
      "Reviens au départ sans relâcher complètement la tension musculaire."
    ],
    breathing: "Inspire pendant la phase facile ou descendante, expire pendant l'effort principal.",
    mistakes: [
      "Aller trop vite et perdre le contrôle.",
      "Arrondir le dos ou casser l'alignement des genoux.",
      "Utiliser une charge trop lourde au détriment de la technique."
    ],
    safety: "Arrête si tu ressens une douleur vive. Commence léger, échauffe-toi et augmente progressivement.",
    easier: home ? "Réduire l'amplitude, ralentir le rythme ou faire moins de répétitions." : "Réduire la charge, utiliser une machine guidée ou diminuer l'amplitude.",
    harder: home ? "Ajouter un sac à dos, un élastique, un tempo lent ou plus de séries." : "Augmenter la charge, ajouter une pause ou ralentir la phase descendante."
  };
}

const exerciseLibrary = [
  makeExercise("Développé couché", "salle", "Intermédiaire", "pectoraux", "triceps, épaules", "banc + barre ou haltères", "Push"),
  makeExercise("Squat", "salle", "Intermédiaire", "quadriceps, fessiers", "ischios, gainage", "rack + barre", "Jambes"),
  makeExercise("Presse à jambes", "salle", "Débutant", "quadriceps", "fessiers, ischios", "machine presse", "Jambes"),
  makeExercise("Tirage vertical", "salle", "Débutant", "grand dorsal", "biceps, arrière d'épaules", "poulie haute", "Pull"),
  makeExercise("Rowing", "salle", "Intermédiaire", "dos", "biceps, trapèzes", "barre, haltères ou machine", "Pull"),
  makeExercise("Développé épaules", "salle", "Intermédiaire", "épaules", "triceps, gainage", "haltères ou machine", "Push"),
  makeExercise("Curl biceps", "salle", "Débutant", "biceps", "avant-bras", "haltères ou barre", "Bras"),
  makeExercise("Extension triceps", "salle", "Débutant", "triceps", "épaules", "poulie ou haltère", "Bras"),
  makeExercise("Soulevé de terre", "salle", "Avancé", "ischios, fessiers, dos", "trapèzes, gainage", "barre", "Jambes"),
  makeExercise("Hip thrust", "salle", "Intermédiaire", "fessiers", "ischios, gainage", "banc + barre", "Jambes"),
  makeExercise("Leg curl", "salle", "Débutant", "ischios", "mollets", "machine leg curl", "Jambes"),
  makeExercise("Leg extension", "salle", "Débutant", "quadriceps", "fléchisseurs de hanche", "machine leg extension", "Jambes"),
  makeExercise("Mollets debout", "salle", "Débutant", "mollets", "chevilles", "machine ou haltères", "Jambes"),
  makeExercise("Abdominaux à la poulie", "salle", "Intermédiaire", "abdominaux", "obliques", "poulie haute", "Core"),
  makeExercise("Pompes", "maison", "Débutant", "pectoraux", "triceps, épaules, gainage", "aucun", "Push"),
  makeExercise("Squats au poids du corps", "maison", "Débutant", "quadriceps, fessiers", "ischios, gainage", "aucun", "Jambes"),
  makeExercise("Fentes", "maison", "Débutant", "quadriceps, fessiers", "ischios, mollets", "aucun", "Jambes"),
  makeExercise("Gainage", "maison", "Débutant", "abdominaux", "épaules, fessiers", "tapis optionnel", "Core", "3", "30-60 s", "45 s"),
  makeExercise("Mountain climbers", "maison", "Intermédiaire", "abdominaux", "épaules, cardio", "aucun", "HIIT", "4", "30-45 s", "45 s"),
  makeExercise("Burpees", "maison", "Avancé", "cardio full body", "jambes, pectoraux, épaules", "aucun", "HIIT", "4", "8-15", "60 s"),
  makeExercise("Dips sur chaise", "maison", "Intermédiaire", "triceps", "pectoraux, épaules", "chaise stable", "Bras"),
  makeExercise("Crunch", "maison", "Débutant", "abdominaux", "fléchisseurs de hanche", "tapis optionnel", "Core", "3", "12-20", "45 s"),
  makeExercise("Relevés de jambes", "maison", "Intermédiaire", "bas des abdos", "fléchisseurs de hanche", "tapis optionnel", "Core"),
  makeExercise("Pont fessier", "maison", "Débutant", "fessiers", "ischios, gainage", "aucun", "Jambes"),
  makeExercise("Jumping jacks", "maison", "Débutant", "cardio", "mollets, épaules", "aucun", "HIIT", "4", "30-60 s", "30 s"),
  makeExercise("Rowing élastique", "maison", "Débutant", "dos", "biceps, arrière d'épaules", "élastique", "Pull"),
  makeExercise("Développé au sol haltères", "maison", "Intermédiaire", "pectoraux", "triceps, épaules", "haltères", "Push")
];

const programs = [
  { id: "perte", goal: "Perte de poids", name: "Perte de poids active", days: 4, duration: "35-45 min", level: "Débutant", exercises: ["Squats au poids du corps", "Pompes", "Mountain climbers", "Jumping jacks"], advice: "Garde un rythme régulier et vise la constance." },
  { id: "muscle", goal: "Prise de muscle", name: "Hypertrophie salle", days: 4, duration: "55-70 min", level: "Intermédiaire", exercises: ["Développé couché", "Squat", "Rowing", "Hip thrust"], advice: "Note les charges et progresse petit à petit." },
  { id: "forme", goal: "Remise en forme", name: "Reprise complète", days: 3, duration: "30-40 min", level: "Débutant", exercises: ["Fentes", "Gainage", "Tirage vertical", "Leg extension"], advice: "Laisse 1 jour de repos entre les séances." },
  { id: "debutant", goal: "Débutant complet", name: "Base zéro", days: 3, duration: "25-35 min", level: "Débutant", exercises: ["Squats au poids du corps", "Pompes", "Pont fessier", "Crunch"], advice: "Priorité à la technique et à la respiration." },
  { id: "maison-sans", goal: "Maison", name: "Maison sans matériel", days: 4, duration: "25-35 min", level: "Débutant", exercises: ["Pompes", "Fentes", "Gainage", "Burpees"], advice: "Utilise des variantes faciles si nécessaire." },
  { id: "maison-haltere", goal: "Maison", name: "Maison avec haltères", days: 4, duration: "35-45 min", level: "Intermédiaire", exercises: ["Développé au sol haltères", "Fentes", "Pont fessier", "Rowing élastique"], advice: "Contrôle la descente sur chaque répétition." },
  { id: "salle-3", goal: "Salle", name: "Salle 3 jours/semaine", days: 3, duration: "55 min", level: "Intermédiaire", exercises: ["Squat", "Développé couché", "Tirage vertical", "Leg curl"], advice: "Full body efficace, parfait pour progresser." },
  { id: "salle-4", goal: "Salle", name: "Salle 4 jours/semaine", days: 4, duration: "60 min", level: "Intermédiaire", exercises: ["Presse à jambes", "Rowing", "Développé épaules", "Extension triceps"], advice: "Alterne haut et bas du corps." },
  { id: "full", goal: "Full body", name: "Full body solide", days: 3, duration: "45-60 min", level: "Tous niveaux", exercises: ["Squat", "Rowing", "Développé couché", "Gainage"], advice: "Répartis bien l'énergie entre les mouvements." },
  { id: "ppl", goal: "Push/Pull/Legs", name: "Push Pull Legs", days: 6, duration: "45-65 min", level: "Avancé", exercises: ["Développé couché", "Tirage vertical", "Squat", "Curl biceps"], advice: "Volume élevé : dors et mange suffisamment." }
];

const defaultState = {
  tasks: defaultTasks,
  sleep: { bedTime: "23:20", wakeTime: "06:48", score: 82 },
  fitnessView: "fitnessDashboardView",
  selectedPlace: "salle",
  selectedGroup: "Tous",
  selectedProgramGoal: "Tous",
  todayWorkout: [],
  performanceLogs: [],
  customPrograms: [],
  nutrition: {
    target: 2400,
    proteinTarget: 150,
    carbsTarget: 260,
    fatTarget: 75,
    fiberTarget: 30,
    water: 1.8,
    waterTarget: 2.7,
    meals: [{ id: "m-1", name: "Bol protéiné maison", calories: 720, protein: 42, carbs: 70, fat: 22, fiber: 9, portion: 1, source: "manuel" }]
  },
  profile: {
    weight: 78,
    targetWeight: 75,
    height: 178,
    age: 25,
    sex: "homme",
    goal: "maintenir",
    weeks: 12,
    pace: "modere",
    activity: "moyen",
    frequency: 3,
    weightHistory: [79.2, 78.8, 78.4, 78.1, 77.9, 78.0, 78]
  },
  watch: { connected: false, provider: "", steps: 8400, stepGoal: 10000, activeCalories: 420, distance: 6.2, workouts: 1 },
  blockedApps: { Instagram: true, TikTok: true, X: true, Facebook: true, Snapchat: false, YouTube: false },
  focus: { active: false, end: "19:30", startedAt: null },
  chat: [{ who: "ai", text: "Je suis branché sur ton agenda, ton sommeil, ton fitness, ta nutrition et ton mode focus. Quelle action veux-tu optimiser maintenant ?" }]
};

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepMerge(base, saved) {
  const result = structuredCloneSafe(base);
  Object.keys(saved || {}).forEach((key) => {
    if (saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key]) && result[key] && !Array.isArray(result[key])) {
      result[key] = { ...result[key], ...saved[key] };
    } else {
      result[key] = saved[key];
    }
  });
  return result;
}

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey) || localStorage.getItem("nexus-pwa-state-v1");
    return saved ? deepMerge(defaultState, JSON.parse(saved)) : structuredCloneSafe(defaultState);
  } catch {
    return structuredCloneSafe(defaultState);
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function mealTotals() {
  return state.nutrition.meals.reduce((total, meal) => ({
    calories: total.calories + Number(meal.calories || 0),
    protein: total.protein + Number(meal.protein || 0),
    carbs: total.carbs + Number(meal.carbs || 0),
    fat: total.fat + Number(meal.fat || 0),
    fiber: total.fiber + Number(meal.fiber || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
}

function setToday() {
  const formatter = new Intl.DateTimeFormat("fr-CA", { weekday: "short", day: "2-digit", month: "short" });
  document.getElementById("todayLabel").textContent = formatter.format(new Date());
}

function renderTasks() {
  state.tasks.sort((a, b) => a.time.localeCompare(b.time));
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  state.tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = `task-item ${task.done ? "done" : ""}`;
    item.style.setProperty("--task-color", categoryColors[task.category]);
    item.innerHTML = `<span class="task-color"></span><div><strong>${task.title}</strong><small>${task.time} · ${task.category}</small></div><button title="Changer le statut">${task.done ? "↺" : "✓"}</button>`;
    item.querySelector("button").addEventListener("click", () => {
      task.done = !task.done;
      saveState();
      renderTasks();
    });
    taskList.appendChild(item);
  });
  const done = state.tasks.filter((task) => task.done).length;
  const percent = state.tasks.length ? Math.round((done / state.tasks.length) * 100) : 0;
  document.getElementById("taskProgressText").textContent = `${percent}%`;
  document.querySelector(".ring.mini").style.setProperty("--value", percent);
  document.getElementById("taskSummary").textContent = `${done} tâches terminées sur ${state.tasks.length}`;
  document.getElementById("heroScore").textContent = `${percent}%`;
}

function renderFitnessMetrics() {
  const totals = mealTotals();
  document.getElementById("calorieRing").textContent = Math.round(totals.calories);
  document.getElementById("waterRing").textContent = `${state.nutrition.water.toFixed(2).replace(".", ",")}L`;
  document.getElementById("stepRing").textContent = state.watch.steps >= 1000 ? `${(state.watch.steps / 1000).toFixed(1)}k` : state.watch.steps;
  document.querySelectorAll(".ring")[1]?.style.setProperty("--value", Math.min(100, Math.round((totals.calories / state.nutrition.target) * 100)));
  document.querySelectorAll(".ring")[2]?.style.setProperty("--value", Math.min(100, Math.round((state.watch.steps / state.watch.stepGoal) * 100)));
  document.querySelectorAll(".ring")[3]?.style.setProperty("--value", Math.min(100, Math.round((state.nutrition.water / state.nutrition.waterTarget) * 100)));
}

function renderFitnessViews() {
  document.querySelectorAll(".fitness-tabs button").forEach((button) => button.classList.toggle("active", button.dataset.fitnessView === state.fitnessView));
  document.querySelectorAll(".fitness-view").forEach((view) => view.classList.toggle("active", view.id === state.fitnessView));
  document.getElementById("workoutCount").textContent = `${exerciseLibrary.length} exos`;
}

function renderDashboard() {
  const totals = mealTotals();
  const remaining = state.nutrition.target - totals.calories;
  document.getElementById("dashCalories").textContent = `${Math.max(0, remaining)} kcal`;
  document.getElementById("dashWater").textContent = `${state.nutrition.water.toFixed(1)} / ${state.nutrition.waterTarget} L`;
  document.getElementById("dashSteps").textContent = `${state.watch.steps} / ${state.watch.stepGoal}`;
  document.getElementById("dashWeight").textContent = `${state.profile.weight} kg`;
  let message = "Tu es sur la bonne voie";
  let details = "Tes calories, ton eau et ton activité sont cohérentes avec ton objectif.";
  const last = state.profile.weightHistory.at(-1);
  const first = state.profile.weightHistory.at(0);
  if (state.profile.goal === "perdre" && last < first - 1.8) {
    message = "Ton poids descend trop vite";
    details = "Remonte légèrement les calories ou ralentis le rythme.";
  } else if (Math.abs(last - first) < 0.2 && state.profile.goal !== "maintenir") {
    message = "Ton poids ne bouge pas depuis plusieurs jours";
    details = "Ajustement recommandé des calories et des pas.";
  } else if (totals.calories > state.nutrition.target + 250) {
    message = "Ajustement recommandé des calories";
    details = "Tu dépasses la cible aujourd'hui. Compense doucement, sans restriction agressive.";
  }
  document.getElementById("fitnessInsight").textContent = message;
  document.getElementById("fitnessInsightDetails").textContent = details;
  document.getElementById("todayWorkoutList").innerHTML = state.todayWorkout.length
    ? state.todayWorkout.map((item) => `<article class="program-card compact-card"><strong>${item.name}</strong><p>${item.sets} séries · ${item.reps} reps · repos ${item.rest}</p></article>`).join("")
    : `<article class="program-card compact-card"><strong>Entraînement du jour vide</strong><p>Ajoute un exercice depuis la bibliothèque ou choisis un programme prêt.</p></article>`;
}

function renderPlaceTabs() {
  const tabs = document.getElementById("placeTabs");
  tabs.innerHTML = ["salle", "maison"].map((place) => `<button type="button" class="${state.selectedPlace === place ? "active" : ""}" data-place="${place}">${place === "salle" ? "Exercices en salle" : "Exercices à la maison"}</button>`).join("");
  tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    state.selectedPlace = button.dataset.place;
    saveState();
    renderPlaceTabs();
    renderExercises();
  }));
}

function renderWorkoutTabs() {
  const groups = ["Tous", ...new Set(exerciseLibrary.filter((exercise) => exercise.place === state.selectedPlace).map((exercise) => exercise.group))];
  const tabs = document.getElementById("workoutTabs");
  tabs.innerHTML = groups.map((group) => `<button type="button" class="${state.selectedGroup === group ? "active" : ""}" data-group="${group}">${group}</button>`).join("");
  tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    state.selectedGroup = button.dataset.group;
    saveState();
    renderWorkoutTabs();
    renderExercises();
  }));
}

function renderExercises() {
  const search = (document.getElementById("exerciseSearch")?.value || "").toLowerCase();
  const list = document.getElementById("exerciseList");
  const filtered = exerciseLibrary.filter((exercise) => {
    const matchPlace = exercise.place === state.selectedPlace;
    const matchGroup = state.selectedGroup === "Tous" || exercise.group === state.selectedGroup;
    const haystack = `${exercise.name} ${exercise.primary} ${exercise.secondary} ${exercise.equipment}`.toLowerCase();
    return matchPlace && matchGroup && haystack.includes(search);
  });
  list.innerHTML = filtered.map((exercise) => `
    <button type="button" class="exercise-card" data-exercise="${exercise.id}">
      <div class="demo-video muscle-${exercise.group.toLowerCase()}"><span class="mini-body"></span><span class="mini-limb"></span></div>
      <div>
        <strong>${exercise.name}</strong>
        <p>${exercise.place === "salle" ? "Salle" : "Maison"} · ${exercise.level} · ${exercise.primary}</p>
        <p>${exercise.description}</p>
        <small>Voir la fiche détaillée</small>
      </div>
    </button>
  `).join("");
  list.querySelectorAll("[data-exercise]").forEach((card) => card.addEventListener("click", () => openExerciseModal(exerciseLibrary.find((exercise) => exercise.id === card.dataset.exercise))));
}

function openExerciseModal(exercise) {
  currentExercise = exercise;
  document.getElementById("modalExerciseTitle").textContent = exercise.name;
  document.getElementById("modalExerciseMeta").innerHTML = [
    ["Lieu", exercise.place === "salle" ? "Salle" : "Maison"],
    ["Niveau", exercise.level],
    ["Muscles principaux", exercise.primary],
    ["Secondaires", exercise.secondary],
    ["Matériel", exercise.equipment],
    ["Séries", exercise.sets],
    ["Répétitions", exercise.reps],
    ["Repos", exercise.rest],
    ["Vidéo", exercise.video]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
  document.getElementById("modalInstructions").innerHTML = exercise.steps.map((step) => `<li>${step}</li>`).join("");
  document.getElementById("modalBreathing").textContent = exercise.breathing;
  document.getElementById("modalMistakes").innerHTML = exercise.mistakes.map((mistake) => `<li>${mistake}</li>`).join("");
  document.getElementById("modalSafety").textContent = exercise.safety;
  document.getElementById("modalVariants").textContent = `Plus facile : ${exercise.easier} Plus difficile : ${exercise.harder}`;
  const logs = state.performanceLogs.filter((log) => log.exerciseId === exercise.id);
  document.getElementById("modalHistory").textContent = logs.length
    ? logs.map((log) => `${log.weight} kg · ${log.reps} reps · ressenti ${log.difficulty}`).join(" | ")
    : "Aucune séance enregistrée pour l'instant.";
  document.getElementById("modalRecords").textContent = `Record conseillé : maîtrise ${exercise.sets} séries de ${exercise.reps} avant d'augmenter la difficulté.`;
  document.getElementById("exerciseModal").classList.add("open");
  document.getElementById("exerciseModal").setAttribute("aria-hidden", "false");
}

function closeExerciseModal() {
  document.getElementById("exerciseModal").classList.remove("open");
  document.getElementById("exerciseModal").setAttribute("aria-hidden", "true");
}

function renderProgramGoalTabs() {
  const goals = ["Tous", ...new Set(programs.map((program) => program.goal))];
  const tabs = document.getElementById("programGoalTabs");
  tabs.innerHTML = goals.map((goal) => `<button type="button" class="${state.selectedProgramGoal === goal ? "active" : ""}" data-goal="${goal}">${goal}</button>`).join("");
  tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    state.selectedProgramGoal = button.dataset.goal;
    saveState();
    renderProgramGoalTabs();
    renderPrograms();
  }));
}

function renderPrograms() {
  const allPrograms = [...programs, ...state.customPrograms];
  const filtered = allPrograms.filter((program) => state.selectedProgramGoal === "Tous" || program.goal === state.selectedProgramGoal);
  document.getElementById("programList").innerHTML = filtered.map((program) => `
    <article class="program-card">
      <strong>${program.name}</strong>
      <p>${program.days} séances/semaine · ${program.duration} · ${program.level}</p>
      <p>${program.exercises.join(", ")}</p>
      <small>Séries 3-4 · répétitions 8-12 · repos 60-90 s</small>
      <button data-program="${program.id}">Utiliser ce programme</button>
    </article>
  `).join("");
  document.querySelectorAll("[data-program]").forEach((button) => button.addEventListener("click", () => {
    const program = allPrograms.find((item) => item.id === button.dataset.program);
    state.todayWorkout = program.exercises.map((name) => {
      const exercise = exerciseLibrary.find((item) => item.name === name) || exerciseLibrary[0];
      return { id: exercise.id, name: exercise.name, sets: exercise.sets, reps: exercise.reps, rest: exercise.rest };
    });
    saveState();
    renderDashboard();
    addMessage(`Programme "${program.name}" ajouté à ton entraînement du jour.`, "ai");
  }));
}

function estimateMacros(text, portion) {
  const lower = text.toLowerCase();
  let calories = 420, protein = 22, carbs = 45, fat = 14, fiber = 5;
  if (lower.includes("poulet") || lower.includes("boeuf") || lower.includes("saumon") || lower.includes("thon")) { calories += 220; protein += 35; fat += 8; }
  if (lower.includes("riz") || lower.includes("pâtes") || lower.includes("pates") || lower.includes("pain")) { calories += 260; carbs += 55; }
  if (lower.includes("avocat") || lower.includes("huile") || lower.includes("fromage")) { calories += 180; fat += 18; }
  if (lower.includes("salade") || lower.includes("légume") || lower.includes("legume")) { calories -= 110; fiber += 6; carbs += 8; }
  return {
    calories: Math.max(120, Math.round(calories * portion)),
    protein: Math.max(0, Math.round(protein * portion)),
    carbs: Math.max(0, Math.round(carbs * portion)),
    fat: Math.max(0, Math.round(fat * portion)),
    fiber: Math.max(0, Math.round(fiber * portion))
  };
}

function calculateCalorieTarget() {
  const { weight, height, age, sex, goal, activity, pace } = state.profile;
  const sexOffset = sex === "femme" ? -161 : sex === "homme" ? 5 : -78;
  const base = Math.round(10 * weight + 6.25 * height - 5 * age + sexOffset);
  const multiplier = activity === "haut" ? 1.65 : activity === "moyen" ? 1.45 : 1.25;
  const paceAdjust = pace === "agressif" ? 500 : pace === "modere" ? 350 : 200;
  let target = Math.round(base * multiplier);
  if (goal === "perdre") target -= paceAdjust;
  if (goal === "prendre") target += paceAdjust;
  if (goal === "composition") target -= 120;
  state.nutrition.target = Math.max(1400, target);
  state.nutrition.proteinTarget = Math.round(weight * (goal === "prendre" ? 2 : 1.7));
  state.nutrition.fatTarget = Math.round((state.nutrition.target * 0.27) / 9);
  state.nutrition.carbsTarget = Math.max(80, Math.round((state.nutrition.target - state.nutrition.proteinTarget * 4 - state.nutrition.fatTarget * 9) / 4));
  state.nutrition.fiberTarget = Math.max(25, Math.round(state.nutrition.target / 100));
  state.nutrition.waterTarget = Number(Math.max(2, weight * 0.035).toFixed(1));
  state.watch.stepGoal = goal === "perdre" || goal === "actif" ? 11000 : 9000;
}

function renderNutrition() {
  const totals = mealTotals();
  const remaining = state.nutrition.target - totals.calories;
  document.getElementById("nutritionCalories").textContent = totals.calories;
  document.getElementById("nutritionRemaining").textContent = remaining;
  document.getElementById("nutritionProtein").textContent = `${totals.protein}g`;
  document.getElementById("nutritionCarbs").textContent = `${totals.carbs}g`;
  document.getElementById("nutritionFat").textContent = `${totals.fat}g`;
  document.getElementById("nutritionFiber").textContent = `${totals.fiber}g`;
  document.getElementById("calorieTargetText").textContent = `Objectif : ${state.nutrition.target} kcal · P ${state.nutrition.proteinTarget}g · G ${state.nutrition.carbsTarget}g · L ${state.nutrition.fatTarget}g`;
  document.getElementById("calorieSummary").textContent = `${totals.calories} kcal consommées · ${Math.max(0, remaining)} restantes.`;
  document.getElementById("waterSummary").textContent = `Hydratation : ${state.nutrition.water.toFixed(2)} L / ${state.nutrition.waterTarget} L`;
  document.querySelector(".macro-line span").style.width = `${Math.min(100, Math.round((totals.calories / state.nutrition.target) * 100))}%`;
  document.getElementById("mealList").innerHTML = state.nutrition.meals.map((meal) => `
    <div class="meal-row">
      <span>${meal.name}</span>
      <strong>${meal.calories} kcal</strong>
      <small>P ${meal.protein}g · G ${meal.carbs}g · L ${meal.fat}g · fibres ${meal.fiber}g · ${meal.source}</small>
    </div>
  `).join("");
  renderFitnessMetrics();
  renderDashboard();
  saveState();
}

function renderProfile() {
  document.getElementById("profileWeight").value = state.profile.weight;
  document.getElementById("profileTargetWeight").value = state.profile.targetWeight;
  document.getElementById("profileHeight").value = state.profile.height;
  document.getElementById("profileAge").value = state.profile.age;
  document.getElementById("profileSex").value = state.profile.sex;
  document.getElementById("profileGoal").value = state.profile.goal;
  document.getElementById("profileWeeks").value = state.profile.weeks;
  document.getElementById("profilePace").value = state.profile.pace;
  document.getElementById("profileActivity").value = state.profile.activity;
  document.getElementById("profileFrequency").value = state.profile.frequency;
  document.getElementById("targetCalories").textContent = `Cible : ${state.nutrition.target} kcal / jour`;
  document.getElementById("targetDetails").textContent = `Protéines ${state.nutrition.proteinTarget}g · glucides ${state.nutrition.carbsTarget}g · lipides ${state.nutrition.fatTarget}g · eau ${state.nutrition.waterTarget} L · pas ${state.watch.stepGoal}.`;
  document.getElementById("weightCurrent").textContent = `${state.profile.weight} kg`;
  document.getElementById("weightTarget").textContent = `${state.profile.targetWeight} kg`;
  const avg = state.profile.weightHistory.reduce((a, b) => a + b, 0) / state.profile.weightHistory.length;
  document.getElementById("weeklyAverage").textContent = `${avg.toFixed(1)} kg`;
  document.getElementById("averageSteps").textContent = state.watch.steps;
}

function renderWatch() {
  document.getElementById("manualSteps").value = state.watch.steps;
  document.getElementById("stepGoal").value = state.watch.stepGoal;
  document.getElementById("watchState").textContent = state.watch.connected ? `${state.watch.provider} connectée` : "Smartwatch non connectée";
  document.getElementById("watchDetails").textContent = state.watch.connected
    ? `Données prêtes : ${state.watch.steps} pas, ${state.watch.activeCalories} kcal actives, ${state.watch.distance} km. Connexion réelle à faire via HealthKit/API fournisseur.`
    : "Préparation pour Apple Health, Google Fit, Fitbit, Garmin, Samsung Health et autres montres compatibles.";
  document.getElementById("activeCalories").textContent = state.watch.activeCalories;
  document.getElementById("dailyDistance").textContent = `${state.watch.distance} km`;
  document.getElementById("watchSleep").textContent = "7 h 28";
  document.getElementById("autoWorkouts").textContent = `${state.watch.workouts} détectée`;
  renderFitnessMetrics();
}

function renderSleep() {
  document.getElementById("bedTime").value = state.sleep.bedTime;
  document.getElementById("wakeTime").value = state.sleep.wakeTime;
  const values = [78, 84, 61, 89, 73, state.sleep.score, 69];
  document.getElementById("sleepHistory").innerHTML = values.map((value) => `<span style="--height:${value}%;--sleep-color:${value >= 80 ? "#a6ff4d" : value >= 70 ? "#ffd166" : "#ff7a59"}"></span>`).join("");
}

function renderApps() {
  const list = document.getElementById("appToggleList");
  list.innerHTML = "";
  Object.keys(state.blockedApps).forEach((app) => {
    const row = document.createElement("label");
    row.className = "app-row";
    row.innerHTML = `<span>${app}</span><span class="switch"><input type="checkbox" ${state.blockedApps[app] ? "checked" : ""} /><span></span></span>`;
    row.querySelector("input").addEventListener("change", (event) => {
      state.blockedApps[app] = event.target.checked;
      saveState();
    });
    list.appendChild(row);
  });
}

function addMessage(text, who = "ai", persist = true) {
  const chat = document.getElementById("chatWindow");
  const bubble = document.createElement("div");
  bubble.className = `message ${who}`;
  bubble.textContent = text;
  chat.appendChild(bubble);
  chat.scrollTop = chat.scrollHeight;
  if (persist) {
    state.chat.push({ who, text });
    state.chat = state.chat.slice(-18);
    saveState();
  }
}

function renderChat() {
  const chat = document.getElementById("chatWindow");
  chat.innerHTML = "";
  state.chat.forEach((message) => addMessage(message.text, message.who, false));
}

function nexusReply(prompt) {
  const text = prompt.toLowerCase();
  const totals = mealTotals();
  if (text.includes("photo") || text.includes("repas") || text.includes("calorie")) return `Je peux estimer ton repas, puis tu peux corriger les valeurs. Aujourd'hui : ${totals.calories}/${state.nutrition.target} kcal, protéines ${totals.protein}/${state.nutrition.proteinTarget}g.`;
  if (text.includes("maison") || text.includes("remplace")) return "Alternative maison : pompes classiques, pompes inclinées, pompes déclinées, pompes avec sac à dos ou développé au sol avec haltères.";
  if (text.includes("séance") || text.includes("seance")) return `Je te propose ${state.profile.frequency || 3} séances/semaine avec ${state.selectedPlace === "maison" ? "pompes, fentes, gainage et pont fessier" : "presse, rowing, développé couché et tirage vertical"}.`;
  if (text.includes("objectif")) return `Ta cible actuelle : ${state.nutrition.target} kcal, ${state.nutrition.proteinTarget}g protéines, ${state.nutrition.waterTarget} L d'eau et ${state.watch.stepGoal} pas.`;
  return "Je peux adapter ton entraînement, estimer un repas, corriger tes macros ou ajuster tes objectifs selon ton poids et tes pas.";
}

function startFocus() {
  const end = document.getElementById("focusEnd").value;
  const selectedApps = Object.entries(state.blockedApps).filter(([, active]) => active).map(([app]) => app);
  if (!window.confirm(`Approuver volontairement une session focus jusqu'à ${end} pour limiter : ${selectedApps.join(", ")} ?`)) return;
  state.focus = { active: true, end, startedAt: new Date().toISOString() };
  saveState();
  updateFocusTimer();
  clearInterval(focusInterval);
  focusInterval = setInterval(updateFocusTimer, 1000);
}

function updateFocusTimer() {
  const focusTimer = document.getElementById("focusTimer");
  const focusState = document.getElementById("focusState");
  const master = document.getElementById("masterFocus");
  if (!state.focus.active) {
    master.checked = false;
    focusState.textContent = "Session inactive";
    focusTimer.textContent = "Choisis tes apps, une heure de fin, puis approuve la session.";
    return;
  }
  const now = new Date();
  const [hours, minutes] = state.focus.end.split(":").map(Number);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  const diff = target - now;
  if (diff <= 0) {
    state.focus.active = false;
    saveState();
    updateFocusTimer();
    return;
  }
  const totalMinutes = Math.max(0, Math.floor(diff / 60000));
  master.checked = true;
  focusState.textContent = "Session focus active";
  focusTimer.textContent = `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")} h ${String(totalMinutes % 60).padStart(2, "0")} min restantes · apps limitées volontairement`;
}

function setupEvents() {
  document.querySelectorAll(".tabbar button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".tabbar button").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.screen).classList.add("active");
  }));

  document.querySelectorAll(".fitness-tabs button").forEach((button) => button.addEventListener("click", () => {
    state.fitnessView = button.dataset.fitnessView;
    saveState();
    renderFitnessViews();
  }));

  document.querySelectorAll(".modal-tabs button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".modal-tabs button").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".modal-panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.modalTab).classList.add("active");
  }));

  document.getElementById("exerciseSearch").addEventListener("input", renderExercises);
  document.getElementById("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.getElementById("taskTitle");
    state.tasks.push({ id: uid(), title: title.value.trim(), category: document.getElementById("taskCategory").value, time: document.getElementById("taskTime").value, done: false });
    title.value = "";
    saveState();
    renderTasks();
  });
  document.getElementById("quickComplete").addEventListener("click", () => {
    const next = state.tasks.find((task) => !task.done);
    if (next) next.done = true;
    saveState();
    renderTasks();
  });

  document.getElementById("customProgramForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("customProgramName").value.trim();
    state.customPrograms.push({ id: uid(), goal: "Personnalisé", name, days: 3, duration: "45 min", level: document.getElementById("customProgramLevel").value, exercises: state.todayWorkout.map((item) => item.name).slice(0, 5), advice: "Programme créé par l'utilisateur." });
    document.getElementById("customProgramName").value = "";
    saveState();
    renderPrograms();
  });

  document.getElementById("nutritionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const foodText = document.getElementById("foodText").value.trim();
    const portion = Number(document.getElementById("foodPortion").value || 1);
    const photo = document.getElementById("foodPhoto").files[0];
    const macros = estimateMacros(foodText || "repas moyen", portion);
    if (document.getElementById("foodCalories").value) macros.calories = Number(document.getElementById("foodCalories").value);
    state.nutrition.meals.push({ id: uid(), name: foodText || (photo ? `Photo : ${photo.name}` : "Repas ajouté"), portion, source: photo ? "photo + estimation IA simulée" : "manuel / IA locale", ...macros });
    document.getElementById("foodText").value = "";
    document.getElementById("foodCalories").value = "";
    document.getElementById("foodPhoto").value = "";
    renderNutrition();
    addMessage(`Repas ajouté : ${macros.calories} kcal estimées. Tu peux corriger les valeurs si besoin.`, "ai");
  });

  document.getElementById("aiEstimateFood").addEventListener("click", () => {
    const macros = estimateMacros(document.getElementById("foodText").value || "repas moyen", Number(document.getElementById("foodPortion").value || 1));
    document.getElementById("foodCalories").value = macros.calories;
    addMessage(`Estimation Nexus IA : ${macros.calories} kcal, P ${macros.protein}g, G ${macros.carbs}g, L ${macros.fat}g.`, "ai");
  });

  document.querySelectorAll("[data-water]").forEach((button) => button.addEventListener("click", () => {
    state.nutrition.water = Math.min(8, Number((state.nutrition.water + Number(button.dataset.water)).toFixed(2)));
    saveState();
    renderNutrition();
  }));

  document.getElementById("profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.profile.weight = Number(document.getElementById("profileWeight").value);
    state.profile.targetWeight = Number(document.getElementById("profileTargetWeight").value);
    state.profile.height = Number(document.getElementById("profileHeight").value);
    state.profile.age = Number(document.getElementById("profileAge").value);
    state.profile.sex = document.getElementById("profileSex").value;
    state.profile.goal = document.getElementById("profileGoal").value;
    state.profile.weeks = Number(document.getElementById("profileWeeks").value);
    state.profile.pace = document.getElementById("profilePace").value;
    state.profile.activity = document.getElementById("profileActivity").value;
    state.profile.frequency = Number(document.getElementById("profileFrequency").value);
    state.profile.weightHistory.push(state.profile.weight);
    state.profile.weightHistory = state.profile.weightHistory.slice(-7);
    calculateCalorieTarget();
    saveState();
    renderProfile();
    renderNutrition();
    renderWatch();
    addMessage(`Objectifs recalculés : ${state.nutrition.target} kcal, ${state.nutrition.proteinTarget}g protéines, ${state.watch.stepGoal} pas.`, "ai");
  });

  document.querySelectorAll(".watch-actions button").forEach((button) => button.addEventListener("click", () => {
    state.watch.connected = true;
    state.watch.provider = button.dataset.watch;
    state.watch.steps = Math.max(state.watch.steps, 9200);
    state.watch.activeCalories = Math.max(state.watch.activeCalories, 480);
    saveState();
    renderWatch();
    renderDashboard();
    addMessage(`${state.watch.provider} préparé. Dans une vraie app, les données viendront de HealthKit, Google Fit ou l'API officielle.`, "ai");
  }));
  document.getElementById("syncSteps").addEventListener("click", () => {
    state.watch.steps = Number(document.getElementById("manualSteps").value || 0);
    state.watch.stepGoal = Number(document.getElementById("stepGoal").value || 10000);
    state.watch.distance = Number((state.watch.steps * 0.00075).toFixed(1));
    state.watch.activeCalories = Math.round(state.watch.steps * 0.045);
    saveState();
    renderWatch();
    renderDashboard();
  });

  document.getElementById("addExerciseToWorkout").addEventListener("click", () => {
    if (!currentExercise) return;
    state.todayWorkout.push({ id: currentExercise.id, name: currentExercise.name, sets: currentExercise.sets, reps: currentExercise.reps, rest: currentExercise.rest });
    saveState();
    renderDashboard();
    addMessage(`${currentExercise.name} ajouté à ton entraînement du jour.`, "ai");
  });
  document.getElementById("performanceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentExercise) return;
    state.performanceLogs.push({ exerciseId: currentExercise.id, weight: Number(document.getElementById("logWeight").value || 0), reps: Number(document.getElementById("logReps").value || 0), difficulty: document.getElementById("logDifficulty").value, date: new Date().toISOString() });
    saveState();
    openExerciseModal(currentExercise);
  });

  document.getElementById("sleepForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.sleep.bedTime = document.getElementById("bedTime").value;
    state.sleep.wakeTime = document.getElementById("wakeTime").value;
    state.sleep.score = Math.min(96, Math.max(58, state.sleep.score + 1));
    saveState();
    renderSleep();
  });
  document.getElementById("focusEnd").value = state.focus.end;
  document.getElementById("focusEnd").addEventListener("change", (event) => {
    state.focus.end = event.target.value;
    saveState();
  });
  document.getElementById("startFocus").addEventListener("click", startFocus);
  document.getElementById("masterFocus").addEventListener("change", (event) => {
    if (!event.target.checked && state.focus.active && window.confirm("Arrêter volontairement la session focus maintenant ?")) {
      clearInterval(focusInterval);
      state.focus.active = false;
      saveState();
      updateFocusTimer();
    }
  });
  document.getElementById("chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    addMessage(nexusReply(text), "ai");
    input.value = "";
  });
  document.querySelectorAll(".quick-actions button").forEach((button) => button.addEventListener("click", () => {
    const prompt = button.dataset.prompt;
    addMessage(prompt, "user");
    addMessage(nexusReply(prompt), "ai");
  }));
  document.getElementById("closeExerciseModal").addEventListener("click", closeExerciseModal);
  document.getElementById("exerciseModal").addEventListener("click", (event) => {
    if (event.target.id === "exerciseModal") closeExerciseModal();
  });
  document.getElementById("demoToggle").addEventListener("click", () => {
    const demo = document.getElementById("modalDemo");
    const paused = demo.classList.toggle("paused");
    document.getElementById("demoToggle").textContent = paused ? "Lire" : "Pause";
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => console.info("Service worker non disponible sur cette origine."));
}

setInterval(() => {
  const rate = 76 + Math.round(Math.sin(Date.now() / 900) * 5);
  document.getElementById("heartRate").textContent = rate;
}, 900);

calculateCalorieTarget();
setToday();
setupEvents();
renderTasks();
renderFitnessViews();
renderPlaceTabs();
renderWorkoutTabs();
renderExercises();
renderProgramGoalTabs();
renderPrograms();
renderNutrition();
renderProfile();
renderWatch();
renderSleep();
renderApps();
renderChat();
updateFocusTimer();
if (state.focus.active) focusInterval = setInterval(updateFocusTimer, 1000);
registerServiceWorker();
