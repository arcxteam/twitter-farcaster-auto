(function() {
  // ===== DEDUPLICATION GUARD =====
  // Prevents double execution when injected by both content_scripts (manifest)
  // and chrome.scripting.executeScript (background.js fallback)
  if (window.__autoScrollActive) {
    console.log('AutoScroll: Already running, skipping duplicate injection');
    return;
  }
  window.__autoScrollActive = true;

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
    window.__autoScrollActive = false;
    return;
  }

  // ===== STATE VARIABLES =====
  let timers = {};
  let scrollElement = null;
  let platformType = 'feed'; // 'feed' | 'video-scroll' | 'instagram-reels'

  // Stale-scroll detection for auto-reload
  let lastScrollPosition = null;
  let lastScrollHeight = null;
  let scrollStaleCount = 0;
  const STALE_LIMIT = 5;

  // Instagram Reels state
  let reelsVideoIndex = 0;
  let lastReelsUrl = '';

  // Retry state for SPA element discovery
  let elementRetryTimer = null;

  // ===== GENERIC SCROLL ELEMENT FINDER =====
  function findScrollableElement(selectors, minHeight, platformName) {
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                            element.scrollHeight > element.clientHeight;
        const isLargeEnough = element.clientHeight > minHeight;
        const isVisible = element.offsetParent !== null;

        if (isScrollable && isLargeEnough && isVisible) {
          console.log(`AutoScroll: ${platformName} scroll element found:`, selector, element);
          return element;
        }
      }
    }
    console.log(`AutoScroll: No specific scroll element found for ${platformName}, using window`);
    return window;
  }

  // ===== PLATFORM-SPECIFIC SCROLL ELEMENT FINDERS =====

  function findFarcasterScrollElement() {
    const selectors = [
      'div[style*="overflow"]',
      '.infinite-scroll-component',
      '[data-testid*="scroll"]',
      '[class*="scroll"]',
      '[class*="Scroll"]',
      'main > div',
      'div[class*="container"]',
      'div[class*="Content"]'
    ];
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                            element.scrollHeight > element.clientHeight;
        const isLargeEnough = element.clientHeight > 300;
        if (isScrollable && isLargeEnough) {
          console.log('AutoScroll: Farcaster scroll element found:', selector, element);
          return element;
        }
      }
    }
    return window;
  }

  function findBlueskyScrollElement() {
    return findScrollableElement([
      'main[role="main"]',
      'div[data-testid*="scroll"]',
      'div[class*="scroll"]', 'div[class*="Scroll"]',
      'div[class*="feed"]', 'div[class*="Feed"]',
      'div[class*="content"]', 'div[class*="Content"]',
      'div[class*="timeline"]', 'div[class*="stream"]',
      '[aria-label*="Timeline"]',
      'section > div',
      'div[style*="overflow"]'
    ], 400, 'Bluesky');
  }

  function findLinkedInScrollElement() {
    return findScrollableElement([
      'main[role="main"]',
      'div[class*="scaffold-layout__main"]',
      'div[class*="feed"]', 'div[class*="Feed"]',
      'div[class*="scrollable"]', 'div[class*="Scrollable"]',
      'div[data-testid*="feed"]', 'div[aria-label*="feed"]',
      'section[class*="main"]',
      'div[style*="overflow"]'
    ], 500, 'LinkedIn');
  }

  function findQuoraScrollElement() {
    return findScrollableElement([
      'div[class*="content"]', 'div[class*="Content"]',
      'div[class*="feed"]', 'div[class*="Feed"]',
      'div[class*="main"]',
      'div[class*="scroll"]', 'div[class*="Scroll"]',
      'div[data-testid*="content"]',
      'main[role="main"]',
      'div[style*="overflow"]',
      'div[class*="q-box"]'
    ], 400, 'Quora');
  }

  function findRedditScrollElement() {
    return findScrollableElement([
      'div[role="main"]', 'main[role="main"]',
      'div[class*="scroll"]', 'div[class*="Scroll"]',
      'div[class*="feed"]', 'div[class*="Feed"]',
      'div[class*="content"]', 'div[class*="Content"]',
      'div[data-testid*="content"]',
      'div[class*="listing"]', 'div[class*="Listing"]',
      'div[style*="overflow"]',
      'shreddit-feed'
    ], 500, 'Reddit');
  }

  // ===== TIKTOK SCROLL ELEMENT FINDER =====
  function findTikTokScrollElement() {
    const selectors = [
      '[class*="DivVideoFeedV2"]',
      '[class*="DivContentContainer"]',
      '[class*="DivMainContainer"]',
      '[class*="tiktok-feed"]',
      '[data-e2e="recommend-list-item-container"]',
      '[class*="video-feed"]', '[class*="VideoFeed"]',
      'div[id="app"] > div',
      'main',
      'div[class*="browse-mode"]',
      'div[class*="swiper"]', 'div[class*="Swiper"]',
      'div[style*="overflow"]'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const hasScrollSnap = style.scrollSnapType && style.scrollSnapType !== 'none';
        const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                            element.scrollHeight > element.clientHeight;
        const isLargeEnough = element.clientHeight > 300;

        if ((isScrollable || hasScrollSnap) && isLargeEnough) {
          console.log('AutoScroll: TikTok scroll element found:', selector, element);
          return element;
        }
      }
    }

    console.log('AutoScroll: No specific scroll element found for TikTok, using window');
    return window;
  }

  // ===== INSTAGRAM REELS — ADVANCED MULTI-STRATEGY AUTO-ADVANCE =====

  function findInstagramReelsNextButton() {
    const allButtons = document.querySelectorAll('button, div[role="button"], [tabindex="0"]');
    for (const btn of allButtons) {
      const svg = btn.querySelector('svg');
      if (!svg) continue;

      const rect = btn.getBoundingClientRect();
      if (rect.width < 15 || rect.height < 15) continue;
      if (rect.top < 0 || rect.left < 0) continue;

      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const parentAriaLabel = (btn.parentElement?.getAttribute('aria-label') || '').toLowerCase();

      if (ariaLabel.includes('next') || ariaLabel.includes('down') ||
          parentAriaLabel.includes('next') || parentAriaLabel.includes('down')) {
        console.log('AutoScroll: Found Instagram Reels next button via aria-label:', btn);
        return btn;
      }
    }

    const candidates = document.querySelectorAll('svg[aria-label*="Down"], svg[aria-label*="Next"], svg[aria-label*="down"], svg[aria-label*="next"]');
    for (const svg of candidates) {
      const clickable = svg.closest('button, div[role="button"], [tabindex="0"], a');
      if (clickable) {
        console.log('AutoScroll: Found Instagram Reels next button via SVG aria-label:', clickable);
        return clickable;
      }
    }

    const videoElements = document.querySelectorAll('video');
    for (const video of videoElements) {
      const videoContainer = video.closest('div[class]');
      if (!videoContainer) continue;

      let parent = videoContainer;
      for (let i = 0; i < 8; i++) {
        parent = parent.parentElement;
        if (!parent) break;

        const navBtns = parent.querySelectorAll('button svg, div[role="button"] svg');
        for (const navSvg of navBtns) {
          const navBtn = navSvg.closest('button, div[role="button"]');
          if (!navBtn) continue;
          const navRect = navBtn.getBoundingClientRect();

          const videoRect = video.getBoundingClientRect();
          const isBelowVideo = navRect.top > videoRect.top + videoRect.height * 0.5;
          const isReasonableSize = navRect.width >= 20 && navRect.width <= 100;

          if (isBelowVideo && isReasonableSize && navRect.bottom <= window.innerHeight + 50) {
            console.log('AutoScroll: Found Instagram Reels next button via structural detection:', navBtn);
            return navBtn;
          }
        }
      }
    }

    return null;
  }

  function findInstagramReelsScrollContainer() {
    const videos = document.querySelectorAll('video');

    for (const video of videos) {
      let el = video.parentElement;
      for (let i = 0; i < 15; i++) {
        if (!el) break;
        const style = window.getComputedStyle(el);

        const hasScrollSnap = style.scrollSnapType && style.scrollSnapType !== 'none';
        const isScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll');
        const isTall = el.clientHeight >= window.innerHeight * 0.5;
        const hasOverflow = el.scrollHeight > el.clientHeight + 50;

        if ((hasScrollSnap || (isScrollY && hasOverflow)) && isTall) {
          console.log('AutoScroll: Instagram Reels scroll container found from video ancestor:', el);
          return el;
        }
        el = el.parentElement;
      }
    }

    const allDivs = document.querySelectorAll('section > main div, div[role="presentation"], div[style]');
    for (const div of allDivs) {
      const style = window.getComputedStyle(div);
      const hasScrollSnap = style.scrollSnapType && style.scrollSnapType !== 'none';
      const isScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll');
      const isTall = div.clientHeight >= window.innerHeight * 0.5;
      const hasOverflow = div.scrollHeight > div.clientHeight + 50;

      if ((hasScrollSnap || (isScrollY && hasOverflow)) && isTall) {
        console.log('AutoScroll: Instagram Reels scroll container found (broad search):', div);
        return div;
      }
    }

    return null;
  }

  function performInstagramReelsAdvance() {
    let success = false;

    // Strategy A: Click "Next" button
    const nextBtn = findInstagramReelsNextButton();
    if (nextBtn) {
      try {
        nextBtn.click();
        console.log('AutoScroll: [Reels Strategy A] Clicked next button');
        success = true;
      } catch (e) {
        console.log('AutoScroll: [Reels Strategy A] Click failed:', e);
      }
    }

    // Strategy B: Keyboard ArrowDown
    try {
      const activeVideo = document.querySelector('video');
      const focusTarget = activeVideo || document.querySelector('[role="presentation"]') || document.body;

      if (focusTarget && focusTarget !== document.body) {
        focusTarget.focus({ preventScroll: true });
      }

      const targets = [focusTarget, document.body, document.documentElement, document];
      for (const target of targets) {
        if (!target) continue;
        const keyOpts = {
          key: 'ArrowDown',
          code: 'ArrowDown',
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true,
          composed: true
        };
        target.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
        target.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
      }
      console.log('AutoScroll: [Reels Strategy B] Dispatched ArrowDown keyboard events');
      if (!success) success = true;
    } catch (e) {
      console.log('AutoScroll: [Reels Strategy B] Keyboard dispatch failed:', e);
    }

    // Strategy C: Scroll snap container
    const reelsContainer = findInstagramReelsScrollContainer();
    if (reelsContainer) {
      try {
        const snapHeight = reelsContainer.clientHeight;
        const prevScroll = reelsContainer.scrollTop;

        reelsContainer.scrollBy({ top: snapHeight, behavior: 'smooth' });

        setTimeout(() => {
          if (reelsContainer.scrollTop === prevScroll) {
            reelsContainer.scrollTop += snapHeight;
            console.log('AutoScroll: [Reels Strategy C] Forced instant scroll');
          }
        }, 300);

        console.log('AutoScroll: [Reels Strategy C] Scrolled snap container by', snapHeight, 'px');
        success = true;
      } catch (e) {
        console.log('AutoScroll: [Reels Strategy C] Container scroll failed:', e);
      }
    }

    // Strategy D: Window scroll by viewport height
    try {
      const prevY = window.scrollY;
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });

      setTimeout(() => {
        if (window.scrollY === prevY) {
          window.scrollTo({ top: prevY + window.innerHeight, behavior: 'instant' });
          console.log('AutoScroll: [Reels Strategy D] Forced window scroll');
        }
      }, 300);

      console.log('AutoScroll: [Reels Strategy D] Window scroll by', window.innerHeight, 'px');
      success = true;
    } catch (e) {
      console.log('AutoScroll: [Reels Strategy D] Window scroll failed:', e);
    }

    // Strategy E: WheelEvent
    try {
      const videoEl = document.querySelector('video');
      const wheelTarget = videoEl || document.querySelector('[role="presentation"]') || document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2) || document.body;

      wheelTarget.dispatchEvent(new WheelEvent('wheel', {
        deltaY: 800,
        deltaMode: 0,
        bubbles: true,
        cancelable: true,
        composed: true
      }));
      console.log('AutoScroll: [Reels Strategy E] Dispatched wheel event on:', wheelTarget.tagName);
    } catch (e) {
      console.log('AutoScroll: [Reels Strategy E] Wheel event failed:', e);
    }

    // Track URL changes
    const currentReelsUrl = window.location.href;
    if (currentReelsUrl !== lastReelsUrl) {
      reelsVideoIndex++;
      lastReelsUrl = currentReelsUrl;
      console.log('AutoScroll: Reels video #' + reelsVideoIndex + ' — URL:', currentReelsUrl);
    }

    return success;
  }

  // ===== INSTAGRAM FEED/EXPLORE SCROLL ELEMENT FINDER =====
  function findInstagramFeedScrollElement() {
    return findScrollableElement([
      'main[role="main"]',
      'section > main',
      'div[role="feed"]',
      'article',
      'div[class*="feed"]', 'div[class*="Feed"]',
      'div[style*="overflow"]'
    ], 400, 'Instagram Feed');
  }

  // ===== SCROLL HELPER FUNCTIONS =====

  function getScrollPosition() {
    try {
      if (scrollElement === window) {
        return window.scrollY || window.pageYOffset || 0;
      }
      return scrollElement.scrollTop || 0;
    } catch (e) {
      return 0;
    }
  }

  function getScrollHeight() {
    try {
      if (scrollElement === window) {
        return document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      }
      return scrollElement.scrollHeight || 0;
    } catch (e) {
      return 0;
    }
  }

  // Check if the SPA has rendered meaningful content for video platforms
  function isSPAReady() {
    const hostname = window.location.hostname;

    if (hostname.includes('tiktok.com')) {
      // TikTok is ready when video elements exist
      return document.querySelectorAll('video').length > 0;
    }
    if (hostname.includes('instagram.com')) {
      // Instagram is ready when video elements or main content exist
      const hasVideo = document.querySelectorAll('video').length > 0;
      const hasMain = document.querySelector('main') !== null || document.querySelector('section > main') !== null;
      return hasVideo || hasMain;
    }
    // Non-SPA platforms are always "ready"
    return true;
  }

  // Perform scroll action based on platform type
  function performScroll() {
    try {
      if (platformType === 'instagram-reels') {
        performInstagramReelsAdvance();
        return;
      }

      if (platformType === 'video-scroll') {
        const scrollAmount = (scrollElement === window)
          ? window.innerHeight
          : scrollElement.clientHeight;

        // Keyboard ArrowDown for TikTok
        try {
          const target = document.activeElement && document.activeElement !== document.body
            ? document.activeElement
            : document;
          target.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'ArrowDown', keyCode: 40, which: 40, code: 'ArrowDown',
            bubbles: true, cancelable: true
          }));
        } catch (e) { /* ignore */ }

        if (scrollElement === window) {
          window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        } else {
          scrollElement.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
      } else {
        // Feed mode
        if (scrollElement === window) {
          window.scrollBy({ top: 200, behavior: 'smooth' });
        } else {
          const prevScroll = scrollElement.scrollTop;
          scrollElement.scrollBy({ top: 200, behavior: 'smooth' });

          setTimeout(() => {
            if (scrollElement && scrollElement.scrollTop === prevScroll) {
              scrollElement.scrollTop += 200;
              console.log('AutoScroll: Using alternative scroll method');
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('AutoScroll: Scroll error:', error);
      window.scrollBy({ top: 200, behavior: 'smooth' });
    }
  }

  // ===== DETECT PLATFORM & FIND SCROLL ELEMENT =====
  function detectPlatformAndElement() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    const isFarcaster = hostname.includes('farcaster.xyz');
    const isBluesky = hostname.includes('bsky.app');
    const isLinkedIn = hostname.includes('linkedin.com');
    const isQuora = hostname.includes('quora.com');
    const isReddit = hostname.includes('reddit.com');
    const isTikTok = hostname.includes('tiktok.com');
    const isInstagram = hostname.includes('instagram.com');
    const isInstagramReels = isInstagram && (pathname.includes('/reels') || pathname.includes('/reel/'));

    // Determine platform type
    if (isInstagramReels) {
      platformType = 'instagram-reels';
    } else if (isTikTok) {
      platformType = 'video-scroll';
    } else {
      platformType = 'feed';
    }

    // Find scroll element
    if (isInstagramReels) {
      const reelsContainer = findInstagramReelsScrollContainer();
      scrollElement = reelsContainer || window;
      console.log('AutoScroll: Instagram Reels (multi-strategy video mode)');
    } else if (isTikTok) {
      scrollElement = findTikTokScrollElement();
      console.log('AutoScroll: TikTok (video-scroll mode)');
    } else if (isInstagram) {
      scrollElement = findInstagramFeedScrollElement();
      console.log('AutoScroll: Instagram Feed/Explore');
    } else if (isFarcaster) {
      scrollElement = findFarcasterScrollElement();
      console.log('AutoScroll: Farcaster');
    } else if (isBluesky) {
      scrollElement = findBlueskyScrollElement();
      console.log('AutoScroll: Bluesky');
    } else if (isLinkedIn) {
      scrollElement = findLinkedInScrollElement();
      console.log('AutoScroll: LinkedIn');
    } else if (isQuora) {
      scrollElement = findQuoraScrollElement();
      console.log('AutoScroll: Quora');
    } else if (isReddit) {
      scrollElement = findRedditScrollElement();
      console.log('AutoScroll: Reddit');
    } else {
      scrollElement = window;
      console.log('AutoScroll: X.com / generic');
    }
  }

  // ===== MAIN AUTO-SCROLL CONTROL =====

  function startAutoScroll(scrollSec, refreshMin, autoReload) {
    stopAutoScroll();

    // Reset state
    lastScrollPosition = null;
    lastScrollHeight = null;
    scrollStaleCount = 0;
    reelsVideoIndex = 0;
    lastReelsUrl = window.location.href;

    // Detect platform and find scroll element
    detectPlatformAndElement();

    // ===== SPA RETRY LOGIC =====
    // For SPA platforms (TikTok, Instagram), the DOM may not be ready on first run.
    // If video elements don't exist yet, wait and retry with exponential backoff.
    const needsSPAWait = (platformType === 'video-scroll' || platformType === 'instagram-reels');

    if (needsSPAWait && !isSPAReady()) {
      console.log('AutoScroll: SPA not ready, waiting for content to render...');
      let retryCount = 0;
      const maxRetries = 10;
      const retryDelays = [500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000];

      function retryElementDiscovery() {
        retryCount++;
        console.log('AutoScroll: SPA retry #' + retryCount + '/' + maxRetries);

        if (isSPAReady()) {
          console.log('AutoScroll: SPA ready! Re-detecting elements...');
          detectPlatformAndElement();
          beginScrolling(scrollSec, refreshMin, autoReload);
          return;
        }

        if (retryCount < maxRetries) {
          elementRetryTimer = setTimeout(retryElementDiscovery, retryDelays[retryCount] || 5000);
        } else {
          // Max retries reached — start anyway with window fallback
          console.log('AutoScroll: SPA max retries reached, starting with fallback');
          beginScrolling(scrollSec, refreshMin, autoReload);
        }
      }

      elementRetryTimer = setTimeout(retryElementDiscovery, retryDelays[0]);
      return;
    }

    // SPA ready or non-SPA platform — start immediately
    beginScrolling(scrollSec, refreshMin, autoReload);
  }

  function beginScrolling(scrollSec, refreshMin, autoReload) {
    // Clear any pending retry
    if (elementRetryTimer) {
      clearTimeout(elementRetryTimer);
      elementRetryTimer = null;
    }

    // ===== SCROLL INTERVAL =====
    timers.scrollInterval = setInterval(() => {
      try {
        // For Instagram Reels: use URL change as movement indicator
        if (platformType === 'instagram-reels') {
          const currentUrl = window.location.href;

          if (lastReelsUrl && currentUrl === lastReelsUrl) {
            scrollStaleCount++;
            console.log('AutoScroll: Reels stale (URL unchanged), count:', scrollStaleCount, '/', STALE_LIMIT);
          } else {
            scrollStaleCount = Math.max(0, scrollStaleCount - 2);
            lastReelsUrl = currentUrl;
          }

          if (autoReload && scrollStaleCount >= STALE_LIMIT) {
            console.log('AutoScroll: Reels content ended. Reloading...');
            stopAutoScroll();
            setTimeout(() => location.reload(), 500);
            return;
          }

          performScroll();
          return;
        }

        // Standard stale-scroll detection for other platforms
        const currentPos = getScrollPosition();
        const currentHeight = getScrollHeight();

        if (lastScrollPosition !== null) {
          const positionMoved = Math.abs(currentPos - lastScrollPosition) > 2;
          const pageGrew = currentHeight > (lastScrollHeight || 0) + 10;

          if (!positionMoved && !pageGrew) {
            scrollStaleCount++;
            console.log('AutoScroll: Scroll stale, count:', scrollStaleCount, '/', STALE_LIMIT);
          } else {
            scrollStaleCount = Math.max(0, scrollStaleCount - 1);
          }
        }

        lastScrollPosition = currentPos;
        lastScrollHeight = currentHeight;

        if (autoReload && scrollStaleCount >= STALE_LIMIT) {
          console.log('AutoScroll: Content ended. Reloading...');
          stopAutoScroll();
          setTimeout(() => location.reload(), 500);
          return;
        }

        performScroll();

      } catch (error) {
        console.error('AutoScroll: Interval error:', error);
      }
    }, scrollSec * 1000);

    // ===== REFRESH TIMER (always active as safety net) =====
    if (refreshMin && refreshMin > 0) {
      timers.refreshTimeout = setTimeout(() => {
        console.log('AutoScroll: Scheduled time-based reload after', refreshMin, 'minutes');
        stopAutoScroll();
        location.reload();
      }, refreshMin * 60 * 1000);
    }

    console.log('AutoScroll: Started [scrollSec=' + scrollSec + ', refreshMin=' + refreshMin +
                ', autoReload=' + autoReload + ', platform=' + platformType + ']');
  }

  function stopAutoScroll() {
    if (timers.scrollInterval) clearInterval(timers.scrollInterval);
    if (timers.refreshTimeout) clearTimeout(timers.refreshTimeout);
    if (elementRetryTimer) clearTimeout(elementRetryTimer);
    timers = {};
    elementRetryTimer = null;
    scrollStaleCount = 0;
    lastScrollPosition = null;
    lastScrollHeight = null;
    window.__autoScrollActive = false;
  }

  // ===== INITIALIZATION =====
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

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.enabled || changes.scrollTime || changes.refreshTime || changes.autoReload) {
        chrome.storage.local.get(["enabled", "scrollTime", "refreshTime", "autoReload"], (data) => {
          if (data.enabled) {
            // Reset dedup flag so restart works
            window.__autoScrollActive = true;
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
