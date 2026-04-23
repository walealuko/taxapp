const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  const result = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    lines.forEach(line => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) {
        result[key.trim()] = rest.join("=").trim();
      }
    });
  }
  return result;
}

const ENV = loadEnv();
const CLAUDE_API_KEY = ENV.CLAUDE_API_KEY || "";

// Debug: log what we loaded
console.log("===== SERVER STARTING =====");
console.log("__dirname:", __dirname);
console.log("ENV object keys:", Object.keys(ENV));
console.log("CLAUDE_API_KEY from ENV:", CLAUDE_API_KEY ? "SET (" + CLAUDE_API_KEY.substring(0,15) + "...)" : "EMPTY/NOT SET");
console.log("==========================");

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    claudeKeyStatus: CLAUDE_API_KEY ? "configured" : "NOT SET",
    claudeKeyValue: CLAUDE_API_KEY ? CLAUDE_API_KEY.substring(0,15) + "..." : "none",
    pid: process.pid,
    timestamp: new Date().toISOString()
  });
});

app.post("/chat", (req, res) => {
  console.log("===== CHAT REQUEST =====");
  console.log("CLAUDE_API_KEY at request time:", CLAUDE_API_KEY ? "SET" : "NOT SET");
  console.log("=========================");

  const { provider } = req.body;

  if (provider === "claude") {
    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: "Claude API key not configured" });
    }
    return res.json({ success: true, message: "Claude would be called with key: " + CLAUDE_API_KEY.substring(0,10) + "..." });
  }

  res.json({ provider, message: "Other providers not implemented in test" });
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://localhost:5000");
});
