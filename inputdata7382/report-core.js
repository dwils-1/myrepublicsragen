//
// report-core.js
//

function hitungInfoPelanggan(item){

    let bulan = 0;

    try{

        const p = String(item.tanggal || "").includes("/")
            ? item.tanggal.split("/")
            : item.tanggal.split("-");

        const tgl = String(item.tanggal || "").includes("/")
            ? new Date(p[2], p[1]-1, p[0])
            : new Date(p[0], p[1]-1, p[2]);

        const now = new Date();

        bulan =
            (now.getFullYear() - tgl.getFullYear()) * 12 +
            (now.getMonth() - tgl.getMonth());

        if(now.getDate() < tgl.getDate())
            bulan--;

        if(bulan < 0)
            bulan = 0;

    }catch(e){
        bulan = 0;
    }

    return {

        pembayaran : bulan + 1,

        status :
            bulan < 3
            ? "🆕 Pelanggan Baru"
            : "Pelanggan Lama",

        tanggal :
            item.tanggal || "-"

    };

}

window.ReportCore = {

    hitungInfoPelanggan

};

function hitungBulanSubs(tanggal){

    if(!tanggal) return 0;

    try{

        const p=tanggal.includes("/")
            ? tanggal.split("/")
            : tanggal.split("-");

        const pasang=tanggal.includes("/")
            ? new Date(p[2],p[1]-1,p[0])
            : new Date(p[0],p[1]-1,p[2]);

        const now=new Date();

        let bulan=
            (now.getFullYear()-pasang.getFullYear())*12+
            (now.getMonth()-pasang.getMonth());

        if(now.getDate()<pasang.getDate())
            bulan--;

        return Math.max(0,bulan);

    }catch(e){

        return 0;

    }

}

window.ReportCore.hitungBulanSubs=hitungBulanSubs;



function hitungPelangganBaru(data){

    if(!Array.isArray(data)) return 0;

    let total=0;

    data.forEach(item=>{

        if(hitungBulanSubs(item.tanggal)<3)
            total++;

    });

    return total;

}

window.ReportCore.hitungPelangganBaru=hitungPelangganBaru;



function hitungSiklusHariIni(data){

    if(!Array.isArray(data)) return [];

    const today=(new Date()).getDate();

    return data.filter(item=>{

        if(!item.tanggal) return false;

        try{

            const p=item.tanggal.includes("/")
                ? item.tanggal.split("/")
                : item.tanggal.split("-");

            const d=item.tanggal.includes("/")
                ? parseInt(p[0])
                : parseInt(p[2]);

            return d===today;

        }catch(e){

            return false;

        }

    });

}

window.ReportCore.hitungSiklusHariIni=hitungSiklusHariIni;



function hitungWarning(data){

    if(!Array.isArray(data))
        return [];

    return data.filter(item=>
        String(item.command||"")
        .toLowerCase()
        .includes("warning")
    );

}

window.ReportCore.hitungWarning=hitungWarning;

