const https = require("https");

async function kirimTelegram(text) {

    return new Promise((resolve, reject) => {

        const payload = JSON.stringify({

            chat_id: process.env.TELEGRAM_CHAT_ID,
            message_thread_id: Number(process.env.TELEGRAM_THREAD_ID),
            parse_mode: "HTML",
            disable_web_page_preview: true,
            text

        });

        const req = https.request({

            hostname: "api.telegram.org",
            path: `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            }

        }, res => {

            let body = "";

            res.on("data", d => body += d);

            res.on("end", () => {

                try {

                    resolve(JSON.parse(body));

                } catch {

                    reject(body);

                }

            });

        });

        req.on("error", reject);

        req.write(payload);

        req.end();

    });

}

module.exports = { kirimTelegram };
