const TELEGRAM_TOKEN = "8531770277:AAHKW3KhdwXop-hpu_sE21djyqdu2Wl8vmU";
const TELEGRAM_CHAT_ID = "-1003594385102"; // ID Grup Supergroup Anda
const TELEGRAM_THREAD_ID = "13"; // ID Topik Komplain terbaru (berdasarkan tautan https://t.me/c/3594385102/13/14)

function updateWaktuOtomatis() {
    const sekarang = new Date();
    const opsiHari = { weekday: 'long' };
    const opsiTanggal = { day: '2-digit', month: 'long', year: 'numeric' };
    
    document.getElementById('auto-hari').innerText = sekarang.toLocaleDateString('id-ID', opsiHari);
    document.getElementById('auto-tanggal').innerText = sekarang.toLocaleDateString('id-ID', opsiTanggal);
}

function hitungDeadline() {
    const sekarang = new Date();
    const deadline = new Date(sekarang.getTime() + (3 * 60 * 60 * 1000));
    const formatJam = deadline.getHours().toString().padStart(2, '0');
    const formatMenit = deadline.getMinutes().toString().padStart(2, '0');
    document.getElementById('waktu-deadline').innerText = formatJam + ":" + formatMenit;
}

function setPosisi(isAtLocation) {
    const tikorBox = document.getElementById('tikor-box');
    const koordinatInput = document.getElementById('koordinat');
    if (isAtLocation) {
        tikorBox.style.display = 'block';
        if (!koordinatInput.value) ambilLokasi(); 
    } else {
        tikorBox.style.display = 'none';
        koordinatInput.value = ""; 
        document.getElementById('status-lokasi').innerHTML = "Koordinat dibatalkan.";
    }
}

function ambilLokasi() {
    const status = document.getElementById('status-lokasi');
    const koordinatInput = document.getElementById('koordinat');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            koordinatInput.value = position.coords.latitude + "," + position.coords.longitude;
            status.innerHTML = "BERHASIL: " + koordinatInput.value;
            status.style.color = "green";
        }, function(error) {
            status.innerHTML = "GAGAL! Mohon aktifkan GPS.";
            status.style.color = "red";
        }, { enableHighAccuracy: true, timeout: 10000 });
    }
}

function bukaModal() { 
    hitungDeadline(); 
    document.getElementById('modalSkt').style.display = 'block'; 
}

function tutupModal() { 
    document.getElementById('modalSkt').style.display = 'none'; 
}

function unlockAgreement() {
    const cb = document.getElementById('setuju');
    const container = document.getElementById('agreement-container');
    cb.disabled = false; 
    cb.checked = true;
    container.classList.remove('locked');
    tutupModal();
}

document.getElementById('formWifi').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const loader = document.getElementById('loading-video');
    const videoFile = document.getElementById('video_alat').files[0];

    btn.disabled = true;
    btn.innerText = "MENGIRIM...";
    loader.style.display = "block";

    const nama = document.getElementById('nama').value;
    const idPel = document.getElementById('id_pelanggan').value;
    const paket = document.getElementById('paket').value;
    const kendala = document.getElementById('kendala').value;
    const alamat = document.getElementById('alamat').value;
    const nohp = document.getElementById('nohp').value;
    const koordinatValue = document.getElementById('koordinat').value;
    const hari = document.getElementById('auto-hari').innerText;
    const tanggal = document.getElementById('auto-tanggal').innerText;

    const barisKoordinat = koordinatValue ? `📌 Kordinator : ${koordinatValue}` : ``;

    const pesanWhatsApp = `COMPLAINT CUSTOMER%0A-----------------------------%0A${hari}%0A${tanggal}%0A%0A👤 Nama: ${nama}%0A🆔 ID Pelanggan: ${idPel}%0A🚀 Paket : ${paket}%0A🛠️ Kendala : ${kendala}%0A📱 No HP : ${nohp}%0A🏠 Alamat : ${alamat}%0A${barisKoordinat}%0A-----------------------------`;
    const waLink = `https://wa.me/?text=${pesanWhatsApp}`;

    const pesanTelegram = `*COMPLAINT CUSTOMER*\n-----------------------------\n${hari}\n${tanggal}\n\n👤 Nama: ${nama}\n🆔 ID Pelanggan: ${idPel}\n🚀 Paket : ${paket}\n🛠️ Kendala : ${kendala}\n📱 No HP : ${nohp}\n🏠 Alamat : ${alamat}\n${barisKoordinat}\n-----------------------------\nKLIK: <a href="${waLink}">WhatsApp</a>`;

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('message_thread_id', TELEGRAM_THREAD_ID); // Diarahkan ke Topik 13 (Komplain)
    formData.append('video', videoFile); 
    formData.append('caption', pesanTelegram); 
    formData.append('parse_mode', 'HTML');

    const urlTelegram = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`;
    
    try {
        const response = await fetch(urlTelegram, {
            method: 'POST',
            body: formData 
        });

        if (response.ok) {
            alert("Laporan & Video Berhasil Terkirim ke Tim Support!");
            document.getElementById('formWifi').reset();
            location.reload();
        } else {
            const res = await response.json();
            alert("Gagal Kirim! Detail: " + res.description);
        }
    } catch (error) {
        alert("Terjadi kesalahan sistem: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Kirim Laporan";
        loader.style.display = "none";
    }
});

window.onload = function() { 
    updateWaktuOtomatis(); 
    ambilLokasi(); 
};
