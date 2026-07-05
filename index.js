// ===============================
// Discord AI Bot for Render
// ===============================

// 環境変数読み込み
require("dotenv").config();

// 設定確認
console.log("=== Bot起動プロセス開始 ===");
console.log("DISCORD_TOKEN設定:", process.env.DISCORD_TOKEN ? "OK" : "NG");
console.log("GROQ_API_KEY設定:", process.env.GROQ_API_KEY ? "OK" : "NG");

if (!process.env.DISCORD_TOKEN || !process.env.GROQ_API_KEY) {
  console.error("【エラー】環境変数が正しく読み込めていません。");
  process.exit(1);
}

// ===============================
// Express（Render無料プラン対策）
// ===============================

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Discord AI Bot is running!");
});

app.listen(PORT, () => {
  console.log(`Web Server started on port ${PORT}`);
});

// ===============================
// Discord
// ===============================

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ===============================
// Groq AI
// ===============================

async function askGroq(userMessage) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "日本語で簡潔に答えてください。",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("====== Groq API Error ======");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error(
        "Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error(error.message);
    }

    return null;
  }
}

// ===============================
// Discord Events
// ===============================

client.once("ready", () => {
  console.log(`【成功】ログインしました：${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  // Bot自身は無視
  if (message.author.bot) return;

  // メンションされていなければ無視
  if (!message.mentions.has(client.user)) return;

  // メンションを除去
  const prompt = message.content.replace(/<@!?\d+>/g, "").trim();

  if (!prompt) {
    return message.reply("質問を書いてください。");
  }

  // 入力中表示
  await message.channel.sendTyping();

  const answer = await askGroq(prompt);

  if (answer) {
    await message.reply(answer);
  } else {
    await message.reply("AIサービスとの通信でエラーが発生しました。");
  }
});

// ===============================
// Login
// ===============================

client.login(process.env.DISCORD_TOKEN);