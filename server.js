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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// إعداد التخزين للملفات المرفوعة
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

let siteState = {
    liveStatus: 'offline',
    streamUrl: '',
    accessCode: '998877',
    tickerMessage: "📢 أهلاً بكم في المنصة الرسمية لمبادرة بنكمل بعض",
    articles: [] 
};

// استقبال المنشورات مع ملفات من الجهاز
app.post('/upload-content', upload.fields([{ name: 'image' }, { name: 'video' }]), (req, res) => {
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
});

io.on('connection', (socket) => {
    socket.emit('syncState', siteState);

    socket.on('updateState', (data) => {
        siteState = { ...siteState, ...data };
        io.emit('syncState', siteState);
    });

    socket.on('deletePost', (postId) => {
        siteState.articles = siteState.articles.filter(p => p.id !== postId);
        io.emit('syncState', siteState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));