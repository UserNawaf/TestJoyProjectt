const firebaseConfig = {
    apiKey: "AIzaSyByT4A26ibE-L35_yBXPqQcJAAycsHfs1A",
    authDomain: "testjoy-2958c.firebaseapp.com",
    projectId: "testjoy-2958c",
    storageBucket: "testjoy-2958c.firebasestorage.app",
    messagingSenderId: "1013945106894",
    appId: "1:1013945106894:web:75b21f6534c21786786b9f",
    measurementId: "G-QM2Y6ZN8SX"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Function to get user stats
async function getUserStats() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('No user logged in');
            return;
        }

        // Get all results to calculate rankings
        const resultsSnapshot = await db.collection('results').get();
        const userScores = new Map();

        // Calculate total points for each user
        resultsSnapshot.docs.forEach(doc => {
            const result = doc.data();
            const userId = result.userId;
            if (!userId) return;

            const currentPoints = userScores.get(userId) || 0;
            userScores.set(userId, currentPoints + (result.totalPoints || 0));
        });

        // Convert to array and sort by points
        const sortedUsers = Array.from(userScores.entries())
            .sort((a, b) => b[1] - a[1]);

        // Find current user's rank
        const userRank = sortedUsers.findIndex(([userId]) => userId === user.uid) + 1;
        const userPoints = userScores.get(user.uid) || 0;

        // Update UI
        updateUserStats(userRank, userPoints);
    } catch (error) {
        console.error('Error fetching user stats:', error);
    }
}

// Function to update UI with user stats
function updateUserStats(rank, points) {
    const rankElement = document.querySelector('.stat-number[data-stat="rank"]');
    const pointsElement = document.querySelector('.stat-number[data-stat="points"]');

    if (rankElement) {
        rankElement.textContent = rank ? `#${rank}` : '#--';
    }
    if (pointsElement) {
        pointsElement.textContent = points || '0';
    }
}

// دالة جلب الاختبارات من Firebase
async function loadExams() {
    try {
        const snapshot = await db.collection('exams').get();
        const exams = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderExams(exams);
        setupCategoryFilters();
    } catch (error) {
        console.error('Error loading exams:', error);
        alert('حدث خطأ في تحميل الاختبارات');
    }
}

// دالة عرض الاختبارات
function renderExams(exams) {
    const container = document.querySelector('.exam-cards-container');
    
    if (!exams || exams.length === 0) {
        container.innerHTML = '<div class="no-exams">لا توجد اختبارات متاحة حالياً</div>';
        return;
    }

    container.innerHTML = exams.map(exam => `
        <div class="exam-card" data-category="${exam.category}" data-exam-id="${exam.id}">
            <div class="exam-cover">
                <img src="${exam.coverImage || 'default-cover.jpg'}" 
                     alt="${exam.title}" 
                     class="exam-cover">
            </div>
            <div class="exam-content">
                <div class="exam-category">
                    <i class="${getCategoryIcon(exam.category)}"></i>
                    <span>${getCategoryName(exam.category)}</span>
                </div>
                <h3 class="exam-title">${exam.title}</h3>
                <p class="exam-description">${exam.description}</p>
                <div class="exam-meta">
                    <span class="exam-points">
                        <i class="fas fa-question-circle"></i>
                        ${exam.questions?.length || 0} أسئلة
                    </span>
                    <a href="take-exam.html?id=${exam.id}" class="start-exam">
                        <i class="fas fa-play"></i>
                        ابدأ الاختبار
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// دالة تصفية الاختبارات حسب الفئة
function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const selectedCategory = button.dataset.category;
            filterExams(selectedCategory);
        });
    });
}

// دالة التصفية
async function filterExams(category) {
    try {
        let query = db.collection('exams');
        if (category !== 'all') {
            query = query.where('category', '==', category);
        }
        
        const snapshot = await query.get();
        const exams = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderExams(exams);
    } catch (error) {
        console.error('Filter error:', error);
    }
}

// دوال مساعدة
function getCategoryIcon(category) {
    const icons = {
        'programming': 'fas fa-code',
        'languages': 'fas fa-language',
        'math': 'fas fa-square-root-alt',
        'science': 'fas fa-flask',
        'technology': 'fas fa-microchip',
        'engineering': 'fas fa-cogs'
    };
    return icons[category] || 'fas fa-book';
}

function getCategoryName(category) {
    const names = {
        'programming': 'برمجة',
        'languages': 'لغات',
        'math': 'رياضيات',
        'science': 'علوم',
        'technology': 'تقنية',
        'engineering': 'هندسة'
    };
    return names[category] || 'عام';
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadExams();
    getUserStats();
    
    // Set up auth state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            getUserStats();
        }
    });
    
    // إدارة أحداث النقر
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.exam-card');
        if (card) {
            const examId = card.dataset.examId;
            window.location.href = `take-exam.html?id=${examId}`;
        }
    });
});