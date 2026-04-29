const bodyState = {
  brain: "active",
  shoulders: "high",
  arms: "high",
  chest: "medium",
  core: "normal",
  stomach: "digesting",
  legs: "normal",
  calves: "low",
  cardio: "good",
  hydration: {
    current: 1.0,
    target: 2.5
  }
};

const exerciseMuscles = {
  "Développé couché": {
    primary: ["chest"],
    secondary: ["arms", "shoulders"]
  },
  "Squat": {
    primary: ["legs"],
    secondary: ["core", "calves"]
  },
  "Pompes": {
    primary: ["chest", "arms"],
    secondary: ["shoulders", "core"]
  },
  "Gainage": {
    primary: ["core"],
    secondary: ["shoulders"]
  },
  "Vélo": {
    primary: ["legs", "cardio"],
    secondary: ["calves"]
  },
  "Presse à jambes": {
    primary: ["legs"],
    secondary: ["calves", "core"]
  },
  "Rowing": {
    primary: ["shoulders", "arms"],
    secondary: ["core"]
  },
  "Tirage vertical": {
    primary: ["arms", "shoulders"],
    secondary: ["core"]
  }
};

const zoneLabels = {
  brain: "Cerveau / mental",
  shoulders: "Épaules",
  arms: "Bras",
  chest: "Pectoraux",
  core: "Abdominaux / core",
  stomach: "Ventre / digestion",
  legs: "Jambes",
  calves: "Mollets",
  cardio: "Cardio / cœur"
};

const zoneMessages = {
  normal: "État normal.",
  good: "Bonne récupération.",
  medium: "Zone sollicitée, récupération légère conseillée.",
  high: "Très sollicitée : évite de charger cette zone demain.",
  active: "Mental actif.",
  digesting: "Digestion active.",
  low: "Peu sollicitée."
};

function resetBodyZones() {
  document.querySelectorAll(".body-svg .body-zone").forEach((zone) => {
    zone.classList.remove("zone-normal", "zone-good", "zone-medium", "zone-high", "zone-active", "zone-digesting", "zone-low", "selected");
    zone.classList.add("zone-normal");
  });
}

function applyZoneState(zoneName, state) {
  const normalized = state === "low" ? "normal" : state;
  document.querySelectorAll(`[data-body-zone="${zoneName}"]`).forEach((zone) => {
    zone.classList.remove("zone-normal", "zone-good", "zone-medium", "zone-high", "zone-active", "zone-digesting", "zone-low");
    zone.classList.add(`zone-${normalized}`);
    zone.dataset.state = state;
  });
}

function updateBodyMap(nextState = bodyState) {
  Object.assign(bodyState, nextState);
  resetBodyZones();
  ["brain", "shoulders", "arms", "chest", "core", "stomach", "legs", "calves", "cardio"].forEach((zone) => {
    applyZoneState(zone, bodyState[zone] || "normal");
  });
  setHydration(bodyState.hydration.current, bodyState.hydration.target, false);
}

function selectBodyZone(zone) {
  document.querySelectorAll(".body-svg .body-zone").forEach((item) => item.classList.remove("selected"));
  document.querySelectorAll(`[data-body-zone="${zone}"]`).forEach((item) => item.classList.add("selected"));
  showZoneDetails(zone);
}

function showZoneDetails(zone) {
  const current = bodyState[zone] || "normal";
  const label = zoneLabels[zone] || zone;
  const message = zoneMessages[current] || zoneMessages.normal;
  const text = `${label} : ${message}`;
  const primary = document.getElementById("zoneDetails");
  const secondary = document.getElementById("zoneDetail");
  if (primary) primary.textContent = text;
  if (secondary) secondary.textContent = text;
}

function setWorkoutZones(exerciseName) {
  resetBodyZones();
  Object.keys(bodyState).forEach((key) => {
    if (typeof bodyState[key] === "string") bodyState[key] = "normal";
  });
  bodyState.brain = "active";
  bodyState.cardio = "good";
  bodyState.stomach = "digesting";

  const exercise = exerciseMuscles[exerciseName];
  if (!exercise) return;

  exercise.primary.forEach((zone) => {
    bodyState[zone] = "high";
    applyZoneState(zone, "high");
  });
  exercise.secondary.forEach((zone) => {
    bodyState[zone] = bodyState[zone] === "high" ? "high" : "medium";
    applyZoneState(zone, bodyState[zone]);
  });
  applyZoneState("brain", bodyState.brain);
  applyZoneState("cardio", bodyState.cardio);
  applyZoneState("stomach", bodyState.stomach);

  const text = `${exerciseName} : muscles principaux en rouge, muscles secondaires en orange.`;
  const primary = document.getElementById("zoneDetails");
  const secondary = document.getElementById("zoneDetail");
  if (primary) primary.textContent = text;
  if (secondary) secondary.textContent = text;
}

function setHydration(current, target, updateState = true) {
  if (updateState) bodyState.hydration = { current, target };
  const percent = current / Math.max(target, 0.1);
  const remaining = Math.max(0, target - current).toFixed(1);
  const text = percent < 0.5
    ? `Hydratation faible : bois encore ${remaining} L.`
    : `Hydratation correcte : ${current} L / ${target} L.`;
  document.getElementById("zoneDetails") && (document.getElementById("zoneDetails").textContent = text);
  document.getElementById("zoneDetail") && (document.getElementById("zoneDetail").textContent = text);
  document.getElementById("bodyMap")?.classList.toggle("hydration-low", percent < 0.5);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".body-svg .body-zone").forEach((zone) => {
    zone.addEventListener("click", () => selectBodyZone(zone.dataset.bodyZone));
  });
  updateBodyMap(bodyState);
});

window.bodyState = bodyState;
window.exerciseMuscles = exerciseMuscles;
window.updateBodyMap = updateBodyMap;
window.selectBodyZone = selectBodyZone;
window.showZoneDetails = showZoneDetails;
window.setWorkoutZones = setWorkoutZones;
window.setHydration = setHydration;
