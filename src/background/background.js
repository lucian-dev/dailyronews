import { fetchNews, setNextAlarm, createNotification } from "../helpers/helpers.js";

// Listener for extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Clear storage on first install
  chrome.storage.sync.clear(() => {
    // Set default frequency to 60 minutes, initialize sources and store the API key
    const defaultSettings = {
      frequency: "60",
      sources: [],
      apiKey: "iyxqfkmarifagmyurbzqh1dsws4jrx6r26o9mlyg",
      weatherApiKey: "8fd25009e6adc7a3bb8b5aab18a5ab45",
      currencyApiKey: "9b3a46058ba69871a8d58c44",
    };
    chrome.storage.sync.set(defaultSettings, () => {
      console.log("Initial setup complete. Redirecting to options page.");
      chrome.tabs.create({ url: "src/options/options.html" });
      setNextAlarm(); // Set the initial alarm after clearing storage
    });
  });
});

// Listener for messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchComplete") {
    createNotification("Preluarea știrilor completă", "Știrile tale au fost preluate. Verifică popup-ul extensiei.");
    sendResponse({ status: "success" });
  } else if (request.action === "fetchFailed") {
    createNotification("Preluarea știrilor a eșuat", request.message || "Nu s-a putut prelua știrile. Te rog să verifici sursele selectate.");
    sendResponse({ status: "failure" });
  }
  return true; // Keep the message channel open for sendResponse
});

// Listeners for alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "fetchNewsAlarm") {
    chrome.storage.sync.get(["sources"], async (data) => {
      const selectedSources = data.sources || [];
      console.log("Selected sources retrieved from storage: ", selectedSources);

      if (selectedSources.length === 0) {
        console.log("No sources selected. Skipping fetch.");
      } else {
        try {
          const news = await fetchNews(selectedSources);
          chrome.storage.sync.set({ news }, () => {
            console.log("News fetched and stored successfully.");
            createNotification("Preluarea știrilor completă", "Știrile tale au fost preluate. Verifică popup-ul extensiei.");
          });
        } catch (error) {
          console.error("Error fetching news: ", error);
          createNotification("Preluarea știrilor a eșuat", error.message || "Nu s-a putut prelua știrile. Te rog să verifici sursele selectate.");
        }
      }
    });
    setNextAlarm(); // Reset the countdown when the alarm goes off
  }
});

// Set the initial alarm and start the countdown
setNextAlarm();
