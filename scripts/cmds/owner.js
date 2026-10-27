cmd install owner.js const axios = require("axios");

const API_CONFIG_URL = "https://raw.githubusercontent.com/negative-xalman/xalmanx210/refs/heads/main/apis.json";
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
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "owner",
    aliases: ["admininfo", "info", "ownerinfo"],
    version: "3.0",
    author: "xalman",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Show owner information" },
    category: "owner",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, message }) {

    const ownerName = "AKASH";
    const ownerAge = "19";
    const fbName = "Maybe TOM";
    const messenger = "https://www.facebook.com/xalman.dev";
    const whatsapp = "https://wa.me/qr/2SDY4QQTMJR7H1";
    const telegram = "";
    const address = "Narsingdi, Dhaka, Bangladesh";
    const religion = "Islam";
    const apiServer = await getApiBaseUrl();
    const relationship = "Single";
    const videoLink = "https://files.catbox.moe/vd43nx.mp4";
    const timeBD = moment().tz("Asia/Dhaka");
    
    const infoMsg = 
`╭─ 👑 Oᴡɴᴇʀ Iɴғᴏ 👑 ─╮
│ 👤 Nᴀᴍᴇ : ꪖᴋꪖꪶʜ ꪖʜᴍᴇᴅ
│ 🦋 Nɪᴄᴋ : ফু্ঁল্‌ঁ ও্ঁয়া্ঁলা্ঁ
│ 🎂 Aɢᴇ : 𝟭𝟵+ 
│ 💘 Rᴇʟᴀᴛɪᴏɴ : 𝗦𝗶𝗻𝗴𝗹𝗲
│ 🎓 Pʀᴏғᴇssɪᴏɴ : 𝗦𝘁𝘂𝗱𝗲𝗻𝘁 
│ 📚 Eᴅᴜᴄᴀᴛɪᴏɴ : 𝗜𝗻𝘁𝗲𝗿 𝟭𝘀𝘁 𝗬𝗲𝗮𝗿
│ 🏡 Lᴏᴄᴀᴛɪᴏɴ : 𝗞𝗵𝘂𝗹𝗻𝗮
├─ 🔗 Cᴏɴᴛᴀᴄᴛ ─╮
│ 📘 Facebook : id=61590496500848
│ 💬 Messenger: id=61590496500848
│ 📞 WhatsApp : 01410577478
╰────────────────`;

    try {
      return message.reply({
        body: infoMsg,
        attachment: await global.utils.getStreamFromURL(videoLink)
      });
    } catch (e) {
      return message.reply(infoMsg);
    }
  },

  onChat: async function ({ event, message }) {
    if (event.body?.toLowerCase() === "info") {
      return this.onStart({ message, event });
    }
  }
};
