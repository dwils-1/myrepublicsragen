(function() {
    const phoneNumber = "6281908999242"; 

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) return "Pagi";
        if (hour >= 11 && hour < 15) return "Siang";
        if (hour >= 15 && hour < 18) return "Sore";
        return "Malam";
    }

    function initWA() {
        const footer = document.querySelector('.site-footer');
        
        if (footer) {
            const waContainer = document.createElement('div');
            waContainer.style.cssText = "text-align: center; margin: 30px 0; width: 100%; padding: 10px;";

            const waButton = document.createElement('a');
            
            // Tambahkan status teks agar user tahu apa yang terjadi
            const statusText = document.createElement('p');
            statusText.innerText = "Memverifikasi jangkauan lokasi Anda...";
            statusText.style.cssText = "font-size: 12px; color: #888; margin-bottom: 5px; font-family: sans-serif;";
            
            waButton.href = "#";
            waButton.target = "_blank";
            waButton.innerHTML = `<img src="/images/whatsapp-logo.svg" alt="Hubungi via WhatsApp" style="width: 160px; height: auto; margin: 0 auto;">`;
            
            // Efek interaksi tombol
            waButton.style.cssText = "display: block; text-decoration: none; transition: transform 0.2s; cursor: pointer;";
            waButton.onmouseover = () => waButton.style.transform = "scale(1.05)";
            waButton.onmouseout = () => waButton.style.transform = "scale(1)";

            waContainer.appendChild(statusText);
            waContainer.appendChild(waButton);
            footer.insertBefore(waContainer, footer.firstChild);

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const locationLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                        
                        const finalMessage = `Halo selamat ${getGreeting()},\nsaya ingin bertanya tentang pemasangan MyRepublic.\nuntuk area saya : ${locationLink}`;
                        waButton.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`;
                        statusText.innerText = "klik disini kirim pesan";
                        statusText.style.color = "#25D366"; // Warna khas WA
                    },
                    function(error) {
                        const fallbackMessage = `Halo selamat ${getGreeting()},\nsaya ingin bertanya tentang pemasangan MyRepublic.`;
                        waButton.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(fallbackMessage)}`;
                        statusText.innerText = "GARATIS PASANG, WIFI #TERBAIK";
                    },
                    { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
                );
            } else {
                statusText.innerText = "Klik tombol di bawah untuk konsultasi";
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWA);
    } else {
        initWA();
    }
})();

