document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatScreen = document.getElementById('chat-screen');
    const resultScreen = document.getElementById('result-screen');
    const welcomeBtn = document.getElementById('start-btn');
    const userNameInput = document.getElementById('user-name');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const optionsContainer = document.getElementById('options-container');
    const typingIndicator = document.getElementById('typing-indicator');
    const resetBtn = document.getElementById('reset-btn');

    let sessionId = null;
    let currentState = 'start';
    let currentSymptomsMatches = [];

    // --- Navigation ---
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    }

    // --- Chat Logic ---
    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping(show) {
        if (show) typingIndicator.classList.remove('hidden');
        else typingIndicator.classList.add('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage(text, additionalData = {}) {
        const displayMessage = text || (additionalData.selected_symptom ? additionalData.selected_symptom.replace(/_/g, ' ') : null);

        if (!displayMessage && !text) return;

        if (displayMessage) addMessage(displayMessage, 'user');

        userInput.value = '';
        optionsContainer.classList.add('hidden');
        optionsContainer.innerHTML = '';

        showTyping(true);

        try {
            const payload = {
                session_id: sessionId,
                input: text || "",
                ...additionalData
            };

            const response = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            showTyping(false);

            if (data.error) {
                addMessage(`Error: ${data.error}`, 'bot');
                return;
            }

            handleBotResponse(data);
        } catch (err) {
            showTyping(false);
            addMessage("Sorry, I encountered an error. Please try again.", 'bot');
            console.error(err);
        }
    }

    function handleBotResponse(data) {
        currentState = data.state;

        if (data.message) {
            setTimeout(() => addMessage(data.message, 'bot'), 500);
        }

        if (data.state === 'clarifying_symptom') {
            currentSymptomsMatches = data.matches;
            setTimeout(() => {
                optionsContainer.innerHTML = '';
                data.matches.forEach((s, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn';
                    btn.textContent = s.replace(/_/g, ' ');
                    btn.onclick = () => sendMessage(null, { selected_symptom: s });
                    optionsContainer.appendChild(btn);
                });
                optionsContainer.classList.remove('hidden');
            }, 800);
        } else if (data.is_yes_no) {
            setTimeout(() => {
                optionsContainer.innerHTML = `
                    <button class="option-btn" onclick="app.sendOption('yes')">Yes</button>
                    <button class="option-btn" onclick="app.sendOption('no')">No</button>
                `;
                optionsContainer.classList.remove('hidden');
            }, 800);
        } else if (data.state === 'finished') {
            setTimeout(() => showResults(data.result), 1500);
        }
    }

    function showResults(result) {
        showView('result-screen');

        document.getElementById('primary-diagnosis').textContent = result.initial_disease.replace(/_/g, ' ');
        document.getElementById('diagnosis-desc').textContent = result.description;

        const conditionBox = document.getElementById('condition-box');
        const conditionText = document.getElementById('condition-text');
        conditionText.textContent = result.condition;

        conditionBox.className = 'condition-badge';
        if (result.condition.includes('consultation')) {
            conditionBox.classList.add('danger');
        } else {
            conditionBox.classList.add('info');
        }

        const precList = document.getElementById('precautions-list');
        precList.innerHTML = '';
        result.precautions.forEach(p => {
            if (p.trim()) {
                const li = document.createElement('li');
                li.textContent = p;
                precList.appendChild(li);
            }
        });

        const secondaryCard = document.getElementById('secondary-result');
        if (result.mismatch) {
            secondaryCard.classList.remove('hidden');
            document.getElementById('alt-diagnosis').textContent = result.second_prediction.replace(/_/g, ' ');
        } else {
            secondaryCard.classList.add('hidden');
        }
    }

    // --- Event Listeners ---
    welcomeBtn.addEventListener('click', async () => {
        const name = userNameInput.value || 'Friend';
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await response.json();
        sessionId = data.session_id;

        showView('chat-screen');
        setTimeout(() => addMessage(data.message, 'bot'), 500);
    });

    sendBtn.addEventListener('click', () => sendMessage(userInput.value));
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage(userInput.value);
    });

    resetBtn.addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('new-diagnosis-btn').addEventListener('click', () => {
        window.location.reload();
    });

    // Expose some functions for inline onclick handlers
    window.app = {
        sendOption: (val) => sendMessage(val)
    };
});
