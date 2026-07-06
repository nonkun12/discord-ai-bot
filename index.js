require("dotenv").config();

console.log("=== BOT START ===");
console.log("DISCORD_TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "NG");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "OK" : "NG");

if (!process.env.DISCORD_TOKEN || !process.env.GROQ_API_KEY) {
  console.error("❌ 環境変数が不足しています");
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
  console.log("Logged in as:", client.user.tag);
});

// ======================
// 🔥 超重要デバッグ（ここが一番大事）
// ======================
client.on("messageCreate", (message) => {
  console.log("==================================");
  console.log("🔥 MESSAGE EVENT RECEIVED");
  console.log("content:", message.content);
  console.log("author:", message.author.username);
  console.log("bot:", message.author.bot);
  console.log("channel:", message.channel.name);
  console.log("guild:", message.guild?.name);
  console.log("==================================");

  // Bot自身は無視
  if (message.author.bot) return;

  // 返信テスト（AIなし）
  message.reply("✅ 受信OK");
});

// ======================
// LOGIN
// ======================
client.login(process.env.DISCORD_TOKEN);