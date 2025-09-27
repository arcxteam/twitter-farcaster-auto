(function() {
  // ===== ENHANCED SAFETY CHECK =====
  const unsafeProtocols = ['chrome-extension:', 'about:', 'edge:', 'opera:', 'brave:', 'firefox:', 'vivaldi:'];
  const unsafeKeywords = [
    'metamask', 'okx-wallet', 'extension', 'phantom', 'trust-wallet', 'coinbase-wallet-extension',
    'rabby-wallet', 'keplr', 'talisman-wallet', 'backpack', 'unisat-wallet', 'leap-wallet', 'suiet-sui-wallet',
    'martian-aptos-sui-wallet', 'petra-aptos-wallet', 'slush-—-a-sui-wallet'
  ];

  const currentUrl = window.location.href;
  const currentProtocol = window.location.protocol;
  
  if (unsafeProtocols.includes(currentProtocol) ||
      unsafeKeywords.some(keyword => currentUrl.toLowerCase().includes(keyword))) {
    console.log('AutoScroll: Skipping execution on protected page');
    return;
  }

  // Initial variabel of IIFE
  let timers = {};
  let scrollElement = null;
  let reloadCount = 0;

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
      'div[class*="q-box"]'
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
      'shreddit-feed'
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

  // ✅ FIXED: Improved scroll end detection with better threshold
  function hasReachedScrollEnd() {
    try {
      if (scrollElement === window) {
        // More accurate calculation for window scrolling
        const scrollPosition = window.scrollY + window.innerHeight;
        const totalHeight = document.documentElement.scrollHeight;
        return scrollPosition >= totalHeight - 200;
      } else {
        const scrollPosition = scrollElement.scrollTop + scrollElement.clientHeight;
        return scrollPosition >= scrollElement.scrollHeight - 200;
      }
    } catch (error) {
      console.log('AutoScroll: Scroll end check error', error);
      return false;
    }
  }

  function startAutoScroll(scrollSec, refreshMin, autoReload) {
    stopAutoScroll();
    reloadCount = 0; // Reset counter

    // EXISTING PLATFORM DETECTION CODE REMAINS UNCHANGED
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
      scrollElement = window;
      console.log('Using window scroll for X.com/others');
    }

    // ✅ FIXED: Scroll function with improved auto reload logic
    timers.scrollInterval = setInterval(() => {
      try {
        if (autoReload && hasReachedScrollEnd()) {
          reloadCount++;
          console.log('AutoScroll: End of content detected, count:', reloadCount);
          
          // ✅ FIX: Only reload after 3 consecutive detections to avoid false positives
          if (reloadCount >= 3) {
            console.log('AutoScroll: Content ended, auto reloading...');
            setTimeout(() => {
              location.reload();
            }, 1000); // 1s
            return;
          }
        } else {
          // Reset counter if not at end
          reloadCount = 0;
        }

        // Normal scrolling
        if (scrollElement === window) {
          window.scrollBy({ top: 200, behavior: 'smooth' });
        } else {
          const currentScroll = scrollElement.scrollTop;
          scrollElement.scrollBy({ top: 200, behavior: 'smooth' });
          
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

    // ✅ FIXED: Only set refresh timeout if auto reload is disabled
    if (!autoReload) {
      timers.refreshTimeout = setTimeout(() => {
        console.log('AutoScroll: Time-based reload');
        location.reload();
      }, refreshMin * 60 * 1000);
    }
  }

  function stopAutoScroll() {
    if (timers.scrollInterval) clearInterval(timers.scrollInterval);
    if (timers.refreshTimeout) clearTimeout(timers.refreshTimeout);
    timers = {};
    reloadCount = 0;
  }

  // Storage handler to include autoReload
  try {
    chrome.storage.local.get(["enabled", "scrollTime", "refreshTime", "autoReload"], (data) => {
      if (chrome.runtime.lastError) {
        console.log('AutoScroll: Storage access error', chrome.runtime.lastError);
        return;
      }
      if (data.enabled) {
        startAutoScroll(data.scrollTime || 1, data.refreshTime || 10, data.autoReload || false);
      } else {
        stopAutoScroll();
      }
    });

    // Storage change listener to include autoReload
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.enabled || changes.scrollTime || changes.refreshTime || changes.autoReload) {
        chrome.storage.local.get(["enabled", "scrollTime", "refreshTime", "autoReload"], (data) => {
          if (data.enabled) {
            startAutoScroll(data.scrollTime || 1, data.refreshTime || 10, data.autoReload || false);
          } else {
            stopAutoScroll();
          }
        });
      }
    });
  } catch (error) {
    console.log('AutoScroll: Runtime initialization error', error);
  }
})();
