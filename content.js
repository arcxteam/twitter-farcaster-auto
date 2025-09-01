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
        const isLargeEnough = element.clientHeight > 300;
        
        if (isScrollable && isLargeEnough) {
          console.log('Farcaster scroll element found:', selector, element);
          return element;
        }
      }
    }
    
    return window;
  }

  // Funtion selector DOM & detect of element bsky.app
  function findBlueskyScrollElement() {
    const blueskySelectors = [
      'main[role="main"]',
      'div[data-testid*="scroll"]',
      'div[class*="scroll"]',
      'div[class*="Scroll"]',
      'div[class*="feed"]',
      'div[class*="Feed"]',
      'div[class*="content"]',
      'div[class*="Content"]',
      'div[class*="timeline"]',
      'div[class*="stream"]',
      '[aria-label*="Timeline"]',
      'section > div',
      'div[style*="overflow"]'
    ];

    for (const selector of blueskySelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && 
                            element.scrollHeight > element.clientHeight;
        const isLargeEnough = element.clientHeight > 400;
        const isVisible = element.offsetParent !== null;
        
        if (isScrollable && isLargeEnough && isVisible) {
          console.log('Bluesky scroll element found:', selector, element);
          return element;
        }
      }
    }
    
    console.log('No specific scroll element found for Bluesky, using window');
    return window;
  }

  function startAutoScroll(scrollSec, refreshMin) {
    stopAutoScroll();

    // Detect window platform
    const isFarcaster = window.location.hostname.includes('farcaster.xyz');
    const isBluesky = window.location.hostname.includes('bsky.app');
    
    if (isFarcaster) {
      scrollElement = findFarcasterScrollElement();
      console.log('Using Farcaster scroll element:', scrollElement);
    } else if (isBluesky) {
      scrollElement = findBlueskyScrollElement();
      console.log('Using Bluesky scroll element:', scrollElement);
    } else {
      scrollElement = window; // for X.com use window
      console.log('Using window scroll for X.com');
    }

    // Scroll function
    timers.scrollInterval = setInterval(() => {
      try {
        if (scrollElement === window) {
          window.scrollBy({ top: 200, behavior: 'smooth' });
        } else {
          // Farcaster & Bluesky
          const currentScroll = scrollElement.scrollTop;
          scrollElement.scrollBy({ top: 200, behavior: 'smooth' });
          
          // Fallback
          setTimeout(() => {
            if (scrollElement.scrollTop === currentScroll) {
              scrollElement.scrollTop += 200;
              console.log('Using alternative scroll method');
            }
          }, 100);
        }
      } catch (error) {
        console.error("Scroll error:", error);
        window.scrollBy({ top: 200, behavior: 'smooth' });
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
