// Content script to capture ChatGPT prompts
(function() {
    let isCapturing = true;
    let promptCounter = 0;

    console.log('ChatGPT Prompt Capture Extension loaded');

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
        
        console.log('Capturing prompt:', promptText);
        
        // Send to background script for file saving
        chrome.runtime.sendMessage({
            action: 'savePrompt',
            prompt: promptText,
            filename: filename,
            timestamp: new Date().toISOString()
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
            } else {
                console.log('Prompt saved successfully');
            }
        });
    }

    // Enhanced function to find and monitor prompt input
    function setupPromptMonitoring() {
        console.log('Setting up prompt monitoring...');
        
        // Multiple selectors to find the prompt input textarea
        const textareaSelectors = [
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="Send a message"]',
            'textarea[data-testid="textbox"]',
            '#prompt-textarea',
            'textarea[placeholder*="message"]',
            'div[contenteditable="true"]',
            'textarea'
        ];

        let textarea = null;
        
        // Try to find the textarea
        for (const selector of textareaSelectors) {
            textarea = document.querySelector(selector);
            if (textarea) {
                console.log('Found textarea with selector:', selector);
                break;
            }
        }

        if (!textarea) {
            console.log('Textarea not found, retrying in 2 seconds...');
            setTimeout(setupPromptMonitoring, 2000);
            return;
        }

        // Store the last prompt to avoid duplicates
        let lastPrompt = '';

        // Monitor for Enter key press
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                console.log('Enter key pressed');
                setTimeout(() => {
                    const currentPrompt = textarea.value || textarea.textContent || textarea.innerText;
                    if (currentPrompt && currentPrompt.trim() && currentPrompt !== lastPrompt) {
                        lastPrompt = currentPrompt;
                        capturePrompt(currentPrompt.trim());
                    }
                }, 100);
            }
        });

        // Monitor for send button clicks
        function monitorSendButtons() {
            const sendButtonSelectors = [
                'button[data-testid="send-button"]',
                'button[aria-label*="Send"]',
                'button[aria-label*="send"]',
                '[data-testid="fruitjuice-send-button"]',
                'button:has(svg)',
                'button svg[data-testid="send-button"]',
                'button:has([data-testid="send-button"])',
                'form button[type="submit"]',
                'button[type="submit"]'
            ];

            sendButtonSelectors.forEach(selector => {
                const buttons = document.querySelectorAll(selector);
                buttons.forEach(button => {
                    if (!button.hasAttribute('data-prompt-listener')) {
                        button.setAttribute('data-prompt-listener', 'true');
                        console.log('Added listener to send button');
                        
                        button.addEventListener('click', function(e) {
                            console.log('Send button clicked');
                            setTimeout(() => {
                                const currentPrompt = textarea.value || textarea.textContent || textarea.innerText;
                                if (currentPrompt && currentPrompt.trim() && currentPrompt !== lastPrompt) {
                                    lastPrompt = currentPrompt;
                                    capturePrompt(currentPrompt.trim());
                                }
                            }, 100);
                        });
                    }
                });
            });
        }

        monitorSendButtons();

        // Re-monitor for dynamically added buttons every 3 seconds
        setInterval(() => {
            monitorSendButtons();
            
            // Also check if textarea still exists, if not, restart monitoring
            if (!document.contains(textarea)) {
                console.log('Textarea no longer exists, restarting monitoring...');
                setTimeout(setupPromptMonitoring, 1000);
            }
        }, 3000);
    }

    // Initialize monitoring when page loads
    function initialize() {
        console.log('Initializing ChatGPT Prompt Capture...');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupPromptMonitoring);
        } else {
            setupPromptMonitoring();
        }
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Received message:', request);
        if (request.action === 'toggleCapture') {
            isCapturing = request.enabled;
            console.log('Capture toggled:', isCapturing);
            sendResponse({success: true});
        } else if (request.action === 'getStatus') {
            sendResponse({
                isCapturing: isCapturing,
                promptCounter: promptCounter
            });
        }
    });

    // Monitor for navigation changes in SPA
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('URL changed, reinitializing...');
            setTimeout(initialize, 2000);
        }
    }).observe(document, {subtree: true, childList: true});

    // Start the extension
    initialize();

})();