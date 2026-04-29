import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3001;
const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();

app.use(cors());
app.use(express.json({ limit: "12mb" }));

function buildSystemPrompt(context = {}) {
  return [
    "Tu es Nexus IA, assistant français pour santé, fitness, nutrition, sommeil et planification.",
    "Réponds avec prudence, sans diagnostic médical, en donnant des conseils simples et actionnables.",
    "Utilise le contexte utilisateur quand il est fourni.",
    `Contexte JSON: ${JSON.stringify(context)}`
  ].join("\n");
}

async function callClaude(message, context) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const result = await anthropic.messages.create({
    model: process.env.NEXUS_AI_MODEL || "claude-3-5-sonnet-latest",
    max_tokens: 700,
    system: buildSystemPrompt(context),
    messages: [{ role: "user", content: message }]
  });
  return result.content?.map((part) => part.text || "").join("").trim();
}

async function callOpenAI(message, context) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY manquante");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await openai.chat.completions.create({
    model: process.env.NEXUS_AI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: buildSystemPrompt(context) },
      { role: "user", content: message }
    ],
    temperature: 0.45
  });
  return result.choices?.[0]?.message?.content?.trim();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, provider });
});

app.post("/api/nexus-ai", async (req, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message) return res.status(400).json({ error: "message requis" });
    const reply = provider === "openai"
      ? await callOpenAI(message, context)
      : await callClaude(message, context);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur Nexus IA", detail: error.message });
  }
});

app.listen(port, () => {
  console.log(`Nexus backend prêt sur http://localhost:${port}`);
});
