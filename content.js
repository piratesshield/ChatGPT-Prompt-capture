// Content script to capture ChatGPT prompts
(function() {
    let isCapturing = true;
    let promptCounter = 0;
    let isInitialized = false;
    let lastPromptText = '';
    let lastSubmissionTime = 0;

    console.log('ChatGPT Prompt Capture Extension loaded');

    // Function to get current timestamp
    function getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-');
    }

    // Function to capture prompt text
    function capturePrompt(promptText) {
        if (!promptText.trim() || !isCapturing) return;
        
        // Prevent duplicate captures
        const now = Date.now();
        if (promptText === lastPromptText && (now - lastSubmissionTime) < 3000) {
            console.log('Duplicate prompt detected, skipping...');
            return;
        }
        
        lastPromptText = promptText;
        lastSubmissionTime = now;
        promptCounter++;
        
        const timestamp = getTimestamp();
        const filename = `chatgpt-prompt-${timestamp}.txt`;
        
        console.log('🎯 CAPTURING PROMPT:', promptText.substring(0, 100) + '...');
        console.log('📁 Saving to:', filename);
        
        // Send to background script for file saving
        chrome.runtime.sendMessage({
            action: 'savePrompt',
            prompt: promptText,
            filename: filename,
            timestamp: new Date().toISOString()
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Error sending message to background:', chrome.runtime.lastError);
            } else {
                console.log('✅ Prompt saved successfully');
            }
        });
    }

    // Function to find the main textarea
    function findTextarea() {
        const selectors = [
            'textarea[data-id="root"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="Send a message"]',
            'textarea[data-testid="textbox"]',
            '#prompt-textarea',
            'textarea[placeholder*="message"]',
            'div[contenteditable="true"][data-testid="textbox"]',
            'div[contenteditable="true"]',
            'textarea'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.width > 50 && rect.height > 20 && 
                                rect.top >= 0 && rect.left >= 0;
                
                if (isVisible) {
                    console.log('✅ Found textarea with selector:', selector);
                    return element;
                }
            }
        }
        return null;
    }

    // Function to get text from element
    function getTextFromElement(element) {
        if (!element) return '';
        
        // For regular textareas
        if (element.tagName === 'TEXTAREA') {
            return element.value || '';
        }
        
        // For contenteditable divs
        if (element.contentEditable === 'true') {
            return element.textContent || element.innerText || '';
        }
        
        return element.value || element.textContent || element.innerText || '';
    }

    // Function to setup monitoring on the textarea
    function setupTextareaMonitoring(textarea) {
        if (!textarea) return false;

        console.log('🔧 Setting up monitoring on textarea...');

        // Store reference to current prompt
        let currentPrompt = '';

        // Function to capture current prompt
        function captureCurrentPrompt() {
            const text = getTextFromElement(textarea);
            if (text && text.trim() && text !== currentPrompt) {
                currentPrompt = text;
                console.log('📝 Prompt ready for capture:', text.substring(0, 50) + '...');
                
                // Capture after a short delay to ensure it's the final text
                setTimeout(() => {
                    capturePrompt(text.trim());
                }, 500);
            }
        }

        // Monitor Enter key (most common way to submit)
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                console.log('⌨️ Enter key pressed - capturing prompt');
                captureCurrentPrompt();
            }
        });

        // Monitor for input changes
        textarea.addEventListener('input', function() {
            currentPrompt = getTextFromElement(textarea);
        });

        // Monitor for paste events
        textarea.addEventListener('paste', function() {
            setTimeout(() => {
                currentPrompt = getTextFromElement(textarea);
            }, 100);
        });

        return true;
    }

    // Function to find and monitor send buttons
    function monitorSendButtons() {
        const sendSelectors = [
            'button[data-testid="send-button"]',
            'button[aria-label*="Send"]',
            'button[aria-label*="send"]',
            'button:has(svg[data-testid="send-button"])',
            'button[type="submit"]',
            'form button[type="submit"]',
            'button svg[viewBox="0 0 24 24"]',
            'button[class*="send"]'
        ];

        let buttonsFound = 0;

        sendSelectors.forEach(selector => {
            try {
                const buttons = document.querySelectorAll(selector);
                buttons.forEach(button => {
                    if (!button.hasAttribute('data-prompt-capture-listener')) {
                        button.setAttribute('data-prompt-capture-listener', 'true');
                        
                        button.addEventListener('click', function(e) {
                            console.log('🖱️ Send button clicked');
                            
                            // Find the textarea and capture its content
                            const textarea = findTextarea();
                            if (textarea) {
                                const text = getTextFromElement(textarea);
                                if (text && text.trim()) {
                                    console.log('📤 Capturing prompt from button click');
                                    setTimeout(() => capturePrompt(text.trim()), 200);
                                }
                            }
                        });
                        
                        buttonsFound++;
                        console.log('✅ Added listener to send button:', selector);
                    }
                });
            } catch (error) {
                console.log('⚠️ Error with selector:', selector, error);
            }
        });

        console.log(`🔘 Found ${buttonsFound} send buttons`);
        return buttonsFound > 0;
    }

    // Main setup function
    function setupPromptMonitoring() {
        console.log('🚀 Setting up ChatGPT prompt monitoring...');
        
        // Find the main textarea
        const textarea = findTextarea();
        
        if (!textarea) {
            console.log('❌ Textarea not found, retrying in 3 seconds...');
            setTimeout(setupPromptMonitoring, 3000);
            return;
        }

        // Setup textarea monitoring
        const textareaSuccess = setupTextareaMonitoring(textarea);
        
        // Setup button monitoring
        const buttonsSuccess = monitorSendButtons();
        
        if (textareaSuccess || buttonsSuccess) {
            isInitialized = true;
            console.log('✅ Prompt monitoring setup complete!');
            
            // Re-scan for new buttons every 5 seconds
            setInterval(() => {
                monitorSendButtons();
                
                // Check if textarea still exists
                if (!document.contains(textarea)) {
                    console.log('🔄 Textarea removed, restarting monitoring...');
                    isInitialized = false;
                    setTimeout(setupPromptMonitoring, 2000);
                }
            }, 5000);
        } else {
            console.log('❌ Failed to setup monitoring, retrying...');
            setTimeout(setupPromptMonitoring, 3000);
        }
    }

    // Initialize the extension
    function initialize() {
        console.log('🎬 Initializing ChatGPT Prompt Capture Extension...');
        
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
        console.log('📨 Content script received message:', request);
        
        try {
            if (request.action === 'toggleCapture') {
                isCapturing = request.enabled;
                console.log('🔄 Capture toggled:', isCapturing ? 'ON' : 'OFF');
                sendResponse({success: true, isCapturing: isCapturing});
            } else if (request.action === 'getStatus') {
                const status = {
                    isCapturing: isCapturing,
                    promptCounter: promptCounter,
                    isInitialized: isInitialized
                };
                console.log('📊 Sending status:', status);
                sendResponse(status);
            }
        } catch (error) {
            console.error('❌ Error handling message:', error);
            sendResponse({error: error.message});
        }
        
        return true;
    });

    // Monitor for navigation changes (SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('🔄 URL changed, reinitializing...');
            isInitialized = false;
            setTimeout(initialize, 3000);
        }
    }).observe(document, {subtree: true, childList: true});

    // Start the extension
    initialize();

    // Debug: Log page info
    setTimeout(() => {
        console.log('🌐 Page URL:', window.location.href);
        console.log('📄 Page title:', document.title);
        console.log('🔍 Available textareas:', document.querySelectorAll('textarea').length);
        console.log('🔍 Available contenteditable:', document.querySelectorAll('[contenteditable="true"]').length);
    }, 3000);

})();