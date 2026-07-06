require("dotenv").config();

const express = require("express");
const axios = require("axios");

const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");


// ======================
// Render用 Webサーバー
// ======================

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Discord AI Bot running");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});


// ======================
// Discord Bot設定
// ======================

const client = new Client({

  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]

});


// ======================
// 起動確認
// ======================

client.once(Events.ClientReady, () => {

  console.log(
    `ログイン成功: ${client.user.tag}`
  );

});


// ======================
// メッセージ処理
// ======================

client.on(
  Events.MessageCreate,
  async (message) => {


    try {

      // Bot自身は無視
      if (message.author.bot) return;


      console.log(
        "受信:",
        message.content
      );


      // ======================
      // 判定
      // ======================

      const mention =
        message.mentions.users.has(
          client.user.id
        );


      const command =
        message.content
          .toLowerCase()
          .startsWith("!ai");


      console.log(
        "メンション:",
        mention,
        "コマンド:",
        command
      );


      if (!mention && !command) {
        return;
      }



      // ======================
      // 内容取得
      // ======================

      let userText =
        message.content;



      // Discordメンション削除
      userText =
        userText.replace(
          /<@!?[0-9]+>/g,
          ""
        )
        .trim();



      // !ai削除
      userText =
        userText.replace(
          /^!ai\s*/i,
          ""
        )
        .trim();



      if (!userText) {

        userText = "こんにちは";

      }



      console.log(
        "AIへ送信:",
        userText
      );



      // ======================
      // Groq API
      // ======================

      const response =
        await axios.post(

          "https://api.groq.com/openai/v1/chat/completions",

          {

            model:
              "llama-3.3-70b-versatile",

            messages: [

              {
                role: "system",
                content:
                  "あなたは親切なAIアシスタントです。"
              },

              {
                role: "user",
                content:
                  userText
              }

            ],

            temperature: 0.7

          },


          {

            headers: {

              Authorization:
                `Bearer ${process.env.GROQ_API_KEY}`,

              "Content-Type":
                "application/json"

            },


            timeout:
              15000

          }

        );



      let reply =
        response.data
          ?.choices?.[0]
          ?.message?.content
          ||
        "回答を取得できませんでした";



      // Discord文字数制限
      if (reply.length > 1900) {

        reply =
          reply.substring(0,1900)
          + "...";

      }



      await message.reply(reply);



    }

    catch(error){


      console.error(
        "ERROR:",
        error.response?.data
        ||
        error.message
      );


      try {

        await message.reply(
          "エラーが発生しました"
        );

      }

      catch(e){}

    }


  }

);



// ======================
// Discordログイン
// ======================

client.login(
  process.env.DISCORD_TOKEN
);