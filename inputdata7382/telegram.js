//
// telegram.js
//

async function kirimTelegram(pesan){

    console.log("PANJANG PESAN:", pesan.length);

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

        if(pesan.length>3500){

            const bagian=[];

            let sisa=pesan;

            while(sisa.length>3500){

                let potong=sisa.lastIndexOf("\n\n",3500);

                if(potong<1000){
                    potong=3500;
                }

                bagian.push(sisa.substring(0,potong));

                sisa=sisa.substring(potong);
            }

            if(sisa.trim()){
                bagian.push(sisa);
            }

            for(const p of bagian){

                body.text=p;

                console.count("FETCH BAGIAN");

                const rr=await fetch(url,{
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(body)
                });

                const dd=await rr.json();

                if(!rr.ok){
                    console.error(dd);
                    alert(JSON.stringify(dd,null,2));
                    throw new Error(dd.description||"Telegram Error");
                }
            }

            return {ok:true};

        }

        const r=await fetch(url,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(body)
        });


        const data = await r.json();

        if(!r.ok){
            console.error("TELEGRAM ERROR:", data);
            alert(JSON.stringify(data, null, 2));
            throw new Error(data.description || "Telegram Error");
        }

        return data;
    }catch(e){
        console.log(e);
    }finally{
        __telegramSending=false;
    }

}


let __telegramSending=false;

async function testTelegram(){
    if(__telegramSending){
        console.warn("Telegram masih diproses");
        return;
    }
    __telegramSending=true;
    console.count("TEST TELEGRAM DIPANGGIL");

    try{


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

        const cmd = String(item.command || "").trim().toLowerCase();
        if (cmd.includes("off") || cmd.includes("pending")) return;

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

            bulanSubs =
                (now.getFullYear()-pasang.getFullYear())*12 +
                (now.getMonth()-pasang.getMonth());

            if(now.getDate()<pasang.getDate()){
                bulanSubs--;
            }

            if(bulanSubs<0){
                bulanSubs=0;
            }

        }catch(e){}

        if(bulanSubs<3)
            baru++;

    });

    const totalSA=summary.totalSA||0;
    const saLalu=summary.pointKurang||0;
    const target=Math.max(saLalu-totalSA,0);

    let bonus="-";

    try{

        const card=document.getElementById("card-total-diterima");

        if(card){

            const h3=card.querySelector("h3");

            if(h3){
                bonus=h3.innerText.trim();
            }

        }

    }catch(e){
        console.log(e);
    }

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

            let hp=String(x.hp||"").trim();

            hp=hp.replace(/\D/g,"");

            if(hp.startsWith("0")){
                hp="62"+hp.substring(1);
            }else if(hp && !hp.startsWith("62")){
                hp="62"+hp;
            }

            let bulanSubs=0;

            try{

                const t=String(x.tanggal || "").includes("/")
                    ? x.tanggal.split("/")
                    : x.tanggal.split("-");

                const pasang=String(x.tanggal || "").includes("/")
                    ? new Date(t[2],t[1]-1,t[0])
                    : new Date(t[0],t[1]-1,t[2]);

                const sekarang=new Date();

                bulanSubs=
                    (sekarang.getFullYear()-pasang.getFullYear())*12+
                    (sekarang.getMonth()-pasang.getMonth());

                if(sekarang.getDate()<pasang.getDate()){
                    bulanSubs--;
                }

                if(bulanSubs<0){
                    bulanSubs=0;
                }

            }catch(e){}

            const pembayaran=bulanSubs+1;

            const statusBulan=
                bulanSubs<3
                    ? `🆕 Pelanggan Baru`
                    : `Pelanggan Lama`;

            let sapaan="Selamat pagi";

            const jam=(new Date()).getHours();

            if(jam>=11)sapaan="Selamat siang";
            if(jam>=15)sapaan="Selamat sore";
            if(jam>=18)sapaan="Selamat malam";

            const wa=
                `https://wa.me/${hp}?text=`+
                encodeURIComponent(
`${sapaan} Bapak/Ibu ${x.nama}.

Sebagai informasi, layanan MyRepublic Bapak/Ibu telah memasuki siklus pembayaran bulan ke-${pembayaran}.

Pembayaran tagihan sudah dapat dilakukan sesuai jadwal yang berlaku.

Terima kasih atas kepercayaan Bapak/Ibu menggunakan layanan MyRepublic.`
                );

            const linkWA=
                hp.length>2
                    ? `<a href="${wa}">WhatsApp</a>`
                    : "Nomor tidak tersedia";

            pesan+=
`• <b>${x.nama}</b>
🆔 ${x.idCst}
📍 ${x.alamat}
🏷️ ${statusBulan}
💳 Pembayaran ke-${pembayaran}\n📅 Tanggal Pasang: ${x.tanggal}
💬 ${linkWA}

`;

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

            let hp = String(x.hp || "").trim();

            hp = hp.replace(/\D/g, "");

            if (hp.startsWith("0")) {
                hp = "62" + hp.substring(1);
            } else if (!hp.startsWith("62")) {
                hp = "62" + hp;
            }

            let bulanSubs = 0;

            try{
                const t = String(x.tanggal || "").includes("/")
                    ? x.tanggal.split("/")
                    : x.tanggal.split("-");

                const pasang = String(x.tanggal || "").includes("/")
                    ? new Date(t[2], t[1]-1, t[0])
                    : new Date(t[0], t[1]-1, t[2]);

                const sekarang = new Date();

                bulanSubs =
                    (sekarang.getFullYear()-pasang.getFullYear())*12+
                    (sekarang.getMonth()-pasang.getMonth());

                if(sekarang.getDate()<pasang.getDate()){
                    bulanSubs--;
                }

                if(bulanSubs<0){
                    bulanSubs=0;
                }
            }catch(e){}

            const pembayaran = bulanSubs + 1;

            const statusBulan =
                bulanSubs < 3
                    ? `🆕 Pelanggan Baru`
                    : `Pelanggan Lama`;

            const wa =
                `https://wa.me/${hp}?text=` +
                encodeURIComponent(
                    `${sapaan} Bapak/Ibu ${x.nama}.

Sebagai informasi, layanan MyRepublic Bapak/Ibu telah memasuki siklus pembayaran bulan ke-${pembayaran}.

Pembayaran tagihan sudah dapat dilakukan sesuai jadwal yang berlaku.

Terima kasih atas kepercayaan Bapak/Ibu menggunakan layanan MyRepublic.`
                );

            const linkWA =
                hp.length > 2
                    ? `<a href="${wa}">WhatsApp</a>`
                    : "Nomor tidak tersedia";

            pesan +=
`• <b>${x.nama}</b>
🆔 ${x.idCst}
📍 ${x.alamat}
🏷️ ${statusBulan}
💳 Pembayaran ke-${pembayaran}\n📅 Tanggal Pasang: ${x.tanggal}
💬 ${linkWA}

`;

        });

    }else{

        pesan+="Tidak ada pelanggan warning.";

    }

    pesan+="\n\n━━━━━━━━━━━━━━━━━━\n";
    pesan+="🤖 MyRepublic System";

    const popup=document.createElement("dialog");popup.innerHTML=`<div style="padding:24px;text-align:center;min-width:260px"><div style="width:52px;height:52px;margin:auto;border:5px solid #ddd;border-top:5px solid #0ea5e9;border-radius:50%;animation:spin 1s linear infinite"></div><p style="margin-top:16px;font-weight:bold">Mengirim laporan ke Telegram...</p><style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style></div>`;document.body.appendChild(popup);popup.showModal();const hasil=await kirimTelegram(pesan);popup.close();popup.remove();
    __telegramSending=false;

    if(hasil && hasil.ok)
        alert("✅ Telegram Sukses!\n\nLaporan berhasil dikirim.");
    else
        alert("❌ Telegram Gagal!\n\nPeriksa koneksi internet atau Bot Telegram.");

    }catch(err){
        console.error(err);
        alert("❌ Telegram Error!\n\n"+err.message);
    }

}
