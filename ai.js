require("dotenv").config();

const axios = require("axios");


/**
 * Groqへ問い合わせ
 * @param {Array} messages
 * @returns {Promise<string>}
 */
async function askGroq(messages) {


    for (let i = 0; i < 3; i++) {


        try {


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


                    timeout:30000


                }


            );



            // ===============================
            // AI返信取得
            // ===============================

            let text =
            response.data.choices[0].message.content;



            // ===============================
            // 先頭の不要な記号削除
            // ===============================

            text =
            text.replace(
                /^[、。,.！!？?\s]+/,
                ""
            );



            console.log(
                "AI CLEAN RESULT:",
                text
            );



            return text;



        }
        catch(err){


            console.error(

                "Groq Error attempt",
                i + 1,
                err.response?.data ||
                err.message

            );



            if(i === 2){

                throw err;

            }



            await new Promise(
                resolve =>
                setTimeout(
                    resolve,
                    2000
                )
            );


        }


    }


}



/**
 * AIへ問い合わせ
 */
async function askAI(messages){


    const reply =
    await askGroq(messages);



    return reply;


}



module.exports = {


    askGroq,

    askAI


};