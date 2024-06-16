import { sources } from "../../lib/sources.js";

// Function to create notifications
export const createNotification = (title, message) => {
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/icons/icon128.png"),
    title: title,
    message: message,
    priority: 0,
  });
};

export async function fetchNews(selectedSources) {
  const MAX_SUMMARY_LENGTH = 145;
  selectedSources = selectedSources || []; // Default to empty array if undefined
  console.log("Selected sources:", selectedSources); // Debugging statement

  const news = [];

  const apiKey = await new Promise((resolve) => {
    chrome.storage.sync.get("apiKey", (data) => {
      resolve(data.apiKey);
    });
  });

  for (const source of sources) {
    if (selectedSources.includes(source.name)) {
      try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}&api_key=${apiKey}`);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        const items = data.items;

        if (!items || items.length === 0) {
          console.warn(`No items found for ${source.name}`);
        }

        items.slice(0, 3).forEach((item) => {
          let summary = stripHtml(item.description);
          if (summary.length > MAX_SUMMARY_LENGTH) {
            summary = summary.substring(0, MAX_SUMMARY_LENGTH) + "...";
          }
          news.push({
            title: item.title,
            summary: summary,
            url: item.link,
          });
        });
      } catch (error) {
        console.error(`Error fetching news from ${source.name}:`, error);
        throw error; // Rethrow the error to be caught in the calling function
      }
    }
  }
  console.log("Fetched News:", news); // Debugging statement
  return news; // Ensure news is always an array
}

// Utility function to strip HTML tags
function stripHtml(html) {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

let countdownInterval = null;

export function setNextAlarm() {
  chrome.storage.sync.get("frequency", (data) => {
    let frequency = parseInt(data.frequency, 10); // Ensure frequency is a number

    console.log(`Frequency retrieved from storage: ${frequency}`);

    chrome.alarms.clear("fetchNewsAlarm", () => {
      if (!isNaN(frequency)) {
        console.log(`Setting alarm with frequency (minutes): ${frequency}`);
        chrome.alarms.create("fetchNewsAlarm", {
          periodInMinutes: frequency,
        });
      } else {
        console.log("Setting daily alarm for 8:00 AM");
        const now = new Date();
        let nextFetch = new Date();
        nextFetch.setHours(8, 0, 0, 0);

        if (now > nextFetch) {
          nextFetch.setDate(nextFetch.getDate() + 1);
        }

        const msUntilNextFetch = nextFetch - now;
        chrome.alarms.create("fetchNewsAlarm", { when: Date.now() + msUntilNextFetch });
      }

      if (countdownInterval) {
        console.log("Clearing existing countdown interval:", countdownInterval);
        clearInterval(countdownInterval);
        countdownInterval = null;
        console.log("Countdown interval after clearing:", countdownInterval);
      }
    });
  });
}
