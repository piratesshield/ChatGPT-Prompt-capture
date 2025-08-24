# ChatGPT Prompt Capture Chrome Extension

This Chrome extension automatically captures and saves your ChatGPT prompts as text files every time you submit a prompt. It does **not** capture AI responses, only your input prompts.

## Features

- ✅ Automatic prompt capture when you send messages to ChatGPT
- ✅ Saves prompts as timestamped text files
- ✅ Works on both chat.openai.com and chatgpt.com
- ✅ Toggle capture on/off via popup
- ✅ Session statistics tracking
- ✅ Only captures user prompts, not AI responses

## Installation

1. Clone or download this extension folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select this extension folder
5. The extension will appear in your toolbar

## How to Use

1. Navigate to ChatGPT (chat.openai.com or chatgpt.com)
2. Type and send prompts normally
3. The extension automatically captures your prompts
4. Files are saved to your Downloads folder in `chatgpt-prompts/`
5. Use the extension popup to toggle capture on/off

## File Format

Each prompt is saved as a separate text file with:
- Timestamp of when the prompt was sent
- The complete prompt text
- Filename format: `chatgpt-prompt-YYYY-MM-DDTHH-MM-SS.txt`

## Permissions

- **activeTab**: To access ChatGPT pages
- **storage**: To save extension settings
- **downloads**: To save prompt files to your computer
- **host_permissions**: To run on ChatGPT domains

## Privacy

This extension:
- ✅ Only runs on ChatGPT websites
- ✅ Only captures text you type (your prompts)
- ✅ Saves files locally on your computer
- ✅ Does not send data to any external servers
- ✅ Does not capture AI responses

## Troubleshooting

If the extension isn't working:
1. Make sure you're on chat.openai.com or chatgpt.com
2. Refresh the ChatGPT page
3. Check that the extension is enabled in the popup
4. Ensure Chrome has permission to download files

## File Structure

```
chatgpt-prompt-capture/
├── manifest.json          # Extension configuration
├── content.js            # Script that runs on ChatGPT pages
├── background.js         # Service worker for file operations
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
└── README.md           # This file
```

## Version History

- **v1.0**: Initial release with automatic prompt capture