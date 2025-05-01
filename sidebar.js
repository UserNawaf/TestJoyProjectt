document.addEventListener('DOMContentLoaded', function() {
    // تحديد الصفحة الحالية
    const currentPage = window.location.pathname.split('/').pop();
    
    // إيجاد الرابط المناسب وإضافة class active
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if(item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });

    // تحريك المحتوى عند تحريك المؤشر على السايدبار
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    sidebar.addEventListener('mouseenter', () => {
        mainContent.style.marginRight = '280px';
        mainContent.style.width = 'calc(100% - 280px)';
    });

    sidebar.addEventListener('mouseleave', () => {
        mainContent.style.marginRight = '70px';
        mainContent.style.width = 'calc(100% - 70px)';
    });

    // تفعيل زر تسجيل الخروج
    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // يمكنك إضافة كود تسجيل الخروج هنا
        window.location.href = 'index.html';
    });

    // تحسين الأداء للأجهزة المحمولة
    if (window.innerWidth <= 768) {
        mainContent.style.marginRight = '60px';
        mainContent.style.width = 'calc(100% - 60px)';
        
        sidebar.addEventListener('mouseenter', () => {
            mainContent.style.marginRight = '240px';
            mainContent.style.width = 'calc(100% - 240px)';
        });

        sidebar.addEventListener('mouseleave', () => {
            mainContent.style.marginRight = '60px';
            mainContent.style.width = 'calc(100% - 60px)';
        });
    }
});