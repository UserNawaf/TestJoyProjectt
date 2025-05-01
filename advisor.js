document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const loadingDots = 'جاري الكتابة...';
    
    const OPENAI_API_KEY = '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';

    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
        chatMessages.innerHTML = savedMessages;
    }

    const responses = {
        default: [
            'كيف يمكنني مساعدتك في رحلة التعلم الخاصة بك؟',
            'هل لديك أسئلة محددة حول دراستك؟',
            'يمكنني مساعدتك في تحسين مهاراتك الدراسية. ما رأيك أن نبدأ بتحديد أهدافك؟'
        ],
        greeting: [
            'مرحباً بك! كيف يمكنني مساعدتك اليوم؟',
            'أهلاً وسهلاً! أنا هنا لمساعدتك في رحلتك التعليمية',
            'مرحباً! يسعدني أن أكون مستشارك التعليمي اليوم'
        ],
        study: [
            'للمذاكرة الفعالة، أنصحك بتقسيم وقتك وأخذ فترات راحة منتظمة. هل تريد أن أشرح لك طريقة بومودورو؟',
            'من أهم استراتيجيات المذاكرة هي تلخيص ما تتعلمه بأسلوبك الخاص. هل جربت هذه الطريقة من قبل؟',
            'المذاكرة في مجموعات صغيرة يمكن أن تكون مفيدة جداً. هل تفضل الدراسة بمفردك أم مع مجموعة؟'
        ],
        exam: [
            'للتحضير للاختبار، من المهم تنظيم وقتك وتحديد المواضيع الأساسية. هل تريد مساعدة في وضع خطة مراجعة؟',
            'التدرب على أسئلة سابقة يساعد كثيراً في الاستعداد للاختبار. هل تريد نصائح حول كيفية حل الأسئلة بفعالية؟',
            'من المهم أخذ قسط كافٍ من النوم قبل الاختبار. هل تواجه صعوبة في إدارة التوتر قبل الاختبارات؟'
        ],
        thanks: [
            'العفو! سعيد بأنني استطعت المساعدة. هل هناك شيء آخر تريد السؤال عنه؟',
            'شكراً لك! أتمنى أن تكون استفدت من نصائحي. لا تتردد في السؤال إذا احتجت أي مساعدة إضافية',
            'أنا سعيد بمساعدتك! هل هناك جانب آخر تريد أن نركز عليه؟'
        ]
    };

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        // إضافة رسالة المستخدم
        appendMessage('user', userMessage);
        userInput.value = '';

        // إضافة رسالة "جاري الكتابة"
        const loadingMessage = appendMessage('bot', loadingDots);
        
        setTimeout(() => {
            loadingMessage.remove();
            
            // اختيار الرد المناسب
            let response;
            const lowerMessage = userMessage.toLowerCase();
            
            if (lowerMessage.includes('مرحبا') || lowerMessage.includes('السلام') || lowerMessage.includes('اهلا')) {
                response = getRandomResponse('greeting');
            } else if (lowerMessage.includes('مذاكر') || lowerMessage.includes('دراس') || lowerMessage.includes('تعلم')) {
                response = getRandomResponse('study');
            } else if (lowerMessage.includes('اختبار') || lowerMessage.includes('امتحان') || lowerMessage.includes('تحضير')) {
                response = getRandomResponse('exam');
            } else if (lowerMessage.includes('شكر') || lowerMessage.includes('جزاك')) {
                response = getRandomResponse('thanks');
            } else {
                response = getRandomResponse('default');
            }

            appendMessage('bot', response);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    });

    function getRandomResponse(category) {
        const categoryResponses = responses[category];
        const randomIndex = Math.floor(Math.random() * categoryResponses.length);
        return categoryResponses[randomIndex];
    }

    function appendMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // حفظ الرسائل في localStorage
        localStorage.setItem('chatMessages', chatMessages.innerHTML);
        
        return messageDiv;
    }

    const clearButton = document.createElement('button');
    clearButton.textContent = 'مسح المحادثة';
    clearButton.className = 'clear-chat';
    clearButton.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        padding: 8px 16px;
        background-color: #ef4444;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-family: 'Tajawal', sans-serif;
    `;
    
    clearButton.addEventListener('click', () => {
        localStorage.removeItem('chatMessages');
        chatMessages.innerHTML = `
            <div class="message bot">
                <div class="message-content">
                    مرحباً! أنا مستشارك الشخصي من TestJoy. كيف يمكنني مساعدتك اليوم؟
                </div>
            </div>
        `;
    });
    
    document.querySelector('.chat-header').appendChild(clearButton);
}); 