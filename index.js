require("dotenv").config();

const express = require("express");
const axios = require("axios");

const {
  Client,
  GatewayIntentBits,
  Events
} = require("discord.js");

const {
  initDatabase,
  saveChat,
  getHistory
} = require("./database");

const {
 saveMemory,
 getMemory,
 findName,
 deleteMemory
} = require("./memory");


// ===============================
// 環境変数確認
// ===============================

const requiredEnv = [
  "DISCORD_TOKEN",
  "GROQ_API_KEY"
];


const missing =
requiredEnv.filter(
 key => !process.env[key]
);


if(missing.length){

 console.error(
  "Missing env:",
  missing.join(", ")
 );

 process.exit(1);

}


// ===============================
// 状態管理
// ===============================

const botStatus = {

 discordReady:false,

 startTime:
 Date.now()

};



// ===============================
// エラー処理
// ===============================


process.on(
"uncaughtException",
err=>{

 console.error(
  "Fatal Error:",
  err
 );

});


process.on(
"unhandledRejection",
err=>{

 console.error(
  "Promise Error:",
  err
 );

});



// ===============================
// Express(Render)
// ===============================


const app = express();


const PORT =
process.env.PORT || 3000;



app.get(
"/",
(req,res)=>{

res.send(
"Discord AI Bot Running"
);

});



app.get(
"/health",
(req,res)=>{


res.json({

 ok:true,

 discord:
 botStatus.discordReady,

 uptime:
 process.uptime(),

 time:
 new Date()

});


});



const server =
app.listen(
PORT,
()=>{

console.log(
`Web server running ${PORT}`
);

});





// ===============================
// Discord Client
// ===============================


const client =
new Client({

 intents:[

 GatewayIntentBits.Guilds,

 GatewayIntentBits.GuildMessages,

 GatewayIntentBits.MessageContent

 ]

});



// ===============================
// Database初期化
// ===============================


initDatabase();



// ===============================
// Discord Ready
// ===============================


client.once(

Events.ClientReady,

()=>{


botStatus.discordReady=true;


console.log(
"Discord Login:",
client.user.tag
);


}

);



// ===============================
// Discord Error
// ===============================


client.on(
"error",
err=>{

console.error(
"Discord Error:",
err
);

});


client.on(
"shardDisconnect",
()=>{

botStatus.discordReady=false;

console.log(
"Discord disconnected"
);

});


client.on(
"shardReconnecting",
()=>{

console.log(
"Discord reconnecting"
);

});


client.on(
"shardResume",
()=>{

botStatus.discordReady=true;

console.log(
"Discord resumed"
);

});



// ===============================
// Groq AI
// ===============================


async function askGroq(messages){


for(
let i=0;
i<3;
i++
){


try{


const response =
await axios.post(

"https://api.groq.com/openai/v1/chat/completions",


{

model:
"llama-3.3-70b-versatile",


messages,


temperature:
0.7

},


{

headers:{

Authorization:
`Bearer ${process.env.GROQ_API_KEY}`,

"Content-Type":
"application/json"

},


timeout:
30000

}


);



return response
.data
.choices[0]
.message
.content;



}

catch(err){


console.error(
"Groq Error attempt",
i+1,
err.response?.data ||
err.message
);



if(i===2)
throw err;


await new Promise(
r=>setTimeout(r,2000)
);



}


}


}



// ===============================
// Message処理
// ===============================


client.on(

Events.MessageCreate,

async message=>{


try{


if(message.author.bot)
return;



const mention =

message.mentions.users.has(
client.user.id
);



const command =

message.content
.toLowerCase()
.startsWith("!ai");



if(!mention && !command)
return;



let text =
message.content;



text =
text.replace(
/<@!?[0-9]+>/g,
""
);



text =
text.replace(
/^!ai\s*/i,
""
)
.trim();



if(!text)
text="こんにちは";



await message.channel.sendTyping();



// 名前記憶

const nameMatch =
text.match(
/私の名前は([^？?]+?)(です|だよ|です。)?$/
);
console.log(
"受信:",
text
);

console.log(
"nameMatch:",
nameMatch
);


if(nameMatch){


const name =
nameMatch[1].trim();


await saveMemory(
message.author.id,
"name",
name
);


await message.reply(
`${name}さんですね。覚えました。`
);


return;

}

// ===============================
// 「覚えて」コマンド
// ===============================

if(
 text.startsWith("覚えて")
){

 const info =
 text.replace(
  "覚えて",
  ""
 )
 .trim();


 if(info){

  await saveMemory(
   message.author.id,
   "info",
   info
  );


  await message.reply(
   "覚えました。"
  );


 }

 return;

}



// ===============================
// 記憶取得
// ===============================


const memories =
await getMemory(
 message.author.id
);

if (
    text === "私の名前は？" ||
    text === "私の名前は?" ||
    text === "私の名前は"
) {

    const name = await findName(
        message.author.id
    );

    if (name) {

        await message.reply(
            `あなたの名前は${name}です。`
        );

    } else {

        await message.reply(
            "まだ名前を覚えていません。"
        );

    }

    return;
}

const history =
await getHistory(
 message.author.id
);




// ===============================
// AI Prompt作成
// ===============================


const messages = [

{

role:"system",

content:
`
あなたは親切なAIアシスタントです。

ユーザー情報:

${JSON.stringify(memories)}

過去の会話:

${JSON.stringify(history)}

ユーザーの記憶を参考にして、
自然に回答してください。

`

}

];





history.forEach(item=>{


messages.push({

role:"user",

content:
item.message

});


messages.push({

role:"assistant",

content:
item.reply

});


});





messages.push({

role:"user",

content:text

});





// ===============================
// Groq問い合わせ
// ===============================


let reply;


try{


reply =
await askGroq(
 messages
);


}

catch(error){


console.error(
"AI Error:",
error
);


reply =
"AIへの接続に失敗しました。少し時間を置いて試してください。";


}





// Discord文字数制限対策

if(
reply.length > 1900
){

reply =
reply.substring(0,1900)
+
"...";

}





// ===============================
// Discord返信
// ===============================


await message.reply(
reply
);




// ===============================
// 会話保存
// ===============================


await saveChat(

message.author.id,

text,

reply

);




}

catch(error){


console.error(
"Message Error:",
error
);


}

});




// ===============================
// Login処理
// ===============================


async function startBot(){


try{


await client.login(
process.env.DISCORD_TOKEN
);


}

catch(error){


console.error(
"Discord login error:",
error
);



setTimeout(
startBot,
10000
);



}


}



startBot();




// ===============================
// Render終了処理
// ===============================


process.on(

"SIGTERM",

()=>{


console.log(
"Stopping..."
);


client.destroy();


server.close(
()=>{

process.exit(0);

});


}

);