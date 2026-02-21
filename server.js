const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// جعل مجلد الرفع متاحاً للعامة لرؤية الصور والفيديوهات
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// الكود السحري: إنشاء مجلد uploads تلقائياً إذا لم يكن موجوداً لمنع الـ Crash
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// إعدادات التخزين
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

let siteState = {
    liveStatus: 'offline',
    streamUrl: '',
    accessCode: '998877',
    tickerMessage: "📢 أهلاً بكم في المنصة الرسمية لمبادرة بنكمل بعض",
    articles: [] 
};

// استقبال المنشورات (صور وفيديو) من الجهاز
app.post('/upload-content', upload.fields([{ name: 'image' }, { name: 'video' }]), (req, res) => {
    try {
        const { title, desc } = req.body;
        const newPost = {
            id: Date.now(),
            title,
            desc,
            date: new Date().toLocaleString('ar-EG'),
            img: req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null,
            video: req.files['video'] ? `/uploads/${req.files['video'][0].filename}` : null
        };
        
        siteState.articles.unshift(newPost);
        io.emit('syncState', siteState);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

io.on('connection', (socket) => {
    socket.emit('syncState', siteState);
    socket.on('updateState', (data) => {
        siteState = { ...siteState, ...data };
        io.emit('syncState', siteState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`السيرفر يعمل بنجاح على منفذ ${PORT}`));