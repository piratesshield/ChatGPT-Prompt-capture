// Enhanced Background Script for ChatGPT Prompt Capture v3.0
console.log('🚀 Background script loaded - ChatGPT Prompt Capture v3.0');

// Store captured prompts in memory and IndexedDB
let capturedPrompts = [];
let promptCounter = 0;

// Initialize IndexedDB for persistent storage
let db = null;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ChatGPTPrompts', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('prompts')) {
                const store = db.createObjectStore('prompts', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('counter', 'counter', { unique: false });
            }
        };
    });
}

// Initialize DB on startup
initDB().then(() => {
    console.log('✅ IndexedDB initialized');
    loadExistingPrompts();
}).catch(error => {
    console.error('❌ Failed to initialize IndexedDB:', error);
});

// Load existing prompts from IndexedDB
function loadExistingPrompts() {
    if (!db) return;
    
    const transaction = db.transaction(['prompts'], 'readonly');
    const store = transaction.objectStore('prompts');
    const request = store.getAll();
    
    request.onsuccess = () => {
        capturedPrompts = request.result || [];
        promptCounter = capturedPrompts.length;
        console.log(`📊 Loaded ${capturedPrompts.length} existing prompts`);
    };
}

// Save prompt to IndexedDB and memory
function savePromptToDB(promptData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(['prompts'], 'readwrite');
        const store = transaction.objectStore('prompts');
        const request = store.add(promptData);
        
        request.onsuccess = () => {
            capturedPrompts.push(promptData);
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
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
            createdAt: new Date().toISOString()
        };
        
        savePromptToDB(promptData)
            .then(() => {
                console.log('✅ Prompt saved to database');
                
                // Also save as traditional file for backup
                savePromptToFile(promptData.prompt, promptData.filename, promptData.timestamp, promptData.counter)
                    .catch(error => console.warn('⚠️ Traditional file save failed:', error));
                
                sendResponse({success: true, counter: promptCounter});
            })
            .catch((error) => {
                console.error('❌ Failed to save prompt to database:', error);
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
        const prompt = capturedPrompts.find(p => p.counter === request.counter);
        if (prompt) {
            downloadSinglePrompt(prompt)
                .then(() => sendResponse({success: true}))
                .catch(error => sendResponse({success: false, error: error.message}));
        } else {
            sendResponse({success: false, error: 'Prompt not found'});
        }
        return true;
    }
    
    if (request.action === 'downloadAllPrompts') {
        downloadAllPrompts()
            .then(() => sendResponse({success: true}))
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    }
    
    if (request.action === 'clearPrompts') {
        clearAllPrompts()
            .then(() => {
                capturedPrompts = [];
                promptCounter = 0;
                sendResponse({success: true});
            })
            .catch(error => sendResponse({success: false, error: error.message}));
        return true;
    }
});

// Download a single prompt
function downloadSinglePrompt(promptData) {
    const content = formatPromptContent(promptData);
    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
        chrome.downloads.download({
            url: url,
            filename: `chatgpt-prompts/${promptData.filename}`,
            saveAs: false,
            conflictAction: 'uniquify'
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                setTimeout(() => URL.revokeObjectURL(url), 5000);
                resolve(downloadId);
            }
        });
    });
}

// Download all prompts as a single file
function downloadAllPrompts() {
    if (capturedPrompts.length === 0) {
        throw new Error('No prompts to download');
    }
    
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
    
    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    return new Promise((resolve, reject) => {
        chrome.downloads.download({
            url: url,
            filename: `chatgpt-prompts/all-prompts-${timestamp}.txt`,
            saveAs: false,
            conflictAction: 'uniquify'
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                setTimeout(() => URL.revokeObjectURL(url), 5000);
                resolve(downloadId);
            }
        });
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

// Traditional file saving (backup method)
async function savePromptToFile(promptText, filename, timestamp, counter) {
    const content = formatPromptContent({
        prompt: promptText,
        filename: filename,
        timestamp: timestamp,
        counter: counter,
        url: await getCurrentTabUrl(),
        createdAt: new Date().toISOString()
    });
    
    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
        chrome.downloads.download({
            url: url,
            filename: `chatgpt-prompts/${filename}`,
            saveAs: false,
            conflictAction: 'uniquify'
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                setTimeout(() => URL.revokeObjectURL(url), 5000);
                resolve(downloadId);
            }
        });
    });
}

// Clear all prompts from database
function clearAllPrompts() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(['prompts'], 'readwrite');
        const store = transaction.objectStore('prompts');
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Helper function to get current tab URL
async function getCurrentTabUrl() {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        return tabs[0]?.url || 'Unknown';
    } catch (error) {
        return 'Unknown';
    }
}

// Enhanced extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🎉 ChatGPT Prompt Capture Extension installed/updated');
    
    // Initialize database
    initDB().then(() => {
        console.log('✅ Database initialized on install');
    });
    
    // Set default settings
    const defaultSettings = {
        captureEnabled: true,
        promptCounter: 0,
        installDate: new Date().toISOString(),
        version: '3.0'
    };
    
    chrome.storage.sync.set(defaultSettings, () => {
        console.log('⚙️ Default settings saved');
    });
});

console.log('✅ Background script initialization complete');