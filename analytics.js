// Google Analytics 4 - Measurement Protocol
// For YouTube Smart Transcript Extension

class Analytics {
  constructor() {
    this.GA_MEASUREMENT_ID = 'G-3YZCSZNC5T';
    this.GA_API_SECRET = '-YquPL5zR0S_0Csvm2OJJw';
    this.clientId = this.getOrCreateClientId();
    this.sessionId = this.generateSessionId();
  }

  getOrCreateClientId() {
    let clientId = localStorage.getItem('yt_transcript_client_id');
    if (!clientId) {
      clientId = this.generateUUID();
      localStorage.setItem('yt_transcript_client_id', clientId);
    }
    return clientId;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  generateSessionId() {
    return Date.now().toString();
  }

  async sendEvent(eventName, params = {}) {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.GA_MEASUREMENT_ID}&api_secret=${this.GA_API_SECRET}`;
    
    const payload = {
      client_id: this.clientId,
      events: [{
        name: eventName,
        params: {
          session_id: this.sessionId,
          engagement_time_msec: 100,
          ...params
        }
      }]
    };

    try {
      console.log('[YT Transcript Analytics] Sending event:', eventName, params);
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      console.log('[YT Transcript Analytics] Event sent, status:', response.status);
    } catch (error) {
      console.error('[YT Transcript Analytics] Failed to send event:', error);
    }
  }

  // Track extension load/page view
  trackExtensionLoad() {
    this.sendEvent('extension_load', {
      page_location: window.location.href,
      page_title: document.title
    });
  }

  // Track transcript load
  trackTranscriptLoad(videoId, language, success) {
    this.sendEvent('transcript_load', {
      video_id: videoId,
      language: language,
      success: success ? 'true' : 'false'
    });
  }

  // Track copy action
  trackCopy(videoId) {
    this.sendEvent('copy_transcript', {
      video_id: videoId
    });
  }

  // Track export action
  trackExport(videoId, format) {
    this.sendEvent('export_transcript', {
      video_id: videoId,
      format: format
    });
  }

  // Track language change
  trackLanguageChange(videoId, language) {
    this.sendEvent('language_change', {
      video_id: videoId,
      language: language
    });
  }

  // Track timestamp click
  trackTimestampClick(videoId, timestamp) {
    this.sendEvent('timestamp_click', {
      video_id: videoId,
      timestamp: timestamp
    });
  }

  // Track panel toggle
  trackPanelToggle(collapsed) {
    this.sendEvent('panel_toggle', {
      collapsed: collapsed ? 'true' : 'false'
    });
  }

  // Track errors
  trackError(errorType, errorMessage) {
    this.sendEvent('extension_error', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100)
    });
  }
}

// Global analytics instance
window.ytTranscriptAnalytics = new Analytics();
