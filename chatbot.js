class MotoChatBot {
    constructor(options = {}) {
        this.config = {
            // Настройки ИИ (опционально)
            aiProvider: options.aiProvider || 'backend', // 'backend' | 'local' | 'openai' | 'gemini'
            apiEndpoint: options.apiEndpoint || '/api/chat',
            apiKey: options.apiKey || '',
            model: options.model || 'gpt-3.5-turbo',
            
            // UI настройки
            position: options.position || 'bottom-right',
            welcomeMessage: options.welcomeMessage || 
                'Привет! 👋 Я ИИ-помощник MotoAuction. Помогу подобрать мотоцикл, расскажу про аукционы и отвечу на вопросы. Чем помочь?',
            botName: options.botName || 'MotoBot',
            botAvatar: options.botAvatar || '🏍️'
        };
        
        this.messages = [];
        this.isOpen = false;
        this.isTyping = false;
        
        this.init();
    }
    
    init() {
        this.createWidget();
        this.attachEvents();
        this.loadHistory();
    }
    
    createWidget() {
        // Кнопка открытия чата
        const button = document.createElement('button');
        button.className = 'moto-chat-button';
        button.id = 'motoChatButton';
        button.type = 'button';
        button.setAttribute('aria-label', 'Открыть чат MotoBot');
        button.setAttribute('aria-controls', 'motoChatWindow');
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = `
            <i class="fas fa-comment-dots"></i>
            <span class="chat-button-label">Есть вопрос?</span>
            <span class="chat-badge" id="chatBadge" style="display:none;">1</span>
        `;
        
        // Окно чата
        const window = document.createElement('div');
        window.className = 'moto-chat-window';
        window.id = 'motoChatWindow';
        window.innerHTML = `
            <div class="moto-chat-header">
                <div class="moto-chat-header-info">
                    <div class="moto-chat-avatar">${this.config.botAvatar}</div>
                    <div>
                        <div class="moto-chat-name">${this.config.botName}</div>
                        <div class="moto-chat-status">
                            <span class="status-dot"></span> ИИ-помощник · обычно отвечает быстро
                        </div>
                    </div>
                </div>
                <div class="moto-chat-header-actions">
                    <button class="moto-chat-clear" id="motoChatClear" title="Очистить историю">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="moto-chat-close" id="motoChatClose" title="Закрыть">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="moto-chat-welcome">
                <span class="welcome-eyebrow"><i class="fas fa-sparkles"></i> MotoAuction AI</span>
                <div class="welcome-title">Поможем найти <span>твой мотоцикл</span></div>
                <p>Спроси про аукционы, ставки, доставку или продажу.</p>
            </div>
            <div class="moto-chat-messages" id="motoChatMessages" role="log" aria-live="polite" aria-label="Сообщения чата"></div>
            
            <div class="moto-chat-quick-replies" id="motoChatQuickReplies">
                <button class="quick-reply" data-text="Как купить мотоцикл?">Как купить?</button>
                <button class="quick-reply" data-text="Сколько стоят ваши услуги?">Цены</button>
                <button class="quick-reply" data-text="Как выставить свой мотоцикл на аукцион?">Продать мотоцикл</button>
                <button class="quick-reply" data-text="Какие гарантии?">Гарантии</button>
            </div>
            
            <form class="moto-chat-input-area" id="motoChatForm">
                <input 
                    type="text" 
                    class="moto-chat-input" 
                    id="motoChatInput" 
                    placeholder="Напишите сообщение..." 
                    autocomplete="off"
                    aria-label="Ваше сообщение"
                    maxlength="2000"
                    required
                >
                <button type="submit" class="moto-chat-send" id="motoChatSend">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        `;
        
        document.body.appendChild(button);
        document.body.appendChild(window);
    }
    
    attachEvents() {
        const button = document.getElementById('motoChatButton');
        const closeBtn = document.getElementById('motoChatClose');
        const clearBtn = document.getElementById('motoChatClear');
        const form = document.getElementById('motoChatForm');
        const input = document.getElementById('motoChatInput');
        
        button.addEventListener('click', () => this.toggle());
        closeBtn.addEventListener('click', () => this.close());
        clearBtn.addEventListener('click', () => this.clearHistory());
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                this.sendMessage(text);
                input.value = '';
            }
        });
        
        // Быстрые ответы
        document.querySelectorAll('.quick-reply').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sendMessage(btn.dataset.text);
            });
        });
        
        // Esc закрывает чат
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }
    
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
    
    open() {
        this.isOpen = true;
        document.getElementById('motoChatWindow').classList.add('active');
        document.getElementById('motoChatButton').setAttribute('aria-expanded', 'true');
        document.getElementById('motoChatButton').classList.add('active');
        document.getElementById('chatBadge').style.display = 'none';
        
        // Приветствие при первом открытии
        if (this.messages.length === 0) {
            this.addMessage('bot', this.config.welcomeMessage);
        }
        
        setTimeout(() => {
            document.getElementById('motoChatInput').focus();
        }, 300);
    }
    
    close() {
        this.isOpen = false;
        document.getElementById('motoChatWindow').classList.remove('active');
        document.getElementById('motoChatButton').setAttribute('aria-expanded', 'false');
        document.getElementById('motoChatButton').classList.remove('active');
    }
    
    addMessage(role, text, save = true) {
        const messagesContainer = document.getElementById('motoChatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `moto-chat-message ${role}`;
        
        const time = new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageEl.innerHTML = `
            <div class="message-bubble">
                <div class="message-text">${this.formatMessage(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        if (save) {
            this.messages.push({ role, text, time });
            this.saveHistory();
        }
    }
    
    formatMessage(text) {
        // Экранирование HTML
        let safe = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Форматирование
        safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/\n/g, '<br>');
        safe = safe.replace(/•/g, '&bull;');
        
        return safe;
    }
    
    showTyping() {
        this.isTyping = true;
        const messagesContainer = document.getElementById('motoChatMessages');
        const typingEl = document.createElement('div');
        typingEl.className = 'moto-chat-message bot typing-message';
        typingEl.setAttribute('aria-label', 'MotoBot печатает');
        typingEl.id = 'typingIndicator';
        typingEl.innerHTML = `
            <div class="message-bubble">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    hideTyping() {
        this.isTyping = false;
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }
    
    async sendMessage(text) {
        if (this.isTyping) return;
        this.addMessage('user', text);
        const sendButton = document.getElementById('motoChatSend');
        if (sendButton) sendButton.disabled = true;
        
        // Показываем индикатор набора
        this.showTyping();
        
        try {
            let response;
            
            if (this.config.aiProvider === 'backend') {
                response = await this.askBackend(text);
            } else if (this.config.aiProvider === 'openai' && this.config.apiKey) {
                response = await this.askOpenAI(text);
            } else if (this.config.aiProvider === 'gemini' && this.config.apiKey) {
                response = await this.askGemini(text);
            } else {
                // Локальный бот с небольшой задержкой для реалистичности
                await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
                response = this.getLocalResponse(text);
            }
            
            this.hideTyping();
            this.addMessage('bot', response);
            
        } catch (error) {
            this.hideTyping();
            this.addMessage('bot', 
                '😔 Извините, произошла ошибка. Попробуйте переформулировать вопрос или повторите позже.'
            );
            console.error('ChatBot error:', error);
        } finally {
            if (sendButton) sendButton.disabled = false;
            const input = document.getElementById('motoChatInput');
            if (input && this.isOpen) input.focus();
        }
    }
    
    /* ========== БЕЗОПАСНОЕ ПОДКЛЮЧЕНИЕ ИИ ЧЕРЕЗ СЕРВЕР ========== */

    async askBackend(userMessage) {
        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                message: userMessage,
                history: this.messages
                    .filter(m => m.role === 'user' || m.role === 'bot')
                    .slice(-10)
                    .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))
            })
        });
        if (!response.ok) throw new Error(`Chat endpoint error: ${response.status}`);
        const data = await response.json();
        if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
            throw new Error('Invalid reply from chat endpoint');
        }
        return data.reply.trim();
    }

    /* ========== ЛОКАЛЬНЫЙ БОТ (база знаний) ========== */
    
    getLocalResponse(text) {
        const q = text.toLowerCase().trim();
        
        // База знаний: массив { keywords: [], answer: '' }
        const knowledge = [
            {
                keywords: ['привет', 'здравствуй', 'хай', 'добрый', 'hello', 'hi'],
                answer: 'Привет! 👋 Рад помочь! Спросите меня про:\n• Как купить мотоцикл\n• Цены и комиссии\n• Как продать мотоцикл\n• Гарантии и доставку'
            },
            {
                keywords: ['как купить', 'покупк', 'приобрест', 'хочу купить'],
                answer: '🛒 **Как купить мотоцикл:**\n1. Зарегистрируйтесь на сайте\n2. Выберите понравившийся лот в каталоге\n3. Сделайте ставку (должна быть выше текущей цены)\n4. Следите за аукционом до его окончания\n5. Если вы победили — оплатите лот в течение 3 дней\n\nЕсть вопросы по конкретному мотоциклу?'
            },
            {
                keywords: ['цена', 'стоимость', 'сколько стоит', 'комисси', 'услуг', 'прайс'],
                answer: '💰 **Наши услуги:**\n• **50 000 ₽** — мотоциклы до 1 млн ₽\n• **70 000 ₽** — мотоциклы от 1 до 2,5 млн ₽\n• **100 000 ₽** — мотоциклы от 2,5 млн ₽\n\nКомиссия аукциона MotoAuction — 5% от стоимости лота.\n\nНикаких скрытых платежей! 🚫'
            },
            {
                keywords: ['продать', 'выставить', 'создать лот', 'разместить'],
                answer: '🏍️ **Как продать мотоцикл:**\n1. Войдите в аккаунт\n2. Перейдите в «Создать лот»\n3. Заполните данные: марку, модель, год, цену\n4. Загрузите до 10 фотографий\n5. Отправьте на модерацию\n\nПосле проверки администратором лот появится на сайте. Обычно проверка занимает до 24 часов ⏱️'
            },
            {
                keywords: ['гаранти', 'безопасн', 'защит', 'обман', 'мошенник'],
                answer: '🛡️ **Гарантии безопасности:**\n• Все лоты проходят модерацию\n• Проверка пользователей\n• Система жалоб на подозрительные лоты\n• Защита сделок\n• Возможность вернуть деньги при нарушении условий\n\nЕсли столкнулись с проблемой — нажмите «Пожаловаться» на странице лота 🚩'
            },
            {
                keywords: ['доставк', 'отправк', 'привез', 'срок'],
                answer: '🚚 **Доставка:**\n• Автовозом по РФ\n• Железной дорогой\n• Морским транспортом\n\nСроки зависят от региона и способа доставки. Точную стоимость и сроки рассчитает менеджер. Оставьте заявку на сайте или напишите нам! 📞'
            },
            {
                keywords: ['регистрац', 'аккаунт', 'зарегистр', 'создать аккаунт'],
                answer: '📝 **Регистрация:**\n1. Нажмите «Регистрация» в правом верхнем углу\n2. Укажите имя, email, телефон и пароль\n3. Готово! Теперь вы можете делать ставки и создавать лоты\n\nЭто займёт меньше минуты ⏱️'
            },
            {
                keywords: ['ставк', 'bid', 'торг', 'аукцион как'],
                answer: '⚡ **Как сделать ставку:**\n1. Откройте карточку лота\n2. Введите сумму (минимум — текущая цена + 100 ₽)\n3. Нажмите «Сделать ставку»\n\nСтавки окончательные, отменить их нельзя. Победитель определяется по окончании аукциона 🏆'
            },
            {
                keywords: ['модерац', 'проверк', 'одобр', 'pending'],
                answer: '⏳ **Модерация лотов:**\nВсе новые лоты проверяются администратором. Обычно это занимает **до 24 часов**. Если лот отклонён — вы получите уведомление с причиной. Если одобрен — он появится в каталоге ✅'
            },
            {
                keywords: ['оплат', 'оплатить', 'платёж', 'платеж', 'деньги'],
                answer: '💳 **Оплата:**\n• Победитель оплачивает лот в течение 3 дней\n• Способы: банковская карта, перевод\n• Комиссия аукциона — 5%\n\nЕсли не оплатить вовремя — аккаунт может быть заблокирован ⚠️'
            },
            {
                keywords: ['контакт', 'связаться', 'телефон', 'поддержк', 'помощь'],
                answer: '📞 **Контакты:**\n• Телефон: +7 (909) 340-70-08\n• Email: egorte2008@email.com\n• Адрес: г. Саратов, ул. Дубовая 52, д. 67\n• Режим работы: Пн-Пт 10:00-19:00, Сб 11:00-16:00'
            },
            {
                keywords: ['япони', 'китай', 'корея', 'аукцион япон', 'аукцион japan'],
                answer: '🌏 **Аукционы Японии, Китая и Кореи:**\nМы работаем напрямую с аукционами этих стран. Это даёт:\n• Выгоду до 35% 💰\n• Прозрачную историю (аукционные листы)\n• Идеальное состояние мотоциклов\n• Полное сопровождение под ключ\n\nХотите узнать стоимость конкретного мотоцикла? Напишите нам!'
            },
            {
                keywords: ['гарантия сохран', 'поврежд', 'транспортировк'],
                answer: '📦 **Гарантия сохранности:**\nУслуга стоимостью 1% от стоимости мотоцикла. Если во время транспортировки будут повреждения — мы возместим ущерб 💪'
            },
            {
                keywords: ['предоплат', 'аванс', 'первый платёж'],
                answer: '💵 **Предоплата:**\nВносится в размере нашей комиссии (от 50 000 ₽). Остальное — поэтапно:\n1. Инвойс за мотоцикл\n2. Таможенные платежи\n3. Брокерские услуги'
            },
            {
                keywords: ['спасибо', 'благодар', 'thanks'],
                answer: 'Пожалуйста! 😊 Рад был помочь. Если появятся ещё вопросы — обращайтесь!'
            },
            {
                keywords: ['пока', 'до свидан', 'bye'],
                answer: 'До свидания! 👋 Удачных покупок на MotoAuction!'
            }
        ];
        
        // Поиск по ключевым словам
        for (const item of knowledge) {
            for (const keyword of item.keywords) {
                if (q.includes(keyword)) {
                    return item.answer;
                }
            }
        }
        
        // Ответы по умолчанию
        const fallbacks = [
            'Хм, не совсем понял вопрос. 🤔 Попробуйте спросить про:\n• Покупку мотоцикла\n• Цены и комиссии\n• Продажу мотоцикла\n• Гарантии\n• Доставку',
            'Извините, я ещё учусь. 😅 Могу помочь с вопросами про аукционы, цены, покупку и продажу мотоциклов. Что вас интересует?',
            'Не уверен, что правильно понял. Можете переформулировать? А пока вот что я умею:\n• Расскажу про цены\n• Помогу с покупкой/продажей\n• Объясню про гарантии',
            'Я пока не знаю ответа на этот вопрос 😔 Но вы можете связаться с поддержкой: +7 (909) 340-70-08. Или спросите меня про покупку, продажу, цены и гарантии!'
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
    
    /* ========== ИНТЕГРАЦИЯ С OPENAI ========== */
    
    async askOpenAI(userMessage) {
        const systemPrompt = `Ты — MotoBot, дружелюбный ИИ-помощник сайта MotoAuction (аукцион мотоциклов из Японии, Китая и Кореи).
        
Отвечай кратко (до 150 слов), дружелюбно, используй эмодзи. Отвечай ТОЛЬКО на русском.

Информация о компании:
- Услуги: 50 000 ₽ (до 1 млн), 70 000 ₽ (1-2,5 млн), 100 000 ₽ (от 2,5 млн)
- Комиссия аукциона: 5%
- Доставка: автовоз, ЖД, море
- Телефон: +7 (909) 340-70-08
- Email: egorte2008@email.com
- Адрес: г. Саратов, ул. Дубовая 52, д. 67
- Режим работы: Пн-Пт 10:00-19:00, Сб 11:00-16:00
- Гарантия сохранности: 1% от стоимости
- Предоплата: от 50 000 ₽ (комиссия)

Если не знаешь ответ — предложи связаться с поддержкой.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...this.messages.slice(-7).map(m => ({
                        role: m.role === 'bot' ? 'assistant' : 'user',
                        content: m.text
                    }))
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    /* ========== ИНТЕГРАЦИЯ С GOOGLE GEMINI ========== */
    
    async askGemini(userMessage) {
        const systemPrompt = `Ты — MotoBot, дружелюбный ИИ-помощник сайта MotoAuction (аукцион мотоциклов из Японии, Китая и Кореи). Отвечай кратко (до 150 слов), дружелюбно, используй эмодзи. Отвечай только на русском.

Ключевая информация:
- Услуги: 50 000 ₽ (до 1 млн), 70 000 ₽ (1-2,5 млн), 100 000 ₽ (от 2,5 млн)
- Комиссия аукциона: 5%
- Телефон: +7 (909) 340-70-08, Email: egorte2008@email.com
- Адрес: г. Саратов, ул. Дубовая 52, д. 67
- Гарантия сохранности: 1% от стоимости`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${systemPrompt}\n\nПользователь: ${userMessage}` }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 300
                    }
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
    
    /* ========== СОХРАНЕНИЕ ИСТОРИИ ========== */
    
    saveHistory() {
        try {
            localStorage.setItem('motoChatHistory', JSON.stringify(this.messages.slice(-30)));
        } catch (e) {
            console.warn('Не удалось сохранить историю чата');
        }
    }
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('motoChatHistory');
            if (saved) {
                this.messages = JSON.parse(saved);
                // Не отображаем сразу — покажем при открытии
                this.messages.forEach(m => {
                    const container = document.getElementById('motoChatMessages');
                    const time = m.time || '';
                    const el = document.createElement('div');
                    el.className = `moto-chat-message ${m.role}`;
                    el.innerHTML = `
                        <div class="message-bubble">
                            <div class="message-text">${this.formatMessage(m.text)}</div>
                            <div class="message-time">${time}</div>
                        </div>
                    `;
                    container.appendChild(el);
                });
            }
        } catch (e) {
            console.warn('Не удалось загрузить историю чата');
        }
    }
    
    clearHistory() {
        if (!confirm('Очистить историю чата?')) return;
        this.messages = [];
        localStorage.removeItem('motoChatHistory');
        document.getElementById('motoChatMessages').innerHTML = '';
        this.addMessage('bot', 'История очищена! Чем могу помочь? 🤖');
    }
}

// Автоинициализация
document.addEventListener('DOMContentLoaded', () => {
    window.motoBot = new MotoChatBot({
        aiProvider: 'backend',
        apiEndpoint: '/api/chat',
        botName: 'MotoBot',
        botAvatar: '🏍️'
    });
});