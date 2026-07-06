require("dotenv").config();

console.log("=== BOT START ===");
console.log("DISCORD_TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "NG");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "OK" : "NG");

if (!process.env.DISCORD_TOKEN || !process.env.GROQ_API_KEY) {
  console.error("❌ 環境変数が不足しています");
  process.exit(1);
}

// ======================
// Express（Render用死活監視）
// ======================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Discord AI Bot is running");
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
// READY
// ======================
client.once("ready", () => {
  console.log("🟢 READY EVENT FIRED");
  console.log(`Logged in as ${client.user.tag}`);
});

// ======================
// MESSAGE（常時反応版）
// ======================
client.on("messageCreate", async (message) => {
  console.log("🔥 MESSAGE EVENT RECEIVED:", message.content);

  if (message.author.bot) return;

  const prompt = message.content?.trim();
  if (!prompt) return;

  try {
    await message.channel.sendTyping();

    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "あなたは簡潔で分かりやすい日本語AIです。"
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
});

// ======================
// LOGIN
// ======================
client.login(process.env.DISCORD_TOKEN);