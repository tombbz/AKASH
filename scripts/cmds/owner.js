const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "1.0.0",
    author: "AKASH AHMED",
    countDown: 5,
    role: 0,
    description: "Show bot owner information with video",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ message }) {
    const videoUrl = "https://files.catbox.moe/vd43nx.mp4";
    const videoPath = path.join(__dirname, "cache", "owner.mp4");
    
    try {
      // video download
      const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
      await fs.writeFile(videoPath, response.data);

      // message + video send
      return message.reply({
        body: 
"╭─ 👑 Oᴡɴᴇʀ Iɴғᴏ 👑 ─╮\n" +
"│ 👤 Nᴀᴍᴇ : ꪖᴋꪖꪶʜ ꪖʜᴍᴇᴅ\n" +
"│ 🦋 Nɪᴄᴋ : ফু্ঁল্‌ঁ ও্ঁয়া্ঁলা্ঁ\n" +
"│ 🎂 Aɢᴇ : 𝟭𝟵+\n" +
"│ 💘 Rᴇʟᴀᴛɪᴏɴ : 𝗦𝗶𝗻𝗴𝗹𝗲\n" +
"│ 🎓 Pʀᴏғᴇssɪᴏɴ : 𝗦𝘁𝘂𝗱𝗲𝗻𝘁\n" +
"│ 📚 Eᴅᴜᴄᴀᴛɪᴏɴ : 𝗜𝗻𝘁𝗲𝗿 𝟭𝘀𝘁 𝗬𝗲𝗮𝗿\n" +
"│ 🏡 Lᴏᴄᴀᴛɪᴏɴ : 𝗞𝗵𝘂𝗹𝗻𝗮\n" +
"├─ 🔗 Cᴏɴᴛᴀᴄᴛ ─╮\n" +
"│ 📘 Facebook : id=61595794810986\n" +
"│ 💬 Messenger: id=61595794810986\n" +
"│ 📞 WhatsApp : 01410577478\n" +
"╰────────────────",
        attachment: fs.createReadStream(videoPath)
      });

    } catch (err) {
      return message.reply("Video load করতে problem হচ্ছে 😢");
    }
  }
};
