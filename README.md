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

Your captured prompts are stored in the extension's local storage and can be downloaded using the built-in download buttons:

### 📥 **Download Options:**

1. **Individual Downloads**: Click the download button (↓) next to each prompt in the "View List"
2. **Download All**: Use the "Download All" button to get all prompts in a single file
3. **File Location**: Downloaded files will be saved to your browser's default download location

### 💾 **Storage Information:**
- **Location**: Extension Local Storage (built into Chrome)
- **Access**: Use the extension popup to view and download your prompts
- **Backup**: Download your prompts regularly to keep local copies

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
5. **Download Prompts**: Use the download buttons in the extension popup
6. **Toggle if Needed**: Use the popup to enable/disable capturing

## 📥 **New Download Features**

The extension popup now includes:
- **Download All Button**: Get all your prompts in one file
- **View List Button**: See your recent prompts with individual download options
- **Clear All Button**: Remove all stored prompts (with confirmation)
- **Storage Info**: See how many prompts are stored and storage usage

## 🔧 Troubleshooting

### Extension Not Capturing Prompts?
1. **Refresh the ChatGPT page** and try again
2. **Check the extension popup** - make sure status shows "Active"
3. **Open browser console** (Press F12, go to Console tab) and look for messages with emojis like "🎯 CAPTURING PROMPT"
4. **Verify you're on the correct site**: chat.openai.com or chatgpt.com
5. **Try typing a test prompt and pressing Enter** - check console for capture messages
6. **Try disabling and re-enabling** the extension in the popup
7. **Reload the extension**: Go to chrome://extensions/, find the extension, and click the reload button
8. **Wait 5-10 seconds** after loading ChatGPT before trying to send prompts
9. **Check if you see initialization messages** in console like "🚀 Setting up ChatGPT prompt monitoring"
10. **Use the download buttons** in the extension popup to access your captured prompts

### Extension Won't Load?
1. **Make sure all files are in the same folder**
2. **Check that Developer Mode is enabled** in chrome://extensions/
3. **Try removing and re-adding** the extension
4. **Check Chrome version** - requires Chrome 88 or newer

### Popup Shows "Loading..." or Connection Errors?
1. **Refresh the ChatGPT page** - the content script needs to load
2. **Wait 5-10 seconds** after opening ChatGPT before checking the popup
3. **Make sure you're on the main ChatGPT chat page**, not just the homepage
4. **Try opening a new chat** if you're on an existing conversation

### Can't Find Downloaded Files?
1. **Check your browser's default download location** (usually Downloads folder)
2. **Use the extension popup** to download prompts directly
3. **Check Chrome's download history** (Ctrl+J or Cmd+J)
4. **Try the "Download All" button** for a single file with all prompts

## 🔒 Privacy & Security

This extension is designed with privacy in mind:

- ✅ **Local Storage Only**: All data is stored locally in your browser
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
- **Download Buttons**: Access your captured prompts
- **Storage Information**: See how many prompts are stored
- **Prompts List**: View and download individual prompts

## 🔄 Version History

- **v4.0**: Added download buttons, local storage, and improved UI
- **v1.0**: Initial release with automatic prompt capture
- Enhanced prompt detection for better reliability
- Improved error handling and logging
- Better compatibility with ChatGPT interface updates

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Open Chrome DevTools (F12) and check the console for errors
3. Use the download buttons in the extension popup to access your prompts
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
├── README.md           # This documentation
└── README.md           # This documentation
```

## 🎮 **Keyboard Shortcuts**

- **Ctrl+T** (or Cmd+T): Toggle capture on/off
- **Ctrl+D** (or Cmd+D): Download all prompts
- **Ctrl+R** (or Cmd+R): Refresh extension status

---

**Note**: This extension only works on ChatGPT websites and requires Chrome browser with Developer Mode enabled for installation. Your prompts are stored locally and can be downloaded using the built-in download buttons.