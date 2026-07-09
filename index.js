require("dotenv").config();

const express = require("express");

const {
    startDiscordBot,
    botStatus
} = require("./discord");

const {
    setupLineBot
} = require("./line");
// ===============================
// Express(Render)
// ===============================

const app = express();

setupLineBot(app);

app.use(express.json());

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
        botStatus.ready,

        uptime:
        process.uptime(),

        time:
        new Date()

    });

});



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

});



// ===============================
// Discord Start
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
// Render終了処理
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

    });


});