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

  // Function selector DOM & detect of element LinkedIn
  function findLinkedInScrollElement() {
    const linkedinSelectors = [
      'main[role="main"]',
      'div[class*="scaffold-layout__main"]',
      'div[class*="feed"]',
      'div[class*="Feed"]',
      'div[class*="scrollable"]',
      'div[class*="Scrollable"]',
      'div[data-testid*="feed"]',
      'div[aria-label*="feed"]',
      'section[class*="main"]',
      'div[style*="overflow"]'
    ];

    for (const selector of linkedinSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && 
                            element.scrollHeight > element.clientHeight;
        const isLargeEnough = element.clientHeight > 500;
        const isVisible = element.offsetParent !== null;
        
        if (isScrollable && isLargeEnough && isVisible) {
          console.log('LinkedIn scroll element found:', selector, element);
          return element;
        }
      }
    }
    
    console.log('No specific scroll element found for LinkedIn, using window');
    return window;
  }

  // Function selector DOM & detect of element Quora
  function findQuoraScrollElement() {
    const quoraSelectors = [
      'div[class*="content"]',
      'div[class*="Content"]',
      'div[class*="feed"]',
      'div[class*="Feed"]',
      'div[class*="main"]',
      'div[class*="scroll"]',
      'div[class*="Scroll"]',
      'div[data-testid*="content"]',
      'main[role="main"]',
      'div[style*="overflow"]',
      'div[class*="q-box"]' // Quora specific class
    ];

    for (const selector of quoraSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && 
                            element.scrollHeight > element.clientHeight;
        const isLargeEnough = element.clientHeight > 400;
        const isVisible = element.offsetParent !== null;
        
        if (isScrollable && isLargeEnough && isVisible) {
          console.log('Quora scroll element found:', selector, element);
          return element;
        }
      }
    }
    
    console.log('No specific scroll element found for Quora, using window');
    return window;
  }

  // Function selector DOM & detect of element Reddit
  function findRedditScrollElement() {
    const redditSelectors = [
      'div[role="main"]',
      'main[role="main"]',
      'div[class*="scroll"]',
      'div[class*="Scroll"]',
      'div[class*="feed"]',
      'div[class*="Feed"]',
      'div[class*="content"]',
      'div[class*="Content"]',
      'div[data-testid*="content"]',
      'div[class*="listing"]',
      'div[class*="Listing"]',
      'div[style*="overflow"]',
      'shreddit-feed' // Reddit web component
    ];

    for (const selector of redditSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && 
                            element.scrollHeight > element.clientHeight;
        const isLargeEnough = element.clientHeight > 500;
        const isVisible = element.offsetParent !== null;
        
        if (isScrollable && isLargeEnough && isVisible) {
          console.log('Reddit scroll element found:', selector, element);
          return element;
        }
      }
    }
    
    console.log('No specific scroll element found for Reddit, using window');
    return window;
  }

  function startAutoScroll(scrollSec, refreshMin) {
    stopAutoScroll();

    // Detect window platform
    const hostname = window.location.hostname;
    const isFarcaster = hostname.includes('farcaster.xyz');
    const isBluesky = hostname.includes('bsky.app');
    const isLinkedIn = hostname.includes('linkedin.com');
    const isQuora = hostname.includes('quora.com');
    const isReddit = hostname.includes('reddit.com');
    
    if (isFarcaster) {
      scrollElement = findFarcasterScrollElement();
      console.log('Using Farcaster scroll element:', scrollElement);
    } else if (isBluesky) {
      scrollElement = findBlueskyScrollElement();
      console.log('Using Bluesky scroll element:', scrollElement);
    } else if (isLinkedIn) {
      scrollElement = findLinkedInScrollElement();
      console.log('Using LinkedIn scroll element:', scrollElement);
    } else if (isQuora) {
      scrollElement = findQuoraScrollElement();
      console.log('Using Quora scroll element:', scrollElement);
    } else if (isReddit) {
      scrollElement = findRedditScrollElement();
      console.log('Using Reddit scroll element:', scrollElement);
    } else {
      scrollElement = window; // for X.com and others use window
      console.log('Using window scroll for X.com/others');
    }

    // Scroll function
    timers.scrollInterval = setInterval(() => {
      try {
        if (scrollElement === window) {
          window.scrollBy({ top: 200, behavior: 'smooth' });
        } else {
          // For platform-specific scroll elements
          const currentScroll = scrollElement.scrollTop;
          scrollElement.scrollBy({ top: 200, behavior: 'smooth' });
          
          // Fallback: If scroll doesn't change
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
