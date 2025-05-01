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
const auth = firebase.auth();

// Default cover images
const defaultCoverImages = [
    'https://img.freepik.com/free-vector/online-test-concept-illustration_114360-5565.jpg',
    'https://img.freepik.com/free-vector/online-exam-isometric-concept_1284-17771.jpg',
    'https://img.freepik.com/free-vector/online-exam-illustration_108061-419.jpg',
    'https://img.freepik.com/free-vector/online-test-concept-illustration_23-2148520727.jpg',
    'https://img.freepik.com/free-vector/online-exam-illustration_23-2148520717.jpg'
];

// Format date helper function
window.formatDate = function(date) {
    if (!date) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ar-SA', options);
};

// Display exams function
window.displayExams = function(exams) {
    const examsContainer = document.getElementById('examsContainer');
    const noExams = document.getElementById('noExams');
    
    if (!examsContainer || !noExams) {
        console.error('Required DOM elements not found');
        return;
    }

    if (exams.length === 0) {
        examsContainer.style.display = 'none';
        noExams.style.display = 'flex';
        noExams.innerHTML = `
            <div class="no-exams-content">
                <i class="fas fa-clipboard-list"></i>
                <h3>لا توجد اختبارات</h3>
                <p>لم يتم العثور على أي اختبارات. قم بإنشاء اختبار جديد للبدء.</p>
                <a href="teacher.html" class="create-exam-btn">
                    <i class="fas fa-plus"></i>
                    إنشاء اختبار جديد
                </a>
            </div>
        `;
        return;
    }

    examsContainer.style.display = 'grid';
    noExams.style.display = 'none';

    examsContainer.innerHTML = exams.map(exam => {
        const coverImage = exam.coverImage || defaultCoverImages[Math.floor(Math.random() * defaultCoverImages.length)];
        
        return `
            <div class="exam-card" data-exam-id="${exam.id}">
                <div class="exam-cover">
                    <img src="${coverImage}" alt="${exam.title}">
                </div>
                <div class="exam-content">
                    <h3 class="exam-title">${exam.title}</h3>
                    <p class="exam-description">${exam.description}</p>
                    <div class="exam-meta">
                        <span>
                            <i class="fas fa-question-circle"></i>
                            ${exam.questions?.length || 0} أسئلة
                        </span>
                        <span>
                            <i class="far fa-calendar"></i>
                            ${window.formatDate(exam.createdAt?.toDate())}
                        </span>
                    </div>
                    <div class="exam-actions">
                        <button class="preview-btn" onclick="window.previewExam('${exam.id}')">
                            <i class="fas fa-eye"></i>
                            معاينة
                        </button>
                        <button class="edit-btn" onclick="window.editExam('${exam.id}')">
                            <i class="fas fa-edit"></i>
                            تعديل
                        </button>
                        <button class="delete-btn" onclick="window.deleteExam('${exam.id}')">
                            <i class="fas fa-trash"></i>
                            حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// Load exams function
window.loadExams = async function() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('لم يتم تسجيل الدخول');
        }

        // Modified query to avoid requiring composite index
        const snapshot = await db.collection('exams')
            .where('teacherId', '==', user.uid)
            .get();

        const exams = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

        // Store exams in memory for search
        window.examsList = exams;
        window.displayExams(exams);
    } catch (error) {
        console.error('Error loading exams:', error);
        const examsContainer = document.getElementById('examsContainer');
        if (examsContainer) {
            examsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${error.message || 'حدث خطأ في تحميل البيانات'}</p>
                    <button onclick="window.loadExams()">إعادة المحاولة</button>
                </div>
            `;
        }
    }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set up auth state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            window.loadExams();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
        }
    });

    // Add search functionality
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'ابحث عن اختبار...';
    
    // Get or create page header
    let pageHeader = document.querySelector('.page-header');
    if (!pageHeader) {
        pageHeader = document.createElement('div');
        pageHeader.className = 'page-header';
        const examsContainer = document.getElementById('examsContainer');
        if (examsContainer) {
            examsContainer.parentNode.insertBefore(pageHeader, examsContainer);
        }
    }
    pageHeader.appendChild(searchInput);

    // Add search handler
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!window.examsList) return;
        
        const filteredExams = window.examsList.filter(exam => 
            exam.title.toLowerCase().includes(searchTerm) ||
            exam.description.toLowerCase().includes(searchTerm)
        );
        
        window.displayExams(filteredExams);
    });
});

// Global functions for exam actions
window.editExam = async function(examId) {
    window.location.href = `teacher.html?examId=${examId}`;
};

window.deleteExam = async function(examId) {
    if (confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
        try {
            await db.collection('exams').doc(examId).delete();
            window.loadExams(); // Reload the exams list
        } catch (error) {
            console.error('Error deleting exam:', error);
            alert('حدث خطأ أثناء حذف الاختبار');
        }
    }
};

window.previewExam = async function(examId) {
    try {
        const examDoc = await db.collection('exams').doc(examId).get();
        if (!examDoc.exists) {
            alert('لم يتم العثور على الاختبار');
            return;
        }

        const exam = examDoc.data();
        
        const previewOverlay = document.createElement('div');
        previewOverlay.className = 'preview-overlay';
        
        const previewContent = document.createElement('div');
        previewContent.className = 'preview-content';
        
        previewContent.innerHTML = `
            <div class="preview-header">
                <h2>${exam.title}</h2>
                <button class="close-preview">×</button>
            </div>
            <div class="preview-body">
                <div class="exam-info">
                    <p class="exam-description">${exam.description}</p>
                    <div class="exam-meta">
                        <span><i class="fas fa-question-circle"></i> ${exam.questions.length} أسئلة</span>
                        <span><i class="far fa-clock"></i> ${exam.questions.length * 2} دقيقة</span>
                    </div>
                </div>
                <div class="questions-preview">
                    ${exam.questions.map((question, index) => `
                        <div class="preview-question">
                            <div class="question-header">
                                <span class="question-number">السؤال ${index + 1}</span>
                                <span class="question-type">${getQuestionTypeName(question.type)}</span>
                            </div>
                            <div class="question-text">${question.question}</div>
                            <div class="options-container">
                                ${renderQuestionOptions(question)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        previewOverlay.appendChild(previewContent);
        document.body.appendChild(previewOverlay);

        const closeButton = previewOverlay.querySelector('.close-preview');
        closeButton.addEventListener('click', () => {
            previewOverlay.remove();
        });

        previewOverlay.addEventListener('click', (e) => {
            if (e.target === previewOverlay) {
                previewOverlay.remove();
            }
        });
    } catch (error) {
        console.error('Error loading exam preview:', error);
        alert('حدث خطأ أثناء تحميل معاينة الاختبار');
    }
};

function getQuestionTypeName(type) {
    const types = {
        'multiple': 'اختيار متعدد',
        'true-false': 'صح وخطأ',
        'checkbox': 'اختيار متعدد (متعدد الإجابات)',
        'short-answer': 'إجابة قصيرة'
    };
    return types[type] || type;
}

function renderQuestionOptions(question) {
    switch(question.type) {
        case 'multiple':
            return question.options.map(option => `
                <div class="option-item">
                    <input type="radio" disabled ${option.isCorrect ? 'checked' : ''}>
                    <span>${option.text}</span>
                    ${option.isCorrect ? '<i class="fas fa-check correct-answer"></i>' : ''}
                </div>
            `).join('');

        case 'checkbox':
            return question.options.map(option => `
                <div class="option-item">
                    <input type="checkbox" disabled ${option.isCorrect ? 'checked' : ''}>
                    <span>${option.text}</span>
                    ${option.isCorrect ? '<i class="fas fa-check correct-answer"></i>' : ''}
                </div>
            `).join('');

        case 'true-false':
            return `
                <div class="option-item">
                    <input type="radio" disabled ${question.options.correct ? 'checked' : ''}>
                    <span>صح</span>
                    ${question.options.correct ? '<i class="fas fa-check correct-answer"></i>' : ''}
                </div>
                <div class="option-item">
                    <input type="radio" disabled ${!question.options.correct ? 'checked' : ''}>
                    <span>خطأ</span>
                    ${!question.options.correct ? '<i class="fas fa-check correct-answer"></i>' : ''}
                </div>
            `;

        case 'short-answer':
            return `
                <div class="short-answer">
                    <p>الإجابة النموذجية: ${question.options.answer}</p>
                    <p>الحد الأقصى للأحرف: ${question.options.maxWords}</p>
                </div>
            `;

        default:
            return '';
    }
}