require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Events
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

        GatewayIntentBits.MessageContent

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
// Message
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



// ===============================
// 名前保存
// ===============================


const nameMatch =
text.match(
    /私の名前は\s*[、,]?\s*(.+?)(です|だよ|です。|だ。|。)?$/
);

if (nameMatch) {

    const name =
        nameMatch[1]
            .trim()
            .replace(/^[、,\s]+/, "")
            .replace(/[。]$/, "");

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
// 名前確認
// ===============================


if(
text.includes("私の名前")
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

reply = reply.replace(/^[、。,.！!？?\s]+/, "");


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


async function startDiscordBot(){


await client.login(
process.env.DISCORD_TOKEN
);


}



module.exports = {

startDiscordBot,

client,

botStatus

};
