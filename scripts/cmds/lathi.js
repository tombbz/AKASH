const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const TEMPLATE = "https://i.ibb.co/d4t3zFX1/9ecb1f5f3a79.jpg";

const SLOTS = {
  male: {
    sender: { x: 177, y: 78, size: 90 },
    target: { x: 430, y: 172, size: 90 }
  },
  female: {
    sender: { x: 177, y: 78, size: 90 },
    target: { x: 430, y: 172, size: 90 }
  }
};

const FALLBACK_AVATAR = uid =>
  `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

function react(api, emoji, messageID) {
  return new Promise(resolve => {
    try {
      api.setMessageReaction(emoji, messageID, () => resolve(), true);
    } catch (e) {
      resolve();
    }
  });
}

async function getBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
  return Buffer.from(res.data);
}

async function loadAvatar(uid, usersData) {
  let url;
  try {
    url = await usersData.getAvatarUrl(uid);
  } catch (e) {
    url = FALLBACK_AVATAR(uid);
  }
  let buffer;
  try {
    buffer = await getBuffer(url);
  } catch (e) {
    buffer = await getBuffer(FALLBACK_AVATAR(uid));
  }
  return loadImage(buffer);
}

function resolveTarget(event, args) {
  const mentionIds = Object.keys(event.mentions || {});
  if (mentionIds.length > 0) return mentionIds[0];

  if (event.messageReply && event.messageReply.senderID) {
    return event.messageReply.senderID;
  }

  const idArg = args.find(a => /^\d{6,}$/.test(String(a)));
  if (idArg) return String(idArg);

  return event.senderID;
}

function drawCircle(ctx, img, slot) {
  const cx = slot.x + slot.size / 2;
  const cy = slot.y + slot.size / 2;
  const r = slot.size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, slot.x, slot.y, slot.size, slot.size);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
}

module.exports = {
  config: {
    name: "lathi",
    version: "2.2",
    author: "Anik Islam Sadik",
    countDown: 5,
    role: 0,
    category: "fun"
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    const senderID = event.senderID;
    const targetID = resolveTarget(event, args);
    const outPath = path.join(cacheDir, `lathi_${targetID}_${Date.now()}.png`);

    await react(api, "⏳", event.messageID);

    try {
      let gender = null;
      const lowered = args.map(a => String(a).toLowerCase());
      if (lowered.includes("male")) gender = "male";
      else if (lowered.includes("female")) gender = "female";

      if (!gender) {
        try {
          const info = await api.getUserInfo(targetID);
          gender = info[targetID] && info[targetID].gender === 1 ? "female" : "male";
        } catch (e) {
          gender = "male";
        }
      }

      const slots = SLOTS[gender];

      const [template, senderAvatar, targetAvatar] = await Promise.all([
        getBuffer(TEMPLATE).then(loadImage),
        loadAvatar(senderID, usersData),
        loadAvatar(targetID, usersData)
      ]);

      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

      drawCircle(ctx, senderAvatar, slots.sender);
      drawCircle(ctx, targetAvatar, slots.target);

      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      await message.reply({ attachment: fs.createReadStream(outPath) });
      await react(api, "✅", event.messageID);
    } catch (err) {
      console.error(err);
      await react(api, "❌", event.messageID);
    } finally {
      setTimeout(() => fs.remove(outPath).catch(() => {}), 10000);
    }
  }
};
