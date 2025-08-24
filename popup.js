document.addEventListener('DOMContentLoaded', function() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleBtn');
    const promptCount = document.getElementById('promptCount');
    const captureStatus = document.getElementById('captureStatus');

    let isCapturing = true;

    // Update UI based on status
    function updateUI(status) {
        if (status && status.isCapturing) {
            statusIndicator.classList.add('active');
            statusIndicator.classList.remove('inactive');
            statusText.textContent = 'Active';
            toggleBtn.textContent = 'Disable';
            toggleBtn.classList.remove('inactive');
            captureStatus.textContent = 'Capturing prompts';
        } else {
            statusIndicator.classList.add('inactive');
            statusIndicator.classList.remove('active');
            statusText.textContent = 'Inactive';
            toggleBtn.textContent = 'Enable';
            toggleBtn.classList.add('inactive');
            captureStatus.textContent = 'Capture disabled';
        }
        
        promptCount.textContent = (status && status.promptCounter) || 0;
        isCapturing = status ? status.isCapturing : false;
    }

    // Check if we're on a ChatGPT page
    function isChatGPTPage(url) {
        return url && (url.includes('chat.openai.com') || url.includes('chatgpt.com'));
    }

    // Get current status with error handling
    function getCurrentStatus() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            if (!tab) {
                statusText.textContent = 'No active tab';
                captureStatus.textContent = 'Error: No tab found';
                toggleBtn.disabled = true;
                return;
            }

            if (!isChatGPTPage(tab.url)) {
                statusText.textContent = 'Not on ChatGPT';
                captureStatus.textContent = 'Navigate to ChatGPT';
                toggleBtn.disabled = true;
                statusIndicator.classList.add('inactive');
                statusIndicator.classList.remove('active');
                return;
            }

            // Enable the toggle button since we're on ChatGPT
            toggleBtn.disabled = false;

            // Try to get status from content script
            chrome.tabs.sendMessage(tab.id, {action: 'getStatus'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Content script not ready:', chrome.runtime.lastError.message);
                    // Content script might not be loaded yet
                    statusText.textContent = 'Loading...';
                    captureStatus.textContent = 'Initializing extension';
                    
                    // Set default active state
                    updateUI({isCapturing: true, promptCounter: 0});
                } else if (response) {
                    updateUI(response);
                } else {
                    // No response but no error - content script exists but didn't respond
                    statusText.textContent = 'Ready';
                    captureStatus.textContent = 'Extension ready';
                    updateUI({isCapturing: true, promptCounter: 0});
                }
            });
        });
    }

    // Toggle capture with error handling
    toggleBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            if (!tab || !isChatGPTPage(tab.url)) {
                return;
            }

            chrome.tabs.sendMessage(tab.id, {
                action: 'toggleCapture',
                enabled: !isCapturing
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Toggle failed:', chrome.runtime.lastError.message);
                    // If content script isn't responding, just update UI locally
                    isCapturing = !isCapturing;
                    updateUI({isCapturing: isCapturing, promptCounter: 0});
                } else if (response && response.success) {
                    // Get updated status
                    setTimeout(getCurrentStatus, 100);
                }
            });
        });
    });

    // Initial status check
    getCurrentStatus();

    // Refresh status every 5 seconds, but handle errors gracefully
    setInterval(() => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            if (!tab || !isChatGPTPage(tab.url)) {
                return;
            }

            chrome.tabs.sendMessage(tab.id, {action: 'getStatus'}, function(response) {
                if (chrome.runtime.lastError) {
                    // Content script might not be ready, that's okay
                    console.log('Status check - content script not ready');
                } else if (response) {
                    updateUI(response);
                }
            });
        });
    }, 5000);
});