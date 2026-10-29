const fs = require("fs-extra");
const moment = require("moment-timezone");
const axios = require("axios");
const path = require("path");

const videoUrl = "https://files.catbox.moe/vd43nx.mp4";

const getVideo = async () => {
  const videoPath = path.join(__dirname, "cache", "prefix.mp4");
  const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
  await fs.writeFile(videoPath, response.data);
  return fs.createReadStream(videoPath);
};

module.exports = {
  config: {
    name: "prefix",
    version: "2.4.2",
    author: "APON",
    countDown: 3,
    role: 0,
    shortDescription: { en: "Change & show bot prefix" },
    longDescription: { en: "View current system/group prefix or request to change it." },
    category: "system",
    guide: { en: "{pn}\n{pn} <newPrefix>\n{pn} reset\n{pn} <newPrefix> -g" }
  },

  langs: {
    en: {
      usage: "❌ Usage:\n• {pn} <newPrefix> (Change group prefix)\n• {pn} <newPrefix> -g (Change global prefix)\n• {pn} reset (Reset group prefix)",
      reset: "✅ Group prefix reset successful!\n🔰 System prefix: %1",
      onlyAdmin: "⛔ Only bot admins can change the global prefix.",
      confirmGlobal: "⚙️ Global prefix change requested.\n👉 React to this message with any emoji to confirm.",
      confirmThisThread: "🛠️ Group prefix change requested.\n👉 React to this message with any emoji to confirm.",
      successGlobal: "✅ Global prefix successfully changed!\n🆕 New global prefix: %1",
      successThisThread: "✅ Group prefix successfully changed!\n🆕 New group prefix: %1"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    if (!args[0]) {
      return this.showPrefixInfo({ event, message, threadsData });
    }

    // 1. Reset Prefix
    if (args[0].toLowerCase() === 'reset') {
      await threadsData.set(event.threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.GoatBot.config.prefix));
    }

    // 2. Set New Prefix
    const newPrefix = args[0];
    const setGlobal = args[1] === "-g";
    if (setGlobal && role < 2) {
      return message.reply(getLang("onlyAdmin"));
    }
    const confirmMsg = setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");
    return message.reply({ 
      body: confirmMsg, 
      attachment: await getVideo() 
    }, (err, info) => {
      if (err) return;
      global.GoatBot.onReaction.set(info.messageID, {
        commandName, author: event.senderID, newPrefix, setGlobal
      });
    });
  },

  onReaction: async function ({ event, message, threadsData, Reaction, getLang }) {
    if (event.userID !== Reaction.author) return;
    global.GoatBot.onReaction.delete(event.messageID);
    if (Reaction.setGlobal) {
      global.GoatBot.config.prefix = Reaction.newPrefix;
      fs.writeFileSync(
        global.client.dirConfig,
        JSON.stringify(global.GoatBot.config, null, 2)
      );
      return message.reply(getLang("successGlobal", Reaction.newPrefix));
    }
    await threadsData.set(event.threadID, Reaction.newPrefix, "data.prefix");
    return message.reply(getLang("successThisThread", Reaction.newPrefix));
  },

  showPrefixInfo: async function ({ event, message, threadsData }) {
    const systemPrefix = global.GoatBot.config.prefix;
    const groupPrefix = (await global.utils.getPrefix(event.threadID)) || systemPrefix;
    const threadInfo = await threadsData.get(event.threadID);
    const groupName = threadInfo?.threadName || "Unknown Group";
    const time = moment().tz("Asia/Dhaka").format("hh:mm A");
    const date = moment().tz("Asia/Dhaka").format("DD MMM YYYY");

    return message.reply({
      body: `╭━━━〔 🤖 CHATBOT PREFIX 〕━━━╮
│
│ 🏷️ Group : ${groupName}
│ 🔰 System : 『 ${systemPrefix} 』
│ 💬 Group : 『 ${groupPrefix} 』
│ ⏰ Time : ${time}
│ 📅 Date : ${date}
│ 👑 Owner : AKASH AHMED
│ ⚡ Status : ONLINE
│
╰━━━〔 ✨ Powered by AKASH AHMED 〕━━━╯`,
      attachment: await getVideo()
    });
  },

  
