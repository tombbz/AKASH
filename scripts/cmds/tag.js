module.exports = {
  config: {
    name: "tag",
    aliases: ["tagall"],
    category: 'box chat',
    role: 0,
    author: 'dipto | Anik Islam Sadik',
    countDown: 3,
    description: { en: 'Tags a user to the provided name, message reply, or tags everyone.' },
    guide: {
      en: `1. Reply to a message\n2. Use {pm}tag [name]\n3. Use {pm}tag [name] [message]\n4. Use {pm}tagall [message] or {pm}tag all [message]`
    },
  },
  onStart: async ({ api, event, usersData, threadsData, args }) => {
    const { threadID, messageID, messageReply } = event;
    try {
      const d = await threadsData.get(threadID);
      const combined = d.members.map(gud => ({
        Name: gud.name,
        UserId: gud.userID
      }));

      let namesToTag = [];
      let extraMessage = "";
      let targetMessageID = messageID;

      const commandNameUsed = event.body?.trim().split(' ')[0].toLowerCase();
      const isTagAll = commandNameUsed?.endsWith('all') || args[0]?.toLowerCase() === 'all';

      if (isTagAll) {
        if (args[0]?.toLowerCase() === 'all') {
          extraMessage = args.slice(1).join(' ').trim();
        } else {
          extraMessage = args.join(' ').trim();
        }
        namesToTag = combined;
      } else if (messageReply) {
        targetMessageID = messageReply.messageID;
        const uid = messageReply.senderID;
        const name = await usersData.getName(uid);
        namesToTag.push({ Name: name, UserId: uid });
        extraMessage = args.join(' ');
      } else {
        if (args.length === 0) {
          return api.sendMessage('❌ Format: tag [name] or tag [name] [message] | tagall [message]', threadID, messageID);
        }

        const input = args.join(' ');
        let searchName = "";
        
        if (input.includes('|')) {
          const parts = input.split('|');
          searchName = parts[0].trim().toLowerCase();
          extraMessage = parts.slice(1).join('|').trim();
        } else {
          searchName = args[0].toLowerCase();
          extraMessage = args.slice(1).join(' ').trim();
        }

        namesToTag = combined.filter(member =>
          member.Name.toLowerCase().includes(searchName)
        );

        if (namesToTag.length === 0) {
          return api.sendMessage('❌ User not found!', threadID, messageID);
        }
      }

      const mentions = [];
      const bodyParts = [];

      namesToTag.forEach(({ Name, UserId }) => {
        const taggedName = `@${Name}`;
        bodyParts.push(taggedName);
        mentions.push({
          tag: taggedName,
          id: UserId
        });
      });

      const bodyText = bodyParts.join(' ');
      let finalBody = bodyText;

      if (isTagAll) {
        const STYLE_HEADER = "✨ 𝑨𝒕𝒕𝒆𝒏𝒕𝒊𝒐𝒏 𝑷𝒍𝒆𝒂𝒔𝒆 ✨\n✧･ﾟ: *✧･ﾟ:* 　　*:･ﾟ✧*:･ﾟ✧";
        const STYLE_LINE = "❁ ────── ❀ ────── ❁";
        
        finalBody = `${STYLE_HEADER}\n${STYLE_LINE}\n`;
        if (extraMessage) {
          finalBody += `${extraMessage}\n${STYLE_LINE}\n`;
        }
        finalBody += bodyText;
      } else {
        finalBody = extraMessage ? `${bodyText} - ${extraMessage}` : bodyText;
      }

name:
      return api.sendMessage({
        body: finalBody,
        mentions
      }, threadID, targetMessageID);

    } catch (e) {
      return api.sendMessage(e.message, threadID, messageID);
    }
  }
};
