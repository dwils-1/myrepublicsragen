// --- KONFIGURASI ---
const scriptURL = 'https://script.google.com/macros/s/AKfycbztPKpwv1jYnakn5P7vn_uupsZt5D7HoejadY7re7JKAKKWD8X6zYA6uFRdz8FMdP46/exec'; 
const leadsScriptURL = 'https://script.google.com/macros/s/AKfycbwLdNTyp7ezmoD24uezz6Jojoy4CyS5Igc0WmxhBghJVYKYFFu5ay_I4FUGXZUemVWbYA/exec';
const TGL_JOIN = new Date('2025-07-25');

let lastDeletedId = null;
let hiddenBillingIds = JSON.parse(localStorage.getItem('hiddenBillingIds')) || [];
let currentTotalSA = 0; 
let fullRawData = JSON.parse(localStorage.getItem('fullRawData')) || [];

const SKEMA_DEKADE = {
    'RingEco': { prices: { '30': 20000, '45': 25000, '60': 30000, '75': 35000 } },
    'Jet': { prices: { '30': 65000, '45': 80000, '60': 95000, '75': 110000 } },
    'ValueLite': { prices: { '30': 75000, '45': 90000, '60': 105000, '75': 120000 } },
    'ValueUp': { prices: { '30': 120000, '45': 145000, '60': 165000, '75': 185000 } }
};



const UPRES_RULE = {
    MONTH12: [
        {min:25,key:"75",max:2800000},
        {min:20,key:"60",max:2100000},
        {min:15,key:"45",max:1400000},
        {min:10,key:"30",max:700000}
    ],
    MONTH3: [
        {min:75,key:"75"},
        {min:60,key:"60"},
        {min:45,key:"45"},
        {min:30,key:"30"}
    ],
    PAY_MONTH12:0.5,
    FIRST_PAYMENT_PERCENT:0.8
};

const MAX_PAY_MAP = {
    "30": 700000,
    "45": 1400000,
    "60": 2100000,
    "75": 2800000
};


const MAP_KATEGORI = {
                "50ring":"RingEco",
                "pass75":"RingEco",
                "eco100":"RingEco",

                "sahabat100":"Jet",

                "30valuelite":"ValueLite",
                "neo100":"ValueLite",
                "value30":"ValueLite",
                "fast50":"ValueLite",

                "velo150":"ValueUp",
                "nova100":"ValueUp",
                "nexus300":"ValueUp",
                "gamer250":"ValueUp",
                "prime500":"ValueUp",
                "gamer500":"ValueUp",
                "wonder750":"ValueUp",
                "gamer750":"ValueUp",
                "ultra1gbps":"ValueUp",
                "gamer1gbps":"ValueUp"
            }


// --- HELPER TAHUN ---
function isThisYear(dateString) {
    if (!dateString) return false;
    const currentYear = new Date().getFullYear();
    const sep = dateString.includes('/') ? '/' : '-';
    const parts = dateString.split(sep);
    if (parts.length < 3) return false;
    const y = (sep === '/') ? parseInt(parts[2]) : parseInt(parts[0]);
    return y === currentYear;
}

// --- LOGIKA AUTO-LOCK ---
let inactivityTimer;
const INACTIVITY_LIMIT = 10 * 60 * 1000; 

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        inactivityTimer = setTimeout(lockAppAutomatically, INACTIVITY_LIMIT);
    }
}

function lockAppAutomatically() {
    sessionStorage.removeItem('isLoggedIn');
    const ls = document.getElementById('lockScreen');
    if (ls) {
        ls.style.setProperty('display', 'flex', 'important');
        ls.style.pointerEvents = 'auto'; 
    }
    clearPin();
}

window.onload = () => {
    updateLiveDate();
    updateCountdownMonth();
    loadDraft();
    loadLeadsDraft();
    resetInactivityTimer();
    initDuplicateCheck();
    
    const lockScr = document.getElementById('lockScreen');
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        if (lockScr) {
            lockScr.style.display = 'none';
            lockScr.style.pointerEvents = 'none'; 
        }
        muatDataTabel();
    } else {
        if (lockScr) {
            lockScr.style.display = 'flex';
            lockScr.style.pointerEvents = 'auto';
        }
    }

    const today = new Date().toISOString().split('T')[0];
    const leadsTgl = document.getElementById('leads_tgl_d2d_hidden');
    if(leadsTgl) leadsTgl.value = today;
};

document.onmousemove = resetInactivityTimer;
document.onkeypress = resetInactivityTimer;
document.ontouchstart = resetInactivityTimer;
document.onscroll = resetInactivityTimer;
document.onclick = resetInactivityTimer;

function updateLiveDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) dateDisplay.innerText = now.toLocaleDateString('id-ID', options);
}

// --- LOGIKA AUTOCOMPLETE ALAMAT ---
const alamatInput = document.getElementById('inputAlamat');
const alamatSuggestions = document.getElementById('alamatSuggestions');



function updateCountdownMonth() {

    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    const lastDay = new Date(year, month + 1, 0).getDate();
    const remain = lastDay - day;

    const months = [
        "JAN","FEB","MAR","APR","MEI","JUN",
        "JUL","AGU","SEP","OKT","NOV","DES"
    ];

    const label = document.getElementById("cd-label");
    const value = document.getElementById("cd-days");
    const box = document.getElementById("countdownMonth");

    if (!label || !value || !box) return;

    label.innerText = "SISA " + months[month];
    value.innerText = remain + " HARI";

    if(remain > 10){
        box.style.background="#16a34a";
    }else if(remain > 5){
        box.style.background="#ca8a04";
    }else{
        box.style.background="#dc2626";
    }

}


if (alamatInput && alamatSuggestions) {
    alamatInput.addEventListener('input', function() {
        const val = this.value.toUpperCase();
        alamatSuggestions.innerHTML = '';
        if (!val || val.length < 3) {
            alamatSuggestions.classList.add('hidden');
            return;
        }
        const uniqueAddresses = [...new Set(fullRawData
            .map(item => (item.alamat || '').trim().toUpperCase())
            .filter(addr => addr.includes(val))
        )].slice(0, 5);

        if (uniqueAddresses.length > 0) {
            uniqueAddresses.forEach(addr => {
                const div = document.createElement('div');
                div.innerHTML = addr.replace(new RegExp(val, 'g'), `<strong>${val}</strong>`);
                div.addEventListener('click', function() {
                    alamatInput.value = addr;
                    alamatSuggestions.classList.add('hidden');
                    saveDraft();
                });
                alamatSuggestions.appendChild(div);
            });
            alamatSuggestions.classList.remove('hidden');
        } else {
            alamatSuggestions.classList.add('hidden');
        }
    });
}

document.addEventListener('click', (e) => { 
    if (alamatInput && e.target !== alamatInput && alamatSuggestions) {
        alamatSuggestions.classList.add('hidden'); 
    }
});

// --- DRAFT SYSTEM ---
function saveDraft() {
    const formElements = document.querySelectorAll('.draft-sync');
    let draftData = {};
    formElements.forEach(el => {
        if (el.type === 'checkbox') draftData[el.id] = el.checked;
        else draftData[el.name || el.id] = el.value;
    });
    localStorage.setItem('inputDraft', JSON.stringify(draftData));
}

function loadDraft() {
    const savedDraft = localStorage.getItem('inputDraft');
    if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        document.querySelectorAll('.draft-sync').forEach(el => {
            const key = el.name || el.id;
            if (draftData.hasOwnProperty(key)) {
                if (el.type === 'checkbox') el.checked = draftData[key];
                else el.value = draftData[key];
            }
        });
    }
}

function clearDraft() { localStorage.removeItem('inputDraft'); }

document.querySelectorAll('.draft-sync').forEach(el => {
    el.addEventListener('input', saveDraft);
    el.addEventListener('change', saveDraft);
});

// --- LEADS DRAFT SYSTEM ---
function saveLeadsDraft() {
    const elements = document.querySelectorAll('.draft-leads');
    let draft = {};
    elements.forEach(el => { draft[el.name] = el.value; });
    localStorage.setItem('leadsDraft', JSON.stringify(draft));
}

function loadLeadsDraft() {
    const saved = localStorage.getItem('leadsDraft');
    if (saved) {
        const data = JSON.parse(saved);
        const elements = document.querySelectorAll('.draft-leads');
        elements.forEach(el => { if (data[el.name]) el.value = data[el.name]; });
    }
}

const draftLeadsEls = document.querySelectorAll('.draft-leads');
if (draftLeadsEls.length > 0) {
    draftLeadsEls.forEach(el => {
        el.addEventListener('input', saveLeadsDraft);
        el.addEventListener('change', saveLeadsDraft);
    });
}

// --- HELPER FUNCTIONS ---
function cleanId(idStr) { return String(idStr || "").replace(/\s*S\s*$/i, "").trim(); }

function isAuditOFF(item) {
    const cmd = String(item.command || "").toUpperCase();
    const idRaw = String(item.idCst || "").toLowerCase();
    return idRaw.includes('off') || cmd.includes('OFF');
}

function formatWaMeLink(num) {
    if (!num) return "";
    let clean = num.toString().replace(/\D/g, "");
    if (clean.startsWith("0")) {
        clean = "62" + clean.slice(1);
    } else if (clean.startsWith("8")) {
        clean = "62" + clean;
    }
    return clean;
}

// --- VALIDASI ID CST DUPLIKAT ---
function initDuplicateCheck() {
    const inputIdCst = document.querySelector('input[name="id_cst"]');
    if (inputIdCst) {
        inputIdCst.addEventListener('blur', function() {
            const val = this.value.trim();
            if (val.length >= 4) {
                const isExist = fullRawData.find(item => cleanId(item.idCst) === cleanId(val));
                if (isExist) {
                    openModal({
                        title: '⚠️ ID SUDAH TERDAFTAR',
                        headerClass: 'bg-amber-500',
                        body: `
                            <div class="text-left p-3 bg-amber-50 rounded-xl border border-amber-200">
                                <p class="text-[10px] font-black text-amber-700 uppercase mb-2">Data Pemilik ID:</p>
                                <p class="text-xs">👤 Nama: <b>${isExist.nama}</b></p>
                                <p class="text-xs">📅 Tgl Pasang: <b>${isExist.tanggal}</b></p>
                                <p class="text-xs">📍 Alamat: <b>${isExist.alamat.substring(0, 40)}...</b></p>
                            </div>
                        `,
                        subtext: 'ID ' + val + ' sudah ada di database!',
                        buttons: [
                            { text: 'GANTI ID', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs', action: () => { inputIdCst.value = ""; inputIdCst.focus(); } },
                            { text: 'TETAP GUNAKAN', class: 'bg-amber-500 text-white py-3 rounded-xl font-black text-xs', action: () => {} }
                        ]
                    });
                }
            }
        });
    }
}

function loadOfflineData() {
    const cachedSummary = localStorage.getItem('tableSummary');
    const rawData = localStorage.getItem('fullRawData');
    updateLiveDate();
    const bnFull = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

    if (rawData) {
        fullRawData = JSON.parse(rawData);
        const now = new Date(); 
        let lm = now.getMonth() - 1; 
        let ty = now.getFullYear(); 
        if(lm < 0) { lm = 11; ty--; }

        let totalSA_filtered = 0;
        let countLM = 0;
        let countBillingToday = 0;
        const todayDay = now.getDate();

        fullRawData.forEach(item => {
            const cmd = String(item.command || "").toLowerCase();
            if(item.tanggal) {
                const sep = item.tanggal.includes('/') ? '/' : '-';
                const parts = item.tanggal.split(sep);
                if(parts.length >= 3) {
                    const m = parseInt(parts[1])-1; 
                    const y = (sep === '/' ? parseInt(parts[2]) : parseInt(parts[0]));
                    const dayPemasangan = (sep === '/' ? parseInt(parts[0]) : parseInt(parts[2]));
                    if(!cmd.includes("pending") && !cmd.includes("progress")) {
                        if(m === now.getMonth() && y === now.getFullYear()) totalSA_filtered++;
                        if(m === lm && y === ty) countLM++;
                        if(dayPemasangan === todayDay) countBillingToday++;
                    }
                }
            }
        });

        currentTotalSA = totalSA_filtered;
        const summaryObj = cachedSummary ? JSON.parse(cachedSummary) : {};
        summaryObj.totalSA = totalSA_filtered;
        summaryObj.pointKurang = countLM;

        renderRekapUI(summaryObj);
        updateFastAndProgressCounts();
        generateHistoryFromData(fullRawData);
        triggerGradeCalc();
        updateBeltWidget(fullRawData, currentTotalSA);
        refreshTotalDiterima();

        const dBulan = document.getElementById('displayBulan');
        if(dBulan) dBulan.innerText = "BULAN " + bnFull[now.getMonth()];
        const lKurang = document.getElementById('label-kurang');
        if(lKurang) lKurang.innerText = "SA " + bnFull[lm];
        
        const notifBanner = document.getElementById('notifBilling');
        if(notifBanner) {
            if(countBillingToday > 0) {
                notifBanner.style.display = 'flex';
                document.getElementById('notifText').innerText = `Ada ${countBillingToday} Pelanggan masuk siklus tagihan hari ini!`;
            } else { notifBanner.style.display = 'none'; }
        }
        cekJanjiTemuLeads();
    } else if (cachedSummary) {
        renderRekapUI(JSON.parse(cachedSummary));
    }
}

async function muatDataTabel(btnEl) {
    if(btnEl) triggerAnimate(btnEl); 
    const btn = document.getElementById('btnRefreshTabel'); 
    if(btn) btn.innerText = "⏳ SINKRONISASI...";
    try {
        const [resSum, resFull] = await Promise.all([fetch(`${scriptURL}?action=getTableSummary`), fetch(`${scriptURL}`)]);
        const summary = await resSum.json(); const fullJson = await resFull.json();
        fullRawData = fullJson.data || []; 
        localStorage.setItem('fullRawData', JSON.stringify(fullRawData));
        localStorage.setItem('tableSummary', JSON.stringify(summary));
        
        const now = new Date(); let lm = now.getMonth() - 1; let ty = now.getFullYear(); if(lm < 0) { lm = 11; ty--; }
        const bn = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
        const dBulan = document.getElementById('displayBulan');
        if(dBulan) dBulan.innerText = "BULAN " + bn[now.getMonth()];
        const lKurang = document.getElementById('label-kurang');
        if(lKurang) lKurang.innerText = "SA " + bn[lm];
        
        let cBT = 0; const tD = now.getDate(); let cLM = 0; let tSAF = 0;
        fullRawData.forEach(item => {
            const cmd = String(item.command || "").toLowerCase();
            if(item.tanggal) {
                const sep = item.tanggal.includes('/') ? '/' : '-';
                const parts = item.tanggal.split(sep);
                if(parts.length >= 3) {
                    const m = parseInt(parts[1])-1; 
                    const y = (sep === '/' ? parseInt(parts[2]) : parseInt(parts[0]));
                    const dP = (sep === '/' ? parseInt(parts[0]) : parseInt(parts[2]));
                    if(!cmd.includes("pending") && !cmd.includes("progress")) {
                        if(m === now.getMonth() && y === now.getFullYear()) tSAF++;
                        if(m === lm && y === ty) cLM++;
                        if(dP === tD) cBT++;
                    }
                }
            }
        });

        const nB = document.getElementById('notifBilling');
        if(nB) {
            if(cBT > 0) { nB.style.display = 'flex'; document.getElementById('notifText').innerText = `Ada ${cBT} Pelanggan siklus tagihan hari ini!`; } 
            else nB.style.display = 'none';
        }

        summary.pointKurang = cLM; summary.totalSA = tSAF; currentTotalSA = tSAF;
        renderRekapUI(summary); 
        updateFastAndProgressCounts(); 
        generateHistoryFromData(fullRawData); 
        triggerGradeCalc();
        updateBeltWidget(fullRawData, currentTotalSA);
        refreshTotalDiterima();
        cekJanjiTemuLeads();
    } catch (e) { loadOfflineData(); } finally { if(btn) btn.innerText = "🔄 Sinkronisasi Data Aktif"; }
}

function updateBeltWidget(dataFull, saBulanIni) {
    const now = new Date();
    let countSubs3Bln = 0;

    dataFull.forEach(item => {
        if (!item.tanggal || isAuditOFF(item)) return;
        
        const sep = item.tanggal.includes('/') ? '/' : '-';
        const p = item.tanggal.split(sep);
        const tglPasang = (sep === '/' ? new Date(p[2], p[1]-1, p[0]) : new Date(p[0], p[1]-1, p[2]));
        
        const diffMonth = (now.getFullYear() - tglPasang.getFullYear()) * 12 + (now.getMonth() - tglPasang.getMonth());
        
        if (diffMonth >= 3) countSubs3Bln++; 
    });
    const belt = hitungInsentifBelt(countSubs3Bln, saBulanIni);

    const tier = {
        nama: belt.nama === "DIBAWAH BIRU" ? "PUTIH" : belt.nama,
        bonus: belt.bonus,
        minSA:
            belt.nama === "BIRU" ? 11 :
            belt.nama === "COKELAT" ? 12 :
            belt.nama === "HITAM" ? 14 : 0
    };

    const elSubs = document.getElementById('belt-total-subs');
    if(elSubs) elSubs.innerText = countSubs3Bln;
    
    const tag = document.getElementById('belt-tag');
    if(tag) {
        tag.innerText = tier.nama;
        tag.className = `bg-slate-200 px-3 py-1 rounded-full text-[9px] font-black uppercase belt-${tier.nama}`;
    }

    const saAlert = document.getElementById('belt-sa-alert');
    const bonusVal = document.getElementById('belt-bonus-val');

    if (tier.minSA > 0 && saBulanIni < tier.minSA) {
        if(saAlert) saAlert.classList.remove('hidden');
        const alertText = document.getElementById('belt-sa-needed');
        if(alertText) alertText.innerText = `Butuh minimal ${tier.minSA} SA agar bonus Rp${tier.bonus.toLocaleString()} cair.`;
        if(bonusVal) {
            bonusVal.innerText = "Rp0";
            bonusVal.className = "text-lg font-black text-red-500 animate-pulse-slow";
        }
    } else {
        if(saAlert) saAlert.classList.add('hidden');
        if(bonusVal) {
            bonusVal.innerText = `Rp${tier.bonus.toLocaleString()}`;
            bonusVal.className = "text-lg font-black text-green-600";
        }
    }
}

function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`; 
}

async function cekJanjiTemuLeads() {
    const banner = document.getElementById('janjitemu');
    if (!banner) return;
    try {
        const response = await fetch(`${leadsScriptURL}?action=getLeads`);
        const data = await response.json();
        const todayStr = getTodayString(); 
        let count = 0;

        data.forEach(item => {
            if (item.janji_temu) {
                let tgl = String(item.janji_temu).split('T')[0].split(' ')[0].trim();
                if (tgl.includes('-')) {
                    const p = tgl.split('-');
                    tgl = `${p[2]}/${p[1]}/${p[0]}`;
                }
                if (tgl === todayStr) count++;
            }
        });

        if (count > 0) {
            banner.style.display = 'flex';
            document.getElementById('notifJanjiText').innerText = `Ada ${count} Pelanggan rencana janji temu hari ini!`;
        } else {
            banner.style.display = 'none';
        }
    } catch (err) { console.error("Koneksi ke Leads gagal:", err); }
}

async function lihatDaftarJanjiTemuHariIni() {
    switchTab('cari');
    const container = document.getElementById('leadsList');
    const cardsContainer = document.getElementById('cardsContainer');
    if(container) container.classList.remove('hidden');
    if(cardsContainer) cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-white animate-pulse">MENYARING DAFTAR HARI INI...</p>';
    try {
        const response = await fetch(`${leadsScriptURL}?action=getLeads`);
        const data = await response.json();
        const todayStr = getTodayString(); 
        
        const filtered = data.filter(item => {
            if (!item.janji_temu) return false;
            let tgl = String(item.janji_temu).split('T')[0].split(' ')[0].trim();
            if (tgl.includes('-')) {
                const p = tgl.split('-');
                tgl = `${p[2]}/${p[1]}/${p[0]}`;
            }
            return tgl === todayStr;
        });

        if (filtered.length > 0) renderLeadsCards(filtered);
        else if(cardsContainer) cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-slate-300">TIDAK ADA JADWAL HARI INI.</p>';
    } catch (err) { if(cardsContainer) cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-red-400">ERROR MEMUAT LEADS.</p>'; }
}

function filterJatuhTempoHariIni() {
    const today = new Date().getDate();
    switchTab('cari');
    const dInput = document.getElementById('dateInput');
    if(dInput) dInput.value = today;
    cariData('search');
}

function toggleCheckbox(otherId, current) {
    const other = document.getElementById(otherId);
    if (current.checked && other) other.checked = false; 
    saveDraft();
}

function toggleSection(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    if (content && icon) {
        if (content.classList.contains('hidden')) { content.classList.remove('hidden'); icon.innerText = '▲'; }
        else { content.classList.add('hidden'); icon.innerText = '▼'; }
    }
}

function triggerGradeCalc() {
    const resGrade = hitungGradeDanHold(currentTotalSA, new Date());
    const gContainer = document.getElementById('grade-container');
    if(gContainer) gContainer.innerHTML = `<span class="grade-badge grade-${resGrade.grade}">${resGrade.grade}</span>`;
    hitungDvD();
}

function hitungDvD() {
    if (!fullRawData || fullRawData.length === 0) return;
    const skrg = new Date();
    const tglHariIni = skrg.getDate();
    const blnSkrg = skrg.getMonth();
    const thnSkrg = skrg.getFullYear();
    let blnLalu = blnSkrg - 1; let thnLalu = thnSkrg;
    if (blnLalu < 0) { blnLalu = 11; thnLalu--; }
    let cBI = 0; let cBL = 0;
    fullRawData.forEach(item => {
        if (!item.tanggal || item.tanggal.trim() === "") return;
        const cmd = String(item.command || "").toLowerCase();
        if (cmd.includes("pending") || cmd.includes("progress")) return;
        const sep = item.tanggal.includes('/') ? '/' : '-';
        const parts = item.tanggal.split(sep);
        if (parts.length < 3) return;
        const d = parseInt(parts[sep === '/' ? 0 : 2]);
        const m = parseInt(parts[1]) - 1;
        const y = (sep === '/') ? parseInt(parts[2]) : parseInt(parts[0]);
        if (d <= tglHariIni) {
            if (m === blnSkrg && y === thnSkrg) cBI++;
            else if (m === blnLalu && y === thnLalu) cBL++;
        }
    });
    const el = document.getElementById('dvzd-status');
    if(el) {
        el.innerText = `${cBL} vs ${cBI}`;
        el.className = (cBI >= cBL) ? "text-lg font-black text-green-600" : "text-lg font-black text-red-600";
    }
}

function generateHistoryFromData(data) {
    const tbody = document.getElementById('historyTableBody');
    if(!tbody) return;
    const historyMap = {};
    data.forEach(item => {
        if(!item.tanggal || item.tanggal.trim() === "") return;
        const cmd = String(item.command || "").toLowerCase();
        if(cmd.includes("pending") || cmd.includes("progress")) return; 
        const sep = item.tanggal.includes('/') ? '/' : '-';
        const p = item.tanggal.split(sep);
        if(p.length < 3) return;
        const m = parseInt(p[1]);
        const y = (sep === '/' ? parseInt(p[2]) : parseInt(p[0]));
        const key = `${y}-${m.toString().padStart(2, '0')}`;
        if(!historyMap[key]) historyMap[key] = 0;
        historyMap[key]++;
    });
    const sortedKeys = Object.keys(historyMap).sort().reverse();
    const monthNames = ["", "JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
    let html = "";
    sortedKeys.forEach((key, index) => {
        const [year, month] = key.split('-');
        const totalSA = historyMap[key];
        const lastDay = new Date(year, month, 0);
        const res = hitungGradeDanHold(totalSA, lastDay);
        let ket = "";
        if (index < sortedKeys.length - 1) {
            const prevSA = historyMap[sortedKeys[index + 1]];
            if (totalSA > prevSA) ket = `<span class="text-green-600">Meningkat (+${totalSA - prevSA}) 📈</span>`;
            else if (totalSA < prevSA) ket = `<span class="text-red-500">Menurun (-${prevSA - totalSA}) 📉</span>`;
            else ket = `<span class="text-indigo-600">Stabil ⚖️</span>`;
        } else ket = `<span class="text-slate-400">Bulan Awal ✨</span>`;
        html += `<tr class="border-b"><td class="text-[10px] font-black uppercase">${monthNames[parseInt(month)]} ${year}</td><td class="font-black text-indigo-900">${totalSA}</td><td class="text-[9px] font-bold text-slate-500">${res.mob}</td><td><span class="grade-badge grade-${res.grade}">${res.grade}</span></td><td class="text-center text-[9px] font-bold italic">${ket}</td></tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="5" class="py-4 text-slate-400 italic text-[10px]">Klik Sinkronisasi untuk menghitung history...</td></tr>';
}

function hitungGradeDanHold(totalSA, targetDate) {
    const diffDays = Math.ceil((targetDate - TGL_JOIN) / (1000 * 60 * 60 * 24));
    let mob = (diffDays < 30) ? "MOB0" : (diffDays <= 59) ? "MOB1" : (diffDays <= 89) ? "MOB2" : (diffDays <= 119) ? "MOB3" : (diffDays <= 179) ? "MOB4-6" : (diffDays <= 269) ? "MOB7-9" : (diffDays <= 359) ? "MOB10-12" : "MOB>12";
    let grade = "U";
    if (mob === "MOB0") grade = "-";
    else if (mob === "MOB1") { if (totalSA >= 5) grade = "A"; else if (totalSA == 4) grade = "B"; else if (totalSA == 3) grade = "C"; }
    else if (mob === "MOB2") { if (totalSA >= 6) grade = "A"; else if (totalSA == 5) grade = "B"; else if (totalSA >= 3) grade = "C"; }
    else if (mob === "MOB3") { if (totalSA >= 7) grade = "A"; else if (totalSA == 6) grade = "B"; else if (totalSA >= 4) grade = "C"; }
    else if (mob === "MOB4-6") { if (totalSA >= 9) grade = "A"; else if (totalSA >= 7) grade = "B"; else if (totalSA >= 5) grade = "C"; }
    else if (mob === "MOB7-9") { if (totalSA >= 10) grade = "A"; else if (totalSA >= 8) grade = "B"; else if (totalSA >= 5) grade = "C"; }
    else if (mob === "MOB10-12") { if (totalSA >= 12) grade = "A"; else if (totalSA >= 9) grade = "B"; else if (totalSA >= 6) grade = "C"; }
    else { if (totalSA >= 15) grade = "A"; else if (totalSA >= 12) grade = "B"; else if (totalSA >= 8) grade = "C"; }
    return { grade, mob };
}

function openModal(config) {
    const modal = document.getElementById('customModal');
    if(!modal) return;
    const mHeader = document.getElementById('modalHeader');
    if(mHeader) mHeader.className = `p-4 text-center ${config.headerClass}`;
    const mTitle = document.getElementById('modalTitle');
    if(mTitle) mTitle.innerText = config.title;
    const mBody = document.getElementById('modalBody');
    if(mBody) mBody.innerHTML = config.body;
    const mSub = document.getElementById('modalSubtext');
    if(mSub) mSub.innerText = config.subtext;
    const btnBox = document.getElementById('modalButtons'); 
    if(btnBox) {
        btnBox.innerHTML = '';
        config.buttons.forEach(btn => {
            const b = document.createElement('button'); b.innerText = btn.text; b.className = btn.class;
            b.onclick = (event) => { btn.action(event); if(!btn.keepOpen) closeModal(); }; btnBox.appendChild(b);
        });
    }
    modal.style.display = 'flex';
}
function closeModal() { 
    const modal = document.getElementById('customModal');
    if(modal) modal.style.display = 'none'; 
}

function formatBeautifulNumber(num) {
    if (!num) return "-";
    let clean = num.toString().replace(/\D/g, "");
    if (clean.startsWith("62")) clean = "0" + clean.slice(2);
    else if (!clean.startsWith("0")) clean = "0" + clean;
    if (clean.length >= 11) return clean.replace(/(\d{4})(\d{4})(\d{4,})/, '$1-$2-$3');
    return clean;
}

function getPureWaNumber(num) {
    if (!num) return "";
    let clean = num.toString().replace(/\D/g, "");
    return clean;
}

function salinDataLengkap(id) {
    const item = fullRawData.find(i => String(i.idCst) === String(id));
    if (!item) return alert("Data tidak ditemukan!");

    let hT = item.harga || "0";
    if (hT === "0" || hT === "" || hT === "Harga Tidak Ada") hT = "Cek Billing";
    else if (!hT.toString().toLowerCase().includes('rp')) hT = 'Rp' + parseInt(hT).toLocaleString();

    const formattedText = `*Berikut data pelanggan:*

*Nama* : ${item.nama.toUpperCase()}
*ID Pelanggan* : ${cleanId(item.idCst)}
*Pasang* : ${item.tanggal}
*Paket* : ${item.paket}
*Tgl Pembayaran* : ${item.tanggal.split(/[/-]/)[0]}
*Jatuh tempo* : ${item.japo}
*Harga* : ${hT}
*Alamat* : ${item.alamat}

Cek promo, ganti password, kendala:
www.myrepublicsragen.my.id`;

    navigator.clipboard.writeText(formattedText).then(() => {
        openModal({
            title: '📋 DATA DISALIN',
            headerClass: 'bg-indigo-600',
            body: `<p class="text-xs text-left p-3 bg-slate-50 rounded-xl font-mono">${formattedText.replace(/\n/g, '<br>')}</p>`,
            subtext: 'Data siap dibagikan',
            buttons: [{ text: 'OK', class: 'bg-indigo-600 text-white py-3 rounded-xl font-black text-xs w-full', action: () => {} }]
        });
    }).catch(err => alert("Gagal menyalin data."));
}

function renderCard(item, mode) {
    if (item.idCst === undefined) return "";
    if (mode === 'fast' && hiddenBillingIds.includes(item.idCst)) return "";
    const parts = item.tanggal.includes('/') ? item.tanggal.split('/') : item.tanggal.split('-');
    if(parts.length < 3) return ""; 
    const pasangDate = (parts[0].length === 4) ? new Date(parts[0], parts[1]-1, parts[2]) : new Date(parts[2], parts[1]-1, parts[0]);
    const diffDays = Math.ceil(Math.abs(new Date() - pasangDate) / (1000 * 60 * 60 * 24));
    
    let cC = (diffDays <= 10) ? "card-red border-red-200" : (diffDays <= 60 ? "card-orange border-orange-200" : "card-blue border-blue-200");
    let sL = (diffDays <= 10) ? `<span class="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black ml-2">${diffDays} HARI</span>` : (diffDays <= 60 ? '<span class="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-black ml-2">BARU</span>' : '<span class="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-black ml-2">LAMA</span>');
    
    if (mode === 'qc') cC = "card-sky border-sky-200";
    const cmdLow = (item.command || "").toLowerCase();
    const isP = cmdLow.includes('pending');
    const isProg = cmdLow.includes('progress');
    if(isP) cC = "card-yellow border-amber-200";
    
    let pB = "";
    if(mode === 'progress') {
        if(diffDays <= 5) pB = `<span class="progress-badge-new ml-2">NEW (${diffDays}H)</span>`;
        else if(diffDays <= 10) pB = `<span class="progress-badge-mid ml-2">WARNING (${diffDays}H)</span>`;
    }
    if(isP) pB += `<span class="pending-badge ml-2">PENDING</span>`;
    if(mode === 'qc') pB += `<span class="bg-sky-600 text-white px-2 py-0.5 rounded text-[9px] font-black ml-2">SIKLUS ${Math.floor(diffDays/30)} BULAN</span>`;

    let hT = item.harga || "0";
    if (hT === "0" || hT === "" || hT === "Harga Tidak Ada") hT = "Cek Billing";
    else if (!hT.toString().toLowerCase().includes('rp')) hT = 'Rp' + parseInt(hT).toLocaleString();
    
    const bB = (mode === 'fast') ? `<button onclick="handleBillingClick('${item.idCst}')" class="bg-red-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-sm flex-1">Bayar Billing</button>` : "";
    const cP = `<button onclick="handleCopyClick('${item.idCst}')" class="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200 text-[9px] font-black active:scale-90 transition-transform">SALIN ID</button>`;
    
    const btnSalinData = `<button onclick="salinDataLengkap('${item.idCst}')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-sm flex-1">Salin Data</button>`;

    let sPB = isP ? `<button onclick="handleSetProgress('${item.idCst}', '${item.nama}')" class="bg-orange-500 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-sm flex-1">Set Progress</button>` : "";
    let btnAktif = isProg ? `<button onclick="konfirmasiAktifkan('${item.idCst}', '${item.nama}')" class="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-sm flex-1">AKTIF</button>` : "";
    
    const noteInternal = (item.command && item.command.trim() !== "") ? item.command.toUpperCase() : "";
    const noteBilling = (item.billing && item.billing.trim() !== "") ? item.billing : "";

    let noteHTML = "";
    if (noteInternal || noteBilling) {
        noteHTML = `
            <div class="col-span-2 mt-2 pt-2 border-t border-dashed border-slate-300">
                ${noteInternal ? `<p class="text-indigo-600 font-bold">📝 INFO: <span class="text-slate-700 font-black">${noteInternal}</span></p>` : ''}
                ${noteBilling ? `<p class="text-red-600 font-bold">memo: <span class="text-slate-700 italic font-medium">${noteBilling}</span></p>` : ''}
            </div>
        `;
    }

    const waC = (mode === 'qc') ? 'bg-sky-500 hover:bg-sky-600' : 'bg-green-500 hover:bg-green-600';
    const waL = (mode === 'qc') ? 'KIRIM QUALITY CARE (WA)' : 'Kirim Notifikasi WA';

    return `
    <div id="card-${item.idCst}" 
         data-email="${item.email || '-'}" 
         data-harga="${hT}" 
         data-command="${(item.command || '')}" 
         data-alamat="${item.alamat || '-'}" 
         data-hp="${item.hp || '-'}" 
         data-tgl="${item.tanggal || '-'}"
         class="glass-card p-5 shadow-xl border-l-[12px] mb-4 ${cC}">
        <div class="mb-3 flex justify-between items-start">
            
<div class="flex flex-col items-start gap-1">
    <h3 class="font-black text-indigo-900 uppercase text-lg leading-tight blink-name">
        ${item.nama}
    </h3>
    ${pB}
</div>

        </div>
        <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600 bg-white/50 p-3 rounded-xl mb-3 border border-slate-200">
            <p class="col-span-2 flex items-center bg-white p-1.5 rounded border border-indigo-100 mb-1">
                <span>🆔 ID: <b class="text-indigo-900">${cleanId(item.idCst)}</b></span>
                ${cP}${sL}
            </p>
            <p>🗓️ Pasang: <b>${item.tanggal}</b></p><p>🔔 JAPO: <b class="text-red-500">Tgl ${item.japo}</b></p>
            <p class="col-span-2">🚀 Paket: <b>${item.paket}</b></p><p class="col-span-2 text-indigo-700">💰 Harga: <b class="text-[12px] font-black uppercase">${hT}</b></p>
            <p class="col-span-2">📧 Email: <b class="lowercase">${item.email || '-'}</b></p>
            <p class="col-span-2">📞 No. HP: <b class="text-indigo-800">${formatBeautifulNumber(item.hp)}</b></p>
            <p class="col-span-2">📍 Alamat: <b>${item.alamat}</b></p>
            ${noteHTML}
        </div>
        <div class="flex gap-2">
            ${btnSalinData}${bB}${sPB}${btnAktif}
            <button onclick="prosesWa('${item.hp}', '${item.idCst}', '${item.nama}', '${item.japo}', '${item.paket}', '${mode}')" class="${(bB || sPB || btnAktif || btnSalinData) ? 'flex-1' : 'w-full'} ${waC} text-white font-black py-3 rounded-xl text-[10px] shadow-lg transition-all active:scale-95 uppercase">${waL}</button>
        </div>
    </div>`;
}

function konfirmasiAktifkan(id, nama) {
    openModal({
        title: '✅ SELESAIKAN PROGRESS',
        headerClass: 'bg-emerald-600',
        body: `<p>Pelanggan <b>${nama}</b> sudah aktif?</p><p class="text-[10px] mt-2">Status 'On Progress' akan dihapus dari sistem.</p>`,
        subtext: 'ID: ' + cleanId(id),
        buttons: [
            { text: 'BATAL', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs', action: () => {} },
            { text: 'YA, SUDAH AKTIF', class: 'bg-emerald-600 text-white py-3 rounded-xl font-black text-xs', action: () => executeHapusProgress(id) }
        ]
    });
}

async function executeHapusProgress(id) {
    try {
        const r = await fetch(`${scriptURL}?action=hapusProgress&idCst=${id}`);
        const res = await r.json();
        if(res.status === "success") {
            alert("Berhasil! Status On Progress telah dihapus.");
            muatDataTabel(); 
        } else { throw new Error(res.message); }
    } catch(e) { alert("❌ Gagal menghapus status: " + e.message); }
}

function handleSetProgress(id, nama) {
    openModal({
        title: '⚠️ KONFIRMASI', headerClass: 'bg-orange-500',
        body: `<p>Ubah status <b>${nama}</b> Dari Pending menjadi On Progress?</p>`,
        subtext: 'ID: ' + cleanId(id),
        buttons: [
            { text: 'BATAL', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs', action: () => {} },
            { text: 'YA, UBAH', class: 'bg-orange-500 text-white py-3 rounded-xl font-black text-xs', action: () => executeSetProgress(id) }
        ]
    });
}

async function executeSetProgress(id) {
    const card = document.getElementById(`card-${id}`);
    if(card) card.style.opacity = '0.5';
    hiddenBillingIds = hiddenBillingIds.filter(hid => String(hid) !== String(id));
    localStorage.setItem('hiddenBillingIds', JSON.stringify(hiddenBillingIds));
    const tD = fullRawData.find(item => String(item.idCst) === String(id));
    const rO = tD && tD.rowOrder ? `&rowOrder=${tD.rowOrder}` : "";
    try {
        const r = await fetch(`${scriptURL}?action=setProgress&idCst=${id}&hapusCmd=true${rO}`);
        const res = await r.json();
        if(res.status === "success") { alert("Berhasil!"); muatDataTabel(); } 
        else { alert("Gagal: " + res.message); if(card) card.style.opacity = '1'; }
    } catch(e) { alert("Gagal server."); if(card) card.style.opacity = '1'; }
}

function cariDataRealTime() { 
    const dI = document.getElementById('dateInput');
    const uI = document.getElementById('userInput');
    if(!dI || !uI) return;
    const val = dI.value.trim();
    if (val.length > 2 && /^\d+$/.test(val)) { uI.value = val; dI.value = ""; uI.focus(); }
    cariData('search'); 
}

async function cariData(mode, btnEl) {
    if(btnEl) triggerAnimate(btnEl); 
    const uInput = document.getElementById('userInput');
    const dInput = document.getElementById('dateInput');
    if (['progress','pending','fast','qc'].includes(mode)) {
        if(uInput) uInput.value = ""; 
        if(dInput) dInput.value = "";
        const oT = btnEl ? btnEl.innerText : ""; if (btnEl) btnEl.innerText = "⏳...";
        await muatDataTabel(); if (btnEl) btnEl.innerText = oT;
    }
    const query = uInput ? uInput.value.toLowerCase().trim() : "";
    const tF = dInput ? dInput.value : "";
    const list = document.getElementById('resultsList');
    const sI = document.getElementById('searchInfo');
    const sCE = document.getElementById('searchResultCount');
    if (mode === 'search' && query === "" && tF === "") { if(list) list.innerHTML = ""; if(sI) sI.classList.add('hidden'); return; }
    let items = fullRawData.slice();
    if (mode === 'progress') items = items.filter(i => (i.command || "").toLowerCase().includes('progress'));
    else if (mode === 'pending') items = items.filter(i => (i.command || "").toLowerCase().includes('pending'));
    else if (mode === 'fast') { 
        items = items.filter(i => {
            const cmd = String(i.command || "").toLowerCase();
            if (cmd.includes('pending') || cmd.includes('progress') || isAuditOFF(i)) return false;
            const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
            const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
            return Math.ceil(Math.abs(new Date() - d) / (1000 * 60 * 60 * 24)) <= 10;
        }); 
    } else if (mode === 'qc') {
        const now = new Date(); const tD = now.getDate();
        items = items.filter(i => {
            const cmd = String(i.command || "").toLowerCase(); if (cmd.includes('pending') || cmd.includes('progress') || isAuditOFF(i)) return false;
            const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
            const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
            const diff = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
            const iD = (p[0].length === 4) ? parseInt(p[2]) : parseInt(p[0]);
            let cD = iD - 7; if (cD <= 0) cD = 30 + cD;
            return diff >= 20 && (tD === cD);
        });
    } else {
        if (query) {
            items = items.filter(i => !isAuditOFF(i) && (
                i.nama.toLowerCase().includes(query) || 
                i.idCst.toString().toLowerCase().includes(query) || 
                (i.alamat && i.alamat.toLowerCase().includes(query))
            ));
        }
        if (tF && !isNaN(tF)) { 
            items = items.filter(i => {
                if (isAuditOFF(i)) return false; 
                const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
                const day = (p[0].length === 4) ? parseInt(p[2]) : parseInt(p[0]);
                return day == parseInt(tF);
            }); 
        }
    }
    if(sCE) sCE.innerText = items.length; 
    if(sI) sI.classList.remove('hidden');
    let html = "";
    if (mode === 'fast') {
        html += `<button onclick="resetBillingFilter()" class="w-full mb-4 bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm">Reset Hidden Fast</button>`;
        let g1 = items.filter(i => {
            const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
            const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
            const diff = Math.ceil(Math.abs(new Date() - d) / (1000 * 60 * 60 * 24));
            return diff > 5 && diff <= 10;
        });
        let g2 = items.filter(i => {
            const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
            const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
            return Math.ceil(Math.abs(new Date() - d) / (1000 * 60 * 60 * 24)) <= 5;
        });
        if (g1.length > 0) { html += `<div class="fast-group-header" style="background:#f59e0b">⏳ FAST 2 (6-10 HARI)</div>`; g1.forEach(i => html += renderCard(i, 'fast')); }
        if (g2.length > 0) { html += `<div class="fast-group-header">🚀 FAST 1 (0-5 HARI)</div>`; g2.forEach(i => html += renderCard(i, 'fast')); }
    } else if (mode === 'qc') {
        if(items.length > 0) { html += `<div class="qc-group-header">💙 QUALITY CARE</div>`; items.forEach(i => html += renderCard(i, 'qc')); }
    } else if (mode === 'pending') {
        const now = new Date(); const cm = now.getMonth(); const cy = now.getFullYear();
        let pb = items.filter(i => {
            const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
            const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
            return d.getMonth() === cm && d.getFullYear() === cy;
        });
        let pl = items.filter(i => {
            const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
            const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
            return d.getFullYear() < cy || (d.getFullYear() === cy && d.getMonth() < cm);
        });
        if (pb.length > 0) { html += `<div class="pending-old-header" style="background:#f59e0b">📝 PENDING BARU</div>`; pb.forEach(i => html += renderCard(i, 'pending')); }
        if (pl.length > 0) { html += `<div class="pending-old-header">⚠️ PENDING LAMA</div>`; pl.forEach(i => html += renderCard(i, 'pending')); }
    } else items.forEach(i => html += renderCard(i, mode));
    if(list) list.innerHTML = html || `<p class='text-white text-center font-bold bg-white/10 p-4 rounded-xl'>Data tidak ditemukan.</p>`;
}

function renderRekapUI(d) {
    const sa = parseInt(d.totalSA) || 0; const bL = parseInt(d.pointKurang) || 0;
    const tSa = document.getElementById('t-sa');
    if(tSa) tSa.innerText = sa;
    const tOff = document.getElementById('t-off');
    if(tOff) tOff.innerText = d.totalOff || 0;
    const tAktif = document.getElementById('t-aktif');
    if(tAktif) tAktif.innerText = d.pelangganAktif || 0;
    const tBaru = document.getElementById('t-baru');
    if(tBaru) tBaru.innerText = d.totalIdBaru || 0;
    const tPoint = document.getElementById('t-point');
    if(tPoint) tPoint.innerText = (bL - sa > 0) ? bL - sa : 0;
    const tKurang = document.getElementById('t-kurang');
    if(tKurang) tKurang.innerText = bL; 
    const tBonus = document.getElementById('t-bonus');
    if(tBonus) tBonus.innerText = d.totalBonus || 'Rp0';
    let pc = bL > 0 ? (sa / bL) * 100 : 0;
    const bar = document.getElementById('targetProgressBar');
    if(bar) bar.style.width = Math.min(100, Math.round(pc)) + '%';
    const pText = document.getElementById('targetPercentText');
    if(pText) pText.innerText = Math.round(pc) + '%';
}



function getActiveBracket(value, rules) {
    for (const rule of rules) {
        if (value >= rule.min) return rule.key;
    }
    return "0";
}



function hitungUpresBulanan(dataBulanan, activeBr){
    if(activeBr==="0") return 0;

    let total=0;

    for(const kategori in SKEMA_DEKADE){
        total += (dataBulanan[kategori] || 0) *
                 SKEMA_DEKADE[kategori].prices[activeBr];
    }

    return total;
}



function bulanPaid3(bulan){
    const urut = [
        "JAN","FEB","MAR","APR","MEI","JUN",
        "JUL","AGS","SEP","OKT","NOV","DES"
    ];

    const idx = urut.indexOf(String(bulan).toUpperCase());
    if(idx === -1) return "-";

    return urut[(idx + 2) % 12];
}

function hitungBonusDekade() {
    const q = document.querySelector('input[name="quarter"]:checked');
    if(!q) return alert("Pilih Quarter!");
    const mN = ["", "JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
    let months = (q.value === 'q1') ? [1,2,3] : (q.value === 'q2') ? [4,5,6] : (q.value === 'q3') ? [7,8,9] : [10,11,12];
    let statsT = { 'RingEco': 0, 'Jet': 0, 'ValueLite': 0, 'ValueUp': 0 };
    
    let mD = {}; 
    months.forEach(m => { 
        mD[m] = { 'RingEco': 0, 'Jet': 0, 'ValueLite': 0, 'ValueUp': 0, total: 0, insentif: 0, modal: 0 }; 
    });

    fullRawData.forEach(item => {
        // Filter: Hanya hitung data tahun berjalan
        if(!item.tanggal || !isThisYear(item.tanggal)) return; 
        
        const cmd = String(item.command || "").toLowerCase();
        const note = String(item.note || item.billing || "").toLowerCase(); 
        if(cmd.includes("pending") || cmd.includes("progress")) return; 
        const m = parseInt(item.tanggal.split(item.tanggal.includes('/') ? '/' : '-')[1]);
        
        if(months.includes(m)) {
            const pkt = (item.paket || "").toLowerCase();

            ;

            const cat = MAP_KATEGORI[pkt] || "ValueUp";
            
            statsT[cat]++; 
            mD[m][cat]++; 
            mD[m].total++;

            let valInsentif = parseInt(String(item.bonus || "0").replace(/\D/g, "")) || 0;
            mD[m].insentif += valInsentif;
            const angkaNote = note.replace(/[^\d]/g, ""); 
            if (angkaNote) {
                let valModal = parseInt(angkaNote) || 0;
                mD[m].modal += valModal;
            }
        }
    });

    const tSQ = Object.values(statsT).reduce((a,b) => a+b, 0);
    let mBH = ""; let tDB = 0; let tFBQ = 0;

    months.forEach((m, i) => {
        let monthlySA = mD[m].total;
        let activeBr = "0";

        activeBr = (i < 2)
            ? getActiveBracket(monthlySA, UPRES_RULE.MONTH12)
            : getActiveBracket(tSQ, UPRES_RULE.MONTH3);

        let eBFB = hitungUpresBulanan(mD[m], activeBr);
        
        tFBQ += eBFB; 
        let d = (i < 2) ? eBFB * UPRES_RULE.PAY_MONTH12 : 0; 
        if (i < 2 && activeBr !== "0") {
            const cap = MAX_PAY_MAP[activeBr] || 0;
            if (d > cap) d = cap; 
        }

        tDB += d;
        let totalInsentif = mD[m].insentif;
        let paidPertama = totalInsentif * UPRES_RULE.FIRST_PAYMENT_PERCENT;
        let paidKetiga = totalInsentif - paidPertama;
        let namaPaid3 = bulanPaid3(mN[m]);

        mBH += `
    <tr class="border-b">
        <td class="p-2 border text-black font-black">${mN[m]}</td>
        <td class="p-2 border">${mD[m].total}</td>
        <td class="p-2 border text-green-700">Rp${mD[m].insentif.toLocaleString()}</td>
        <td class="p-2 border text-slate-400" style="display: none;">Rp${eBFB.toLocaleString()}</td>
        <td class="p-2 border text-indigo-600">Rp${d.toLocaleString()}</td>
        <td class="p-2 border text-red-600">Rp${(mD[m].modal || 0).toLocaleString()}</td>
        <td class="p-2 border text-emerald-700 font-black">Rp${paidPertama.toLocaleString()}
            <br><span class="text-[9px] text-slate-500">
            Sisa Paid ${namaPaid3}: Rp${paidKetiga.toLocaleString()}
            </span></td>
    </tr>`;
    });

    let finalBr = tSQ >= 75 ? "75" : tSQ >= 60 ? "60" : tSQ >= 45 ? "45" : tSQ >= 30 ? "30" : "0";
    const mbBody = document.getElementById('dk-monthly-bonus-body');
    if(mbBody) mbBody.innerHTML = mBH;
    
    let dkTBodyHTML = ""; 
    for(const c in statsT) dkTBodyHTML += `<tr><td class="text-left font-bold border-r p-2">${c}</td><td class="font-black p-2">${statsT[c]}</td><td class="text-green-600 font-black p-2">@Rp${(finalBr !== "0" ? SKEMA_DEKADE[c].prices[finalBr] : 0).toLocaleString()}</td></tr>`;
    
    const dkSa = document.getElementById('dk-total-sa');
    if(dkSa) dkSa.innerText = tSQ;
    const dkRp = document.getElementById('dk-total-rp');
    if(dkRp) dkRp.innerText = `Rp${Math.max(0, tFBQ - tDB).toLocaleString()}`;
    const dkTBody = document.getElementById('dk-table-body');
    if(dkTBody) dkTBody.innerHTML = dkTBodyHTML;
    const card = document.getElementById('card-total-diterima');
    if(card){
        const hasil = hitungTotalDiterima(mD);
        const namaBulan = ["","JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OKT","NOV","DES"];

        const bulanTransfer = hasil.bulan === 12 ? 1 : hasil.bulan + 1;
        const bulanSisa = hasil.bulan - 2 <= 0 ? hasil.bulan + 10 : hasil.bulan - 2;

        card.innerHTML = `
        <p class="text-green-100 font-bold uppercase text-xs mb-1">
            TOTAL DITERIMA ${namaBulan[bulanTransfer]}
        </p>

        <h3 class="text-4xl font-black text-white">
            Rp${hasil.total.toLocaleString('id-ID')}
        </h3>

        <div class="mt-3 text-white text-xs leading-6">
            <div>80% SA ${namaBulan[hasil.bulan]} : <b>Rp${hasil.paidPertama.toLocaleString('id-ID')}</b></div>
            <div>20% SA ${namaBulan[bulanSisa]} : <b>Rp${hasil.paidKetiga.toLocaleString('id-ID')}</b></div>
        </div>`;
    }

    const hBonus = document.getElementById('hasilBonusDekade');
    if(hBonus) hBonus.classList.remove('hidden');
}



function hitungTotalDiterima(){

    const now = new Date().getMonth()+1;

    const bulanPaid3 = (now-2<=0) ? now+10 : now-2;

    let insentifNow = 0;
    let insentifPaid3 = 0;

    fullRawData.forEach(item=>{

        if(!item.tanggal || !isThisYear(item.tanggal)) return;

        const cmd = String(item.command||"").toLowerCase();
        if(cmd.includes("pending") || cmd.includes("progress")) return;

        const sep = item.tanggal.includes("/") ? "/" : "-";
        const p = item.tanggal.split(sep);

        const bulan = parseInt(p[1]);

        const bonus = parseInt(String(item.bonus||"0").replace(/\D/g,"")) || 0;

        if(bulan===now)
            insentifNow += bonus;

        if(bulan===bulanPaid3)
            insentifPaid3 += bonus;

    });

    const paidPertama = Math.round(
        insentifNow * UPRES_RULE.FIRST_PAYMENT_PERCENT
    );

    const paidKetiga = Math.round(
        insentifPaid3 * (1-UPRES_RULE.FIRST_PAYMENT_PERCENT)
    );

    return{
        bulan:now,
        bulanPaid3,
        paidPertama,
        paidKetiga,
        total:paidPertama+paidKetiga
    };

}
function handleBillingClick(id) { 
    openModal({ 
        title: '⚠️ VERIFIKASI', 
        headerClass: 'bg-red-600', 
        body: `<p>ID: ${cleanId(id)}</p>`, 
        subtext: 'PELANGGAN SUDAH BAYAR?', 
        buttons: [
            { text: 'BATAL', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs', action: () => {} }, 
            { text: 'YA, SUDAH', class: 'bg-red-600 text-white py-3 rounded-xl font-black text-xs', action: () => executeBilling(id) }
        ] 
    }); 
}

function executeBilling(id) {
    const el = document.getElementById(`card-${id}`); if(el) el.style.display = 'none';
    lastDeletedId = id; if(!hiddenBillingIds.includes(id)) hiddenBillingIds.push(id);
    localStorage.setItem('hiddenBillingIds', JSON.stringify(hiddenBillingIds));
    const uToast = document.getElementById('undoToast');
    if(uToast) {
        uToast.style.display = 'flex';
        setTimeout(() => uToast.style.display = 'none', 5000);
    }
    updateFastAndProgressCounts();
}

function undoBilling() {
    if(lastDeletedId) {
        const el = document.getElementById(`card-${lastDeletedId}`); if(el) el.style.display = 'block';
        hiddenBillingIds = hiddenBillingIds.filter(i => i !== lastDeletedId);
        localStorage.setItem('hiddenBillingIds', JSON.stringify(hiddenBillingIds));
        const uToast = document.getElementById('undoToast');
        if(uToast) uToast.style.display = 'none';
        updateFastAndProgressCounts();
    }
}

function resetBillingFilter() { 
    openModal({ 
        title: '⚠️ RESET', 
        headerClass: 'bg-red-600', 
        body: `<p>Refresh daftar Fast Payment?</p>`, 
        subtext: 'SEMUA HIDDEN DATA AKAN MUNCUL', 
        buttons: [
            { text: 'BATAL', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs', action: () => {} }, 
            { text: 'YA, RESET', class: 'bg-red-600 text-white py-3 rounded-xl font-black text-xs', action: () => { hiddenBillingIds = []; localStorage.setItem('hiddenBillingIds', "[]"); cariData('fast'); }}
        ] 
    });
}

function switchTab(t) {
    ['sectionInput', 'sectionCari', 'sectionTabel', 'sectionLeads'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    ['tabInput', 'tabCari', 'tabTabel', 'tabLeads'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.remove('tab-active');
    });
    const targetId = 'section' + t.charAt(0).toUpperCase() + t.slice(1);
    const targetTab = 'tab' + t.charAt(0).toUpperCase() + t.slice(1);
    const targetSection = document.getElementById(targetId);
    const targetTabBtn = document.getElementById(targetTab);
    if (targetSection) targetSection.classList.remove('hidden');
    if (targetTabBtn) targetTabBtn.classList.add('tab-active');
    const scrollCont = document.querySelector('.scrollable-content');
    if(scrollCont) scrollCont.scrollTo(0,0);
}

function pressPin(n) { 
    let p = document.getElementById('pinInput'); 
    if(p && p.value.length < 4) p.value += n; 
}

function clearPin() { 
    const p = document.getElementById('pinInput');
    if(p) p.value = ""; 
}

async function checkPin() {
    let pInput = document.getElementById('pinInput');
    if(!pInput || pInput.value.length < 4) return;
    const pin = pInput.value;
    const btn = document.getElementById('btnEnter'); 
    if(btn) btn.innerHTML = "⏳";
    try {
        const r = await fetch(`${scriptURL}?action=validatePin&pin=${pin}`);
        const res = await r.json();
        if(res.status === "authorized") { 
            const lockScr = document.getElementById('lockScreen');
            if(lockScr) {
                lockScr.style.display = 'none'; 
                lockScr.style.pointerEvents = 'none';
            }
            sessionStorage.setItem('isLoggedIn', 'true'); 
            resetInactivityTimer(); loadDraft(); loadLeadsDraft(); muatDataTabel(); 
        } else { alert("PIN SALAH"); clearPin(); }
    } catch(e) { alert("Error Koneksi: Pastikan URL Script benar."); } finally { if(btn) btn.innerHTML = "OK"; }
}

function handleCopyClick(id) {
    const iT = cleanId(id); navigator.clipboard.writeText(iT);
    openModal({ title: '📋 SALIN', headerClass: 'bg-indigo-600', body: `<p class="text-2xl font-black">${iT}</p>`, subtext: 'ID DISALIN', buttons: [{ text: 'OK', class: 'bg-indigo-600 text-white py-3 rounded-xl font-black text-xs w-full col-span-2', action: () => {} }] });
}

async function prosesWa(hp, id, nama, japo, paket, source = 'general') {
    const card = document.getElementById(`card-${id}`);
    const email = card ? card.getAttribute('data-email') || '-' : '-';
    const harga = card ? card.getAttribute('data-harga') || 'Cek Billing' : 'Cek Billing';
    const alamat = card ? (card.querySelector('p:nth-child(8) b')?.innerText || '-') : '-';
    const tgl = card ? (card.querySelector('p:nth-child(2) b')?.innerText || '-') : '-';
    const cmd = card?.getAttribute('data-command').toLowerCase() || "";
    const isP = cmd.includes('pending');
    let mT = '📲 OPSI WA', hC = 'bg-green-600', tB = 'TEKS OTOMATIS';
    if (isP) { mT = '📲 FOLLOW UP PENDING'; hC = 'bg-amber-500'; tB = 'KIRIM PENAWARAN'; }
    else if (source === 'qc') { mT = '💙 QUALITY CARE'; hC = 'bg-sky-500'; tB = 'TEKS QUALITY CARE'; }
    openModal({
        title: mT, headerClass: hC, body: `<p class="text-xs">Kirim untuk:</p><p class="text-lg font-black">${nama}</p>`, subtext: 'ID: ' + cleanId(id),
        buttons: [
            { text: 'TANPA TEKS', class: 'bg-slate-600 text-white py-3 rounded-xl font-black text-[10px] uppercase', action: () => executeWaAction(hp, id, nama, japo, paket, alamat, tgl, email, harga, false, source, isP) },
            { text: tB, class: hC + ' text-white py-3 rounded-xl font-black text-[10px] uppercase', keepOpen: true, action: (event) => executeWaAction(hp, id, nama, japo, paket, alamat, tgl, email, harga, true, source, isP, event) }
        ]
    });
}

async function generateAndDownloadCard(data) {
    try {
        const nameEl = document.getElementById('card-name');
        const idEl = document.getElementById('card-id');
        const japoEl = document.getElementById('card-japo');
        const packEl = document.getElementById('card-package');
        const addrEl = document.getElementById('card-address');
        const emailEl = document.getElementById('card-email');
        const hpEl = document.getElementById('card-hp');
        const billEl = document.getElementById('card-billing');
        if (!nameEl || !idEl || !japoEl) throw new Error("Elemen kartu tidak ditemukan.");
        nameEl.innerText = data.nama.toUpperCase();
        idEl.innerText = data.id;
        japoEl.innerText = "TGL " + data.japo;
        packEl.innerText = data.paket;
        addrEl.innerText = data.alamat;
        emailEl.innerText = sensorEmail(data.email);
        hpEl.innerText = sensorPhone(data.hp);
        billEl.innerText = data.harga || "Cek Billing";
        const element = document.getElementById('captureCard');
        const canvas = await html2canvas(element, { backgroundColor: null, scale: 2, useCORS: true, logging: false });
        const image = canvas.toDataURL("image/png", 1.0);
        const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").substring(0, 12);
        const link = document.createElement('a');
        link.download = `KARTU_MYREP_${data.nama.replace(/\s+/g, '_')}_${ts}.png`;
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true; 
    } catch (err) { alert("❌ GAGAL GENERATE GAMBAR: " + err.message); return false; }
}

async function executeWaAction(hp, id, nama, japo, paket, alamat, tgl, email, harga, withText, source, isPending, event) {
    let cH = getPureWaNumber(hp);
    const now = new Date();
    const hr = now.getHours();
    let slm = (hr < 11) ? "Pagi" : (hr < 15) ? "Siang" : (hr < 18) ? "Sore" : "Malam";
    const portalLink = "\n\nCek promo, ganti password, kendala: \n\nwww.myrepublicsragen.my.id";
    let textMessage = "";
    
    // LOGIKA PENYUSUNAN PESAN
    if (isPending) textMessage = `Halo Selamat ${slm} Bpk/Ibu *${nama.toUpperCase()}*,\n\nSaya *DWI* dari MyRepublic ingin menanyakan kembali terkait rencana pemasangan internetnya. Apakah ada kendala atau ada yang ingin ditanyakan? Saya bantu kawal prosesnya sampai aktif ya Pak/Bu. 😊`;
    else if (source === 'progress') textMessage = `Halo Selamat ${slm} Bpk/Ibu *${nama.toUpperCase()}*,\n\nInformasi terbaru, saat ini pemasangan Anda sudah *Masuk Antrian Instalasi*. Mohon kesediaannya menunggu tim teknisi menghubungi untuk jadwal kunjungan ke lokasi. 🙏`;
    else if (source === 'fast') {
        const p = tgl.includes("/") ? tgl.split("/") : tgl.split("-");
        const jatuhTempo = (p[0].length === 4) ? new Date(+p[0], +p[1]-1, +p[2]) : new Date(+p[2], +p[1]-1, +p[0]);
        jatuhTempo.setDate(jatuhTempo.getDate() + 5);
        const japoRange = `Setiap tanggal ${jatuhTempo.getDate()}`;
        textMessage = `Halo Selamat ${slm} Bpk/Ibu *${nama.toUpperCase()}*,\n\nTerima kasih telah bergabung. Mengingat pemasangan baru saja aktif, kami informasikan tagihan pertama Anda sebesar *${harga}* berikut Kode pembayaran \n\n*ID PEMBAYARAN: ${cleanId(id)}*\n*Alamat: ${alamat}*\n*Jatuh tempo: ${japoRange}.* \n\n> Silahkan di bayarkan tepat waktu untuk menghindari denda 🙏`;
    }
    else if (source === 'qc') textMessage = `Selamat ${slm} Bpk/Ibu *${nama.toUpperCase()}*,\n\nBagaimana kualitas jaringan MyRepublic di lokasi saat ini? Apakah ada kendala? Jika lancar, mohon rekomendasikan ke saudara/tetangga ya Pak/Bu. 🤝`;
    else {
        const tglHariIni = now.getDate();
        const tglJapo = parseInt(japo);
        const selisih = tglJapo - tglHariIni;
        if (selisih >= 0 && selisih <= 5) textMessage = `Halo Selamat ${slm} Bpk/Ibu *${nama.toUpperCase()}*,\n\nMengingatkan tagihan MyRepublic bulan ini sebesar *${harga}* sudah muncul. Jatuh tempo dalam *${selisih} hari lagi* (Tgl ${japo}). Mohon melakukan pembayaran tepat waktu agar terhindar dari isolir. 💳`;
        else if (tglHariIni > tglJapo && tglHariIni <= tglJapo + 5) textMessage = `Halo Selamat ${slm} Yth. Bpk/Ibu *${nama.toUpperCase()}*,\n\nKami informasikan bahwa tagihan Anda sebesar *${harga}* saat ini sudah *Melewati Jatuh Tempo*. Mohon segera dilakukan pembayaran hari ini untuk menghindari pemutusan layanan otomatis. 🙏`;
        else textMessage = `Halo Selamat ${slm} Bpk/Ibu *${nama.toUpperCase()}*,\n\nTerima kasih telah menjadi pelanggan setia MyRepublic. Berikut rincian kartu pelanggan Anda: *${cleanId(id)}*.`;
    }
    textMessage += portalLink;
    
    const isMobile = /iPhone|Android/i.test(navigator.userAgent);
    const waBase = isMobile ? "https://api.whatsapp.com/send" : "https://web.whatsapp.com/send";
    const finalUrl = `${waBase}?phone=${cH}${withText ? '&text=' + encodeURIComponent(textMessage) : ''}`;
    
    if (withText && !isPending) {
        const btn = event ? event.target : null;
        if(btn) { btn.innerText = "⏳ GENERATING HD..."; btn.disabled = true; }
        const success = await generateAndDownloadCard({ nama, id: cleanId(id), japo, paket, alamat, email, hp, harga });
        if(!success) alert("❌ Gagal membuat kartu. WhatsApp tetap dibuka.");
        let countdown = 5;
        const timer = setInterval(() => {
            if(btn) btn.innerText = `🚀 OPENING WA IN ${countdown}s...`;
            countdown--;
            if(countdown < 0) clearInterval(timer);
        }, 1000);
        setTimeout(() => {
            window.open(finalUrl, '_blank');
            if(btn) { btn.innerText = "TEKS OTOMATIS"; btn.disabled = false; }
            closeModal();
        }, 5500);
    } else {
        window.open(finalUrl, '_blank');
        closeModal();
    }
}

async function updateFastAndProgressCounts() {
    if(!fullRawData) return;
    const pC = fullRawData.filter(i => (i.command || "").toLowerCase().includes('on progress') && !isAuditOFF(i)).length;
    const tPC = document.getElementById('totalProgressCount');
    if(tPC) tPC.innerText = pC; 
    const peC = fullRawData.filter(i => (i.command || "").toLowerCase().includes('pending') && !isAuditOFF(i)).length;
    const tPeC = document.getElementById('totalPendingCount');
    if(tPeC) tPeC.innerText = peC;
    const now = new Date(); const tD = now.getDate();
    const fI = fullRawData.filter(i => {
        const cmd = String(i.command || "").toLowerCase(); if (cmd.includes('pending') || cmd.includes('progress') || isAuditOFF(i)) return false;
        const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
        const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
        return Math.ceil(Math.abs(new Date() - d) / (1000 * 60 * 60 * 24)) <= 10;
    });
    const tFC = document.getElementById('totalFastCount');
    if(tFC) tFC.innerText = fI.filter(i => !hiddenBillingIds.includes(i.idCst)).length;
    const qI = fullRawData.filter(i => {
        const cmd = String(i.command || "").toLowerCase(); if (cmd.includes('pending') || cmd.includes('progress') || isAuditOFF(i)) return false;
        const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
        const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
        const diff = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
        const iD = (p[0].length === 4) ? parseInt(p[2]) : parseInt(p[0]);
        let cD = iD - 7; if (cD <= 0) cD = 30 + cD;
        return diff >= 20 && (tD === cD);
    });
    const tQC = document.getElementById('totalQcCount');
    if(tQC) tQC.innerText = qI.length;
}

function triggerAnimate(el) { el.classList.remove('animate-click'); void el.offsetWidth; el.classList.add('animate-click'); }

document.querySelectorAll('.force-caps').forEach(el => { el.addEventListener('input', function() { this.value = this.value.toUpperCase(); }); });

const rForm = document.getElementById('rekapanForm');
if(rForm) {
    rForm.addEventListener('submit', async e => {
        e.preventDefault();
        const currentId = e.target.id_cst.value.trim();
        const duplicate = fullRawData.find(item => cleanId(item.idCst) === cleanId(currentId));
        if (duplicate) {
            const confirmSave = confirm(`ID ${currentId} sudah terdaftar atas nama ${duplicate.nama}. Tetap simpan?`);
            if (!confirmSave) return;
        }
        const btn = document.getElementById('btnKirim'); btn.disabled = true; btn.innerText = "🚀 MENYIMPAN...";
        const rFD = new FormData(e.target); 
        rFD.set('hp', formatWaMeLink(rFD.get('hp'))); 
        const op = document.getElementById('onProgress');
        const pen = document.getElementById('pending');
        let sCB = (op && op.checked) ? "ON PROGRESS" : ((pen && pen.checked) ? "PENDING" : "");
        const iMan = document.getElementById('inputManual');
        if(iMan) rFD.set('command', iMan.value.toUpperCase());          
        rFD.set('nama', rFD.get('nama').toUpperCase()); rFD.set('alamat', rFD.get('alamat').toUpperCase());
        rFD.set('command_billing', sCB); 
        try {
            const r = await fetch(scriptURL, { method: 'POST', body: rFD });
            if((await r.text()) === "Success") { alert("Berhasil!"); e.target.reset(); clearDraft(); muatDataTabel(); } 
        } catch(e) { alert("Error Simpan Data."); } finally { btn.disabled = false; btn.innerText = "Simpan Data"; }
    });
}

function getGeoLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const iKoor = document.getElementById('inputKoordinat');
            if(iKoor) iKoor.value = lat + ", " + lon;
            await reverseGeocode(lat, lon);
            saveLeadsDraft();
        }, () => { alert("Gagal mengambil lokasi. Pastikan GPS aktif."); });
    }
}

async function reverseGeocode(lat, lon) {
    const alamatField = document.getElementsByName('leads_alamat')[0];
    if(!alamatField) return;
    alamatField.placeholder = "⏳ Mengekstrak alamat...";
    try {
        const response = await fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + lat + "&lon=" + lon);
        const data = await response.json();
        if (data && data.display_name) { 
            let cleanAlamat = data.display_name.toUpperCase();
            cleanAlamat = cleanAlamat.replace(", JAWA,", ","); 
            alamatField.value = cleanAlamat;
        }
    } catch (err) { console.error("Geocoding Error"); }
}

const lForm = document.getElementById('leadsForm');
if(lForm) {
    lForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnKirimLeads');
        btn.disabled = true;
        btn.innerText = "🚀 MENGIRIM...";
        const formData = new FormData(e.target);
        const rawDate = formData.get('leads_janji_temu');
        if (rawDate) {
            const [y, m, d] = rawDate.split('-');
            const formattedDate = `${d}/${m}/${y}`;
            formData.set('leads_janji_temu', formattedDate);
        }
        formData.set('leads_hp', formatWaMeLink(formData.get('leads_hp')));
        try {
            const response = await fetch(leadsScriptURL, { method: 'POST', body: formData });
            const result = await response.text();
            if (result === "Success") {
                alert("Berhasil! Data Prospek telah tersimpan.");
                localStorage.removeItem('leadsDraft');
                e.target.reset();
                cekJanjiTemuLeads();
            } else alert("Gagal menyimpan: " + result);
        } catch (err) { alert("Kesalahan koneksi."); }
        finally { btn.disabled = false; btn.innerText = "Simpan Prospek"; }
    });
}

async function lihatDaftarLeads() {
    const container = document.getElementById('leadsList');
    const cardsContainer = document.getElementById('cardsContainer');
    if(!container || !cardsContainer) return;
    container.classList.remove('hidden');
    cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-slate-400 animate-pulse">MEMUAT DATA...</p>';
    container.scrollIntoView({ behavior: 'smooth' });
    try {
        const response = await fetch(leadsScriptURL + "?action=getLeads");
        const data = await response.json();
        if (!data || data.length === 0) { cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-slate-400">TIDAK ADA DATA.</p>'; return; }
        renderLeadsCards(data);
    } catch (err) { cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-red-400">GAGAL MEMUAT DATA.</p>'; }
}

function renderLeadsCards(data) {
    const cardsContainer = document.getElementById('cardsContainer');
    if(!cardsContainer) return;
    cardsContainer.innerHTML = ''; 
    const promoLink = `Cek promo, ganti password, kendala :\n\nwww.myrepublicsragen.my.id`;

    data.forEach(item => {
        const now = new Date(); 
        const hr = now.getHours();
        let slm = (hr < 11) ? "Pagi" : (hr < 15) ? "Siang" : (hr < 18) ? "Sore" : "Malam";
        const namaPel = item.nama || 'Bapak/Ibu';
        const rawPesanProspek = `Halo Selamat ${slm} Yth. Bpk/Ibu *${namaPel.trim()}*,\n\nSaya dari *MyRepublic Indonesia* ingin menindaklanjuti rencana pemasangan internet di alamat ${item.alamat || '-'} (${item.koordinat || '-'}).\n\nKami sedang ada *Promo Spesial* khusus untuk area Anda berupa gratis biaya instalasi jika registrasi dilanjutkan hari ini.\n\nSaya akan melakukan kunjungan ke lokasi, apabila Bapak/Ibu berkenan untuk dipasang atau ingin konsultasi paket lebih lanjut bisa kabari saya ya. Terima kasih!\n\n${promoLink}`;
        const hpMurni = formatWaMeLink(item.hp);
        const linkWA = "https://api.whatsapp.com/send?phone=" + hpMurni + "&text=" + encodeURIComponent(rawPesanProspek);
        const linkMaps = item.koordinat ? "https://www.google.com/maps?q=" + encodeURIComponent(item.koordinat) : "#";
        const rawPesanIntro = `Halo Selamat ${slm} Yth. Bpk/Ibu *${namaPel.trim()}*,\n\nAlamat: ${item.alamat || '-'} (${item.koordinat || '-'}) \n\nPerkenalkan saya *DWI LS.* tim pemasangan *WiFi MyRepublic.*\n\nSimpan nomor saya, untuk kebutuhan kedepan apabila membutuhkan pemasangan WiFi. Terima kasih!\n\n${promoLink}`;
        const linkWaIntro = "https://api.whatsapp.com/send?phone=" + hpMurni + "&text=" + encodeURIComponent(rawPesanIntro);
        
        const card = document.createElement('div');
        card.className = 'lead-card mb-4';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-black text-indigo-900 text-sm uppercase">${item.nama || '-'}</h3>
                <span class="bg-indigo-100 text-indigo-600 text-[8px] font-black px-2 py-1 rounded-full uppercase">${item.tgl_d2d || 'BARU'}</span>
            </div>
            <div class="space-y-1 mb-3">
                <p class="text-[10px] text-slate-500 font-bold uppercase">📞 ${item.hp || '-'}</p>
                <p class="text-[10px] text-slate-500 font-bold uppercase">📍 ${item.alamat ? item.alamat.substring(0, 80) : '-'}...</p>
                <p class="text-[10px] text-orange-600 font-black uppercase">⚠️ ${item.alasan || '-'}</p>
                ${item.janji_temu ? `<p class="text-[10px] text-indigo-600 font-black uppercase">🤝 JANJI: ${item.janji_temu.split('T')[0]}</p>` : ''}
            </div>
            <div class="flex gap-2">
                <button onclick="window.open('${linkWA}', '_blank')" class="flex-1 bg-green-500 hover:bg-green-600 text-white text-[9px] font-black py-2.5 rounded-lg uppercase flex items-center justify-center gap-1">💬 Follow Up</button>
                <button onclick="window.open('${linkWaIntro}', '_blank')" class="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-[9px] font-black py-2.5 rounded-lg uppercase flex items-center justify-center gap-1 shadow-md transition-all">👋 SAYA DWI</button>
                <button onclick="window.open('${linkMaps}', '_blank')" class="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-black py-2.5 rounded-lg uppercase">📍 Lokasi</button>
            </div>`;
        cardsContainer.appendChild(card);
    });
}

function tutupDaftar() { 
    const el = document.getElementById('leadsList');
    if(el) el.classList.add('hidden'); 
}

const manualInputCoord = document.getElementById('inputKoordinat');
if (manualInputCoord) {
    manualInputCoord.addEventListener('change', function() {
        const val = this.value;
        const matches = val.match(/(-?\d+(?:[.,]\d+)?)/g);
        if (matches && matches.length >= 2) {
            let lat = parseFloat(matches[0].replace(',', '.'));
            let lon = parseFloat(matches[1].replace(',', '.'));
            if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                this.value = `${lat}, ${lon}`;
                reverseGeocode(lat, lon);
            }
        }
    });
}

function openComplaintSearch() {
    openModal({
        title: '⚠️ LAPOR COMPLAINT', headerClass: 'bg-red-700',
        body: `<div class="p-2 text-center"><p class="text-[10px] mb-2 text-slate-500 uppercase font-bold">CARI DATA PELANGGAN BERKENDALA:</p><input type="text" id="complaintSearchInput" placeholder="Nama/ID/Alamat..." class="input-field mb-2 border-red-200" oninput="liveSearchComplaint(this.value)"><div id="complaintResults" class="max-h-60 overflow-y-auto space-y-2 mt-2"></div></div>`,
        subtext: 'Pilih pelanggan dari daftar',
        buttons: [{ text: 'BATAL', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs w-full col-span-2', action: () => {} }]
    });
}

function liveSearchComplaint(query) {
    const resDiv = document.getElementById('complaintResults');
    if(!resDiv || query.length < 3) { if(resDiv) resDiv.innerHTML = ""; return; }
    const filtered = fullRawData.filter(i => i.nama.toLowerCase().includes(query.toLowerCase()) || i.idCst.toString().toLowerCase().includes(query.toLowerCase()) || (i.alamat && i.alamat.toLowerCase().includes(query.toLowerCase()))).slice(0, 5);
    let html = "";
    filtered.forEach(item => {
        html += `<div onclick="inputKendalaComplaint('${item.idCst}')" class="p-4 bg-red-50 border border-red-100 rounded-2xl cursor-pointer hover:bg-red-100 text-left transition-all shadow-sm mb-2"><div class="flex justify-between items-start mb-2"><p class="text-[11px] font-black text-red-900 uppercase">${item.nama}</p><span class="bg-red-200 text-red-700 text-[8px] font-black px-2 py-0.5 rounded">ID: ${item.idCst}</span></div><div class="grid grid-cols-1 gap-1 text-[9px] text-slate-600 font-bold uppercase"><p>🚀 PAKET: ${item.paket || '-'}</p><p>📞 HP: ${formatBeautifulNumber(item.hp)}</p><p class="mt-1 pt-1 border-t border-red-200/50">📍 ${item.alamat || '-'}</p></div></div>`;
    });
    resDiv.innerHTML = html || "<p class='text-[9px] text-slate-400 text-center py-4'>Data tidak ditemukan...</p>";
}

function inputKendalaComplaint(idCst) {
    const item = fullRawData.find(i => String(i.idCst) === String(idCst));
    if(!item) return;
    closeModal();
    setTimeout(() => {
        openModal({
            title: '🛠️ DETAIL KENDALA', headerClass: 'bg-red-700',
            body: `<div class="p-2 text-left"><p class="text-[10px] font-bold text-slate-500 mb-1 uppercase">Customer: ${item.nama}</p><textarea id="textKendala" placeholder="Detail kendala..." class="input-field h-24 border-red-200 force-caps text-left" oninput="logikaSaranKendala(this.value)"></textarea><div id="containerSaran" class="mt-3 flex flex-wrap gap-2"></div></div>`,
            subtext: 'Kirim via WhatsApp & Telegram',
            buttons: [{ text: 'BATAL', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs', action: () => {} },
            { text: 'KIRIM LAPORAN', class: 'bg-red-700 text-white py-3 rounded-xl font-black text-xs', action: () => { const tK = document.getElementById('textKendala'); if(tK) executeSendComplaint(item, tK.value); } }]
        });
    }, 300);
}

function logikaSaranKendala(val) {
    const container = document.getElementById('containerSaran');
    if (!container) return;
    const query = val.toLowerCase().trim();
    if (query.length < 1) { container.innerHTML = ""; return; }
    const daftarSaran = [
        { text: 'KABEL PUTUS.' }, { text: 'KABEL LOS MERAH.' }, { text: 'KABEL BENDING.' }, { text: 'KABEL TERTIMPA POHON.' },
        { text: 'INTERNET LELET.' }, { text: 'POWER LOS MERAH.' }, { text: 'ROUTER MATI.' }, { text: 'YOUTUBE BUFFERING.' }
    ];
    const displaySaran = daftarSaran.filter(saran => saran.text.toLowerCase().includes(query));
    if (displaySaran.length > 0) {
        container.innerHTML = displaySaran.map(s => `
            <button type="button" onclick="pilihSaran('${s.text.replace(/'/g, "\\'")}')" 
            class="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-red-700 hover:text-white transition-all shadow-sm mb-1 text-left w-full">
            + ${s.text}</button>`).join('');
    } else { container.innerHTML = ""; }
}

function pilihSaran(txt) {
    const input = document.getElementById('textKendala');
    if (input) { input.value = txt.toUpperCase(); input.focus(); document.getElementById('containerSaran').innerHTML = ""; }
}

async function executeSendComplaint(item, kendala) {
    const now = new Date(); 
    const hari = now.toLocaleDateString('id-ID', { weekday: 'long' }); 
    const tgl = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const hr = now.getHours();
    const salamWaktu = (hr < 11) ? "Pagi" : (hr < 15) ? "Siang" : (hr < 18) ? "Sore" : "Malam";

    const basePesan = `*COMPLAINT CUSTOMER*\n-----------------------------\n${hari}\n${tgl}\n\n• Nama: ${item.nama.toUpperCase()}\n• ID Pelanggan: ${item.idCst}\n• Paket: ${item.paket}\n• No HP: ${formatBeautifulNumber(item.hp)}\n• Alamat: ${item.alamat.toUpperCase()}\n\n⚠️ KENDALA:\n${kendala.toUpperCase()}\n\n-----------------------------\nMohon bantuannya mas @admin`;
    const followUpCustomerMsg = `Halo Selamat ${salamWaktu} Bpk/Ibu *${item.nama.trim().toUpperCase()}*, mengonfirmasi laporan kendala pada hari ${hari}, tanggal ${tgl}. Apakah koneksi internetnya saat ini sudah kembali lancar?`;
    const linkFollowUpCustomer = `https://api.whatsapp.com/send?phone=${getPureWaNumber(item.hp)}&text=${encodeURIComponent(followUpCustomerMsg)}`;
    const followUpCSMsg = `Internet belum ada perubahan.\n\n• Nama: ${item.nama.toUpperCase()}\n• ID Pelanggan: ${item.idCst}\n• Alamat: ${item.alamat.toUpperCase()}\n• Kendala: ${kendala.toUpperCase()}\n• Tanggal Komplain: ${tgl}\n\n-----------------------------\nMohon bantuannya mas @admin`;
    const linkFollowUpCS = `https://wa.me/?text=${encodeURIComponent(followUpCSMsg)}`;
    const pesanTelegram = `${basePesan}\n\n📲 [FOLLOW UP PELANGGAN](${linkFollowUpCustomer})\n🛠️ [RE-FOLLOW UP CS](${linkFollowUpCS})`;

    const telTok = '8531770277:AAHeVSPnFszoaUxeGINKzF68EK0EiSX6j7c'; 
    const chatId = '-1003594385102'; 
    const threadId = '13'; 

    try { 
        await fetch(`https://api.telegram.org/bot${telTok}/sendMessage`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ chat_id: chatId, message_thread_id: threadId, text: pesanTelegram, parse_mode: 'Markdown', disable_web_page_preview: true }) 
        }); 
    } catch (err) { console.error("Telegram Error"); }

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(basePesan)}`, '_blank');
}

function sensorEmail(email) {
    if (!email || email === '-' || !email.includes("@")) return '-';
    const parts = email.split("@");
    if (parts[0].length <= 6) return parts[0].substring(0, 1) + "***" + "@" + parts[1];
    return `${parts[0].substring(0, 3)}***${parts[0].substring(parts[0].length - 3)}@${parts[1]}`;
}

function sensorPhone(phone) {
    if (!phone || phone === '-') return '-';
    let clean = phone.toString().replace(/\D/g, "");
    if (clean.startsWith("62")) clean = "0" + clean.slice(2);
    if (clean.length < 10) return clean;
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}***-***${clean.substring(clean.length - 1)}`;
}

const SKEMA_BELT = [
    { nama: "HITAM", minSubs: 401, maxSubs: Infinity, bonus: 2000000, minSA: 14 },
    { nama: "COKELAT", minSubs: 251, maxSubs: 400, bonus: 1300000, minSA: 12 },
    { nama: "BIRU", minSubs: 151, maxSubs: 250, bonus: 800000, minSA: 11 }
];

function hitungInsentifBelt(totalSubsAktif3Bln, currentMonthSA) {
    const tier = SKEMA_BELT.find(b => totalSubsAktif3Bln >= b.minSubs);
    if (tier) {
        if (currentMonthSA >= tier.minSA) return { nama: tier.nama, bonus: tier.bonus, status: "CAIR" };
        else return { nama: tier.nama, bonus: 0, status: "TIDAK CAIR (MIN SA KURANG)" };
    }
    return { nama: "DIBAWAH BIRU", bonus: 0, status: "BELUM MASUK TIER" };
}



function refreshTotalDiterima(){

    const card=document.getElementById("card-total-diterima");
    if(!card) return;

    const hasil=hitungTotalDiterima();

    const namaBulan=[
        "",
        "JAN","FEB","MAR","APR","MEI","JUN",
        "JUL","AGU","SEP","OKT","NOV","DES"
    ];

    const bulanTransfer=
        hasil.bulan===12 ? 1 : hasil.bulan+1;

    const bulanSisa=
        hasil.bulan-2<=0 ? hasil.bulan+10 : hasil.bulan-2;

    card.innerHTML=`
    <p class="text-green-100 font-bold uppercase text-xs mb-1">
        TOTAL DITERIMA ${namaBulan[bulanTransfer]}
    </p>

    <h3 class="text-4xl font-black text-white">
        Rp${hasil.total.toLocaleString('id-ID')}
    </h3>

    <div class="mt-3 text-white text-xs leading-6">
        <div>
            80% SA ${namaBulan[hasil.bulan]} :
            <b>Rp${hasil.paidPertama.toLocaleString('id-ID')}</b>
        </div>

        <div>
            20% SA ${namaBulan[bulanSisa]} :
            <b>Rp${hasil.paidKetiga.toLocaleString('id-ID')}</b>
        </div>
    </div>`;
}

