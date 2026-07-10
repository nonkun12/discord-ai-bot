require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Events,
    Partials
} = require("discord.js");

const {
    saveChat,
    getHistory
} = require("./database");

const {
    saveMemory,
    getMemory,
    findName
} = require("./memory");

const {
    askAI
} = require("./ai");



let botStatus = {
    ready:false
};



const client = new Client({

    intents:[

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.MessageContent,

        GatewayIntentBits.DirectMessages

    ],

    // DMチャンネルはデフォルトではキャッシュされないため、
    // Partialsを指定しないとDMのMessageCreateイベントが発火しない
    partials: [

        Partials.Channel,

        Partials.Message

    ]

});



// ===============================
// Ready
// ===============================

client.once(

Events.ClientReady,

()=>{

    botStatus.ready=true;

    console.log(
        "Discord Login:",
        client.user.tag
    );

}

);



// ===============================
// 接続状態の変化をログに残す
// (オフラインになる原因の切り分け用:
//  Render側のスピンダウンなのか、
//  discord.js側の切断なのかを判別できるようにする)
// ===============================

client.on("shardDisconnect", (event, id) => {
    botStatus.ready = false;
    console.error(
        "Discord Shard Disconnected:",
        id,
        event?.code,
        event?.reason
    );
});

client.on("shardReconnecting", (id) => {
    console.log("Discord Shard Reconnecting:", id);
});

client.on("shardResume", (id) => {
    botStatus.ready = true;
    console.log("Discord Shard Resumed:", id);
});

client.on("error", (error) => {
    console.error("Discord Client Error:", error);
});



// ===============================
// Message
// ===============================

client.on(

Events.MessageCreate,

async message=>{


try{


if(message.author.bot)
return;


// --- 一時デバッグログ:イベントが発火しているか確認 ---
console.log(
    "MESSAGE RECEIVED:",
    "channel=" + message.channel.id,
    "content=" + JSON.stringify(message.content)
);


const mention =
message.mentions.users.has(
    client.user.id
);



const command =
message.content
.toLowerCase()
.startsWith("!ai");



if(!mention && !command){
    console.log("SKIP: not mention/command");
    return;
}



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







// ===============================
// 名前確認
// ===============================

if(
    text === "私の名前は？" ||
    text === "私の名前は?" ||
    text === "私の名前"
){

    const name =
    await findName(
        message.author.id
    );


    if(name){

        await message.reply(
            `あなたの名前は${name}です。`
        );

    }else{

        await message.reply(
            "まだ名前を覚えていません。"
        );

    }


    return;

}



// ===============================
// 名前保存
// ===============================

const nameMatch =
text.match(
    /^私の名前(?:は)?[、,\s]*(.+?)(?:です|だよ|だ。|です。|。)?$/
);


if(nameMatch){


    const name =
        nameMatch[1]
        .trim()
        .replace(/^[、,\s]+/, "")
        .replace(/[。！？?]+$/, "");


    if(
        !name ||
        name === "?" ||
        name === "？"
    ){

        return;

    }


    console.log(
        "SAVE NAME:",
        message.author.id,
        name
    );


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
// Memory
// ===============================


const memories =
await getMemory(
message.author.id
);



const history =
await getHistory(
message.author.id
);




// ===============================
// Prompt
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

`

}


];



history.forEach(item=>{


messages.push({

role:"user",

content:item.message

});


messages.push({

role:"assistant",

content:item.reply

});


});



messages.push({

role:"user",

content:text

});




// ===============================
// AI
// ===============================


let reply =
await askAI(
messages
);




if(reply.length > 1900){

reply =
reply.substring(0,1900)
+"...";

}



// ===============================
// Reply
// ===============================


await message.reply(reply);



// ===============================
// Save
// ===============================


await saveChat(

message.author.id,

text,

reply

);



}

catch(error){

console.error(
"Discord Message Error:",
error
);

}


});



// ===============================
// Start
// ===============================


async function startDiscordBot(retryDelayMs = 5000){

    try{

        await client.login(
            process.env.DISCORD_TOKEN
        );

    }
    catch(error){

        console.error(
            "Discord Login Error:",
            error
        );

        console.log(
            `Retrying Discord login in ${retryDelayMs / 1000}s...`
        );

        // 指数バックオフで再試行(最大5分間隔)
        setTimeout(
            () => startDiscordBot(Math.min(retryDelayMs * 2, 300000)),
            retryDelayMs
        );

    }

}



module.exports = {

startDiscordBot,

client,

botStatus

};