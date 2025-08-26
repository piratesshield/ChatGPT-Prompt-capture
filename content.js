// Enhanced ChatGPT Prompt Capture Content Script
(function() {
    'use strict';
    
    let isCapturing = true;
    let promptCounter = 0;
    let lastCapturedPrompt = '';
    let lastCaptureTime = 0;
    let observer = null;
    
    console.log('🚀 ChatGPT Prompt Capture Extension v2.0 loaded');

    // Enhanced selectors for ChatGPT's current interface
    const TEXTAREA_SELECTORS = [
        'textarea[placeholder*="Message"]',
        'textarea[data-id="root"]',
        'div[contenteditable="true"][data-testid="textbox"]',
        'div[contenteditable="true"]',
        'textarea',
        '#prompt-textarea',
        '[data-testid="textbox"]'
    ];

    const SEND_BUTTON_SELECTORS = [
        'button[data-testid="send-button"]',
        'button[data-testid="fruitjuice-send-button"]',
        'button[aria-label*="Send"]',
        'button svg[data-testid="send-button"]',
        'form button[type="submit"]',
        'button:has(svg)',
        '[data-testid="send-button"]'
    ];

    // Get current timestamp for filename
    function getTimestamp() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    }

    // Extract text from various element types
    function extractText(element) {
        if (!element) return '';
        
        if (element.tagName === 'TEXTAREA') {
            return element.value || '';
        }
        
        if (element.contentEditable === 'true') {
            // For contenteditable divs, get plain text
            return element.textContent || element.innerText || '';
        }
        
        return element.value || element.textContent || element.innerText || '';
    }

    // Save prompt to file
    function savePrompt(promptText) {
        if (!promptText || !promptText.trim() || !isCapturing) {
            console.log('❌ Prompt empty or capturing disabled');
            return;
        }

        const cleanPrompt = promptText.trim();
        const now = Date.now();
        
        // Prevent duplicate captures (within 2 seconds)
        if (cleanPrompt === lastCapturedPrompt && (now - lastCaptureTime) < 2000) {
            console.log('⚠️ Duplicate prompt detected, skipping');
            return;
        }

        lastCapturedPrompt = cleanPrompt;
        lastCaptureTime = now;
        promptCounter++;

        const timestamp = getTimestamp();
        const filename = `chatgpt-prompt-${timestamp}.txt`;
        
        console.log(`🎯 CAPTURING PROMPT #${promptCounter}:`);
        console.log(`📝 Text: "${cleanPrompt.substring(0, 100)}${cleanPrompt.length > 100 ? '...' : ''}"`);
        console.log(`💾 Filename: ${filename}`);

        // Send to background script
        chrome.runtime.sendMessage({
            action: 'savePrompt',
            prompt: cleanPrompt,
            filename: filename,
            timestamp: new Date().toISOString(),
            counter: promptCounter
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Failed to save prompt:', chrome.runtime.lastError.message);
            } else if (response && response.success) {
                console.log('✅ Prompt saved successfully!');
                console.log(`📁 Saved to: Downloads/chatgpt-prompts/${filename}`);
            } else {
                console.error('❌ Background script failed to save prompt');
            }
        });
    }

    // Find the main input element
    function findInputElement() {
        for (const selector of TEXTAREA_SELECTORS) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.width > 50 && rect.height > 20 && 
                                rect.top >= 0 && rect.left >= 0 &&
                                getComputedStyle(element).display !== 'none';
                
                if (isVisible) {
                    console.log(`✅ Found input element: ${selector}`);
                    return element;
                }
            }
        }
        console.log('❌ No input element found');
        return null;
    }

    // Find send buttons
    function findSendButtons() {
        const buttons = [];
        for (const selector of SEND_BUTTON_SELECTORS) {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(button => {
                    const rect = button.getBoundingClientRect();
                    const isVisible = rect.width > 10 && rect.height > 10 && 
                                    rect.top >= 0 && rect.left >= 0 &&
                                    getComputedStyle(button).display !== 'none';
                    
                    if (isVisible && !button.hasAttribute('data-prompt-listener')) {
                        buttons.push(button);
                    }
                });
            } catch (error) {
                console.log(`⚠️ Error with selector ${selector}:`, error);
            }
        }
        console.log(`🔘 Found ${buttons.length} send buttons`);
        return buttons;
    }

    // Setup input monitoring
    function setupInputMonitoring(inputElement) {
        if (!inputElement) return false;

        console.log('🔧 Setting up input monitoring...');

        // Monitor Enter key
        inputElement.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                console.log('⌨️ Enter key detected');
                const text = extractText(inputElement);
                if (text && text.trim()) {
                    console.log('📤 Capturing prompt from Enter key');
                    setTimeout(() => savePrompt(text), 100);
                }
            }
        }, true);

        // Monitor input changes for debugging
        inputElement.addEventListener('input', function() {
            const text = extractText(inputElement);
            if (text && text.length > 10) {
                console.log(`📝 Input detected: "${text.substring(0, 50)}..."`);
            }
        });

        return true;
    }

    // Setup button monitoring
    function setupButtonMonitoring() {
        const buttons = findSendButtons();
        let setupCount = 0;

        buttons.forEach(button => {
            if (!button.hasAttribute('data-prompt-listener')) {
                button.setAttribute('data-prompt-listener', 'true');
                
                button.addEventListener('click', function(event) {
                    console.log('🖱️ Send button clicked');
                    
                    // Find input and capture its content
                    const inputElement = findInputElement();
                    if (inputElement) {
                        const text = extractText(inputElement);
                        if (text && text.trim()) {
                            console.log('📤 Capturing prompt from button click');
                            setTimeout(() => savePrompt(text), 100);
                        } else {
                            console.log('⚠️ No text found in input element');
                        }
                    } else {
                        console.log('❌ No input element found for button click');
                    }
                }, true);
                
                setupCount++;
            }
        });

        console.log(`✅ Setup monitoring on ${setupCount} buttons`);
        return setupCount > 0;
    }

    // Main initialization function
    function initializeCapture() {
        console.log('🎬 Initializing ChatGPT prompt capture...');
        
        // Check if we're on the right page
        const isValidPage = window.location.hostname.includes('openai.com') || 
                           window.location.hostname.includes('chatgpt.com');
        
        if (!isValidPage) {
            console.log('❌ Not on a valid ChatGPT page');
            return;
        }

        console.log('✅ On valid ChatGPT page:', window.location.href);

        // Find and setup input monitoring
        const inputElement = findInputElement();
        const inputSetup = setupInputMonitoring(inputElement);
        
        // Setup button monitoring
        const buttonSetup = setupButtonMonitoring();
        
        if (inputSetup || buttonSetup) {
            console.log('✅ Prompt capture initialized successfully!');
            
            // Setup mutation observer to handle dynamic content
            if (observer) observer.disconnect();
            
            observer = new MutationObserver((mutations) => {
                let shouldReinitialize = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Check if new buttons or inputs were added
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const hasNewButtons = SEND_BUTTON_SELECTORS.some(selector => 
                                    node.matches && node.matches(selector) || 
                                    node.querySelector && node.querySelector(selector)
                                );
                                const hasNewInputs = TEXTAREA_SELECTORS.some(selector => 
                                    node.matches && node.matches(selector) || 
                                    node.querySelector && node.querySelector(selector)
                                );
                                
                                if (hasNewButtons || hasNewInputs) {
                                    shouldReinitialize = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldReinitialize) {
                    console.log('🔄 DOM changed, reinitializing...');
                    setTimeout(setupButtonMonitoring, 500);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
        } else {
            console.log('❌ Failed to initialize, retrying in 3 seconds...');
            setTimeout(initializeCapture, 3000);
        }
    }

    // Message listener for popup communication
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 Content script received message:', request);
        
        try {
            if (request.action === 'getStatus') {
                const status = {
                    isCapturing: isCapturing,
                    promptCounter: promptCounter,
                    isInitialized: true,
                    currentUrl: window.location.href
                };
                console.log('📊 Sending status:', status);
                sendResponse(status);
            } else if (request.action === 'toggleCapture') {
                isCapturing = request.enabled;
                console.log(`🔄 Capture ${isCapturing ? 'ENABLED' : 'DISABLED'}`);
                sendResponse({success: true, isCapturing: isCapturing});
            }
        } catch (error) {
            console.error('❌ Error handling message:', error);
            sendResponse({error: error.message});
        }
        
        return true;
    });

    // Handle page navigation (SPA)
    let currentUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            console.log('🔄 URL changed, reinitializing...');
            setTimeout(initializeCapture, 2000);
        }
    });
    
    urlObserver.observe(document, {subtree: true, childList: true});

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeCapture, 2000);
        });
    } else {
        setTimeout(initializeCapture, 1000);
    }

    // Debug information
    setTimeout(() => {
        console.log('🔍 DEBUG INFO:');
        console.log('📍 URL:', window.location.href);
        console.log('📄 Title:', document.title);
        console.log('🔤 Textareas found:', document.querySelectorAll('textarea').length);
        console.log('📝 Contenteditable found:', document.querySelectorAll('[contenteditable="true"]').length);
        console.log('🔘 Buttons found:', document.querySelectorAll('button').length);
        console.log('🎯 Extension status: Capturing =', isCapturing, ', Counter =', promptCounter);
    }, 3000);

})();