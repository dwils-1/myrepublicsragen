const https = require("https");
const { formatReport } = require("../../inputdata7382/formatter-github.js");
const { kirimTelegram } = require("./telegram-node");

global.window = { ReportCore: {} };
require("../../inputdata7382/report-core.js");

const ReportCore = window.ReportCore;
const DATA_URL = "https://script.google.com/macros/s/AKfycbztPKpwv1jYnakn5P7vn_uupsZt5D7HoejadY7re7JKAKKWD8X6zYA6uFRdz8FMdP46/exec";
const SUMMARY_URL = DATA_URL + "?action=getTableSummary";

function getJSON(url){
    return new Promise((resolve,reject)=>{
        https.get(url,res=>{
            if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){
                return resolve(getJSON(res.headers.location));
            }
            let body="";
            res.on("data",c=>body+=c);
            res.on("end",()=>{
                try{resolve(JSON.parse(body));}
                catch(e){reject(e);}
            });
        }).on("error",reject);
    });
}

function info(item){
    let bulan=0;
    try{
        const p=String(item.tanggal||"").includes("/")?
            item.tanggal.split("/"):item.tanggal.split("-");
        const d=String(item.tanggal||"").includes("/")?
            new Date(p[2],p[1]-1,p[0]):
            new Date(p[0],p[1]-1,p[2]);
        const now=new Date();

        bulan=(now.getFullYear()-d.getFullYear())*12+
              (now.getMonth()-d.getMonth());

        if(now.getDate()<d.getDate()) bulan--;
        if(bulan<0) bulan=0;
    }catch(e){}

    return{
        pembayaran:bulan+1,
        status:bulan<3?"🆕 Pelanggan Baru":"Pelanggan Lama",
        tanggal:item.tanggal||"-"
    };
}

async function main(){
    const pelanggan=await getJSON(DATA_URL);
    const summary=await getJSON(SUMMARY_URL);

    const semua=pelanggan.data||[];
    const now=new Date();
    const today=now.getDate();

    const siklus=semua.filter(x=>{
        if(!x.tanggal) return false;
        const p=x.tanggal.includes("/")?x.tanggal.split("/"):x.tanggal.split("-");
        return Number(p[0])===today;
    });

    const warning=semua.filter(x=>
        String(x.command||"").toLowerCase().includes("warning")
    );

    const mapItem=x=>{
        const i=info(x);
        return{
            nama: x.nama,
            id: x.idCst,
            alamat: x.alamat,
            hp: x.hp, // Disertakan agar formatter bisa membuat link WhatsApp otomatis dengan benar
            pembayaran: i.pembayaran,
            status: i.status,
            tanggalPasang: i.tanggal,
            waLink: "https://wa.me/" + String(x.hp||"").replace(/\D/g,""),
            detailLink: "https://myrepublicsragen.my.id/inputdata7382/?id=" + x.idCst
        };
    };

    const pesan=formatReport({
        tanggal:now.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),
        totalSiklus:siklus.length,
        pelangganBaru:semua.filter(x=>{
            if(!x.tanggal)return false;
            const p=x.tanggal.includes("/")?x.tanggal.split("/"):x.tanggal.split("-");
            const d=x.tanggal.includes("/")?new Date(p[2],p[1]-1,p[0]):new Date(p[0],p[1]-1,p[2]);
            let bulan=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());
            if(now.getDate()<d.getDate())bulan--;
            return bulan<3;
        }).length,
        saBulanIni:summary.totalSA,
        saBulanLalu:summary.pointKurang,
        targetKurang:Math.max((summary.pointKurang||0)-(summary.totalSA||0),0),
        bonus:summary.totalBonus,
        siklus:siklus.map(mapItem),
        warning:warning.map(mapItem)
    });

    const hasil=await kirimTelegram(pesan);

    if(!hasil.ok) throw new Error(hasil.description);

    console.log("✓ Telegram berhasil dikirim");
}

main().catch(console.error);
