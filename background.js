// Enhanced Background Script for ChatGPT Prompt Capture v4.0
console.log('🚀 Background script loaded - ChatGPT Prompt Capture v4.0');

// Store captured prompts in memory and local storage
let capturedPrompts = [];
let promptCounter = 0;

// Initialize extension storage
chrome.runtime.onStartup.addListener(initializeStorage);
chrome.runtime.onInstalled.addListener(initializeStorage);

function initializeStorage() {
    console.log('🎬 Initializing extension storage...');
    
    // Load existing prompts from storage
    chrome.storage.local.get(['capturedPrompts', 'promptCounter'], (result) => {
        capturedPrompts = result.capturedPrompts || [];
        promptCounter = result.promptCounter || 0;
        console.log(`📊 Loaded ${capturedPrompts.length} existing prompts`);
    });
}

// Save prompt to local storage and create downloadable file
function savePromptToStorage(promptData) {
    return new Promise((resolve, reject) => {
        try {
            // Add to memory
            capturedPrompts.push(promptData);
            
            // Save to chrome storage
            chrome.storage.local.set({
                capturedPrompts: capturedPrompts,
                promptCounter: promptCounter
            }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log('✅ Prompt saved to storage');
                    resolve(promptData);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Create downloadable blob URL for a prompt
function createDownloadableFile(promptData) {
    const content = formatPromptContent(promptData);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    return URL.createObjectURL(blob);
}

// Format prompt content for file
function formatPromptContent(promptData) {
    return `ChatGPT Prompt #${promptData.counter}
${'='.repeat(60)}

Timestamp: ${promptData.timestamp}
Created: ${new Date(promptData.createdAt).toLocaleString()}
URL: ${promptData.url}
Filename: ${promptData.filename}

PROMPT:
${promptData.prompt}

${'='.repeat(60)}
End of prompt

`;
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', request);
    
    if (request.action === 'savePrompt') {
        const promptData = {
            prompt: request.prompt,
            filename: request.filename,
            timestamp: request.timestamp,
            counter: ++promptCounter,
            url: sender.tab?.url || 'unknown',
            createdAt: new Date().toISOString(),
            id: Date.now() + Math.random() // Unique ID
        };
        
        savePromptToStorage(promptData)
            .then(() => {
                console.log('✅ Prompt saved successfully');
                sendResponse({
                    success: true, 
                    counter: promptCounter,
                    promptData: promptData
                });
            })
            .catch((error) => {
                console.error('❌ Failed to save prompt:', error);
                sendResponse({success: false, error: error.message});
            });
        
        return true;
    }
    
    if (request.action === 'getPrompts') {
        sendResponse({
            prompts: capturedPrompts,
            counter: promptCounter
        });
        return true;
    }
    
    if (request.action === 'downloadPrompt') {
        const prompt = capturedPrompts.find(p => p.id === request.id);
        if (prompt) {
            try {
                const url = createDownloadableFile(prompt);
                chrome.downloads.download({
                    url: url,
                    filename: prompt.filename,
                    saveAs: true
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({success: false, error: chrome.runtime.lastError.message});
                    } else {
                        setTimeout(() => URL.revokeObjectURL(url), 5000);
                        sendResponse({success: true, downloadId: downloadId});
                    }
                });
            } catch (error) {
                sendResponse({success: false, error: error.message});
            }
        } else {
            sendResponse({success: false, error: 'Prompt not found'});
        }
        return true;
    }
    
    if (request.action === 'downloadAllPrompts') {
        if (capturedPrompts.length === 0) {
            sendResponse({success: false, error: 'No prompts to download'});
            return true;
        }
        
        try {
            let content = `ChatGPT Prompts Export
${'='.repeat(60)}
Total Prompts: ${capturedPrompts.length}
Export Date: ${new Date().toLocaleString()}
${'='.repeat(60)}

`;
            
            capturedPrompts.forEach((prompt, index) => {
                content += formatPromptContent(prompt);
                if (index < capturedPrompts.length - 1) {
                    content += '\n' + '='.repeat(60) + '\n\n';
                }
            });
            
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            
            chrome.downloads.download({
                url: url,
                filename: `all-chatgpt-prompts-${timestamp}.txt`,
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    sendResponse({success: false, error: chrome.runtime.lastError.message});
                } else {
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                    sendResponse({success: true, downloadId: downloadId});
                }
            });
        } catch (error) {
            sendResponse({success: false, error: error.message});
        }
        return true;
    }
    
    if (request.action === 'clearPrompts') {
        capturedPrompts = [];
        promptCounter = 0;
        
        chrome.storage.local.set({
            capturedPrompts: [],
            promptCounter: 0
        }, () => {
            if (chrome.runtime.lastError) {
                sendResponse({success: false, error: chrome.runtime.lastError.message});
            } else {
                console.log('🧹 All prompts cleared');
                sendResponse({success: true});
            }
        });
        return true;
    }
    
    if (request.action === 'getStorageInfo') {
        chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
            sendResponse({
                bytesInUse: bytesInUse,
                promptCount: capturedPrompts.length,
                storageLocation: 'Extension Local Storage'
            });
        });
        return true;
    }
});

// Initialize on startup
initializeStorage();

console.log('✅ Background script initialization complete');