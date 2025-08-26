let scrollInterval, refreshTimeout;

function startAutoScroll(scrollSec, refreshMin) {
  stopAutoScroll(); // reset if running

  // Scroll function
  scrollInterval = setInterval(() => {
    window.scrollBy(0, 200); // scroll down
  }, scrollSec * 1000);

  // Refresh function
  refreshTimeout = setTimeout(() => {
    location.reload();
  }, refreshMin * 60 * 1000);
}

function stopAutoScroll() {
  if (scrollInterval) clearInterval(scrollInterval);
  if (refreshTimeout) clearTimeout(refreshTimeout);
}

chrome.storage.local.get(["enabled", "scrollTime", "refreshTime"], (data) => {
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
      if (data.enabled) {
        startAutoScroll(data.scrollTime || 1, data.refreshTime || 10);
      } else {
        stopAutoScroll();
      }
    });
  }
});
