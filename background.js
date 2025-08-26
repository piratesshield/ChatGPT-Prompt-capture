// Enhanced Background Script for ChatGPT Prompt Capture
console.log('🚀 Background script loaded - ChatGPT Prompt Capture v2.0');

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
});

// Enhanced file saving function
async function savePromptToFile(promptText, filename, timestamp, counter) {
    console.log('💾 Saving prompt to file:', filename);
    
    // Create comprehensive file content
    const content = `ChatGPT Prompt Capture
${'='.repeat(50)}

Prompt #${counter}
Timestamp: ${timestamp}
Captured: ${new Date().toLocaleString()}

PROMPT:
${promptText}

${'='.repeat(50)}
End of prompt

`;
    
    try {
        // Create blob
        const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        
        console.log('📁 Download path: Downloads/chatgpt-prompts/' + filename);
        
        // Download the file
        const downloadId = await new Promise((resolve, reject) => {
            chrome.downloads.download({
                url: url,
                filename: `chatgpt-prompts/${filename}`,
                saveAs: false,
                conflictAction: 'uniquify'
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(downloadId);
                }
            });
        });
        
        console.log('✅ Download started with ID:', downloadId);
        
        // Clean up the blob URL
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        // Verify download completion
        chrome.downloads.onChanged.addListener(function downloadListener(delta) {
            if (delta.id === downloadId && delta.state && delta.state.current === 'complete') {
                console.log('🎉 File download completed successfully!');
                chrome.downloads.onChanged.removeListener(downloadListener);
            } else if (delta.id === downloadId && delta.state && delta.state.current === 'interrupted') {
                console.error('❌ File download was interrupted');
                chrome.downloads.onChanged.removeListener(downloadListener);
            }
        });
        
        return downloadId;
        
    } catch (error) {
        console.error('❌ Error in savePromptToFile:', error);
        throw error;
    }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🎉 ChatGPT Prompt Capture Extension installed/updated');
    console.log('📋 Install reason:', details.reason);
    
    // Set default settings
    chrome.storage.sync.set({
        captureEnabled: true,
        promptCounter: 0
    }, () => {
        console.log('⚙️ Default settings saved');
    });
    
    // Create context menu (optional)
    chrome.contextMenus.create({
        id: 'toggle-capture',
        title: 'Toggle ChatGPT Prompt Capture',
        contexts: ['page'],
        documentUrlPatterns: ['*://chat.openai.com/*', '*://chatgpt.com/*']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'toggle-capture') {
        chrome.tabs.sendMessage(tab.id, {action: 'toggleCapture'}, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Could not toggle capture:', chrome.runtime.lastError.message);
            } else {
                console.log('Capture toggled:', response);
            }
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Extension started');
});

// Monitor downloads folder creation
chrome.downloads.onCreated.addListener((downloadItem) => {
    if (downloadItem.filename && downloadItem.filename.includes('chatgpt-prompts/')) {
        console.log('📁 Creating download:', downloadItem.filename);
    }
});

// Error handling for downloads
chrome.downloads.onChanged.addListener((delta) => {
    if (delta.filename && delta.filename.current && delta.filename.current.includes('chatgpt-prompts/')) {
        if (delta.state && delta.state.current === 'complete') {
            console.log('✅ ChatGPT prompt file saved:', delta.filename.current);
        } else if (delta.error) {
            console.error('❌ Download error:', delta.error.current);
        }
    }
});