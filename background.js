chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // BLOCK non-http pages
  if (!tab.url || !(tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
    return;
  }
  
  // BLOCK other extensions
  const blockedPatterns = [
    'chrome-extension://',
    'edge-extension://', 
    'about:',
    'edge:',
    'opera:',
    'vivaldi:',
    'brave:',
    'firefox:',
    // SPECIFIC WALLET EXTENSIONS (exact patterns)
    'metamask',
    'okx-wallet',
    'extensions',
    'phantom',
    'trust-wallet',
    'coinbase-wallet-extension',
    'rabby-wallet',
    'keplr',
    'talisman-wallet',
    'backpack',
    'unisat-wallet',
    'leap-wallet',
    'suiet-sui-wallet',
    'martian-aptos-sui-wallet',
    'petra-aptos-wallet',
    'slush-—-a-sui-wallet'
  ];
  
  if (blockedPatterns.some(pattern => tab.url.includes(pattern))) {
    return;
  }
  
  // Only inject this
  const allowedPatterns = [
    "x.com/home",
    "farcaster.xyz",
    "bsky.app", 
    "linkedin.com/feed",
    "quora.com",
    "reddit.com",
    "tiktok.com",
    "instagram.com"
  ];
  
  const isAllowed = allowedPatterns.some(pattern => tab.url.includes(pattern));
  
  if (changeInfo.status === "complete" && isAllowed) {
    chrome.storage.local.get("enabled", (data) => {
      if (data.enabled) {
        // Determine if this is an SPA-heavy platform that needs longer delay
        const spaPatterns = ["tiktok.com", "instagram.com"];
        const isSPA = spaPatterns.some(p => tab.url.includes(p));
        
        // Primary injection is handled by content_scripts in manifest.json.
        // This serves as fallback with staggered delays.
        // Short delay for regular sites, longer + retry for SPA sites.
        const delays = isSPA ? [1500, 4000, 8000] : [500];
        
        delays.forEach((delay) => {
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ["content.js"]
            }).catch(error => {
              // Expected: content.js dedup guard prevents double-run
              console.log("AutoScroll: Fallback injection attempt (" + delay + "ms):", error?.message || "ok");
            });
          }, delay);
        });
      }
    });
  }
});
