const https = require("https");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MESSAGE_THREAD_ID = process.env.TELEGRAM_MESSAGE_THREAD_ID;

function kirimBagianTelegram(text){
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            chat_id: CHAT_ID,
            message_thread_id: MESSAGE_THREAD_ID ? Number(MESSAGE_THREAD_ID) : undefined,
            parse_mode: "HTML",
            disable_web_page_preview: true,
            text: text
        });

        const options = {
            hostname: "api.telegram.org",
            port: 443,
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data)
            }
        };

        const req = https.request(options, res => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json);
                } catch(e) {
                    reject(e);
                }
            });
        });

        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

async function kirimTelegram(pesan){
    if(!BOT_TOKEN){
        return { ok: false, description: "TOKEN TELEGRAM BELUM DIISI" };
    }

    // Jika pesan terlalu panjang, bagi menjadi beberapa bagian agar tidak terkena ENTITIES_TOO_LONG
    if(pesan.length > 3000){
        let bagian = [];
        let sisa = pesan;

        while(sisa.length > 3000){
            let potong = sisa.lastIndexOf("\n\n•", 3000);
            if(potong < 500) potong = sisa.lastIndexOf("\n\n", 3000);
            if(potong < 500) potong = 3000;

            bagian.push(sisa.substring(0, potong));
            sisa = sisa.substring(potong);
        }
        if(sisa.trim()) bagian.push(sisa);

        let hasilTerakhir = { ok: true };
        for(const p of bagian){
            hasilTerakhir = await kirimBagianTelegram(p);
            if(!hasilTerakhir.ok) return hasilTerakhir;
        }
        return hasilTerakhir;
    } else {
        return await kirimBagianTelegram(pesan);
    }
}

module.exports = { kirimTelegram };
