require("dotenv").config();

const {
    middleware,
    messagingApi
} = require("@line/bot-sdk");


const {
    askAI
} = require("./ai");


const {
    saveMemory,
    getMemory,
    findName
} = require("./memory");


const {
    saveChat,
    getHistory
} = require("./database");



// ===============================
// LINE設定
// ===============================

const config = {

    channelAccessToken:
    process.env.LINE_CHANNEL_ACCESS_TOKEN,


    channelSecret:
    process.env.LINE_CHANNEL_SECRET

};



// ===============================
// LINE Client
// ===============================

const lineClient =
new messagingApi.MessagingApiClient({

    channelAccessToken:
    process.env.LINE_CHANNEL_ACCESS_TOKEN

});




// ===============================
// Webhook
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



                    const userId =
                    event.source.userId;



                    const text =
                    event.message.text;



                    console.log(
                        "LINE受信:",
                        text
                    );



                    // ===============================
                    // 名前登録
                    // ===============================


                    const nameMatch =
                    text.match(
                    /私の名前は\s*([^？?]+?)(です|だよ|です。)?$/
                    );



                    if(nameMatch){


                        const name =
                        nameMatch[1].trim();



                        await saveMemory(

                            userId,

                            "name",

                            name

                        );



                        await lineClient.replyMessage(

                            {

                                replyToken:
                                event.replyToken,


                                messages:[

                                    {

                                        type:"text",

                                        text:
                                        `${name}さんですね。覚えました。`

                                    }

                                ]

                            }

                        );


                        continue;


                    }




                    // ===============================
                    // 名前確認
                    // ===============================


                    if(
                        text.includes("私の名前")
                    ){


                        const name =
                        await findName(
                            userId
                        );



                        let reply;



                        if(name){


                            reply =
                            `あなたの名前は${name}です。`;


                        }else{


                            reply =
                            "まだ名前を覚えていません。";


                        }



                        await lineClient.replyMessage(

                            {

                                replyToken:
                                event.replyToken,


                                messages:[

                                    {

                                        type:"text",

                                        text:reply

                                    }

                                ]

                            }

                        );


                        continue;


                    }




                    // ===============================
                    // 記憶取得
                    // ===============================


                    const memories =
                    await getMemory(
                        userId
                    );



                    const history =
                    await getHistory(
                        userId
                    );





                    // ===============================
                    // AI Prompt
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

ユーザー情報を参考に自然に回答してください。
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
                    // AI回答
                    // ===============================


                    let reply;


                    try{


                        reply =
                        await askAI(
                            messages
                        );


                    }
                    catch(error){


                        console.error(
                            "AI Error:",
                            error
                        );


                        reply =
                        "AI接続エラーです。";


                    }





                    if(reply.length > 4000){

                        reply =
                        reply.substring(0,4000);

                    }





                    // ===============================
                    // LINE返信
                    // ===============================


                    await lineClient.replyMessage(

                        {

                            replyToken:
                            event.replyToken,


                            messages:[

                                {

                                    type:"text",

                                    text:reply

                                }

                            ]

                        }

                    );





                    // ===============================
                    // 会話保存
                    // ===============================


                    await saveChat(

                        userId,

                        text,

                        reply

                    );



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