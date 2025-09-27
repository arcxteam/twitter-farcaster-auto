document.addEventListener("DOMContentLoaded", () => {
  const scrollInput = document.getElementById("scrollTime");
  const refreshInput = document.getElementById("refreshTime");
  const autoReloadCheckbox = document.getElementById("autoReload");
  const toggleBtn = document.getElementById("toggle");
  const statusDiv = document.getElementById("status");
  const statusIcon = statusDiv ? statusDiv.querySelector(".status-icon") : null;

  if (!toggleBtn || !statusDiv || !statusIcon) {
    console.error("One or more DOM elements not found");
    return;
  }

  // Load initial settings
  chrome.storage.local.get(["enabled", "scrollTime", "refreshTime", "autoReload"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving storage:", chrome.runtime.lastError);
      return;
    }
    
    // Set values with defaults
    scrollInput.value = data.scrollTime || 1;
    refreshInput.value = data.refreshTime || 10;
    autoReloadCheckbox.checked = data.autoReload || false;
    
    // Update UI state
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

  // Real-time input synchronization - Scroll Time
  scrollInput.addEventListener("change", () => {
    const value = parseFloat(scrollInput.value);
    if (isNaN(value) || value < 0.1) {
      alert("Scroll time must be at least 0.1 seconds!");
      scrollInput.value = 0.5;
      return;
    }
    chrome.storage.local.set({ scrollTime: value }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error setting storage:", chrome.runtime.lastError);
      }
    });
  });

  // Real-time input synchronization - Refresh Time
  refreshInput.addEventListener("change", () => {
    const value = parseInt(refreshInput.value);
    if (isNaN(value) || value < 1) {
      alert("Refresh interval must be a positive number!");
      refreshInput.value = 10;
      return;
    }
    chrome.storage.local.set({ refreshTime: value }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error setting storage:", chrome.runtime.lastError);
      }
    });
  });

  // ✅ FIXED: Auto Reload
  autoReloadCheckbox.addEventListener("change", () => {
    chrome.storage.local.set({ autoReload: autoReloadCheckbox.checked }, () => {
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
      
      const scrollTime = parseFloat(scrollInput.value) || 1;
      const refreshTime = parseInt(refreshInput.value) || 10;
      const autoReload = autoReloadCheckbox.checked;
      const newState = !data.enabled;
      
      chrome.storage.local.set({
        enabled: newState,
        scrollTime: scrollTime,
        refreshTime: refreshTime,
        autoReload: autoReload
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
