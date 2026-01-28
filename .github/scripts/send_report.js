const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const TOPIC_ID = process.env.TOPIC_ID;
const WEB_URL = process.env.WEB_URL;

async function checkWebStatus() {
    try {
        const start = Date.now();
        const res = await axios.get(WEB_URL, { timeout: 10000 });
        const duration = Date.now() - start;
        return res.status === 200 
            ? `✅ Online (Speed: ${duration}ms)` 
            : `⚠️ Bermasalah (Status: ${res.status})`;
    } catch (e) {
        return `❌ DOWN (Error: ${e.message})`;
    }
}

async function checkBotStatus() {
    try {
        const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        return res.data.ok ? `✅ Aktif (Bot: ${res.data.result.first_name})` : `❌ Invalid Token`;
    } catch (e) {
        return `❌ Bot Error / API Down`;
    }
}

async function sendReport() {
    console.log("Memulai pengecekan sistem harian...");
    
    const webStatus = await checkWebStatus();
    const botStatus = await checkBotStatus();
    
    const today = new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta'
    });

    const message = `
<b>🛡️ DAILY SYSTEM CHECK (GITHUB)</b>
━━━━━━━━━━━━━━━━━━
📅 <b>Tanggal:</b> ${today}
⏰ <b>Waktu Cek:</b> 07:05 WIB

<b>🌐 STATUS WEBSITE:</b>
${WEB_URL}
Status: <b>${webStatus}</b>

<b>🤖 STATUS BOT TELEGRAM:</b>
Token Sales: <b>${botStatus}</b>

<b>📝 CATATAN:</b>
Laporan pengunjung silakan klik tombol di bawah untuk cek langsung di dashboard.

<i>Laporan ini dikirim otomatis oleh GitHub Actions.</i>
━━━━━━━━━━━━━━━━━━
`;

    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            message_thread_id: TOPIC_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            // MENAMBAHKAN TOMBOL KLIK KE GOOGLE ANALYTICS
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📊 Buka Google Analytics", url: "https://analytics.google.com/analytics/web/?hl=id" }
                    ]
                ]
            }
        });
        console.log("Laporan sukses terkirim ke Telegram!");
    } catch (e) {
        console.error("Gagal mengirim ke Telegram:", e.response ? e.response.data : e.message);
        process.exit(1);
    }
}

sendReport();
