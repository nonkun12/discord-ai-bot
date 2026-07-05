// 1. 一番最初にdotenvを読み込む
require("dotenv").config();

// 設定確認ログ（VS Codeのターミナルに表示されるはずです）
console.log("=== Bot起動プロセス開始 ===");
console.log("DISCORD_TOKEN設定:", process.env.DISCORD_TOKEN ? "OK" : "NG");
console.log("GROQ_API_KEY設定:", process.env.GROQ_API_KEY ? "OK" : "NG");

if (!process.env.DISCORD_TOKEN || !process.env.GROQ_API_KEY) {
  console.error("【エラー】環境変数が正しく読み込めていません。");
  process.exit(1);
}

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// AI回答生成関数
async function askGroq(userMessage) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "日本語で簡潔に答えてください。" },
          { role: "user", content: userMessage }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    // コンソールにエラー詳細を出力
    console.error("【Groq API エラー発生】");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Message:", error.message);
    }
    return null; // 失敗時はnullを返す
  }
}

client.on("ready", () => {
  console.log(`【成功】ログインしました: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  // ボット自身の発言は無視
  if (message.author.bot) return;
  // メンションがあるか確認
  if (!message.mentions.has(client.user)) return;

  // プロンプト抽出
  const prompt = message.content.replace(/<@!?\d+>/g, "").trim();
  if (!prompt) return;

  // 処理中ステータス表示
  await message.channel.sendTyping();

  const reply = await askGroq(prompt);

  if (reply) {
    await message.reply(reply);
  } else {
    await message.reply("AIサービスとの通信でエラーが発生しました。詳細はログを確認してください。");
  }
});

// ログイン処理
client.login(process.env.DISCORD_TOKEN);