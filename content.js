// Content script to capture ChatGPT prompts
(function() {
    let isCapturing = true;
    let promptCounter = 0;
    let isInitialized = false;

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
        
        console.log('Capturing prompt:', promptText.substring(0, 100) + '...');
        
        // Send to background script for file saving
        chrome.runtime.sendMessage({
            action: 'savePrompt',
            prompt: promptText,
            filename: filename,
            timestamp: new Date().toISOString()
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message to background:', chrome.runtime.lastError);
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
            'textarea',
            '[contenteditable="true"]'
        ];

        let textarea = null;
        
        // Try to find the textarea
        for (const selector of textareaSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                // Check if this element is visible and likely the main input
                const rect = element.getBoundingClientRect();
                if (rect.width > 100 && rect.height > 20) {
                    textarea = element;
                    console.log('Found textarea with selector:', selector);
                    break;
                }
            }
            if (textarea) break;
        }

        if (!textarea) {
            console.log('Textarea not found, retrying in 3 seconds...');
            setTimeout(setupPromptMonitoring, 3000);
            return;
        }

        // Store the last prompt to avoid duplicates
        let lastPrompt = '';
        let lastCaptureTime = 0;

        // Function to get current prompt text
        function getCurrentPrompt() {
            return textarea.value || textarea.textContent || textarea.innerText || '';
        }

        // Function to handle prompt capture
        function handlePromptCapture() {
            const now = Date.now();
            // Prevent duplicate captures within 2 seconds
            if (now - lastCaptureTime < 2000) return;
            
            setTimeout(() => {
                const currentPrompt = getCurrentPrompt();
                if (currentPrompt && currentPrompt.trim() && currentPrompt !== lastPrompt) {
                    lastPrompt = currentPrompt;
                    lastCaptureTime = now;
                    capturePrompt(currentPrompt.trim());
                }
            }, 200);
        }

        // Monitor for Enter key press
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                console.log('Enter key pressed for prompt submission');
                handlePromptCapture();
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
                'button[type="submit"]',
                'button[class*="send"]',
                'button[class*="Send"]'
            ];

            sendButtonSelectors.forEach(selector => {
                try {
                    const buttons = document.querySelectorAll(selector);
                    buttons.forEach(button => {
                        if (!button.hasAttribute('data-prompt-listener')) {
                            button.setAttribute('data-prompt-listener', 'true');
                            console.log('Added listener to send button:', selector);
                            
                            button.addEventListener('click', function(e) {
                                console.log('Send button clicked');
                                handlePromptCapture();
                            });
                        }
                    });
                } catch (error) {
                    console.log('Error setting up button listener for selector:', selector, error);
                }
            });
        }

        monitorSendButtons();
        isInitialized = true;

        // Re-monitor for dynamically added buttons every 5 seconds
        setInterval(() => {
            monitorSendButtons();
            
            // Also check if textarea still exists, if not, restart monitoring
            if (!document.contains(textarea)) {
                console.log('Textarea no longer exists, restarting monitoring...');
                isInitialized = false;
                setTimeout(setupPromptMonitoring, 2000);
            }
        }, 5000);

        console.log('Prompt monitoring setup complete');
    }

    // Initialize monitoring when page loads
    function initialize() {
        console.log('Initializing ChatGPT Prompt Capture...');
        
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(setupPromptMonitoring, 2000);
            });
        } else {
            setTimeout(setupPromptMonitoring, 2000);
        }
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        try {
            if (request.action === 'toggleCapture') {
                isCapturing = request.enabled;
                console.log('Capture toggled:', isCapturing);
                sendResponse({success: true});
            } else if (request.action === 'getStatus') {
                sendResponse({
                    isCapturing: isCapturing,
                    promptCounter: promptCounter,
                    isInitialized: isInitialized
                });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({error: error.message});
        }
        
        return true; // Keep message channel open for async response
    });

    // Monitor for navigation changes in SPA
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('URL changed, reinitializing...');
            isInitialized = false;
            setTimeout(initialize, 3000);
        }
    }).observe(document, {subtree: true, childList: true});

    // Start the extension
    initialize();

    // Let popup know we're ready
    setTimeout(() => {
        console.log('Content script fully loaded and ready');
    }, 1000);

})();