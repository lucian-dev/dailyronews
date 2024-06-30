const mix = require("laravel-mix");

mix.sass("src/styles/main.scss", "main.css").options({
  processCssUrls: false,
});
