const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// 1. تحديد مكان المجلد العام
const PUBLIC_PATH = path.join(__dirname, 'public');

// 2. السماح للسيرفر بقراءة أي ملف (CSS, JS, Images) جوه public
app.use(express.static(PUBLIC_PATH));

// 3. كود سحري: لو حد طلب أي صفحة .html، السيرفر يفتحها من مجلد public
app.get('/:page', (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(PUBLIC_PATH, page), (err) => {
        if (err) {
            res.status(404).send("عذراً، هذه الصفحة غير موجودة في المبادرة!");
        }
    });
});

// 4. الصفحة الرئيسية الافتراضية
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
});

// حالة النظام (البث المباشر)
let systemState = {
    liveStatus: 'offline', 
    streamUrl: '',
    accessCode: '123456'
};

io.on('connection', (socket) => {
    socket.emit('syncState', systemState);
    socket.on('adminCommand', (data) => {
        if (data.action === 'START_LIVE') {
            systemState.liveStatus = 'online';
            systemState.streamUrl = data.url;
        } else if (data.action === 'STOP_LIVE') {
            systemState.liveStatus = 'offline';
        }
        io.emit('syncState', systemState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`المنصة تعمل بالكامل على بورت: ${PORT}`);
});