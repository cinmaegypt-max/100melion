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

// قاعدة بيانات المنصة (مؤقتة للتيست)
let siteState = {
    liveStatus: 'offline',
    streamUrl: '',
    tickerMessage: "📢 أهلاً بكم في المنصة الرسمية لمبادرة بنكمل بعض.. تابعوا آخر التحديثات هنا",
    articles: [] // لتخزين المقالات والصور
};

io.on('connection', (socket) => {
    // مزامنة البيانات فور دخول أي مستخدم
    socket.emit('syncState', siteState);

    // استقبال تحديثات الإدارة
    socket.on('adminUpdate', (data) => {
        if (data.type === 'LIVE') {
            siteState.liveStatus = data.status;
            siteState.streamUrl = data.url;
        } else if (data.type === 'TICKER') {
            siteState.tickerMessage = data.message;
        } else if (data.type === 'ARTICLE') {
            siteState.articles.unshift(data.article);
        }
        // تحديث جميع المستخدمين لحظياً
        io.emit('syncState', siteState);
    });
});

// فتح أي صفحة تلقائياً
app.get('/:page', (req, res) => {
    const page = req.params.page.includes('.') ? req.params.page : req.params.page + '.html';
    res.sendFile(path.join(__dirname, 'public', page), (err) => {
        if (err) res.status(404).send("عذراً، الصفحة غير موجودة");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`المنصة تعمل بنجاح على بورت ${PORT}`));