const cooldowns = {};

module.exports = {
  config: {
    name: "autosticker",
    aliases: ["sticker"],
    version: "5.8",
    author: "Anik Islam Sadik",
    countDown: 5,
    role: 0,
    description: "Send a random sticker with cooldown. Reply-stickers are ignored.",
    category: "media",
    guide: ""
  },

  run: async function ({ message, event, args }) {
    const stickerList = [
      "1237286490812351", "456542403422205", "456544143422031", "456545143421931",
      "392309937532985", "392309834199662", "392309624199683", "1356375286201630",
      "1237285187479148", "1237285867479080", "1356370689535423", "1356407482865077",
      "840417168322612", "840424478321881", "840349011662761", "1350643753441450",
      "1237286070812393", "840426104988385", "2041020049458802", "392309990866313",
      "392309890866323", "1350645153441310", "456536873422758", "2041014432792697",
      "1747082948936290", "2041017422792398", "456541416755637", "1747092188935366",
      "1350636100108882", "2041011389459668"
    ];

    const query = args[0]?.toLowerCase();

    if (query === "listall") {
      let msg = "All Sticker IDs:\n\n";
      stickerList.forEach((id, i) => msg += `${i + 1}. ${id}\n`);
      msg += `\nTotal: ${stickerList.length}`;
      return message.reply(msg);
    }

    let msg = `Autosticker Menu\n\nTotal Stickers: ${stickerList.length}\nType 'autosticker listall' or 'sticker listall' to see all IDs.`;
    return message.reply(msg);
  },

  onChat: async function ({ message, event, api }) {
    const { attachments, body, senderID, messageReply } = event;

    const stickerList = [
      "1237286490812351", "456542403422205", "456544143422031", "456545143421931",
      "392309937532985", "392309834199662", "392309624199683", "1356375286201630",
      "1237285187479148", "1237285867479080", "1356370689535423", "1356407482865077",
      "840417168322612", "840424478321881", "840349011662761", "1350643753441450",
      "1237286070812393", "840426104988385", "2041020049458802", "392309990866313",
      "392309890866323", "1350645153441310", "456536873422758", "2041014432792697",
      "1747082948936290", "2041017422792398", "456541416755637", "1747092188935366",
      "1350636100108882", "2041011389459668"
    ];

    if (senderID === api.getCurrentUserID()) return;

    const content = body?.toLowerCase().trim() || "";
    const cleanContent = content.replace(/^[!#./\\-]/, "").trim();

    if (cleanContent === "autosticker list" || cleanContent === "sticker list") {
      let msg = `Autosticker Menu\n\nTotal Stickers: ${stickerList.length}\nType 'autosticker listall' or 'sticker listall' to see all IDs.`;
      return message.reply(msg);
    }

    if (cleanContent === "autosticker listall" || cleanContent === "sticker listall") {
      let msg = "All Sticker IDs:\n\n";
      stickerList.forEach((id, i) => msg += `${i + 1}. ${id}\n`);
      msg += `\nTotal: ${stickerList.length}`;
      return message.reply(msg);
    }

    const isSticker = attachments?.some(a => a.type === "sticker");
    if (!isSticker) return;

    if (messageReply) return;

    const now = Date.now();
    if (cooldowns[senderID] && now - cooldowns[senderID] < 5000) return;
    cooldowns[senderID] = now;

    const randomSticker = stickerList[Math.floor(Math.random() * stickerList.length)];
    return message.reply({ sticker: randomSticker });
  },

  onStart: async function () {}
};
