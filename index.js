require("dotenv").config();

console.log("=== BOT START ===");
console.log("DISCORD_TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "NG");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "OK" : "NG");

if (!process.env.DISCORD_TOKEN || !process.env.GROQ_API_KEY) {
  console.error("❌ 環境変数不足");
  process.exit(1);
}

// ======================
// Express（Render用）
// ======================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web server started");
});

// ======================
// Discord
// ======================
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ======================
// READY確認
// ======================
client.once("ready", () => {
  console.log("🟢 READY EVENT FIRED");
  console.log("Logged in as:", client.user.tag);
});

// ======================
// 🔥 最重要デバッグ（まずここが動くか）
// ======================
client.on("messageCreate", (message) => {
  console.log("🔥 MESSAGE EVENT RECEIVED");
  console.log("📩 content:", message.content);
  console.log("👤 author:", message.author.username);

  if (message.author.bot) return;

  // 👉 まずは全部AIに通す（テスト用）
  runAI(message, message.content);
});

// ======================
// AI処理
// ======================
async function runAI(message, prompt) {
  try {
    await message.channel.sendTyping();

    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "あなたは日本語で簡潔に答えるAIです"
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const answer = res.data.choices[0].message.content;

    await message.reply(answer);

  } catch (err) {
    console.error("❌ AI ERROR:", err.response?.data || err.message);
    await message.reply("AIエラーが発生しました");
  }
}

// ======================
// LOGIN
// ======================
client.login(process.env.DISCORD_TOKEN);