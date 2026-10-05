const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    aliases: ["info"],
    version: "1.3.0",
    author: "Anik Islam Sadik",
    role: 0,
    shortDescription: "Owner information with image",
    category: "Information",
    guide: {
      en: "owner"
    }
  },

  onStart: async function ({ api, event }) {
    const ownerText = 
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

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "owner.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgLink = "https://i.imgur.com/gyVwtoC.gif";

    const send = () => {
      api.sendMessage(
        {
          body: ownerText,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => fs.unlinkSync(imgPath),
        event.messageID
      );
    };

    request(encodeURI(imgLink))
      .pipe(fs.createWriteStream(imgPath))
      .on("close", send)
  }
};
