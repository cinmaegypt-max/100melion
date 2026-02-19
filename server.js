const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// إعداد السوكيت مع حماية CORS
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- إعدادات الحماية والأدمن ---
const ADMIN_PASSWORD = "Mubdra_Admin_2026"; // 🔒 قم بتغيير كلمة السر هنا

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// مسار للتحقق من كلمة السر قبل دخول صفحة التحكم
app.post('/admin-login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
    }
});

// حالة النظام الحالية
let systemState = {
    liveStatus: 'offline', 
    streamUrl: '',
    accessCode: Math.floor(100000 + Math.random() * 900000).toString(),
    chatEnabled: true
};

io.on('connection', (socket) => {
    socket.emit('syncState', systemState);

    // استقبال أوامر الأدمن
    socket.on('adminCommand', (data) => {
        // تحديث الحالة بناءً على الأوامر
        if (data.action === 'START_LIVE') {
            systemState.liveStatus = 'online';
            systemState.streamUrl = data.url;
        } else if (data.action === 'STOP_LIVE') {
            systemState.liveStatus = 'offline';
        } else if (data.action === 'REFRESH_CODE') {
            systemState.accessCode = Math.floor(100000 + Math.random() * 900000).toString();
        }
        io.emit('syncState', systemState);
    });

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
    console.log(`المنصة تعمل بأمان على بورت: ${PORT}`);
});