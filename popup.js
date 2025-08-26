document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Enhanced Popup loaded v2.1');
    
    // DOM elements
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const statusMessage = document.getElementById('statusMessage');
    const toggleBtn = document.getElementById('toggleBtn');
    const promptCount = document.getElementById('promptCount');
    const sessionTime = document.getElementById('sessionTime');
    const currentPath = document.getElementById('currentPath');
    const debugInfo = document.getElementById('debugInfo');
    const currentUrl = document.getElementById('currentUrl');
    const extensionStatus = document.getElementById('extensionStatus');
    const lastUpdate = document.getElementById('lastUpdate');
    
    // New debug button
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug Info';
    debugBtn.style.cssText = 'margin-top: 10px; padding: 5px 10px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';
    debugBtn.onclick = requestDebugInfo;

    let isCapturing = true;
    let startTime = Date.now();
    let sessionTimer = null;
    let statusCheckInterval = null;

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

    // Request debug information from content script
    function requestDebugInfo() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            if (!tab) return;

            chrome.tabs.sendMessage(tab.id, {action: 'debugInfo'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Debug request failed:', chrome.runtime.lastError.message);
                } else {
                    console.log('Debug info requested');
                }
            });
        });
    }

    // Enhanced UI update with better error handling
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
                toggleBtn.className = status.isCapturing ? '' : 'inactive';
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
            
            // Show additional debug info if available
            if (status.lastInputValue && debugInfo) {
                const debugText = debugInfo.querySelector('p') || document.createElement('p');
                debugText.textContent = `Last Input: ${status.lastInputValue}`;
                if (!debugInfo.contains(debugText)) {
                    debugInfo.appendChild(debugText);
                }
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
        
        // Update indicator classes
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

    // Enhanced ChatGPT page detection
    function isChatGPTPage(url) {
        if (!url) return false;
        
        const validDomains = [
            'chat.openai.com',
            'chatgpt.com'
        ];
        
        return validDomains.some(domain => url.includes(domain));
    }

    // Enhanced status checking with retry logic
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

            // Try to get status from content script
            chrome.tabs.sendMessage(tab.id, {action: 'getStatus'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Content script communication error:', chrome.runtime.lastError.message);
                    
                    // Retry logic for content script not ready
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

    // Enhanced toggle functionality
    function toggleCapture() {
        if (!toggleBtn || toggleBtn.disabled) return;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            if (!tab || !isChatGPTPage(tab.url)) {
                return;
            }

            const newState = !isCapturing;
            console.log('Toggling capture to:', newState);

            // Update UI immediately for responsiveness
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
                    // Refresh status after a short delay
                    setTimeout(getCurrentStatus, 500);
                } else {
                    updateUI(null, 'Toggle failed. Try refreshing the page.');
                }
            });
        });
    }

    // Event listeners
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCapture);
    }

    // Enhanced debug info toggle
    if (statusText) {
        statusText.addEventListener('dblclick', function() {
            if (debugInfo) {
                const isVisible = debugInfo.style.display !== 'none';
                debugInfo.style.display = isVisible ? 'none' : 'block';
                
                if (!isVisible && !debugInfo.contains(debugBtn)) {
                    debugInfo.appendChild(debugBtn);
                }
            }
        });
    }

    // Update file path based on platform with better detection
    function updateFilePath() {
        if (!currentPath) return;
        
        const platform = navigator.platform.toLowerCase();
        const userAgent = navigator.userAgent.toLowerCase();
        let path = 'Downloads/chatgpt-prompts/';
        
        if (platform.includes('win') || userAgent.includes('windows')) {
            path = 'C:\\Users\\[Username]\\Downloads\\chatgpt-prompts\\';
        } else if (platform.includes('mac') || userAgent.includes('mac')) {
            path = '/Users/[Username]/Downloads/chatgpt-prompts/';
        } else if (platform.includes('linux') || userAgent.includes('linux')) {
            path = '/home/[Username]/Downloads/chatgpt-prompts/';
        }
        
        currentPath.textContent = path;
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + T to toggle
        if ((event.ctrlKey || event.metaKey) && event.key === 't') {
            event.preventDefault();
            toggleCapture();
        }
        
        // Ctrl/Cmd + D for debug info
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            requestDebugInfo();
        }
        
        // Ctrl/Cmd + R to refresh status
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            getCurrentStatus();
        }
    });

    // Add keyboard shortcut info to popup
    const shortcutsInfo = document.createElement('div');
    shortcutsInfo.innerHTML = `
        <small style="color: #666; font-size: 11px; margin-top: 10px; display: block;">
            Shortcuts: Ctrl+T (toggle) | Ctrl+D (debug) | Ctrl+R (refresh)
        </small>
    `;
    
    // Find a good place to add shortcuts info
    const container = document.querySelector('.container') || document.body;
    if (container && container.lastElementChild) {
        container.appendChild(shortcutsInfo);
    }

    // Initialize popup
    function initializePopup() {
        console.log('🎬 Initializing popup...');
        
        updateFilePath();
        getCurrentStatus();

        // Set up less frequent status checking to avoid overwhelming the content script
        if (statusCheckInterval) clearInterval(statusCheckInterval);
        statusCheckInterval = setInterval(() => {
            getCurrentStatus();
        }, 15000); // Every 15 seconds instead of 10
        
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

    // Add visual feedback for actions
    function showFeedback(message, isSuccess = true) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            background: ${isSuccess ? '#16a34a' : '#dc2626'};
            color: white;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        // Animate in
        setTimeout(() => feedback.style.opacity = '1', 10);
        
        // Remove after delay
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);
    }

    // Enhanced error reporting
    window.addEventListener('error', function(event) {
        console.error('Popup error:', event.error);
        showFeedback('Extension error occurred', false);
    });

});
