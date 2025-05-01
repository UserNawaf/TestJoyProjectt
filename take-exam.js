document.addEventListener('DOMContentLoaded', function() {
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
    
    // Initialize Firebase if not already initialized
    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Check authentication state
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            // User is not logged in, redirect to login page
            window.location.href = 'login.html';
            return;
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    let currentExam;
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let examTimer;

    async function loadExam() {
        try {
            const doc = await db.collection('exams').doc(examId).get();
            if (!doc.exists) throw new Error('الاختبار غير موجود');
            
            currentExam = {
                id: doc.id,
                ...doc.data(),
                questions: doc.data().questions.map(q => ({
                    ...q,
                    options: q.options || [] // تأكيد وجود الخيارات
                }))
            };
            
            // Set exam title
            document.getElementById('examTitle').textContent = currentExam.title;
    
            userAnswers = new Array(currentExam.questions.length).fill(null);
            showQuestion(0);
            startTimer();
            
            // Log to verify exam is loaded
            console.log('Exam loaded:', currentExam);
        } catch (error) {
            console.error('Error loading exam:', error);
            alert(error.message);
            window.location.href = 'home.html';
        }
    }

    function startTimer() {
        let timeElapsed = 0;
        const timerElement = document.getElementById('timer');
        
        examTimer = setInterval(() => {
            const minutes = Math.floor(timeElapsed / 60);
            const seconds = timeElapsed % 60;
            
            timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            timeElapsed++;
        }, 1000);
    }

    function showQuestion(index) {
        const container = document.getElementById('questionContainer');
        if (!currentExam?.questions?.[index]) {
            console.error('السؤال غير موجود:', index);
            return;
        }
    
        const question = currentExam.questions[index];
        console.log('عرض السؤال:', question); // للتصحيح
        
        // تحديث عداد الأسئلة
        document.getElementById('questionCounter').textContent = 
            `السؤال ${index + 1} من ${currentExam.questions.length}`;

        let optionsHTML = '';
        
        // التحقق من وجود السؤال وخياراته
        if (!question || !question.options) {
            console.error('خطأ في بيانات السؤال:', question);
            return;
        }

        switch(question.type) {
            case 'multiple':
                optionsHTML = question.options.map((option, i) => `
                    <div class="option ${userAnswers[index] === i ? 'selected' : ''}" data-index="${i}">
                        <input type="radio" name="q${index}" value="${i}" ${userAnswers[index] === i ? 'checked' : ''}>
                        <span>${option.text}</span>
                    </div>
                `).join('');
                break;

            case 'true-false':
                optionsHTML = `
                    <div class="option ${userAnswers[index] === true ? 'selected' : ''}" data-value="true">
                        <input type="radio" name="q${index}" value="true" ${userAnswers[index] === true ? 'checked' : ''}>
                        <span>صح</span>
                    </div>
                    <div class="option ${userAnswers[index] === false ? 'selected' : ''}" data-value="false">
                        <input type="radio" name="q${index}" value="false" ${userAnswers[index] === false ? 'checked' : ''}>
                        <span>خطأ</span>
                    </div>
                `;
                break;

            case 'checkbox':
                if (!Array.isArray(userAnswers[index])) {
                    userAnswers[index] = [];
                }
                
                optionsHTML = question.options.map((option, i) => `
                    <div class="option ${userAnswers[index]?.includes(i) ? 'selected' : ''}" data-index="${i}">
                        <input type="checkbox" ${userAnswers[index]?.includes(i) ? 'checked' : ''}>
                        <span>${option.text}</span>
                    </div>
                `).join('');
                break;

            case 'short-answer':
                optionsHTML = `
                    <div class="short-answer-container">
                        <input type="text" class="short-answer-input" placeholder="اكتب إجابتك هنا" 
                               value="${userAnswers[index] || ''}" maxlength="${question.options.maxWords || 100}">
                    </div>
                `;
                break;
        }

        container.innerHTML = `
            <div class="question">
                <h2 class="question-text">${question.question}</h2>
                <div class="options-container">
                    ${optionsHTML}
                </div>
            </div>
        `;

        // إضافة مستمعي الأحداث للخيارات
        addOptionListeners(question.type, index);
        updateNavigationButtons();

        // Ensure the first option can be selected
        const firstOption = container.querySelector('.option');
        if (firstOption) {
            const firstInput = firstOption.querySelector('input');
            if (firstInput) {
                firstInput.addEventListener('change', function() {
                    if (this.checked) {
                        firstOption.classList.add('selected');
                        userAnswers[index] = parseInt(firstOption.dataset.index);
                        updateNavigationButtons();
                    }
                });
            }
        }
    }

    function addOptionListeners(type, questionIndex) {
        const options = document.querySelectorAll('.option');
        
        options.forEach(option => {
            // إضافة مستمع للنقر على الخيار بأكمله
            option.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                
                const input = this.querySelector('input');
                
                switch(type) {
                    case 'multiple':
                        // إعادة تعيين جميع الخيارات
                        options.forEach(opt => {
                            opt.classList.remove('selected');
                            const optInput = opt.querySelector('input');
                            if (optInput) optInput.checked = false;
                        });
                        
                        // تحديد الخيار المحدد
                        this.classList.add('selected');
                        if (input) {
                            input.checked = true;
                            userAnswers[questionIndex] = parseInt(this.dataset.index);
                        }
                        break;
                        
                    case 'true-false':
                        options.forEach(opt => {
                            opt.classList.remove('selected');
                            opt.querySelector('input').checked = false;
                        });
                        this.classList.add('selected');
                        this.querySelector('input').checked = true;
                        userAnswers[questionIndex] = this.dataset.value === 'true';
                        break;
                        
                    case 'checkbox':
                        const checkboxInput = this.querySelector('input');
                        checkboxInput.checked = !checkboxInput.checked; // Toggle checkbox state
                        this.classList.toggle('selected');
                        
                        if (!Array.isArray(userAnswers[questionIndex])) {
                            userAnswers[questionIndex] = [];
                        }
                        
                        const answerIndex = parseInt(this.dataset.index);
                        
                        if (checkboxInput.checked) {
                            // Add to answers if checked
                            if (!userAnswers[questionIndex].includes(answerIndex)) {
                                userAnswers[questionIndex].push(answerIndex);
                            }
                        } else {
                            // Remove from answers if unchecked
                            userAnswers[questionIndex] = userAnswers[questionIndex].filter(i => i !== answerIndex);
                        }
                        break;
                }
                
                console.log('User answers updated:', userAnswers);
                updateNavigationButtons();
            });

            // إضافة مستمع منفصل للنقر على عنصر الإدخال
            const input = option.querySelector('input');
            if (input) {
                input.addEventListener('click', function(event) {
                    event.stopPropagation(); // منع انتشار الحدث
                    option.click(); // تشغيل حدث النقر على الخيار بأكمله
                });
            }
        });

        // إضافة مستمع للإجابات القصيرة
        const shortAnswerInput = document.querySelector('.short-answer-input');
        if (shortAnswerInput) {
            shortAnswerInput.addEventListener('input', function() {
                userAnswers[questionIndex] = this.value;
                updateNavigationButtons();
            });
        }
    }

    function updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        prevBtn.disabled = currentQuestionIndex === 0;
        
        if (currentQuestionIndex === currentExam.questions.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
            submitBtn.disabled = false; // Always enable the submit button on the last question
            console.log('Submit button displayed and enabled');
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
            
            // Check if current question has an answer
            const currentAnswer = userAnswers[currentQuestionIndex];
            const questionType = currentExam.questions[currentQuestionIndex].type;
            
            let hasAnswer = false;
            
            switch(questionType) {
                case 'multiple':
                    hasAnswer = currentAnswer !== null && currentAnswer !== undefined;
                    break;
                case 'true-false':
                    hasAnswer = currentAnswer === true || currentAnswer === false;
                    break;
                case 'checkbox':
                    hasAnswer = Array.isArray(currentAnswer) && currentAnswer.length > 0;
                    break;
                case 'short-answer':
                    hasAnswer = currentAnswer && currentAnswer.trim().length > 0;
                    break;
            }
            
            nextBtn.disabled = !hasAnswer;
            console.log('Current answer:', currentAnswer, 'Has answer:', hasAnswer);
        }
    }

    // إضافة مستمعي الأحداث للأزرار
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentQuestionIndex < currentExam.questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    });

    document.getElementById('submitBtn').addEventListener('click', () => {
        console.log('Submit button clicked');
        if (confirm('هل أنت متأكد من إنهاء الاختبار؟')) {
            console.log('User confirmed submission');
            clearInterval(examTimer);
            showResults();
        }
    });

    async function showResults() {
        console.log('Showing results');
        try {
            const result = await calculateResult();
            const container = document.getElementById('questionContainer');
            const examHeader = document.querySelector('.exam-header');
            const navigation = document.querySelector('.exam-navigation');

            // إخفاء عناصر الاختبار
            examHeader.style.display = 'none';
            navigation.style.display = 'none';

            // إنشاء محتوى النتائج
            let resultsHTML = `
                <div class="results-container">
                    <div id="messages"></div>
                    <div class="score-summary">
                        <div class="score-circle">
                            <div class="score-number">${result.percentage.toFixed(0)}%</div>
                            <div class="score-text">نسبة النجاح</div>
                        </div>
                        <div class="score-details">
                            <h2>ملخص النتائج</h2>
                            <div class="score-grid">
                                <div class="score-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>الإجابات الصحيحة</span>
                                    <strong>${result.score}/${result.totalQuestions}</strong>
                                </div>
                                <div class="score-item">
                                    <i class="fas fa-star"></i>
                                    <span>النقاط المكتسبة</span>
                                    <strong>${result.totalPoints}</strong>
                                </div>
                                <div class="score-item">
                                    <i class="fas fa-clock"></i>
                                    <span>وقت الإنجاز</span>
                                    <strong>${document.getElementById('timer').textContent}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="results-details">
                        <h2>مراجعة الأسئلة</h2>
                        ${currentExam.questions.map((question, index) => {
                            const isCorrect = checkAnswer(question, userAnswers[index]);
                            return `
                                <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
                                    <div class="question-number">
                                        السؤال ${index + 1}
                                        <span class="question-status">
                                            <i class="fas fa-${isCorrect ? 'check' : 'times'}-circle"></i>
                                            ${isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                                        </span>
                                    </div>
                                    <div class="question-text">${question.question}</div>
                                    <div class="answer-details">
                                        <div class="user-answer ${isCorrect ? 'correct' : 'incorrect'}">
                                            <strong>إجابتك:</strong> ${formatAnswer(question, userAnswers[index])}
                                        </div>
                                        ${!isCorrect ? `
                                            <div class="correct-answer">
                                                <strong>الإجابة الصحيحة:</strong> ${formatCorrectAnswer(question)}
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${question.explanation ? `
                                        <div class="answer-explanation">
                                            <strong>الشرح:</strong> ${question.explanation}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="action-buttons">
                        <button onclick="window.location.href='home.html'" class="home-btn">
                            <i class="fas fa-home"></i>
                            العودة للصفحة الرئيسية
                        </button>
                    </div>
                </div>
            `;

            container.innerHTML = resultsHTML;

            // حفظ النتائج في Firebase
            try {
                await saveResultToFirebase(result);
                showSuccessMessage('تم حفظ النتائج بنجاح');
            } catch (error) {
                console.error('Error saving to Firebase:', error);
                showErrorMessage(error.message);
            }

        } catch (error) {
            console.error('Error showing results:', error);
            showErrorMessage('حدث خطأ في عرض النتائج');
        }
    }

    function showSuccessMessage(message) {
        const messagesDiv = document.getElementById('messages');
        if (messagesDiv) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'result-message success';
            messageDiv.textContent = message;
            messagesDiv.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 3000);
        }
    }

    function showErrorMessage(message) {
        const messagesDiv = document.getElementById('messages');
        if (messagesDiv) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'result-message error';
            messageDiv.textContent = message;
            messagesDiv.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 3000);
        }
    }

    async function saveResultToFirebase(result) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('يجب تسجيل الدخول لحفظ النتائج');

            // Get user data
            const studentDoc = await db.collection('students').doc(user.uid).get();
            if (!studentDoc.exists) {
                throw new Error('لم يتم العثور على بيانات الطالب');
            }
            
            const userData = studentDoc.data();
            const userName = userData?.fullName || 'مستخدم جديد';

            // تحويل الإجابات إلى تنسيق مناسب للتخزين
            const formattedAnswers = userAnswers.map((answer, index) => {
                const question = currentExam.questions[index];
                return {
                    questionId: index + 1,
                    questionText: question.question,
                    userAnswer: answer,
                    isCorrect: checkAnswer(question, answer),
                    correctAnswer: formatCorrectAnswer(question),
                    type: question.type
                };
            });

            // تجهيز بيانات النتيجة
            const resultData = {
                userId: user.uid,
                userName: userName,
                examId: currentExam.id,
                examTitle: currentExam.title,
                score: result.score,
                totalQuestions: result.totalQuestions,
                totalPoints: result.totalPoints,
                percentage: result.percentage,
                answers: formattedAnswers,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // حفظ النتيجة في Firestore
            const resultRef = await db.collection('results').add(resultData);
            console.log('Results saved successfully with ID:', resultRef.id);

            // تحديث إحصائيات الطالب
            const userStats = {
                totalExams: firebase.firestore.FieldValue.increment(1),
                totalPoints: firebase.firestore.FieldValue.increment(result.totalPoints),
                lastExamDate: firebase.firestore.FieldValue.serverTimestamp(),
                examHistory: firebase.firestore.FieldValue.arrayUnion({
                    examId: currentExam.id,
                    examTitle: currentExam.title,
                    score: result.score,
                    totalPoints: result.totalPoints,
                    percentage: result.percentage,
                    completedAt: new Date()
                })
            };

            // تحديث بيانات الطالب
            await db.collection('students').doc(user.uid).update(userStats);

            // تحديث مستوى الطالب بناءً على النقاط الإجمالية
            const updatedStudentDoc = await db.collection('students').doc(user.uid).get();
            const updatedUserData = updatedStudentDoc.data();
            const totalPoints = updatedUserData.totalPoints || 0;
            const newLevel = Math.ceil(totalPoints / 50);

            // تحديث المستوى إذا تغير
            if (newLevel !== (updatedUserData.level || 0)) {
                await db.collection('students').doc(user.uid).update({
                    level: newLevel
                });
            }

            // إضافة تحديث للوحة المتصدرين
            const leaderboardUpdate = {
                userId: user.uid,
                userName: userName,
                totalPoints: totalPoints,
                level: newLevel,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            };

            // تحديث أو إنشاء سجل في لوحة المتصدرين
            await db.collection('leaderboard').doc(user.uid).set(leaderboardUpdate, { merge: true });
            
            return resultRef.id;
        } catch (error) {
            console.error('Error saving results:', error);
            throw new Error('حدث خطأ في حفظ النتائج: ' + error.message);
        }
    }

    function formatAnswer(question, answer) {
        switch(question.type) {
            case 'multiple':
                return answer !== null ? question.options[answer].text : 'لم يتم الإجابة';
            case 'true-false':
                return answer === null ? 'لم يتم الإجابة' : (answer ? 'صح' : 'خطأ');
            case 'checkbox':
                if (!Array.isArray(answer) || answer.length === 0) return 'لم يتم الإجابة';
                return answer.map(i => question.options[i].text).join('، ');
            case 'short-answer':
                return answer || 'لم يتم الإجابة';
            default:
                return 'غير معروف';
        }
    }

    function formatCorrectAnswer(question) {
        switch(question.type) {
            case 'multiple':
                const correctOption = question.options.find(opt => opt.isCorrect);
                return correctOption ? correctOption.text : 'غير محدد';
            case 'true-false':
                return question.options.correct ? 'صح' : 'خطأ';
            case 'checkbox':
                return question.options
                    .filter(opt => opt.isCorrect)
                    .map(opt => opt.text)
                    .join('، ');
            case 'short-answer':
                return question.options.answer;
            default:
                return 'غير معروف';
        }
    }

    async function calculateResult() {
        console.log('Starting to calculate results...');
        let score = 0;
        const totalQuestions = currentExam.questions.length;
        
        userAnswers.forEach((answer, index) => {
            if (checkAnswer(currentExam.questions[index], answer)) score++;
        });
        
        const percentage = (score / totalQuestions) * 100;
        const totalPoints = score * 5; // 5 نقاط لكل إجابة صحيحة

        // تحديث النقاط الإجمالية للمستخدم
        try {
            const user = firebase.auth().currentUser;
            if (user) {
                const userDoc = await db.collection('students').doc(user.uid).get();
                const currentPoints = userDoc.data()?.totalPoints || 0;
                console.log('Current total points:', currentPoints + totalPoints);
            }
        } catch (error) {
            console.error('Error updating total points:', error);
        }
    
        return { score, totalQuestions, percentage, totalPoints };
    }

    function checkAnswer(question, userAnswer) {
        if (userAnswer === null && userAnswer !== false) return false;

        switch(question.type) {
            case 'multiple':
                const correctIndex = question.options.findIndex(opt => opt.isCorrect);
                return correctIndex === userAnswer;
                
            case 'true-false':
                return question.options.correct === userAnswer;
                
            case 'checkbox':
                if (!Array.isArray(userAnswer)) return false;
                const correctAnswers = question.options
                    .map((opt, index) => opt.isCorrect ? index : -1)
                    .filter(index => index !== -1);

                return JSON.stringify(correctAnswers.sort()) === JSON.stringify(userAnswer.sort());
                
            case 'short-answer':
                if (!userAnswer) return false;
                const userAnswerTrimmed = userAnswer.toLowerCase().trim();
                const correctAnswerTrimmed = question.options.answer.toLowerCase().trim();
                return userAnswerTrimmed === correctAnswerTrimmed;
                
            default:
                return false;
        }
    }

    // تحميل الاختبار عند فتح الصفحة
    loadExam();
});