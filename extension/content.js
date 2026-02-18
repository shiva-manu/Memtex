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
            console.warn('Memtex: No messages found. Running DOM diagnostic...');

            // DIAGNOSTIC: Dump page structure to help identify correct selectors
            if (data.provider === 'claude') {
                console.log('=== MEMTEX CLAUDE DOM DIAGNOSTIC ===');
                console.log('URL:', window.location.href);

                // Check for known selectors
                const checks = [
                    '.font-user-message',
                    '.font-claude-message',
                    '[data-testid*="message"]',
                    '[data-testid*="turn"]',
                    '[data-testid*="user"]',
                    '[data-testid*="assistant"]',
                    '.prose',
                    '.markdown',
                    'article',
                    '[class*="message"]',
                    '[class*="turn"]',
                    '[class*="human"]',
                    '[class*="assistant"]',
                    '[class*="conversation"]',
                ];
                checks.forEach(sel => {
                    const els = document.querySelectorAll(sel);
                    if (els.length > 0) {
                        console.log(`✅ "${sel}": ${els.length} elements found`);
                        // Show first element's classes and data attributes
                        const first = els[0];
                        console.log(`   First element: <${first.tagName.toLowerCase()} class="${first.className}" data-testid="${first.getAttribute('data-testid') || ''}">`);
                        console.log(`   Text preview: "${first.innerText.substring(0, 80).replace(/\n/g, '↵')}"`);
                    } else {
                        console.log(`❌ "${sel}": 0 elements`);
                    }
                });

                // Dump all unique data-testid values on the page
                const allTestIds = new Set();
                document.querySelectorAll('[data-testid]').forEach(el => allTestIds.add(el.getAttribute('data-testid')));
                console.log('All data-testid values on page:', [...allTestIds]);

                // Dump all unique class names that contain "message" or "turn"
                const relevantClasses = new Set();
                document.querySelectorAll('*').forEach(el => {
                    el.classList.forEach(cls => {
                        if (cls.includes('message') || cls.includes('turn') || cls.includes('human') || cls.includes('assistant') || cls.includes('conversation')) {
                            relevantClasses.add(cls);
                        }
                    });
                });
                console.log('Relevant class names:', [...relevantClasses]);
                console.log('=== END DIAGNOSTIC ===');
            }

            alert('No messages found to sync!\n\nPlease open the browser console (F12 → Console) and look for "MEMTEX CLAUDE DOM DIAGNOSTIC" to see what selectors are available. Share this info to fix the issue.');
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
    else if (provider === 'claude') {
        console.log("Memtex: Claude Scraper v4 starting...");
        // CONFIRMED from DOM diagnostic:
        // - User messages: data-testid="user-message" (class has !font-user-message with ! prefix)
        // - Assistant messages: NO data-testid, found by DOM position (sibling of user turn wrapper)

        // Helper: Check if text looks like sidebar/UI content
        function isSidebarText(text) {
            return (
                text.includes('All chats') ||
                text.includes('New chat') ||
                text.includes('Ctrl+⇧') ||
                text.includes('Free plan') ||
                (text.includes('Recents') && text.includes('Hide'))
            );
        }

        // Helper: Clean assistant text
        function cleanAssistant(text) {
            return text
                .replace(/^Claude\n?/, '')
                .replace(/Sonnet \d+(\.\d+)?\nClaude is AI.*$/s, '')
                .replace(/\nCopy$/, '')
                .trim();
        }

        // Step 1: Find all user message elements using data-testid (confirmed working)
        const userMsgEls = document.querySelectorAll('[data-testid="user-message"]');
        console.log(`Memtex: Found ${userMsgEls.length} user-message elements via data-testid`);

        if (userMsgEls.length > 0) {
            for (const userEl of userMsgEls) {
                // Add user message
                const userText = userEl.innerText.trim();
                if (userText) messages.push({ role: 'user', content: userText });

                // Step 2: Walk UP from the user message element to find its "turn wrapper"
                // The turn wrapper is the element whose NEXT SIBLING is the assistant response
                let el = userEl;
                let foundAssistant = false;

                for (let depth = 0; depth < 12; depth++) {
                    el = el.parentElement;
                    if (!el || el === document.body) break;

                    const next = el.nextElementSibling;
                    if (!next) continue;

                    // The next sibling should NOT contain a user-message data-testid
                    const nextHasUser = next.querySelector('[data-testid="user-message"]');
                    const nextText = next.innerText.trim();

                    console.log(`Memtex: Depth ${depth}, next sibling tag=${next.tagName}, text="${nextText.substring(0, 50).replace(/\n/g, '↵')}"`);

                    if (!nextHasUser && nextText.length > 20 && !isSidebarText(nextText)) {
                        const cleaned = cleanAssistant(nextText);
                        if (cleaned.length > 10) {
                            messages.push({ role: 'assistant', content: cleaned });
                            console.log(`Memtex: Found assistant at depth ${depth}: "${cleaned.substring(0, 60)}..."`);
                            foundAssistant = true;
                            break;
                        }
                    }
                }

                if (!foundAssistant) {
                    console.log(`Memtex: Could not find assistant response for user msg: "${userText.substring(0, 40)}"`);
                }
            }
        }

        // Deduplicate: remove messages whose content is contained in a longer same-role message
        if (messages.length > 1) {
            const deduped = [];
            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i];
                const isDuplicate = messages.some((other, j) =>
                    i !== j &&
                    other.role === msg.role &&
                    other.content.includes(msg.content) &&
                    other.content.length > msg.content.length
                );
                if (!isDuplicate) deduped.push(msg);
            }
            messages = deduped;
        }

        console.log(`Memtex: Final: ${messages.length} messages (user: ${messages.filter(m => m.role === 'user').length}, assistant: ${messages.filter(m => m.role === 'assistant').length})`);
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
