// background.js

chrome.action.onClicked.addListener((tab) => {
  // Hardcoded for development. For production, this will point to the deployed Render dashboard URL.
  const dashboardUrl = "http://localhost:5173/";

  chrome.tabs.create({ url: dashboardUrl });
});