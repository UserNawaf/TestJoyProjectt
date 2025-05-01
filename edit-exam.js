document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    let currentExam = null;

    // صورة الغلاف الافتراضية
    const defaultCoverImages = [
        'https://img.freepik.com/free-vector/online-test-concept-illustration_114360-5565.jpg',
        'https://img.freepik.com/free-vector/online-exam-isometric-concept_1284-17771.jpg',
        'https://img.freepik.com/free-vector/online-exam-illustration_108061-419.jpg',
        'https://img.freepik.com/free-vector/online-test-concept-illustration_23-2148520727.jpg',
        'https://img.freepik.com/free-vector/online-exam-illustration_23-2148520717.jpg'
    ];

    function loadExam() {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        currentExam = exams.find(e => e.id === parseInt(examId));

        if (!currentExam) {
            alert('لم يتم العثور على الاختبار');
            window.location.href = 'home.html';
            return;
        }

        document.getElementById('examTitle').value = currentExam.title;
        document.getElementById('examDescription').value = currentExam.description;
        document.getElementById('examCategory').value = currentExam.category;

        // عرض صورة الغلاف
        const coverUpload = document.getElementById('coverUpload');
        const coverPreview = document.getElementById('coverPreview');
        
        if (currentExam.coverImage) {
            coverPreview.src = currentExam.coverImage;
            coverPreview.hidden = false;
            coverUpload.classList.add('has-image');
        } else {
            // ، اختر صورة عشوائية من الصور الافتراضية
            const randomIndex = Math.floor(Math.random() * defaultCoverImages.length);
            currentExam.coverImage = defaultCoverImages[randomIndex];
            coverPreview.src = currentExam.coverImage;
            coverPreview.hidden = false;
            coverUpload.classList.add('has-image');
        }

        // عرض الأسئلة
        loadQuestions();
    }

    function loadQuestions() {
        const container = document.getElementById('questionsContainer');
        container.innerHTML = '';

        currentExam.questions.forEach((question, index) => {
            const questionCard = createQuestionCard(question, index);
            container.appendChild(questionCard);
        });
    }

    function createQuestionCard(question, index) {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.dataset.index = index;

        let optionsHtml = '';
        switch(question.type) {
            case 'multiple':
                optionsHtml = createMultipleChoiceOptions(question.options, index);
                break;
            case 'true-false':
                optionsHtml = createTrueFalseOptions(question.options, index);
                break;
            case 'short-answer':
                optionsHtml = createShortAnswerOptions(question.options, index);
                break;
        }

        card.innerHTML = `
            <div class="question-header">
                <h4>السؤال ${index + 1}</h4>
                <div class="question-actions">
                    <button type="button" class="delete-question" onclick="deleteQuestion(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="form-group">
                <input type="text" class="question-text" value="${question.question}" 
                       onchange="updateQuestion(${index}, 'question', this.value)">
            </div>
            <div class="question-type">
                <select onchange="updateQuestionType(${index}, this.value)">
                    <option value="multiple" ${question.type === 'multiple' ? 'selected' : ''}>اختيار متعدد</option>
                    <option value="true-false" ${question.type === 'true-false' ? 'selected' : ''}>صح وخطأ</option>
                    <option value="short-answer" ${question.type === 'short-answer' ? 'selected' : ''}>إجابة قصيرة</option>
                </select>
            </div>
            <div class="options-container">
                ${optionsHtml}
            </div>
        `;

        return card;
    }

    // دوال مساعدة لإنشاء خيارات الأسئلة
    function createMultipleChoiceOptions(options, questionIndex) {
        return `
            <div class="multiple-choice-options">
                ${options.map((option, index) => `
                    <div class="option-item">
                        <input type="text" value="${option.text}" 
                               onchange="updateOption(${questionIndex}, ${index}, this.value)">
                        <input type="radio" name="correct_${questionIndex}" 
                               ${option.isCorrect ? 'checked' : ''}
                               onchange="setCorrectOption(${questionIndex}, ${index})">
                        <button type="button" class="delete-option" 
                                onclick="deleteOption(${questionIndex}, ${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
                <button type="button" class="add-option-btn" onclick="addOption(${questionIndex})">
                    <i class="fas fa-plus"></i> إضافة خيار
                </button>
            </div>
        `;
    }

    function createTrueFalseOptions(options, questionIndex) {
        return `
            <div class="true-false-options">
                <label>
                    <input type="radio" name="tf_${questionIndex}" 
                           ${options.correct ? 'checked' : ''}
                           onchange="updateTrueFalse(${questionIndex}, true)"> صح
                </label>
                <label>
                    <input type="radio" name="tf_${questionIndex}" 
                           ${!options.correct ? 'checked' : ''}
                           onchange="updateTrueFalse(${questionIndex}, false)"> خطأ
                </label>
            </div>
        `;
    }

    function createShortAnswerOptions(options, questionIndex) {
        return `
            <div class="short-answer-options">
                <input type="text" placeholder="الإجابة الصحيحة" 
                       value="${options.answer}"
                       onchange="updateShortAnswer(${questionIndex}, this.value)">
                <div class="word-limit">
                    <label>الحد الأقصى للكلمات:</label>
                    <input type="number" value="${options.maxWords}" min="1"
                           onchange="updateWordLimit(${questionIndex}, this.value)">
                </div>
            </div>
        `;
    }

    // تحديث الاختبار
    document.getElementById('editExamForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        const examIndex = exams.findIndex(e => e.id === parseInt(examId));
        
        if (examIndex === -1) return;

        // تحديث البيانات الأساسية والأسئلة
        const updatedExam = {
            ...currentExam,
            title: document.getElementById('examTitle').value,
            description: document.getElementById('examDescription').value,
            category: document.getElementById('examCategory').value,
            lastModified: new Date().toISOString()
        };

        // تأكد من أن كل سؤال له إجابة صحيحة محددة
        updatedExam.questions.forEach(question => {
            switch(question.type) {
                case 'multiple':
                    // تأكد من وجود إجابة صحيحة واحدة على الأقل
                    const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
                    if (!hasCorrectAnswer && question.options.length > 0) {
                        question.options[0].isCorrect = true;
                    }
                    break;
                case 'true-false':
                    // تأكد من تحديد قيمة صح/خطأ
                    if (question.options.correct === undefined) {
                        question.options.correct = true;
                    }
                    break;
                case 'short-answer':
                    // تأكد من وجود إجابة وحد أقصى للكلمات
                    if (!question.options.answer) {
                        question.options.answer = '';
                    }
                    if (!question.options.maxWords) {
                        question.options.maxWords = 50;
                    }
                    break;
            }
        });

        exams[examIndex] = updatedExam;
        localStorage.setItem('exams', JSON.stringify(exams));
        alert('تم حفظ التغييرات بنجاح');
        window.location.href = 'my-exams.html';
    });

    // تحميل الاختبار عند فتح الصفحة
    loadExam();

    window.updateQuestion = function(index, field, value) {
        currentExam.questions[index][field] = value;
    };

    window.updateQuestionType = function(index, type) {
        const question = currentExam.questions[index];
        const oldType = question.type;
        question.type = type;

        // إعادة تهيئة الخيارات بناءً على النوع الجديد
        switch(type) {
            case 'multiple':
                question.options = [
                    { text: 'الإجابة الأولى', isCorrect: true },
                    { text: 'الإجابة الثانية', isCorrect: false },
                    { text: 'الإجابة الثالثة', isCorrect: false },
                    { text: 'الإجابة الرابعة', isCorrect: false }
                ];
                break;
            case 'true-false':
                question.options = { correct: true };
                break;
            case 'short-answer':
                question.options = { 
                    answer: '',
                    maxWords: 50
                };
                break;
        }
        
        loadQuestions();
    };

    window.deleteQuestion = function(index) {
        if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
            currentExam.questions.splice(index, 1);
            loadQuestions();
        }
    };

    // تفعيل زر إضافة الصورة
    const coverUpload = document.getElementById('coverUpload');
    const coverInput = document.getElementById('coverInput');
    const coverPreview = document.getElementById('coverPreview');

    coverUpload.addEventListener('click', () => {
        coverInput.click();
    });

    coverInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                coverPreview.src = e.target.result;
                coverPreview.hidden = false;
                coverUpload.classList.add('has-image');
                currentExam.coverImage = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // إضافة زر لتغيير الصورة الافتراضية
    const changeCoverBtn = document.createElement('button');
    changeCoverBtn.type = 'button';
    changeCoverBtn.className = 'change-cover-btn';
    changeCoverBtn.innerHTML = '<i class="fas fa-random"></i> تغيير الصورة';
    coverUpload.appendChild(changeCoverBtn);

    changeCoverBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // منع تشغيل حدث النقر على coverUpload
        const currentIndex = defaultCoverImages.indexOf(currentExam.coverImage);
        const nextIndex = (currentIndex + 1) % defaultCoverImages.length;
        currentExam.coverImage = defaultCoverImages[nextIndex];
        coverPreview.src = currentExam.coverImage;
        coverPreview.hidden = false;
        coverUpload.classList.add('has-image');
    });

    // تفعيل زر إضافة سؤال جديد
    document.getElementById('addQuestionBtn').addEventListener('click', () => {
        const newQuestion = {
            question: 'سؤال جديد',
            type: 'multiple',
            options: [
                { text: 'الإجابة الأولى', isCorrect: true },
                { text: 'الإجابة الثانية', isCorrect: false },
                { text: 'الإجابة الثالثة', isCorrect: false },
                { text: 'الإجابة الرابعة', isCorrect: false }
            ]
        };
        
        currentExam.questions.push(newQuestion);
        loadQuestions();
    });

    // إضافة دوال التحديث
    window.addOption = function(questionIndex) {
        const question = currentExam.questions[questionIndex];
        if (question.type === 'multiple') {
            question.options.push({
                text: 'خيار جديد',
                isCorrect: false
            });
            loadQuestions();
        }
    };

    window.updateOption = function(questionIndex, optionIndex, value) {
        const question = currentExam.questions[questionIndex];
        question.options[optionIndex].text = value;
    };

    window.setCorrectOption = function(questionIndex, optionIndex) {
        const question = currentExam.questions[questionIndex];
        if (question.type === 'multiple') {
            question.options.forEach((opt, idx) => {
                opt.isCorrect = idx === optionIndex;
            });
        }
    };

    window.deleteOption = function(questionIndex, optionIndex) {
        const question = currentExam.questions[questionIndex];
        question.options.splice(optionIndex, 1);
        loadQuestions();
    };

    window.updateTrueFalse = function(questionIndex, value) {
        const question = currentExam.questions[questionIndex];
        if (question.type === 'true-false') {
            question.options.correct = value;
        }
    };

    window.updateShortAnswer = function(questionIndex, value) {
        const question = currentExam.questions[questionIndex];
        if (question.type === 'short-answer') {
            question.options.answer = value;
        }
    };

    window.updateWordLimit = function(questionIndex, value) {
        const question = currentExam.questions[questionIndex];
        if (question.type === 'short-answer') {
            question.options.maxWords = parseInt(value) || 50;
        }
    };
});