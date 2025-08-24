// Content script to capture ChatGPT prompts
(function() {
    let isCapturing = true;
    let promptCounter = 0;

    // Function to get current timestamp
    function getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-');
    }

    // Function to capture prompt text
    function capturePrompt(promptText) {
        if (!promptText.trim() || !isCapturing) return;
        
        promptCounter++;
        const timestamp = getTimestamp();
        const filename = `chatgpt-prompt-${timestamp}.txt`;
        
        // Send to background script for file saving
        chrome.runtime.sendMessage({
            action: 'savePrompt',
            prompt: promptText,
            filename: filename,
            timestamp: new Date().toISOString()
        });
        
        console.log('ChatGPT Prompt Captured:', promptText);
    }

    // Function to monitor textarea changes and form submissions
    function setupPromptMonitoring() {
        // Look for the main textarea where users type prompts
        const textareaSelector = 'textarea[placeholder*="Message"], textarea[data-testid="textbox"], #prompt-textarea, textarea[placeholder*="Send a message"]';
        
        // Monitor for form submissions
        function monitorSubmissions() {
            const textarea = document.querySelector(textareaSelector);
            if (!textarea) {
                setTimeout(monitorSubmissions, 1000);
                return;
            }

            // Monitor for Enter key or send button clicks
            textarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    setTimeout(() => {
                        const promptText = textarea.value || textarea.textContent;
                        if (promptText && promptText.trim()) {
                            capturePrompt(promptText.trim());
                        }
                    }, 100);
                }
            });

            // Monitor for send button clicks
            const sendButtonSelectors = [
                'button[data-testid="send-button"]',
                'button[aria-label*="Send"]',
                '[data-testid="fruitjuice-send-button"]',
                'button svg[data-testid="send-button"]',
                'button:has(svg[data-testid="send-button"])'
            ];

            sendButtonSelectors.forEach(selector => {
                const buttons = document.querySelectorAll(selector);
                buttons.forEach(button => {
                    if (!button.hasAttribute('data-prompt-listener')) {
                        button.setAttribute('data-prompt-listener', 'true');
                        button.addEventListener('click', function() {
                            setTimeout(() => {
                                const textarea = document.querySelector(textareaSelector);
                                if (textarea) {
                                    const promptText = textarea.value || textarea.textContent;
                                    if (promptText && promptText.trim()) {
                                        capturePrompt(promptText.trim());
                                    }
                                }
                            }, 100);
                        });
                    }
                });
            });

            // Re-monitor every 2 seconds for dynamically added elements
            setTimeout(monitorSubmissions, 2000);
        }

        monitorSubmissions();
    }

    // Initialize monitoring when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupPromptMonitoring);
    } else {
        setupPromptMonitoring();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleCapture') {
            isCapturing = request.enabled;
            sendResponse({success: true});
        } else if (request.action === 'getStatus') {
            sendResponse({
                isCapturing: isCapturing,
                promptCounter: promptCounter
            });
        }
    });

    // Also monitor for navigation changes in SPA
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(setupPromptMonitoring, 1000);
        }
    }).observe(document, {subtree: true, childList: true});

})();