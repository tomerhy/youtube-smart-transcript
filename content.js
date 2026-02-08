// YouTube Transcript Extractor - Content Script
// Based on working extension patterns

class YouTubeTranscriptExtractor {
  constructor() {
    this.videoId = null;
    this.transcriptData = [];
    this.rawTranscriptData = [];
    this.potToken = null;
    this.subtitlesList = [];
    this.videoTitle = '';
    this.version = this.getVersion();
    this.init();
  }

  getVersion() {
    try {
      return chrome.runtime.getManifest().version;
    } catch (e) {
      return '1.0.0';
    }
  }

  init() {
    console.log('[YT Transcript] Initializing extension...');
    this.observeURLChanges();
    this.injectUI();
    this.startPanelCheck();
  }

  getVideoId(url) {
    const targetUrl = url || window.location.href;
    if (targetUrl.includes('/shorts/') || targetUrl.includes('/live/')) {
      return targetUrl.substring(targetUrl.lastIndexOf('/') + 1).split('?')[0];
    }
    const urlObj = new URL(targetUrl);
    return urlObj.searchParams.get('v');
  }

  observeURLChanges() {
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('[YT Transcript] URL changed:', lastUrl);
        
        const newVideoId = this.getVideoId(lastUrl);
        if (newVideoId && newVideoId !== this.videoId) {
          this.videoId = newVideoId;
          this.transcriptData = [];
          this.potToken = null;
          this.subtitlesList = [];
          
          // Re-inject UI if it doesn't exist (SPA navigation)
          if (!document.getElementById('yt-transcript-container')) {
            console.log('[YT Transcript] Panel missing after navigation, re-injecting...');
            setTimeout(() => this.injectUI(), 500);
          } else {
            this.updateUI();
          }
        } else if (lastUrl.includes('/watch') && !document.getElementById('yt-transcript-container')) {
          // Navigated to a video page but panel doesn't exist
          console.log('[YT Transcript] On video page but no panel, injecting...');
          setTimeout(() => this.injectUI(), 500);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Get POT token by clicking CC button - exact same approach as working extension
  async getPotToken() {
    if (this.potToken) {
      return this.potToken;
    }

    try {
      // Use exact same selectors as working extension
      const ccButton = document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-right-controls > button.ytp-subtitles-button.ytp-button") ||
                       document.querySelector("#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-right-controls > div.ytp-right-controls-left > button.ytp-subtitles-button.ytp-button");
      
      if (!ccButton) {
        console.log('[YT Transcript] CC button not found');
        return null;
      }

      return new Promise((resolve) => {
        ccButton.addEventListener('click', async () => {
          performance.clearResourceTimings();
          
          let pot = null;
          for (let i = 0; i <= 500; i += 50) {
            await new Promise(r => setTimeout(r, 50));
            
            const entries = performance.getEntriesByType('resource')
              .filter(e => e.name.includes('/api/timedtext?'))
              .pop();
            
            if (entries) {
              pot = new URL(entries.name).searchParams.get('pot');
              if (pot) break;
            }
          }
          
          this.potToken = pot;
          resolve(pot || null);
        }, { once: true });
        
        // Click twice to toggle on and off
        ccButton.click();
        ccButton.click();
      });
    } catch (error) {
      console.error('[YT Transcript] Error getting POT:', error);
      return null;
    }
  }

  // Fetch and parse captions from page HTML - exact same approach as working extension
  async fetchCaptionTracks() {
    try {
      const videoId = this.getVideoId();
      if (!videoId) throw new Error('No video ID found');

      // Fetch the YouTube page HTML
      const response = await fetch('https://www.youtube.com/watch?v=' + videoId);
      const html = await response.text();
      
      // Split on "captions": like the working extension
      const captionsParts = html.split('"captions":');
      
      if (captionsParts.length < 2) {
        throw new Error('No captions found for this video');
      }

      // Parse the JSON - exact same approach
      const rawJson = captionsParts[1].split(',"videoDetails')[0].replace('\n', '');
      const captionsData = JSON.parse(rawJson);
      
      const captionTracks = captionsData.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!captionTracks || captionTracks.length === 0) {
        throw new Error('No caption tracks available');
      }

      // Build subtitles list like the working extension
      const subtitles = [];
      const seen = {};
      
      captionTracks.forEach((track, index, arr) => {
        // Skip duplicate auto-generated versions
        if (index > 0 && arr[index - 1].languageCode === track.languageCode) {
          if (track.kind === 'asr') return;
          if (arr[index - 1].kind === 'asr') subtitles.pop();
        }
        
        seen[track.languageCode] = true;
        subtitles.push({
          languageCode: track.languageCode,
          name: track.name?.simpleText || track.languageCode,
          link: track.baseUrl,
          isAutoGenerated: track.kind === 'asr'
        });
      });

      this.subtitlesList = subtitles;
      return subtitles;
      
    } catch (error) {
      console.error('[YT Transcript] Error fetching captions:', error);
      throw error;
    }
  }

  // Fetch transcript - exact same approach as working extension
  async fetchTranscript(trackUrl) {
    // Get POT token first
    const pot = await this.getPotToken();
    
    // Build URL with POT token and &c=WEB parameter
    let url = trackUrl;
    if (pot) {
      url = trackUrl + '&c=WEB&pot=' + pot;
    }
    
    console.log('[YT Transcript] Fetching:', url);
    
    const response = await fetch(url);
    const text = await response.text();
    
    if (!text || text === '') {
      return 'EMPTY_RESPONSE';
    }
    
    // Parse XML using DOMParser - exact same approach as working extension
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    if (!xmlDoc.firstChild || !xmlDoc.firstChild.childNodes) {
      return 'EMPTY_RESPONSE';
    }
    
    // Extract transcript segments - exact same approach
    const transcript = [];
    const nodes = xmlDoc.firstChild.childNodes;
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType !== 1) continue; // Skip non-element nodes
      
      // Decode HTML entities using textarea trick (same as working extension)
      const textarea = document.createElement('textarea');
      textarea.innerHTML = node.textContent;
      
      transcript.push({
        s: parseFloat(node.getAttribute('start') || '0'),
        t: textarea.value
      });
    }
    
    return transcript;
  }

  formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Group transcript by paragraphs - similar to working extension's gd() function
  groupTranscriptByParagraphs(rawTranscript) {
    if (!rawTranscript || rawTranscript === 'EMPTY_RESPONSE') return [];
    
    const paragraphs = [];
    let charCount = 0;
    let currentParagraph = { start: 0, text: [], startTime: 0 };
    let lastStart = 0;

    rawTranscript.forEach((item, index) => {
      if (item.t === '' || item.t === undefined) return;
      
      // Normalize the item format
      const start = item.s !== undefined ? item.s : item.start;
      const text = item.t !== undefined ? item.t : item.text;
      
      if (currentParagraph.text.length === 0) {
        currentParagraph.start = start;
        currentParagraph.startTime = start;
        lastStart = start;
      }
      
      currentParagraph.text.push(text);
      charCount += text.length;
      
      const timeDiff = start - lastStart;
      
      // Break paragraph if: >300 chars, >60 seconds gap, or last item
      if (charCount > 300 || timeDiff > 60 || index === rawTranscript.length - 1) {
        paragraphs.push({
          start: this.formatTime(currentParagraph.startTime),
          seconds: currentParagraph.startTime,
          text: currentParagraph.text.join(' ').replace(/\n/g, ' ')
        });
        currentParagraph = { start: 0, text: [], startTime: 0 };
        charCount = 0;
      }
      
      lastStart = start;
    });

    return paragraphs;
  }

  seekToTime(seconds) {
    const video = document.querySelector('#movie_player > div.html5-video-container > video');
    if (video) {
      video.currentTime = seconds;
      video.play();
    }
  }

  copyToClipboard(text) {
    // Use the same approach as the working extension
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    this.showNotification('Copied to clipboard!');
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'yt-transcript-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  getVideoTitle() {
    const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') ||
                    document.querySelector('h1.title yt-formatted-string') ||
                    document.querySelector('#title h1 yt-formatted-string');
    return titleEl?.textContent || document.title.replace(' - YouTube', '') || 'transcript';
  }

  sanitizeFilename(name) {
    return name.replace(/[<>:"/\\|?*]/g, '').substring(0, 100);
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showNotification(`Downloaded ${filename}`);
  }

  // Format time for SRT (00:00:00,000)
  formatSRTTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  exportAsTXT() {
    if (this.transcriptData.length === 0) {
      this.showNotification('No transcript to export');
      return;
    }
    const title = this.getVideoTitle();
    const content = `${title}\n${'='.repeat(50)}\n\n` +
      this.transcriptData.map(item => item.text).join('\n\n');
    this.downloadFile(content, `${this.sanitizeFilename(title)}.txt`, 'text/plain');
  }

  exportAsSRT() {
    if (this.rawTranscriptData.length === 0) {
      this.showNotification('No transcript to export');
      return;
    }
    const title = this.getVideoTitle();
    let srtContent = '';
    
    this.rawTranscriptData.forEach((item, index) => {
      const start = item.s !== undefined ? item.s : item.start;
      const text = item.t !== undefined ? item.t : item.text;
      const duration = item.d || 3; // default 3 seconds if no duration
      const endTime = start + duration;
      
      srtContent += `${index + 1}\n`;
      srtContent += `${this.formatSRTTime(start)} --> ${this.formatSRTTime(endTime)}\n`;
      srtContent += `${text}\n\n`;
    });
    
    this.downloadFile(srtContent, `${this.sanitizeFilename(title)}.srt`, 'text/srt');
  }

  exportAsMarkdown() {
    if (this.transcriptData.length === 0) {
      this.showNotification('No transcript to export');
      return;
    }
    const title = this.getVideoTitle();
    const videoUrl = window.location.href;
    
    let mdContent = `# ${title}\n\n`;
    mdContent += `> Video: [${videoUrl}](${videoUrl})\n\n`;
    mdContent += `---\n\n`;
    mdContent += `## Transcript\n\n`;
    
    this.transcriptData.forEach(item => {
      mdContent += `${item.text}\n\n`;
    });
    
    this.downloadFile(mdContent, `${this.sanitizeFilename(title)}.md`, 'text/markdown');
  }

  toggleExportMenu() {
    const menu = document.getElementById('yt-transcript-export-menu');
    if (menu) {
      menu.classList.toggle('show');
    }
  }

  getAvatarUrl() {
    try {
      return chrome.runtime.getURL('icons/avatar.png');
    } catch (e) {
      return '';
    }
  }

  injectUI() {
    // Only inject on video pages
    if (!window.location.pathname.includes('/watch')) {
      console.log('[YT Transcript] Not a video page, skipping UI injection');
      return;
    }
    
    console.log('[YT Transcript] Attempting to inject UI...');
    
    // Prefer #secondary (main sidebar), fallback to #related
    this.waitForElement('#secondary, #secondary-inner, ytd-watch-flexy #secondary, #related').then(container => {
      if (document.getElementById('yt-transcript-container')) {
        console.log('[YT Transcript] Panel already exists');
        return;
      }
      
      // Wait for container to have dimensions
      if (container.offsetWidth === 0) {
        console.log('[YT Transcript] Container has no width, waiting...');
        setTimeout(() => this.injectUI(), 500);
        return;
      }
      
      console.log('[YT Transcript] Found container, injecting panel. Width:', container.offsetWidth);

      const avatarUrl = this.getAvatarUrl();
      const avatarHtml = avatarUrl 
        ? `<img class="yt-transcript-icon" src="${avatarUrl}" alt="" onerror="this.style.display='none'">`
        : '<span class="yt-transcript-icon-fallback">📝</span>';

      const panel = document.createElement('div');
      panel.id = 'yt-transcript-container';
      panel.innerHTML = `
        <div class="yt-transcript-header">
          <div class="yt-transcript-title">
            ${avatarHtml}
            YouTube Transcript
            <span class="yt-transcript-version">v${this.version}</span>
          </div>
          <button class="yt-transcript-toggle">▼</button>
        </div>
        <div class="yt-transcript-body">
          <div class="yt-transcript-controls">
            <select id="yt-transcript-lang">
              <option value="">Loading languages...</option>
            </select>
            <button id="yt-transcript-copy" class="yt-transcript-btn">Copy</button>
            <div class="yt-transcript-export-wrapper">
              <button id="yt-transcript-export-btn" class="yt-transcript-btn yt-transcript-export">Export ▾</button>
              <div id="yt-transcript-export-menu" class="yt-transcript-export-menu">
                <button data-format="txt">📄 Text (.txt)</button>
                <button data-format="srt">🎬 Subtitle (.srt)</button>
                <button data-format="md">📝 Markdown (.md)</button>
              </div>
            </div>
          </div>
          <div id="yt-transcript-content" class="yt-transcript-content">
            <div class="yt-transcript-loading">Click a language to load transcript</div>
          </div>
        </div>
      `;

      container.insertBefore(panel, container.firstChild);
      console.log('[YT Transcript] Panel inserted. Container:', container.id || container.className);
      console.log('[YT Transcript] Panel in DOM:', !!document.getElementById('yt-transcript-container'));
      console.log('[YT Transcript] Panel dimensions (immediate):', panel.offsetWidth, 'x', panel.offsetHeight);
      
      // Check dimensions after a brief delay
      setTimeout(() => {
        const p = document.getElementById('yt-transcript-container');
        if (p) {
          console.log('[YT Transcript] Panel dimensions (after 100ms):', p.offsetWidth, 'x', p.offsetHeight);
          console.log('[YT Transcript] Panel computed style display:', window.getComputedStyle(p).display);
          console.log('[YT Transcript] Panel parent:', p.parentElement?.id || p.parentElement?.className);
          console.log('[YT Transcript] Panel parent dimensions:', p.parentElement?.offsetWidth, 'x', p.parentElement?.offsetHeight);
        }
      }, 100);
      
      // Watch for removal
      this.watchForRemoval(panel);
      
      this.bindEvents(panel);
      this.loadLanguages();
    }).catch(err => {
      console.log('[YT Transcript] Failed to inject UI:', err.message);
    });
  }
  
  watchForRemoval(panel) {
    const observer = new MutationObserver((mutations) => {
      if (!document.body.contains(panel)) {
        console.log('[YT Transcript] Panel was removed from DOM! Re-injecting in 500ms...');
        observer.disconnect();
        setTimeout(() => this.injectUI(), 500);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  bindEvents(panel) {
    const toggle = panel.querySelector('.yt-transcript-toggle');
    const body = panel.querySelector('.yt-transcript-body');
    
    toggle.addEventListener('click', () => {
      body.classList.toggle('collapsed');
      toggle.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
    });

    const langSelect = panel.querySelector('#yt-transcript-lang');
    langSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadTranscript(e.target.value);
      }
    });

    const copyBtn = panel.querySelector('#yt-transcript-copy');
    copyBtn.addEventListener('click', () => {
      if (this.transcriptData.length > 0) {
        const text = this.transcriptData
          .map(item => item.text)
          .join('\n\n');
        this.copyToClipboard(text);
      }
    });

    // Export dropdown
    const exportBtn = panel.querySelector('#yt-transcript-export-btn');
    const exportMenu = panel.querySelector('#yt-transcript-export-menu');
    
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleExportMenu();
    });

    exportMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const format = btn.dataset.format;
        if (format === 'txt') this.exportAsTXT();
        else if (format === 'srt') this.exportAsSRT();
        else if (format === 'md') this.exportAsMarkdown();
        exportMenu.classList.remove('show');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
      exportMenu.classList.remove('show');
    });
  }

  async loadLanguages() {
    const langSelect = document.getElementById('yt-transcript-lang');
    if (!langSelect) return;

    try {
      const tracks = await this.fetchCaptionTracks();
      langSelect.innerHTML = '<option value="">Select language</option>';
      
      tracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.link;
        option.textContent = `${track.name}${track.isAutoGenerated ? ' (auto)' : ''}`;
        langSelect.appendChild(option);
      });

      if (tracks.length > 0) {
        langSelect.value = tracks[0].link;
        this.loadTranscript(tracks[0].link);
      }
    } catch (error) {
      langSelect.innerHTML = '<option value="">No captions available</option>';
      document.getElementById('yt-transcript-content').innerHTML = 
        `<div class="yt-transcript-error">${error.message}</div>`;
    }
  }

  async loadTranscript(trackUrl) {
    const content = document.getElementById('yt-transcript-content');
    if (!content) return;

    content.innerHTML = '<div class="yt-transcript-loading">Loading transcript...</div>';

    try {
      const rawTranscript = await this.fetchTranscript(trackUrl);
      
      if (rawTranscript === 'EMPTY_RESPONSE' || !rawTranscript || rawTranscript.length === 0) {
        throw new Error('Could not fetch transcript. Please try again.');
      }
      
      this.rawTranscriptData = rawTranscript;
      this.transcriptData = this.groupTranscriptByParagraphs(rawTranscript);
      this.videoTitle = this.getVideoTitle();
      this.renderTranscript();
    } catch (error) {
      console.error('[YT Transcript] Load error:', error);
      content.innerHTML = `<div class="yt-transcript-error">${error.message}</div>`;
    }
  }

  renderTranscript() {
    const content = document.getElementById('yt-transcript-content');
    if (!content || this.transcriptData.length === 0) return;

    content.innerHTML = this.transcriptData.map(item => `
      <div class="yt-transcript-item">
        <span class="yt-transcript-time" data-seconds="${item.seconds}">${item.start}</span>
        <span class="yt-transcript-text">${item.text}</span>
      </div>
    `).join('');

    content.querySelectorAll('.yt-transcript-time').forEach(el => {
      el.addEventListener('click', () => {
        this.seekToTime(parseFloat(el.dataset.seconds));
      });
    });
  }

  updateUI() {
    const langSelect = document.getElementById('yt-transcript-lang');
    if (langSelect) {
      this.loadLanguages();
    }
  }

  waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const selectors = selector.split(', ');
      
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return resolve(el);
      }

      const observer = new MutationObserver(() => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            observer.disconnect();
            clearTimeout(timeoutId);
            resolve(el);
            return;
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      
      // Timeout to prevent hanging forever
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        console.log('[YT Transcript] waitForElement timed out for:', selector);
        reject(new Error('Element not found: ' + selector));
      }, timeout);
    });
  }
  
  // Periodic check to ensure panel exists on video pages
  startPanelCheck() {
    // Initial delay to let YouTube fully load
    setTimeout(() => {
      if (window.location.pathname.includes('/watch') && !document.getElementById('yt-transcript-container')) {
        console.log('[YT Transcript] Initial delayed check: Panel missing, injecting...');
        this.injectUI();
      }
    }, 1500);
    
    // Periodic check every 3 seconds
    setInterval(() => {
      if (window.location.pathname.includes('/watch') && 
          !document.getElementById('yt-transcript-container') &&
          (document.querySelector('#secondary') || document.querySelector('#related'))) {
        console.log('[YT Transcript] Periodic check: Panel missing, re-injecting...');
        this.injectUI();
      }
    }, 3000);
  }
}

// Initialize
if (window.location.hostname === 'www.youtube.com') {
  new YouTubeTranscriptExtractor();
}
