// Enhanced Background Script for ChatGPT Prompt Capture v2.1
console.log('🚀 Background script loaded - ChatGPT Prompt Capture v2.1');

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', request);
    
    if (request.action === 'savePrompt') {
        savePromptToFile(request.prompt, request.filename, request.timestamp, request.counter)
            .then(() => {
                console.log('✅ File saved successfully');
                sendResponse({success: true});
            })
            .catch((error) => {
                console.error('❌ Failed to save file:', error);
                sendResponse({success: false, error: error.message});
            });
        
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'getSettings') {
        chrome.storage.sync.get(['captureEnabled', 'promptCounter'], (result) => {
            sendResponse({
                captureEnabled: result.captureEnabled !== false, // Default to true
                promptCounter: result.promptCounter || 0
            });
        });
        return true;
    }
    
    if (request.action === 'updateSettings') {
        chrome.storage.sync.set(request.settings, () => {
            sendResponse({success: true});
        });
        return true;
    }
});

// Enhanced file saving function with better error handling
async function savePromptToFile(promptText, filename, timestamp, counter) {
    console.log('💾 Saving prompt to file:', filename);
    
    // Validate inputs
    if (!promptText || !filename) {
        throw new Error('Invalid prompt text or filename');
    }
    
    // Create comprehensive file content with better formatting
    const content = `ChatGPT Prompt Capture
${'='.repeat(60)}

Prompt #${counter}
Timestamp: ${timestamp}
Captured: ${new Date().toLocaleString()}
URL: ${await getCurrentTabUrl()}

PROMPT:
${promptText}

${'='.repeat(60)}
End of prompt

`;
    
    try {
        // Create blob with UTF-8 encoding
        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        
        console.log('📁 Download path: Downloads/chatgpt-prompts/' + filename);
        
        // Ensure the downloads directory structure
        const downloadOptions = {
            url: url,
            filename: `chatgpt-prompts/${filename}`,
            saveAs: false,
            conflictAction: 'uniquify'
        };
        
        // Download the file with enhanced error handling
        const downloadId = await new Promise((resolve, reject) => {
            chrome.downloads.download(downloadOptions, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error('Download API error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (!downloadId) {
                    reject(new Error('Download failed - no download ID returned'));
                } else {
                    resolve(downloadId);
                }
            });
        });
        
        console.log('✅ Download started with ID:', downloadId);
        
        // Clean up the blob URL after a delay
        setTimeout(() => {
            try {
                URL.revokeObjectURL(url);
                console.log('🧹 Blob URL cleaned up');
            } catch (error) {
                console.warn('⚠️ Failed to clean up blob URL:', error);
            }
        }, 5000);
        
        // Update prompt counter in storage
        chrome.storage.sync.get(['promptCounter'], (result) => {
            const newCounter = (result.promptCounter || 0) + 1;
            chrome.storage.sync.set({promptCounter: newCounter});
        });
        
        // Set up download completion listener
        const downloadListener = (delta) => {
            if (delta.id === downloadId) {
                if (delta.state && delta.state.current === 'complete') {
                    console.log('🎉 File download completed successfully!');
                    chrome.downloads.onChanged.removeListener(downloadListener);
                } else if (delta.state && delta.state.current === 'interrupted') {
                    console.error('❌ File download was interrupted:', delta.error);
                    chrome.downloads.onChanged.removeListener(downloadListener);
                } else if (delta.error) {
                    console.error('❌ Download error:', delta.error.current);
                    chrome.downloads.onChanged.removeListener(downloadListener);
                }
            }
        };
        
        chrome.downloads.onChanged.addListener(downloadListener);
        
        // Remove listener after timeout to prevent memory leaks
        setTimeout(() => {
            chrome.downloads.onChanged.removeListener(downloadListener);
        }, 30000);
        
        return downloadId;
        
    } catch (error) {
        console.error('❌ Error in savePromptToFile:', error);
        
        // Provide more specific error messages
        if (error.message.includes('DOWNLOAD_FORBIDDEN')) {
            throw new Error('Downloads are blocked. Please check Chrome download permissions.');
        } else if (error.message.includes('FILE_ACCESS_DENIED')) {
            throw new Error('Cannot access downloads folder. Please check permissions.');
        } else {
            throw new Error(`Failed to save file: ${error.message}`);
        }
    }
}

// Helper function to get current tab URL
async function getCurrentTabUrl() {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        return tabs[0]?.url || 'Unknown';
    } catch (error) {
        console.warn('⚠️ Could not get current tab URL:', error);
        return 'Unknown';
    }
}

// Enhanced extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🎉 ChatGPT Prompt Capture Extension installed/updated');
    console.log('📋 Install reason:', details.reason);
    
    // Set default settings with better handling
    const defaultSettings = {
        captureEnabled: true,
        promptCounter: 0,
        installDate: new Date().toISOString(),
        version: '2.1'
    };
    
    if (details.reason === 'install') {
        // Fresh installation
        chrome.storage.sync.set(defaultSettings, () => {
            console.log('⚙️ Default settings saved for fresh installation');
        });
    } else if (details.reason === 'update') {
        // Update existing settings while preserving user data
        chrome.storage.sync.get(['captureEnabled', 'promptCounter'], (result) => {
            const updatedSettings = {
                ...defaultSettings,
                captureEnabled: result.captureEnabled !== undefined ? result.captureEnabled : true,
                promptCounter: result.promptCounter || 0
            };
            
            chrome.storage.sync.set(updatedSettings, () => {
                console.log('⚙️ Settings updated for extension update');
            });
        });
    }
    
    // Create enhanced context menu
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'toggle-capture',
            title: 'Toggle ChatGPT Prompt Capture',
            contexts: ['page'],
            documentUrlPatterns: ['*://chat.openai.com/*', '*://chatgpt.com/*', '*://*.openai.com/*']
        });
        
        chrome.contextMenus.create({
            id: 'open-downloads',
            title: 'Open ChatGPT Prompts Folder',
            contexts: ['page'],
            documentUrlPatterns: ['*://chat.openai.com/*', '*://chatgpt.com/*', '*://*.openai.com/*']
        });
        
        console.log('📋 Context menus created');
    });
});

// Enhanced context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'toggle-capture') {
        chrome.tabs.sendMessage(tab.id, {action: 'toggleCapture'}, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Could not toggle capture:', chrome.runtime.lastError.message);
            } else {
                console.log('Capture toggled:', response);
            }
        });
    } else if (info.menuItemId === 'open-downloads') {
        // Open downloads page and try to navigate to the prompts folder
        chrome.tabs.create({url: 'chrome://downloads/'}, () => {
            console.log('📁 Opened downloads page');
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Extension started');
    
    // Log startup statistics
    chrome.storage.sync.get(['promptCounter', 'installDate'], (result) => {
        console.log(`📊 Startup stats: ${result.promptCounter || 0} prompts captured since ${result.installDate || 'unknown'}`);
    });
});

// Enhanced download monitoring
chrome.downloads.onCreated.addListener((downloadItem) => {
    if (downloadItem.filename && downloadItem.filename.includes('chatgpt-prompts/')) {
        console.log('📁 Creating ChatGPT prompt download:', downloadItem.filename);
        
        // Log download statistics
        chrome.storage.sync.get(['totalDownloads'], (result) => {
            const newTotal = (result.totalDownloads || 0) + 1;
            chrome.storage.sync.set({totalDownloads: newTotal});
        });
    }
});

// Enhanced download change monitoring
chrome.downloads.onChanged.addListener((delta) => {
    if (delta.filename && delta.filename.current && delta.filename.current.includes('chatgpt-prompts/')) {
        if (delta.state && delta.state.current === 'complete') {
            console.log('✅ ChatGPT prompt file saved successfully:', delta.filename.current);
            
            // Show success notification (optional)
            if (chrome.notifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMxNmEzNGEiLz4KPHBhdGggZD0iTTM0IDEybC04IDggTDEwIDEyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz4KPC9zdmc+',
                    title: 'ChatGPT Prompt Saved',
                    message: `Prompt saved to Downloads folder`
                });
            }
        } else if (delta.error && delta.error.current) {
            console.error('❌ Download error:', delta.error.current);
        }
    }
});

// Handle download interruptions and errors
chrome.downloads.onErased.addListener((downloadId) => {
    console.log('🗑️ Download erased:', downloadId);
});

// Alarm for periodic cleanup (optional)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        console.log('🧹 Running periodic cleanup...');
        
        // Clean up old storage data if needed
        chrome.storage.sync.get(null, (items) => {
            console.log('📊 Current storage usage:', Object.keys(items).length, 'items');
        });
    }
});

// Set up periodic cleanup alarm (once per day)
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('cleanup', { periodInMinutes: 1440 }); // 24 hours
});

// Error handling for unhandled promise rejections
if (typeof process !== 'undefined' && process.on) {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Promise Rejection:', reason);
    });
}

console.log('✅ Background script initialization complete');
