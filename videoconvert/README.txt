VIDEO CONVERTER RESIZE 50% - INSTALL

1. Upload dan extract semua isi ZIP ke public_html.
2. Buka https://DOMAIN-ANDA/install-ffmpeg.php
3. Tunggu sampai muncul "SELESAI".
4. Pastikan folder ffmpeg berisi:
   - ffmpeg.js
   - 814.ffmpeg.js
   - ffmpeg-core.js
   - ffmpeg-core.wasm
5. Hapus install-ffmpeg.php.
6. Buka index.html.

Input: MP4/WebM
Output: MP4
Resize: 50% dari lebar dan tinggi.

Catatan:
- ffmpeg-core.wasm berukuran sekitar 32 MB.
- Installer membutuhkan PHP cURL dan koneksi HTTPS keluar dari hosting.
- Setelah instalasi, converter tidak lagi mengambil FFmpeg saat tombol Resize ditekan.
