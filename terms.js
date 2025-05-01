// Intersection Observer للتأثيرات الحركية
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, { threshold: 0.1 });

// تحديد العناصر التي سيتم مراقبتها
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// تأثيرات القائمة الجانبية
const sidebarLinks = document.querySelectorAll('.terms-sidebar a');
const sections = document.querySelectorAll('section');

// تحديث القسم النشط عند التمرير
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 150) {
            current = section.getAttribute('id');
        }
    });

    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// تأثير النقر على روابط القائمة
sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // تأثير وميض للقسم المستهدف
        targetSection.classList.add('highlight');
        setTimeout(() => {
            targetSection.classList.remove('highlight');
        }, 1000);
    });
});

// تفعيل زر الموافقة
const checkbox = document.getElementById('agreeCheckbox');
const agreeButton = document.getElementById('agreeButton');

checkbox.addEventListener('change', () => {
    agreeButton.disabled = !checkbox.checked;
    if (checkbox.checked) {
        agreeButton.classList.add('enabled');
    } else {
        agreeButton.classList.remove('enabled');
    }
});

// تأثير عند النقر على زر الموافقة
agreeButton.addEventListener('click', () => {
    if (!agreeButton.disabled) {
        agreeButton.classList.add('clicked');
        setTimeout(() => {
            agreeButton.classList.remove('clicked');
            // يمكنك إضافة الإجراء المطلوب هنا
        }, 500);
    }
});

// تأثيرات إضافية للأقسام عند التمرير
const createScrollAnimation = () => {
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const isVisible = (rect.top <= window.innerHeight * 0.8);
        
        if (isVisible) {
            section.style.transform = 'translateY(0)';
            section.style.opacity = '1';
        }
    });
};

window.addEventListener('scroll', createScrollAnimation);
window.addEventListener('load', createScrollAnimation);