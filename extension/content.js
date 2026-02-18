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

        if (!data.messages.length) {
            alert('No messages found to sync!');
            return;
        }

        // Fixed Server URL
        const serverUrl = 'http://localhost:3000';

        // Get API key from storage
        const config = await chrome.storage.local.get(['apiKey']);
        const apiKey = config.apiKey;

        if (!apiKey) {
            alert('Please set your Memtex API Key in the extension popup!');
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
                source: data.source
            })
        });


        if (response.status === 401) {
            throw new Error('Invalid API Key. Please update it in the extension popup.');
        } else if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Server connection failed');
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
    let source = 'other';

    // === ChatGPT Scraper ===
    if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
        source = 'chatgpt';

        // Try selecting by conversation turns (most reliable current method)
        // ChatGPT often puts turns in 'article' or 'div' with testid 'conversation-turn-...'
        const turns = document.querySelectorAll('article[data-testid^="conversation-turn-"], div[data-testid^="conversation-turn-"]');

        if (turns.length > 0) {
            turns.forEach(turn => {
                // Determine role
                const isAssistant = turn.querySelector('[data-message-author-role="assistant"]');
                const isUser = turn.querySelector('[data-message-author-role="user"]');
                const role = isAssistant ? 'assistant' : (isUser ? 'user' : 'user'); // Default to user if unsure

                // Extract content
                const contentDiv = turn.querySelector('.markdown, .whitespace-pre-wrap');
                if (contentDiv) {
                    messages.push({
                        role,
                        content: contentDiv.innerText.trim()
                    });
                }
            });
        }

        // Fallback: older generic selector
        // Sometimes just looking for message-content works
        if (messages.length === 0) {
            const genericTurns = document.querySelectorAll('.message-content, .text-message');
            genericTurns.forEach(div => {
                // Harder to distinguish role here without context, assume user based on class? No, risky.
                // Let's just grab text.
                messages.push({ role: 'user', content: div.innerText.trim() });
            });
        }
    }

    // === Claude Scraper ===
    else if (url.includes('claude.ai')) {
        source = 'claude';
        const msgElems = document.querySelectorAll('.font-claude-message, .font-user-message');
        msgElems.forEach(el => {
            const isAssistant = el.classList.contains('font-claude-message');
            messages.push({
                role: isAssistant ? 'assistant' : 'user',
                content: el.innerText.trim()
            });
        });
    }

    // === Gemini Scraper ===
    else if (url.includes('gemini.google.com')) {
        source = 'gemini';
        title = document.querySelector('.conversation-title')?.innerText || document.title;

        // Strategy 1: Look for specific message containers (2024+ UI)
        // Gemini often wraps user queries in specific classes and bot responses in others
        const allBlocks = document.querySelectorAll('.query-container, .response-container, user-query, model-response');

        if (allBlocks.length > 0) {
            allBlocks.forEach(block => {
                const isModel = block.tagName === 'MODEL-RESPONSE' || block.classList.contains('response-container') || block.classList.contains('model-response');
                const textElem = block.querySelector('.query-text, .message-content, .markdown, .snippet-content') || block;

                const text = textElem.innerText.trim();
                // Filter out UI noise
                if (text && !text.includes('Search related to') && text !== 'Syncing...') {
                    messages.push({
                        role: isModel ? 'assistant' : 'user',
                        content: text
                    });
                }
            });
        }

        // Strategy 2: Fallback to scanning for large text blocks if specific containers fail
        if (messages.length === 0) {
            const manualQueries = document.querySelectorAll('h1, h2, .query-text'); // User queries often in headers or query-text
            const manualResponses = document.querySelectorAll('.markdown'); // AI responses usually markdown

            // This is imperfect alignment but better than nothing
            manualQueries.forEach(q => messages.push({ role: 'user', content: q.innerText.trim() }));
            manualResponses.forEach(r => messages.push({ role: 'assistant', content: r.innerText.trim() }));
        }
    }

    return { title, messages, source };
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
