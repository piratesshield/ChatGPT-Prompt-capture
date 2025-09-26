document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Enhanced Popup loaded v4.0');
    
    // DOM elements
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const statusMessage = document.getElementById('statusMessage');
    const toggleBtn = document.getElementById('toggleBtn');
    const promptCount = document.getElementById('promptCount');
    const sessionTime = document.getElementById('sessionTime');
    const debugInfo = document.getElementById('debugInfo');
    const currentUrl = document.getElementById('currentUrl');
    const extensionStatus = document.getElementById('extensionStatus');
    const lastUpdate = document.getElementById('lastUpdate');
    
    // New elements
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const viewPromptsBtn = document.getElementById('viewPromptsBtn');
    const clearPromptsBtn = document.getElementById('clearPromptsBtn');
    const promptsList = document.getElementById('promptsList');
    const promptsContainer = document.getElementById('promptsContainer');
    const storedCount = document.getElementById('storedCount');
    const storageUsed = document.getElementById('storageUsed');

    let isCapturing = true;
    let startTime = Date.now();
    let sessionTimer = null;
    let statusCheckInterval = null;
    let currentPrompts = [];

    // Update session timer
    function updateSessionTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 60000);
        if (sessionTime) {
            sessionTime.textContent = elapsed + 'm';
        }
    }

    // Start session timer
    sessionTimer = setInterval(updateSessionTimer, 60000);
    updateSessionTimer();

    // Show feedback message
    function showFeedback(message, isSuccess = true) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${isSuccess ? 'success' : 'error'}`;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.style.opacity = '1', 10);
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);
    }

    // Update UI with status information
    function updateUI(status, errorMessage = null) {
        const now = new Date().toLocaleTimeString();
        if (lastUpdate) lastUpdate.textContent = now;

        if (errorMessage) {
            updateStatusDisplay('Error', errorMessage, false);
            if (toggleBtn) {
                toggleBtn.disabled = true;
                toggleBtn.textContent = 'Unavailable';
            }
            if (extensionStatus) extensionStatus.textContent = 'Error';
            return;
        }

        if (status && status.isCapturing !== undefined) {
            updateStatusDisplay(
                status.isCapturing ? 'Active' : 'Inactive',
                status.isCapturing ? 'Ready to capture prompts' : 'Prompt capture is disabled',
                status.isCapturing
            );
            
            if (promptCount) promptCount.textContent = status.promptCounter || 0;
            if (toggleBtn) {
                toggleBtn.disabled = false;
                toggleBtn.textContent = status.isCapturing ? 'Disable' : 'Enable';
                toggleBtn.className = status.isCapturing ? 'toggle-btn' : 'toggle-btn inactive';
            }
            
            isCapturing = status.isCapturing;
            
            if (extensionStatus) {
                extensionStatus.textContent = status.isInitialized ? 'Initialized' : 'Loading';
            }
            
            if (status.currentUrl && currentUrl) {
                const displayUrl = status.currentUrl.length > 60 ? 
                    status.currentUrl.substring(0, 60) + '...' : status.currentUrl;
                currentUrl.textContent = displayUrl;
            }
        } else {
            updateStatusDisplay('Loading', 'Initializing extension...', null);
            if (toggleBtn) {
                toggleBtn.disabled = true;
                toggleBtn.textContent = 'Loading...';
            }
            if (extensionStatus) extensionStatus.textContent = 'Loading';
        }
    }

    // Helper function to update status display
    function updateStatusDisplay(status, message, isActive) {
        if (!statusIndicator || !statusText || !statusMessage) return;
        
        statusText.textContent = status;
        statusMessage.textContent = message;
        
        statusIndicator.classList.remove('active', 'inactive');
        if (isActive === true) {
            statusIndicator.classList.add('active');
            statusMessage.style.color = '#16a34a';
        } else if (isActive === false) {
            statusIndicator.classList.add('inactive');
            statusMessage.style.color = '#dc2626';
        } else {
            statusMessage.style.color = '#64748b';
        }
    }

    // Check if on ChatGPT page
    function isChatGPTPage(url) {
        if (!url) return false;
        
        const validDomains = [
            'chat.openai.com',
            'chatgpt.com'
        ];
        
        return validDomains.some(domain => url.includes(domain));
    }

    // Get current status from content script
    function getCurrentStatus(retryCount = 0) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            if (!tab) {
                updateUI(null, 'No active tab found');
                return;
            }

            if (currentUrl) currentUrl.textContent = tab.url || 'Unknown';

            if (!isChatGPTPage(tab.url)) {
                updateUI(null, 'Please navigate to ChatGPT (chat.openai.com or chatgpt.com)');
                return;
            }

            chrome.tabs.sendMessage(tab.id, {action: 'getStatus'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Content script communication error:', chrome.runtime.lastError.message);
                    
                    if (retryCount < 3 && chrome.runtime.lastError.message.includes('Could not establish connection')) {
                        console.log(`Retrying status check... (${retryCount + 1}/3)`);
                        setTimeout(() => getCurrentStatus(retryCount + 1), 2000);
                        updateUI(null, `Extension loading... (attempt ${retryCount + 1}/3)`);
                    } else {
                        updateUI(null, 'Extension not ready. Please refresh the ChatGPT page.');
                    }
                } else if (response) {
                    console.log('Received status:', response);
                    updateUI(response);
                } else {
                    updateUI(null, 'No response from extension. Try refreshing the page.');
                }
            });
        });
    }

    // Toggle capture functionality
    function toggleCapture() {
        if (!toggleBtn || toggleBtn.disabled) return;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            if (!tab || !isChatGPTPage(tab.url)) {
                return;
            }

            const newState = !isCapturing;
            console.log('Toggling capture to:', newState);

            toggleBtn.disabled = true;
            toggleBtn.textContent = 'Updating...';

            chrome.tabs.sendMessage(tab.id, {
                action: 'toggleCapture',
                enabled: newState
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Toggle failed:', chrome.runtime.lastError.message);
                    updateUI(null, 'Failed to toggle. Try refreshing the page.');
                } else if (response && response.success) {
                    console.log('Toggle successful:', response);
                    setTimeout(getCurrentStatus, 500);
                } else {
                    updateUI(null, 'Toggle failed. Try refreshing the page.');
                }
            });
        });
    }

    // Load and display captured prompts
    function loadCapturedPrompts() {
        chrome.runtime.sendMessage({action: 'getPrompts'}, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Failed to load prompts:', chrome.runtime.lastError.message);
                return;
            }

            if (response && response.prompts) {
                currentPrompts = response.prompts;
                updatePromptsList(currentPrompts);
                updateStorageInfo();
                
                // Update download button state
                if (downloadAllBtn) {
                    downloadAllBtn.disabled = currentPrompts.length === 0;
                }
            }
        });
    }

    // Update prompts list display
    function updatePromptsList(prompts) {
        if (!promptsContainer) return;

        if (prompts.length === 0) {
            promptsContainer.innerHTML = '<p style="text-align: center; color: #64748b; font-size: 12px;">No prompts captured yet</p>';
            return;
        }

        promptsContainer.innerHTML = '';
        
        prompts.slice(-10).reverse().forEach(prompt => {
            const promptItem = document.createElement('div');
            promptItem.className = 'prompt-item';
            
            const promptInfo = document.createElement('div');
            promptInfo.className = 'prompt-info';
            
            const promptText = document.createElement('div');
            promptText.className = 'prompt-text';
            promptText.textContent = prompt.prompt.substring(0, 50) + (prompt.prompt.length > 50 ? '...' : '');
            
            const promptTime = document.createElement('div');
            promptTime.className = 'prompt-time';
            promptTime.textContent = new Date(prompt.createdAt).toLocaleString();
            
            promptInfo.appendChild(promptText);
            promptInfo.appendChild(promptTime);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'prompt-download';
            downloadBtn.textContent = '↓';
            downloadBtn.onclick = () => downloadSinglePrompt(prompt.id);
            
            promptItem.appendChild(promptInfo);
            promptItem.appendChild(downloadBtn);
            promptsContainer.appendChild(promptItem);
        });
    }

    // Update storage information
    function updateStorageInfo() {
        chrome.runtime.sendMessage({action: 'getStorageInfo'}, function(response) {
            if (response) {
                if (storedCount) storedCount.textContent = response.promptCount || 0;
                if (storageUsed) {
                    const kb = Math.round((response.bytesInUse || 0) / 1024);
                    storageUsed.textContent = kb + ' KB';
                }
            }
        });
    }

    // Download single prompt
    function downloadSinglePrompt(promptId) {
        chrome.runtime.sendMessage({
            action: 'downloadPrompt',
            id: promptId
        }, function(response) {
            if (response && response.success) {
                showFeedback('Prompt downloaded to Downloads/chatgpt-prompts/', true);
            } else {
                showFeedback('Failed to download prompt: ' + (response?.error || 'Unknown error'), false);
            }
        });
    }

    // Download all prompts
    function downloadAllPrompts() {
        if (currentPrompts.length === 0) {
            showFeedback('No prompts to download', false);
            return;
        }

        downloadAllBtn.disabled = true;
        downloadAllBtn.textContent = 'Downloading...';

        chrome.runtime.sendMessage({action: 'downloadAllPrompts'}, function(response) {
            downloadAllBtn.disabled = false;
            downloadAllBtn.textContent = 'Download All';

            if (response && response.success) {
                showFeedback(`Downloaded ${response.count || currentPrompts.length} prompts to Downloads/chatgpt-prompts/`, true);
            } else {
                showFeedback('Failed to download prompts: ' + (response?.error || 'Unknown error'), false);
            }
        });
    }

    // Clear all prompts
    function clearAllPrompts() {
        if (currentPrompts.length === 0) {
            showFeedback('No prompts to clear', false);
            return;
        }

        if (!confirm(`Are you sure you want to delete all ${currentPrompts.length} captured prompts? This cannot be undone.`)) {
            return;
        }

        clearPromptsBtn.disabled = true;
        clearPromptsBtn.textContent = 'Clearing...';

        chrome.runtime.sendMessage({action: 'clearPrompts'}, function(response) {
            clearPromptsBtn.disabled = false;
            clearPromptsBtn.textContent = 'Clear All';

            if (response && response.success) {
                currentPrompts = [];
                updatePromptsList(currentPrompts);
                updateStorageInfo();
                if (promptCount) promptCount.textContent = '0';
                if (downloadAllBtn) downloadAllBtn.disabled = true;
                showFeedback('All prompts cleared successfully!', true);
            } else {
                showFeedback('Failed to clear prompts: ' + (response?.error || 'Unknown error'), false);
            }
        });
    }

    // Toggle prompts list visibility
    function togglePromptsList() {
        if (!promptsList) return;
        
        const isVisible = promptsList.style.display !== 'none';
        promptsList.style.display = isVisible ? 'none' : 'block';
        
        if (viewPromptsBtn) {
            viewPromptsBtn.textContent = isVisible ? 'View List' : 'Hide List';
        }
        
        if (!isVisible) {
            loadCapturedPrompts();
        }
    }

    // Event listeners
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCapture);
    }

    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', downloadAllPrompts);
    }

    if (viewPromptsBtn) {
        viewPromptsBtn.addEventListener('click', togglePromptsList);
    }

    if (clearPromptsBtn) {
        clearPromptsBtn.addEventListener('click', clearAllPrompts);
    }

    // Debug info toggle
    if (statusText) {
        statusText.addEventListener('dblclick', function() {
            if (debugInfo) {
                const isVisible = debugInfo.style.display !== 'none';
                debugInfo.style.display = isVisible ? 'none' : 'block';
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 't') {
            event.preventDefault();
            toggleCapture();
        }
        
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            downloadAllPrompts();
        }
        
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            getCurrentStatus();
        }
    });

    // Initialize popup
    function initializePopup() {
        console.log('🎬 Initializing popup...');
        
        getCurrentStatus();
        loadCapturedPrompts();

        if (statusCheckInterval) clearInterval(statusCheckInterval);
        statusCheckInterval = setInterval(() => {
            getCurrentStatus();
            updateStorageInfo();
        }, 15000);
        
        console.log('✅ Popup initialization complete');
    }

    // Cleanup on popup close
    window.addEventListener('beforeunload', function() {
        if (sessionTimer) clearInterval(sessionTimer);
        if (statusCheckInterval) clearInterval(statusCheckInterval);
        console.log('🧹 Popup cleanup completed');
    });

    // Start initialization
    initializePopup();

    // Error handling
    window.addEventListener('error', function(event) {
        console.error('Popup error:', event.error);
        showFeedback('Extension error occurred', false);
    });
});