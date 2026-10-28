const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "ownerinfo",
    aliases: ["akashinfo", "akash", "owner2"],
    version: "1.0.0",
    author: "DI-ABLO",
    role: 0,
    countDown: 5,
    shortDescription: "👑 Akash Ahmed's Info Card",
    category: "info",
    guide: {
      en: "{pn} - Show owner info"
    }
  },

  onStart: async function ({ api, event, message }) {
    const { threadID, messageID } = event;

    const gifUrl = "https://files.catbox.moe/vd43nx.mp4";

    const textMsg = 
      `╭─ 💎 ᴏᴡɴᴇʀ ɪɴꜰᴏ 💎 ─╮\n` +
      `│ 👤 ɴᴀᴍᴇ : AKASH AHMED\n` +
      `│ 🧬 ɴɪᴄᴋ : ফু্ঁল্ঁ ও্ঁয়া্ঁলা্ঁ\n` +
      `│ ⏳ ᴀɢᴇ : 𝟭𝟵+\n` +
      `│ 🎂 ᴅᴏʙ : 𝟬𝟴/𝟬𝟮/𝟮𝟬𝟬𝟳\n` +
      `│ 🕌 ʀᴇʟɪɢɪᴏɴ : 𝗜𝘀𝗹𝗮𝗺\n` +
      `│ 🇧🇩 ɴᴀᴛɪᴏɴᴀʟɪᴛʏ : 𝗕𝗮𝗻𝗴𝗹𝗮𝗱𝗲𝘀𝗵𝗶\n` +
      `│ 📚 ᴇᴅᴜᴄᴀᴛɪᴏɴ : 𝗜𝗻𝘁𝗲𝗿 𝟭𝘀𝘁 𝗬𝗲𝗮𝗿\n` +
      `│ 🏫 ᴜɴɪᴠᴇʀꜱɪᴛʏ : 𝗦𝗼𝗰𝗶𝗮𝗹 𝗠𝗲𝗱𝗶𝗮\n` +
      `│ 📍 ʟᴏᴄᴀᴛɪᴏɴ : 𝗞𝗵𝘂𝗹𝗻𝗮\n` +
      `├─ ✨ ʟɪꜰᴇꜱᴛʏʟᴇ ─╮\n` +
      `│ 🕹️ ɢᴀᴍᴇ : 𝗨𝗻𝗼 / 𝗙𝗿𝗲𝗲 𝗙𝗶𝗿𝗲\n` +
      `│ 🎧 ʜᴏʙʙʏ : 𝗠𝘂𝘀𝗶𝗰 / 𝗩𝗶𝗱𝗲𝗼 𝗚𝗮𝗺𝗲 / 𝗦𝗽𝗼𝗿𝘁\n` +
      `│ 🌙 ᴅʀᴇᴀᴍ : 𝗕𝗼𝘄/𝗚𝗙 = 𝗘𝘅𝘁𝗿𝗮𝗰𝘁 𝗞𝗼𝗿𝗮\n` +
      `│ 🎯 ɢᴏᴀʟ : 𝗕𝗼𝘄/𝗚𝗙 𝗲𝗿 𝗼𝗶𝗶𝘁𝗮𝗮\n` +
      `├─ 📞 ᴄᴏɴᴛᴀᴄᴛ ─╮\n` +
      `│ 📘 ꜰᴀᴄᴇʙᴏᴏᴋ : id=61590496500848\n` +
      `│ 📩 ᴍᴇꜱꜱᴇɴɢᴇʀ : id=61590496500848\n` +
      `│ 💚 ᴡʜᴀᴛꜱᴀᴘᴘ : 01410577478\n` +
      `│ 🤖 ʙᴏᴛ ɴᴀᴍᴇ : ⎯᪵⎯꯭̽𝐘o꯭u꯭r꯭ ̽𝐛꯭a꯭b꯭y𓆪꯭)꯭⟶᯦꯭🐱🍅🧃🥢\n` +
      `│ 📅 ʙᴏᴛ ꜱɪɴᴄᴇ : 𝟭𝟮/𝟬𝟳/𝟮𝟬𝟮𝟲\n` +
      `╰────────────────`;

    try {
      // GIF ডাউনলোড করা হচ্ছে
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const gifPath = path.join(cacheDir, `owner_gif_${Date.now()}.gif`);

      const response = await axios({
        method: "GET",
        url: gifUrl,
        responseType: "stream",
        timeout: 15000
      });

      const writer = fs.createWriteStream(gifPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // মেসেজ ও GIF পাঠানো
      return api.sendMessage({
        body: textMsg,
        attachment: fs.createReadStream(gifPath)
      }, threadID, () => {
        if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      }, messageID);

    } catch (error) {
      console.error("[OWNERINFO GIF ERROR]:", error.message);
      // GIF ডাউনলোড ফেইল করলে শুধু টেক্সট চলে যাবে
      return message.reply(textMsg);
    }
  }
};
