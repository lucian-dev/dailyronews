import { fetchNews, setNextAlarm, createNotification, fetchWeather, fetchExchangeRate } from "../helpers/helpers.js";

document.addEventListener("DOMContentLoaded", function () {
  // Load existing settings from storage
  chrome.storage.sync.get(["sources", "frequency", "firstVisit", "weatherApiKey", "currencyApiKey"], function (data) {
    if (!data.firstVisit) {
      // First visit: Set default settings
      chrome.storage.sync.set({ firstVisit: true, sources: [], frequency: "60" }, function () {
        resetForm();
      });
    } else {
      // Populate the form with saved settings
      if (data.sources) {
        data.sources.forEach((source) => {
          const checkbox = document.querySelector(`input[value="${CSS.escape(source)}"]`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }
      if (data.frequency) {
        const frequencySelect = document.getElementById("frequency");
        if (frequencySelect) {
          frequencySelect.value = data.frequency;
        }
      }
    }
    if (data.weatherApiKey) {
      fetchWeather(data.weatherApiKey);
    }
    if (data.currencyApiKey) {
      fetchExchangeRate(data.currencyApiKey);
    }
  });

  // Handle form submission
  document.getElementById("options-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const loadingDiv = document.getElementById("loading");
    loadingDiv.style.display = "flex"; // Show loading icon

    const selectedSources = [];
    document.querySelectorAll('input[name="sources"]:checked').forEach((checkbox) => {
      selectedSources.push(checkbox.value);
    });

    if (selectedSources.length === 0) {
      alert("Please select at least one source.");
      loadingDiv.style.display = "none";
      return;
    }

    const notificationFrequency = document.getElementById("frequency").value;

    chrome.storage.sync.set({ sources: selectedSources, frequency: notificationFrequency }, async function () {
      // Clear old articles
      chrome.storage.sync.set({ news: [] }, async () => {
        try {
          const news = await fetchNews(selectedSources);
          console.log("News to be saved:", news); // Debugging statement
          if (Array.isArray(news) && news.length > 0) {
            chrome.storage.sync.set({ news: news }, () => {
              console.log("News saved to storage:", news);
              setNextAlarm(); // Reset the alarm and countdown
              chrome.runtime.sendMessage({ action: "fetchComplete" }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error("Error sending fetchComplete message:", chrome.runtime.lastError.message);
                } else {
                  console.log("Fetch complete message received in options page.");
                }
                loadingDiv.style.display = "none"; // Hide loading icon
              });
            });
          } else {
            throw new Error("No news fetched or news is empty!");
          }
        } catch (error) {
          console.error(error.message);
          chrome.runtime.sendMessage({ action: "fetchFailed", message: error.message }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending fetchFailed message:", chrome.runtime.lastError.message);
            } else {
              console.log("Fetch failed message received in options page.");
            }
            loadingDiv.style.display = "none"; // Hide loading icon
            alert("Failed to fetch news. Please check your selected sources and try again.");
          });
        }
      });
    });
  });
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchComplete") {
    console.log("Fetch complete message received in options page.");
    createNotification("News Fetch Complete", "Your news has been fetched. Check your extension popup.");
    sendResponse({ status: "success" });
  } else if (request.action === "fetchFailed") {
    console.log("Fetch failed message received in options page.", request.message);
    createNotification("News Fetch Failed", request.message || "Failed to fetch news. Please check your selected sources.");
    sendResponse({ status: "failure" });
  }
  return true; // Keep the message channel open for sendResponse
});

// Reset the form to default values
function resetForm() {
  document.querySelectorAll('input[name="sources"]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  const frequencySelect = document.getElementById("frequency");
  if (frequencySelect) {
    frequencySelect.value = "60";
  }
}
