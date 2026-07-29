const https = require("https");

const { formatReport } = require("./formatter");
const { kirimTelegram } = require("./telegram");

const DATA_URL =
"https://script.google.com/macros/s/AKfycbztPKpwv1jYnakn5P7vn_uupsZt5D7HoejadY7re7JKAKKWD8X6zYA6uFRdz8FMdP46/exec";

const SUMMARY_URL =
DATA_URL + "?action=getTableSummary";

function getJSON(url){

    return new Promise((resolve,reject)=>{

        https.get(url,res=>{

            if(
                res.statusCode>=300 &&
                res.statusCode<400 &&
                res.headers.location
            ){
                return resolve(
                    getJSON(res.headers.location)
                );
            }

            let body="";

            res.on("data",c=>body+=c);

            res.on("end",()=>{

                try{

                    resolve(JSON.parse(body));

                }catch(e){

                    console.log(body);

                    reject(e);

                }

            });

        }).on("error",reject);

    });

}

async function main(){

    console.log("Mengambil data...");

    const pelanggan =
        await getJSON(DATA_URL);

    const summary =
        await getJSON(SUMMARY_URL);

    console.log(
        "Total Data :",
        pelanggan.data.length
    );

    const now = new Date();

    const today = now.getDate();

    const semua = pelanggan.data || [];

    const siklus = semua.filter(x=>{

        if(!x.tanggal) return false;

        const p=x.tanggal.split("/");

        return Number(p[0])===today;

    });

    const warning = semua.filter(x=>
        (x.command||"")
        .toLowerCase()
        .includes("warning")
    );

    const dataReport={

        tanggal:now.toLocaleDateString(
            "id-ID",
            {
                weekday:"long",
                day:"numeric",
                month:"long",
                year:"numeric"
            }
        ),

        totalSiklus:siklus.length,

        pelangganBaru:summary.totalIdBaru,

        saBulanIni:summary.totalSA,

        saBulanLalu:summary.totalOff,

        targetKurang:summary.pointKurang-summary.totalSA,

        bonus:summary.totalBonus,

        siklus:siklus.map(x=>({

            nama:x.nama,

            id:x.idCst,

            alamat:x.alamat,

            waLink:"https://wa.me/"+String(x.hp).replace(/\D/g,''),

            detailLink:
            "https://myrepublicsragen.my.id/inputdata7382/?id="+x.idCst

        })),

        warning:warning.map(x=>({

            nama:x.nama,

            id:x.idCst,

            alamat:x.alamat,

            waLink:"https://wa.me/"+String(x.hp).replace(/\D/g,''),

            detailLink:
            "https://myrepublicsragen.my.id/inputdata7382/?id="+x.idCst

        }))

    };

    const pesan=formatReport(dataReport);

    console.log(pesan);

    const hasil = await kirimTelegram(pesan);

    console.log(JSON.stringify(hasil, null, 2));

    if (!hasil.ok) {
        throw new Error(hasil.description);
    }

    console.log('✓ Telegram berhasil dikirim');

}

main().catch(console.error);
