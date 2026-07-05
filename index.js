require("dotenv").config();

console.log("=== BOT START ===");
console.log("DISCORD_TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "NG");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "OK" : "NG");

if (!process.env.DISCORD_TOKEN || !process.env.GROQ_API_KEY) {
  console.error("❌ 環境変数が不足しています");
  process.exit(1);
}

// ======================
// Express（Render対策）
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
// Ready
// ======================
client.once("ready", () => {
  console.log("🟢 READY EVENT FIRED");
  console.log(`Logged in as ${client.user.tag}`);
});

// ======================
// Message Handler
// ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log("📩 MESSAGE:", message.content);

  const isMention = message.mentions.has(client.user);
  const isCommand = message.content.startsWith("!");

  // メンション or !コマンドのみ反応
  if (!isMention && !isCommand) return;

  let prompt = message.content;

  // メンション削除
  prompt = prompt.replace(/<@!?\d+>/g, "").trim();

  // !削除
  if (isCommand) {
    prompt = prompt.slice(1).trim();
  }

  if (!prompt) {
    return message.reply("何か書いてください");
  }

  try {
    await message.channel.sendTyping();

    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "あなたは優秀な日本語アシスタントです。簡潔に答えてください。"
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
// Login
// ======================
client.login(process.env.DISCORD_TOKEN);