const TELEGRAM_TOKEN = "8531770277:AAHKW3KhdwXop-hpu_sE21djyqdu2Wl8vmU";
const TELEGRAM_CHAT_ID = "-1003594385102";
const TELEGRAM_THREAD_ID = "13";

function bukaSpeedtest() {
    const frame = document.getElementById('speedtestFrame');
    frame.src = "https://fast.com/";
    document.getElementById('modalSpeedtest').style.display = 'block';
}

function tutupSpeedtest() {
    document.getElementById('modalSpeedtest').style.display = 'none';
    document.getElementById('speedtestFrame').src = "";
}

function bukaModalSkt() {
    document.getElementById('modalSkt').style.display = 'block';
}

function tutupModalSkt() {
    document.getElementById('modalSkt').style.display = 'none';
}

function setPosisi(isAtLocation) {
    const tikorBox = document.getElementById('tikor-box');
    if (isAtLocation) {
        tikorBox.style.display = 'block';
        ambilLokasi();
    } else {
        tikorBox.style.display = 'none';
        document.getElementById('koordinat').value = "";
    }
}

function ambilLokasi() {
    const status = document.getElementById('status-lokasi');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(p => {
            const val = p.coords.latitude + "," + p.coords.longitude;
            document.getElementById('koordinat').value = val;
            status.innerText = "LOKASI BERHASIL TERKUNCI";
            status.style.color = "green";
        }, () => {
            status.innerText = "Gagal Cek GPS Otomatis";
            status.style.color = "red";
        });
    }
}

window.onclick = function(event) {
    const modalSkt = document.getElementById('modalSkt');
    if (event.target == modalSkt) {
        tutupModalSkt();
    }
}

document.getElementById('formWifi').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const lockScreen = document.getElementById('lock-screen');
    lockScreen.style.display = 'flex';

    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;

    const nama = document.getElementById('nama').value;
    const idPel = document.getElementById('id_pelanggan').value;
    const paket = document.getElementById('paket').value;
    const kendala = document.getElementById('kendala').value;
    const nohp = document.getElementById('nohp').value;
    const alamat = document.getElementById('alamat').value;
    const koordinatValue = document.getElementById('koordinat').value;
    
    const opsiHari = { weekday: 'long' };
    const opsiTgl = { day: 'numeric', month: 'long', year: 'numeric' };
    const sekarang = new Date();
    const hari = sekarang.toLocaleDateString('id-ID', opsiHari);
    const tanggal = sekarang.toLocaleDateString('id-ID', opsiTgl);

    const isiPesan = `COMPLAINT CUSTOMER
-----------------------------
${hari}
${tanggal}

• Nama: ${nama}
• ID Pelanggan: ${idPel}
• Paket: ${paket}
• Kendala: ${kendala}
• No HP: ${nohp}
• Alamat: ${alamat} ${koordinatValue ? '(📌 ' + koordinatValue + ')' : ''}
-----------------------------`;

    const waLink = `https://wa.me/?text=${encodeURIComponent(isiPesan)}`;

    const captionTele = `<b>COMPLAINT CUSTOMER</b>
-----------------------------
${hari}
${tanggal}

• Nama: ${nama}
• ID Pelanggan: ${idPel}
• Paket: ${paket}
• Kendala: ${kendala}
• No HP: ${nohp}
• Alamat: ${alamat} ${koordinatValue ? '(📌 ' + koordinatValue + ')' : ''}
-----------------------------
klik : <a href="${waLink}">Share WhatsApp</a>`;

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('message_thread_id', TELEGRAM_THREAD_ID);
    
    const media = [
        { type: 'video', media: 'attach://vid', caption: captionTele, parse_mode: 'HTML' },
        { type: 'photo', media: 'attach://pic' }
    ];
    
    formData.append('media', JSON.stringify(media));
    formData.append('vid', document.getElementById('video_alat').files[0]);
    formData.append('pic', document.getElementById('ss_speedtest').files[0]);

    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMediaGroup`, {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            alert("Laporan Berhasil Terkirim!");
            // Mengarahkan user ke halaman tujuan
            window.location.href = "https://myrepublicsragen.my.id/";
        } else {
            throw new Error("Gagal kirim ke Telegram.");
        }
    } catch (err) {
        alert("Terjadi Kesalahan: " + err.message);
        lockScreen.style.display = 'none';
        btn.disabled = false;
    }
});
