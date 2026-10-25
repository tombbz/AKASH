module.exports = {
  config: {
    name: "pending",
    version: "1.0",
    author: "S A I M",
    countDown: 5,
    role: 2,
    shortDescription: {
      vi: "",
      en: ""
    },
    longDescription: {
      vi: "",
      en: ""
    },
    category: "Admin"
  },

  langs: {
    en: {
      invaildNumber: "%1 is not a valid number",
      cancelSuccess: "Refused %1 thread!",
      approveSuccess: "Approved successfully %1 threads!",
      cantGetPendingList: "Can't get the pending list!",
      returnListPending: "»「PENDING」«❮ The number of threads to approve: %1 ❯\n\n%2",
      returnListClean: "「PENDING」There is no thread in the pending list"
    }
  },

  onReply: async function ({ api, event, Reply, getLang, commandName }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    const { body, threadID, messageID } = event;
    let count = 0;

    if ((isNaN(body) && body.indexOf("c") == 0) || body.indexOf("cancel") == 0) {
      const index = (body.slice(1)).split(/\s+/);
      for (const i of index) {
        if (isNaN(i) || i <= 0 || i > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", i), threadID, messageID);
        api.removeUserFromGroup(api.getCurrentUserID(), Reply.pending[i - 1].threadID);
        count++;
      }
      return api.sendMessage(getLang("cancelSuccess", count), threadID, messageID);
    } else {
      const index = body.split(/\s+/);
      for (const i of index) {
        if (isNaN(i) || i <= 0 || i > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", i), threadID, messageID);

        const targetThread = Reply.pending[i - 1].threadID;
        const threadInfo = await api.getThreadInfo(targetThread);
        const groupName = threadInfo.threadName || "Unnamed Group";
        const memberCount = threadInfo.participantIDs.length;
        const time = new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });

        api.sendMessage(
`╔═══🗪 𝙶𝚁𝙾𝚄𝙿 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳  🗪 ═══╗
┃
┃ 🏷️ 𝙽𝚊𝚖𝚎: ${groupName}
┃ 🆔 𝙶𝚛𝚘𝚞𝚙 𝙸𝙳: ${targetThread}
┃ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${memberCount}
┃ 🔒 𝙰𝚙𝚙𝚛𝚘𝚟𝚊𝚕 𝙼𝚘𝚍𝚎: ${threadInfo.approvalMode ? "On" : "Off"}
┃ 😊 𝙴𝚖𝚘𝚓𝚒: ${threadInfo.emoji || "None"}
┃ ⏰ 𝙹𝚘𝚒𝚗𝚎𝚍: ${time}
┃
╠══♛ 𝙾𝚆𝙽𝙴𝚁 𝙸𝙽𝙵𝙾  ♛══╣
┃ 🧑‍💻 𝙽𝚊𝚖𝚎:   ﴾ AKASH  ﴿‏
┃ 🌐 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺: 61590496500848
┃ 🗺️ 𝙲𝚘𝚞𝚗𝚝𝚛𝚢: Bangladesh
┃ ✅ 𝚂𝚝𝚊𝚝𝚞𝚜: Active
┃ 📞 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙: 01410577478
┃ ✉️ 𝙴𝚖𝚊𝚒𝚕: wwwakash.khan538@gmail.com
┃ 🧵 𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖: T.ME/AKASH-120
┃ 💡 𝚃𝚒𝚙: Type #help to see all commands!
╚════════════════════╝`, targetThread);

        count++;
      }
      return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
    }
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID } = event;
    let msg = "", index = 1;

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

      for (const item of list) msg += `${index++}/ ${item.name} (${item.threadID})\n`;

      if (list.length != 0) {
        return api.sendMessage(getLang("returnListPending", list.length, msg), threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        }, messageID);
      } else return api.sendMessage(getLang("returnListClean"), threadID, messageID);

    } catch (e) {
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  }
};
