# YouTube Smart Transcript

A Chrome Extension that extracts YouTube video transcripts and provides AI-powered features to help users understand videos faster.

## Features

### 📝 Transcript Extraction & Display
- Automatically extract transcripts when a YouTube video is opened
- Display transcript with clickable timestamps
- Click any timestamp to jump to that moment in the video
- Auto-scroll transcript to follow video playback (toggleable)
- Highlight the current segment being spoken
- Support for multiple caption languages

### 🔍 Search Within Transcript
- Real-time search filtering as you type
- Highlight matching text in results
- Mini-timeline showing where matches appear in the video
- Click any result to jump to that timestamp

### 🤖 AI-Powered Q&A
- Ask questions about the video content
- Get answers with relevant timestamp references
- Clickable timestamps in answers to jump to specific parts
- Quick action buttons for common queries:
  - Main Points
  - Summary
  - Tips & Advice
  - Key Takeaways

### 📤 Export Options
- Copy full transcript to clipboard
- Download as .txt file
- Download as .md file (with clickable timestamp links)
- Copy Q&A history

### 🎨 Theming
- Light mode
- Dark mode
- System preference (auto-detect)

## Installation

### From Source (Developer Mode)

1. **Clone or Download** this repository to your local machine

2. **Open Chrome** and navigate to `chrome://extensions/`

3. **Enable Developer Mode** by toggling the switch in the top right corner

4. **Click "Load unpacked"** and select the `extension` folder from this repository

5. **Pin the extension** (optional) by clicking the puzzle piece icon in Chrome's toolbar and pinning "YouTube Smart Transcript"

> **Note about Icons:** The extension includes basic PNG icons. If you want custom icons, open `icons/generate-icons.html` in your browser to generate and download new icons.

### Setting Up the API Key (Required for Q&A)

1. Get your Claude API key from [Anthropic Console](https://console.anthropic.com/)
2. Click the extension icon while on a YouTube page to open the side panel
3. Click the gear icon (⚙️) to open Settings
4. Enter your API key in the "Claude API Key" field
5. Click "Save Settings"

## Usage

1. **Open a YouTube video** - The extension automatically activates on YouTube

2. **Click the extension icon** to open the side panel

3. **View the Transcript** - The transcript tab shows the full video transcript with clickable timestamps

4. **Search** - Use the search bar to find specific content within the transcript

5. **Ask Questions** - Switch to the Q&A tab to ask questions about the video. The AI will answer based on the transcript and provide relevant timestamps.

6. **Export** - Use the Export tab to save the transcript or Q&A history

## File Structure

```
/extension
  /icons
    icon16.png
    icon48.png
    icon128.png
  /src
    /styles
      panel.css         # All styles with dark/light mode support
    /scripts
      background.js     # Service worker for extension lifecycle
      content.js        # YouTube page interaction
      panel.js          # Side panel UI logic
      api.js            # Claude API integration
      transcript.js     # Transcript extraction and utilities
  sidepanel.html        # Side panel HTML structure
  manifest.json         # Chrome Extension manifest (v3)
  README.md             # This file
```

## Technical Details

### Manifest V3
This extension uses Chrome Extension Manifest V3, the latest standard for Chrome extensions.

### Permissions
- `activeTab` - Access the current tab
- `sidePanel` - Use Chrome's side panel API
- `storage` - Store settings and API key
- `scripting` - Inject content scripts

### Transcript Extraction
The extension extracts transcripts using YouTube's timedtext API by:
1. Fetching the video page HTML
2. Parsing `ytInitialPlayerResponse` for caption tracks
3. Fetching caption data in XML format
4. Parsing and formatting the transcript segments

### API Integration
- Uses Claude claude-sonnet-4-20250514 model for Q&A
- API key stored securely in `chrome.storage.sync`
- Handles rate limiting and error states gracefully

## Keyboard Shortcuts

- `Ctrl+F` / `Cmd+F` - Focus search input (when on Transcript tab)
- `Escape` - Clear search or close settings modal

## Troubleshooting

### "No transcript available"
This can happen when:
- The video doesn't have captions enabled
- The video is age-restricted or private
- YouTube's API structure has changed

### Q&A not working
- Check that you've entered a valid Claude API key in Settings
- Ensure you have sufficient API credits
- Check your internet connection

### Extension not loading on YouTube
- Make sure you're on a video page (youtube.com/watch?v=...)
- Try refreshing the page
- Check if the extension is enabled in chrome://extensions

## Privacy

- Your Claude API key is stored locally in Chrome's sync storage
- Transcripts are only sent to Claude when you use the Q&A feature
- No data is collected or sent to any other servers

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this code in your own projects.

---

Made with ❤️ for better YouTube learning
