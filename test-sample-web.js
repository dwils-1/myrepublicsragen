const https = require("https");

const DATA_URL = "https://script.google.com/macros/s/AKfycbztPKpwv1jYnakn5P7vn_uupsZt5D7HoejadY7re7JKAKKWD8X6zYA6uFRdz8FMdP46/exec";
const SUMMARY_URL = DATA_URL + "?action=getTableSummary";

function getJSON(url){
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location){
                return resolve(getJSON(res.headers.location));
            }
            let body = "";
            res.on("data", c => body += c);
            res.on("end", () => {
                try { resolve(JSON.parse(body)); }
                catch(e) { reject(e); }
            });
        }).on("error", reject);
    });
}

async function main(){
    console.log("⏳ Mengambil data untuk sampel format website...");
    
    const pelanggan = await getJSON(DATA_URL);
    const summary = await getJSON(SUMMARY_URL);

    const data = pelanggan.data || [];
    const totalSA = summary.totalSA || 0;
    const saLalu = summary.pointKurang || 0;
    const target = Math.max(saLalu - totalSA, 0);
    const bonus = summary.totalBonus || "-";

    const now = new Date();
    const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
    const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    
    const tanggal = hari[now.getDay()] + ", " + now.getDate() + " " + bulan[now.getMonth()] + " " + now.getFullYear();
    const today = now.getDate();

    let siklus = [];
    let warning = [];
    let baru = 0;

    data.forEach(item => {
        const cmd = (item.command || "").toLowerCase();
        if(cmd.includes("warning")) warning.push(item);

        if(item.tanggal){
            const p = item.tanggal.includes("/") ? item.tanggal.split("/") : item.tanggal.split("-");
            let d = item.tanggal.includes("/") ? parseInt(p[0]) : parseInt(p[2]);
            if(d === today) siklus.push(item);
        }

        const t = item.tanggal ? (item.tanggal.includes("/") ? item.tanggal.split("/") : item.tanggal.split("-")) : [];
        let bulanSubs = 0;
        try{
            if(t.length === 3){
                const pasang = item.tanggal.includes("/") ? new Date(t[2], t[1]-1, t[0]) : new Date(t[0], t[1]-1, t[2]);
                bulanSubs = (now.getFullYear() - pasang.getFullYear()) * 12 + (now.getMonth() - pasang.getMonth());
                if(now.getDate() < pasang.getDate()) bulanSubs--;
                if(bulanSubs < 0) bulanSubs = 0;
            }
        }catch(e){}

        if(bulanSubs < 3) baru++;
    });

    let pesan = `🔔 <b>MYREPUBLIC SYSTEM</b>

📅 ${tanggal}

━━━━━━━━━━━━━━━━━━

📊 <b>REKAP HARI INI</b>

💳 Siklus Payment : <b>${siklus.length}</b>
🆕 Pelanggan Baru : <b>${baru}</b>
📈 SA Bulan Ini : <b>${totalSA}</b>
📉 SA Bulan Lalu : <b>${saLalu}</b>
🎯 Target Kurang : <b>${target}</b>
💰 Bonus : <b>${bonus}</b>

━━━━━━━━━━━━━━━━━━

👥 <b>PELANGGAN SIKLUS</b>
`;

    const renderPelanggan = (list) => {
        let str = "";
        list.forEach(x => {
            let hp = String(x.hp || "").trim().replace(/\D/g,"");
            if(hp.startsWith("0")) hp = "62" + hp.substring(1);
            else if(hp && !hp.startsWith("62")) hp = "62" + hp;

            let bulanSubs = 0;
            try{
                const t = String(x.tanggal || "").includes("/") ? x.tanggal.split("/") : x.tanggal.split("-");
                if(t.length === 3){
                    const pasang = x.tanggal.includes("/") ? new Date(t[2], t[1]-1, t[0]) : new Date(t[0], t[1]-1, t[2]);
                    bulanSubs = (now.getFullYear() - pasang.getFullYear()) * 12 + (now.getMonth() - pasang.getMonth());
                    if(now.getDate() < pasang.getDate()) bulanSubs--;
                    if(bulanSubs < 0) bulanSubs = 0;
                }
            }catch(e){}

            const pembayaran = bulanSubs + 1;
            const statusBulan = bulanSubs < 3 ? "🆕 Pelanggan Baru" : "Pelanggan Lama";
            
            let sapaan = "Selamat pagi";
            const jam = now.getHours();
            if(jam >= 11) sapaan = "Selamat siang";
            if(jam >= 15) sapaan = "Selamat sore";
            if(jam >= 18) sapaan = "Selamat malam";

            const wa = `https://wa.me/${hp}?text=` + encodeURIComponent(
`${sapaan} Bapak/Ibu ${x.nama}.

Saat ini layanan WiFi MyRepublic telah memasuki pembayaran bulan ke-${pembayaran}.

Tagihan untuk pembayaran bulan ke-${pembayaran} sudah dapat dilakukan mulai hari ini.

Mohon melakukan pembayaran sebelum tanggal jatuh tempo agar layanan tetap aktif.

Terima kasih atas kepercayaan Bapak/Ibu menggunakan layanan MyRepublic.`
            );

            const linkWA = hp.length > 2 ? `<a href="${wa}">WhatsApp</a>` : "Nomor tidak tersedia";

            str += `• <b>${x.nama}</b>
🆔 ${x.idCst}
📍 ${x.alamat}
🏷️ ${statusBulan}
💳 Pembayaran ke-${pembayaran}
📅 Tanggal Pasang: ${x.tanggal}
💬 ${linkWA}

`;
        });
        return str;
    };

    if(siklus.length){
        pesan += renderPelanggan(siklus);
    } else {
        pesan += "Tidak ada pelanggan siklus hari ini.\n";
    }

    pesan += "━━━━━━━━━━━━━━━━━━\n\n📢 <b>WARNING</b>\n\n";

    if(warning.length){
        pesan += renderPelanggan(warning);
    } else {
        pesan += "Tidak ada pelanggan warning.\n";
    }

    pesan += "━━━━━━━━━━━━━━━━━━\n🤖 MyRepublic System";

    console.log("\n================ SAMPEL FORMAT WEBSITE ================\n");
    console.log(pesan);
    console.log("\n=======================================================\n");
}

main().catch(console.error);
