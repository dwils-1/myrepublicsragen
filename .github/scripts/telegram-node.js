const https = require("https");

const BOT_TOKEN = "8330506170:AAEsnemwSirxVMlUHG0ygNha2GFkxVBao-A";
const CHAT_ID = "-1003594385102";
const THREAD_ID = 1042;

async function kirimTelegram(text){

    return new Promise((resolve,reject)=>{

        const body = JSON.stringify({
            chat_id: CHAT_ID,
            message_thread_id: THREAD_ID,
            parse_mode: "HTML",
            disable_web_page_preview: true,
            text
        });

        const req = https.request({
            hostname: "api.telegram.org",
            path: "/bot"+BOT_TOKEN+"/sendMessage",
            method: "POST",
            headers:{
                "Content-Type":"application/json",
                "Content-Length":Buffer.byteLength(body)
            }
        },res=>{

            let data="";

            res.on("data",c=>data+=c);

            res.on("end",()=>{
                try{
                    resolve(JSON.parse(data));
                }catch(err){
                    reject(err);
                }
            });

        });

        req.on("error",reject);

        req.write(body);
        req.end();

    });

}

module.exports = {
    kirimTelegram
};
