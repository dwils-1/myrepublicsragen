const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
app.use(cors()); // Mengizinkan website Anda mengakses backend ini
app.use(express.json());

// KONFIGURASI RAHASIA (Hanya ada di server)
const BOT_TOKEN = '8330506170:AAGzCVVdLryY-GGofwzvdKiWVu7z4GobgW8';
const CHAT_ID = '-1003594385102';
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // Batas 20MB

// 1. Endpoint untuk kirim Pesan Chat/Pendaftaran
app.post('/api/send-message', async (req, res) => {
    try {
        const { text, topic_id } = req.body;
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            message_thread_id: topic_id,
            text: text,
            parse_mode: 'HTML'
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Endpoint untuk kirim Media (Foto/Video)
app.post('/api/send-media', upload.any(), async (req, res) => {
    try {
        const { topic_id, caption, type } = req.body;
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('message_thread_id', topic_id);
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');

        // Menentukan endpoint Telegram berdasarkan tipe (video/photo)
        const endpoint = type === 'video' ? 'sendVideo' : 'sendMediaGroup';
        
        req.files.forEach((file, index) => {
            formData.append(type === 'video' ? 'video' : `photo${index}`, file.buffer, file.originalname);
        });

        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, formData, {
            headers: formData.getHeaders()
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend MyRepublic Sragen jalan di port ${PORT}`));
