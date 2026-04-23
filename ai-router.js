const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Manual env loading to bypass dotenv interference
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const vars = {};
  content.split("\n").forEach(line => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;
    const idx = line.indexOf("=");
    if (idx > 0) {
      const key = line.substring(0, idx).trim();
      const value = line.substring(idx + 1).trim();
      vars[key] = value;
    }
  });
  return vars;
}

const ENV = loadEnv();
const CLAUDE_API_KEY = ENV.CLAUDE_API_KEY || "";
const OLLAMA_URL = ENV.OLLAMA_URL || "http://localhost:11434";
const LM_STUDIO_URL = ENV.LM_STUDIO_URL || "http://localhost:1234/v1";
const LM_STUDIO_TOKEN = ENV.LM_STUDIO_TOKEN || "";

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    claudeKeyConfigured: !!CLAUDE_API_KEY,
    claudeKeyPrefix: CLAUDE_API_KEY ? CLAUDE_API_KEY.substring(0, 15) + "..." : "NOT SET",
    timestamp: new Date().toISOString()
  });
});

// Unified chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { messages, model, provider: forcedProvider } = req.body;
    const provider = forcedProvider || "ollama";

    let response;
    let chosenModel = model;

    if (provider === "claude") {
      console.log("CLAUDE BRANCH: CLAUDE_API_KEY =", CLAUDE_API_KEY ? "SET" : "NOT SET");
      chosenModel = model || "claude-3-5-sonnet-20241022";
      if (!CLAUDE_API_KEY) {
        return res.status(500).json({ error: "Claude API key not configured" });
      }

      console.log("Making Claude API call with key:", CLAUDE_API_KEY.substring(0, 10) + "...");

      const result = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: chosenModel,
          messages,
          max_tokens: 1024
        },
        {
          headers: {
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          timeout: 30000
        }
      );
      response = result.data.content[0].text;

    } else if (provider === "ollama") {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");
      chosenModel = model || "gemma3:1b";

      const result = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        { model: chosenModel, prompt, stream: false },
        { timeout: 60000 }
      );
      response = result.data.response;

    } else if (provider === "lmstudio") {
      const headers = { "content-type": "application/json" };
      if (LM_STUDIO_TOKEN) {
        headers["Authorization"] = `Bearer ${LM_STUDIO_TOKEN}`;
      }
      chosenModel = model || "local-model";

      const result = await axios.post(
        `${LM_STUDIO_URL}/chat/completions`,
        { model: chosenModel, messages },
        { headers, timeout: 60000 }
      );
      response = result.data.choices[0].message.content;
    }

    res.json({ provider, model: chosenModel, response });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = ENV.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Router running on http://localhost:${PORT}`);
  console.log(`Claude API: ${CLAUDE_API_KEY ? "configured (" + CLAUDE_API_KEY.substring(0, 15) + "...)" : "NOT SET"}`);
  console.log(`Ollama: ${OLLAMA_URL}`);
  console.log(`LM Studio: ${LM_STUDIO_URL}`);
});
