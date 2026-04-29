const categoryColors = {
  etudes: "#2a7fff",
  todo: "#9fb8c8",
  fitness: "#00e676",
  velo: "#00f0ff",
  marche: "#18ffd0",
  course: "#00e676",
  priere: "#ffb300",
  travail: "#7b61ff",
  repas: "#ff8a00",
  courses: "#7cff6b",
  eau: "#72d7ff",
  sommeil: "#163bff",
  lecture: "#3f7cff",
  meditation: "#ff4fd8",
  rdv: "#ffffff",
  transport: "#78a6ff",
  pause: "#8aa0ad",
  nettoyage: "#00d6b8",
  projet: "#7b61ff",
  libre: "#35e8ff",
  famille: "#ff7ab6",
  focus: "#ffd166",
  perso: "#ff7a59"
};

const plannerCategories = [
  ["etudes", "▤", "Études", "Temps d’apprentissage ou révision.", 90],
  ["todo", "✓", "À faire", "Petites tâches administratives ou personnelles.", 30],
  ["fitness", "▥", "Salle", "Entraînement musculaire ou fitness.", 75],
  ["velo", "◇", "Vélo", "Sortie cardio à vélo.", 45],
  ["marche", "⌁", "Marche", "Marche active ou récupération.", 30],
  ["course", "↯", "Course", "Course à pied ou fractionné.", 35],
  ["priere", "✦", "Prière", "Moment spirituel ou recueillement.", 20],
  ["travail", "▣", "Travail", "Travail, projet ou obligations.", 120],
  ["repas", "♨", "Cuisine", "Préparer ou prendre un repas.", 45],
  ["courses", "▱", "Courses", "Achats et provisions.", 60],
  ["eau", "♢", "Eau", "Hydratation et rappel de boisson.", 5],
  ["sommeil", "◔", "Sommeil", "Routine nuit et récupération.", 480],
  ["lecture", "▥", "Lecture", "Lecture, détente ou apprentissage.", 30],
  ["meditation", "✧", "Méditation", "Respiration, calme ou pleine conscience.", 10],
  ["rdv", "◎", "RDV", "Rendez-vous important.", 60],
  ["transport", "⇄", "Transport", "Déplacement ou trajet.", 30],
  ["pause", "—", "Pause", "Récupération courte.", 15],
  ["nettoyage", "✣", "Nettoyage", "Rangement et ménage.", 45],
  ["projet", "⬡", "Projet", "Projet personnel ou création.", 90],
  ["libre", "○", "Libre", "Temps libre volontaire.", 60],
  ["famille", "♡", "Famille", "Famille, amis et social.", 60]
].map(([id, icon, name, description, duration]) => ({ id, icon, name, description, duration, color: categoryColors[id] || "#00f0ff" }));

const priorityMeta = {
  1: { label: "Faible", icon: "•", color: "#7da2c8" },
  2: { label: "Normal", icon: "◆", color: "#00f0ff" },
  3: { label: "Important", icon: "✦", color: "#00e676" },
  4: { label: "Très important", icon: "▲", color: "#ffb300" },
  5: { label: "Critique", icon: "⬢", color: "#ff4655" }
};

const storageKey = "nexus-pwa-state-v2";
let focusInterval;
let currentExercise = null;
let lastMealPhoto = null;

function capacitorPlugin(name) {
  return window.Capacitor?.Plugins?.[name] || null;
}

function isNativeApp() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

async function captureMealPhoto(fallbackInputId) {
  const Camera = capacitorPlugin("Camera");
  if (!Camera?.getPhoto) {
    document.getElementById(fallbackInputId)?.click();
    return null;
  }
  const photo = await Camera.getPhoto({
    quality: 82,
    allowEditing: false,
    resultType: "dataUrl",
    source: "CAMERA",
    saveToGallery: false
  });
  lastMealPhoto = photo.dataUrl || photo.webPath || null;
  return lastMealPhoto;
}

function healthPlugin() {
  return capacitorPlugin("CapacitorHealth") || capacitorPlugin("Health") || capacitorPlugin("HealthKit") || capacitorPlugin("CapgoHealth");
}

async function readNativeHealthData() {
  const Health = healthPlugin();
  if (!Health) {
    return {
      source: "web-fallback",
      steps: state.watch.steps,
      distance: state.watch.distance,
      activeCalories: state.watch.activeCalories,
      heartRate: 52,
      sleepHours: "7 h 28"
    };
  }

  const permissions = [
    "steps",
    "distance",
    "activeEnergyBurned",
    "heartRate",
    "sleepAnalysis"
  ];

  if (Health.requestAuthorization) {
    await Health.requestAuthorization({ read: permissions, write: [] });
  } else if (Health.requestPermissions) {
    await Health.requestPermissions({ read: permissions, write: [] });
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const range = { startDate: start.toISOString(), endDate: now.toISOString() };

  async function tryRead(methods, fallback) {
    for (const method of methods) {
      if (typeof Health[method] === "function") {
        try {
          return await Health[method](range);
        } catch {
          // Try the next compatible method shape.
        }
      }
    }
    return fallback;
  }

  const steps = await tryRead(["querySteps", "getSteps", "getStepCount"], { value: state.watch.steps });
  const calories = await tryRead(["queryActiveEnergyBurned", "getActiveEnergyBurned", "getCalories"], { value: state.watch.activeCalories });
  const distance = await tryRead(["queryDistance", "getDistance"], { value: state.watch.distance });
  const heartRate = await tryRead(["queryHeartRate", "getHeartRate"], { value: 52 });
  const sleep = await tryRead(["querySleepAnalysis", "getSleepAnalysis", "getSleep"], { value: "7 h 28" });

  return {
    source: "healthkit",
    steps: Number(steps.value ?? steps.steps ?? steps.count ?? state.watch.steps),
    activeCalories: Number(calories.value ?? calories.calories ?? state.watch.activeCalories),
    distance: Number(distance.value ?? distance.distance ?? state.watch.distance),
    heartRate: Number(heartRate.value ?? heartRate.heartRate ?? 52),
    sleepHours: sleep.value ?? sleep.duration ?? "7 h 28"
  };
}

const userDailyData = {
  hydration: {
    current: 1.0,
    target: 2.5
  },
  nutrition: {
    calories: 1658,
    targetCalories: 2400,
    protein: 128,
    proteinTarget: 180,
    carbs: 180,
    carbsTarget: 300,
    fat: 58,
    fatTarget: 80
  },
  workout: {
    trainedZones: ["arms", "shoulders", "chest"],
    intensity: {
      arms: "high",
      shoulders: "high",
      chest: "medium",
      legs: "medium",
      calves: "low"
    }
  },
  sleep: {
    score: 87,
    duration: "7h32",
    deep: "2h15",
    light: "4h17",
    wakeups: 2
  },
  digestion: {
    status: "Bonne",
    lastMeal: "12:30",
    nextDigestion: "dans 2h15"
  },
  activity: {
    steps: 6200,
    caloriesBurned: 680,
    cardio: "Bonne santé"
  }
};

const defaultTasks = [
  { id: "t-1", title: "Prière du matin", category: "priere", date: "", time: "05:00", duration: 20, priority: 3, reminder: 15, repeat: "daily", note: "Commencer la journée calmement.", status: "todo", done: false },
  { id: "t-2", title: "Marche", category: "marche", date: "", time: "06:00", duration: 30, priority: 2, reminder: 15, repeat: "daily", note: "Cardio léger.", status: "todo", done: false },
  { id: "t-3", title: "Petit-déjeuner", category: "repas", date: "", time: "07:00", duration: 35, priority: 3, reminder: 5, repeat: "daily", note: "Repas sain.", status: "done", done: true },
  { id: "t-4", title: "Travail / projet", category: "travail", date: "", time: "08:00", duration: 180, priority: 4, reminder: 30, repeat: "once", note: "Priorité du matin.", status: "todo", done: false },
  { id: "t-5", title: "Vélo", category: "velo", date: "", time: "17:30", duration: 45, priority: 2, reminder: 15, repeat: "weekly", note: "Cardio extérieur.", status: "todo", done: false },
  { id: "t-6", title: "Salle / fitness", category: "fitness", date: "", time: "18:30", duration: 75, priority: 3, reminder: 15, repeat: "weekly", note: "Pectoraux & triceps.", status: "todo", done: false },
  { id: "t-7", title: "Sommeil", category: "sommeil", date: "", time: "22:30", duration: 480, priority: 5, reminder: 30, repeat: "daily", note: "Routine sans écran.", status: "todo", done: false }
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
  plannerView: "today",
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
  holoMode: true,
  homeDaily: userDailyData,
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function minutesToTime(total) {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(time = "00:00") {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function normalizeTask(task) {
  const category = plannerCategories.some((item) => item.id === task.category) ? task.category : task.category === "perso" ? "todo" : task.category || "todo";
  const cat = plannerCategories.find((item) => item.id === category) || plannerCategories[1];
  const duration = Number(task.duration || cat.duration || 30);
  return {
    id: task.id || uid(),
    title: task.title || cat.name,
    category,
    date: task.date || todayISO(),
    time: task.time || "09:00",
    duration,
    priority: Number(task.priority || 2),
    reminder: Number(task.reminder ?? 15),
    repeat: task.repeat || "once",
    note: task.note || "",
    status: task.done ? "done" : task.status || "todo",
    done: Boolean(task.done || task.status === "done")
  };
}

state.tasks = state.tasks.map(normalizeTask);

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
  const iconMap = { fitness: "▥", travail: "▣", sommeil: "◔", focus: "⬡", perso: "◇", repas: "♨", eau: "♢", ia: "✧" };
  const labelMap = { fitness: "Salle", travail: "Développement", sommeil: "Lecture & détente", focus: "Concentration", perso: "Personnel", repas: "Repas sain", eau: "Hydratation", ia: "Nexus IA" };
  state.tasks.forEach((task) => {
    const item = document.createElement("div");
    item.className = `task-item ${task.done ? "done" : ""}`;
    item.style.setProperty("--task-color", categoryColors[task.category]);
    item.innerHTML = `
      <time>${task.time}</time>
      <span class="task-icon">${iconMap[task.category] || "◇"}</span>
      <div>
        <strong>${task.title}</strong>
        <small>${labelMap[task.category] || task.category}</small>
      </div>
      <button title="Changer le statut">${task.done ? "✓" : ""}</button>
    `;
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
  document.getElementById("homeFocus").textContent = `${percent}%`;
  document.getElementById("homeFocusBar").style.width = `${percent}%`;
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  state.tasks = state.tasks.map(normalizeTask);
  const today = todayISO();
  const todayTasks = state.tasks.filter((task) => task.date === today || task.repeat === "daily").sort((a, b) => {
    if (state.plannerView === "today") return b.priority - a.priority || a.time.localeCompare(b.time);
    return a.time.localeCompare(b.time);
  });
  document.querySelectorAll("[data-planner-view]").forEach((button) => button.classList.toggle("active", button.dataset.plannerView === state.plannerView));
  document.getElementById("plannerDateTitle").textContent = state.plannerView === "today" ? "Aujourd'hui" : state.plannerView === "week" ? "Semaine" : "Mois";
  document.getElementById("plannerDateSubtitle").textContent = new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());
  renderWeekStrip();
  if (state.plannerView === "week") renderWeekView(taskList);
  else if (state.plannerView === "month") renderMonthView(taskList);
  else todayTasks.forEach((task) => taskList.appendChild(createTaskElement(task)));

  const done = todayTasks.filter((task) => task.done).length;
  const percent = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;
  const next = todayTasks.find((task) => !task.done);
  const totalBusy = todayTasks.reduce((sum, task) => sum + Number(task.duration || 0), 0);
  const freeMinutes = Math.max(0, 16 * 60 - totalBusy);
  const critical = todayTasks.filter((task) => task.priority >= 5);
  const high = todayTasks.find((task) => task.priority >= 4 && !task.done) || next;
  document.getElementById("taskProgressText").textContent = `${percent}%`;
  document.querySelector(".ring.mini").style.setProperty("--value", percent);
  document.getElementById("taskSummary").textContent = `${done} tâches terminées sur ${todayTasks.length}`;
  document.getElementById("heroScore").textContent = `${percent}%`;
  document.getElementById("homeFocus").textContent = `${percent}%`;
  document.getElementById("homeFocusBar").style.width = `${percent}%`;
  document.getElementById("nextTaskText").textContent = next ? `${next.title} à ${next.time}` : "Journée terminée";
  document.getElementById("freeTimeText").textContent = `${Math.floor(freeMinutes / 60)} h ${String(freeMinutes % 60).padStart(2, "0")}`;
  document.getElementById("dayLoadText").textContent = critical.length > 2 ? "Trop critique" : totalBusy > 9 * 60 ? "Chargée" : "Équilibrée";
  document.getElementById("priorityInsightText").textContent = high ? `${high.title} (${priorityMeta[high.priority].label})` : "Aucune urgence";
  document.getElementById("plannerAiSuggestion").textContent = critical.length > 2
    ? "Tu as trop de tâches critiques aujourd'hui, je te conseille d'en déplacer une."
    : high ? `Ta tâche la plus importante aujourd'hui est ${high.title} à ${high.time}.` : "Ta journée est claire. Garde de l'espace pour respirer.";
}

function createTaskElement(task) {
  const cat = plannerCategories.find((item) => item.id === task.category) || plannerCategories[1];
  const priority = priorityMeta[task.priority] || priorityMeta[2];
  const end = minutesToTime(timeToMinutes(task.time) + Number(task.duration || 30));
  const item = document.createElement("div");
  item.className = `task-item priority-${task.priority} ${task.done ? "done" : ""}`;
  item.style.setProperty("--task-color", cat.color);
  item.style.setProperty("--priority-color", priority.color);
  item.innerHTML = `
    <time>${task.time}</time>
    <span class="task-icon">${cat.icon}</span>
    <div>
      <strong>${task.title}</strong>
      <small>${end} · ${task.duration} min · ${cat.name} · rappel ${task.reminder} min · ${task.repeat}</small>
      ${task.note ? `<em>${task.note}</em>` : ""}
    </div>
    <div class="task-actions">
      <span class="priority-badge">${priority.icon} ${priority.label}</span>
      <button data-action="edit" title="Modifier">✎</button>
      <button data-action="toggle" title="Changer le statut">${task.done ? "✓" : ""}</button>
      <button data-action="delete" title="Supprimer">×</button>
    </div>
  `;
  item.querySelector('[data-action="edit"]').addEventListener("click", () => {
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskCategory").value = task.category;
    document.getElementById("taskDate").value = task.date;
    document.getElementById("taskTime").value = task.time;
    document.getElementById("taskDuration").value = task.duration;
    document.getElementById("taskPriority").value = task.priority;
    document.getElementById("taskReminder").value = task.reminder;
    document.getElementById("taskRepeat").value = task.repeat;
    document.getElementById("taskNote").value = task.note;
    document.getElementById("taskForm").classList.remove("collapsed");
    state.tasks = state.tasks.filter((candidate) => candidate.id !== task.id);
    saveState();
    renderTasks();
  });
  item.querySelector('[data-action="toggle"]').addEventListener("click", () => {
    task.done = !task.done;
    task.status = task.done ? "done" : "todo";
    saveState();
    renderTasks();
  });
  item.querySelector('[data-action="delete"]').addEventListener("click", () => {
    state.tasks = state.tasks.filter((candidate) => candidate.id !== task.id);
    saveState();
    renderTasks();
  });
  return item;
}

function renderWeekStrip() {
  const week = document.getElementById("weekStrip");
  const now = new Date();
  week.innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    const count = state.tasks.filter((task) => task.date === iso || task.repeat === "daily").length;
    return `<span class="${index === 0 ? "active" : ""}"><b>${new Intl.DateTimeFormat("fr-CA", { weekday: "short" }).format(date)}</b><strong>${date.getDate()}</strong><small>${count}</small></span>`;
  }).join("");
}

function renderWeekView(container) {
  const now = new Date();
  container.innerHTML = "";
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    const dayTasks = state.tasks.filter((task) => task.date === iso || task.repeat === "daily");
    const block = document.createElement("div");
    block.className = "calendar-summary-card";
    block.innerHTML = `<strong>${new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "2-digit" }).format(date)}</strong><p>${dayTasks.length} tâches · ${dayTasks.filter((task) => task.priority >= 4).length} importantes</p>`;
    container.appendChild(block);
  });
}

function renderMonthView(container) {
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  container.innerHTML = `<div class="month-grid">${Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
    const iso = date.toISOString().slice(0, 10);
    const count = state.tasks.filter((task) => task.date === iso || task.repeat === "daily").length;
    return `<button class="${date.getDate() === now.getDate() ? "active" : ""}"><strong>${index + 1}</strong><small>${count}</small></button>`;
  }).join("")}</div>`;
}

function renderPlannerCategories() {
  const rail = document.getElementById("plannerCategoryRail");
  rail.innerHTML = plannerCategories.map((cat) => `
    <button type="button" data-quick-category="${cat.id}" style="--cat-color:${cat.color}">
      <span>${cat.icon}</span>
      <strong>${cat.name}</strong>
      <small>${cat.duration} min</small>
    </button>
  `).join("");
  rail.querySelectorAll("[data-quick-category]").forEach((button) => button.addEventListener("click", () => {
    const cat = plannerCategories.find((item) => item.id === button.dataset.quickCategory);
    document.getElementById("taskTitle").value = cat.name;
    document.getElementById("taskCategory").value = cat.id;
    document.getElementById("taskDuration").value = cat.duration;
    document.getElementById("taskPriority").value = cat.id === "sommeil" ? 5 : ["travail", "etudes"].includes(cat.id) ? 4 : ["priere", "eau", "fitness"].includes(cat.id) ? 3 : 2;
    haptic();
  }));
}

function getHomeDailyData() {
  state.homeDaily = state.homeDaily || structuredCloneSafe(userDailyData);
  state.homeDaily.hydration = state.homeDaily.hydration || structuredCloneSafe(userDailyData.hydration);
  state.homeDaily.nutrition = state.homeDaily.nutrition || structuredCloneSafe(userDailyData.nutrition);
  state.homeDaily.workout = state.homeDaily.workout || structuredCloneSafe(userDailyData.workout);
  state.homeDaily.sleep = state.homeDaily.sleep || structuredCloneSafe(userDailyData.sleep);
  state.homeDaily.digestion = state.homeDaily.digestion || structuredCloneSafe(userDailyData.digestion);
  state.homeDaily.activity = state.homeDaily.activity || structuredCloneSafe(userDailyData.activity);
  return state.homeDaily;
}

function percent(value, target) {
  return Math.min(100, Math.max(0, Math.round((Number(value || 0) / Math.max(1, Number(target || 1))) * 100)));
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setRing(id, value, label) {
  const ring = document.getElementById(id);
  if (!ring) return;
  ring.style.setProperty("--value", value);
  const strong = ring.querySelector("strong");
  if (strong) strong.textContent = label ?? `${value}%`;
}

const bodyZoneMeta = {
  brain: { label: "Cerveau", state: "Bonne activité", tone: "mental", detail: "Activité mentale stable. Garde des pauses courtes pour rester lucide." },
  shoulders: { label: "Épaules", state: "Très sollicitées", tone: "high", detail: "Épaules très sollicitées aujourd'hui. Évite une séance lourde demain." },
  arms: { label: "Bras", state: "Très sollicités", tone: "high", detail: "Bras chargés après pectoraux et triceps. Priorité protéines et hydratation." },
  chest: { label: "Pectoraux", state: "Sollicités", tone: "medium", detail: "Pectoraux travaillés modérément. Récupération active recommandée." },
  core: { label: "Abdominaux", state: "Stable", tone: "normal", detail: "Core stable. Tu peux ajouter 8 à 10 minutes de gainage léger." },
  back: { label: "Dos", state: "Sollicité", tone: "medium", detail: "Dos sollicité indirectement. Pense à garder une posture neutre." },
  digestion: { label: "Ventre / digestion", state: "En digestion", tone: "digest", detail: "Digestion active depuis le dernier repas. Attends avant un effort intense." },
  legs: { label: "Jambes", state: "Sollicitées", tone: "medium", detail: "Jambes modérément sollicitées par le vélo et la marche." },
  calves: { label: "Mollets", state: "Peu sollicités", tone: "low", detail: "Mollets peu sollicités. Une marche légère suffit aujourd'hui." },
  cardio: { label: "Cardio", state: "Bonne santé", tone: "good", detail: "Cardio bon. Pas et vélo soutiennent bien ton objectif." },
  lungs: { label: "Poumons", state: "Respiration stable", tone: "normal", detail: "Respiration stable. Les étirements et la marche aident la récupération." }
};

function toneFromZone(zone, data) {
  if (zone === "brain") return "mental";
  if (zone === "digestion") return "digest";
  if (zone === "cardio") return "good";
  if (zone === "lungs") return "normal";
  return data.workout.intensity[zone] || bodyZoneMeta[zone]?.tone || "normal";
}

function renderHomeDashboard() {
  const data = getHomeDailyData();
  const hydrationPercent = percent(data.hydration.current, data.hydration.target);
  const nutritionPercent = percent(data.nutrition.calories, data.nutrition.targetCalories);
  const hydrationLow = hydrationPercent < 50;

  setText("homeHydrationAmount", `${data.hydration.current.toFixed(1)} / ${data.hydration.target} L`);
  setText("homeHydrationStatus", `Niveau d'hydratation : ${hydrationLow ? "Faible" : "Correct"}`);
  setText("homeHydrationMessage", hydrationLow ? "Tu es déshydraté. Bois plus d'eau." : "Bon rythme. Continue à boire régulièrement.");
  setRing("homeWaterProgress", hydrationPercent);

  setRing("homeNutritionProgress", nutritionPercent, `${data.nutrition.calories}`);
  setText("homeProtein", `${data.nutrition.protein} / ${data.nutrition.proteinTarget} g`);
  setText("homeCarbs", `${data.nutrition.carbs} / ${data.nutrition.carbsTarget} g`);
  setText("homeFat", `${data.nutrition.fat} / ${data.nutrition.fatTarget} g`);
  setText("homeSleepDuration", data.sleep.duration);
  setText("homeSleepDeep", data.sleep.deep);
  setText("homeSleepLight", data.sleep.light);
  setText("homeSleepWakeups", `${data.sleep.wakeups} fois`);
  setText("homeBurnedCalories", `${data.activity.caloriesBurned} kcal`);
  setText("homeDigestionStatus", data.digestion.status);
  setText("homeLastMeal", data.digestion.lastMeal);
  setText("homeNextDigestion", data.digestion.nextDigestion);
  setText("aiWaterValue", `${data.hydration.current.toFixed(1)} L`);
  setText("aiCaloriesLeft", Math.max(0, data.nutrition.targetCalories - data.nutrition.calories));

  document.querySelectorAll("[data-zone]").forEach((zoneButton) => {
    const zone = zoneButton.dataset.zone;
    const tone = toneFromZone(zone, data);
    zoneButton.dataset.tone = hydrationLow && ["core", "legs", "arms"].includes(zone) ? "hydration-low" : tone;
  });

  const zones = ["brain", "shoulders", "arms", "chest", "back", "legs", "calves", "cardio", "digestion"];
  const zoneGrid = document.getElementById("bodyZonesGrid");
  if (zoneGrid) {
    zoneGrid.innerHTML = zones.map((zone) => {
      const meta = bodyZoneMeta[zone];
      const tone = toneFromZone(zone, data);
      return `<button type="button" data-zone-card="${zone}" data-tone="${tone}">
        <span>${zone === "brain" ? "◌" : zone === "cardio" ? "♡" : zone === "digestion" ? "◉" : "⬡"}</span>
        <strong>${meta.label}</strong>
        <small>${meta.state}</small>
      </button>`;
    }).join("");
    zoneGrid.querySelectorAll("[data-zone-card]").forEach((button) => {
      button.addEventListener("click", () => showBodyZone(button.dataset.zoneCard));
    });
  }

  const goals = [
    ["Boire 2.5 L d'eau", hydrationPercent],
    ["2 400 kcal", nutritionPercent],
    ["Protéines 180 g", percent(data.nutrition.protein, data.nutrition.proteinTarget)],
    ["Sommeil 7-8h", data.sleep.score],
    ["10 000 pas", percent(data.activity.steps, 10000)]
  ];
  const goalsNode = document.getElementById("homeGoals");
  if (goalsNode) {
    goalsNode.innerHTML = goals.map(([label, value]) => `<div class="home-goal-row">
      <span>✓ ${label}</span>
      <b>${value}%</b>
      <i style="--value:${value}%"><em></em></i>
    </div>`).join("");
  }
}

function showBodyZone(zone) {
  const meta = bodyZoneMeta[zone] || bodyZoneMeta.core;
  const detail = document.getElementById("zoneDetail");
  if (detail) detail.innerHTML = `<strong>${meta.label}</strong><span>${meta.state}</span><p>${meta.detail}</p>`;
  haptic();
}

function renderFitnessMetrics() {
  const totals = mealTotals();
  document.getElementById("calorieRing").textContent = Math.round(totals.calories);
  document.getElementById("waterRing").textContent = `${state.nutrition.water.toFixed(2).replace(".", ",")}L`;
  document.getElementById("stepRing").textContent = state.watch.steps >= 1000 ? `${(state.watch.steps / 1000).toFixed(1)}k` : state.watch.steps;
  document.querySelectorAll(".ring")[1]?.style.setProperty("--value", Math.min(100, Math.round((totals.calories / state.nutrition.target) * 100)));
  document.querySelectorAll(".ring")[2]?.style.setProperty("--value", Math.min(100, Math.round((state.watch.steps / state.watch.stepGoal) * 100)));
  document.querySelectorAll(".ring")[3]?.style.setProperty("--value", Math.min(100, Math.round((state.nutrition.water / state.nutrition.waterTarget) * 100)));
  document.getElementById("homeCalories").textContent = `${totals.calories}/${state.nutrition.target}`;
  document.getElementById("homeSteps").textContent = state.watch.steps >= 1000 ? `${(state.watch.steps / 1000).toFixed(1)}k` : state.watch.steps;
  document.getElementById("homeWater").textContent = `${state.nutrition.water.toFixed(1)} L`;
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
    state.selectedGroup = "Tous";
    saveState();
    renderPlaceTabs();
    renderWorkoutTabs();
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
    <article class="exercise-card premium-exercise" data-exercise="${exercise.id}">
      <button type="button" class="exercise-open" aria-label="Ouvrir ${exercise.name}">
        <div class="demo-video muscle-${exercise.group.toLowerCase()}">
          <span class="mini-head"></span>
          <span class="mini-body"></span>
          <span class="mini-limb"></span>
          <span class="mini-muscle"></span>
        </div>
        <div class="exercise-copy">
          <strong>${exercise.name}</strong>
          <p>${exercise.place === "salle" ? "Salle" : "Maison"} · ${exercise.level} · ${exercise.primary}</p>
          <p>${exercise.description}</p>
          <small>Voir la fiche détaillée</small>
        </div>
      </button>
      <button type="button" class="exercise-start" data-start-exercise="${exercise.id}">Démarrer</button>
    </article>
  `).join("");
  list.querySelectorAll(".exercise-open").forEach((button) => button.addEventListener("click", () => {
    const card = button.closest("[data-exercise]");
    openExerciseModal(exerciseLibrary.find((exercise) => exercise.id === card.dataset.exercise));
  }));
  list.querySelectorAll("[data-start-exercise]").forEach((button) => button.addEventListener("click", () => {
    const exercise = exerciseLibrary.find((item) => item.id === button.dataset.startExercise);
    if (!exercise) return;
    state.todayWorkout.push({ id: exercise.id, name: exercise.name, sets: exercise.sets, reps: exercise.reps, rest: exercise.rest });
    saveState();
    renderDashboard();
    addMessage(`${exercise.name} ajouté à ton entraînement du jour.`, "ai");
    haptic();
  }));
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

function renderHoloMode() {
  document.body.classList.toggle("classic-mode", !state.holoMode);
  document.body.classList.toggle("holo-mode", state.holoMode);
  const toggle = document.getElementById("holoModeToggle");
  toggle.textContent = state.holoMode ? "HUD" : "CLASSIC";
  toggle.setAttribute("aria-pressed", String(state.holoMode));
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
  const todayTasks = state.tasks.map(normalizeTask).filter((task) => task.date === todayISO() || task.repeat === "daily");
  const high = todayTasks.sort((a, b) => b.priority - a.priority || a.time.localeCompare(b.time))[0];
  if (text.includes("planifie") || text.includes("planning") || text.includes("réorganise") || text.includes("reorganise") || text.includes("créneau") || text.includes("creneau")) {
    if (text.includes("marche")) return "Je te conseille de placer la marche après le travail, car elle est moins urgente et aide à récupérer avant la soirée.";
    if (text.includes("vélo") || text.includes("velo")) return "Le meilleur créneau vélo est samedi matin ou aujourd'hui vers 17:30 si ton travail est terminé.";
    if (high) return `Ta tâche la plus importante aujourd'hui est ${high.title} à ${high.time}. Je garderais les tâches critiques tôt et je déplacerais une tâche faible si la journée est trop chargée.`;
    return "Je peux créer une journée équilibrée avec travail, sport, repas, prière et repos.";
  }
  if (text.includes("photo") || text.includes("repas") || text.includes("calorie")) return `Je peux estimer ton repas, puis tu peux corriger les valeurs. Aujourd'hui : ${totals.calories}/${state.nutrition.target} kcal, protéines ${totals.protein}/${state.nutrition.proteinTarget}g.`;
  if (text.includes("maison") || text.includes("remplace")) return "Alternative maison : pompes classiques, pompes inclinées, pompes déclinées, pompes avec sac à dos ou développé au sol avec haltères.";
  if (text.includes("séance") || text.includes("seance")) return `Je te propose ${state.profile.frequency || 3} séances/semaine avec ${state.selectedPlace === "maison" ? "pompes, fentes, gainage et pont fessier" : "presse, rowing, développé couché et tirage vertical"}.`;
  if (text.includes("objectif")) return `Ta cible actuelle : ${state.nutrition.target} kcal, ${state.nutrition.proteinTarget}g protéines, ${state.nutrition.waterTarget} L d'eau et ${state.watch.stepGoal} pas.`;
  return "Je peux adapter ton entraînement, estimer un repas, corriger tes macros ou ajuster tes objectifs selon ton poids et tes pas.";
}

function buildNexusContext() {
  const data = getHomeDailyData();
  const todayTasks = state.tasks.map(normalizeTask).filter((task) => task.date === todayISO() || task.repeat === "daily");
  const nextTask = todayTasks.find((task) => !task.done);
  const criticalTask = todayTasks.find((task) => task.priority >= 5);
  return {
    water: `${data.hydration.current.toFixed(1)} L / ${data.hydration.target} L`,
    sleepScore: data.sleep.score,
    snoring: "faible",
    steps: state.watch.steps,
    activeCalories: state.watch.activeCalories,
    trainedMuscles: ["bras", "pectoraux", "épaules"],
    nutrition: {
      calories: data.nutrition.calories,
      target: data.nutrition.targetCalories,
      protein: data.nutrition.protein,
      proteinTarget: data.nutrition.proteinTarget
    },
    planning: {
      nextTask: nextTask ? `${nextTask.title} à ${nextTask.time}` : "Aucune tâche restante",
      criticalTask: criticalTask ? `${criticalTask.title} à ${criticalTask.time}` : "Aucune tâche critique"
    },
    native: {
      capacitor: isNativeApp(),
      lastMealPhotoAvailable: Boolean(lastMealPhoto)
    }
  };
}

async function askNexusAI(message) {
  try {
    const response = await fetch("/api/nexus-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context: buildNexusContext(), mealPhoto: lastMealPhoto })
    });
    if (!response.ok) throw new Error("Backend Nexus IA indisponible");
    const data = await response.json();
    return data.reply || nexusReply(message);
  } catch {
    return nexusReply(message);
  }
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
    haptic();
  }));

  document.getElementById("holoModeToggle").addEventListener("click", () => {
    state.holoMode = !state.holoMode;
    saveState();
    renderHoloMode();
    haptic();
  });

  document.getElementById("nexusCore").addEventListener("click", () => {
    state.fitnessView = "fitnessDashboardView";
    saveState();
    document.querySelectorAll(".tabbar button").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    document.querySelector('[data-screen="aiScreen"]').classList.add("active");
    document.getElementById("aiScreen").classList.add("active");
    addMessage("Analyse rapide : je surveille tes calories, tes pas, ton eau et ton focus. Tu peux me demander un entraînement, un repas ou un planning.", "ai");
    haptic();
  });

  document.querySelectorAll("[data-screen-jump]").forEach((button) => button.addEventListener("click", () => {
    const target = button.dataset.screenJump;
    document.querySelectorAll(".tabbar button").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    document.querySelector(`[data-screen="${target}"]`)?.classList.add("active");
    document.getElementById(target).classList.add("active");
    if (button.dataset.fitnessJump) {
      state.fitnessView = button.dataset.fitnessJump;
      saveState();
      renderFitnessViews();
    }
    haptic();
  }));

  document.querySelectorAll(".fitness-tabs button").forEach((button) => button.addEventListener("click", () => {
    state.fitnessView = button.dataset.fitnessView;
    saveState();
    renderFitnessViews();
    haptic();
  }));

  document.querySelectorAll("[data-planner-view]").forEach((button) => button.addEventListener("click", () => {
    state.plannerView = button.dataset.plannerView;
    saveState();
    renderTasks();
    haptic();
  }));

  document.getElementById("openTaskPanel").addEventListener("click", () => {
    document.getElementById("taskForm").classList.remove("collapsed");
    haptic();
  });

  document.getElementById("closeTaskPanel").addEventListener("click", () => {
    document.getElementById("taskForm").classList.add("collapsed");
    haptic();
  });

  document.querySelectorAll("[data-ai-plan]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.aiPlan === "balanced") {
      state.tasks = [
        { title: "Prière du matin", category: "priere", time: "05:00", duration: 20, priority: 3, reminder: 15, repeat: "daily", note: "Commencer calmement." },
        { title: "Marche", category: "marche", time: "06:00", duration: 30, priority: 2, reminder: 15, repeat: "daily", note: "Activer le corps." },
        { title: "Travail profond", category: "travail", time: "08:00", duration: 180, priority: 4, reminder: 30, repeat: "once", note: "Priorité principale." },
        { title: "Repas", category: "repas", time: "12:00", duration: 45, priority: 3, reminder: 5, repeat: "daily", note: "Manger propre." },
        { title: "Vélo", category: "velo", time: "17:30", duration: 45, priority: 2, reminder: 15, repeat: "weekly", note: "Cardio." },
        { title: "Salle / fitness", category: "fitness", time: "18:30", duration: 75, priority: 3, reminder: 15, repeat: "weekly", note: "Pectoraux & triceps." },
        { title: "Sommeil", category: "sommeil", time: "22:30", duration: 480, priority: 5, reminder: 30, repeat: "daily", note: "Récupération critique." }
      ].map((task) => normalizeTask({ ...task, id: uid(), date: todayISO(), done: false, status: "todo" }));
      addMessage("J'ai créé une journée équilibrée avec prière, marche, travail, repas, vélo, salle et sommeil.", "ai");
    } else {
      state.tasks = state.tasks.map(normalizeTask).sort((a, b) => b.priority - a.priority || a.time.localeCompare(b.time));
      addMessage("J'ai réorganisé les tâches : les priorités critiques et très importantes remontent en haut.", "ai");
    }
    saveState();
    renderTasks();
  }));

  document.querySelectorAll(".modal-tabs button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".modal-tabs button").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".modal-panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.modalTab).classList.add("active");
    haptic();
  }));

  document.getElementById("exerciseSearch").addEventListener("input", renderExercises);
  document.getElementById("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.getElementById("taskTitle");
    state.tasks.push(normalizeTask({
      id: uid(),
      title: title.value.trim(),
      category: document.getElementById("taskCategory").value,
      date: document.getElementById("taskDate").value || todayISO(),
      time: document.getElementById("taskTime").value,
      duration: Number(document.getElementById("taskDuration").value || 30),
      priority: Number(document.getElementById("taskPriority").value || 2),
      reminder: Number(document.getElementById("taskReminder").value || 0),
      repeat: document.getElementById("taskRepeat").value,
      note: document.getElementById("taskNote").value,
      status: "todo",
      done: false
    }));
    title.value = "";
    document.getElementById("taskNote").value = "";
    document.getElementById("taskForm").classList.add("collapsed");
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
    const homeData = getHomeDailyData();
    homeData.nutrition.calories += macros.calories;
    homeData.nutrition.protein += macros.protein;
    homeData.nutrition.carbs += macros.carbs;
    homeData.nutrition.fat += macros.fat;
    homeData.digestion.lastMeal = new Intl.DateTimeFormat("fr-CA", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    homeData.digestion.nextDigestion = "dans 2h15";
    document.getElementById("foodText").value = "";
    document.getElementById("foodCalories").value = "";
    document.getElementById("foodPhoto").value = "";
    renderNutrition();
    renderHomeDashboard();
    addMessage(`Repas ajouté : ${macros.calories} kcal estimées. Tu peux corriger les valeurs si besoin.`, "ai");
  });

  document.getElementById("aiEstimateFood").addEventListener("click", async () => {
    const macros = estimateMacros(document.getElementById("foodText").value || "repas moyen", Number(document.getElementById("foodPortion").value || 1));
    document.getElementById("foodCalories").value = macros.calories;
    addMessage(await askNexusAI(`Analyse mon repas : ${document.getElementById("foodText").value || "repas moyen"}`), "ai");
  });

  document.querySelectorAll("[data-water]").forEach((button) => button.addEventListener("click", () => {
    state.nutrition.water = Math.min(8, Number((state.nutrition.water + Number(button.dataset.water)).toFixed(2)));
    getHomeDailyData().hydration.current = state.nutrition.water;
    saveState();
    renderNutrition();
    renderHomeDashboard();
  }));

  document.querySelectorAll("[data-home-water]").forEach((button) => button.addEventListener("click", () => {
    const data = getHomeDailyData();
    data.hydration.current = Math.min(8, Number((data.hydration.current + Number(button.dataset.homeWater)).toFixed(2)));
    state.nutrition.water = data.hydration.current;
    saveState();
    renderHomeDashboard();
    renderNutrition();
    renderFitnessMetrics();
  }));

  document.getElementById("homeAddWater")?.addEventListener("click", () => {
    document.querySelector('[data-home-water="0.5"]')?.click();
  });

  document.getElementById("openHomeMeal")?.addEventListener("click", () => {
    document.getElementById("homeMealForm")?.classList.toggle("collapsed");
    haptic();
  });

  document.getElementById("homeMealForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = getHomeDailyData();
    const name = document.getElementById("homeMealName").value.trim() || "Repas ajouté";
    const calories = Number(document.getElementById("homeMealCalories").value || 520);
    const macros = estimateMacros(name, 1);
    macros.calories = calories;
    data.nutrition.calories += calories;
    data.nutrition.protein += macros.protein;
    data.nutrition.carbs += macros.carbs;
    data.nutrition.fat += macros.fat;
    state.nutrition.meals.push({ id: uid(), name, portion: 1, source: "Accueil Nexus", ...macros });
    data.digestion.lastMeal = new Intl.DateTimeFormat("fr-CA", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    data.digestion.nextDigestion = "dans 2h15";
    document.getElementById("homeMealName").value = "";
    document.getElementById("homeMealCalories").value = "";
    document.getElementById("homeMealForm").classList.add("collapsed");
    saveState();
    renderHomeDashboard();
    renderNutrition();
    addMessage(`${name} ajouté depuis l'accueil : ${calories} kcal estimées.`, "ai");
  });

  document.getElementById("homeEstimateMeal")?.addEventListener("click", async () => {
    const mealName = document.getElementById("homeMealName");
    const mealCalories = document.getElementById("homeMealCalories");
    document.getElementById("homeMealForm")?.classList.remove("collapsed");
    if (mealName && !mealName.value) mealName.value = "Saumon, riz, légumes";
    if (mealCalories) mealCalories.value = 520;
    addMessage(await askNexusAI("Estime les calories de mon repas et propose les macros."), "ai");
    haptic();
  });

  document.getElementById("homeMealPhoto")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    document.getElementById("homeMealForm")?.classList.remove("collapsed");
    document.getElementById("homeMealName").value = `Photo : ${file.name}`;
    document.getElementById("homeMealCalories").value = 520;
    addMessage("Photo reçue. Sans backend IA réel, Nexus prépare une estimation simulée modifiable.", "ai");
  });

  document.querySelector(".home-file")?.addEventListener("click", async (event) => {
    if (!isNativeApp()) return;
    event.preventDefault();
    const photo = await captureMealPhoto("homeMealPhoto");
    if (!photo) return;
    document.getElementById("homeMealForm")?.classList.remove("collapsed");
    document.getElementById("homeMealName").value = "Photo du repas";
    document.getElementById("homeMealCalories").value = 520;
    addMessage(await askNexusAI("Estime les calories de cette photo de repas."), "ai");
  });

  document.getElementById("homeRecommendations")?.addEventListener("click", () => {
    document.getElementById("homeRecommendationsPanel")?.classList.toggle("collapsed");
    haptic();
  });

  document.querySelectorAll("[data-zone]").forEach((button) => button.addEventListener("click", () => showBodyZone(button.dataset.zone)));

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

  document.querySelectorAll(".watch-actions button").forEach((button) => button.addEventListener("click", async () => {
    state.watch.connected = true;
    state.watch.provider = button.dataset.watch;
    const health = await readNativeHealthData();
    state.watch.steps = Math.max(state.watch.steps, health.steps || 9200);
    state.watch.activeCalories = Math.max(state.watch.activeCalories, health.activeCalories || 480);
    state.watch.distance = Number(health.distance || state.watch.distance);
    saveState();
    renderWatch();
    renderDashboard();
    renderHomeDashboard();
    addMessage(`${state.watch.provider} synchronisé : ${state.watch.steps} pas, ${state.watch.activeCalories} kcal actives. Source : ${health.source}.`, "ai");
  }));
  document.getElementById("syncSteps").addEventListener("click", async () => {
    const health = isNativeApp() ? await readNativeHealthData() : null;
    state.watch.steps = health?.steps || Number(document.getElementById("manualSteps").value || 0);
    state.watch.stepGoal = Number(document.getElementById("stepGoal").value || 10000);
    state.watch.distance = Number((health?.distance || state.watch.steps * 0.00075).toFixed(1));
    state.watch.activeCalories = Math.round(health?.activeCalories || state.watch.steps * 0.045);
    saveState();
    renderWatch();
    renderDashboard();
    renderHomeDashboard();
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
  document.getElementById("chatForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    addMessage(await askNexusAI(text), "ai");
    input.value = "";
  });
  document.querySelectorAll(".quick-actions button").forEach((button) => button.addEventListener("click", async () => {
    const prompt = button.dataset.prompt;
    addMessage(prompt, "user");
    addMessage(await askNexusAI(prompt), "ai");
  }));
  document.querySelectorAll(".ai-command-actions [data-prompt]").forEach((button) => button.addEventListener("click", async () => {
    const prompt = button.dataset.prompt;
    addMessage(prompt, "user");
    addMessage(await askNexusAI(prompt), "ai");
  }));
  document.getElementById("aiPhotoButton")?.addEventListener("click", async () => {
    const photo = await captureMealPhoto("aiMealPhoto");
    if (!photo) return;
    const preview = document.getElementById("aiMealPreview");
    preview.src = photo;
    preview.style.display = "block";
    addMessage("Photo du plat reçue.", "user");
    addMessage(await askNexusAI("Estime les calories de cette photo de repas."), "ai");
  });
  document.getElementById("aiMealPhoto")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = document.getElementById("aiMealPreview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    addMessage("Photo du plat reçue.", "user");
    addMessage(await askNexusAI("Estime les calories de cette photo de repas."), "ai");
  });
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

function haptic() {
  if (navigator.vibrate) navigator.vibrate(12);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => console.info("Service worker non disponible sur cette origine."));
}

setInterval(() => {
  const rate = 76 + Math.round(Math.sin(Date.now() / 900) * 5);
  document.getElementById("heartRate").textContent = rate;
  document.getElementById("homeHeart").textContent = `${rate} bpm`;
}, 900);

calculateCalorieTarget();
setToday();
document.getElementById("taskDate").value = todayISO();
setupEvents();
renderHoloMode();
renderHomeDashboard();
renderTasks();
renderPlannerCategories();
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
