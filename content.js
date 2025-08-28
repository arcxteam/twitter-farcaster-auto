(function() {
  // Initial variabel of IIFE
  let timers = {};
  let scrollElement = null;

  // Funtion selector DOM & detect of element farcaster.xyz
  function findFarcasterScrollElement() {
    const farcasterSelectors = [
      'div[style*="overflow"]', 
      '.infinite-scroll-component',
      '[data-testid*="scroll"]',
      '[class*="scroll"]',
      '[class*="Scroll"]',
      'main > div',
      'div[class*="container"]',
      'div[class*="Content"]'
    ];

    for (const selector of farcasterSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && 
                            element.scrollHeight > element.clientHeight;
        const isLargeEnough = element.clientHeight > 300; // element
        
        if (isScrollable && isLargeEnough) {
          console.log('Farcaster scroll element found:', selector, element);
          return element;
        }
      }
    }
    
    return window; // fallback ahh
  }

  function startAutoScroll(scrollSec, refreshMin) {
    stopAutoScroll();

    // Detech window Farcaster or X
    const isFarcaster = window.location.hostname.includes('farcaster.xyz');
    
    if (isFarcaster) {
      scrollElement = findFarcasterScrollElement();
      console.log('Using Farcaster scroll element:', scrollElement);
    } else {
      scrollElement = window; // for X.com use window
    }

    // Scroll function
    timers.scrollInterval = setInterval(() => {
      try {
        if (scrollElement === window) {
          window.scrollBy(0, 200);
        } else {
          scrollElement.scrollBy(0, 200);
          if (scrollElement.scrollTop === scrollElement.scrollTop) {
            scrollElement.scrollTop += 200;
          }
        }
      } catch (error) {
        console.error("Scroll error:", error);
        // Fallback ke window scroll
        window.scrollBy(0, 200);
      }
    }, scrollSec * 1000);

    // Refresh function
    timers.refreshTimeout = setTimeout(() => {
      location.reload();
    }, refreshMin * 60 * 1000);
  }

  function stopAutoScroll() {
    if (timers.scrollInterval) clearInterval(timers.scrollInterval);
    if (timers.refreshTimeout) clearTimeout(timers.refreshTimeout);
    timers = {};
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
