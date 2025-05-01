// إضافة تعريف أنواة الأسئلة والفئات في بداية الملف
// تحديث تعريف أنواع الأسئلة
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

// Global variables for edit mode
let isEditMode = false;
let examId = null;

const questionTypes = [
    { id: 'multiple', text: 'اختيار متعدد', icon: 'list-ul' },
    { id: 'true-false', text: 'صح وخطأ', icon: 'check-circle' },
    { id: 'checkbox', text: 'اختيار متعدد (متعدد الإجابات)', icon: 'check-square' },
    { id: 'short-answer', text: 'إجابة قصيرة', icon: 'pencil-alt' },
];

const examCategories = [
    { id: 'programming', name: 'برمجة', icon: 'code' },
    { id: 'languages', name: 'لغات', icon: 'language' },
    { id: 'math', name: 'رياضيات', icon: 'square-root-alt' },
    { id: 'science', name: 'علوم', icon: 'flask' },
    { id: 'technology', name: 'تقنية', icon: 'microchip' },
    { id: 'engineering', name: 'هندسة', icon: 'cogs' }
];

document.addEventListener('DOMContentLoaded', function() {
    // تعريف المتغيرات الرئيسية
    const examForm = document.getElementById('examForm');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const questionsContainer = document.getElementById('questionsContainer');
    const coverUpload = document.getElementById('coverUpload');
    const coverInput = document.getElementById('coverInput');
    const coverPreview = document.getElementById('coverPreview');
    const formTitle = document.getElementById('formTitle');
    const submitBtnText = document.getElementById('submitBtnText');

    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    examId = urlParams.get('examId');
    isEditMode = !!examId;

    // Load existing exam if in edit mode
    if (isEditMode) {
        formTitle.textContent = 'تعديل الاختبار';
        submitBtnText.textContent = 'حفظ التعديلات';
        loadExistingExam(examId);
    }

    // Function to load existing exam
    async function loadExistingExam(examId) {
        try {
            const examDoc = await db.collection('exams').doc(examId).get();
            if (!examDoc.exists) {
                alert('لم يتم العثور على الاختبار');
                window.location.href = 'my-exams.html';
                return;
            }

            const examData = examDoc.data();
            
            // Fill in basic exam info
            document.getElementById('examTitle').value = examData.title;
            document.getElementById('examDescription').value = examData.description;
            document.getElementById('examCategory').value = examData.category;

            // Load cover image if exists
            if (examData.coverImage) {
                coverPreview.style.display = 'block';
                coverPreview.src = examData.coverImage;
                coverUpload.classList.add('has-image');
            }

            // Load questions
            questionsContainer.innerHTML = ''; // Clear existing questions
            examData.questions.forEach(question => {
                const questionCard = createQuestionCard();
                const questionInput = questionCard.querySelector('.question-input');
                const typeSelect = questionCard.querySelector('.question-type-select');

                questionInput.value = question.question;
                typeSelect.value = question.type;
                updateQuestionOptions(questionCard, question.type);

                // Fill in options based on question type
                const optionsContainer = questionCard.querySelector('.question-options');
                switch(question.type) {
                    case 'multiple':
                    case 'checkbox':
                        const optionInputs = optionsContainer.querySelectorAll('.option-input');
                        question.options.forEach((option, index) => {
                            if (optionInputs[index]) {
                                optionInputs[index].querySelector('input[type="text"]').value = option.text;
                                const correctInput = optionInputs[index].querySelector('input[type="radio"], input[type="checkbox"]');
                                if (correctInput) {
                                    correctInput.checked = option.isCorrect;
                                }
                            }
                        });
                        break;
                    case 'true-false':
                        const correctAnswer = question.options.correct;
                        const radioInputs = optionsContainer.querySelectorAll('input[type="radio"]');
                        radioInputs.forEach(input => {
                            input.checked = (input.value === 'true' && correctAnswer) || 
                                          (input.value === 'false' && !correctAnswer);
                        });
                        break;
                    case 'short-answer':
                        const answerInput = optionsContainer.querySelector('input[type="text"]');
                        const maxLengthInput = optionsContainer.querySelector('input[type="number"]');
                        if (answerInput && maxLengthInput) {
                            answerInput.value = question.options.answer;
                            maxLengthInput.value = question.options.maxWords;
                        }
                        break;
                }
                questionsContainer.appendChild(questionCard);
            });
        } catch (error) {
            console.error('Error loading exam:', error);
            alert('حدث خطأ أثناء تحميل الاختبار');
        }
    }

    // تحريك الكروت
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // تعديل معالجة رفع صورة الغلاف
    if (coverUpload && coverInput) {
        coverUpload.addEventListener('click', () => coverInput.click());
        coverInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Force 192x192 dimensions
                    canvas.width = 192;
                    canvas.height = 192;
                    
                    // Center crop calculations
                    const scale = Math.max(192 / img.width, 192 / img.height);
                    const newWidth = img.width * scale;
                    const newHeight = img.height * scale;
                    const offsetX = (newWidth - 192) / 2;
                    const offsetY = (newHeight - 192) / 2;
                    
                    ctx.drawImage(
                        img,
                        -offsetX, -offsetY,
                        newWidth, newHeight
                    );
                    
                    // Update preview
                    coverPreview.style.display = 'block';
                    coverPreview.src = canvas.toDataURL('image/jpeg');
                    coverUpload.classList.add('has-image');
                    
                    // إضافة زر حذف للصورة
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-cover';
                    deleteBtn.innerHTML = '🗑️';
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation(); // منع انتشار الحدث
                        coverPreview.src = '';
                        coverPreview.style.display = 'none';
                        coverInput.value = '';
                        coverUpload.classList.remove('has-image');
                        deleteBtn.remove();
                    };
                    
                    // إزالة زر الحذف القديم إن وجد
                    const oldDeleteBtn = coverUpload.querySelector('.delete-cover');
                    if (oldDeleteBtn) {
                        oldDeleteBtn.remove();
                    }
                    
                    coverUpload.appendChild(deleteBtn);
                };
                img.src = URL.createObjectURL(file);
            }
        });
    }

    // تعديل خيارات الاختيار المتعدد
    function updateQuestionOptions(questionDiv, type) {
        if (!type) return; // Don't update if no type is selected
        
        const optionsContainer = questionDiv.querySelector('.question-options');
        if (!optionsContainer) return; // Don't proceed if container not found
        
        const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
        optionsContainer.innerHTML = '';
    
        switch(type) {
            case 'multiple':
                optionsContainer.innerHTML = `
                    <div class="options-list">
                        ${Array(4).fill(0).map((_, i) => `
                            <div class="option-input">
                                <input type="text" placeholder="الخيار ${i + 1}" required>
                                <input type="radio" name="mc-${uniqueId}" ${i === 0 ? 'checked' : ''} required>
                                <label>الإجابة الصحيحة</label>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
    
            case 'checkbox':
                optionsContainer.innerHTML = `
                    <div class="checkbox-options">
                        ${Array(4).fill(0).map((_, i) => `
                            <div class="option-input">
                                <input type="text" placeholder="الخيار ${i + 1}" required>
                                <input type="checkbox" name="cb-${uniqueId}" ${i === 3 ? 'checked' : ''}>
                                <label>إجابة صحيحة</label>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" class="add-option-btn">
                        <i class="fas fa-plus"></i> إضافة خيار
                    </button>
                `;
                break;
    
            case 'true-false':
                optionsContainer.innerHTML = `
                    <div class="true-false-options">
                        <label class="radio-label">
                            <input type="radio" name="tf-${uniqueId}" value="true" required checked>
                            صح
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="tf-${uniqueId}" value="false" required>
                            خطأ
                        </label>
                    </div>
                `;
                break;
    
            case 'short-answer':
                optionsContainer.innerHTML = `
                    <div class="short-answer">
                        <input type="text" placeholder="الإجابة النموذجية" required>
                        <div class="answer-length">
                            <label>الحد الأقصى للأحرف:</label>
                            <input type="number" value="100" min="1" max="500" required>
                        </div>
                    </div>
                `;
                break;
    
            case 'puzzle':
                optionsContainer.innerHTML = `
                    <div class="puzzle-options">
                        <div class="puzzle-upload">
                            <i class="fas fa-puzzle-piece fa-2x"></i>
                            <p>اضغط لرفع صورة البزل</p>
                            <input type="file" accept="image/*" hidden>
                        </div>
                        <input type="text" placeholder="الإجابة الصحيحة" required>
                    </div>
                `;
                break;

            case 'image':
                optionsContainer.innerHTML = `
                    <div class="image-question">
                        <div class="image-upload">
                            <i class="fas fa-image fa-2x"></i>
                            <p>اضغط لرفع الصورة</p>
                            <input type="file" accept="image/*" hidden>
                        </div>
                        <div class="question-content">
                            <input type="text" class="question-input" placeholder="اكتب السؤال هنا" required>
                            <div class="options-list">
                                ${Array(4).fill(0).map((_, i) => `
                                    <div class="option-input">
                                        <input type="text" placeholder="الخيار ${i + 1}" required>
                                        <input type="radio" name="img-correct-${uniqueId}" ${i === 0 ? 'checked' : ''}>
                                        <label>الإجابة الصحيحة</label>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="add-option-btn">
                                <i class="fas fa-plus"></i> إضافة خيار
                            </button>
                        </div>
                    </div>
                `;
            
                // تهيئة مستمعي الأحداث للصورة
                const imageUpload = optionsContainer.querySelector('.image-upload');
                const fileInput = imageUpload.querySelector('input[type="file"]');
                
                imageUpload.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', handleFileUpload);
                break;
        }

        // إضافة الأحداث المتعلقة برفع الصور
        const fileInputs = optionsContainer.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', handleFileUpload);
        });

        // إضافة الأحداث لزر إضافة خيار
        const addOptionBtns = optionsContainer.querySelectorAll('.add-option-btn');
        addOptionBtns.forEach(btn => {
            btn.addEventListener('click', () => addNewOption(btn.previousElementSibling));
        });
    }

    // إضافة خيار جديد في القائمة
    function addNewOption(optionsContainer) {
        const newOption = document.createElement('div');
        newOption.className = 'option-input';
        const optionNumber = optionsContainer.children.length + 1;
        const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);

        // التحقق ما إذا كان نوع الخيارات checkbox
        const isCheckbox = optionsContainer.classList.contains('checkbox-options');
        
        newOption.innerHTML = `
            <div class="option-row">
                <input type="text" placeholder="أدخل الإجابة" required>
                <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="${isCheckbox ? 'cb-' : 'mc-'}${uniqueId}">
                <label>الإجابة ${isCheckbox ? 'صحيحة' : 'الصحيحة'}</label>
                <button type="button" class="delete-option-btn" onclick="deleteOption(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        optionsContainer.appendChild(newOption);
    }

    // معالجة عملية رفع الصورة
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const uploadContainer = event.target.parentElement;
                
                // إزالة الصورة القديمة إن وجدت
                const existingImageContainer = uploadContainer.querySelector('.image-container');
                if (existingImageContainer) {
                    existingImageContainer.remove();
                }
            
                // إنشاء حاوية الصورة الجديدة
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
            
                // إنشاء عنصر الصورة
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'uploaded-image';
                img.style.width = '100px';  // تحديد العرض
                img.style.height = '100px'; // تحديد الارتفاع
                img.style.objectFit = 'cover';
            
                // إنشاء زر الحذف
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-image';
                deleteBtn.innerHTML = '×';
                deleteBtn.onclick = function(e) {
                    e.stopPropagation(); // منع انتشار الحدث
                    imageContainer.remove();
                    event.target.value = ''; // إعادة تعيين قيمة input
                    const uploadText = uploadContainer.querySelector('p');
                    if (uploadText) {
                        uploadText.textContent = 'اضغط لرفع الصورة';
                    }
                };
            
                // إضافة العناصر للحاوية
                imageContainer.appendChild(img);
                imageContainer.appendChild(deleteBtn);
                uploadContainer.appendChild(imageContainer);
            
                // تحديث نص الرفع
                const uploadText = uploadContainer.querySelector('p');
                if (uploadText) {
                    uploadText.textContent = file.name;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    // تعديل دالة إضافة سؤال جديد
    if (addQuestionBtn && questionsContainer) {
        addQuestionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // التحقق من وجود سؤال سابق وإكماله
            const questions = questionsContainer.querySelectorAll('.question-card');
            const lastQuestion = questions[questions.length - 1];
            
            if (lastQuestion) {
                const questionInput = lastQuestion.querySelector('.question-input');
                const options = lastQuestion.querySelectorAll('.option-input input[type="text"]');
                let isComplete = true;

                // التحقق من إدخال السؤال
                if (!questionInput.value.trim()) {
                    isComplete = false;
                }

                // التحقق من إدخال الخيارات
                options.forEach(option => {
                    if (!option.value.trim()) {
                        isComplete = false;
                    }
                });

                if (!isComplete) {
                    alert('الرجاء إكمال السؤال الحالي قبل إضافة سؤال جديد');
                    return;
                }
            }

            // إضافة سؤال جديد
            const newQuestion = createQuestionCard();
            questionsContainer.appendChild(newQuestion);
            newQuestion.scrollIntoView({ behavior: 'smooth' });
            initializeQuestionCard(newQuestion);
            updateQuestionNumbers();
        });
    }

    // دالة تهيئة بطاقة السؤال
    function initializeQuestionCard(card) {
        const typeSelect = card.querySelector('.question-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                updateQuestionOptions(card, typeSelect.value);
            });
        }
    }

    // تحديث أرقام الأسئلة
    function updateQuestionNumbers() {
        const questions = questionsContainer.querySelectorAll('.question-card');
        questions.forEach((question, index) => {
            const numberSpan = question.querySelector('.question-number');
            if (numberSpan) {
                numberSpan.textContent = `السؤال ${index + 1}`;
            }
        });
    }

    // إضافة أحداث لتحميل صورة الغلاف عند النقر
    if (coverUpload && coverInput) {
        coverUpload.addEventListener('click', () => coverInput.click());
        coverInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    coverPreview.src = e.target.result;
                    coverPreview.hidden = false;
                    coverUpload.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // إضافة معالج تقديم النموذج
    if (examForm) {
        examForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submitted');
            
            // التحقق من اختيار الفئة
            const categorySelect = document.getElementById('examCategory');
            if (categorySelect && !categorySelect.value) {
                alert('الرجاء اختيار فئة الاختبار');
                categorySelect.focus();
                return;
            }

            // التحقق من الأسئلة
            const questions = questionsContainer.querySelectorAll('.question-card');
            if (questions.length === 0) {
                alert('الرجاء إضافة سؤال واحد على الأقل');
                return;
            }

            let isValid = true;
            questions.forEach((question, index) => {
                // التحقق من إدخال نص السؤال
                const questionInput = question.querySelector('.question-input');
                if (!questionInput.value.trim()) {
                    alert(`الرجاء إدخال نص السؤال رقم ${index + 1}`);
                    isValid = false;
                    return;
                }

                // التحقق من الخيارات والإجابة الصحيحة
                const questionType = question.querySelector('.question-type-select').value;
                if (questionType === 'multiple') {
                    const options = question.querySelectorAll('.option-input input[type="text"]');
                    const correctAnswer = question.querySelector('.option-input input[type="radio"]:checked');
                    
                    if (!correctAnswer) {
                        alert(`الرجاء تحديد الإجابة الصحيحة للسؤال رقم ${index + 1}`);
                        isValid = false;
                        return;
                    }

                    options.forEach((option, optIndex) => {
                        if (!option.value.trim()) {
                            alert(`الرجاء إدخال نص الخيار ${optIndex + 1} للسؤال رقم ${index + 1}`);
                            isValid = false;
                            return;
                        }
                    });
                }
            });

            if (!isValid) {
                return;
            }

            try {
                await saveExam(e);
            } catch (error) {
                console.error('Error in form submission:', error);
                alert('حدث خطأ أثناء حفظ الاختبار');
            }
        });
    }
});

// دالة مساعدة للحصول على خيارات السؤال
function getQuestionOptions(questionCard) {
    const type = questionCard.querySelector('.question-type-select').value;
    const optionsContainer = questionCard.querySelector('.question-options');
    
    switch(type) {
        case 'multiple':
            return Array.from(optionsContainer.querySelectorAll('.option-input')).map(option => ({
                text: option.querySelector('input[type="text"]').value,
                isCorrect: option.querySelector('input[type="radio"]').checked
            }));
        case 'checkbox':
            return Array.from(optionsContainer.querySelectorAll('.option-input')).map(option => ({
                text: option.querySelector('input[type="text"]').value,
                isCorrect: option.querySelector('input[type="checkbox"]').checked
            }));
        case 'true-false':
            const trueRadio = optionsContainer.querySelector('input[value="true"]');
            return {
                correct: trueRadio ? trueRadio.checked : false
            };
        case 'short-answer':
            return {
                answer: optionsContainer.querySelector('input[type="text"]').value,
                maxWords: parseInt(optionsContainer.querySelector('input[type="number"]').value)
            };
        case 'puzzle':
            const uploadedImage = optionsContainer.querySelector('.uploaded-image');
            return {
                image: uploadedImage ? uploadedImage.src : '',
                answer: optionsContainer.querySelector('input[type="text"]').value
            };
        case 'image':
            return Array.from(optionsContainer.querySelectorAll('.option-input')).map(option => ({
                text: option.querySelector('input[type="text"]').value,
                isCorrect: option.querySelector('input[type="radio"]').checked
            }));
        default:
            return [];
    }
}

// دالة حذف الخيار
function deleteOption(button) {
    const optionInput = button.closest('.option-input');
    const optionsList = optionInput.parentElement;
    
    // لا تسمح بحذف الخيار إذا كان الوحيد المتبقي
    if (optionsList.children.length > 1) {
        optionInput.remove();
    } else {
        alert('يجب أن يحتوي السؤال على خيار واحد على الأقل');
    }
}

// دالة إضافة خيار جديد
function addNewOption(optionsList) {
    const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
    const newOption = document.createElement('div');
    newOption.className = 'option-input';
    
    // التحقق ما إذا كان نوع الخيارات checkbox
    const isCheckbox = optionsList.classList.contains('checkbox-options');
    
    newOption.innerHTML = `
        <div class="option-row">
            <input type="text" placeholder="أدخل الإجابة" required>
            <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="${isCheckbox ? 'cb-' : 'mc-'}${uniqueId}">
            <label>الإجابة ${isCheckbox ? 'صحيحة' : 'الصحيحة'}</label>
            <button type="button" class="delete-option-btn" onclick="deleteOption(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    optionsList.appendChild(newOption);
}

// دالة إنشاء بطاقة سؤال جديدة
function createQuestionCard() {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML = `
        <div class="question-header">
            <span class="question-number"></span>
            <select class="question-type-select" required>
                <option value="">اختر نوع السؤال</option>
                ${questionTypes.map(type => 
                    `<option value="${type.id}">${type.text}</option>`
                ).join('')}
            </select>
            <button type="button" class="delete-question-btn">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="question-content">
            <input type="text" class="question-input" placeholder="اكتب السؤال هنا" required>
            <div class="question-options"></div>
        </div>
    `;

    // Add event listeners
    const typeSelect = card.querySelector('.question-type-select');
    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                updateQuestionOptions(card, e.target.value);
            }
        });
    }
    
    const deleteBtn = card.querySelector('.delete-question-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            card.remove();
            updateQuestionNumbers();
        });
    }

    return card;
}

// دالة حفظ الاختبار
async function saveExam(event) {
    event.preventDefault();
    
    try {
        const examData = {
            title: document.getElementById('examTitle').value,
            description: document.getElementById('examDescription').value,
            category: document.getElementById('examCategory').value,
            questions: [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Get questions data
        const questionCards = document.querySelectorAll('.question-card');
        questionCards.forEach(card => {
            const questionData = getQuestionData(card);
            if (questionData) {
                examData.questions.push(questionData);
            }
        });

        // Handle cover image
        if (coverPreview.src && !coverPreview.src.includes('blob:')) {
            examData.coverImage = coverPreview.src;
        }

        // Add or update exam in Firestore
        if (isEditMode) {
            await db.collection('exams').doc(examId).update(examData);
            alert('تم تحديث الاختبار بنجاح');
        } else {
            examData.teacherId = auth.currentUser.uid;
            examData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('exams').add(examData);
            alert('تم إنشاء الاختبار بنجاح');
        }

        // Redirect to my-exams page
        window.location.href = 'my-exams.html';
    } catch (error) {
        console.error('Error saving exam:', error);
        alert('حدث خطأ أثناء حفظ الاختبار');
    }
}

// Helper function to get question data from a card
function getQuestionData(card) {
    const questionInput = card.querySelector('.question-input');
    const typeSelect = card.querySelector('.question-type-select');
    const optionsContainer = card.querySelector('.question-options');

    if (!questionInput || !typeSelect || !optionsContainer) return null;

    const questionType = typeSelect.value;
    const questionText = questionInput.value;

    let options;
    switch(questionType) {
        case 'multiple':
        case 'checkbox':
            options = Array.from(optionsContainer.querySelectorAll('.option-input')).map(option => ({
                text: option.querySelector('input[type="text"]').value,
                isCorrect: option.querySelector('input[type="radio"], input[type="checkbox"]').checked
            }));
            break;
        case 'true-false':
            const trueRadio = optionsContainer.querySelector('input[value="true"]');
            options = { correct: trueRadio.checked };
            break;
        case 'short-answer':
            options = {
                answer: optionsContainer.querySelector('input[type="text"]').value,
                maxWords: parseInt(optionsContainer.querySelector('input[type="number"]').value)
            };
            break;
    }

    return {
        question: questionText,
        type: questionType,
        options: options
    };
}

function resetForm() {
    examForm.reset();
    questionsContainer.innerHTML = '';
    coverPreview.src = '';
    coverPreview.style.display = 'none';
    coverUpload.classList.remove('has-image');
}

function updateDashboardStats() {
    const exams = JSON.parse(localStorage.getItem('exams') || '[]');
    const examCountElement = document.querySelector('.dashboard-card:first-child p');
    if (examCountElement) {
        examCountElement.textContent = `${exams.length} اختبار`;
    }
}