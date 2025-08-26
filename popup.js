document.addEventListener("DOMContentLoaded", () => {
  const scrollInput = document.getElementById("scrollTime");
  const refreshInput = document.getElementById("refreshTime");
  const toggleBtn = document.getElementById("toggle");
  const statusText = document.getElementById("status");

  // Load initial settings
  chrome.storage.local.get(["enabled", "scrollTime", "refreshTime"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving storage:", chrome.runtime.lastError);
      return;
    }
    if (data.scrollTime) scrollInput.value = data.scrollTime;
    if (data.refreshTime) refreshInput.value = data.refreshTime;
    if (data.enabled) {
      statusText.textContent = "Status: ON";
      toggleBtn.textContent = "Stop";
    }
  });

  // Real-time input synchronization
  scrollInput.addEventListener("change", () => {
    const value = parseInt(scrollInput.value);
    if (isNaN(value) || value < 1) {
      alert("Scroll time must be a positive number!");
      scrollInput.value = 1;
      return;
    }
    chrome.storage.local.set({ scrollTime: value }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error setting storage:", chrome.runtime.lastError);
      }
    });
  });

  refreshInput.addEventListener("change", () => {
    const value = parseInt(refreshInput.value);
    if (isNaN(value) || value < 1) {
      alert("Refresh time must be a positive number!");
      refreshInput.value = 10;
      return;
    }
    chrome.storage.local.set({ refreshTime: value }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error setting storage:", chrome.runtime.lastError);
      }
    });
  });

  // Toggle button logic
  toggleBtn.addEventListener("click", () => {
    chrome.storage.local.get("enabled", (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving storage:", chrome.runtime.lastError);
        return;
      }
      const scrollTime = parseInt(scrollInput.value);
      const refreshTime = parseInt(refreshInput.value);
      if (isNaN(scrollTime) || scrollTime < 1) {
        alert("Scroll time must be a positive number!");
        scrollInput.value = 1;
        return;
      }
      if (isNaN(refreshTime) || refreshTime < 1) {
        alert("Refresh time must be a positive number!");
        refreshInput.value = 10;
        return;
      }
      const newState = !data.enabled;
      chrome.storage.local.set({
        enabled: newState,
        scrollTime: scrollTime,
        refreshTime: refreshTime
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error setting storage:", chrome.runtime.lastError);
          return;
        }
        statusText.textContent = newState ? "Status: ON" : "Status: OFF";
        toggleBtn.textContent = newState ? "Stop" : "Start";
      });
    });
  });
});
