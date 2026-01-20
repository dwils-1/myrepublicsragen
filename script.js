// --- KONFIGURASI ---
const scriptURL = 'https://script.google.com/macros/s/AKfycbxg4NOHEllwqSWXxVkY-0emJWaGt3AKtmlRUiDSfZU9iO7KuhoVjYOA5GhQDfpUooqN/exec'; 
const leadsScriptURL = 'https://script.google.com/macros/s/AKfycbwLdNTyp7ezmoD24uezz6Jojoy4CyS5Igc0WmxhBghJVYKYFFu5ay_I4FUGXZUemVWbYA/exec';
const TGL_JOIN = new Date('2025-07-25'); 

let lastDeletedId = null;
let hiddenBillingIds = JSON.parse(localStorage.getItem('hiddenBillingIds')) || [];
let currentTotalSA = 0; 
let fullRawData = JSON.parse(localStorage.getItem('fullRawData')) || []; 

const SKEMA_DEKADE = {
    'RingEco': { prices: { '45': 25000, '60': 30000, '75': 35000 } },
    'Jet': { prices: { '45': 80000, '60': 95000, '75': 110000 } },
    'ValueLite': { prices: { '45': 90000, '60': 105000, '75': 120000 } },
    'ValueUp': { prices: { '45': 145000, '60': 165000, '75': 185000 } }
};

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
    if (ls) ls.style.display = 'flex';
    clearPin();
}

window.onload = () => {
    updateLiveDate();
    loadDraft();
    loadLeadsDraft();
    resetInactivityTimer();
    
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('lockScreen').style.display = 'none';
        muatDataTabel();
    } else {
        document.getElementById('lockScreen').style.display = 'flex';
    }

    const today = new Date().toISOString().split('T')[0];
    if(document.getElementById('leads_tgl_d2d_hidden')) {
        document.getElementById('leads_tgl_d2d_hidden').value = today;
    }
};

document.onmousemove = resetInactivityTimer;
document.onkeypress = resetInactivityTimer;
document.ontouchstart = resetInactivityTimer;
document.onscroll = resetInactivityTimer;
document.onclick = resetInactivityTimer;

function updateLiveDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDateDisplay').innerText = now.toLocaleDateString('id-ID', options);
}

// --- LOGIKA AUTOCOMPLETE ALAMAT ---
const alamatInput = document.getElementById('inputAlamat');
const alamatSuggestions = document.getElementById('alamatSuggestions');

if (alamatInput) {
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

document.addEventListener('click', (e) => { if (e.target !== alamatInput) alamatSuggestions.classList.add('hidden'); });

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

document.querySelectorAll('.draft-leads').forEach(el => {
    el.addEventListener('input', saveLeadsDraft);
    el.addEventListener('change', saveLeadsDraft);
});

// --- HELPER FUNCTIONS ---
function cleanId(idStr) { return String(idStr || "").replace(/\s*S\s*$/i, "").trim(); }
function isAuditOFF(item) {
    const cmd = String(item.command || "").toUpperCase();
    const idRaw = String(item.idCst || "").toLowerCase();
    return idRaw.includes('off') || cmd.includes('OFF');
}
function formatWaMeLink(num) {
    let clean = num.toString().replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    else if (clean.startsWith("8")) clean = "62" + clean;
    else if (!clean.startsWith("62")) clean = "62" + clean;
    return clean;
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
                const p = item.tanggal.split(sep);
                if(p.length >= 3) {
                    const m = parseInt(p[1])-1; 
                    const y = (sep === '/' ? parseInt(p[2]) : parseInt(p[0]));
                    const dayPemasangan = (sep === '/' ? parseInt(p[0]) : parseInt(p[2]));
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

        document.getElementById('displayBulan').innerText = "BULAN " + bnFull[now.getMonth()];
        document.getElementById('label-kurang').innerText = "SA " + bnFull[lm];
        
        const notifBanner = document.getElementById('notifBilling');
        if(countBillingToday > 0) {
            notifBanner.style.display = 'flex';
            document.getElementById('notifText').innerText = `Ada ${countBillingToday} Pelanggan masuk siklus tagihan hari ini!`;
        } else { notifBanner.style.display = 'none'; }
        
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
        document.getElementById('displayBulan').innerText = "BULAN " + bn[now.getMonth()];
        document.getElementById('label-kurang').innerText = "SA " + bn[lm];
        
        let cBT = 0; const tD = now.getDate(); let cLM = 0; let tSAF = 0;
        fullRawData.forEach(item => {
            const cmd = String(item.command || "").toLowerCase();
            if(item.tanggal) {
                const sep = item.tanggal.includes('/') ? '/' : '-';
                const p = item.tanggal.split(sep);
                if(p.length >= 3) {
                    const m = parseInt(p[1])-1; const y = (sep === '/' ? parseInt(p[2]) : parseInt(p[0]));
                    const dP = (sep === '/' ? parseInt(p[0]) : parseInt(p[2]));
                    if(!cmd.includes("pending") && !cmd.includes("progress")) {
                        if(m === now.getMonth() && y === now.getFullYear()) tSAF++;
                        if(m === lm && y === ty) cLM++;
                        if(dP === tD) cBT++;
                    }
                }
            }
        });

        const nB = document.getElementById('notifBilling');
        if(cBT > 0) { nB.style.display = 'flex'; document.getElementById('notifText').innerText = `Ada ${cBT} Pelanggan siklus tagihan hari ini!`; } 
        else nB.style.display = 'none';

        summary.pointKurang = cLM; summary.totalSA = tSAF; currentTotalSA = tSAF;
        renderRekapUI(summary); updateFastAndProgressCounts(); generateHistoryFromData(fullRawData); triggerGradeCalc();
        
        cekJanjiTemuLeads();
    } catch (e) { loadOfflineData(); } finally { if(btn) btn.innerText = "🔄 Sinkronisasi Data Aktif"; }
}

function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function cekJanjiTemuLeads() {
    try {
        const response = await fetch(`${leadsScriptURL}?action=getLeads`);
        const data = await response.json();
        const todayStr = getTodayString(); 
        
        let count = 0;
        data.forEach(item => {
            if (item.janji_temu) {
                const tglJanji = item.janji_temu.split('T')[0].trim();
                if (tglJanji === todayStr) count++;
            }
        });

        const banner = document.getElementById('janjitemu');
        if (count > 0) {
            banner.style.display = 'flex';
            document.getElementById('notifJanjiText').innerText = `Ada ${count} Pelanggan rencana janji temu hari ini!`;
        } else {
            banner.style.display = 'none';
        }
    } catch (err) {
        console.warn("Koneksi ke Leads gagal (cekJanjiTemuLeads)");
    }
}

async function lihatDaftarJanjiTemuHariIni() {
    switchTab('cari');
    const container = document.getElementById('leadsList');
    const cardsContainer = document.getElementById('cardsContainer');
    container.classList.remove('hidden');
    cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-white animate-pulse">MENYARING DAFTAR HARI INI...</p>';
    
    try {
        const response = await fetch(`${leadsScriptURL}?action=getLeads`);
        const data = await response.json();
        const todayStr = getTodayString(); 
        const filtered = data.filter(item => item.janji_temu && item.janji_temu.split('T')[0].trim() === todayStr);
        
        if (filtered.length > 0) {
            renderLeadsCards(filtered);
        } else {
            cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-slate-300">TIDAK ADA JADWAL HARI INI.</p>';
        }
    } catch (err) {
        cardsContainer.innerHTML = '<p class="text-center text-[10px] font-bold text-red-400">ERROR MEMUAT LEADS.</p>';
    }
}

function filterJatuhTempoHariIni() {
    const today = new Date().getDate();
    switchTab('cari');
    document.getElementById('dateInput').value = today;
    cariData('search');
}

function toggleCheckbox(otherId, current) {
    if (current.checked) document.getElementById(otherId).checked = false; 
    saveDraft();
}

function toggleSection(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    if (content.classList.contains('hidden')) { content.classList.remove('hidden'); icon.innerText = '▲'; }
    else { content.classList.add('hidden'); icon.innerText = '▼'; }
}

function triggerGradeCalc() {
    const resGrade = hitungGradeDanHold(currentTotalSA, new Date());
    document.getElementById('grade-container').innerHTML = `<span class="grade-badge grade-${resGrade.grade}">${resGrade.grade}</span>`;
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
        const p = item.tanggal.split(sep);
        if (p.length < 3) return;
        const d = parseInt(p[sep === '/' ? 0 : 2]);
        const m = parseInt(p[1]) - 1;
        const y = (sep === '/') ? parseInt(p[2]) : parseInt(p[0]);
        if (d <= tglHariIni) {
            if (m === blnSkrg && y === thnSkrg) cBI++;
            else if (m === blnLalu && y === thnLalu) cBL++;
        }
    });
    const el = document.getElementById('dvzd-status');
    el.innerText = `${cBL} vs ${cBI}`;
    el.className = (cBI >= cBL) ? "text-lg font-black text-green-600" : "text-lg font-black text-red-600";
}

function generateHistoryFromData(data) {
    const tbody = document.getElementById('historyTableBody');
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
    document.getElementById('modalHeader').className = `p-4 text-center ${config.headerClass}`;
    document.getElementById('modalTitle').innerText = config.title;
    document.getElementById('modalBody').innerHTML = config.body;
    document.getElementById('modalSubtext').innerText = config.subtext;
    const btnBox = document.getElementById('modalButtons'); btnBox.innerHTML = '';
    config.buttons.forEach(btn => {
        const b = document.createElement('button'); b.innerText = btn.text; b.className = btn.class;
        b.onclick = () => { btn.action(); closeModal(); }; btnBox.appendChild(b);
    });
    modal.style.display = 'flex';
}
function closeModal() { document.getElementById('customModal').style.display = 'none'; }

function formatBeautifulNumber(num) {
    if (!num) return "-";
    let clean = num.toString().replace("wa.me/+", "").replace(/\D/g, "");
    if (clean.startsWith("62")) clean = "0" + clean.slice(2);
    else if (!clean.startsWith("0")) clean = "0" + clean;
    if (clean.length >= 11) return clean.replace(/(\d{4})(\d{4})(\d{4,})/, '$1-$2-$3');
    return clean;
}

function getPureWaNumber(num) {
    let clean = num.toString().replace("wa.me/+", "").replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    else if (clean.startsWith("8")) clean = "62" + clean;
    return clean;
}

function renderCard(item, mode) {
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
    let sPB = isP ? `<button onclick="handleSetProgress('${item.idCst}', '${item.nama}')" class="bg-orange-500 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] shadow-sm flex-1">Set Progress</button>` : "";
    
    const cH = (item.billing && item.billing.trim() !== "") ? `<p class="col-span-2 border-t pt-1 mt-1 text-indigo-700 font-semibold">📝 Note: <i>${item.billing}</i></p>` : "";
    const waC = (mode === 'qc') ? 'bg-sky-500 hover:bg-sky-600' : 'bg-green-500 hover:bg-green-600';
    const waL = (mode === 'qc') ? 'KIRIM QUALITY CARE (WA)' : 'Kirim Notifikasi WA';

    // PERBAIKAN: Menambahkan data-attribute lengkap agar tidak error saat dibaca
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
            <div><h3 class="font-black text-indigo-900 uppercase text-lg leading-tight blink-name">${item.nama}${pB}</h3></div>
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
            ${cH}
        </div>
        <div class="flex gap-2">
            ${bB}${sPB}
            <button onclick="prosesWa('${item.hp}', '${item.idCst}', '${item.nama}', '${item.japo}', '${item.paket}', '${mode}')" class="${(bB || sPB) ? 'flex-1' : 'w-full'} ${waC} text-white font-black py-3 rounded-xl text-[10px] shadow-lg transition-all active:scale-95 uppercase">${waL}</button>
        </div>
    </div>`;
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
    const val = dI.value.trim();
    if (val.length > 2 && /^\d+$/.test(val)) { uI.value = val; dI.value = ""; uI.focus(); }
    cariData('search'); 
}

async function cariData(mode, btnEl) {
    if(btnEl) triggerAnimate(btnEl); 
    if (['progress','pending','fast','qc'].includes(mode)) {
        document.getElementById('userInput').value = ""; document.getElementById('dateInput').value = "";
        const oT = btnEl ? btnEl.innerText : ""; if (btnEl) btnEl.innerText = "⏳...";
        await muatDataTabel(); if (btnEl) btnEl.innerText = oT;
    }

    const query = document.getElementById('userInput').value.toLowerCase().trim();
    const tF = document.getElementById('dateInput').value;
    const list = document.getElementById('resultsList');
    const sI = document.getElementById('searchInfo');
    const sCE = document.getElementById('searchResultCount');
    
    if (mode === 'search' && query === "" && tF === "") { list.innerHTML = ""; sI.classList.add('hidden'); return; }
    
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
    } 
    else if (mode === 'qc') {
        const now = new Date(); const tD = now.getDate();
        items = items.filter(i => {
            const cmd = String(i.command || "").toLowerCase();
            if (cmd.includes('pending') || cmd.includes('progress') || isAuditOFF(i)) return false;
            const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
            const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
            const diff = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
            const iD = (p[0].length === 4) ? parseInt(p[2]) : parseInt(p[0]);
            let cD = iD - 7; if (cD <= 0) cD = 30 + cD;
            return diff >= 20 && (tD === cD);
        });
    }
    else {
        if (query) items = items.filter(i => i.nama.toLowerCase().includes(query) || i.idCst.toString().toLowerCase().includes(query) || (i.alamat && i.alamat.toLowerCase().includes(query)));
        if (tF && !isNaN(tF)) { 
            items = items.filter(i => {
                const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
                const day = (p[0].length === 4) ? parseInt(p[2]) : parseInt(p[0]);
                return day == parseInt(tF);
            }); 
        }
    }

    sCE.innerText = items.length; sI.classList.remove('hidden');

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
    
    list.innerHTML = html || `<p class='text-white text-center font-bold bg-white/10 p-4 rounded-xl'>Data tidak ditemukan.</p>`;
}

function renderRekapUI(d) {
    const sa = parseInt(d.totalSA) || 0; const bL = parseInt(d.pointKurang) || 0;
    document.getElementById('t-sa').innerText = sa;
    document.getElementById('t-off').innerText = d.totalOff || 0;
    document.getElementById('t-aktif').innerText = d.pelangganAktif || 0;
    document.getElementById('t-baru').innerText = d.totalIdBaru || 0;
    document.getElementById('t-point').innerText = (bL - sa > 0) ? bL - sa : 0;
    document.getElementById('t-kurang').innerText = bL; 
    document.getElementById('t-bonus').innerText = d.totalBonus || 'Rp0';
    let pc = bL > 0 ? (sa / bL) * 100 : 0;
    document.getElementById('targetProgressBar').style.width = Math.min(100, Math.round(pc)) + '%';
    document.getElementById('targetPercentText').innerText = Math.round(pc) + '%';
}

function hitungBonusDekade() {
    const q = document.querySelector('input[name="quarter"]:checked');
    if(!q) return alert("Pilih Quarter!");
    const mN = ["", "JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];
    let months = (q.value === 'q1') ? [1,2,3] : (q.value === 'q2') ? [4,5,6] : (q.value === 'q3') ? [7,8,9] : [10,11,12];
    let statsT = { 'RingEco': 0, 'Jet': 0, 'ValueLite': 0, 'ValueUp': 0 };
    let mD = {}; months.forEach(m => { mD[m] = { 'RingEco': 0, 'Jet': 0, 'ValueLite': 0, 'ValueUp': 0, total: 0, insentif: 0 }; });
    fullRawData.forEach(item => {
        if(!item.tanggal) return;
        const cmd = String(item.command || "").toLowerCase();
        if(cmd.includes("pending") || cmd.includes("progress")) return; 
        const m = parseInt(item.tanggal.split(item.tanggal.includes('/') ? '/' : '-')[1]);
        if(months.includes(m)) {
            const pkt = (item.paket || "").toLowerCase();
            let cat = 'ValueUp';
            if(pkt === '10ring' || pkt === 'eco15' || pkt === 'eco20') cat = 'RingEco';
            else if(pkt === 'jet20') cat = 'Jet';
            else if(pkt === '30valuelite') cat = 'ValueLite';
            statsT[cat]++; mD[m][cat]++; mD[m].total++;
            mD[m].insentif += parseInt(String(item.bonus || "0").replace(/\D/g, "")) || 0;
        }
    });
    const tSQ = Object.values(statsT).reduce((a,b) => a+b, 0);
    let br = tSQ >= 75 ? "75" : tSQ >= 60 ? "60" : tSQ >= 45 ? "45" : "0";
    let mBH = ""; let tDB = 0; let tFBQ = 0;
    months.forEach((m, i) => {
        let eBFB = 0; if(br !== "0") for(let c in SKEMA_DEKADE) eBFB += (mD[m][c] || 0) * SKEMA_DEKADE[c].prices[br];
        tFBQ += eBFB; let d = (i < 2) ? eBFB * 0.5 : 0; tDB += d;
        mBH += `<tr class="border-b"><td class="p-2 border text-black font-black">${mN[m]}</td><td class="p-2 border">${mD[m].total}</td><td class="p-2 border text-green-700">Rp${mD[m].insentif.toLocaleString()}</td><td class="p-2 border text-slate-400">Rp${eBFB.toLocaleString()}</td><td class="p-2 border text-indigo-600">Rp${d.toLocaleString()}</td></tr>`;
    });
    document.getElementById('dk-monthly-bonus-body').innerHTML = mBH;
    let tH = ""; for(const c in statsT) tH += `<tr><td class="text-left font-bold border-r p-2">${c}</td><td class="font-black p-2">${statsT[c]}</td><td class="text-green-600 font-black p-2">@Rp${(br !== "0" ? SKEMA_DEKADE[c].prices[br] : 0).toLocaleString()}</td></tr>`;
    document.getElementById('dk-total-sa').innerText = tSQ;
    document.getElementById('dk-total-rp').innerText = `Rp${Math.max(0, tFBQ - tDB).toLocaleString()}`;
    document.getElementById('dk-table-body').innerHTML = tH;
    document.getElementById('hasilBonusDekade').classList.remove('hidden');
}

function resetQuarterFilter() { document.querySelectorAll('input[name="quarter"]').forEach(r => r.checked = false); document.getElementById('hasilBonusDekade').classList.add('hidden'); }
function handleBillingClick(id) { openModal({ title: '⚠️ VERIFIKASI', headerClass: 'bg-red-600', body: `<p>ID: ${cleanId(id)}</p>`, subtext: 'PELANGGAN SUDAH BAYAR?', buttons: [{ text: 'BATAL', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs', action: () => {} }, { text: 'YA, SUDAH', class: 'bg-red-600 text-white py-3 rounded-xl font-black text-xs', action: () => executeBilling(id) }] }); }

function executeBilling(id) {
    const el = document.getElementById(`card-${id}`); if(el) el.style.display = 'none';
    lastDeletedId = id; if(!hiddenBillingIds.includes(id)) hiddenBillingIds.push(id);
    localStorage.setItem('hiddenBillingIds', JSON.stringify(hiddenBillingIds));
    document.getElementById('undoToast').style.display = 'flex';
    setTimeout(() => document.getElementById('undoToast').style.display = 'none', 5000);
    updateFastAndProgressCounts();
}

function undoBilling() {
    if(lastDeletedId) {
        const el = document.getElementById(`card-${lastDeletedId}`); if(el) el.style.display = 'block';
        hiddenBillingIds = hiddenBillingIds.filter(i => i !== lastDeletedId);
        localStorage.setItem('hiddenBillingIds', JSON.stringify(hiddenBillingIds));
        document.getElementById('undoToast').style.display = 'none';
        updateFastAndProgressCounts();
    }
}

function resetBillingFilter() { 
    openModal({ title: '⚠️ RESET', headerClass: 'bg-red-600', body: `<p>Refresh daftar Fast Payment?</p>`, subtext: 'SEMUA HIDDEN DATA AKAN MUNCUL', buttons: [{ text: 'BATAL', class: 'bg-slate-100 py-3 rounded-xl font-black text-xs', action: () => {} }, { text: 'YA, RESET', class: 'bg-red-600 text-white py-3 rounded-xl font-black text-xs', action: () => { hiddenBillingIds = []; localStorage.setItem('hiddenBillingIds', "[]"); cariData('fast'); }}] });
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
    document.querySelector('.scrollable-content').scrollTo(0,0);
}

function pressPin(n) { let p = document.getElementById('pinInput'); if(p.value.length < 4) p.value += n; }
function clearPin() { document.getElementById('pinInput').value = ""; }

async function checkPin() {
    let pin = document.getElementById('pinInput').value; if(pin.length < 4) return;
    const btn = document.getElementById('btnEnter'); btn.innerHTML = "⏳";
    try {
        const r = await fetch(`${scriptURL}?action=validatePin&pin=${pin}`);
        const res = await r.json();
        if(res.status === "authorized") { 
            document.getElementById('lockScreen').style.display = 'none'; 
            sessionStorage.setItem('isLoggedIn', 'true'); 
            resetInactivityTimer(); loadDraft(); loadLeadsDraft(); muatDataTabel(); 
        } else { alert("PIN SALAH"); clearPin(); }
    } catch(e) { alert("Error"); } finally { btn.innerHTML = "OK"; }
}

function handleCopyClick(id) {
    const iT = cleanId(id); navigator.clipboard.writeText(iT);
    openModal({ title: '📋 SALIN', headerClass: 'bg-indigo-600', body: `<p class="text-2xl font-black">${iT}</p>`, subtext: 'ID DISALIN', buttons: [{ text: 'OK', class: 'bg-indigo-600 text-white py-3 rounded-xl font-black text-xs w-full col-span-2', action: () => {} }] });
}

async function downloadImage(nama, id, paket, alamat, tgl, japo, hp, email) {
    // 1. Masukkan Data ke Template HTML
    document.getElementById('c-nama').innerText = (nama || 'PELANGGAN').toUpperCase();
    document.getElementById('c-id-bayar').innerText = cleanId(id);
    document.getElementById('c-paket').innerText = paket || '-';
    
    // Validasi HP (Agar tidak error saat formatting)
    let cleanHp = hp;
    if (!cleanHp || cleanHp === 'undefined' || cleanHp === '0' || cleanHp === 0) cleanHp = '-';
    else cleanHp = formatBeautifulNumber(cleanHp); 
    document.getElementById('c-hp').innerText = cleanHp;

    // Validasi Email
    let cleanEmail = email;
    if (!cleanEmail || cleanEmail === 'undefined') cleanEmail = '-';
    document.getElementById('c-email').innerText = cleanEmail.toLowerCase();
    
    document.getElementById('c-alamat').innerText = (alamat || '-').toUpperCase();
    document.getElementById('c-tgl').innerText = tgl || '-';
    document.getElementById('c-japo').innerText = japo || '-';

    // 2. Generate Gambar
    try {
        const el = document.getElementById('canvasTemplate');
        
        // Pastikan elemen terlihat oleh html2canvas (display flex)
        el.style.display = 'flex'; 
        
        const can = await html2canvas(el, { 
            scale: 2, 
            useCORS: true, 
            // allowTaint: true, <--- BARIS INI WAJIB DIHAPUS (Penyebab utama tidak bisa download)
            logging: false,
            backgroundColor: null 
        });
        
        const lnk = document.createElement('a');
        lnk.download = `TAGIHAN_${cleanId(id)}.png`;
        lnk.href = can.toDataURL("image/png");
        document.body.appendChild(lnk);
        lnk.click();
        document.body.removeChild(lnk);
        
        return true;
    } catch (err) {
        console.error("Gagal generate gambar:", err);
        // Tetap return true agar WA tetap terbuka meski gambar gagal
        return true;
    }
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
            { text: tB, class: hC + ' text-white py-3 rounded-xl font-black text-[10px] uppercase', action: () => executeWaAction(hp, id, nama, japo, paket, alamat, tgl, email, harga, true, source, isP) }
        ]
    });
}

async function executeWaAction(hp, id, nama, japo, paket, alamat, tgl, email, harga, withText, source, isPending) {
    // 1. SIAPKAN NOMOR & URL WA LEBIH DULU (Agar tidak gagal di tengah jalan)
    let cH = getPureWaNumber(hp);
    const now = new Date();
    const hr = now.getHours();
    let slm = (hr < 11) ? "Pagi" : (hr < 15) ? "Siang" : (hr < 18) ? "Sore" : "Malam";
    
    // Feedback visual bahwa sistem sedang bekerja (opsional)
    const btn = document.activeElement;
    if(btn && btn.tagName === 'BUTTON') btn.innerText = "⏳ MEMPROSES...";

    try {
        let txt = "";
        
        // --- LOGIKA PENYUSUNAN PESAN ---
        if (withText) {
            // Gunakan \n untuk baris baru, bukan %0A, karena kita akan pakai encodeURIComponent
            if (isPending) {
                txt = `Selamat ${slm} Yth. Bpk/Ibu *${nama.trim()}*,\n\nSaya dari *Dwi LS. MyRepublic Indonesia* ingin menindaklanjuti rencana pemasangan internet di alamat Bapak/Ibu.\n\nKami sedang ada *Promo Spesial* khusus untuk area Anda dan gratis biaya instalasi jika registrasi dilanjutkan hari ini.\n\nSaya akan melakukan kunjungan ke lokasi hari ini, apabila Bapak/Ibu berkenan untuk dipasang atau ingin konsultasi paket lebih lanjut bisa kabari saya ya. Terima kasih!`;
            } else if (source === 'qc') {
                txt = `Selamat ${slm} Yth. Bpk/Ibu *${nama.trim()}*,\nSaya Dwi MyRepublic, menanyakan kualitas internet di *${alamat}* apakah lancar? Terima kasih!`;
            } else {
                // Pesan Tagihan Normal
                const day = now.getDate(); 
                let sel = day - parseInt(japo);
                if (isNaN(sel)) sel = 0;

                const detailInfo = `\n📍 Alamat: ${alamat}\n🚀 Paket: ${paket}\n💰 Tagihan: ${harga}\n📅 Jatuh Tempo: Tgl ${japo}`;

                if (sel >= -5 && sel <= 0) {
                    txt = `Selamat ${slm} Yth. Bpk/Ibu *${nama.trim()}*,\n\nIzin menginfokan tagihan internet MyRepublic:${detailInfo}\n\nMohon kesediaannya meluangkan waktu untuk pembayaran agar layanan tetap aktif dan lancar. Terima kasih 🙏`;
                } else if (sel > 0 && sel <= 7) {
                    txt = `Selamat ${slm} Yth. Bpk/Ibu *${nama.trim()}*,\n\nIzin menginfokan tagihan internet MyRepublic sudah melewati tanggal jatuh tempo:${detailInfo}\n\nMohon bantuannya untuk segera dibayarkan agar internet tidak terisolir otomatis. Terima kasih 🙏`;
                } else {
                    txt = `Selamat ${slm} Yth. Bpk/Ibu *${nama.trim()}*,\n\nMenanyakan kualitas layanan internet MyRepublic di:\n📍 ${alamat}\n\nApakah koneksinya lancar aman? Terima kasih sehat selalu 🙏`;
                }
            }
        }

        // KUNCI PERBAIKAN: Encode URL agar aman dibaca browser & hapus karakter aneh
        const finalUrl = `https://api.whatsapp.com/send?phone=${cH}&text=${encodeURIComponent(txt)}`;
        
        // --- UPDATE STATUS PROGRESS (BACKGROUND) ---
        const card = document.getElementById(`card-${id}`);
        const isProgress = card?.getAttribute('data-command').toLowerCase().includes('on progress');
        if (isProgress) {
            fetch(`${scriptURL}?action=hapusHanyaTextProgress&idCst=${id}`).catch(err => console.log("Gagal update progress"));
        }

        // --- PROSES GAMBAR DENGAN PENGAMAN (TRY-CATCH & TIMEOUT) ---
        // Kita gunakan mekanisme "Balapan" (Race). Jika gambar jadi dalam 3 detik, oke.
        // Jika lebih dari 3 detik (misal HP lemot/error), langsung paksa buka WA agar tidak macet.
        if (withText && source !== 'qc') {
            try {
                const imagePromise = downloadImage(nama, id, paket, alamat, tgl, japo, hp, email);
                // Batas waktu tunggu gambar hanya 2.5 detik
                const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2500));
                
                await Promise.race([imagePromise, timeoutPromise]);
            } catch (imgError) {
                console.error("Gagal generate gambar, melanjutkan ke WA tanpa gambar...", imgError);
            }
        }

        // 2. EKSEKUSI PENGALIHAN KE WHATSAPP
        // Langsung eksekusi tanpa setTimeout tambahan agar tidak diblokir browser
        window.location.href = finalUrl;

    } catch (err) {
        alert("Terjadi kesalahan sistem: " + err.message);
        // Fallback darurat: buka WA polosan jika script crash
        window.location.href = `https://api.whatsapp.com/send?phone=${cH}`;
    }
}



async function updateFastAndProgressCounts() {
    if(!fullRawData) return;
    const pC = fullRawData.filter(i => (i.command || "").toLowerCase().includes('on progress') && !isAuditOFF(i)).length;
    document.getElementById('totalProgressCount').innerText = pC; 
    const peC = fullRawData.filter(i => (i.command || "").toLowerCase().includes('pending') && !isAuditOFF(i)).length;
    document.getElementById('totalPendingCount').innerText = peC;
    const now = new Date(); const tD = now.getDate();
    const fI = fullRawData.filter(i => {
        const cmd = String(i.command || "").toLowerCase(); if (cmd.includes('pending') || cmd.includes('progress') || isAuditOFF(i)) return false;
        const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
        const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
        return Math.ceil(Math.abs(new Date() - d) / (1000 * 60 * 60 * 24)) <= 10;
    });
    document.getElementById('totalFastCount').innerText = fI.filter(i => !hiddenBillingIds.includes(i.idCst)).length;
    const qI = fullRawData.filter(i => {
        const cmd = String(i.command || "").toLowerCase(); if (cmd.includes('pending') || cmd.includes('progress') || isAuditOFF(i)) return false;
        const p = i.tanggal.includes('/') ? i.tanggal.split('/') : i.tanggal.split('-');
        const d = (p[0].length === 4) ? new Date(p[0], p[1]-1, p[2]) : new Date(p[2], p[1]-1, p[0]);
        const diff = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
        const iD = (p[0].length === 4) ? parseInt(p[2]) : parseInt(p[0]);
        let cD = iD - 7; if (cD <= 0) cD = 30 + cD;
        return diff >= 20 && (tD === cD);
    });
    document.getElementById('totalQcCount').innerText = qI.length;
}

function triggerAnimate(el) { el.classList.remove('animate-click'); void el.offsetWidth; el.classList.add('animate-click'); }

document.querySelectorAll('.force-caps').forEach(el => { el.addEventListener('input', function() { this.value = this.value.toUpperCase(); }); });

document.getElementById('rekapanForm').addEventListener('submit', async e => {
    e.preventDefault(); const btn = document.getElementById('btnKirim'); btn.disabled = true; btn.innerText = "🚀 MENYIMPAN...";
    const rFD = new FormData(e.target); rFD.set('hp', formatWaMeLink(rFD.get('hp'))); 
    let sCB = document.getElementById('onProgress').checked ? "ON PROGRESS" : (document.getElementById('pending').checked ? "PENDING" : "");
    rFD.set('command', document.getElementById('inputManual').value.toUpperCase());          
    rFD.set('nama', rFD.get('nama').toUpperCase()); rFD.set('alamat', rFD.get('alamat').toUpperCase());
    rFD.set('command_billing', sCB); 
    try {
        const r = await fetch(scriptURL, { method: 'POST', body: rFD });
        if((await r.text()) === "Success") { alert("Berhasil!"); e.target.reset(); clearDraft(); muatDataTabel(); } 
    } catch(e) { alert("Error"); } finally { btn.disabled = false; btn.innerText = "Simpan Data"; }
});

function getGeoLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            document.getElementById('inputKoordinat').value = lat + ", " + lon;
            await reverseGeocode(lat, lon);
            saveLeadsDraft();
        }, () => { alert("Gagal mengambil lokasi. Pastikan GPS aktif."); });
    }
}

async function reverseGeocode(lat, lon) {
    const alamatField = document.getElementsByName('leads_alamat')[0];
    alamatField.placeholder = "⏳ Mengekstrak alamat...";
    try {
        const response = await fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + lat + "&lon=" + lon);
        const data = await response.json();
        if (data && data.display_name) { 
            let cleanAlamat = data.display_name.toUpperCase();
            // Hapus kata ", JAWA," yang muncul sebelum kode pos
            cleanAlamat = cleanAlamat.replace(", JAWA,", ","); 
            alamatField.value = cleanAlamat;
        }
    } catch (err) { console.error("Geocoding Error"); }
}

document.getElementById('leadsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnKirimLeads');
    btn.disabled = true;
    btn.innerText = "🚀 MENGIRIM...";
    const formData = new FormData(e.target);
    let rawHp = formData.get('leads_hp').replace(/\D/g, "");
    if (rawHp.startsWith("0")) rawHp = "62" + rawHp.slice(1);
    else if (rawHp.startsWith("8")) rawHp = "62" + rawHp;
    formData.set('leads_hp', rawHp);

    try {
        const response = await fetch(leadsScriptURL, { method: 'POST', body: formData });
        const result = await response.text();
        if (result === "Success") {
            alert("Berhasil! Data Prospek telah tersimpan.");
            localStorage.removeItem('leadsDraft');
            e.target.reset();
            const d2d_hidden = document.getElementById('leads_tgl_d2d_hidden');
            if(d2d_hidden) d2d_hidden.value = new Date().toISOString().split('T')[0];
            cekJanjiTemuLeads();
        } else { alert("Gagal menyimpan: " + result); }
    } catch (err) { alert("Kesalahan koneksi."); }
    finally { btn.disabled = false; btn.innerText = "Simpan Prospek"; }
});

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
    data.forEach(item => {
        const now = new Date();
        const hr = now.getHours();
        let slm = (hr < 11) ? "Pagi" : (hr < 15) ? "Siang" : (hr < 18) ? "Sore" : "Malam";
        const namaPel = item.nama || 'Bapak/Ibu';
        
        // Pesan WA Lead Prospek yang disesuaikan
        const pesanProspek = `Halo Selamat ${slm} Yth. Bpk/Ibu *${namaPel.trim()}*,%0A%0ASaya dari *MyRepublic Indonesia* ingin menindaklanjuti rencana pemasangan internet di alamat ${item.alamat || '-'} (${item.koordinat || '-'}) %0A%0AKami sedang ada *Promo Spesial* khusus untuk area Anda berupa potongan biaya langganan dan gratis biaya instalasi jika registrasi dilanjutkan hari ini.%0A%0ASaya akan melakukan kunjungan ke lokasi hari ini, apabila Bapak/Ibu berkenan untuk dipasang atau ingin konsultasi paket lebih lanjut bisa kabari saya ya. Terima kasih!`;
        
        const linkWA = "https://api.whatsapp.com/send?phone=" + item.hp + "&text=" + pesanProspek;
        const linkMaps = item.koordinat ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(item.koordinat) : "#";

        // --- TAMBAHAN BARU: LINK & PESAN KHUSUS "SAYA DWI" ---
        const pesanIntro = `Halo Selamat ${slm} Yth. Bpk/Ibu *${namaPel.trim()}*,\n\nAlamat: ${item.alamat || '-'} (${item.koordinat || '-'}) \n\nPerkenalkan saya *DWI LS.* tim pemasangan *WiFi MyRepublic.*\n\nSimpan nomor saya, untuk kebutuhan kedepan apabila membutuhkan pemasangan WiFi. Terima kasih!`;
        const linkWaIntro = "https://api.whatsapp.com/send?phone=" + item.hp + "&text=" + encodeURIComponent(pesanIntro);

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
                <button onclick="window.open('${linkWA}')" class="flex-1 bg-green-500 hover:bg-green-600 text-white text-[9px] font-black py-2.5 rounded-lg uppercase flex items-center justify-center gap-1">💬 Follow Up</button>
                
                <button onclick="window.open('${linkWaIntro}')" class="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-[9px] font-black py-2.5 rounded-lg uppercase flex items-center justify-center gap-1 shadow-md transition-all">👋 SAYA DWI</button>
                
                <button onclick="window.open('${linkMaps}')" class="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-black py-2.5 rounded-lg uppercase">📍 Lokasi</button>
            </div>`;
        cardsContainer.appendChild(card);
    });
}

function tutupDaftar() { 
    const el = document.getElementById('leadsList');
    if(el) el.classList.add('hidden'); 
}

// --- AUTO EXTRACT ADDRESS FROM MANUAL COORDINATE INPUT ---
const manualInputCoord = document.getElementById('inputKoordinat');

if (manualInputCoord) {
    manualInputCoord.addEventListener('change', function() {
        const val = this.value;
        
        // Regex diperbarui:
        // 1. (-?)     : Mendeteksi minus di depan (opsional)
        // 2. \d+      : Mendeteksi angka depan
        // 3. [.,]     : Mendeteksi TITIK atau KOMA sebagai desimal
        // 4. \d+      : Mendeteksi angka belakang
        // Flag 'g' untuk mencari semua angka yang cocok dalam string
        const matches = val.match(/(-?\d+(?:[.,]\d+)?)/g);

        if (matches && matches.length >= 2) {
            // Ambil hasil match pertama (Lat) dan kedua (Long)
            let rawLat = matches[0];
            let rawLon = matches[1];

            // PENTING: Ganti koma menjadi titik agar dikenali sistem komputer
            // Contoh: "-7,35" menjadi "-7.35"
            // Contoh: "-7.35" tetap "-7.35"
            let lat = parseFloat(rawLat.replace(',', '.'));
            let lon = parseFloat(rawLon.replace(',', '.'));

            // Validasi jangkauan koordinat global
            if (!isNaN(lat) && !isNaN(lon)) {
                if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    
                    // Update tampilan input agar seragam menjadi format titik (opsional, agar rapi)
                    this.value = `${lat}, ${lon}`;

                    // Panggil fungsi reverseGeocode yang sudah ada
                    reverseGeocode(lat, lon);
                }
            }
        }
    });
}
