const categoryColors = {
  fitness: "#a6ff4d",
  travail: "#25f3ff",
  sommeil: "#b89cff",
  focus: "#ffd166",
  perso: "#ff7a59"
};

const defaultTasks = [
  { id: "t-1", title: "Préparer le plan de cours", category: "travail", time: "09:00", done: true },
  { id: "t-2", title: "Séance force haut du corps", category: "fitness", time: "12:30", done: false },
  { id: "t-3", title: "Bloc focus réseaux sociaux", category: "focus", time: "14:00", done: true },
  { id: "t-4", title: "Révision du cahier des charges", category: "travail", time: "16:15", done: false },
  { id: "t-5", title: "Routine sommeil sans écran", category: "sommeil", time: "22:30", done: false }
];

const defaultState = {
  tasks: defaultTasks,
  sleep: { bedTime: "23:20", wakeTime: "06:48", score: 82 },
  selectedWorkout: "Force",
  blockedApps: {
    Instagram: true,
    TikTok: true,
    X: true,
    Facebook: true,
    Snapchat: false,
    YouTube: false
  },
  focus: { active: false, end: "19:30", startedAt: null },
  chat: [
    {
      who: "ai",
      text: "Je suis branché sur ton agenda, ton sommeil, ton fitness et ton mode focus. Quelle action veux-tu optimiser maintenant ?"
    }
  ]
};

const exercises = {
  Force: [
    ["Développé couché", "Pectoraux · 4 séries de 8", "Garde les omoplates serrées, descente contrôlée."],
    ["Rowing barre", "Dos · 4 séries de 10", "Dos neutre, tire les coudes vers l'arrière."],
    ["Presse à jambes", "Jambes · 4 séries de 12", "Amplitude stable, genoux alignés avec les pieds."]
  ],
  Cardio: [
    ["Tapis incliné", "Cardio · 20 min", "Rythme constant, respiration nasale si possible."],
    ["Rameur", "Full body · 8 x 250 m", "Pousse avec les jambes avant de tirer les bras."],
    ["Vélo fractionné", "Cardio · 10 cycles", "30 s intense, 60 s récupération."]
  ],
  HIIT: [
    ["Burpees", "HIIT · 5 x 40 s", "Atterrissage souple, cadence propre."],
    ["Kettlebell swing", "Chaîne postérieure · 5 x 15", "Mouvement de hanches, pas de squat profond."],
    ["Battle rope", "Épaules/Cardio · 6 x 30 s", "Buste gainé, rythme explosif."]
  ],
  "Full body": [
    ["Squat goblet", "Jambes · 4 x 12", "Torse haut, charge proche du corps."],
    ["Tractions assistées", "Dos · 4 x 8", "Contrôle la descente, menton au-dessus de la barre."],
    ["Farmer walk", "Grip/Gainage · 5 x 30 m", "Épaules basses, marche stable."]
  ],
  Mobilité: [
    ["Ouverture de hanches", "Mobilité · 8 min", "Respire lentement, amplitude progressive."],
    ["Rotation thoracique", "Dos · 3 x 10", "Mouvement lent, bassin stable."],
    ["Étirement mollets", "Chevilles · 3 x 45 s", "Talon au sol, tension confortable."]
  ]
};

const socialApps = ["Instagram", "TikTok", "X", "Facebook", "Snapchat", "YouTube"];
const storageKey = "nexus-pwa-state-v1";
let focusInterval;
let state = loadState();

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return structuredCloneSafe(defaultState);
    return { ...structuredCloneSafe(defaultState), ...JSON.parse(saved) };
  } catch {
    return structuredCloneSafe(defaultState);
  }
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
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
    item.innerHTML = `
      <span class="task-color"></span>
      <div>
        <strong>${task.title}</strong>
        <small>${task.time} · ${task.category}</small>
      </div>
      <button title="Changer le statut">${task.done ? "↺" : "✓"}</button>
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
}

function renderExercises(type = state.selectedWorkout) {
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";
  exercises[type].forEach(([name, meta, cue]) => {
    const card = document.createElement("article");
    card.className = "exercise-card";
    card.innerHTML = `
      <div class="demo-video" aria-label="Démonstration animée ${name}"></div>
      <div>
        <strong>${name}</strong>
        <p>${meta}</p>
        <p>${cue}</p>
      </div>
    `;
    list.appendChild(card);
  });
}

function renderSleep() {
  document.getElementById("bedTime").value = state.sleep.bedTime;
  document.getElementById("wakeTime").value = state.sleep.wakeTime;
  renderSleepHistory();
}

function renderSleepHistory() {
  const history = document.getElementById("sleepHistory");
  const values = [78, 84, 61, 89, 73, state.sleep.score, 69];
  history.innerHTML = values
    .map((value) => {
      const color = value >= 80 ? "#a6ff4d" : value >= 70 ? "#ffd166" : "#ff7a59";
      return `<span style="--height:${value}%;--sleep-color:${color}" title="${value}%"></span>`;
    })
    .join("");
}

function renderApps() {
  const list = document.getElementById("appToggleList");
  list.innerHTML = "";
  socialApps.forEach((app) => {
    const row = document.createElement("label");
    row.className = "app-row";
    row.innerHTML = `
      <span>${app}</span>
      <span class="switch">
        <input type="checkbox" ${state.blockedApps[app] ? "checked" : ""} />
        <span></span>
      </span>
    `;
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
  const remaining = state.tasks.filter((task) => !task.done).map((task) => task.title);
  const activeApps = Object.entries(state.blockedApps).filter(([, active]) => active).map(([app]) => app);

  if (text.includes("séance") || text.includes("seance")) {
    return "Je te propose 45 min : 8 min échauffement, développé couché 4x8, rowing 4x10, presse 4x12, puis 6 min retour au calme.";
  }
  if (text.includes("dormir") || text.includes("sommeil")) {
    return `Avec ton score de ${state.sleep.score}, vise 23:05 ce soir. Coupe ${activeApps.slice(0, 3).join(", ")} 45 min avant pour protéger ta récupération.`;
  }
  if (text.includes("réorganise") || text.includes("reorganise")) {
    return `Je garderais le focus profond maintenant, puis je placerais "${remaining[0] || "ta prochaine tâche"}" avant la séance fitness. Charge du jour correcte.`;
  }
  return "J'ai ton contexte : tâches restantes, sommeil, fitness et focus. Mon conseil : finis une tâche courte, lance 50 min de blocage, puis garde l'entraînement en version compacte.";
}

function startFocus() {
  const master = document.getElementById("masterFocus");
  const focusState = document.getElementById("focusState");
  const end = document.getElementById("focusEnd").value;
  const selectedApps = Object.entries(state.blockedApps).filter(([, active]) => active).map(([app]) => app);
  const accepted = window.confirm(`Approuver volontairement une session focus jusqu'à ${end} pour limiter : ${selectedApps.join(", ")} ?`);
  if (!accepted) return;

  state.focus = { active: true, end, startedAt: new Date().toISOString() };
  master.checked = true;
  focusState.textContent = "Session focus active";
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
  if (target < now && state.focus.startedAt) target.setDate(target.getDate() + 1);
  const diff = target - now;

  if (diff <= 0) {
    state.focus.active = false;
    saveState();
    updateFocusTimer();
    return;
  }

  const totalMinutes = Math.max(0, Math.floor(diff / 60000));
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  master.checked = true;
  focusState.textContent = "Session focus active";
  focusTimer.textContent = `${h} h ${m} min restantes · apps limitées volontairement`;
}

function setupTabs() {
  document.querySelectorAll(".tabbar button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tabbar button").forEach((tab) => tab.classList.remove("active"));
      document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.screen).classList.add("active");
    });
  });
}

function setupForms() {
  document.getElementById("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.getElementById("taskTitle");
    state.tasks.push({
      id: uid(),
      title: title.value.trim(),
      category: document.getElementById("taskCategory").value,
      time: document.getElementById("taskTime").value,
      done: false
    });
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

  document.getElementById("workoutSelect").value = state.selectedWorkout;
  document.getElementById("workoutSelect").addEventListener("change", (event) => {
    state.selectedWorkout = event.target.value;
    saveState();
    renderExercises(event.target.value);
  });

  document.getElementById("sleepForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.sleep.bedTime = document.getElementById("bedTime").value;
    state.sleep.wakeTime = document.getElementById("wakeTime").value;
    state.sleep.score = Math.min(96, Math.max(58, state.sleep.score + 1));
    saveState();
    renderSleep();
    addMessage(`Sommeil enregistré : coucher ${state.sleep.bedTime}, réveil ${state.sleep.wakeTime}.`, "ai");
  });

  document.getElementById("focusEnd").value = state.focus.end;
  document.getElementById("focusEnd").addEventListener("change", (event) => {
    state.focus.end = event.target.value;
    saveState();
  });
  document.getElementById("startFocus").addEventListener("click", startFocus);

  document.getElementById("masterFocus").addEventListener("change", (event) => {
    if (!event.target.checked) {
      const accepted = window.confirm("Arrêter volontairement la session focus maintenant ?");
      if (!accepted) {
        event.target.checked = true;
        return;
      }
      clearInterval(focusInterval);
      state.focus.active = false;
      saveState();
      updateFocusTimer();
      addMessage("Session focus arrêtée. Note pourquoi tu l'as arrêtée pour améliorer ta prochaine session.", "ai");
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

  document.querySelectorAll(".quick-actions button").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.dataset.prompt;
      addMessage(prompt, "user");
      addMessage(nexusReply(prompt), "ai");
    });
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {
    console.info("Service worker non disponible sur cette origine. Utilise une URL HTTPS ou localhost.");
  });
}

setInterval(() => {
  const rate = 76 + Math.round(Math.sin(Date.now() / 900) * 5);
  document.getElementById("heartRate").textContent = rate;
}, 900);

setToday();
setupTabs();
setupForms();
renderTasks();
renderExercises();
renderSleep();
renderApps();
renderChat();
updateFocusTimer();
if (state.focus.active) focusInterval = setInterval(updateFocusTimer, 1000);
registerServiceWorker();
