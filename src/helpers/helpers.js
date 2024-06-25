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
            source: source.name,
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

export function fetchWeather(apiKey) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherData(latitude, longitude, apiKey, "your location");
    },
    () => {
      // Default to Bucharest if location access is denied or fails
      const defaultCity = {
        lat: 44.4268,
        lon: 26.1025,
        name: "Bucharest",
      };
      fetchWeatherData(defaultCity.lat, defaultCity.lon, apiKey, defaultCity.name);
    }
  );
}

// Function to fetch weather data
function fetchWeatherData(lat, lon, apiKey, cityName = "your location") {
  const weatherElement = document.createElement("div");
  weatherElement.className = "weather";
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.main && data.weather) {
        const temperature = Math.round(data.main.temp);
        const weatherHTML = `
          <p class="weather-temp">${temperature} °C</p>
          <p class="weather-city">${cityName}</p>
          <p class="weather-desc">${data.weather[0].description}</p>
        `;
        weatherElement.innerHTML = weatherHTML;
        document.querySelector("header.drn-header").prepend(weatherElement);
      } else {
        console.error("Weather data is not complete:", data);
      }
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
    });
}

export function fetchExchangeRate(apiKey) {
  const exchangeRateElement = document.createElement("div");
  exchangeRateElement.className = "currency";
  fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/EUR`)
    .then((response) => response.json())
    .then((data) => {
      if (data && data.conversion_rates && data.conversion_rates.RON) {
        const exchangeRate = data.conversion_rates.RON;
        const exchangeRateHTML = `
          <h4>Today currency</h4>
          <p class="exchange-rate">1 EUR = ${exchangeRate.toFixed(2)} RON</p>
        `;
        exchangeRateElement.innerHTML = exchangeRateHTML;
        document.querySelector("header.drn-header").appendChild(exchangeRateElement);
      } else {
        console.error("Exchange rate data is not complete:", data);
      }
    })
    .catch((error) => {
      console.error("Error fetching exchange rate data:", error);
    });
}
