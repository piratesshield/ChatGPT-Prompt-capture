// Enhanced ChatGPT Prompt Capture Content Script v2.1
(function() {
    'use strict';
    
    let isCapturing = true;
    let promptCounter = 0;
    let lastCapturedPrompt = '';
    let lastCaptureTime = 0;
    let observer = null;
    let formObserver = null;
    let lastInputValue = '';
    let inputMonitorInterval = null;
    
    console.log('🚀 ChatGPT Prompt Capture Extension v2.1 loaded');

    // Updated selectors for current ChatGPT interface (Aug 2025)
    const TEXTAREA_SELECTORS = [
        'textarea[data-testid="textbox"]',
        'div[contenteditable="true"][role="textbox"]',
        'textarea[placeholder*="Message ChatGPT"]',
        'textarea[placeholder*="Send a message"]',
        'textarea[placeholder*="Message"]',
        'div[contenteditable="true"][data-slate-editor="true"]',
        'main textarea',
        'form textarea',
        'textarea[data-id="root"]',
        'div[contenteditable="true"][data-testid="textbox"]',
        'div[contenteditable="true"]',
        '#prompt-textarea'
    ];

    const SEND_BUTTON_SELECTORS = [
        'button[data-testid="send-button"]',
        'button[aria-label*="Send message"]',
        'button[aria-label*="Send"]',
        'form button[type="submit"]',
        'button:has(svg[data-testid="send-button"])',
        'main form button',
        '[data-testid="fruitjuice-send-button"]',
        'button[data-testid="fruitjuice-send-button"]',
        'button svg[data-testid="send-button"]',
        'button:has(svg)',
        'form button'
    ];

    // Get current timestamp for filename
    function getTimestamp() {
        const now = new Date();
        return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    }

    // Enhanced text extraction with better support for contenteditable
    function extractText(element) {
        if (!element) return '';
        
        if (element.tagName === 'TEXTAREA') {
            return element.value || '';
        }
        
        if (element.contentEditable === 'true') {
            // For contenteditable divs, get plain text and handle Slate.js
            let text = element.textContent || element.innerText || '';
            
            // Remove any Slate.js artifacts or zero-width characters
            text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
            text = text.replace(/\n+/g, '\n').trim();
            
            return text;
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
        
        // Prevent duplicate captures (within 3 seconds)
        if (cleanPrompt === lastCapturedPrompt && (now - lastCaptureTime) < 3000) {
            console.log('⚠️ Duplicate prompt detected, skipping');
            return;
        }

        // Skip very short prompts that might be false positives
        if (cleanPrompt.length < 3) {
            console.log('⚠️ Prompt too short, skipping');
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

    // Enhanced input element finder with better visibility detection
    function findInputElement() {
        for (const selector of TEXTAREA_SELECTORS) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    const rect = element.getBoundingClientRect();
                    const style = window.getComputedStyle(element);
                    
                    const isVisible = rect.width > 50 && rect.height > 20 && 
                        rect.top >= 0 && rect.left >= 0 &&
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0';
                    
                    // Additional check for ChatGPT-specific visibility
                    const isInViewport = rect.bottom > 0 && rect.right > 0 && 
                        rect.top < window.innerHeight && rect.left < window.innerWidth;
                    
                    if (isVisible && isInViewport) {
                        console.log(`✅ Found input element: ${selector}`);
                        return element;
                    }
                }
            } catch (error) {
                console.log(`⚠️ Error with selector ${selector}:`, error);
            }
        }
        console.log('❌ No input element found');
        return null;
    }

    // Enhanced send button finder
    function findSendButtons() {
        const buttons = [];
        for (const selector of SEND_BUTTON_SELECTORS) {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(button => {
                    const rect = button.getBoundingClientRect();
                    const style = window.getComputedStyle(button);
                    
                    const isVisible = rect.width > 10 && rect.height > 10 && 
                        rect.top >= 0 && rect.left >= 0 &&
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0';
                    
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

    // Wait for elements to be ready
    function waitForElements() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 60; // 30 seconds
            
            const checkInterval = setInterval(() => {
                attempts++;
                const input = findInputElement();
                const sendButtons = findSendButtons().length > 0;
                
                if (input && sendButtons) {
                    console.log('✅ Required elements found');
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    console.log('⚠️ Timeout waiting for elements, proceeding anyway');
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 500);
        });
    }

    // Setup input monitoring with enhanced event handling
    function setupInputMonitoring(inputElement) {
        if (!inputElement) return false;

        console.log('🔧 Setting up enhanced input monitoring...');

        // Monitor Enter key with better handling
        inputElement.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                console.log('⌨️ Enter key detected');
                const text = extractText(inputElement);
                if (text && text.trim() && text.trim().length > 2) {
                    console.log('📤 Capturing prompt from Enter key');
                    setTimeout(() => savePrompt(text), 200);
                }
            }
        }, true);

        // Monitor input changes for value tracking
        const handleInput = () => {
            const text = extractText(inputElement);
            lastInputValue = text || '';
            
            if (text && text.length > 20) {
                console.log(`📝 Input detected: "${text.substring(0, 50)}..."`);
            }
        };

        inputElement.addEventListener('input', handleInput);
        inputElement.addEventListener('keyup', handleInput);
        inputElement.addEventListener('paste', () => setTimeout(handleInput, 100));

        return true;
    }

    // Enhanced button monitoring
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
                        if (text && text.trim() && text.trim().length > 2) {
                            console.log('📤 Capturing prompt from button click');
                            setTimeout(() => savePrompt(text), 200);
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

    // Setup form submission monitoring
    function setupFormMonitoring() {
        const forms = document.querySelectorAll('form');
        let setupCount = 0;
        
        forms.forEach(form => {
            if (!form.hasAttribute('data-form-listener')) {
                form.setAttribute('data-form-listener', 'true');
                
                form.addEventListener('submit', function(event) {
                    console.log('🔄 Form submitted');
                    const inputElement = findInputElement();
                    if (inputElement) {
                        const text = extractText(inputElement);
                        if (text && text.trim() && text.trim().length > 2) {
                            console.log('📤 Capturing prompt from form submission');
                            setTimeout(() => savePrompt(text), 200);
                        }
                    }
                }, true);
                
                setupCount++;
            }
        });
        
        console.log(`📋 Setup form monitoring on ${setupCount} forms`);
        return setupCount > 0;
    }

    // Monitor input value changes for clearing detection
    function startInputValueMonitoring() {
        if (inputMonitorInterval) {
            clearInterval(inputMonitorInterval);
        }
        
        inputMonitorInterval = setInterval(() => {
            const inputElement = findInputElement();
            if (inputElement) {
                const currentText = extractText(inputElement);
                
                // If text was cleared suddenly and was substantial, it might have been submitted
                if (lastInputValue.length > 10 && currentText === '') {
                    console.log('📤 Detected input clearing - possible submission');
                    setTimeout(() => savePrompt(lastInputValue), 100);
                }
                
                lastInputValue = currentText || '';
            }
        }, 1000);
    }

    // Comprehensive debug function
    function debugCurrentState() {
        console.log('🔍 COMPREHENSIVE DEBUG INFO:');
        console.log('📍 URL:', window.location.href);
        console.log('📄 Title:', document.title);
        console.log('🎯 Extension status: Capturing =', isCapturing, ', Counter =', promptCounter);
        
        // Test all selectors
        console.log('🔤 Testing textarea selectors:');
        TEXTAREA_SELECTORS.forEach((selector, index) => {
            try {
                const elements = document.querySelectorAll(selector);
                console.log(`  ${index}: "${selector}" → ${elements.length} elements`);
                
                elements.forEach((el, elIndex) => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    const isVisible = rect.width > 0 && rect.height > 0 && 
                        style.display !== 'none' && style.visibility !== 'hidden';
                    console.log(`    Element ${elIndex}: visible=${isVisible}, size=${rect.width}x${rect.height}`);
                    if (isVisible && el.tagName === 'TEXTAREA') {
                        console.log(`    Textarea value: "${(el.value || '').substring(0, 50)}"`);
                    }
                    if (isVisible && el.contentEditable === 'true') {
                        console.log(`    ContentEditable text: "${(el.textContent || '').substring(0, 50)}"`);
                    }
                });
            } catch (error) {
                console.log(`    Error with selector: ${error.message}`);
            }
        });
        
        console.log('🔘 Testing button selectors:');
        SEND_BUTTON_SELECTORS.forEach((selector, index) => {
            try {
                const elements = document.querySelectorAll(selector);
                console.log(`  ${index}: "${selector}" → ${elements.length} elements`);
            } catch (error) {
                console.log(`    Error with selector: ${error.message}`);
            }
        });
        
        // Test current detection
        const currentInput = findInputElement();
        console.log('🎯 Current input element:', currentInput);
        if (currentInput) {
            console.log('📝 Current input text:', extractText(currentInput));
        }
        
        const currentButtons = findSendButtons();
        console.log('🎯 Current send buttons:', currentButtons.length);
    }

    // Main initialization function
    async function initializeCapture() {
        console.log('🎬 Initializing ChatGPT prompt capture...');
        
        // Check if we're on the right page
        const isValidPage = window.location.hostname.includes('openai.com') || 
                           window.location.hostname.includes('chatgpt.com');
        
        if (!isValidPage) {
            console.log('❌ Not on a valid ChatGPT page');
            return;
        }

        console.log('✅ On valid ChatGPT page:', window.location.href);

        // Wait for elements to be ready
        const elementsReady = await waitForElements();
        
        if (!elementsReady) {
            console.log('⚠️ Elements not fully ready, but proceeding...');
        }

        // Find and setup input monitoring
        const inputElement = findInputElement();
        const inputSetup = setupInputMonitoring(inputElement);
        
        // Setup button monitoring
        const buttonSetup = setupButtonMonitoring();
        
        // Setup form monitoring
        const formSetup = setupFormMonitoring();
        
        // Start input value monitoring
        startInputValueMonitoring();
        
        if (inputSetup || buttonSetup || formSetup) {
            console.log('✅ Prompt capture initialized successfully!');
            console.log(`📊 Setup summary: Input=${inputSetup}, Buttons=${buttonSetup}, Forms=${formSetup}`);
            
            // Setup mutation observer to handle dynamic content
            if (observer) observer.disconnect();
            
            observer = new MutationObserver((mutations) => {
                let shouldReinitialize = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Check if new buttons or inputs were added
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const hasNewButtons = SEND_BUTTON_SELECTORS.some(selector => {
                                    try {
                                        return (node.matches && node.matches(selector)) || 
                                               (node.querySelector && node.querySelector(selector));
                                    } catch (e) { return false; }
                                });
                                const hasNewInputs = TEXTAREA_SELECTORS.some(selector => {
                                    try {
                                        return (node.matches && node.matches(selector)) || 
                                               (node.querySelector && node.querySelector(selector));
                                    } catch (e) { return false; }
                                });
                                
                                if (hasNewButtons || hasNewInputs) {
                                    shouldReinitialize = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldReinitialize) {
                    console.log('🔄 DOM changed, reinitializing...');
                    setTimeout(() => {
                        setupButtonMonitoring();
                        setupFormMonitoring();
                        
                        const newInput = findInputElement();
                        if (newInput) {
                            setupInputMonitoring(newInput);
                        }
                    }, 1000);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
        } else {
            console.log('❌ Failed to initialize, retrying in 5 seconds...');
            setTimeout(initializeCapture, 5000);
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
                    currentUrl: window.location.href,
                    lastInputValue: lastInputValue.substring(0, 50) + (lastInputValue.length > 50 ? '...' : '')
                };
                console.log('📊 Sending status:', status);
                sendResponse(status);
            } else if (request.action === 'toggleCapture') {
                isCapturing = request.enabled;
                console.log(`🔄 Capture ${isCapturing ? 'ENABLED' : 'DISABLED'}`);
                sendResponse({success: true, isCapturing: isCapturing});
            } else if (request.action === 'debugInfo') {
                debugCurrentState();
                sendResponse({success: true});
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
            setTimeout(initializeCapture, 3000);
        }
    });
    
    urlObserver.observe(document, {subtree: true, childList: true});

    // Cleanup function
    window.addEventListener('beforeunload', () => {
        if (observer) observer.disconnect();
        if (urlObserver) urlObserver.disconnect();
        if (inputMonitorInterval) clearInterval(inputMonitorInterval);
    });

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeCapture, 3000);
        });
    } else {
        setTimeout(initializeCapture, 2000);
    }

    // Debug information after initialization
    setTimeout(debugCurrentState, 8000);

})();
