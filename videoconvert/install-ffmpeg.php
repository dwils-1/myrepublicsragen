<?php
header('Content-Type: text/plain; charset=utf-8');

$dir = __DIR__ . DIRECTORY_SEPARATOR . 'ffmpeg';
if (!is_dir($dir)) {
    if (!mkdir($dir, 0755, true)) {
        http_response_code(500);
        exit("GAGAL: tidak bisa membuat folder ffmpeg\n");
    }
}

$files = [
    'ffmpeg.js' => 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js',
    '814.ffmpeg.js' => 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js',
    'ffmpeg-core.js' => 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js',
    'ffmpeg-core.wasm' => 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm'
];

function download_file($url, $dest) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 30,
        CURLOPT_TIMEOUT => 300,
        CURLOPT_USERAGENT => 'Mozilla/5.0 VideoConverterInstaller',
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);
    $data = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($data === false || $code < 200 || $code >= 300) {
        return [false, "HTTP $code $err"];
    }

    if (file_put_contents($dest, $data) === false) {
        return [false, "gagal menulis file"];
    }

    return [true, strlen($data)];
}

echo "INSTALL FFmpeg WASM 0.12.10\n";
echo "============================\n\n";

foreach ($files as $name => $url) {
    echo "Mengunduh $name ... ";
    [$ok, $info] = download_file($url, $dir . DIRECTORY_SEPARATOR . $name);
    if (!$ok) {
        echo "GAGAL: $info\n";
        exit("\nInstalasi berhenti. Pastikan hosting mengizinkan koneksi keluar HTTPS.\n");
    }
    echo "OK (" . number_format($info/1024/1024, 2) . " MB)\n";
}

echo "\nSELESAI.\n";
echo "Tes file:\n";
foreach (array_keys($files) as $name) {
    $path = $dir . DIRECTORY_SEPARATOR . $name;
    echo " - $name: " . (file_exists($path) ? "OK" : "MISSING") . "\n";
}
echo "\nHapus file install-ffmpeg.php setelah selesai.\n";
?>
