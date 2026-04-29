let audioContext;
let analyser;
let microphone;
let sleepInterval;
let sleepStream;

let sleepSession = {
  startTime: null,
  endTime: null,
  samples: [],
  snoreEvents: [],
  averageDb: 0,
  maxDb: 0,
  snoreMinutes: 0,
  snoreLevel: "Faible",
  sleepQuality: 0
};

async function startSleepTracking() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Micro non disponible");
    }
    sleepStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(sleepStream);
    analyser.fftSize = 2048;
    microphone.connect(analyser);

    sleepSession = {
      startTime: new Date().toISOString(),
      endTime: null,
      samples: [],
      snoreEvents: [],
      averageDb: 0,
      maxDb: 0,
      snoreMinutes: 0,
      snoreLevel: "Faible",
      sleepQuality: 0
    };

    clearInterval(sleepInterval);
    sleepInterval = setInterval(analyzeAudio, 1000);
    setText("snoreResult", "Suivi du sommeil démarré. Audio analysé localement.");
    setText("noiseResult", "Bruit moyen : mesure en cours...");
    renderSleepDashboard();
  } catch {
    setText("snoreResult", "Permission micro refusée ou non disponible.");
  }
}

function analyzeAudio() {
  if (!analyser) return;
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const value = (data[i] - 128) / 128;
    sum += value * value;
  }
  const rms = Math.sqrt(sum / data.length);
  const estimatedDb = Math.max(0, Math.round(20 * Math.log10(rms + 0.00001) + 90));
  sleepSession.samples.push({ time: new Date().toISOString(), db: estimatedDb });
  detectSnoring(estimatedDb);
  renderSleepDashboard();
}

function detectSnoring(estimatedDb) {
  if (estimatedDb <= 50) return;
  const recent = sleepSession.samples.slice(-8).map((sample) => sample.db);
  const highPeaks = recent.filter((db) => db > 50).length;
  const repetitive = highPeaks >= 3;
  sleepSession.snoreEvents.push({
    time: new Date().toISOString(),
    db: estimatedDb,
    probableSnore: repetitive
  });
}

function calculateSleepScore() {
  const samples = sleepSession.samples.map((sample) => sample.db);
  const average = samples.reduce((sum, db) => sum + db, 0) / Math.max(samples.length, 1);
  const maxDb = Math.max(...samples, 0);
  const probableSnores = sleepSession.snoreEvents.filter((event) => event.probableSnore).length;
  const snoreMinutes = Math.round(probableSnores / 60);
  let snoreLevel = "Faible";
  if (probableSnores > 60) snoreLevel = "Moyen";
  if (probableSnores > 180) snoreLevel = "Élevé";

  let score = 100;
  if (snoreLevel === "Moyen") score -= 10;
  if (snoreLevel === "Élevé") score -= 25;
  if (average > 45) score -= 10;
  if (average > 55) score -= 10;
  if (maxDb > 70) score -= 10;
  if (sleepSession.snoreEvents.length > 120) score -= 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  sleepSession.averageDb = Math.round(average);
  sleepSession.maxDb = maxDb;
  sleepSession.snoreMinutes = snoreMinutes;
  sleepSession.snoreLevel = snoreLevel;
  sleepSession.sleepQuality = score;
  return score;
}

function stopSleepTracking() {
  clearInterval(sleepInterval);
  sleepInterval = null;
  sleepSession.endTime = new Date().toISOString();
  calculateSleepScore();
  if (sleepStream) sleepStream.getTracks().forEach((track) => track.stop());
  if (audioContext) audioContext.close();
  saveSleepSession();
  renderSleepDashboard();
}

function renderSleepDashboard() {
  const score = sleepSession.samples.length ? calculateSleepScore() : sleepSession.sleepQuality || "--";
  setText("sleepScore", score);
  setText("snoreResult", `Ronflements : ${sleepSession.snoreMinutes || 0} min estimées — niveau ${sleepSession.snoreLevel || "Faible"}`);
  setText("noiseResult", `Bruit moyen : ${sleepSession.averageDb || "--"} dB estimés • Pic : ${sleepSession.maxDb || "--"} dB`);
  setText("sleepDurationResult", `Durée : ${formatDuration(sleepSession.startTime, sleepSession.endTime || new Date().toISOString())}`);
  renderSleepChart();
  loadSleepHistory();
}

function renderSleepChart() {
  const canvas = document.getElementById("sleepChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(2, 6, 23, 0.7)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(0, 234, 255, 0.22)";
  ctx.lineWidth = 1;
  for (let y = 20; y < height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  const samples = sleepSession.samples.slice(-100);
  ctx.strokeStyle = "#00eaff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  samples.forEach((sample, index) => {
    const x = samples.length <= 1 ? 0 : (index / (samples.length - 1)) * width;
    const y = height - (Math.min(sample.db, 90) / 90) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function saveSleepSession() {
  const history = JSON.parse(localStorage.getItem("nexusSleepSessions") || "[]");
  history.unshift({ ...sleepSession, samples: sleepSession.samples.slice(-240) });
  localStorage.setItem("nexusSleepSessions", JSON.stringify(history.slice(0, 14)));
  localStorage.setItem("lastSleepSession", JSON.stringify(sleepSession));
}

function loadSleepHistory() {
  const node = document.getElementById("sleepSessionHistory");
  if (!node) return;
  const history = JSON.parse(localStorage.getItem("nexusSleepSessions") || "[]");
  node.innerHTML = history.slice(0, 5).map((session) => `
    <article>
      <strong>${new Date(session.startTime).toLocaleDateString("fr-CA")}</strong>
      <span>${session.sleepQuality}/100 • ${session.snoreLevel} • max ${session.maxDb} dB</span>
    </article>
  `).join("");
}

function formatDuration(start, end) {
  if (!start || !end) return "--";
  const minutes = Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

document.addEventListener("DOMContentLoaded", () => {
  loadSleepHistory();
  renderSleepChart();
});

window.startSleepTracking = startSleepTracking;
window.stopSleepTracking = stopSleepTracking;
window.analyzeAudio = analyzeAudio;
window.detectSnoring = detectSnoring;
window.calculateSleepScore = calculateSleepScore;
window.renderSleepDashboard = renderSleepDashboard;
window.saveSleepSession = saveSleepSession;
window.loadSleepHistory = loadSleepHistory;
