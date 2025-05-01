document.addEventListener('DOMContentLoaded', function() {
    // تهيئة Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyByT4A26ibE-L35_yBXPqQcJAAycsHfs1A",
        authDomain: "testjoy-2958c.firebaseapp.com",
        projectId: "testjoy-2958c",
        storageBucket: "testjoy-2958c.firebasestorage.app",
        messagingSenderId: "1013945106894",
        appId: "1:1013945106894:web:75b21f6534c21786786b9f",
        measurementId: "G-QM2Y6ZN8SX"
    };

    // تهيئة Firebase مرة واحدة فقط
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // التحقق من حالة تسجيل الدخول
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // جلب بيانات المعلم
            const teacherDoc = await db.collection('teachers').doc(user.uid).get();
            
            if (!teacherDoc.exists) {
                showMessage('لم يتم العثور على بيانات المعلم', 'error');
                return;
            }

            const teacherData = teacherDoc.data();

            // عرض البيانات في الحقول
            document.getElementById('fullName').value = teacherData.fullName || '';
            document.getElementById('specialization').value = teacherData.specialization || '';
            document.getElementById('email').value = user.email || '';

            // تعطيل جميع الحقول
            document.querySelectorAll('input, textarea').forEach(input => {
                input.setAttribute('readonly', true);
                input.style.backgroundColor = '#f8f9fa';
            });

        } catch (error) {
            console.error('خطأ:', error);
            showMessage('حدث خطأ في تحميل البيانات', 'error');
        }
    });

    // دالة عرض الرسائل
    function showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        
        const container = document.querySelector('.settings-container');
        container.insertBefore(messageDiv, container.firstChild);

        setTimeout(() => messageDiv.remove(), 3000);
    }
});