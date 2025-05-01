// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyByT4A26ibE-L35_yBXPqQcJAAycsHfs1A",
    authDomain: "testjoy-2958c.firebaseapp.com",
    projectId: "testjoy-2958c",
    storageBucket: "testjoy-2958c.firebasestorage.app",
    messagingSenderId: "1013945106894",
    appId: "1:1013945106894:web:75b21f6534c21786786b9f",
    measurementId: "G-QM2Y6ZN8SX"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function() {
    const resetForm = document.getElementById('resetForm');
    const successMessage = document.getElementById('successMessage');
    const submitButton = document.querySelector('.auth-btn');

    resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        if (validateEmail(email)) {
            try {
                // تعطيل الزر وتغيير النص
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
                
                // إرسال رابط إعادة تعيين كلمة المرور
                await auth.sendPasswordResetEmail(email, {
                    url: window.location.origin + '/login.html',
                    handleCodeInApp: true
                });
                
                // إظهار رسالة النجاح
                resetForm.style.display = 'none';
                successMessage.style.display = 'flex';
                
                // التوجيه إلى صفحة تسجيل الدخول بعد 3 ثواني
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } catch (error) {
                console.error('Error:', error);
                let errorMessage = 'حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور';
                
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'البريد الإلكتروني غير صالح';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'لم يتم العثور على حساب بهذا البريد الإلكتروني';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'تم تجاوز عدد المحاولات المسموح بها. الرجاء المحاولة لاحقاً';
                        break;
                }
                
                // إظهار رسالة الخطأ
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message error';
                errorDiv.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${errorMessage}</p>
                `;
                resetForm.appendChild(errorDiv);
                
                // إعادة تفعيل الزر
                submitButton.disabled = false;
                submitButton.innerHTML = '<span>إرسال رابط الاستعادة</span><i class="fas fa-paper-plane"></i>';
                
                // إزالة رسالة الخطأ بعد 5 ثواني
                setTimeout(() => {
                    errorDiv.remove();
                }, 5000);
            }
        } else {
            alert('الرجاء إدخال بريد إلكتروني صالح');
        }
    });
});

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}