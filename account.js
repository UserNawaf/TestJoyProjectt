document.addEventListener('DOMContentLoaded', () => {
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat-value');
        stats.forEach(stat => {
            const value = parseInt(stat.dataset.value);
            animateNumber(stat, 0, value, 1500);
        });
    };

    const animateNumber = (element, start, end, duration) => {
        let current = start;
        const increment = (end - start) / (duration / 16);
        const animate = () => {
            current += increment;
            element.textContent = Math.floor(current);
            if (current < end) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    };

    // تأثيرات ظهور الكروت
    const cards = document.querySelectorAll('.section-card');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        observer.observe(card);
    });

    const profilePic = document.querySelector('.profile-picture img');
    profilePic.addEventListener('mouseover', () => {
        profilePic.style.transform = 'scale(1.05)';
    });
    profilePic.addEventListener('mouseout', () => {
        profilePic.style.transform = 'scale(1)';
    });

    const imageInput = document.getElementById('uploadImage');
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePic.style.opacity = '0';
                setTimeout(() => {
                    profilePic.src = event.target.result;
                    profilePic.style.opacity = '1';
                }, 300);
            };
            reader.readAsDataURL(file);
        }
    });

    const buttons = document.querySelectorAll('.save-button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
    });

    const form = document.querySelector('.account-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const button = form.querySelector('.save-btn');
        button.textContent = 'جاري الحفظ...';
        button.disabled = true;

        setTimeout(() => {
            button.textContent = 'تم الحفظ ✓';
            setTimeout(() => {
                button.textContent = 'حفظ التغييرات';
                button.disabled = false;
            }, 2000);
        }, 1500);
    });

    const achievements = document.querySelectorAll('.achievement-card');
    achievements.forEach(achievement => {
        achievement.addEventListener('mouseenter', () => {
            achievement.style.transform = 'translateY(-10px)';
        });
        achievement.addEventListener('mouseleave', () => {
            achievement.style.transform = 'translateY(0)';
        });
    });

    animateStats();
});

// Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyByT4A26ibE-L35_yBXPqQcJAAycsHfs1A",

    authDomain: "testjoy-2958c.firebaseapp.com",
  
    projectId: "testjoy-2958c",
  
    storageBucket: "testjoy-2958c.firebasestorage.app",
  
    messagingSenderId: "1013945106894",
  
    appId: "1:1013945106894:web:75b21f6534c21786786b9f",
  
    measurementId: "G-QM2Y6ZN8SX"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const profileName = document.querySelector('.profile-name');
const profileRole = document.querySelector('.profile-role');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const educationInput = document.getElementById('education');

async function loadUserData() {
    const user = auth.currentUser;
    
    if (user) {
        try {
            const studentDoc = await db.collection('students').doc(user.uid).get();
            const teacherDoc = await db.collection('teachers').doc(user.uid).get();

            if (studentDoc.exists) {
                const userData = studentDoc.data();
                populateProfile(userData, 'student');
                await loadUserStatistics(user.uid);
            } else if (teacherDoc.exists) {
                const userData = teacherDoc.data();
                populateProfile(userData, 'teacher');
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            showError("حدث خطأ في تحميل البيانات");
        }
    }
}

async function loadUserStatistics(userId) {
    try {
        // Get all exam results
        const resultsSnapshot = await db.collection('results')
            .where('userId', '==', userId)
            .get();

        const results = resultsSnapshot.docs.map(doc => ({
            ...doc.data(),
            timestamp: doc.data().completedAt?.toDate() || new Date()
        }));

        // Calculate total exams
        const totalExams = results.length;
        document.getElementById('totalExams').textContent = totalExams;

        // Calculate success rate
        if (totalExams > 0) {
            const totalPercentage = results.reduce((sum, result) => sum + (result.percentage || 0), 0);
            const successRate = Math.round(totalPercentage / totalExams);
            document.getElementById('successRate').textContent = `${successRate}%`;
        }

        // Calculate daily exams
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayExams = results.filter(result => {
            const examDate = new Date(result.timestamp);
            examDate.setHours(0, 0, 0, 0);
            return examDate.getTime() === today.getTime();
        }).length;
        document.getElementById('dailyExams').textContent = todayExams;

        // Animate the numbers
        animateStatistics({
            totalExams,
            successRate: Math.round(totalPercentage / totalExams),
            dailyExams: todayExams
        });

    } catch (error) {
        console.error("Error loading statistics:", error);
        showError("حدث خطأ في تحميل الإحصائيات");
    }
}

function animateStatistics(stats) {
    Object.entries(stats).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            animateNumber(element, 0, value, 1500);
        }
    });
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = Math.floor(start + (end - start) * progress);
        element.textContent = element.id === 'successRate' ? `${current}%` : current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #ef4444;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        z-index: 1000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function populateProfile(data, role) {
    profileName.textContent = data.fullName || 'بدون اسم';
    profileRole.textContent = role === 'student' ? 'متعلم' : 'معلم';
    nameInput.value = data.fullName || '';
    emailInput.value = data.email || '';
    phoneInput.value = data.phone || '';
    educationInput.value = data.education || '';

    if (data.profileImage) {
        document.getElementById('profileImage').src = data.profileImage;
    }

    updateStatistics(data);
}

function updateStatistics(data) {
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 2) {
        statValues[0].textContent = data.totalTests || 0;
        statValues[1].textContent = data.successRate ? `${data.successRate}%` : '0%';
    }
}

document.querySelector('.save-button').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    const updates = {
        fullName: nameInput.value,
        phone: phoneInput.value,
        education: educationInput.value
    };

    try {
        await db.collection('students').doc(user.uid).update(updates);
        profileName.textContent = updates.fullName;
        alert('تم حفظ التغييرات بنجاح');
    } catch (error) {
        alert('حدث خطأ أثناء حفظ التغييرات');
    }
});

auth.onAuthStateChanged(user => {
    if (user) {
        loadUserData();
    } else {
        window.location.href = 'login.html';
    }
});

document.querySelector('.logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
});