require("dotenv").config();

const express = require("express");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();

const {
  Client,
  GatewayIntentBits,
  Events,
} = require("discord.js");

const botStatus = {
 discordReady:false
};


// ======================
// エラー対策
// ======================

process.on("uncaughtException", err=>{
 console.error(err);
 process.exit(1);
});


process.on("unhandledRejection", err=>{
 console.error(err);
});


const requiredEnv = [
 "DISCORD_TOKEN",
 "GROQ_API_KEY"
];

const missingEnv =
requiredEnv.filter(
 key=>!process.env[key]
);

if(missingEnv.length){
 console.error(
  `Missing env: ${missingEnv.join(", ")}`
 );
 process.exit(1);
}



// ======================
// Render Web
// ======================

const app = express();

const PORT =
process.env.PORT || 3000;


app.get("/",(req,res)=>{
 res.send("Discord AI Bot running");
});

app.get("/health",(req,res)=>{
 res.json({
  ok:true,
  discord:botStatus.discordReady,
  uptime:process.uptime()
 });
});


const server =
app.listen(PORT,()=>{
 console.log(
  `Web server ${PORT}`
 );
});

server.on("error",err=>{
 console.error("Web server error:",err);
 process.exit(1);
});


// Render監視

setInterval(()=>{

 console.log(
  "alive",
  new Date()
 );

},60000);

if(process.env.SELF_URL){

 setInterval(async()=>{
  try{
   await axios.get(
    `${process.env.SELF_URL.replace(/\/$/,"")}/health`,
    {timeout:10000}
   );
   console.log("self ping ok");
  }
  catch(err){
   console.error(
    "self ping failed:",
    err.message
   );
  }
 },600000);

}




// ======================
// SQLite
// ======================


const db =
new sqlite3.Database(
 "memory.db"
);



// 会話履歴

db.run(`

CREATE TABLE IF NOT EXISTS chats(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id TEXT,

message TEXT,

reply TEXT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)

`);




// 長期記憶

db.run(`

CREATE TABLE IF NOT EXISTS memories(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id TEXT,

key TEXT,

value TEXT

)

`);




// ======================
// Discord
// ======================


const client = new Client({

 intents:[

 GatewayIntentBits.Guilds,

 GatewayIntentBits.GuildMessages,

 GatewayIntentBits.MessageContent

 ]

});




// ======================
// Memory関数
// ======================


// 記憶保存

function saveMemory(
userId,
key,
value
){


 db.run(

 `

 INSERT INTO memories
 (
 user_id,
 key,
 value
 )
 VALUES(?,?,?)

 `,

 [
 userId,
 key,
 value
 ]

 );


}



// 記憶取得

function getMemory(userId){


return new Promise(resolve=>{


db.all(

`

SELECT key,value
FROM memories
WHERE user_id=?

`,

[
userId
],


(err,rows)=>{


if(err){

resolve([]);

}

else{

resolve(rows);

}


});


});


}



// 会話取得

function getHistory(userId){


return new Promise(resolve=>{


db.all(

`

SELECT message,reply
FROM chats
WHERE user_id=?

ORDER BY id DESC

LIMIT 5

`,

[
userId
],


(err,rows)=>{


if(err)
resolve([]);

else
resolve(
rows.reverse()
);


});


});


}



// 会話保存

function saveChat(
userId,
message,
reply
){


db.run(

`

INSERT INTO chats
(
user_id,
message,
reply
)

VALUES(?,?,?)

`,

[
userId,
message,
reply
]

);


}





// ======================
// Ready
// ======================


client.once(
Events.ClientReady,
()=>{

botStatus.discordReady = true;

console.log(
"ログイン:",
client.user.tag
);

});




// ======================
// Discord Error
// ======================


client.on(
"error",
err=>{
 console.error("Discord client error:",err);
}
);


client.on(
"shardError",
err=>{
 console.error("Discord shard error:",err);
}
);


client.on(
"shardDisconnect",
event=>{
botStatus.discordReady = false;

console.log(
"Discord切断",
event?.code,
event?.reason || ""
);
});


client.on(
"shardReconnecting",
()=>{
botStatus.discordReady = false;

console.log(
"再接続中"
);
});


client.on(
"shardResume",
()=>{
botStatus.discordReady = true;

console.log(
"Discord再接続完了"
);
}
);





// ======================
// Message
// ======================


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





// ======================
// 長期記憶登録
// ======================


let memoryMatch =

text.match(
/私の名前は(.+?)(です|だよ|です。)?$/
);



if(memoryMatch){


let name =

memoryMatch[1]
.trim();


saveMemory(

message.author.id,

"name",

name

);


await message.reply(

`${name}さんですね。覚えました。`

);


return;

}





// 覚えてコマンド


if(
text.startsWith("覚えて")
){


let data =

text.replace(
"覚えて",
""
)
.trim();


saveMemory(

message.author.id,

"info",

data

);


await message.reply(

"覚えました。"

);


return;

}





// ======================
// Memory取得
// ======================


const memories =

await getMemory(
message.author.id
);


const history =

await getHistory(
message.author.id
);





// AIメッセージ作成


let messages=[


{

role:"system",

content:

`
あなたは親切なAIアシスタントです。

ユーザーの記憶:
${JSON.stringify(memories)}

過去会話:
${JSON.stringify(history)}

記憶を参考に回答してください。
`

}

];




history.forEach(h=>{


messages.push({

role:"user",

content:h.message

});


messages.push({

role:"assistant",

content:h.reply

});


});




messages.push({

role:"user",

content:text

});





// ======================
// Groq
// ======================


const response =

await axios.post(


"https://api.groq.com/openai/v1/chat/completions",


{

model:

"llama-3.3-70b-versatile",


messages,


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
?.message
?.content

||
"回答できません";





if(reply.length>1900){

reply =
reply.substring(0,1900)
+"...";

}





await message.reply(reply);




// 保存

saveChat(

message.author.id,

text,

reply

);



}

catch(error){


console.error(
error.response?.data
||
error.message
);


}

});


 



// ======================
// Login
// ======================


async function start(){


try{

if(client.isReady()){
 return;
}

await client.login(
process.env.DISCORD_TOKEN
);

}

catch(e){

console.error(e);

setTimeout(
start,
10000
);

}


}


start();




// ======================
// Render停止
// ======================


process.on(
"SIGTERM",
()=>{

client.destroy();

server.close(()=>{
 db.close(()=>{
  process.exit(0);
 });
});

});
