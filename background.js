chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && 
      (tab.url.includes("x.com/home") || 
       tab.url.includes("farcaster.xyz") ||
       tab.url.includes("bsky.app"))) {
    chrome.storage.local.get("enabled", (data) => {
      if (data.enabled) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content.js"]
        });
      }
    });
  }
});
