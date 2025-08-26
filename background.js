chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && /^https:\/\/x\.com\/home$/.test(tab.url)) {
    chrome.storage.local.get("enabled", (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving storage:", chrome.runtime.lastError);
        return;
      }
      if (data.enabled) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content.js"]
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error injecting script:", chrome.runtime.lastError);
          }
        });
      }
    });
  }
});
