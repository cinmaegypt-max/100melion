const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
// تشغيل الملفات من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// قاعدة بيانات المنصة الشاملة (حالة الموقع)
let siteState = {
    liveStatus: 'offline',
    streamUrl: '',
    accessCode: '998877', // كود الدخول الافتراضي
    tickerMessage: "📢 أهلاً بكم في المنصة الرسمية لمبادرة بنكمل بعض.. تابعوا آخر التحديثات هنا",
    usersCount: 0,
    articles: [] 
};

io.on('connection', (socket) => {
    // زيادة عدد المتصلين عند الدخول
    siteState.usersCount++;
    io.emit('syncState', siteState);

    // مزامنة البيانات فور دخول أي مستخدم جديد
    socket.emit('syncState', siteState);

    // استقبال تحديثات الإدارة الشاملة (من dashboard.html)
    socket.on('updateState', (data) => {
        // دمج التحديثات الجديدة مع الحالة الحالية
        siteState = { ...siteState, ...data };
        
        // تحديث جميع المستخدمين لحظياً في كل الصفحات (الرئيسية، البروفايل، البث)
        io.emit('syncState', siteState);
        console.log("تم تحديث حالة النظام:", siteState);
    });

    // استقبال تحديثات الإدارة القديمة (للتوافق مع الأكواد السابقة)
    socket.on('adminUpdate', (data) => {
        if (data.type === 'LIVE') {
            siteState.liveStatus = data.status;
            siteState.streamUrl = data.url;
        } else if (data.type === 'TICKER') {
            siteState.tickerMessage = data.message;
        } else if (data.type === 'ARTICLE') {
            siteState.articles.unshift(data.article);
        }
        io.emit('syncState', siteState);
    });

    // إدارة دردشة البث المباشر
    socket.on('sendChatMessage', (data) => {
        io.emit('newChatMessage', data);
    });

    socket.on('disconnect', () => {
        siteState.usersCount = Math.max(0, siteState.usersCount - 1);
        io.emit('syncState', siteState);
    });
});

// توجيه الصفحات
app.get('/:page', (req, res) => {
    const page = req.params.page;
    if (page.endsWith('.html')) {
        res.sendFile(path.join(__dirname, 'public', page));
    } else {
        res.sendFile(path.join(__dirname, 'public', `${page}.html`));
    }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`السيرفر يعمل على الرابط: http://localhost:${PORT}`);
});