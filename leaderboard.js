// Firebase configuration
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

const db = firebase.firestore();
let players = [];
let currentPage = 0;
const playersPerPage = 10;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing leaderboard...');
    
    const tableBody = document.querySelector('.table-body');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    let isUpdating = false; // منع التحديثات المتكررة
    
    if (!tableBody || !loadMoreBtn) {
        console.error('Required elements not found!');
        return;
    }

    // تحسين مراقب التغييرات في الوقت الفعلي
    let unsubscribe = null;
    function setupRealtimeListener(filter = 'daily') {
        // إلغاء المراقب السابق إذا وجد
        if (unsubscribe) {
            unsubscribe();
        }

        const resultsRef = db.collection('results');
        let lastUpdate = Date.now();
        
        unsubscribe = resultsRef.onSnapshot((snapshot) => {
            // تجنب التحديثات المتكررة
            if (isUpdating) return;
            
            // التحقق من وقت آخر تحديث
            const now = Date.now();
            if (now - lastUpdate < 1000) return; // تجنب التحديثات السريعة المتكررة
            
            lastUpdate = now;
            
            const changes = snapshot.docChanges();
            if (changes.length > 0) {
                console.log('Changes detected:', changes.length);
                isUpdating = true;
                fetchPlayers(filter).finally(() => {
                    isUpdating = false;
                });
            }
        }, (error) => {
            console.error("Error in realtime listener:", error);
        });
    }

    async function fetchPlayers(filter = 'daily') {
        console.log('Fetching players with filter:', filter);
        try {
            // جلب جميع المستخدمين أولاً
            const studentsSnapshot = await db.collection('students').get();
            const userResults = {};

            // تهيئة جميع المستخدمين بنقاط صفرية
            studentsSnapshot.docs.forEach(doc => {
                const studentData = doc.data();
                if (studentData.fullName) { // تجاهل المستخدمين بدون أسماء
                    userResults[doc.id] = {
                        userId: doc.id,
                        name: studentData.fullName,
                        totalPoints: 0,
                        examCount: 0,
                        totalPercentage: 0,
                        lastExamDate: null,
                        firstExamDate: null,
                        level: studentData.level || 0
                    };
                }
            });

            // جلب نتائج الاختبارات
            const resultsRef = db.collection('results');
            const now = new Date();
            
            let query = resultsRef;
            if (filter === 'daily') {
                const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                query = query.where('completedAt', '>=', yesterday);
            } else if (filter === 'weekly') {
                const lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                query = query.where('completedAt', '>=', lastWeek);
            } else if (filter === 'monthly') {
                const lastMonth = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                query = query.where('completedAt', '>=', lastMonth);
            }

            const snapshot = await query.get();
            
            // تحديث النقاط للمستخدمين الذين لديهم نتائج
            snapshot.docs.forEach(doc => {
                const result = doc.data();
                const userId = result.userId;
                if (!userId || !userResults[userId]) return;

                userResults[userId].totalPoints += result.totalPoints || 0;
                userResults[userId].examCount += 1;
                userResults[userId].totalPercentage += result.percentage || 0;
                
                const timestamp = result.completedAt?.toDate() || result.timestamp?.toDate() || new Date();
                
                if (!userResults[userId].lastExamDate || timestamp > userResults[userId].lastExamDate) {
                    userResults[userId].lastExamDate = timestamp;
                }
                if (!userResults[userId].firstExamDate || timestamp < userResults[userId].firstExamDate) {
                    userResults[userId].firstExamDate = timestamp;
                }
            });

            // تحويل إلى مصفوفة وحساب المتوسطات
            players = Object.values(userResults)
                .filter(user => user.examCount > 0 || filter === 'monthly')
                .map(user => ({
                    id: user.userId,
                    name: user.name,
                    level: user.level || Math.ceil((user.totalPoints || 0) / 50),
                    score: user.totalPoints || 0,
                    percentage: user.examCount > 0 ? Math.round(user.totalPercentage / user.examCount) : 0,
                    trend: user.examCount > 0 ? ((user.totalPercentage / user.examCount) >= 70 ? 'up' : 'down') : 'neutral',
                    examCount: user.examCount,
                    lastActive: user.lastExamDate,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
                }));

            // ترتيب حسب النقاط
            players.sort((a, b) => b.score - a.score);
            
            // إضافة الترتيب
            players = players.map((player, index) => ({
                ...player,
                rank: index + 1
            }));

            if (players.length === 0) {
                tableBody.innerHTML = '<div class="empty-state">لا يوجد نتائج حالياً</div>';
                return;
            }

            // تحديث العرض
            currentPage = 0;
            tableBody.innerHTML = '';
            loadMorePlayers();
            updateTopPlayers();
            
        } catch (error) {
            console.error('Error fetching players:', error);
            tableBody.innerHTML = '<div class="error-message">حدث خطأ في تحميل البيانات</div>';
        }
    }

    // تحديث أزرار التصفية
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isUpdating) return; // تجنب النقر المتكرر
            
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const period = btn.dataset.period;
            setupRealtimeListener(period);
            fetchPlayers(period);
        });
    });

    // زر تحميل المزيد
    loadMoreBtn.addEventListener('click', loadMorePlayers);

    // التحميل الأولي
    console.log('Starting initial load...');
    fetchPlayers('daily');
    setupRealtimeListener('daily');
});

// Add smooth scroll effect
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Update top 3 players cards
function updateTopPlayers() {
    const top3 = players.slice(0, 3);
    const positions = ['first', 'second', 'third'];
    
    positions.forEach((position, index) => {
        const player = top3[index];
        const card = document.querySelector(`.player-card.${position}`);
        
        if (card && player) {
            card.querySelector('.name').textContent = player.name;
            card.querySelector('.score').textContent = `${player.score} نقطة`;
            card.querySelector('.level').textContent = player.level;
            
            // Update stats
            const statsElement = card.querySelector('.stats');
            if (statsElement) {
                statsElement.innerHTML = `
                    <span><i class="fas fa-star"></i> ${player.percentage}%</span>
                    <span><i class="fas fa-trophy"></i> ${player.examCount} اختبار</span>
                `;
            }
        }
    });
}

// Load more players
function loadMorePlayers() {
    const start = currentPage * playersPerPage;
    const end = start + playersPerPage;
    const pagePlayers = players.slice(start, end);

    if (pagePlayers.length === 0 && currentPage === 0) {
        tableBody.innerHTML = '<div class="empty-state">لا يوجد نتائج حالياً</div>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    pagePlayers.forEach(player => {
        const row = document.createElement('div');
        row.className = 'player-row';
        row.innerHTML = `
            <div class="rank">${player.rank}</div>
            <div class="player-info">
                <img src="${player.avatar}" alt="${player.name}">
                <span>${player.name}</span>
                <div class="badge" title="${player.examCount} اختبار">
                    <i class="fas fa-graduation-cap"></i>
                </div>
            </div>
            <div class="level">${player.level}</div>
            <div class="score">${player.score}</div>
            <div class="progress ${player.trend}">
                <i class="fas fa-arrow-${player.trend}"></i>
                <span>${player.percentage}%</span>
            </div>
            <div class="stats">
                <span><i class="fas fa-star"></i> ${player.percentage}%</span>
                <span><i class="fas fa-trophy"></i> ${player.examCount} اختبار</span>
                <span><i class="fas fa-clock"></i> ${formatDate(player.lastActive)}</span>
            </div>
        `;
        tableBody.appendChild(row);
    });

    currentPage++;
    loadMoreBtn.style.display = currentPage * playersPerPage >= players.length ? 'none' : 'block';
}

function formatDate(date) {
    if (!date) return '-';
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'اليوم';
    if (days === 1) return 'أمس';
    if (days < 7) return `منذ ${days} أيام`;
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
    return `منذ ${Math.floor(days / 30)} أشهر`;
}