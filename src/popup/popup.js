document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get("news", function (data) {
    const newsContainer = document.getElementById("news-container");
    newsContainer.innerHTML = "";

    if (data.news && data.news.length > 0) {
      data.news.forEach((newsItem) => {
        const newsDiv = document.createElement("div");
        newsDiv.classList.add("news-item");
        newsDiv.innerHTML = `
          <h4><a href="${newsItem.url}" target="_blank">${newsItem.title}</a></h4>
          <p>${newsItem.summary}</p>
        `;
        newsContainer.appendChild(newsDiv);
      });
    } else {
      newsContainer.innerHTML = "<p>No articles available.</p>";
    }
  });
});
