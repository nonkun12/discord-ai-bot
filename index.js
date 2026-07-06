require("dotenv").config();

const express = require("express");
const axios = require("axios");
const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");

// ======================
// Express（死活監視用）
// ======================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Discord AI Bot is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ======================
// Discord Bot
// ======================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ======================
// Bot起動
// ======================
client.once(Events.ClientReady, () => {
  console.log(`ログイン成功: ${client.user.tag}`);
});

// ======================
// メッセージ受信
// ======================
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // 呼び出し条件（例: !ai）
  if (!message.content.startsWith("!ai ")) return;

  const userText = message.content.replace("!ai ", "");

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: userText,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply =
      response.data.choices?.[0]?.message?.content ||
      "応答が取得できませんでした。";

    await message.reply(aiReply);
  } catch (error) {
    console.error(error.response?.data || error.message);
    await message.reply("エラーが発生しました。");
  }
});

// ======================
// Discordログイン
// ======================
client.login(process.env.DISCORD_TOKEN);