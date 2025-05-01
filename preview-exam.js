document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('preview');
    
    // استرجاع الاختبارات من localStorage
    const exams = JSON.parse(localStorage.getItem('exams') || '[]');
    const exam = exams.find(e => e.id === parseInt(examId));

    if (!exam) {
        alert('لم يتم العثور على الاختبار');
        window.location.href = 'home.html';
        return;
    }

    // عرض معلومات الاختبار
    document.getElementById('examTitle').textContent = exam.title;
    document.getElementById('examDescription').textContent = exam.description;
    document.getElementById('examCategory').innerHTML = `<i class="${getCategoryIcon(exam.category)}"></i> ${getCategoryName(exam.category)}`;
    document.getElementById('questionCount').innerHTML = `<i class="fas fa-question-circle"></i> ${exam.questions.length} أسئلة`;
    
    // تأكد من وجود صورة الغلاف
    const examCover = document.getElementById('examCover');
    if (examCover) {
        examCover.src = exam.coverImage || 'default-cover.jpg';
    }

    // عرض الأسئلة
    const questionsContainer = document.getElementById('questionsContainer');
    exam.questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'preview-question';
        
        let optionsHTML = '';
        switch(question.type) {
            case 'multiple':
                optionsHTML = question.options.map((option, i) => `
                    <div class="option-item">
                        <input type="radio" disabled>
                        <span>${option.text}</span>
                        ${option.isCorrect ? '<i class="fas fa-check correct-answer"></i>' : ''}
                    </div>
                `).join('');
                break;

            case 'true-false':
                optionsHTML = `
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
                break;

            case 'checkbox':
                optionsHTML = question.options.map((option, i) => `
                    <div class="option-item">
                        <input type="checkbox" disabled ${option.isCorrect ? 'checked' : ''}>
                        <span>${option.text}</span>
                        ${option.isCorrect ? '<i class="fas fa-check correct-answer"></i>' : ''}
                    </div>
                `).join('');
                break;

            case 'short-answer':
                optionsHTML = `
                    <div class="short-answer">
                        <p>الإجابة النموذجية: ${question.options.answer}</p>
                        <p>الحد الأقصى للأحرف: ${question.options.maxWords}</p>
                    </div>
                `;
                break;
        }

        questionElement.innerHTML = `
            <div class="question-header">
                <span class="question-number">السؤال ${index + 1}</span>
                <span class="question-type">${getQuestionTypeName(question.type)}</span>
            </div>
            <div class="question-text">${question.question}</div>
            <div class="options-container">
                ${optionsHTML}
            </div>
        `;

        questionsContainer.appendChild(questionElement);
    });
});

function getQuestionTypeName(type) {
    const types = {
        'multiple': 'اختيار متعدد',
        'true-false': 'صح وخطأ',
        'checkbox': 'اختيار متعدد (متعدد الإجابات)',
        'short-answer': 'إجابة قصيرة'
    };
    return types[type] || type;
}

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

function deleteExam() {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const examId = parseInt(urlParams.get('preview'));
    
    // استرجاع الاختبارات وحذف الاختبار المحدد
    let exams = JSON.parse(localStorage.getItem('exams') || '[]');
    exams = exams.filter(exam => exam.id !== examId);
    
    // حفظ التغييرات
    localStorage.setItem('exams', JSON.stringify(exams));
    
    // عرض رسالة نجاح
    alert('تم حذف الاختبار بنجاح');
    
    // العودة إلى الصفحة الرئيسية
    window.location.href = 'home.html#exams-section';
}