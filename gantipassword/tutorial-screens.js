(function () {
    "use strict";

    const NS = "http://www.w3.org/2000/svg";

    function el(tag, attrs = {}, text = "") {
        const n = document.createElementNS(NS, tag);

        Object.entries(attrs).forEach(([k, v]) => {
            n.setAttribute(k, v);
        });

        if (text) n.textContent = text;

        return n;
    }

    function text(parent, x, y, value, size = 14, weight = "400", fill = "#444") {
        parent.appendChild(el("text", {
            x,
            y,
            "font-size": size,
            "font-family": "Arial, Helvetica, sans-serif",
            "font-weight": weight,
            fill
        }, value));
    }

    function rect(parent, x, y, w, h, fill = "#fff", stroke = "#ddd", sw = 1, rx = 0) {
        parent.appendChild(el("rect", {
            x, y, width: w, height: h,
            fill, stroke, "stroke-width": sw, rx
        }));
    }

    function line(parent, x1, y1, x2, y2, stroke = "#ddd", sw = 1) {
        parent.appendChild(el("line", {
            x1, y1, x2, y2,
            stroke,
            "stroke-width": sw
        }));
    }

    function redBox(parent, x, y, w, h) {
        parent.appendChild(el("rect", {
            x, y,
            width: w,
            height: h,
            fill: "none",
            stroke: "#ff0000",
            "stroke-width": 7
        }));
    }

    function radio(parent, x, y, active) {
        parent.appendChild(el("circle", {
            cx: x,
            cy: y,
            r: 9,
            fill: "#fff",
            stroke: active ? "#1999d0" : "#aaa",
            "stroke-width": 2
        }));

        if (active) {
            parent.appendChild(el("circle", {
                cx: x,
                cy: y,
                r: 5,
                fill: "#1999d0"
            }));
        }
    }

    function browserBar(svg, url) {
        rect(svg, 0, 0, 900, 82, "#f7f7f7", "#ddd");

        text(svg, 28, 50, "‹", 42, "400", "#111");
        text(svg, 72, 50, "⚠", 25, "400", "#222");

        rect(svg, 112, 17, 455, 50, "#eee", "#eee", 0, 28);
        text(svg, 175, 51, url, 22, "400", "#222");

        text(svg, 604, 54, "+", 40, "300", "#111");
        text(svg, 716, 53, "□", 29, "400", "#111");
        text(svg, 825, 52, "⋮", 30, "700", "#111");
    }

    function makeSvg(width, height) {
        const svg = el("svg", {
            viewBox: `0 0 ${width} ${height}`,
            width: "100%",
            role: "img",
            "aria-label": "Ilustrasi konfigurasi router ZTE F670L"
        });

        svg.style.display = "block";
        svg.style.width = "100%";
        svg.style.height = "auto";

        return svg;
    }


    /* =====================================================
       SCREEN 2
       ZTE HOME / WLAN SETTING
       ===================================================== */

    function screen2() {
        const svg = makeSvg(900, 766);

        browserBar(svg, "192.168.1.1");

        rect(svg, 0, 82, 900, 684, "#fff", "#ddd");

        text(svg, 38, 112,
            "This page provides the function of WLAN basic parameter(s) configuration.",
            13, "400", "#444"
        );

        text(svg, 38, 153, "▼", 18, "700", "#333");
        text(svg, 70, 153, "WLAN On/Off Configuration", 20, "600", "#333");

        line(svg, 28, 166, 870, 166, "#ddd");

        text(svg, 60, 204, "Mode", 15);
        radio(svg, 250, 199, true);
        text(svg, 270, 205, "Manual", 15);
        radio(svg, 350, 199, false);
        text(svg, 370, 205, "Scheduled Power On", 15);

        text(svg, 60, 244, "WLAN (2.4GHz)", 15);
        radio(svg, 250, 239, true);
        text(svg, 270, 245, "On", 15);
        radio(svg, 315, 239, false);
        text(svg, 335, 245, "Off", 15);

        text(svg, 60, 284, "WLAN (5GHz)", 15);
        radio(svg, 250, 279, true);
        text(svg, 270, 285, "On", 15);
        radio(svg, 315, 279, false);
        text(svg, 335, 285, "Off", 15);

        rect(svg, 638, 325, 120, 45, "#21a9d7", "#1594bd", 1, 3);
        text(svg, 680, 354, "Apply", 15, "600", "#fff");

        rect(svg, 778, 325, 120, 45, "#21a9d7", "#1594bd", 1, 3);
        text(svg, 812, 354, "Cancel", 15, "600", "#fff");

        line(svg, 28, 390, 870, 390, "#ddd");

        text(svg, 38, 420, "▶", 15, "700", "#333");
        text(svg, 70, 420, "WLAN Global Configuration", 20, "500", "#333");

        line(svg, 28, 436, 870, 436, "#ddd");

        text(svg, 38, 477, "▼", 18, "700", "#333");
        text(svg, 70, 477, "WLAN SSID Configuration", 20, "500", "#333");

        redBox(svg, 24, 447, 285, 58);

        return svg;
    }


    /* =====================================================
       SCREEN 3
       WLAN SSID CONFIGURATION
       ===================================================== */

    function screen3() {
        const svg = makeSvg(900, 630);

        browserBar(svg, "192.168.1.1");

        rect(svg, 0, 82, 900, 548, "#fff", "#ddd");

        text(svg, 35, 117, "ZTE", 48, "700", "#159dcc");
        text(svg, 150, 116, "Current Time: 1970-01-01T00:21", 9, "400", "#777");

        rect(svg, 25, 130, 850, 31, "#222", "#222", 0, 3);

        const menu = [
            "Home",
            "Topology",
            "Internet",
            "Local Network",
            "VoIP",
            "Management & Diagnosis"
        ];

        menu.forEach((m, i) => {
            text(svg, 55 + i * 137, 151, m, 9, "600", "#fff");
        });

        rect(svg, 30, 185, 205, 150, "#fafafa", "#ddd", 1, 3);

        text(svg, 52, 218, "🌐", 30);
        text(svg, 96, 217, "WAN Setting", 13, "600", "#49a8bd");

        rect(svg, 270, 190, 580, 400, "#fff", "#ddd", 1, 3);

        text(svg, 292, 220, "Device List", 13, "600", "#555");
        text(svg, 292, 250, "WLAN Device List", 15, "600", "#444");

        line(svg, 290, 265, 830, 265, "#ddd");

        text(svg, 300, 290, "Name", 12, "600");
        text(svg, 420, 290, "MAC Address", 12, "600");
        text(svg, 560, 290, "IPv4 Address", 12, "600");
        text(svg, 700, 290, "IPv6 Address", 12, "600");

        text(svg, 300, 325, "WLAN Devices", 12, "400", "#4da9ba");
        text(svg, 420, 325, "96:56:f3:8a:02:6e", 10);
        text(svg, 560, 325, "192.168.1.3", 10);

        rect(svg, 744, 185, 110, 45, "#fff", "#fff");
        text(svg, 762, 213, "WLAN Setting", 12, "600", "#4da9ba");

        redBox(svg, 738, 179, 124, 58);

        return svg;
    }


    /* =====================================================
       SCREEN 4
       SSID 2.4GHz + 5GHz
       ===================================================== */

    function ssidPanel(svg, x, y, title, name, password, highlightY) {

        text(svg, x + 5, y + 20, "▼", 13, "700", "#169aca");
        text(svg, x + 30, y + 20, title, 14, "600", "#333");

        line(svg, x, y + 30, x + 390, y + 30, "#ddd");

        text(svg, x + 20, y + 63, "SSID Name", 12);
        rect(svg, x + 120, y + 45, 230, 28, "#fff", "#ccc", 1, 2);
        text(svg, x + 130, y + 64, name, 11);

        text(svg, x + 20, y + 95, "SSID Hide", 12);
        radio(svg, x + 130, y + 91, false);
        text(svg, x + 145, y + 96, "On", 11);
        radio(svg, x + 190, y + 91, true);
        text(svg, x + 205, y + 96, "Off", 11);

        text(svg, x + 20, y + 127, "Encryption Type", 12);
        rect(svg, x + 120, y + 109, 230, 28, "#fff", "#ccc", 1, 2);
        text(svg, x + 130, y + 128, "WPA2-PSK-AES", 11);

        text(svg, x + 20, y + 159, "WPA Passphrase", 12);
        rect(svg, x + 120, y + 141, 230, 28, "#fff", "#ccc", 1, 2);
        text(svg, x + 130, y + 160, password, 11);

        text(svg, x + 20, y + 191, "SSID Isolation", 12);
        radio(svg, x + 130, y + 187, false);
        text(svg, x + 145, y + 192, "On", 11);
        radio(svg, x + 190, y + 187, true);
        text(svg, x + 205, y + 192, "Off", 11);

        text(svg, x + 20, y + 223, "Maximum Clients", 12);
        rect(svg, x + 120, y + 205, 230, 28, "#fff", "#ccc", 1, 2);
        text(svg, x + 130, y + 224, "32", 11);

        rect(svg, x + 210, y + 252, 105, 35, "#22a9d7", "#1594bd", 1, 3);
        text(svg, x + 246, y + 275, "Apply", 12, "600", "#fff");

        if (highlightY !== undefined) {
            redBox(svg, x + 198, y + highlightY, 125, 55);
        }
    }

    function screen4() {
        const svg = makeSvg(900, 720);

        text(svg, 30, 32, "▼", 18, "700", "#333");
        text(svg, 60, 32, "WLAN SSID Configuration", 20, "600", "#333");

        line(svg, 25, 48, 875, 48, "#ddd");

        ssidPanel(
            svg,
            35,
            65,
            "SSID1 (2.4GHz)",
            "WiFi",
            "••••••••••••••",
            230
        );

        ssidPanel(
            svg,
            35,
            390,
            "SSID5 (5GHz)",
            "WIFI_5G",
            "••••••••••••••",
            230
        );

        return svg;
    }


    /* =====================================================
       SCREEN 5
       SIMPAN / APPLY
       Khusus Langkah 05
       ===================================================== */

    
    
    function screen5() {

        /*
         * ======================================================
         * LANGKAH 05
         *
         * SUMBER VISUAL = LANGKAH 04 ASLI
         *
         * Tidak membuat SVG baru.
         * Tidak menggambar ulang SSID.
         * Tidak membuat form baru.
         *
         * Dua .router-simulation asli Langkah 04 di-clone
         * kemudian Apply diberi highlight merah.
         * ======================================================
         */

        const result = document.createElement("div");

        result.className = "step5-real-router-copy";

        /*
         * Cari step-card yang benar-benar mempunyai
         * dua router-simulation langsung.
         */
        const sourceCard = Array.from(
            document.querySelectorAll(".step-card")
        ).find(card => {

            const panels = card.querySelectorAll(
                ":scope > .router-simulation"
            );

            return panels.length === 2;
        });

        if (!sourceCard) {
            console.error(
                "[STEP5] Sumber Langkah 04 tidak ditemukan."
            );

            return result;
        }

        /*
         * Ambil hanya dua panel asli Langkah 04.
         */
        const sourcePanels = sourceCard.querySelectorAll(
            ":scope > .router-simulation"
        );

        sourcePanels.forEach((sourcePanel, index) => {

            const clone = sourcePanel.cloneNode(true);

            clone.classList.add(
                "step5-real-router-panel"
            );

            clone.dataset.step5Clone = String(index + 1);

            /*
             * Cari tombol Apply pada clone.
             *
             * Tidak mengubah tombol asli Langkah 04.
             */
            clone.querySelectorAll(
                "button, input[type='button'], input[type='submit']"
            ).forEach(button => {

                const label = (
                    button.textContent ||
                    button.value ||
                    ""
                ).trim().toLowerCase();

                if (label === "apply") {

                    button.classList.add(
                        "step5-apply-highlight"
                    );
                }
            });

            result.appendChild(clone);
        });

        return result;
    }





    function renderTutorialScreens() {

        document.querySelectorAll(
            '[data-router-screen="2"],' +
            '[data-router-screen="3"],' +
            '[data-router-screen="4"],' +
            '[data-router-screen="5"]'
        ).forEach(container => {

            const type = container.dataset.routerScreen;

            container.innerHTML = "";

            if (type === "2") {
                container.appendChild(screen2());
            }

            if (type === "3") {
                container.appendChild(screen3());
            }

            if (type === "4") {
                container.appendChild(screen4());
            }

            if (type === "5") {
                container.appendChild(screen5());
            }

        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderTutorialScreens);
    } else {
        renderTutorialScreens();
    }

})();
