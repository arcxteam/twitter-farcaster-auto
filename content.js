(function() {
  // Inisialisasi variabel di dalam IIFE untuk menghindari konflik global
  let timers = {}; // Objek untuk menyimpan interval dan timeout

  function startAutoScroll(scrollSec, refreshMin) {
    stopAutoScroll(); // reset jika berjalan

    // Scroll function
    timers.scrollInterval = setInterval(() => {
      window.scrollBy(0, 200); // scroll down
    }, scrollSec * 1000);

    // Refresh function
    timers.refreshTimeout = setTimeout(() => {
      location.reload();
    }, refreshMin * 60 * 1000);
  }

  function stopAutoScroll() {
    if (timers.scrollInterval) clearInterval(timers.scrollInterval);
    if (timers.refreshTimeout) clearTimeout(timers.refreshTimeout);
    timers = {}; // Reset semua timer
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
})();
