const axios = require("axios");

const API_CONFIG_URL = "https://raw.githubusercontent.com/goatbotnx/xalmanx210/refs/heads/main/apis.json";
const API_KEY = "xalman-hub";
let apiBaseUrl = null;
let apiConfigRequest = null;

async function getApiBaseUrl() {
  if (apiBaseUrl) return apiBaseUrl;

  if (!apiConfigRequest) {
    apiConfigRequest = axios
      .get(API_CONFIG_URL, { timeout: 15000 })
      .then(({ data }) => {
        const baseUrl = data?.[API_KEY];

        if (typeof baseUrl !== "string" || !baseUrl.trim()) {
          throw new Error(`Missing API key in apis.json: ${API_KEY}`);
        }

        apiBaseUrl = baseUrl.replace(/\/+$/, "");
        return apiBaseUrl;
      })
      .finally(() => {
        apiConfigRequest = null;
      });
  }

  return apiConfigRequest;
}
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pinterest",
    aliases: ["pin", "pinimg"],
    version: "3.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Pinterest Search with High-Res Real UI" },
    longDescription: { en: "Search Pinterest images rendered with official UI design and pagination" },
    category: "image",
    guide: { en: "{pn} <query>\nExample: /pin cat" }
  },

  onStart: async function ({ api, event, args, message }) {
    const { messageID } = event;
    const query = args.join(" ").trim();

    if (!query) {
      return message.reply(
        "🔍 𝗣𝗶𝗻𝘁𝗲𝗿𝗲𝘀𝘁 𝗦𝗲𝗮𝗿𝗰𝗵\n━━━━━━━━━━━━━━━━━━\n📝 Usage: /pin <query>\n\nExample:\n/pin cat"
      );
    }

    api.setMessageReaction("🔍", messageID, () => {}, true);
    return this.renderPage({ api, event, message, query, pageNum: 1 });
  },

  renderPage: async function ({ api, event, message, query, pageNum }) {
    const { messageID } = event;
    const perPage = 12;

    try {
      const res = await axios.get(`${await getApiBaseUrl()}/api/pinimg`, {
        params: { search: query, count: 60 },
        timeout: 30000,
        validateStatus: () => true
      });

      const data = res.data;

      if (!data?.status || !Array.isArray(data.result) || !data.result.length) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply(`❌ No images found for "${query}".`);
      }

      const totalImages = data.result;
      const totalPages = Math.ceil(totalImages.length / perPage);
      const currentPage = Math.max(1, Math.min(pageNum, totalPages));

      const startIndex = (currentPage - 1) * perPage;
      const pageImages = totalImages.slice(startIndex, startIndex + perPage);

      const loadedImages = [];
      for (let i = 0; i < pageImages.length; i++) {
        try {
          const img = await loadImage(pageImages[i]);
          loadedImages.push({ img, url: pageImages[i], index: i + 1 });
        } catch (e) {}
      }

      if (!loadedImages.length) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return message.reply("❌ Failed to load images for this page.");
      }

      const numColumns = 3;
      const columnWidth = 330;
      const gap = 16;
      const padding = 24;
      
      const topBarHeight = 90;
      const chipBarHeight = 65;
      const headerTotalHeight = topBarHeight + chipBarHeight;

      const canvasWidth = padding * 2 + numColumns * columnWidth + (numColumns - 1) * gap;
      const columnHeights = new Array(numColumns).fill(headerTotalHeight + padding);
      const imagePositions = [];

      loadedImages.forEach((item) => {
        let shortestColIndex = 0;
        for (let c = 1; c < numColumns; c++) {
          if (columnHeights[c] < columnHeights[shortestColIndex]) {
            shortestColIndex = c;
          }
        }

        const x = padding + shortestColIndex * (columnWidth + gap);
        const y = columnHeights[shortestColIndex];
        const aspectRatio = item.img.height / item.img.width;
        const renderHeight = Math.round(columnWidth * aspectRatio);

        imagePositions.push({
          ...item,
          x,
          y,
          width: columnWidth,
          height: renderHeight
        });

        columnHeights[shortestColIndex] += renderHeight + gap;
      });

      const bottomBarHeight = 70;
      const gridMaxHeight = Math.max(...columnHeights);
      const canvasHeight = gridMaxHeight + bottomBarHeight + padding;

      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.beginPath();
      ctx.arc(padding + 25, 45, 20, 0, Math.PI * 2);
      ctx.fillStyle = "#e60023";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", padding + 25, 46);

      const searchBarX = padding + 60;
      const searchBarW
