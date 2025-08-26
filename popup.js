document.addEventListener("DOMContentLoaded", () => {
  const scrollInput = document.getElementById("scrollTime");
  const refreshInput = document.getElementById("refreshTime");
  const toggleBtn = document.getElementById("toggle");
  const statusText = document.getElementById("status");

  chrome.storage.local.get(["enabled", "scrollTime", "refreshTime"], (data) => {
    if (data.scrollTime) scrollInput.value = data.scrollTime;
    if (data.refreshTime) refreshInput.value = data.refreshTime;
    if (data.enabled) {
      statusText.textContent = "Status: ON";
      toggleBtn.textContent = "Stop";
    }
  });

  toggleBtn.addEventListener("click", () => {
    chrome.storage.local.get("enabled", (data) => {
      const newState = !data.enabled;
      chrome.storage.local.set({
        enabled: newState,
        scrollTime: parseInt(scrollInput.value),
        refreshTime: parseInt(refreshInput.value)
      });
      statusText.textContent = newState ? "Status: ON" : "Status: OFF";
      toggleBtn.textContent = newState ? "Stop" : "Start";
    });
  });
});
