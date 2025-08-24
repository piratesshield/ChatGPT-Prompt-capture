document.addEventListener('DOMContentLoaded', function() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleBtn');
    const promptCount = document.getElementById('promptCount');
    const captureStatus = document.getElementById('captureStatus');

    let isCapturing = true;

    // Update UI based on status
    function updateUI(status) {
        if (status.isCapturing) {
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
        
        promptCount.textContent = status.promptCounter || 0;
        isCapturing = status.isCapturing;
    }

    // Get current status
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tab = tabs[0];
        if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
            chrome.tabs.sendMessage(tab.id, {action: 'getStatus'}, function(response) {
                if (response) {
                    updateUI(response);
                } else {
                    statusText.textContent = 'Not on ChatGPT';
                    captureStatus.textContent = 'Navigate to ChatGPT';
                }
            });
        } else {
            statusText.textContent = 'Not on ChatGPT';
            captureStatus.textContent = 'Navigate to ChatGPT';
            toggleBtn.disabled = true;
        }
    });

    // Toggle capture
    toggleBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleCapture',
                    enabled: !isCapturing
                }, function(response) {
                    if (response && response.success) {
                        // Get updated status
                        chrome.tabs.sendMessage(tab.id, {action: 'getStatus'}, function(response) {
                            if (response) {
                                updateUI(response);
                            }
                        });
                    }
                });
            }
        });
    });

    // Refresh status every 3 seconds
    setInterval(() => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
                chrome.tabs.sendMessage(tab.id, {action: 'getStatus'}, function(response) {
                    if (response) {
                        updateUI(response);
                    }
                });
            }
        });
    }, 3000);
});