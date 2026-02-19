// استيراد المكتبات اللازمة من Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// إعدادات مشروع Firebase (يجب استبدالها ببيانات مشروعك من Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyA-YourRealKeyHere",
    authDomain: "benkamal-baad.firebaseapp.com",
    databaseURL: "https://benkamal-baad-default-rtdb.firebaseio.com",
    projectId: "benkamal-baad",
    storageBucket: "benkamal-baad.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// تصدير الأدوات لاستخدامها في الصفحات الأخرى
export { db, auth, ref, set, push, onValue, update, remove };