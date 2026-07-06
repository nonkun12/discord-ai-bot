require("dotenv").config();

const express = require("express");
const axios = require("axios");
const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");

//======================================
// 環境変数確認
//======================================
console.log("======================================");
console.log("=== BOT START ===");
console.log(
  "DISCORD_TOKEN:",
  process.env.DISCORD_TOKEN ? "OK" : "NG"
);
console.log(
  "GROQ_API_KEY:",
  process.env.GROQ_API_KEY ? "OK" : "NG"
);
console.log("======================================");

if (!process.env.DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN がありません。");
  process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
  console.error("GROQ_API_KEY がありません。");
  process.exit(1);
}

//======================================
// Express（Render用）
//======================================
const app = express();

app.get("/", (req, res) => {
  res.send("Discord AI Bot Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌐 Web server started");
});

//======================================
// Discord Client
//======================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

//======================================
// Ready
//======================================
client.once(Events.ClientReady, (c) => {
  console.log("🟢 READY EVENT FIRED");
  console.log(`Logged in as: ${c.user.tag}`);
});

//======================================
// メッセージ受信
//======================================
client.on(Events.MessageCreate, async (message) => {
  console.log("==================================");
  console.log("🔥 MESSAGE EVENT RECEIVED");
  console.log("Guild :", message.guild?.name);
  console.log("Channel :", message.channel?.name);
  console.log("Author :", message.author.username);
  console.log("Content :", message.content);
  console.log("Bot :", message.author.bot);
  console.log("==================================");

  if (message.author.bot) return;

  try {
    await message.channel.sendTyping();

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "あなたは親切なAIです。日本語で簡潔に答えてください。",
          },
          {
            role: "user",
            content: message.content,
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

    const answer =
      response.data.choices?.[0]?.message?.content ??
      "回答を取得できませんでした。";

    await message.reply(answer);
  } catch (err) {
    console.error("========== ERROR ==========");

    if (err.response) {
      console.error(err.response.status);
      console.error(err.response.data);
    } else {
      console.error(err);
    }

    await message.reply("AIとの通信でエラーが発生しました。");
  }
});

//======================================
// エラー
//======================================
client.on("error", console.error);

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

//======================================
// Login
//======================================
client.login(process.env.DISCORD_TOKEN);