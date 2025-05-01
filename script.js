// تأثيرات التمرير
const scrollReveal = () => {
    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('active');
        }
    });
};

window.addEventListener('scroll', scrollReveal);

// تأثيرات القائمة المنسدلة
document.querySelectorAll('.dropdown').forEach(dropdown => {
    const button = dropdown.querySelector('button');
    const content = dropdown.querySelector('.dropdown-content');

    button.addEventListener('mouseenter', () => {
        content.style.opacity = '1';
        content.style.visibility = 'visible';
        content.style.transform = 'translateY(0)';
    });

    dropdown.addEventListener('mouseleave', () => {
        content.style.opacity = '0';
        content.style.visibility = 'hidden';
        content.style.transform = 'translateY(10px)';
    });
});

// تأثيرات الرسائل
const messages = document.querySelectorAll('.message');
messages.forEach((message, index) => {
    message.style.animationDelay = `${index * 0.2}s`;
});

// إضافة الفئات للتأثيرات
document.querySelectorAll('.stat-card, .review-card').forEach(card => {
    card.classList.add('scroll-reveal');
});

// تحريك السهم عند التمرير
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(13, 148, 136, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// تأثيرات النجوم
document.querySelectorAll('.stars').forEach(starsContainer => {
    const stars = starsContainer.querySelectorAll('i');
    stars.forEach((star, index) => {
        star.style.animationDelay = `${index * 0.1}s`;
        star.style.animation = 'starPulse 1s ease infinite';
    });
});

// تأثير نبض النجوم
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes starPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(styleSheet);

// تحسين أداء التمرير
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(() => {
        scrollReveal();
    });
});

// تهيئة التأثيرات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    scrollReveal();
    
    // تأثير ظهور تدريجي للمحتوى
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});


const CONFIG = {
    SCROLL_THRESHOLD: 100,
    ANIMATION_DELAY: 0.2,
    STAR_ANIMATION_DELAY: 0.1,
    SCROLL_REVEAL_OFFSET: 150
};

// مدير الحركات
class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.init();
    }

    init() {
        this.setupScrollEffects();
        this.setupNavbar();
        this.setupDropdowns();
        this.setupMessages();
        this.setupStars();
        this.setupCards();
    }

    setupScrollEffects() {
        const scrollHandler = () => {
            requestAnimationFrame(() => {
                document.querySelectorAll('.scroll-reveal').forEach(element => {
                    const elementTop = element.getBoundingClientRect().top;
                    if (elementTop < window.innerHeight - CONFIG.SCROLL_REVEAL_OFFSET) {
                        element.classList.add('active');
                        element.style.transform = 'translateY(0)';
                        element.style.opacity = '1';
                    }
                });
            });
        };

        window.addEventListener('scroll', this.debounce(scrollHandler, 10));
        scrollHandler();
    }

    setupNavbar() {
        const navbar = document.querySelector('.navbar');
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > lastScroll && currentScroll > CONFIG.SCROLL_THRESHOLD) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
                navbar.style.background = currentScroll > CONFIG.SCROLL_THRESHOLD ? 
                    'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)';
            }
            
            lastScroll = currentScroll;
        });
    }

    setupDropdowns() {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            const button = dropdown.querySelector('button');
            const content = dropdown.querySelector('.dropdown-content');
            let timeout;

            const show = () => {
                clearTimeout(timeout);
                content.style.opacity = '1';
                content.style.visibility = 'visible';
                content.style.transform = 'translateY(0) scale(1)';
            };

            const hide = () => {
                timeout = setTimeout(() => {
                    content.style.opacity = '0';
                    content.style.visibility = 'hidden';
                    content.style.transform = 'translateY(10px) scale(0.95)';
                }, 150);
            };

            button.addEventListener('mouseenter', show);
            content.addEventListener('mouseenter', show);
            button.addEventListener('mouseleave', hide);
            content.addEventListener('mouseleave', hide);
        });
    }

    setupMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach((message, index) => {
            message.style.animationDelay = `${index * CONFIG.ANIMATION_DELAY}s`;
            this.addRippleEffect(message);
        });
    }

    setupStars() {
        document.querySelectorAll('.stars i').forEach((star, index) => {
            star.style.animationDelay = `${index * CONFIG.STAR_ANIMATION_DELAY}s`;
            star.addEventListener('mouseenter', () => this.pulseEffect(star));
        });
    }

    setupCards() {
        document.querySelectorAll('.review-card, .stat-card').forEach(card => {
            card.classList.add('scroll-reveal');
            this.addHoverEffect(card);
        });
    }

    addRippleEffect(element) {
        element.addEventListener('click', e => {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            const rect = element.getBoundingClientRect();
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            element.appendChild(ripple);
            setTimeout(() => ripple.remove(), 1000);
        });
    }

    addHoverEffect(element) {
        element.addEventListener('mousemove', e => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            element.style.transform = `
                perspective(1000px)
                rotateX(${(y - rect.height/2) / 20}deg)
                rotateY(${-(x - rect.width/2) / 20}deg)
                translateZ(10px)
            `;
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    }

    pulseEffect(element) {
        element.style.transform = 'scale(1.3)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// تهيئة المدير عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const animationManager = new AnimationManager();
    
    // تأثير ظهور الصفحة
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    });
});

// إضافة الأنماط الديناميكية
const dynamicStyles = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        transform: scale(0);
        animation: ripple 1s linear;
        pointer-events: none;
    }

    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .scroll-reveal {
        transform: translateY(30px);
        opacity: 0;
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);