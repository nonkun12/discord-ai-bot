require("dotenv").config();

const {
    middleware,
    messagingApi
} = require("@line/bot-sdk");

const {
    askAI
} = require("./ai");


const config = {

    channelAccessToken:
    process.env.LINE_CHANNEL_ACCESS_TOKEN,

    channelSecret:
    process.env.LINE_CHANNEL_SECRET

};


// LINE API Client
const lineClient =
new messagingApi.MessagingApiClient({

    channelAccessToken:
    process.env.LINE_CHANNEL_ACCESS_TOKEN

});



// ===============================
// LINE Webhook設定
// ===============================

function setupLineBot(app){


    app.post(

        "/line-webhook",

        middleware(config),

        async(req,res)=>{


            try{


                const events =
                req.body.events;


                for(const event of events){


                    if(
                        event.type !== "message" ||
                        event.message.type !== "text"
                    ){
                        continue;
                    }



                    const text =
                    event.message.text;



                    console.log(
                        "LINE受信:",
                        text
                    );



                    const messages = [

                        {
                            role:"user",
                            content:text
                        }

                    ];



                    const reply =
                    await askAI(messages);



                    await lineClient.replyMessage({

                        replyToken:
                        event.replyToken,

                        messages:[

                            {

                                type:"text",

                                text:reply

                            }

                        ]

                    });


                }


                res.sendStatus(200);


            }
            catch(error){

                console.error(
                    "LINE Error:",
                    error
                );


                res.sendStatus(500);

            }


        }

    );


}



module.exports = {

    setupLineBot

};