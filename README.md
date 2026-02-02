# YouTube Smart Transcript

A Chrome Extension that extracts and exports YouTube video transcripts with ease.

## Features

### Transcript Extraction
- Automatically extract transcripts from any YouTube video with captions
- Support for multiple caption languages (manual and auto-generated)
- Smart paragraph grouping for better readability

### Clickable Timestamps
- Click any timestamp to jump to that moment in the video
- Timestamps displayed in readable format (HH:MM:SS)

### Export Options
- **Copy** - Copy full transcript text to clipboard
- **Text (.txt)** - Download as plain text file
- **Subtitle (.srt)** - Download as SRT subtitle file for video players
- **Markdown (.md)** - Download as Markdown with video link

### Clean Interface
- Appears on the right side of YouTube video pages
- Collapsible panel to save space
- Dark mode support (follows YouTube theme)
- Language selector dropdown

## Installation

### From Chrome Web Store
Coming soon!

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top right)
4. Click **Load unpacked** and select the project folder
5. Go to any YouTube video - the transcript panel appears on the right

## Usage

1. **Open a YouTube video** with captions/subtitles available
2. **Find the transcript panel** on the right side of the page
3. **Select language** from the dropdown (if multiple available)
4. **Click timestamps** to jump to specific moments
5. **Export** using Copy or Export dropdown (TXT, SRT, MD)

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Interact with YouTube video pages |
| `storage` | Store user preferences (future use) |
| `host_permissions` | Access YouTube to fetch caption data |

## Privacy

- **No data collection** - All processing happens locally in your browser
- **No tracking** - No analytics or third-party services
- **No server** - Transcripts are never sent anywhere

[View Full Privacy Policy](https://tomerhy.github.io/thy-production-privacy/youtube-smart-transcript/)

## File Structure

```
youtube-smart-transcript/
├── content.js          # Main extension logic
├── styles.css          # UI styles
├── popup.html          # Extension popup
├── popup.js            # Popup logic
├── manifest.json       # Extension manifest
├── icons/              # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   └── avatar.png
└── README.md
```

## Troubleshooting

### "No captions available"
- The video doesn't have captions enabled by the creator
- Try a different video with CC available

### Panel not appearing
- Refresh the page (Cmd+R / F5)
- Make sure you're on a video page (youtube.com/watch?v=...)
- Check if extension is enabled in chrome://extensions

### Export not working
- Load a transcript first before exporting
- Check browser's download permissions

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

MIT License - feel free to use this code in your own projects.

---

Made with care by **THY Production**
