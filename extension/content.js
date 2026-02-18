/**
 * Memtex Content Script
 * Scrapes chat history from ChatGPT, Gemini, and Claude
 */

function injectSyncButton() {
    if (document.getElementById('memtex-sync-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'memtex-sync-btn';
    btn.className = 'memtex-sync-btn';
    btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Sync to Memtex
    `;

    btn.onclick = handleSync;
    document.body.appendChild(btn);
}

async function handleSync() {
    const btn = document.getElementById('memtex-sync-btn');
    const originalText = btn.innerHTML;

    try {
        btn.classList.add('syncing');
        btn.innerText = 'Syncing...';

        const data = scrapeChat();

        if (!data.messages || data.messages.length === 0) {
            console.warn('Memtex: No messages found with current selectors.');
            alert('No messages found to sync! Please ensure you are in a chat conversation.');
            btn.innerHTML = originalText;
            btn.classList.remove('syncing');
            return;
        }

        // Fixed Server URL
        const serverUrl = 'http://localhost:3000';

        // Get API key from storage
        const config = await chrome.storage.local.get(['apiKey']);
        const apiKey = config.apiKey;

        if (!apiKey) {
            alert('Please set your Memtex API Key in the extension popup!');
            btn.innerHTML = originalText;
            btn.classList.remove('syncing');
            return;
        }

        const response = await fetch(`${serverUrl}/api/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                title: data.title,
                messages: data.messages,
                provider: data.provider // Changed from source to provider
            })
        });


        if (response.status === 401) {
            throw new Error('Invalid API Key. Please update it in the extension popup.');
        } else if (!response.ok) {
            let errorMsg = 'Server connection failed';
            try {
                const errData = await response.json();
                errorMsg = errData.error || errorMsg;
            } catch (e) {
                errorMsg = `${response.status} ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }

        btn.innerText = '✅ Synced!';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('syncing');
        }, 3000);

    } catch (err) {
        console.error('Memtex Sync Error:', err);
        alert(`Sync failed: ${err.message}`);
        btn.innerHTML = originalText;
        btn.classList.remove('syncing');
    }
}

function scrapeChat() {
    const url = window.location.href;
    let messages = [];
    let title = document.title;
    let provider = 'chatgpt'; // Default

    // === Detect Provider First ===
    if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
        provider = 'chatgpt';
    } else if (url.includes('claude.ai')) {
        provider = 'claude';
    } else if (url.includes('gemini.google.com')) {
        provider = 'gemini';
    }

    console.log(`Memtex: Detected platform: ${provider}`);

    // === ChatGPT Scraper ===
    if (provider === 'chatgpt') {
        // Strategy 1: Article-based (most robust for recent ChatGPT)
        const articles = document.querySelectorAll('article');

        if (articles.length > 0) {
            articles.forEach(article => {
                const authorRoleElem = article.querySelector('[data-message-author-role]');
                const role = authorRoleElem ? authorRoleElem.getAttribute('data-message-author-role') : null;

                if (role) {
                    const contentDiv = article.querySelector('.markdown, .prose, .whitespace-pre-wrap, div[class*="text-message"]');
                    if (contentDiv && contentDiv.innerText.trim()) {
                        messages.push({
                            role: role === 'assistant' ? 'assistant' : 'user',
                            content: contentDiv.innerText.trim()
                        });
                    }
                }
            });
        }

        // Strategy 2: Fallback for different layouts (like small screens or shared chats)
        if (messages.length === 0) {
            const turns = document.querySelectorAll('[data-testid^="conversation-turn-"], [data-message-author-role]');
            turns.forEach(turn => {
                const roleMark = turn.querySelector('[data-message-author-role]') || (turn.hasAttribute('data-message-author-role') ? turn : null);
                if (roleMark) {
                    const role = roleMark.getAttribute('data-message-author-role');
                    const contentDiv = turn.querySelector('.markdown, .prose, .whitespace-pre-wrap') || turn;
                    if (contentDiv && contentDiv !== turn && contentDiv.innerText.trim()) {
                        messages.push({
                            role: role === 'assistant' ? 'assistant' : 'user',
                            content: contentDiv.innerText.trim()
                        });
                    }
                }
            });
        }
    }

    // === Claude Scraper ===
    else if (url.includes('claude.ai')) {
        provider = 'claude';
        // Improved Claude selectors
        const msgElems = document.querySelectorAll('.font-claude-message, .font-user-message, [data-testid="message-content"]');
        msgElems.forEach(el => {
            const isAssistant = el.classList.contains('font-claude-message') ||
                el.closest('[data-testid="assistant-message"]');

            const text = el.innerText.trim();
            if (text) {
                messages.push({
                    role: isAssistant ? 'assistant' : 'user',
                    content: text
                });
            }
        });
    }

    // === Gemini Scraper ===
    else if (url.includes('gemini.google.com')) {
        provider = 'gemini';
        title = document.querySelector('.conversation-title')?.innerText || document.title;

        // Gemini uses specific tags for model and user turns
        const chatContainer = document.querySelector('chat-window, .conversation-container, main');
        if (chatContainer) {
            const allElements = chatContainer.querySelectorAll('user-query, model-response, .query-container, .response-container');
            allElements.forEach(el => {
                const isModel = el.tagName === 'MODEL-RESPONSE' || el.classList.contains('response-container') || el.classList.contains('model-response');
                const textElem = el.querySelector('.query-text, .message-content, .markdown, .snippet-content') || el;
                const text = textElem.innerText.trim();

                if (text && !text.includes('Search related to')) {
                    messages.push({
                        role: isModel ? 'assistant' : 'user',
                        content: text
                    });
                }
            });
        }

        // Fallback for Gemini if interleaved search fails
        if (messages.length === 0) {
            document.querySelectorAll('.query-text').forEach(q => messages.push({ role: 'user', content: q.innerText.trim() }));
            document.querySelectorAll('.markdown').forEach(r => messages.push({ role: 'assistant', content: r.innerText.trim() }));
        }
    }

    return { title, messages, provider };
}

// Initial injection
injectSyncButton();

// Re-inject on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        injectSyncButton();
    }
}).observe(document, { subtree: true, childList: true });
