document.addEventListener('DOMContentLoaded', async () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('save');
    const status = document.getElementById('status');

    // Load existing settings
    const config = await chrome.storage.local.get(['apiKey']);
    if (config.apiKey) apiKeyInput.value = config.apiKey;

    saveBtn.onclick = async () => {
        const apiKey = apiKeyInput.value.trim();

        await chrome.storage.local.set({ apiKey });

        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    };
});

