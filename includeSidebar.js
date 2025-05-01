document.addEventListener('DOMContentLoaded', function() {
    fetch('sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.querySelector('.sidebar').innerHTML = data;
            // تفعيل السايدبار بعد تحميله
            const currentPage = window.location.pathname.split('/').pop();
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                if(item.getAttribute('href') === currentPage) {
                    item.classList.add('active');
                }
            });
        });
});