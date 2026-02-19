const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// إعداد السوكيت مع السماح بالاتصال من أي مصدر (ضروري لـ Railway)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// تحديد مسار مجلد public بدقة
const PUBLIC_PATH = path.join(__dirname, 'public');

// 1. تعريف المجلد الاستاتيكي (للملفات مثل CSS و JS)
app.use(express.static(PUBLIC_PATH));

// 2. التوجيه الرئيسي: عند فتح الدومين، يتم إرسال ملف index.html فوراً
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
});

// حالة النظام (تخزين مؤقت)
let systemState = {
    liveStatus: 'offline', 
    streamUrl: '',
    accessCode: Math.floor(100000 + Math.random() * 900000).toString(),
    chatEnabled: true
};

io.on('connection', (socket) => {
    console.log('مستخدم متصل: ' + socket.id);

    // إرسال الحالة الحالية فور الاتصال
    socket.emit('syncState', systemState);

    // أوامر التحكم (Admin)
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
        // تحديث الجميع لحظياً
        io.emit('syncState', systemState);
    });

    // نظام الشات
    socket.on('sendChatMessage', (msgData) => {
        if (systemState.chatEnabled) {
            io.emit('newChatMessage', {
                user: msgData.user || 'مشارك',
                text: msgData.text,
                time: new Date().toLocaleTimeString('ar-EG')
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('مستخدم غادر المنصة');
    });
});

// تشغيل السيرفر على المنفذ المخصص من Railway
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`المنصة تعمل الآن بنجاح على بورت: ${PORT}`);
});