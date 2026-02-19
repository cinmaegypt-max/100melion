const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// توجيه السيرفر لملفات الواجهة (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// حالة النظام الحالية (يتم تخزينها في ذاكرة السيرفر)
let systemState = {
    liveStatus: 'offline', // online أو offline
    streamUrl: '',
    accessCode: Math.floor(100000 + Math.random() * 900000).toString(), // كود عشوائي مبدئي
    chatEnabled: true
};

io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل');

    // إرسال البيانات الحالية للمستخدم فور دخوله
    socket.emit('syncState', systemState);

    // --- أوامر الأدمن ---
    socket.on('adminCommand', (data) => {
        if (data.action === 'START_LIVE') {
            systemState.liveStatus = 'online';
            systemState.streamUrl = data.url;
        } else if (data.action === 'STOP_LIVE') {
            systemState.liveStatus = 'offline';
        } else if (data.action === 'REFRESH_CODE') {
            systemState.accessCode = Math.floor(100000 + Math.random() * 900000).toString();
        } else if (data.action === 'TOGGLE_CHAT') {
            systemState.chatEnabled = data.status;
        }
        // تحديث جميع المتدربين فوراً (Real-time)
        io.emit('syncState', systemState);
    });

    // --- نظام الشات ريل تايم ---
    socket.on('sendChatMessage', (msgData) => {
        if (systemState.chatEnabled) {
            io.emit('newChatMessage', {
                user: msgData.user,
                text: msgData.text,
                time: new Date().toLocaleTimeString('ar-EG')
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`الباك إيند يعمل على: http://localhost:${PORT}`);
});