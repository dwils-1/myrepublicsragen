function formatReport(data){

    const garis = "━━━━━━━━━━━━━━━━━━━━━━";

    const render = (list, kosong) =>
        (list || []).map(x => {

            const wa = x.waLink
                ? `<a href="${x.waLink}">WhatsApp</a>`
                : "-";

            const detail = x.detailLink
                ? `<a href="${x.detailLink}">Buka Data</a>`
                : "-";

            return `• <b>${x.nama}</b>

🆔 <code>${x.id}</code>
📍 ${x.alamat}
🏷️ ${x.status || "-"}
💳 Pembayaran ke-${x.pembayaran || "-"}
📅 Tanggal Pasang: ${x.tanggalPasang || "-"}
💬 ${wa} | 🔎 ${detail}`;

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
💰 Bonus Diterima : <b>${data.bonus}</b>

${garis}

👥 <b>PELANGGAN SIKLUS</b>

${render(data.siklus, "Tidak ada pelanggan siklus.")}

${garis}

📢 <b>WARNING</b>

${render(data.warning, "Tidak ada pelanggan warning.")}

${garis}

🤖 <b>MyRepublic System</b>`;
}

module.exports = {
    formatReport
};
