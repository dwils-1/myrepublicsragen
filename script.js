/* ==========================================================================
   KONFIGURASI UTAMA
   ========================================================================== */

// --- KONFIGURASI BOT 1 (SALES & CHAT) ---
const BOT_TOKEN = '8330506170:AAH8JHSDZ-r99YxkGu4Y-bwCea4Ap2TGhOc';
const CHAT_ID = '-1003594385102'; // ID Grup Supergroup
const TOPIC_ID = '2'; // Topik MyRepublic (Sales/Chat)

// --- KONFIGURASI BOT 2 (KOMPLAIN/GANGGUAN) ---
const TOKEN_COMPLAINT = "8531770277:AAHKW3KhdwXop-hpu_sE21djyqdu2Wl8vmU";
const TOPIC_COMPLAINT = "13"; // Topik Komplain (Sesuai Website Kedua)

// --- KONFIGURASI STORAGE & SISTEM ---
const STORAGE_KEY = 'chat_history_sragen';
const USER_DATA_KEY = 'user_registered_chat';
const SESSION_STATUS_KEY = 'chat_session_active';
const LAST_UPDATE_KEY = 'last_update_id_sragen';
const UNREPLIED_COUNT_KEY = 'unreplied_msg_count';
const COORDS_CACHE_KEY = 'user_location_coords';
const COVERAGE_STORAGE_KEY = 'sragen_coverage_cache';
const SESSION_ID_KEY = 'mr_sragen_sid';
const REG_SUCCESS_KEY = 'is_registered_success';

const URL_SHEET1_PROMO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStVKNVl4FfeX193YQRDEFGE32rSDirwTdTY-unjHs5OseIiBROW0KKaMRtVTmMhQg0bnqmo3gaAejO/pub?gid=0&single=true&output=csv";
const URL_SHEET2_HARGA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStVKNVl4FfeX193YQRDEFGE32rSDirwTdTY-unjHs5OseIiBROW0KKaMRtVTmMhQg0bnqmo3gaAejO/pub?gid=500363833&single=true&output=csv";

let lastUpdateId = parseInt(localStorage.getItem(LAST_UPDATE_KEY)) || 0;
let isProcessingPolling = false;
let map; 

let globalReviews = [];
let currentlyDisplayedNames = [];

// Init Session ID jika belum ada
if(!localStorage.getItem(SESSION_ID_KEY)) {
    localStorage.setItem(SESSION_ID_KEY, 'SID-' + Date.now());
}

/* ==========================================================================
   BAGIAN 1: FITUR WEBSITE UTAMA (EXISTING)
   ========================================================================== */

function handleKeyboardShow() {
    const chatWidget = document.getElementById('chat-widget');
    const visualViewport = window.visualViewport;

    if (visualViewport) {
        const onResize = () => {
            if (chatWidget.style.display === 'flex') {
                const viewportHeight = visualViewport.height;
                const windowHeight = window.innerHeight;
                
                if (viewportHeight < windowHeight * 0.8) {
                    chatWidget.style.height = `${viewportHeight}px`;
                    chatWidget.style.bottom = `${windowHeight - viewportHeight}px`;
                    setTimeout(scrollBottom, 100);
                } else {
                    if (window.innerWidth >= 640) {
                        chatWidget.style.height = '550px';
                        chatWidget.style.bottom = '25px';
                    } else {
                        chatWidget.style.height = '80vh';
                        chatWidget.style.bottom = '0';
                    }
                }
            }
        };
        visualViewport.addEventListener('resize', onResize);
    }

    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            setTimeout(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
}

async function initCoverageMap() {
    const sragenCenter = [-7.4277, 111.0225];
    if(!document.getElementById('map-coverage')) return;

    map = L.map('map-coverage', {
        preferCanvas: true 
    }).setView(sragenCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© MyRepublic Sragen'
    }).addTo(map);

    try {
        const response = await fetch('sragen_coverage.json');
        if (!response.ok) throw new Error("File JSON tidak ditemukan");
        
        const coverageData = await response.json();
        localStorage.setItem(COVERAGE_STORAGE_KEY, JSON.stringify(coverageData));

        coverageData.forEach(point => {
            const lat = point[1];
            const lng = point[0];
            L.circleMarker([lat, lng], {
                radius: 4,               
                fillColor: "#6c2d91",    
                color: "#fff",           
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup("Area Tercover MyRepublic");
        });

        L.marker(sragenCenter).addTo(map)
            .bindPopup("<b>Pusat Layanan Sragen</b><br>Jl. Raya Sukowati No. 120")
            .openPopup();

    } catch (error) {
        console.error("Gagal memuat peta coverage:", error);
    }
}

async function fetchPricesFromSheets() {
    const tableBody = document.getElementById('price-table-body');
    const sliderContainer = document.getElementById('price-slider-container');
    const paketContainer = document.getElementById('paket-container');
    if(!tableBody || !sliderContainer) return;

    try {
        const response = await fetch(URL_SHEET2_HARGA + '&cb=' + Date.now());
        const data = await response.text();
        const rows = data.split(/\r?\n/).filter(r => r.trim() !== '');

        if (rows.length <= 1) {
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Belum ada paket tersedia.</td></tr>';
            sliderContainer.innerHTML = '<div class="text-center w-full py-5">Belum ada paket tersedia.</div>';
            return;
        }

        const contentRows = rows.slice(1);
        let htmlTable = '';
        let htmlCards = '';

        contentRows.forEach(row => {
            let cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (cols.length >= 3) {
                const namaPaket = cols[0].replace(/"/g, '').trim();
                let rawSpeed = cols[1].replace(/"/g, '').trim();
                const harga = cols[2].replace(/"/g, '').trim();
                
                let badgeColor = "bg-secondary";
                const speedVal = parseInt(rawSpeed);
                if(speedVal >= 30) badgeColor = "bg-primary";
                if(speedVal >= 100) badgeColor = "bg-info text-dark";
                if(speedVal >= 200) badgeColor = "bg-danger";

                let speedDisplay;
                const lowerSpeed = rawSpeed.toLowerCase();
                if (lowerSpeed.includes("gbps")) {
                    speedDisplay = rawSpeed; 
                } else if (lowerSpeed.includes("mbps")) {
                    speedDisplay = rawSpeed; 
                } else {
                    speedDisplay = `${rawSpeed} Mbps`; 
                }

                htmlTable += `
                <tr class="table-row-hover">
                    <td>
                        <div class="cell-stack">
                            <span class="top-text">${namaPaket}</span>
                            <span class="bottom-text">${harga}</span>
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="badge ${badgeColor} rounded-pill badge-speed-table">${speedDisplay}</span>
                    </td>
                    <td class="text-center">
                        <button onclick="openRegistrationModal('${namaPaket}')" class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 text-xs">Pilih</button>
                    </td>
                </tr>`;

                htmlCards += `
                <div class="price-feature-card">
                    <div class="price-card-header">
                        <h3 class="fw-bold m-0 h6">${namaPaket}</h3>
                    </div>
                    <div class="price-card-body">
                        <span class="speed-badge-card">${speedDisplay}</span>
                        <div class="price-val mb-2">${harga}</div>
                        <p class="text-muted mb-4" style="font-size:0.7rem;">Unlimited Fiber Optic<br>Tanpa Batasan FUP</p>
                        <button onclick="openRegistrationModal('${namaPaket}')" class="btn btn-primary w-100 py-2 text-sm">Daftar Sekarang</button>
                    </div>
                </div>`;
            }
        });

        tableBody.innerHTML = htmlTable || '<tr><td colspan="3" class="text-center py-4">Data tidak ditemukan.</td></tr>';
        sliderContainer.innerHTML = htmlCards || '<div class="text-center w-full py-5">Data tidak ditemukan.</div>';
        
        if(paketContainer) {
            paketContainer.classList.add('show');
        }

    } catch (error) {
        console.error("Error Sheet Harga:", error);
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Gagal terhubung ke Database.</td></tr>';
        sliderContainer.innerHTML = '<div class="text-center w-full py-5 text-danger">Gagal memuat paket.</div>';
    }
}

async function fetchPromoFromSheets() {
    const wrapper = document.getElementById('gallery-wrapper');
    if(!wrapper) return;
    try {
        const response = await fetch(URL_SHEET1_PROMO + '&cb=' + Date.now());
        const data = await response.text();
        const rowArray = data.split(/\r?\n/).filter(r => r.trim() !== '');
        
        if (rowArray.length <= 1) {
            wrapper.innerHTML = '<div class="col-12 text-center text-muted py-4">Belum ada promo aktif.</div>';
            return;
        }

        let contentRows = rowArray.slice(1).reverse();
        let htmlContent = '';
        contentRows.forEach(row => {
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (columns.length >= 3) {
                const nama = columns[0].replace(/"/g, '').trim();
                const deskripsi = columns[1].replace(/"/g, '').trim(); 
                let imgRaw = columns[2].replace(/"/g, '').trim();
                const imgDirect = convertToDirectLink(imgRaw);

                if (imgDirect && imgDirect !== "") {
                    htmlContent += `
                        <div class="col-6 col-md-4 col-lg-3 gallery-item">
                            <div class="promo-img-wrapper">
                                <img src="${imgDirect}" alt="${nama}" loading="lazy" onerror="handleImageError(this)" onclick="openLightbox(this.src)">
                            </div>
                            <h4 class="promo-title">${nama}</h4>
                            <p class="promo-desc">${deskripsi}</p>
                        </div>`;
                }
            }
        });
        wrapper.innerHTML = htmlContent || '<div class="col-12 text-center text-muted py-4">Data promo tidak ditemukan.</div>';
    } catch (error) {
        console.error("Promo error:", error);
        wrapper.innerHTML = '<div class="col-12 text-center text-red-500 py-4">Gagal memuat promo.</div>';
    }
}

function initReviewDatabase() {
    const firstNames = ["Budi", "Siti", "Agus", "Rahmat", "Dewi", "Lilik", "Eko", "Andi", "Sri", "Hadi", "Indah", "Aris", "Yulia", "Wahyu", "Tono", "Wati", "Gatot", "Sari", "Roni", "Asep", "Dedi", "Maya", "Bambang", "Ratna", "Surya"];
    const lastNames = ["Santoso", "Hidayat", "Wijaya", "Kurniawan", "Aminah", "Lestari", "Mulyono", "Saputra", "Pratama", "Susanto", "Rahayu", "Wibowo", "Nugroho", "Setyawan", "Purnomo", "Utomo", "Kusuma", "Budiman", "Gunawan", "Yulianto"];
    const comments = [
        "Internetnya kenceng banget buat mabar ML di Karangmalang gak pernah lag!",
        "Proses pasangnya cepet, teknisinya ramah. Recomended buat warga Sragen.",
        "Harga flat terus gak naik-naik, mantap MyRepublic!",
        "Akhirnya ada fiber murni di Sidoharjo, streaming Netflix 4K lancar jaya.",
        "Gak nyesel ganti dari sebelah, di sini beneran tanpa batasan kuota.",
        "Ping kecil banget, cocok buat main Valorant atau CSGO.",
        "Pelayanan admin Sragen ramah and gercep kalau ada kendala.",
        "Sudah pasang 6 bulan, koneksi stabil biarpun hujan deras.",
        "Wifi jangkauannya luas sampai ke lantai atas rumah.",
        "Harga promo 10Ring bener-bener nolong buat mahasiswa kayak saya.",
        "Area Ngrampal sudah masuk, sinyal full terus!",
        "Streaming Youtube 4K anak-anak lancar nggak pake buffering.",
        "MyRepublic Sragen top bgt, sukses terus layanannya.",
        "Akses kerja dari rumah (WFH) jadi lebih tenang pake MyRepublic.",
        "Baru pasang kemarin, langsung dipake download file gede beres cepet."
    ];

    let database = [];
    let nameSet = new Set();
    while(database.length < 500) {
        let fname = firstNames[Math.floor(Math.random() * firstNames.length)];
        let lname = lastNames[Math.floor(Math.random() * lastNames.length)];
        let fullName = fname + " " + lname;
        if(!nameSet.has(fullName)) {
            nameSet.add(fullName);
            database.push({
                name: fullName,
                comment: comments[Math.floor(Math.random() * comments.length)],
                rating: (Math.random() * (5 - 4.5) + 4.5).toFixed(1)
            });
        }
    }
    globalReviews = database;
}

function refreshReviews() {
    const container = document.getElementById('review-container');
    if(!container) return;
    
    let selected = [];
    let tempPool = [...globalReviews].sort(() => Math.random() - 0.5);

    for (let item of tempPool) {
        if (!currentlyDisplayedNames.includes(item.name)) {
            selected.push(item);
        }
        if (selected.length === 3) break;
    }

    currentlyDisplayedNames = selected.map(s => s.name);
    let html = '';
    selected.forEach(rev => {
        const initial = rev.name.charAt(0);
        const ratingNum = parseFloat(rev.rating);
        const fullStars = Math.floor(ratingNum);
        let starString = "";
        for(let i=1; i<=5; i++) {
            starString += i <= fullStars ? "★" : "☆";
        }

        html += `
        <div class="col-md-4 animate__animated animate__fadeIn">
            <article class="review-card">
                <div class="flex items-center mb-3">
                    <div class="user-avatar mr-3">${initial}</div>
                    <div>
                        <h3 class="fw-bold m-0 text-sm h6">${rev.name}</h3>
                        <div class="star-rating" aria-label="Rating ${rev.rating} dari 5">
                            ${starString} 
                            <span class="text-xs text-gray-400 font-bold ml-1">(${rev.rating})</span>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-gray-500 italic">"${rev.comment}"</p>
            </article>
        </div>`;
    });

    container.style.opacity = 0;
    setTimeout(() => {
        container.innerHTML = html;
        container.style.opacity = 1;
    }, 500);
}

function convertToDirectLink(url) {
    if (!url) return "";
    if (url.includes("canva.com")) return url.trim(); 
    const regex = /(?:\/file\/d\/|id=)([\w-]+)/;
    const match = url.match(regex);
    if (match && match[1]) return `https://docs.google.com/uc?export=view&id=${match[1]}`;
    return url.trim();
}

function checkRegistrationStatus() {
    const isRegistered = localStorage.getItem(REG_SUCCESS_KEY) === 'true';
    if (isRegistered) {
        const fields = document.getElementById('reg-form-fields');
        const note = document.getElementById('reg-success-note');
        if(fields) fields.style.display = 'none';
        if(note) note.style.display = 'block';
    }
}

function openLightbox(src) {
    const overlay = document.getElementById('lightbox-overlay');
    const img = document.getElementById('lightbox-img');
    img.src = src;
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 10);
    document.body.style.overflow = 'hidden'; 
}
function closeLightbox() {
    const overlay = document.getElementById('lightbox-overlay');
    overlay.classList.remove('show');
    setTimeout(() => {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto'; 
    }, 300);
}
function handleImageError(img) {
    const galleryItem = img.closest('.gallery-item');
    if (galleryItem) galleryItem.style.display = 'none';
}

function forcePrecisionLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {}, { enableHighAccuracy: true });
        navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const accuracy = pos.coords.accuracy;
                if (accuracy < 100) {
                    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
                    localStorage.setItem(COORDS_CACHE_KEY, mapLink);
                    localStorage.setItem('raw_lat', lat);
                    localStorage.setItem('raw_lng', lng);
                }
            },
            (err) => {},
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    }
}

async function getGuaranteedCoords() {
    return new Promise((resolve) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (p) => {
                    const lat = p.coords.latitude;
                    const lng = p.coords.longitude;
                    const link = `https://www.google.com/maps?q=${lat},${lng}`;
                    localStorage.setItem(COORDS_CACHE_KEY, link);
                    localStorage.setItem('raw_lat', lat);
                    localStorage.setItem('raw_lng', lng);
                    resolve({ lat, lng, link });
                },
                (error) => {
                    const cachedLat = localStorage.getItem('raw_lat');
                    const cachedLng = localStorage.getItem('raw_lng');
                    if (cachedLat && cachedLng) {
                        resolve({ 
                            lat: parseFloat(cachedLat), 
                            lng: parseFloat(cachedLng), 
                            link: localStorage.getItem(COORDS_CACHE_KEY) 
                        });
                    } else { resolve(null); }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        } else { resolve(null); }
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function getFullAddressOnline(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data && data.address) {
            return {
                road: data.address.road || "",
                village: data.address.village || data.address.suburb || data.address.town || "",
                district: data.address.city_district || data.address.county || "",
                city: data.address.city || data.address.regency || "Sragen",
                postcode: data.address.postcode || "",
                state: data.address.state || "Jawa Tengah",
                full: data.display_name
            };
        }
        return null;
    } catch (e) { return null; }
}

async function handleAutoGpsSearch() {
    const resultBox = document.getElementById('search-result');
    const btnMain = document.getElementById('btn-cek-lokasi');
    const statusTextMain = document.getElementById('status-gps-text');
    const btnMap = document.getElementById('btn-cek-lokasi-map');
    const btnMapText = document.getElementById('btn-cek-lokasi-map-text');

    resultBox.style.display = 'none';
    if(statusTextMain) statusTextMain.innerHTML = `<span class="gps-loading mr-2"></span> Sedang mengunci koordinat GPS...`;
    if(btnMain) { btnMain.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`; btnMain.disabled = true; }
    if(btnMap) btnMap.disabled = true;
    if(btnMapText) btnMapText.innerText = "Mengambil Alamat...";

    try {
        const locationData = await getGuaranteedCoords();
        if (!locationData) throw new Error("Akses lokasi gagal. Pastikan GPS aktif.");

        const sragenCenter = [-7.4277, 111.0225];
        const distFromSragenCenter = calculateDistance(locationData.lat, locationData.lng, sragenCenter[0], sragenCenter[1]);
        const isOutsideSragen = distFromSragenCenter > 35;

        let closestFatDist = 9999;
        let coverageData = JSON.parse(localStorage.getItem(COVERAGE_STORAGE_KEY) || '[]');

        coverageData.forEach(coord => {
            const d = calculateDistance(locationData.lat, locationData.lng, coord[1], coord[0]);
            if (d < closestFatDist) closestFatDist = d;
        });

        const distInMeters = closestFatDist * 1000;
        let formattedDist = distInMeters < 1000 ? `${distInMeters.toFixed(0)} meter` : `${closestFatDist.toFixed(2)} KM`;
        const isCovered = distInMeters <= 250;
        
        const addr = await getFullAddressOnline(locationData.lat, locationData.lng);
        resultBox.style.display = 'block';

        if (isOutsideSragen) {
            resultBox.className = "search-result-box p-4 text-center text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200";
            resultBox.innerHTML = `📍 Lokasi Anda saat ini di <b>${addr ? addr.village : 'Luar Wilayah'}</b> berada di luar jangkauan Cabang Sragen.`;
            if(statusTextMain) statusTextMain.innerText = "Status: LUAR WILAYAH";
        } else if (isCovered) {
            resultBox.className = "search-result-box p-4 text-center text-sm font-semibold bg-green-100 text-green-700 border border-green-200";
            resultBox.innerHTML = `✅ Lokasi Anda saat ini di <b>${addr ? addr.village : 'Sragen'}</b> sudah tercover.<br><small>Jarak: ±${formattedDist}.</small>`;
            if(statusTextMain) statusTextMain.innerText = "Status: TERCOVER";
        } else {
            resultBox.className = "search-result-box p-4 text-center text-sm font-semibold bg-red-100 text-red-700 border border-red-200";
            resultBox.innerHTML = `⚠️ Lokasi Anda saat ini di <b>${addr ? addr.village : 'Sragen'}</b> belum tercover.<br><small>Jarak: ±${formattedDist}.</small>`;
            if(statusTextMain) statusTextMain.innerText = "Status: BELUM TERCOVER";
        }

        if(map) {
            map.setView([locationData.lat, locationData.lng], 16);
            L.marker([locationData.lat, locationData.lng]).addTo(map).bindPopup("Posisi Anda").openPopup();
        }

        const msg = `🔍 <b>CEK COVERAGE AUTOMATIC</b>\n` +
                    `━━━━━━━━━━━━━━━\n` +
                    `📍 <b>Desa:</b> ${addr ? addr.village : 'Sragen'}\n` +
                    `🎯 <b>Jarak ke FAT:</b> ${formattedDist}\n` +
                    `✅ <b>Status:</b> ${isOutsideSragen ? 'LUAR SRAGEN' : (isCovered ? 'TERCOVER' : 'BELUM TERCOVER')}\n` +
                    `🆔 <b>Session:</b> <code>${localStorage.getItem(SESSION_ID_KEY)}</code>\n` +
                    `🗺️ <a href="${locationData.link}">Buka Lokasi User</a>`;
        await telegramFetch(msg);
    } catch (error) {
        if(statusTextMain) statusTextMain.innerText = "GPS Error";
        resultBox.style.display = 'block';
        resultBox.innerHTML = `❌ Gagal: ${error.message}`;
    }
    if(btnMain) { btnMain.innerHTML = "Cek Ulang"; btnMain.disabled = false; }
    if(btnMap) btnMap.disabled = false;
    if(btnMapText) btnMapText.innerText = "Cek Cover Area";
}

function isValidEmail(email) { 
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); 
}
function isValidWhatsApp(wa) { 
    return /^(08|628|\+628)[0-9]{8,15}$/.test(wa.replace(/\s/g, '')); 
}

function updateChatLockUI() {
    const count = parseInt(localStorage.getItem(UNREPLIED_COUNT_KEY)) || 0;
    const overlay = document.getElementById('chat-blocked-overlay');
    const inputArea = document.getElementById('input-container-chat');
    if (count >= 5) {
        if(overlay) overlay.style.display = 'flex';
        if(inputArea) inputArea.classList.add('status-blocked');
    } else {
        if(overlay) overlay.style.display = 'none';
        if(inputArea) inputArea.classList.remove('status-blocked');
    }
}

function sanitizeText(str) {
    if (!str) return "";
    return str.toString()
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, '"') 
        .replace(/'/g, "'");
}

// === TELEGRAM HELPERS (BOT 1 - SALES) ===

async function telegramFetch(text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: CHAT_ID, 
                message_thread_id: TOPIC_ID, 
                text: text, 
                parse_mode: 'HTML',
                disable_web_page_preview: false
            })
        });
        return await response.json();
    } catch (e) { 
        console.error("Network Error:", e);
        return { ok: false }; 
    }
}

async function telegramSendMediaGroup(files, caption) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('message_thread_id', TOPIC_ID);

    const media = [];
    files.forEach((file, index) => {
        if (file) {
            formData.append(`photo${index}`, file);
            media.push({
                type: 'photo',
                media: `attach://photo${index}`,
                caption: index === 0 ? caption : '', 
                parse_mode: 'HTML'
            });
        }
    });

    formData.append('media', JSON.stringify(media));

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (e) {
        console.error("Gagal mengirim media group:", e);
        return { ok: false };
    }
}

function toggleChat() {
    const chat = document.getElementById('chat-widget');
    const btn = document.getElementById('chat-toggle-btn');
    if (chat.style.display === 'flex') {
        chat.style.display = 'none'; btn.style.display = 'block';
    } else {
        chat.style.display = 'flex'; btn.style.display = 'none';
        if(localStorage.getItem(USER_DATA_KEY)) document.getElementById('chat-form-overlay').style.display = 'none';
        checkSessionStatus(); 
        updateChatLockUI();
        scrollBottom();
    }
}

function createWaLink(phone, message) {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) { cleanPhone = '62' + cleanPhone.slice(1); }
    if (cleanPhone.startsWith('8')) { cleanPhone = '62' + cleanPhone; }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

async function submitChatForm() {
    const nama = document.getElementById('chat-reg-nama').value.trim();
    const email = document.getElementById('chat-reg-email').value.trim();
    const waRaw = document.getElementById('chat-reg-wa').value.trim();
    const btn = document.getElementById('btn-start-chat');

    if(!nama || !isValidEmail(email) || !isValidWhatsApp(waRaw)) { alert("Data tidak valid!"); return; }
    
    btn.disabled = true;
    btn.innerText = "Memproses...";

    let isCovered = false;
    let currentLat = localStorage.getItem('raw_lat');
    let currentLng = localStorage.getItem('raw_lng');
    
    if(currentLat && currentLng) {
        let closestDist = 9999;
        let coverageData = JSON.parse(localStorage.getItem(COVERAGE_STORAGE_KEY) || '[]');
        coverageData.forEach(coord => {
            const d = calculateDistance(parseFloat(currentLat), parseFloat(currentLng), coord[1], coord[0]);
            if (d < closestDist) closestDist = d;
        });
        if ((closestDist * 1000) <= 250) isCovered = true;
    }

    localStorage.setItem(USER_DATA_KEY, JSON.stringify({ nama, email, wa: waRaw }));
    localStorage.setItem(SESSION_STATUS_KEY, 'active');
    document.getElementById('chat-form-overlay').style.display = 'none';
    
    const loc = localStorage.getItem(COORDS_CACHE_KEY) || "Peta tidak tersedia";
    
    const msg = `<b>👤 KONSULTASI BARU</b>\n` +
                `━━━━━━━━━━━━━━━\n` +
                `📛 <b>Nama:</b> ${sanitizeText(nama)}\n` +
                `📱 <b>WhatsApp:</b> <a href="https://wa.me/${waRaw.replace(/\D/g, '')}">${sanitizeText(waRaw)}</a>\n` +
                `📧 <b>Email:</b> ${sanitizeText(email)}\n` +
                `✅ <b>Status Coverage:</b> ${isCovered ? 'TERCOVER' : 'BELUM TERCOVER'}\n` +
                `🆔 <b>ID:</b> <code>${localStorage.getItem(SESSION_ID_KEY)}</code>\n` +
                `📍 <b>Live Map:</b> <a href="${loc}">Buka Peta</a>`;
    
    await telegramFetch(msg);
    addMessageToUI('admin', `Halo Pak/Bu ${nama}! 👋 Ada yang bisa Admin MyRepublic Sragen bantu?`, true);
    btn.disabled = false;
    btn.innerText = "Mulai Chat Sekarang";
}

function addMessageToUI(sender, text, shouldSave = false) {
    const container = document.getElementById('chat-content');
    if(!container) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `bubble ${sender === 'user' ? 'bubble-user' : 'bubble-admin'}`;
    div.innerHTML = `${text} <span class="chat-timestamp">${time}</span>`;
    container.appendChild(div);
    scrollBottom();
    if(shouldSave) {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        history.push({ sender, text, time });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
}

function scrollBottom() {
    const container = document.getElementById('chat-content');
    if(container) container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text || localStorage.getItem(SESSION_STATUS_KEY) === 'ended') return;
    
    let count = parseInt(localStorage.getItem(UNREPLIED_COUNT_KEY)) || 0;
    if (count >= 5) { updateChatLockUI(); return; }

    const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{"nama":"User"}');
    addMessageToUI('user', text, true); 
    input.value = '';
    count++;
    localStorage.setItem(UNREPLIED_COUNT_KEY, count.toString());
    updateChatLockUI();
    
    const sid = localStorage.getItem(SESSION_ID_KEY);
    
    const msg = `<b>💬 PESAN BARU</b>\n` +
                `━━━━━━━━━━━━━━━\n` +
                `👤 <b>User:</b> ${sanitizeText(userData.nama)}\n` +
                `🆔 <b>Session:</b> <code>${sid}</code>\n\n` +
                `📝 <b>Pesan:</b>\n${sanitizeText(text)}`;

    await telegramFetch(msg);
}

async function startPolling() {
    setInterval(async () => {
        if(isProcessingPolling) return;
        isProcessingPolling = true;
        try {
            const sid = localStorage.getItem(SESSION_ID_KEY);
            if (!sid) { isProcessingPolling = false; return; }
            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`);
            const data = await res.json();
            if (data.ok && data.result.length > 0) {
                for (let update of data.result) {
                    lastUpdateId = update.update_id;
                    localStorage.setItem(LAST_UPDATE_KEY, lastUpdateId);
                    if (update.message && update.message.reply_to_message && update.message.reply_to_message.text && update.message.reply_to_message.text.includes(sid)) {
                        addMessageToUI('admin', update.message.text, true);
                        localStorage.setItem(UNREPLIED_COUNT_KEY, '0');
                        updateChatLockUI();
                    }
                }
            }
        } catch (e) {}
        isProcessingPolling = false;
    }, 4000);
}

function checkSessionStatus() {
    const isEnded = localStorage.getItem(SESSION_STATUS_KEY) === 'ended';
    if(isEnded) {
        document.getElementById('input-container-chat').classList.add('status-blocked');
        document.getElementById('reset-session-area').classList.remove('hidden');
    }
}

function clearChatSessionPrompt() { if(confirm("Hapus riwayat?")) { localStorage.clear(); location.reload(); } }
function clearChatSession() { localStorage.clear(); location.reload(); }

async function openRegistrationModal(paket) {
  if (typeof gtag === 'function') {
    gtag('event', 'begin_registration', {
      'paket_internet': paket
    });
  
    const rawLat = localStorage.getItem('raw_lat');
    const rawLng = localStorage.getItem('raw_lng');
    let coverageData = JSON.parse(localStorage.getItem(COVERAGE_STORAGE_KEY) || '[]');
    let closestDist = 9999;

    if (rawLat && rawLng && coverageData.length > 0) {
        coverageData.forEach(coord => {
            const d = calculateDistance(parseFloat(rawLat), parseFloat(rawLng), coord[1], coord[0]);
            if (d < closestDist) closestDist = d;
        });
    }

    if (closestDist > 1.0) {
        const addr = await getFullAddressOnline(rawLat, rawLng);
        const namaAlamat = addr ? addr.village : "Anda";

        alert(`Mohon maaf, saat ini lokasi ${namaAlamat} masih dalam tahap pengembangan jaringan. \n\nSilakan hubungi admin kami melalui jendela pesan di pojok kanan bawah untuk informasi ketersediaan area di masa mendatang.`);
        
        const chatWidget = document.getElementById('chat-widget');
        if (chatWidget.style.display !== 'flex') {
            toggleChat();
        }
        return; 
    }

    document.getElementById('reg-paket').value = paket; 
    checkRegistrationStatus();
    new bootstrap.Modal(document.getElementById('modalDaftar')).show(); 
  }
}

async function submitRegistrationToBot() {
    const btn = document.getElementById('btn-submit-reg');
    const fileRumah1 = document.getElementById('reg-foto-rumah-1').files[0];
    const fileRumah2 = document.getElementById('reg-foto-rumah-2').files[0];
    const fileRumah3 = document.getElementById('reg-foto-rumah-3').files[0];
    const filePln = document.getElementById('reg-foto-pln').files[0];

    const data = {
        nama: sanitizeText(document.getElementById('reg-nama').value.trim()),
        nik: sanitizeText(document.getElementById('reg-nik').value.trim()),
        wa: sanitizeText(document.getElementById('reg-wa').value.trim()),
        email: sanitizeText(document.getElementById('reg-email').value.trim()),
        paket: sanitizeText(document.getElementById('reg-paket').value),
        alamatManual: sanitizeText(document.getElementById('reg-alamat').value.trim())
    };
    
    if(!data.nama || !data.nik || !data.wa || !data.email || !data.alamatManual) { 
        alert("Mohon lengkapi data pendaftaran!"); 
        return; 
    }

    if(!fileRumah1 || !fileRumah2 || !fileRumah3) {
        alert("Mohon unggah minimal 3 foto depan rumah!");
        return;
    }

    if(!filePln) {
        alert("Mohon unggah foto meteran PLN!");
        return;
    }
    
    // --- SHOW OVERAL LOADING ---
    const loadingOverlay = document.getElementById('global-loading-overlay');
    loadingOverlay.querySelector('h2').innerText = "Sedang Mendaftarkan Akun...";
    loadingOverlay.style.display = 'flex';
    document.body.classList.add('no-scroll');

    btn.disabled = true; btn.textContent = "Mengolah Data...";
    const sid = localStorage.getItem(SESSION_ID_KEY);
    const rawLat = localStorage.getItem('raw_lat');
    const rawLng = localStorage.getItem('raw_lng');
    const mapLink = localStorage.getItem(COORDS_CACHE_KEY) || "Peta tidak tersedia";
    let alamatLengkapStr = data.alamatManual;
    
    if(rawLat && rawLng) {
        const detailAddr = await getFullAddressOnline(rawLat, rawLng);
        if(detailAddr) alamatLengkapStr = `${data.alamatManual}, ${detailAddr.road}, ${detailAddr.village}, ${detailAddr.district}, ${detailAddr.city}, ${detailAddr.postcode}, ${detailAddr.state}`;
    }

    const confirmText = `DATA REGISTRASI MASUK\n━━━━━━━━━━━━━━━\n🆔 SID: ${sid}\n👤 Nama: ${data.nama}\n🆔 NIK: ${data.nik}\n📱 WhatsApp: ${data.wa}\n📧 Email: ${data.email}\n🚀 Paket: ${data.paket}\n🏠 Alamat: ${alamatLengkapStr}\n📍 Titik Maps: ${mapLink}`;
    const waUrl = createWaLink(data.wa, confirmText);
    
    const msg = `<b>🚀 DATA REGISTRASI BARU (SRAGEN)</b>\n━━━━━━━━━━━━━━━\n` +
                `🆔 <b>SID:</b> <code>${sid}</code>\n` +
                `👤 <b>Nama:</b> ${data.nama}\n` +
                `🪪 <b>NIK:</b> <code>${data.nik}</code>\n` +
                `📱 <b>WhatsApp:</b> <a href="${waUrl}">${data.wa}</a>\n` +
                `📧 <b>Email:</b> ${data.email}\n` +
                `🚀 <b>Paket:</b> ${data.paket}\n` +
                `🏠 <b>Alamat:</b> ${alamatLengkapStr}\n` +
                `📍 <b>Titik Maps:</b> <a href="${mapLink}">Lihat Lokasi</a>\n` +
                `━━━━━━━━━━━━━━━\n\n` +
                `👉 <a href="${waUrl}">HUBUNGI USER VIA WA</a>`;
    
    try {
        const res = await telegramFetch(msg);

        const albumFiles = [fileRumah1, fileRumah2, fileRumah3, filePln];
        const albumCaption = `📸 <b>DOKUMEN PENDAFTARAN</b>\n━━━━━━━━━━━━━━━\n👤 <b>User:</b> ${data.nama}\n🆔 <b>SID:</b> <code>${sid}</code>`;
        
        await telegramSendMediaGroup(albumFiles, albumCaption);

        if(res.ok) {
               // --- TAMBAHKAN KODE INI ---
    if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
            'send_to': 'AW-17875032525/5hoRCPvRg-sbEM2zvctC'
        });
    }
            localStorage.setItem(REG_SUCCESS_KEY, 'true');
            checkRegistrationStatus();
            alert("Data & 4 Foto (3 Rumah, 1 PLN) berhasil dikirim dalam satu album! Admin kami akan menghubungi Anda secepatnya.");
        } else {
            alert("Gagal mengirim data. Silakan coba lagi.");
        }
    } catch (e) {
        alert("Terjadi kesalahan: " + e.message);
    } finally {
        loadingOverlay.style.display = 'none';
        document.body.classList.remove('no-scroll');
        btn.disabled = false; btn.textContent = "Konfirmasi & Kirim Pendaftaran";
    }
}

/* ==========================================================================
   BAGIAN 2: FITUR KOMPLAIN (INTEGRATED FROM WEB 2)
   ========================================================================== */

function openComplaintModal() {
    const now = new Date();
    const optionsDate = { day: '2-digit', month: 'long', year: 'numeric' };
    const optionsDay = { weekday: 'long' };
    
    const elHari = document.getElementById('comp-auto-hari');
    const elTgl = document.getElementById('comp-auto-tanggal');
    
    if(elHari) elHari.innerText = now.toLocaleDateString('id-ID', optionsDay);
    if(elTgl) elTgl.innerText = now.toLocaleDateString('id-ID', optionsDate);

    const modalEl = document.getElementById('modalKomplain');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function toggleCompLoc(isAtLocation) {
    const box = document.getElementById('comp-loc-box');
    const input = document.getElementById('comp-coords');
    const status = document.getElementById('comp-loc-status');
    
    if (isAtLocation) {
        box.style.display = 'block';
        getCompLocation();
    } else {
        box.style.display = 'none';
        input.value = "";
        status.innerText = "Lokasi tidak dilampirkan.";
    }
}

function getCompLocation() {
    const status = document.getElementById('comp-loc-status');
    const input = document.getElementById('comp-coords');
    
    status.innerText = "Sedang mencari GPS...";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
                input.value = coords;
                status.innerText = "✅ Koordinat Terkunci: " + coords;
                status.style.color = "green";
            }, 
            (err) => {
                status.innerText = "❌ Gagal mengambil lokasi. Pastikan GPS aktif.";
                status.style.color = "red";
            },
            { enableHighAccuracy: true }
        );
    } else {
        status.innerText = "Browser tidak mendukung GPS.";
    }
}

// Inisialisasi Listener
window.onload = () => {
    try {
        initCoverageMap(); 
        forcePrecisionLocation();
        checkRegistrationStatus();
        fetchPromoFromSheets(); 
        fetchPricesFromSheets();
        initReviewDatabase();
        refreshReviews();
        setInterval(refreshReviews, 5000); 
        handleKeyboardShow(); 
        
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        history.forEach(item => addMessageToUI(item.sender, item.text));
        
        checkSessionStatus(); 
        updateChatLockUI();
        scrollBottom(); 
        startPolling();

        const formComp = document.getElementById('formKomplainUnified');
        if(formComp) {
            formComp.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const btn = document.getElementById('btn-submit-comp');
                const fileInput = document.getElementById('comp-video');
                const file = fileInput.files[0];

                if(!file) { alert("Wajib upload video alat!"); return; }
                if(file.size > 20 * 1024 * 1024) { alert("Ukuran video terlalu besar (Max 20MB)!"); return; }

                // --- SHOW LOADING OVERLAY ---
                const loadingOverlay = document.getElementById('global-loading-overlay');
                loadingOverlay.querySelector('h2').innerText = "Sedang Mengunggah Video Laporan...";
                loadingOverlay.style.display = 'flex';
                document.body.classList.add('no-scroll');

                btn.disabled = true;
                btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Mengirim Laporan...`;

                const nama = document.getElementById('comp-nama').value;
                const idPel = document.getElementById('comp-id').value;
                const hp = document.getElementById('comp-hp').value;
                const paket = document.getElementById('comp-paket').value;
                const kendala = document.getElementById('comp-kendala').value;
                const alamat = document.getElementById('comp-alamat').value;
                const coords = document.getElementById('comp-coords').value;
                const hari = document.getElementById('comp-auto-hari').innerText;
                const tgl = document.getElementById('comp-auto-tanggal').innerText;

                const mapLink = coords ? `https://www.google.com/maps?q=${coords}` : "Tidak dilampirkan";

                const caption = `<b>🚨 LAPORAN GANGGUAN (COMPLAINT)</b>\n` +
                                `━━━━━━━━━━━━━━━━━━\n` +
                                `📅 <b>Waktu:</b> ${hari}, ${tgl}\n` +
                                `👤 <b>Nama:</b> ${nama}\n` +
                                `🆔 <b>ID Pelanggan:</b> <code>${idPel}</code>\n` +
                                `📱 <b>No HP:</b> ${hp}\n` +
                                `📦 <b>Paket:</b> ${paket}\n` +
                                `🏠 <b>Alamat:</b> ${alamat}\n` +
                                `📍 <b>Lokasi:</b> <a href="${mapLink}">Lihat Peta</a>\n\n` +
                                `🛠️ <b>KENDALA:</b>\n${kendala}\n` +
                                `━━━━━━━━━━━━━━━━━━`;

                const formData = new FormData();
                formData.append('chat_id', CHAT_ID); 
                formData.append('message_thread_id', TOPIC_COMPLAINT); 
                formData.append('video', file);
                formData.append('caption', caption);
                formData.append('parse_mode', 'HTML');

                try {
                    const url = `https://api.telegram.org/bot${TOKEN_COMPLAINT}/sendVideo`;
                    const res = await fetch(url, { method: 'POST', body: formData });
                    const result = await res.json();

                    if(result.ok) {
                        alert("✅ Laporan Anda Berhasil Terkirim! Tim teknis kami akan segera melakukan pengecekan.");
                        formComp.reset();
                        const modalEl = document.getElementById('modalKomplain');
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        modal.hide();
                    } else {
                        alert("❌ Gagal mengirim: " + result.description);
                    }
                } catch (err) {
                    alert("Error Jaringan: " + err.message);
                } finally {
                    loadingOverlay.style.display = 'none';
                    document.body.classList.remove('no-scroll');
                    btn.disabled = false;
                    btn.innerHTML = `🚀 KIRIM PENGADUAN SEKARANG`;
                }
            });
        }

    } catch (e) {
        console.error("Initialization error: ", e);
    }
};

/* ==========================================================================
   BAGIAN 3: FITUR PANDUAN GANTI PASSWORD (INTEGRATED FROM FILE 3)
   ========================================================================== */

function openGantiPassModal() {
    const modalEl = document.getElementById('modalGantiPass');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function openTabGuide(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content-guide");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
        tabContents[i].classList.remove("active");
    }

    const tabLinks = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }

    const selectedTab = document.getElementById(tabName);
    if(selectedTab) {
        selectedTab.style.display = "block";
        setTimeout(() => selectedTab.classList.add("active"), 10);
    }
    
    if(evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    }
}

/* ==========================================================================
   BAGIAN 4: PENGAMAN BROWSER (ANTI-REFRESH)
   ========================================================================== */

window.onbeforeunload = function() {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay && overlay.style.display === 'flex') {
        return "Proses pengiriman data sedang berjalan. Apakah Anda yakin ingin keluar?";
    }
};
