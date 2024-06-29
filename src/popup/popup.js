document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get("news", function (data) {
    const newsContainer = document.getElementById("news-container");
    newsContainer.innerHTML = "";

    if (data.news && data.news.length > 0) {
      data.news.forEach((newsItem) => {
        const newsDiv = document.createElement("div");
        newsDiv.classList.add("news-item");
        newsDiv.innerHTML = `
          <h4><a href="${newsItem.url}" target="_blank">${newsItem.title}</a> <span class="news-item-source">Sursa: ${newsItem.source}</span></h4>
          <p>${newsItem.summary}</p>
          <div class="share-buttons">
            <span>Share: </span>
            <i class="fab fa-facebook-square share-btn" data-url="${newsItem.url}" data-platform="facebook" title="Share on Facebook"></i>
            <i class="fab fa-twitter-square share-btn" data-url="${newsItem.url}" data-platform="twitter" title="Share on Twitter"></i>
            <i class="fab fa-linkedin share-btn" data-url="${newsItem.url}" data-platform="linkedin" title="Share on Linkedin"></i>
          </div>
        `;
        newsContainer.appendChild(newsDiv);
      });

      // Add event listeners to share buttons
      document.querySelectorAll(".share-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const url = this.getAttribute("data-url");
          const platform = this.getAttribute("data-platform");

          if (platform === "facebook") {
            shareOnFacebook(url);
          } else if (platform === "twitter") {
            shareOnTwitter(url);
          } else if (platform === "linkedin") {
            shareOnLinkedin(url);
          }
        });
      });
    } else {
      newsContainer.innerHTML = "<p>Nu sunt articole disponibile.</p>";
    }
  });
});

function shareOnFacebook(url) {
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(fbUrl, "_blank");
}

function shareOnTwitter(url) {
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, "_blank");
}

function shareOnLinkedin(url) {
  const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`;
  window.open(linkedinUrl, "_blank");
}
