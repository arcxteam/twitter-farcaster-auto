document.addEventListener("DOMContentLoaded", () => {
  const scrollInput = document.getElementById("scrollTime");
  const refreshInput = document.getElementById("refreshTime");
  const toggleBtn = document.getElementById("toggle");
  const statusDiv = document.getElementById("status");
  const statusIcon = statusDiv ? statusDiv.querySelector(".status-icon") : null;

  if (!toggleBtn || !statusDiv || !statusIcon) {
    console.error("One or more DOM elements not found:", { toggleBtn, statusDiv, statusIcon });
    return;
  }

  // Load initial settings
  chrome.storage.local.get(["enabled", "scrollTime", "refreshTime"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving storage:", chrome.runtime.lastError);
      return;
    }
    if (data.scrollTime) scrollInput.value = data.scrollTime;
    if (data.refreshTime) refreshInput.value = data.refreshTime;
    if (data.enabled) {
      statusIcon.classList.remove("status-off");
      statusIcon.classList.add("status-on");
      statusDiv.textContent = "ON";
      toggleBtn.textContent = "Stop";
    } else {
      statusIcon.classList.remove("status-on");
      statusIcon.classList.add("status-off");
      statusDiv.textContent = "OFF";
      toggleBtn.textContent = "Start";
    }
  });

  // Real-time input synchronization
  scrollInput.addEventListener("change", () => {
    const value = parseInt(scrollInput.value);
    if (isNaN(value) || value < 1) {
      alert("Scrolling time must be a positive number");
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
      alert("Refresh interval must be a positive number");
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
      const scrollTime = parseInt(scrollInput.value) || 1;
      const refreshTime = parseInt(refreshInput.value) || 10;
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
        if (newState) {
          statusIcon.classList.remove("status-off");
          statusIcon.classList.add("status-on");
          statusDiv.textContent = "ON";
          toggleBtn.textContent = "Stop";
        } else {
          statusIcon.classList.remove("status-on");
          statusIcon.classList.add("status-off");
          statusDiv.textContent = "OFF";
          toggleBtn.textContent = "Start";
        }
      });
    });
  });
});
