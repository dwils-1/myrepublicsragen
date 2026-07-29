//
// telegram.js
//

async function kirimTelegram(pesan){

    if(!CONFIG.TELEGRAM.BOT_TOKEN){
        console.log("TOKEN TELEGRAM BELUM DIISI");
        return;
    }

    const url=
    `https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;

    const body={

        chat_id:CONFIG.TELEGRAM.CHAT_ID,

        message_thread_id:CONFIG.TELEGRAM.MESSAGE_THREAD_ID,

        parse_mode:"HTML",

        disable_web_page_preview:true,

        text:pesan

    };

    try{

        const r=await fetch(url,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(body)
        });

        return await r.json();

    }catch(e){

        console.log(e);

    }

}


async function testTelegram(){

    const now=new Date();

    const hari=[
        "Minggu","Senin","Selasa","Rabu",
        "Kamis","Jumat","Sabtu"
    ];

    const bulan=[
        "Januari","Februari","Maret","April",
        "Mei","Juni","Juli","Agustus",
        "September","Oktober","November","Desember"
    ];

    const tanggal=
        hari[now.getDay()]+", "+
        now.getDate()+" "+
        bulan[now.getMonth()]+" "+
        now.getFullYear();

    const summary=
        JSON.parse(localStorage.getItem("tableSummary")||"{}");

    const data=
        JSON.parse(localStorage.getItem("fullRawData")||"[]");

    const today=now.getDate();

    let siklus=[];
    let warning=[];
    let baru=0;

    data.forEach(item=>{

        const cmd=(item.command||"").toLowerCase();

        if(cmd.includes("warning"))
            warning.push(item);

        if(item.tanggal){

            const p=item.tanggal.includes("/")
                ? item.tanggal.split("/")
                : item.tanggal.split("-");

            let d;

            if(item.tanggal.includes("/"))
                d=parseInt(p[0]);
            else
                d=parseInt(p[2]);

            if(d===today)
                siklus.push(item);

        }

        const t=item.tanggal.includes("/")
            ? item.tanggal.split("/")
            : item.tanggal.split("-");

        let bulanSubs=0;

        try{

            const pasang=item.tanggal.includes("/")
                ? new Date(t[2],t[1]-1,t[0])
                : new Date(t[0],t[1]-1,t[2]);

            bulanSubs=Math.floor(
                (now-pasang)/(1000*60*60*24*30)
            );

        }catch(e){}

        if(bulanSubs<3)
            baru++;

    });

    const totalSA=summary.totalSA||0;
    const saLalu=summary.pointKurang||0;
    const target=Math.max(saLalu-totalSA,0);

    const bonus=document
        .getElementById("total-diterima")
        ?.innerText || "-";

    let pesan=
`🔔 <b>MYREPUBLIC SYSTEM</b>

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

    if(siklus.length){

        siklus.forEach(x=>{
            pesan+="• "+x.nama+"\n";
        });

    }else{

        pesan+="Tidak ada pelanggan siklus hari ini.\n";

    }

    pesan+="\n━━━━━━━━━━━━━━━━━━\n\n";
    pesan+="📢 <b>WARNING</b>\n\n";

    if(warning.length){

        warning.forEach(x=>{

            let sapaan="Selamat pagi";

            const jam=(new Date()).getHours();

            if(jam>=11)sapaan="Selamat siang";
            if(jam>=15)sapaan="Selamat sore";
            if(jam>=18)sapaan="Selamat malam";

            const wa=
                "https://wa.me/62"+
                String(x.hp||"")
                .replace(/^0/,"")
                +"?text="+
                encodeURIComponent(
                    sapaan+
                    " Bapak/Ibu "+x.nama+
                    ". Saat ini tagihan WiFi sudah dapat dibayarkan. Mohon segera melakukan pembayaran. Terima kasih."
                );

            pesan+=
`• <b>${x.nama}</b>
🆔 ${x.idCst}
📍 ${x.alamat}
💬 <a href="${wa}">WhatsApp</a>

`;

        });

    }else{

        pesan+="Tidak ada pelanggan warning.";

    }

    pesan+="\n\n━━━━━━━━━━━━━━━━━━\n";
    pesan+="🤖 MyRepublic System";

    const hasil=await kirimTelegram(pesan);

    if(hasil && hasil.ok)
        alert("✅ Report berhasil dikirim.");
    else
        alert("❌ Report gagal.");

}
