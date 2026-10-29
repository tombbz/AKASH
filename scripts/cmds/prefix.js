const fs = require("fs-extra");
const moment = require("moment-timezone");

const videoUrl = "https://files.catbox.moe/vd43nx.mp4";

const getRandomGif = () => gifList[Math.floor(Math.random() * gifList.length)];

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
        const getStream = global.utils.getStreamFromURL;

        if (!args[0]) {
            return this.showPrefixInfo({ event, message, threadsData });
        }

        const gif = getRandomGif();

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

        const confirmMsg = setGlobal
            ? getLang("confirmGlobal")
            : getLang("confirmThisThread");

        return message.reply({
            body: confirmMsg,
            attachment: await getStream(gif)
        }, (err, info) => {
            if (err) return;

            global.GoatBot.onReaction.set(info.messageID, {
                commandName,
                author: event.senderID,
                newPrefix,
                setGlobal
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
        const getStream = global.utils.getStreamFromURL;
        const gif = getRandomGif();

        const systemPrefix = global.GoatBot.config.prefix;
        const groupPrefix = (await global.utils.getPrefix(event.threadID)) || systemPrefix;

        const threadInfo = await threadsData.get(event.threadID);
        const groupName = threadInfo?.threadName || "Unknown Group";

        const time = moment().tz("Asia/Dhaka").format("hh:mm A");
        const date = moment().tz("Asia/Dhaka").format("DD MMM YYYY");

        return message.reply({
            body:
`╭━━━〔 🤖 CHATBOT PREFIX 〕━━━╮
│
│ 🏷️ Group  : ${groupName}
│ 🔰 System : 『 ${systemPrefix} 』
│ 💬 Group  : 『 ${groupPrefix} 』
│ ⏰ Time   : ${time}
│ 📅 Date   : ${date}
│ 👑 Owner  : AKASH AHMED 
│ ⚡ Status : ONLINE
│
╰━━━〔 ✨ Powered by AKASH AHMED 〕━━━╯`,
            attachment: await getVideo()
        });
    },

    onChat: async function ({ event, message, threadsData }) {
        if (!event.body || event.body.trim().toLowerCase() !== "prefix") return;
        return this.showPrefixInfo({ event, message, threadsData });
    }
};
