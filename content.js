let scrollInterval, refreshTimeout;
let lastScrollHeight = 0;

function startAutoScroll(scrollSec, refreshMin) {
  stopAutoScroll(); // Reset if running

  // Validate parameters
  scrollSec = Math.max(1, parseInt(scrollSec) || 1); // Minimum 1 second
  refreshMin = Math.max(1, parseInt(refreshMin) || 10); // Minimum 1 minute

  // Set up to detect dynamic content loading
  const observer = new MutationObserver(() => {
    if (document.body.scrollHeight > lastScrollHeight) {
      lastScrollHeight = document.body.scrollHeight;
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });

  // Scroll function with dynamic adjustment
  scrollInterval = setInterval(() => {
    window.scrollBy(0, 200);
    if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight) {
      // Stop if no new content is loaded after a short delay
      setTimeout(() => {
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
          clearInterval(scrollInterval); // Stop if still at bottom
        }
      }, 1000); // Delay to allow dynamic loading
    }
  }, scrollSec * 1000);

  // Refresh function
  refreshTimeout = setTimeout(() => {
    stopAutoScroll(); // Clear intervals before refresh
    observer.disconnect(); // Disconnect observer before reload
    location.reload();
  }, refreshMin * 60 * 1000);
}

function stopAutoScroll() {
  if (scrollInterval) clearInterval(scrollInterval);
  if (refreshTimeout) clearTimeout(refreshTimeout);
}

chrome.storage.local.get(["enabled", "scrollTime", "refreshTime"], (data) => {
  if (chrome.runtime.lastError) {
    console.error("Error retrieving storage:", chrome.runtime.lastError);
    return;
  }
  if (data.enabled) {
    startAutoScroll(data.scrollTime || 1, data.refreshTime || 10);
  } else {
    stopAutoScroll();
  }
});

// React to storage changes live
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled || changes.scrollTime || changes.refreshTime) {
    chrome.storage.local.get(["enabled", "scrollTime", "refreshTime"], (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving storage:", chrome.runtime.lastError);
        return;
      }
      if (data.enabled) {
        startAutoScroll(data.scrollTime || 1, data.refreshTime || 10);
      } else {
        stopAutoScroll();
      }
    });
  }
});
