require("dotenv").config();

const express = require("express");


// ===============================
// Modules
// ===============================

const {
    initDatabase
} = require("./database");


const {
    setupLineBot
} = require("./line");


const {
    startDiscordBot,
    botStatus
} = require("./discord");



// ===============================
// 環境変数確認
// ===============================

const requiredEnv = [

    "DISCORD_TOKEN",
    "GROQ_API_KEY",
    "LINE_CHANNEL_SECRET",
    "LINE_CHANNEL_ACCESS_TOKEN"

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
// Express(Render)
// ===============================

const app = express();


const PORT =
process.env.PORT || 3000;



// LINE Webhookは先に登録
// (署名検証のため)

setupLineBot(app);



// 通常JSON
app.use(
    express.json()
);



// ===============================
// Health Check
// ===============================

app.get(

    "/",

    (req,res)=>{

        res.send(
            "Discord AI Bot Running"
        );

    }

);



app.get(

    "/health",

    (req,res)=>{


        res.json({

            ok:true,

            discord:
            botStatus?.discordReady || false,

            uptime:
            process.uptime(),

            time:
            new Date()

        });


    }

);




// ===============================
// Server Start
// ===============================

const server =
app.listen(

    PORT,

    ()=>{

        console.log(
            `Web server running ${PORT}`
        );

    }

);




// ===============================
// SQLite初期化
// ===============================

initDatabase();



// ===============================
// Discord起動
// ===============================

startDiscordBot();




// ===============================
// Error Handling
// ===============================

process.on(

    "uncaughtException",

    err=>{

        console.error(
            "Fatal Error:",
            err
        );

    }

);


process.on(

    "unhandledRejection",

    err=>{

        console.error(
            "Promise Error:",
            err
        );

    }

);




// ===============================
// Shutdown
// ===============================

process.on(

    "SIGTERM",

    ()=>{


        console.log(
            "Stopping..."
        );


        server.close(
            ()=>{

                process.exit(0);

            }
        );


    }

);