document.addEventListener('DOMContentLoaded', async () => {
    try {
        // تهيئة Firebase
        if (!firebase.apps.length) {
            const firebaseConfig = {
                apiKey: "AIzaSyByT4A26ibE-L35_yBXPqQcJAAycsHfs1A",
                authDomain: "testjoy-2958c.firebaseapp.com",
                projectId: "testjoy-2958c",
                storageBucket: "testjoy-2958c.firebasestorage.app",
                messagingSenderId: "1013945106894",
                appId: "1:1013945106894:web:75b21f6534c21786786b9f",
                measurementId: "G-QM2Y6ZN8SX"
            };
            firebase.initializeApp(firebaseConfig);
        }

        const db = firebase.firestore();
        const auth = firebase.auth();
        let currentUser = null;

        console.log('Firebase initialized successfully');

        // التحقق من تسجيل الدخول
        auth.onAuthStateChanged(async (user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            currentUser = user;
            console.log('Current user ID:', currentUser.uid);
            await loadUserAnalytics();
        });

        async function loadUserAnalytics() {
            try {
                const loadingOverlay = document.getElementById('loadingOverlay');
                loadingOverlay.classList.add('active');

                console.log('Loading analytics for user:', currentUser.uid);

                //  بيانات الطالب
                const studentDoc = await db.collection('students').doc(currentUser.uid).get();
                console.log('Student data fetched:', studentDoc.exists ? 'exists' : 'does not exist');
                const studentData = studentDoc.data() || {};

                try {
                    //  نتائج الاختبارات
                    console.log('Fetching exam results...');
                    const resultsSnapshot = await db.collection('results')
                        .where('userId', '==', currentUser.uid)
                        .get();

                    console.log('Results fetched:', resultsSnapshot.size, 'documents');
                    const examResults = resultsSnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            percentage: Number(data.percentage) || 0,
                            completedAt: data.completedAt?.toDate() || new Date()
                        };
                    });

                    console.log('Processed exam results:', examResults.length, 'items');

                    // تحديث الإحصائيات
                    updateStatistics(examResults, studentData);
                    updateCharts(examResults);
                    updateRecentActivities(examResults);

                } catch (queryError) {
                    console.error('Error fetching results:', queryError);
                    if (queryError.message && queryError.message.includes('requires an index')) {
                        console.log('Index is being built, showing default state...');
                        updateStatistics([], studentData);
                        updateCharts([]);
                        updateRecentActivities([]);
                        showMessage('جاري إعداد قاعدة البيانات للمرة الأولى، يرجى المحاولة مرة أخرى بعد دقائق...');
                    } else {
                        throw queryError;
                    }
                }

                loadingOverlay.classList.remove('active');
            } catch (error) {
                console.error('Error in loadUserAnalytics:', error);
                showError('حدث خطأ في تحميل البيانات');
                loadingOverlay.classList.remove('active');
            }
        }

        function updateStatistics(examResults, studentData) {
            console.log('Updating statistics with:', examResults.length, 'results');
            
            // حساب إجمالي الاختبارات
            const totalExams = examResults.length;

            // حساب متوسط الدرجات
            const averagePercentage = examResults.length > 0 
                ? Math.round(examResults.reduce((sum, result) => sum + (Number(result.percentage) || 0), 0) / totalExams)
                : 0;

            // حساب أعلى درجة
            const highestScore = examResults.length > 0
                ? Math.max(...examResults.map(result => Number(result.percentage) || 0))
                : 0;

            // حساب مجموع النقاط
            const totalPoints = studentData.totalPoints || 0;

            console.log('Calculated stats:', {
                totalExams,
                averagePercentage,
                highestScore,
                totalPoints
            });

            // تحريك الأرقام في البطاقات الإحصائية
            const elements = {
                totalExams: document.querySelector('[data-stat="totalExams"]'),
                averageScore: document.querySelector('[data-stat="averageScore"]'),
                totalPoints: document.querySelector('[data-stat="totalPoints"]'),
                highestScore: document.querySelector('[data-stat="highestScore"]')
            };

            // التحقق من وجود العناصر قبل التحديث
            if (elements.totalExams) animateValue(elements.totalExams, totalExams);
            if (elements.averageScore) animateValue(elements.averageScore, averagePercentage);
            if (elements.totalPoints) animateValue(elements.totalPoints, totalPoints);
            if (elements.highestScore) animateValue(elements.highestScore, highestScore);

            // تحديث حالة التغيير
            Object.entries(elements).forEach(([key, element]) => {
                if (element) {
                    const changeElement = element.parentElement.querySelector('.stat-change');
                    if (changeElement) {
                        updateChangeStatus(changeElement, key === 'totalExams' ? totalExams : 
                                                      key === 'averageScore' ? averagePercentage :
                                                      key === 'totalPoints' ? totalPoints : highestScore);
                    }
                }
            });
        }

        function updateChangeStatus(element, value) {
            if (!element) return;
            
            if (value > 0) {
                element.classList.remove('negative', 'neutral');
                element.classList.add('positive');
            } else if (value === 0) {
                element.classList.remove('positive', 'negative');
                element.classList.add('neutral');
            }
        }

        function animateValue(element, endValue) {
            if (!element) return;

            const startValue = 0;
            const duration = 1500;
            const startTime = performance.now();

            function updateNumber(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
                element.textContent = currentValue + (element.hasAttribute('data-percentage') ? '%' : '');

                if (progress < 1) {
                    requestAnimationFrame(updateNumber);
                }
            }

            requestAnimationFrame(updateNumber);
        }

        function updateCharts(examResults) {
            // تحليل الأداء عبر الوقت
            const performanceData = processPerformanceData(examResults);
    const performanceChart = new Chart(
        document.getElementById('performanceChart'),
        {
            type: 'line',
                    data: {
                        labels: performanceData.labels,
                        datasets: [{
                            label: 'نسبة النجاح',
                            data: performanceData.percentages,
                            borderColor: '#0D9488',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            tension: 0.4
                        }]
                    },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        }
    );

            // توزيع الاختبارات
            const examDistribution = processExamDistribution(examResults);
            const distributionChart = new Chart(
                document.getElementById('distributionChart'),
        {
            type: 'doughnut',
                    data: {
                        labels: examDistribution.labels,
                        datasets: [{
                            data: examDistribution.counts,
                            backgroundColor: [
                                '#0D9488',
                                '#0F766E',
                                '#134E4A',
                                '#115E59',
                                '#042F2E'
                            ]
                        }]
                    },
            options: {
                responsive: true,
                        plugins: {
                            legend: {
                                position: 'right',
                                rtl: true
                            }
                }
            }
        }
    );

            // مستوى التقدم
            const progressData = processProgressData(examResults);
    const progressChart = new Chart(
        document.getElementById('progressChart'),
        {
            type: 'radar',
                    data: {
                        labels: progressData.labels,
                        datasets: [{
                            label: 'مستوى الأداء',
                            data: progressData.values,
                            backgroundColor: 'rgba(13, 148, 136, 0.2)',
                            borderColor: '#0D9488',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100
                            }
                        }
                    }
                }
            );
        }

        function processPerformanceData(examResults) {
            const sortedResults = [...examResults].sort((a, b) => a.completedAt - b.completedAt);
            return {
                labels: sortedResults.map(result => formatDate(result.completedAt)),
                percentages: sortedResults.map(result => result.percentage)
            };
        }

        function processExamDistribution(examResults) {
            const distribution = {};
            examResults.forEach(result => {
                const category = result.examTitle || 'غير محدد';
                distribution[category] = (distribution[category] || 0) + 1;
            });

            return {
                labels: Object.keys(distribution),
                counts: Object.values(distribution)
            };
        }

        function processProgressData(examResults) {
            const categories = {
                'الدقة': results => calculateAverage(results.map(r => r.percentage)),
                'السرعة': results => calculateAverage(results.map(r => r.timeEfficiency || 0)),
                'الثبات': results => calculateConsistency(results.map(r => r.percentage)),
                'التحسن': results => calculateImprovement(results)
            };

            const values = Object.values(categories).map(fn => fn(examResults));

            return {
                labels: Object.keys(categories),
                values
            };
        }

        function updateRecentActivities(examResults) {
    const activityList = document.getElementById('activityList');
            activityList.innerHTML = '';

            examResults.slice(0, 5).forEach(result => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                        <i class="fas fa-check-circle"></i>
            </div>
            <div class="activity-info">
                        <p>${result.examTitle}</p>
                        <div class="activity-details">
                            <span class="score">${result.percentage}%</span>
                            <span class="points">${result.totalPoints} نقطة</span>
                            <span class="date">${formatDate(result.completedAt)}</span>
                        </div>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
        }

        // وظائف مساعدة
        function formatDate(date) {
            if (!date) return '-';
            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (days === 0) return 'اليوم';
            if (days === 1) return 'أمس';
            if (days < 7) return `قبل ${days} أيام`;
            if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
            return `قبل ${Math.floor(days / 30)} أشهر`;
        }

        function calculateAverage(numbers) {
            return numbers.length > 0 ? 
                numbers.reduce((sum, num) => sum + num, 0) / numbers.length : 0;
        }

        function calculateConsistency(percentages) {
            if (percentages.length < 2) return 100;
            const variations = percentages.slice(1).map((p, i) => 
                Math.abs(p - percentages[i]));
            const avgVariation = calculateAverage(variations);
            return Math.max(0, 100 - avgVariation);
        }

        function calculateImprovement(results) {
            if (results.length < 2) return 0;
            const first = results[results.length - 1].percentage;
            const last = results[0].percentage;
            return Math.min(100, Math.max(0, ((last - first) / first) * 100));
        }

        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            document.querySelector('.dashboard').prepend(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }

        // Add new function to show temporary messages
        function showMessage(message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'info-message';
            messageDiv.style.cssText = `
                background-color: #e1f0ff;
                color: #3498db;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                text-align: center;
                font-weight: 500;
            `;
            messageDiv.textContent = message;
            document.querySelector('.dashboard').prepend(messageDiv);
            setTimeout(() => messageDiv.remove(), 10000);
        }
    } catch (initError) {
        console.error('Error initializing app:', initError);
        showError('حدث خطأ في تهيئة التطبيق');
    }
});