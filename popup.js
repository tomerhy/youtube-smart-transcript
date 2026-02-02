// Popup script - checks if we're on YouTube

document.addEventListener('DOMContentLoaded', () => {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const url = currentTab?.url || '';
    
    if (url.includes('youtube.com/watch') || url.includes('youtube.com/shorts')) {
      statusDot.classList.remove('inactive');
      statusText.textContent = 'Active on this video';
    } else if (url.includes('youtube.com')) {
      statusDot.classList.add('inactive');
      statusText.textContent = 'Open a video to get transcripts';
    } else {
      statusDot.classList.add('inactive');
      statusText.textContent = 'Go to YouTube to use this extension';
    }
  });
});
