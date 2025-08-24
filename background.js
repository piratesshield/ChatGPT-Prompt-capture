// Background script for file operations
console.log('Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    if (request.action === 'savePrompt') {
        savePromptToFile(request.prompt, request.filename, request.timestamp);
        sendResponse({success: true});
    }
});

function savePromptToFile(promptText, filename, timestamp) {
    console.log('Saving prompt to file:', filename);
    
    const content = `Timestamp: ${timestamp}\nPrompt: ${promptText}\n\n${'='.repeat(50)}\n\n`;
    
    // Create blob with the prompt content
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    
    // Download the file
    chrome.downloads.download({
        url: url,
        filename: `chatgpt-prompts/${filename}`,
        saveAs: false
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.error('Download failed:', chrome.runtime.lastError);
        } else {
            console.log('Prompt saved successfully with download ID:', downloadId);
        }
        // Clean up the object URL
        URL.revokeObjectURL(url);
    });
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('ChatGPT Prompt Capture Extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
        captureEnabled: true
    });
});