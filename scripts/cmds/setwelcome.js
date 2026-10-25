const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const FONT_DIR = path.join(__dirname, "../cmds/assets/font");
try {
  registerFont(path.join(FONT_DIR, "NotoSansBengali-Bold.ttf"), { family: "NotoBengali", weight: "bold" });
  registerFont(path.join(FONT_DIR, "NotoSansBengali-Regular.ttf"), { family: "NotoBengali", weight: "normal" });
  registerFont(path.join(FONT_DIR, "Poppins-Bold.ttf"), { family: "Poppins", weight: "bold" });
  registerFont(path.join(FONT_DIR, "Poppins-SemiBold.ttf"), { family: "Poppins", weight: "600" });
  registerFont(path.join(FONT_DIR, "Montserrat-Bold.ttf"), { family: "Montserrat", weight: "bold" });
} catch (e) {
  console.error("[welcome] Font register error:", e.message);
}

const HAS_BENGALI = /[\u0980-\u09FF]/;

function pickFont(text, size, weight = "bold") {
  if (HAS_BENGALI.test(text)) {
    return `${weight} ${size}px "NotoBengali", "Poppins", sans-serif`;
  }
  return `${weight} ${size}px "Poppins", "Montserrat", sans-serif`;
}

async function loadImageFromUrl(url, timeout = 10000) {
  if (!url) return null;
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout,
      maxRedirects: 5,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*,*/*;q=0.8" }
    });
    if (!res.data || res.data.byteLength < 200) return null;
    return await loadImage(Buffer.from(res.data));
  } catch (e) {
    return null;
  }
}

async function getAvatar(uid, size = 720) {
  if (!uid) return null;
  const urls = [
    `https://graph.facebook.com/${uid}/picture?width=${size}&height=${size}&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
    `https://graph.facebook.com/${uid}/picture?width=${size}&height=${size}`,
    `https://graph.facebook.com/${uid}/picture?type=large`
  ];
  for (const url of urls) {
    const img = await loadImageFromUrl(url, 8000);
    if (img) return img;
  }
  return null;
}

function coverDraw(ctx, img, x, y, w, h) {
  if (!img) return;
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawBlurredCover(ctx, img, w, h, blurStrength = 12) {
  if (!img) return;
  const sw = Math.max(8, Math.floor(w / blurStrength));
  const sh = Math.max(8, Math.floor(h / blurStrength));
  const tmp = createCanvas(sw, sh);
  const tctx = tmp.getContext("2d");
  coverDraw(tctx, img, 0, 0, sw, sh);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
  ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
}

function drawCircularImage(ctx, img, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img) {
    const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = "#2a1a3a";
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }
  ctx.restore();
}

function drawCircleBorder(ctx, cx, cy, radius, color, lineWidth) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

async function createWelcomeCard({
  memberID,
  memberName,
  groupName,
  groupIconUrl,
  memberCount,
  adderID,
  adderName,
  isSelfJoin
}) {
  const W = 1080;
  const H = 720;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const [memberAvatar, groupIcon, adderAvatar] = await Promise.all([
    getAvatar(memberID, 1024),
    groupIconUrl ? loadImageFromUrl(groupIconUrl, 8000) : null,
    !isSelfJoin && adderID ? getAvatar(adderID, 512) : null
  ]);

  if (memberAvatar) {
    drawBlurredCover(ctx, memberAvatar, W, H, 14);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#12081c");
    grad.addColorStop(1, "#1a0f2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(10, 6, 20, 0.55)");
  overlay.addColorStop(0.4, "rgba(10, 6, 20, 0.45)");
  overlay.addColorStop(1, "rgba(10, 6, 20, 0.65)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 72px "Montserrat", "Poppins", sans-serif';
  ctx.fillText("BADHON-00", W / 2, H / 2 - 10);
  ctx.globalAlpha = 0.08;
  ctx.font = 'bold 36px "Poppins", sans-serif';
  ctx.fillText("DI-ABLO         JI-SOO", W / 2, H / 2 + 48);
  ctx.restore();

  const accent = ctx.createLinearGradient(0, 0, W, 0);
  accent.addColorStop(0, "rgba(168,85,247,0)");
  accent.addColorStop(0.5, "rgba(192,132,252,0.9)");
  accent.addColorStop(1, "rgba(168,85,247,0)");
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 3);
  ctx.fillRect(0, H - 3, W, 3);

  const gCx = 130;
  const gCy = H / 2 - 20;
  const gR = 78;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 20;
  drawCircularImage(ctx, groupIcon, gCx, gCy, gR);
  ctx.restore();
  drawCircleBorder(ctx, gCx, gCy, gR + 3, "rgba(255,255,255,0.85)", 4);
  drawCircleBorder(ctx, gCx, gCy, gR + 8, "rgba(192,132,252,0.5)", 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = pickFont(groupName || "Group", 20, "bold");
  ctx.fillText(truncate(groupName || "Group", 16), gCx, gCy + gR + 16);
  ctx.fillStyle = "rgba(216,180,254,0.9)";
  ctx.font = '600 16px "Poppins", sans-serif';
  ctx.fillText(`${memberCount} members`, gCx, gCy + gR + 42);

  if (!isSelfJoin && adderID) {
    const aCx = W - 120;
    const aCy = 110;
    const aR = 58;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 16;
    drawCircularImage(ctx, adderAvatar, aCx, aCy, aR);
    ctx.restore();
    drawCircleBorder(ctx, aCx, aCy, aR + 3, "rgba(255,255,255,0.9)", 3);
    drawCircleBorder(ctx, aCx, aCy, aR + 7, "rgba(168,85,247,0.55)", 2);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(216,180,254,0.85)";
    ctx.font = '600 14px "Poppins", sans-serif';
    ctx.fillText("Added by", aCx, aCy + aR + 12);
    ctx.fillStyle = "#ffffff";
    ctx.font = pickFont(adderName || "Someone", 18, "bold");
    ctx.fillText(truncate(adderName || "Someone", 14), aCx, aCy + aR + 32);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.shadowColor = "rgba(192,132,252,0.55)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#f5e9ff";
  ctx.font = 'bold 52px "Montserrat", "Poppins", sans-serif';
  ctx.fillText("WELCOME", W / 2, 118);
  ctx.restore();

  ctx.fillStyle = "rgba(233,213,255,0.9)";
  ctx.font = '600 22px "Poppins", sans-serif';
  ctx.fillText("to the group", W / 2, 158);

  const mCx = W / 2;
  const mCy = H / 2 + 30;
  const mR = 120;

  ctx.save();
  ctx.shadowColor = "rgba(192,132,252,0.7)";
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(mCx, mCy, mR + 10, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(245,233,255,0.95)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  drawCircularImage(ctx, memberAvatar, mCx, mCy, mR);
  drawCircleBorder(ctx, mCx, mCy, mR, "#ffffff", 5);
  drawCircleBorder(ctx, mCx, mCy, mR + 6, "rgba(192,132,252,0.65)", 2);

  const displayName = memberName || "New Member";
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ffffff";
  ctx.font = pickFont(displayName, 40, "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(truncate(displayName, 28), mCx, mCy + mR + 22);
  ctx.restore();

  ctx.fillStyle = "rgba(216,180,254,0.95)";
  ctx.font = '600 20px "Poppins", sans-serif';
  ctx.fillText(`Member #${memberCount}`, mCx, mCy + mR + 72);

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const cardPath = path.join(cacheDir, `welcome_${memberID}_${Date.now()}.png`);
  await fs.writeFile(cardPath, canvas.toBuffer("image/png"));
  return cardPath;
}

module.exports = {
  config: {
    name: "welcome",
    version: "12.0.0",
    author: "AKASH",
    category: "events",
    description: "Welcome card — member BG blur, bilingual names, group/adder pics"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData, author } = event;
    const addedParticipants = logMessageData.addedParticipants || [];
    const botID = api.getCurrentUserID();

    const botJoined = addedParticipants.some((p) => String(p.userFbId) === String(botID));
    if (botJoined) {
      let prefix = "zx";
      try {
        if (global.utils && typeof global.utils.getPrefix === "function") {
          prefix = global.utils.getPrefix(threadID) || prefix;
        } else if (global.GoatBot?.config?.prefix) {
          prefix = global.GoatBot.config.prefix;
        }
      } catch (_) {}

      return api.sendMessage(
        "✅ DIABLO JIoo connected!\n\n" +
          "📌 Prefix: " +
          prefix +
          "\n\n" +
          "📖 Quick Guide:\n" +
          "• " +
          prefix +
          "help — all commands\n" +
          "• " +
          prefix +
          "info — your info\n" +
          "• " +
          prefix +
          "ping — bot status\n\n" +
          "Enjoy the realm ✨",
        threadID
      );
    }

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "Group";
      const memberCount = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0;
      const groupIconUrl = threadInfo.imageSrc || null;

      let adderName = "Unknown";
      if (author) {
        try {
          const adderInfo = await api.getUserInfo(author);
          adderName = adderInfo[author]?.name || "Unknown";
        } catch (_) {}
      }

      for (const user of addedParticipants) {
        const userID = user.userFbId;
        if (String(userID) === String(botID)) continue;

        const userName = user.fullName || "New Member";
        const isSelfJoin = !author || String(author) === String(userID);

        let cardPath;
        try {
          cardPath = await createWelcomeCard({
            memberID: userID,
            memberName: userName,
            groupName: threadName,
            groupIconUrl,
            memberCount,
            adderID: isSelfJoin ? null : author,
            adderName: isSelfJoin ? "Self Join" : adderName,
            isSelfJoin
          });
        } catch (e) {
          console.error("Welcome card error:", e);
          continue;
        }

        const body =
          `✨ ${userName} — Welcome!\n` +
          `📍 ${threadName}\n` +
          `👥 Member #${memberCount}` +
          (isSelfJoin ? "" : `\n➕ Added by ${adderName}`);

        await api.sendMessage(
          {
            body,
            attachment: fs.createReadStream(cardPath)
          },
          threadID,
          () => {
            try {
              if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath);
            } catch (_) {}
          }
        );
      }
    } catch (err) {
      console.error("Welcome Error:", err);
    }
  }
};
