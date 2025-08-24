# ChatGPT Prompt Capture Chrome Extension

This Chrome extension automatically captures and saves your ChatGPT prompts as text files every time you submit a prompt. It does **not** capture AI responses, only your input prompts.

## 🚀 Features

- ✅ **Automatic prompt capture** when you send messages to ChatGPT
- ✅ **Saves prompts as timestamped text files** in your Downloads folder
- ✅ **Works on both** chat.openai.com and chatgpt.com
- ✅ **Toggle capture on/off** via popup interface
- ✅ **Session statistics** tracking
- ✅ **Privacy-focused**: Only captures user prompts, not AI responses
- ✅ **No external servers**: All data stays on your computer

## 📥 Installation Instructions

### Step 1: Download the Extension
1. Download all the extension files to a folder on your computer
2. Make sure you have these files in the same folder:
   - `manifest.json`
   - `content.js`
   - `background.js`
   - `popup.html`
   - `popup.js`

### Step 2: Install in Chrome
1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** by clicking the toggle in the top-right corner
3. **Click "Load unpacked"** button
4. **Select the folder** containing all the extension files
5. The extension should now appear in your extensions list
6. **Pin the extension** to your toolbar by clicking the puzzle piece icon and pinning "ChatGPT Prompt Capture"

### Step 3: Verify Installation
1. Navigate to [ChatGPT](https://chat.openai.com) or [ChatGPT.com](https://chatgpt.com)
2. Click the extension icon in your toolbar
3. You should see the popup showing "Active" status
4. Type and send a test prompt
5. Check your Downloads folder for the saved file

## 📁 Where to Find Your Captured Prompts

Your captured prompts are automatically saved to:

**Windows**: `C:\Users\[YourUsername]\Downloads\chatgpt-prompts\`

**Mac**: `/Users/[YourUsername]/Downloads/chatgpt-prompts/`

**Linux**: `/home/[YourUsername]/Downloads/chatgpt-prompts/`

### File Format
Each prompt is saved as a separate text file with:
- **Filename format**: `chatgpt-prompt-YYYY-MM-DDTHH-MM-SS-sssZ.txt`
- **Content includes**:
  - Timestamp of when the prompt was sent
  - Your complete prompt text
  - Separator line for easy reading

**Example file content**:
```
Timestamp: 2024-01-15T14:30:25.123Z
Prompt: How do I create a Chrome extension?

==================================================
```

## 🎯 How to Use

1. **Navigate to ChatGPT**: Go to chat.openai.com or chatgpt.com
2. **Check Status**: Click the extension icon to verify it's "Active"
3. **Use ChatGPT Normally**: Type and send prompts as usual
4. **Automatic Capture**: Your prompts are automatically saved
5. **View Files**: Check your Downloads/chatgpt-prompts folder
6. **Toggle if Needed**: Use the popup to enable/disable capturing

## 🔧 Troubleshooting

### Extension Not Capturing Prompts?
1. **Refresh the ChatGPT page** and try again
2. **Check the extension popup** - make sure status shows "Active"
3. **Verify you're on the correct site**: chat.openai.com or chatgpt.com
4. **Check browser console** (F12) for any error messages
5. **Try disabling and re-enabling** the extension in the popup

### Extension Won't Load?
1. **Make sure all files are in the same folder**
2. **Check that Developer Mode is enabled** in chrome://extensions/
3. **Try removing and re-adding** the extension
4. **Check Chrome version** - requires Chrome 88 or newer

### Files Not Saving?
1. **Check Downloads permissions** in Chrome settings
2. **Verify Downloads folder exists** and is writable
3. **Check if Chrome is blocking downloads** from extensions
4. **Try a different prompt** to test

## 🔒 Privacy & Security

This extension is designed with privacy in mind:

- ✅ **Local Storage Only**: All files are saved locally on your computer
- ✅ **No External Servers**: No data is sent to any external servers
- ✅ **No AI Response Capture**: Only captures your input, never AI responses
- ✅ **Minimal Permissions**: Only requests necessary permissions
- ✅ **Open Source**: All code is visible and auditable

## 📋 Permissions Explained

- **activeTab**: To access the current ChatGPT tab
- **storage**: To save extension settings (on/off state)
- **downloads**: To save prompt files to your Downloads folder
- **host_permissions**: To run only on ChatGPT websites

## 📊 Extension Popup Features

The extension popup shows:
- **Status Indicator**: Green (Active) or Red (Inactive)
- **Toggle Button**: Enable/Disable capturing
- **Session Stats**: Number of prompts captured this session
- **Instructions**: Quick usage guide

## 🔄 Version History

- **v1.0**: Initial release with automatic prompt capture
- Enhanced prompt detection for better reliability
- Improved error handling and logging
- Better compatibility with ChatGPT interface updates

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Open Chrome DevTools (F12) and check the console for errors
3. Try refreshing the ChatGPT page
4. Restart Chrome if needed

## 📝 File Structure

```
chatgpt-prompt-capture/
├── manifest.json          # Extension configuration
├── content.js            # Script that runs on ChatGPT pages
├── background.js         # Service worker for file operations
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
└── README.md           # This documentation
```

---

**Note**: This extension only works on ChatGPT websites and requires Chrome browser with Developer Mode enabled for installation.