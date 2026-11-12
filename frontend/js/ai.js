/* ============================================================
   AI Assistant Module — Personal Intelligence System
   ============================================================ */

class AI {
    static chatHistory = [
        {
            role: 'assistant',
            text: 'Greetings! I am your Personal Intelligence System assistant. I have authorized access to your verified study, habit, workout, finance, and task metrics. How can I assist your workflow today?'
        }
    ];

    static async render() {
        const content = document.getElementById('app-content');
        if (!content) return;

        content.innerHTML = `
            <div class="ai-chat-layout">
                <div class="ai-chat-container card">
                    <div class="ai-chat-header">
                        <div class="ai-header-info">
                            <div class="ai-avatar"><i class="fas fa-robot"></i></div>
                            <div>
                                <h3>PIS Intelligence Assistant</h3>
                                <p class="text-xs text-accent-success"><i class="fas fa-circle text-xs"></i> Grounded in live database facts</p>
                            </div>
                        </div>
                        <div class="ai-header-actions" style="display: flex; gap: 8px;">
                            <button class="btn btn-ghost btn-sm" onclick="App.openSettings()" title="Configure AI API Key">
                                <i class="fas fa-key"></i> <span>AI Key</span>
                            </button>
                            <button class="btn btn-ghost btn-sm" onclick="AI.viewAuthorizedContext()" title="Inspect authorized context">
                                <i class="fas fa-shield-alt"></i> <span>Data Context</span>
                            </button>
                        </div>
                    </div>

                    <!-- Suggested Prompts -->
                    <div class="ai-prompt-chips">
                        <button class="prompt-chip" onclick="AI.sendPrompt('How many hours did I study this week?')">
                            <i class="fas fa-book"></i> Study hours this week?
                        </button>
                        <button class="prompt-chip" onclick="AI.sendPrompt('How consistent have my habits been?')">
                            <i class="fas fa-check-circle"></i> Habit consistency?
                        </button>
                        <button class="prompt-chip" onclick="AI.sendPrompt('Summarize my workouts this month.')">
                            <i class="fas fa-dumbbell"></i> Workout summary?
                        </button>
                        <button class="prompt-chip" onclick="AI.sendPrompt('Where did most of my money go?')">
                            <i class="fas fa-wallet"></i> Where did my money go?
                        </button>
                        <button class="prompt-chip" onclick="AI.sendPrompt('What areas of my routine could I improve?')">
                            <i class="fas fa-lightbulb"></i> Routine improvement areas?
                        </button>
                    </div>

                    <!-- Chat Messages Window -->
                    <div class="ai-messages-window" id="ai-messages-box">
                        ${this.renderMessages()}
                    </div>

                    <!-- Chat Input -->
                    <div class="ai-input-bar">
                        <form onsubmit="AI.handleChatSubmit(event)" class="ai-chat-form">
                            <input type="text" id="ai-chat-input" class="form-input ai-input-field" 
                                   placeholder="Ask anything about your study, health, habits, budget, or tasks..." 
                                   autocomplete="off">
                            <button type="submit" class="btn btn-primary ai-send-btn" id="ai-send-btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.scrollToBottom();
    }

    static renderMessages() {
        return this.chatHistory.map(msg => {
            const isUser = msg.role === 'user';
            return `
                <div class="chat-message ${isUser ? 'user-msg' : 'ai-msg'}">
                    <div class="msg-avatar">
                        <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
                    </div>
                    <div class="msg-bubble">
                        <div class="msg-body">${this.formatMarkdown(msg.text)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    static formatMarkdown(text) {
        if (!text) return '';
        let formatted = escapeHtml(text);
        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        formatted = formatted.replace(/^• (.*?)$/gm, '<li class="chat-bullet">$1</li>');
        formatted = formatted.replace(/^✓ (.*?)$/gm, '<li class="chat-bullet text-success"><i class="fas fa-check"></i> $1</li>');
        formatted = formatted.replace(/^○ (.*?)$/gm, '<li class="chat-bullet text-muted"><i class="far fa-circle"></i> $1</li>');
        // Newlines
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    static scrollToBottom() {
        const box = document.getElementById('ai-messages-box');
        if (box) box.scrollTop = box.scrollHeight;
    }

    static async sendPrompt(promptText) {
        const input = document.getElementById('ai-chat-input');
        if (input) input.value = promptText;
        this.handleChatSubmit(new Event('submit'));
    }

    static async handleChatSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('ai-chat-input');
        const sendBtn = document.getElementById('ai-send-btn');
        const text = input?.value.trim();

        if (!text) return;

        // Append user message
        this.chatHistory.push({ role: 'user', text });
        input.value = '';

        const box = document.getElementById('ai-messages-box');
        if (box) {
            box.innerHTML = this.renderMessages() + `
                <div class="chat-message ai-msg" id="ai-typing-indicator">
                    <div class="msg-avatar"><i class="fas fa-robot"></i></div>
                    <div class="msg-bubble">
                        <div class="typing-dots"><span></span><span></span><span></span></div>
                    </div>
                </div>
            `;
            this.scrollToBottom();
        }

        if (sendBtn) sendBtn.disabled = true;

        try {
            const res = await api.post('/ai/chat', { message: text });
            document.getElementById('ai-typing-indicator')?.remove();
            this.chatHistory.push({ role: 'assistant', text: res.reply });
            if (box) {
                box.innerHTML = this.renderMessages();
                this.scrollToBottom();
            }
        } catch (err) {
            document.getElementById('ai-typing-indicator')?.remove();
            this.chatHistory.push({
                role: 'assistant',
                text: `I encountered an error querying your records: ${err.message}`
            });
            if (box) {
                box.innerHTML = this.renderMessages();
                this.scrollToBottom();
            }
        } finally {
            if (sendBtn) sendBtn.disabled = false;
        }
    }

    static async viewAuthorizedContext() {
        try {
            const context = await api.get('/ai/context');
            const modalTitle = document.getElementById('detail-modal-title');
            const modalBody = document.getElementById('detail-modal-body');
            if (!modalBody) return;

            modalTitle.textContent = 'Authorized Assistant Database Context';
            modalBody.innerHTML = `
                <p class="text-sm text-secondary mb-3">
                    In compliance with the system's privacy-first design, this raw structured snapshot represents the only verified user metrics supplied to the assistant.
                </p>
                <pre class="json-code-box">${escapeHtml(JSON.stringify(context, null, 2))}</pre>
                <div class="modal-footer mt-3">
                    <button type="button" class="btn btn-primary" onclick="hideModal('detail-modal')">Close</button>
                </div>
            `;
            showModal('detail-modal');
        } catch (err) {
            showToast('Failed to retrieve context snapshot: ' + err.message, 'error');
        }
    }
}
