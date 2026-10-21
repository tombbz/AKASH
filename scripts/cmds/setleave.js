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
  console.error("[leave] Font register error:", e.message);
}

const HAS_BENGALI = /[\u0980-\u09FF]/;

function pickFont(text, size, weight = "bold") {
  if (HAS_BENGALI.test(text || "")) {
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
    ctx.fillStyle = "#1a2030";
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
  return str.length > max ? str.slice(0, max - 1) + "â€¦" : str;
}

async function createLeaveCard({
  memberID,
  memberName,
  groupName,
  groupIconUrl,
  memberCount,
  isKicked,
  adminID,
  adminName
}) {
  const W = 1080;
  const H = 720;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const [memberAvatar, groupIcon, adminAvatar] = await Promise.all([
    getAvatar(memberID, 1024),
    groupIconUrl ? loadImageFromUrl(groupIconUrl, 8000) : null,
    isKicked && adminID ? getAvatar(adminID, 512) : null
  ]);

  // ===== BG: left member pic blurred =====
  if (memberAvatar) {
    drawBlurredCover(ctx, memberAvatar, W, H, 14);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0a1018");
    grad.addColorStop(1, "#121a28");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Cool dark-blue overlay (goodbye mood)
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(8, 14, 28, 0.58)");
  overlay.addColorStop(0.4, "rgba(8, 14, 28, 0.48)");
  overlay.addColorStop(1, "rgba(8, 14, 28, 0.68)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ===== WATERMARK (very light, behind avatar) =====
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 72px "Montserrat", "Poppins", sans-serif';
  ctx.fillText("DI-ABLO JIsoo", W / 2, H / 2 - 10);
  ctx.globalAlpha = 0.08;
  ctx.font = 'bold 36px "Poppins", sans-serif';
  ctx.fillText("DI-ABLO JIsoo", W / 2, H / 2 + 48);
  ctx.restore();

  // Accent lines (slate / soft blue)
  const accent = ctx.createLinearGradient(0, 0, W, 0);
  accent.addColorStop(0, "rgba(96,165,250,0)");
  accent.addColorStop(0.5, "rgba(147,197,253,0.85)");
  accent.addColorStop(1, "rgba(96,165,250,0)");
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 3);
  ctx.fillRect(0, H - 3, W, 3);

  // ===== GROUP PIC (left) =====
  const gCx = 130;
  const gCy = H / 2 - 20;
  const gR = 78;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 20;
  drawCircularImage(ctx, groupIcon, gCx, gCy, gR);
  ctx.restore();
  drawCircleBorder(ctx, gCx, gCy, gR + 3, "rgba(255,255,255,0.85)", 4);
  drawCircleBorder(ctx, gCx, gCy, gR + 8, "rgba(147,197,253,0.5)", 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = pickFont(groupName || "Group", 20, "bold");
  ctx.fillText(truncate(groupName || "Group", 16), gCx, gCy + gR + 16);
  ctx.fillStyle = "rgba(186,230,253,0.9)";
  ctx.font = '600 16px "Poppins", sans-serif';
  ctx.fillText(`${memberCount} members`, gCx, gCy + gR + 42);

  // ===== KICKER / STATUS (top-right) =====
  if (isKicked && adminID) {
    const aCx = W - 120;
    const aCy = 110;
    const aR = 58;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 16;
    drawCircularImage(ctx, adminAvatar, aCx, aCy, aR);
    ctx.restore();
    drawCircleBorder(ctx, aCx, aCy, aR + 3, "rgba(255,255,255,0.9)", 3);
    drawCircleBorder(ctx, aCx, aCy, aR + 7, "rgba(248,113,113,0.65)", 2);

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(254,202,202,0.9)";
    ctx.font = '600 14px "Poppins", sans-serif';
    ctx.fillText("Removed by", aCx, aCy + aR + 12);
    ctx.fillStyle = "#ffffff";
    ctx.font = pickFont(adminName || "Admin", 18, "bold");
    ctx.fillText(truncate(adminName || "Admin", 14), aCx, aCy + aR + 32);
  } else {
    // Self leave badge top-right
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(186,230,253,0.85)";
    ctx.font = '600 18px "Poppins", sans-serif';
    ctx.fillText("Left the group", W - 48, 56);
  }

  // ===== GOODBYE TEXT =====
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.shadowColor = "rgba(147,197,253,0.5)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#e0f2fe";
  ctx.font = 'bold 52px "Montserrat", "Poppins", sans-serif';
  ctx.fillText(isKicked ? "REMOVED" : "GOODBYE", W / 2, 118);
  ctx.restore();

  ctx.fillStyle = "rgba(186,230,253,0.9)";
  ctx.font = '600 22px "Poppins", sans-serif';
  ctx.fillText(isKicked ? "from the group" : "we'll miss you", W / 2, 158);

  // ===== CENTER MEMBER AVATAR =====
  const mCx = W / 2;
  const mCy = H / 2 + 30;
  const mR = 120;

  ctx.save();
  ctx.shadowColor = isKicked ? "rgba(248,113,113,0.55)" : "rgba(147,197,253,0.55)";
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(mCx, mCy, mR + 10, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(224,242,254,0.95)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  drawCircularImage(ctx, memberAvatar, mCx, mCy, mR);
  drawCircleBorder(ctx, mCx, mCy, mR, "#ffffff", 5);
  drawCircleBorder(
    ctx,
    mCx,
    mCy,
    mR + 6,
    isKicked ? "rgba(248,113,113,0.7)" : "rgba(147,197,253,0.65)",
    2
  );

  // ===== NAME =====
  const displayName = memberName || "Member";
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ffffff";
  ctx.font = pickFont(displayName, 40, "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(truncate(displayName, 28), mCx, mCy + mR + 22);
  ctx.restore();

  ctx.fillStyle = "rgba(186,230,253,0.95)";
  ctx.font = '600 20px "Poppins", sans-serif';
  ctx.fillText(`${memberCount} members left`, mCx, mCy + mR + 72);

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const cardPath = path.join(cacheDir, `leave_${memberID}_${Date.now()}.png`);
  await fs.writeFile(cardPath, canvas.toBuffer("image/png"));
  return cardPath;
}

module.exports = {
  config: {
    name: "leave",
    version: "12.0.0",
    author: "DI-ABLO JIsoo",
    category: "events",
    description: "Leave/Kick card â€” member BG blur, bilingual names, kicker info"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID, logMessageData, author } = event;
    const leftID = logMessageData.leftParticipantFbId;
    if (!leftID) return;

    // Bot left â€” ignore
    if (String(leftID) === String(api.getCurrentUserID())) return;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "Group";
      const memberCount = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0;
      const groupIconUrl = threadInfo.imageSrc || null;

      let memberName = "Unknown";
      try {
        const userInfo = await api.getUserInfo(leftID);
        memberName = userInfo[leftID]?.name || "Unknown";
      } catch (_) {}

      const isKicked = !!(author && String(author) !== String(leftID));
      let adminName = "Admin";
      if (isKicked) {
        try {
          const adminInfo = await api.getUserInfo(author);
          adminName = adminInfo[author]?.name || "Admin";
        } catch (_) {}
      }

      const cardPath = await createLeaveCard({
        memberID: leftID,
        memberName,
        groupName: threadName,
        groupIconUrl,
        memberCount,
        isKicked,
        adminID: isKicked ? author : null,
        adminName
      });

      const bodyText = isKicked
        ? `ðŸš« ${memberName} was removed from ${threadName}.\nðŸ‘® Removed by: ${adminName}\nðŸ‘¥ ${memberCount} members left`
        : `ðŸ’” ${memberName} left ${threadName}.\nðŸ‘¥ ${memberCount} members left`;

      await api.sendMessage(
        {
          body: bodyText,
          attachment: fs.createReadStream(cardPath)
        },
        threadID,
        () => {
          try {
            if (fs.existsSync(cardPath)) fs.unlinkSync(cardPath);
          } catch (_) {}
        }
      );
    } catch (err) {
      console.error("Leave Error:", err);
    }
  }
};
