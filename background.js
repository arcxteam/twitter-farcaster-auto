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
    "reddit.com"
  ];
  
  const isAllowed = allowedPatterns.some(pattern => tab.url.includes(pattern));
  
  if (changeInfo.status === "complete" && isAllowed) {
    chrome.storage.local.get("enabled", (data) => {
      if (data.enabled) {
        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
          }).catch(error => {
            console.log("AutoScroll: Injection completed", error);
          });
        }, 300); // Delay 0.3s
      }
    });
  }
});
