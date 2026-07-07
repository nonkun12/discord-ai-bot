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
      );require("dotenv").config();

const express = require("express");
const axios = require("axios");

const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");


// ======================
// Node.js エラー防止
// ======================

process.on("uncaughtException", (err) => {
  console.error("未処理エラー:", err);
});


process.on("unhandledRejection", (err) => {
  console.error("Promiseエラー:", err);
});


// ======================
// Render Web Server
// ======================

const app = express();

const PORT = process.env.PORT || 3000;


app.get("/", (req, res) => {

  res.send(
    "Discord AI Bot running"
  );

});


app.listen(PORT, () => {

  console.log(
    `Web server running on port ${PORT}`
  );

});


// ======================
// Render Keep Alive
// ======================

setInterval(() => {

  console.log(
    "Bot alive",
    new Date().toISOString()
  );

}, 60000);



// ======================
// Discord Client
// ======================

const client = new Client({

  intents: [

    GatewayIntentBits.Guilds,

    GatewayIntentBits.GuildMessages,

    GatewayIntentBits.MessageContent,

  ]

});



// ======================
// Discord Error監視
// ======================

client.on(
  "error",
  (error) => {

    console.error(
      "Discord Error:",
      error
    );

  }
);


client.on(
  "shardError",
  (error) => {

    console.error(
      "Shard Error:",
      error
    );

  }
);


client.on(
  "shardDisconnect",
  (event) => {

    console.log(
      "Discord切断:",
      event.code
    );

  }
);


client.on(
  "shardReconnecting",
  () => {

    console.log(
      "Discord再接続中..."
    );

  }
);


client.on(
  "invalidated",
  () => {

    console.log(
      "Discord Session invalidated"
    );

  }
);



// ======================
// Ready
// ======================

client.once(
  Events.ClientReady,
  () => {

    console.log(
      `ログイン成功: ${client.user.tag}`
    );

  }
);



// ======================
// Message Handler
// ======================

client.on(
  Events.MessageCreate,

  async (message) => {


    try {


      if(message.author.bot)
        return;



      console.log(
        "受信:",
        message.content
      );



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



      if(!mention && !command)
        return;



      let userText =
        message.content;



      // メンション削除

      userText =
        userText.replace(
          /<@!?[0-9]+>/g,
          ""
        );



      // !ai削除

      userText =
        userText.replace(
          /^!ai\s*/i,
          ""
        )
        .trim();



      if(!userText){

        userText =
          "こんにちは";

      }



      console.log(
        "AI送信:",
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


            messages:[

              {

                role:"system",

                content:
                "あなたは親切なAIアシスタントです。"

              },


              {

                role:"user",

                content:userText

              }

            ],


            temperature:0.7

          },


          {

            headers:{


              Authorization:
              `Bearer ${process.env.GROQ_API_KEY}`,


              "Content-Type":
              "application/json"

            },


            timeout:15000

          }

        );



      let reply =

        response.data
        ?.choices?.[0]
        ?.message?.content
        ||
        "回答できませんでした";




      if(reply.length > 1900){

        reply =
        reply.substring(0,1900)
        +"...";

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



      try{


        await message.reply(

          "現在AI処理でエラーが発生しました"

        );


      }
      catch(e){}



    }


  }

);



// ======================
// Discord Login
// ======================


async function startBot(){


  try{


    await client.login(
      process.env.DISCORD_TOKEN
    );


    console.log(
      "Discord接続完了"
    );


  }


  catch(error){


    console.error(
      "ログイン失敗:",
      error.message
    );


    setTimeout(

      startBot,

      10000

    );


  }


}


startBot();



// ======================
// Render停止対応
// ======================

process.on(
  "SIGTERM",
  ()=>{

    console.log(
      "Render停止要求"
    );


    client.destroy();

    process.exit(0);

  }
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