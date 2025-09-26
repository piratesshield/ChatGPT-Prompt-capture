// Enhanced Background Script for ChatGPT Prompt Capture v4.1
console.log('🚀 Background script loaded - ChatGPT Prompt Capture v4.1');

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

// Save prompt to local storage
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

// Convert text to data URL for download
function createDataUrl(content) {
    const encoded = encodeURIComponent(content);
    return `data:text/plain;charset=utf-8,${encoded}`;
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
                const content = formatPromptContent(prompt);
                const dataUrl = createDataUrl(content);
                
                chrome.downloads.download({
                    url: dataUrl,
                    filename: `chatgpt-prompts/${prompt.filename}`,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('Download error:', chrome.runtime.lastError.message);
                        sendResponse({success: false, error: chrome.runtime.lastError.message});
                    } else {
                        console.log('✅ Single prompt downloaded:', downloadId);
                        sendResponse({success: true, downloadId: downloadId});
                    }
                });
            } catch (error) {
                console.error('Error creating download:', error);
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
Extension: ChatGPT Prompt Capture v4.1
${'='.repeat(60)}

`;
            
            capturedPrompts.forEach((prompt, index) => {
                content += formatPromptContent(prompt);
                if (index < capturedPrompts.length - 1) {
                    content += '\n' + '='.repeat(60) + '\n\n';
                }
            });
            
            const dataUrl = createDataUrl(content);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            
            chrome.downloads.download({
                url: dataUrl,
                filename: `chatgpt-prompts/all-chatgpt-prompts-${timestamp}.txt`,
                saveAs: false
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error('Download all error:', chrome.runtime.lastError.message);
                    sendResponse({success: false, error: chrome.runtime.lastError.message});
                } else {
                    console.log('✅ All prompts downloaded:', downloadId);
                    sendResponse({success: true, downloadId: downloadId, count: capturedPrompts.length});
                }
            });
        } catch (error) {
            console.error('Error creating download all:', error);
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