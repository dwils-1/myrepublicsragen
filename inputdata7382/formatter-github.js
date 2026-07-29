function formatReport(data){

    const garis = "━━━━━━━━━━━━━━━━━━";

    const render = (list, kosong) =>
        (list || []).map(x => {

            let hp = String(x.hp || "").trim().replace(/\D/g,"");
            if(hp.startsWith("0")) hp = "62" + hp.substring(1);
            else if(hp && !hp.startsWith("62")) hp = "62" + hp;

            let bulanSubs = 0;
            try{
                const t = String(x.tanggal || "").includes("/") ? x.tanggal.split("/") : x.tanggal.split("-");
                if(t.length === 3){
                    const pasang = x.tanggal.includes("/") ? new Date(t[2], t[1]-1, t[0]) : new Date(t[0], t[1]-1, t[2]);
                    const now = new Date();
                    bulanSubs = (now.getFullYear() - pasang.getFullYear()) * 12 + (now.getMonth() - pasang.getMonth());
                    if(now.getDate() < pasang.getDate()) bulanSubs--;
                    if(bulanSubs < 0) bulanSubs = 0;
                }
            }catch(e){}

            const pembayaran = bulanSubs + 1;
            const statusBulan = bulanSubs < 3 ? "🆕 Pelanggan Baru" : "Pelanggan Lama";

            let sapaan = "Selamat pagi";
            const jam = (new Date()).getHours();
            if(jam >= 11) sapaan = "Selamat siang";
            if(jam >= 15) sapaan = "Selamat sore";
            if(jam >= 18) sapaan = "Selamat malam";

            const waText = `${sapaan} Bapak/Ibu ${x.nama}.\n\nSaat ini layanan WiFi MyRepublic telah memasuki pembayaran bulan ke-${pembayaran}.\n\nTagihan untuk pembayaran bulan ke-${pembayaran} sudah dapat dilakukan mulai hari ini.\n\nMohon melakukan pembayaran sebelum tanggal jatuh tempo agar layanan tetap aktif.\n\nTerima kasih atas kepercayaan Bapak/Ibu menggunakan layanan MyRepublic.`;

            const wa = hp.length > 2
                ? `<a href="https://wa.me/${hp}?text=${encodeURIComponent(waText)}">WhatsApp</a>`
                : "Nomor tidak tersedia";

            return `• <b>${x.nama}</b>
🆔 ${x.id}
📍 ${x.alamat}
🏷️ ${statusBulan}
💳 Pembayaran ke-${pembayaran}
📅 Tanggal Pasang: ${x.tanggalPasang || x.tanggal || "-"}
💬 ${wa}`;

        }).join("\n\n") || kosong;

    return `🔔 <b>MYREPUBLIC SYSTEM</b>

📅 ${data.tanggal}

${garis}

📊 <b>REKAP HARI INI</b>

💳 Siklus Payment : <b>${data.totalSiklus}</b>
🆕 Pelanggan Baru : <b>${data.pelangganBaru}</b>
📈 SA Bulan Ini : <b>${data.saBulanIni}</b>
📉 SA Bulan Lalu : <b>${data.saBulanLalu}</b>
🎯 Target Kurang : <b>${data.targetKurang}</b>
💰 Bonus : <b>${data.bonus}</b>

${garis}

👥 <b>PELANGGAN SIKLUS</b>

${render(data.siklus, "Tidak ada pelanggan siklus hari ini.")}

${garis}

📢 <b>WARNING</b>

${render(data.warning, "Tidak ada pelanggan warning.")}

${garis}

🤖 <b>MyRepublic System</b>`;
}

module.exports = {
    formatReport
};
