document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Popup loaded');
    
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

    let isCapturing = true;
    let startTime = Date.now();
    let sessionTimer = null;

    // Update session timer
    function updateSessionTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 60000);
        sessionTime.textContent = elapsed + 'm';
    }

    // Start session timer
    sessionTimer = setInterval(updateSessionTimer, 60000);
    updateSessionTimer();

    // Update UI based on status
    function updateUI(status, errorMessage = null) {
        const now = new Date().toLocaleTimeString();
        lastUpdate.textContent = now;

        if (errorMessage) {
            statusIndicator.classList.add('inactive');
            statusIndicator.classList.remove('active');
            statusText.textContent = 'Error';
            statusMessage.textContent = errorMessage;
            statusMessage.style.color = '#dc2626';
            toggleBtn.disabled = true;
            toggleBtn.textContent = 'Unavailable';
            extensionStatus.textContent = 'Error';
            return;
        }

        if (status && status.isCapturing !== undefined) {
            if (status.isCapturing) {
                statusIndicator.classList.add('active');
                statusIndicator.classList.remove('inactive');
                statusText.textContent = 'Active';
                statusMessage.textContent = 'Ready to capture prompts';
                statusMessage.style.color = '#16a34a';
                toggleBtn.textContent = 'Disable';
                toggleBtn.classList.remove('inactive');
            } else {
                statusIndicator.classList.add('inactive');
                statusIndicator.classList.remove('active');
                statusText.textContent = 'Inactive';
                statusMessage.textContent = 'Prompt capture is disabled';
                statusMessage.style.color = '#dc2626';
                toggleBtn.textContent = 'Enable';
                toggleBtn.classList.add('inactive');
            }
            
            promptCount.textContent = status.promptCounter || 0;
            isCapturing = status.isCapturing;
            toggleBtn.disabled = false;
            extensionStatus.textContent = status.isInitialized ? 'Initialized' : 'Loading';
            
            if (status.currentUrl) {
                currentUrl.textContent = status.currentUrl.substring(0, 50) + '...';
            }
        } else {
            statusIndicator.classList.add('inactive');
            statusIndicator.classList.remove('active');
            statusText.textContent = 'Loading';
            statusMessage.textContent = 'Initializing extension...';
            statusMessage.style.color = '#64748b';
            toggleBtn.disabled = true;
            toggleBtn.textContent = 'Loading...';
            extensionStatus.textContent = 'Loading';
        }
    }

    // Check if we're on a ChatGPT page
    function isChatGPTPage(url) {
        return url && (
            url.includes('chat.openai.com') || 
            url.includes('chatgpt.com') ||
            url.includes('openai.com')
        );
    }

    // Get current status
    function getCurrentStatus() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            if (!tab) {
                updateUI(null, 'No active tab found');
                return;
            }

            currentUrl.textContent = tab.url || 'Unknown';

            if (!isChatGPTPage(tab.url)) {
                updateUI(null, 'Please navigate to ChatGPT (chat.openai.com or chatgpt.com)');
                return;
            }

            // Try to get status from content script
            chrome.tabs.sendMessage(tab.id, {action: 'getStatus'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Content script communication error:', chrome.runtime.lastError.message);
                    
                    // Content script might not be ready yet
                    if (chrome.runtime.lastError.message.includes('Could not establish connection')) {
                        updateUI(null, 'Extension loading... Please refresh the ChatGPT page if this persists.');
                    } else {
                        updateUI(null, 'Extension not ready. Try refreshing the page.');
                    }
                } else if (response) {
                    console.log('Received status:', response);
                    updateUI(response);
                } else {
                    updateUI(null, 'No response from content script. Try refreshing the page.');
                }
            });
        });
    }

    // Toggle capture
    toggleBtn.addEventListener('click', function() {
        if (toggleBtn.disabled) return;

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            if (!tab || !isChatGPTPage(tab.url)) {
                return;
            }

            const newState = !isCapturing;
            console.log('Toggling capture to:', newState);

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
                    setTimeout(getCurrentStatus, 200);
                } else {
                    updateUI(null, 'Toggle failed. Try refreshing the page.');
                }
            });
        });
    });

    // Show debug info on double-click
    statusText.addEventListener('dblclick', function() {
        debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
    });

    // Update file path based on platform
    function updateFilePath() {
        const platform = navigator.platform.toLowerCase();
        let path = 'Downloads/chatgpt-prompts/';
        
        if (platform.includes('win')) {
            path = 'C:\\Users\\[Username]\\Downloads\\chatgpt-prompts\\';
        } else if (platform.includes('mac')) {
            path = '/Users/[Username]/Downloads/chatgpt-prompts/';
        } else if (platform.includes('linux')) {
            path = '/home/[Username]/Downloads/chatgpt-prompts/';
        }
        
        currentPath.textContent = path;
    }

    // Initialize
    updateFilePath();
    getCurrentStatus();

    // Refresh status periodically, but less frequently to avoid spam
    const statusInterval = setInterval(() => {
        getCurrentStatus();
    }, 10000); // Every 10 seconds

    // Clean up on popup close
    window.addEventListener('beforeunload', function() {
        if (sessionTimer) clearInterval(sessionTimer);
        if (statusInterval) clearInterval(statusInterval);
    });

    console.log('✅ Popup initialization complete');
});