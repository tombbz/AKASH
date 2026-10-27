// ============================================================
// MYINFO — Shah Protik's Premium Profile Card
// Theme: Cosmic Premium (not hacker)
// Author: Shah Protik
// ============================================================

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gif-encoder-2");

// ============================================================
// PROFILE DATA
// ============================================================
const PROFILE = {
"╭─ 👑 Oᴡɴᴇʀ Iɴғᴏ 👑 ─╮",
"│ 👤 Nᴀᴍᴇ : ꪖᴋꪖꪶʜ ꪖʜᴍᴇᴅ",
"│ 🦋 Nɪᴄᴋ : ফু্ঁল্‌ঁ ও্ঁয়া্ঁলা্ঁ",
"│ 🎂 Aɢᴇ : 𝟭𝟵+ ",
"│ 💘 Rᴇʟᴀᴛɪᴏɴ : 𝗦𝗶𝗻𝗴𝗹𝗲",
"│ 🎓 Pʀᴏғᴇssɪᴏɴ : 𝗦𝘁𝘂𝗱𝗲𝗻𝘁 ",
"│ 📚 Eᴅᴜᴄᴀᴛɪᴏɴ : 𝗜𝗻𝘁𝗲𝗿 𝟭𝘀𝘁 𝗬𝗲𝗮𝗿",
"│ 🏡 Lᴏᴄᴀᴛɪᴏɴ : 𝗞𝗵𝘂𝗹𝗻𝗮",
"├─ 🔗 Cᴏɴᴛᴀᴄᴛ ─╮",
"│ 📘 Facebook : id=61590496500848",
"│ 💬 Messenger: id=61590496500848",
"│ 📞 WhatsApp : 01410577478",
"╰────────────────",
  il.cl.coschoolhooAl ",
  college: "Chayer Dokan",
  university: "Social Media",
  class: "Class 10 (Ended)",favColorolor: "Green & White",
  favFood: "Biryani & Fast Food",
  favDrink: "Mojo",
  favAnime: "Rimuru / AOT",
  favMovie: "Lucifer",
  favSinger: "Muza / SNX",
  favSports: "UNO / Free Fire",
  hobby: "Music / Games",

  motto: "Code. Break. Fix. Repeat.",
  dream: "Legendary Bot Developer",
  goal: "Best AI Bot in BD",

  botName: "DI-ABLO-JI-SOO",
  botSince: "12/07/2026",
  botRole: "Owner & Developer"
};

// ============================================================
// 🎨 NEW COSMIC THEME COLORS
// ============================================================
const BG_TOP = "#0a0e27";       // Deep navy
const BG_BOTTOM = "#1a0b2e";    // Deep purple
const GOLD = "#ffd700";
const GOLD_SOFT = "rgba(255, 215, 0, 0.75)";
const CYAN = "#00e5ff";
const CYAN_SOFT = "rgba(0, 229, 255, 0.75)";
const PURPLE = "#b794f6";
const PINK = "#f687b3";
const MINT = "#68d391";
const WHITE = "#ffffff";
const WHITE_SOFT = "rgba(255, 255, 255, 0.85)";
const LABEL_COLOR = "rgba(183, 148, 246, 0.75)";

// ============================================================
// GIF CONFIG
// ============================================================
const GIF_W = 1200;
const GIF_H = 1780;
const FRAME_COUNT = 6;
const FRAME_DELAY = 160;
const GIF_QUALITY = 12;

// ============================================================
// AVATAR FETCH
// ============================================================
async function fetchAvatar(uid) {
  const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
  const enc = encodeURIComponent(token);
  const urls = [
    `https://graph.facebook.com/${uid}/picture?width=500&height=500&access_token=${enc}`,
    `https://graph.facebook.com/${uid}/picture?type=large`
  ];
  for (const u of urls) {
    try {
      const res = await axios.get(u, { responseType: "arraybuffer", timeout: 10000 });
      return await loadImage(Buffer.from(res.data));
    } catch (e) { continue; }
  }
  return null;
}

// ============================================================
// BACKGROUND — Cosmic gradient + stars
// ============================================================
function drawBackground(ctx, w, h, phase) {
  // Vertical gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, BG_TOP);
  grad.addColorStop(0.5, "#150a30");
  grad.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Radial glow center top
  const glow = ctx.createRadialGradient(w / 2, 200, 50, w / 2, 200, 700);
  glow.addColorStop(0, "rgba(183, 148, 246, 0.15)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Twinkling stars
  ctx.save();
  const offset = Math.floor(phase * 20);
  for (let i = 0; i < 120; i++) {
    const x = (i * 137 + offset * 2) % w;
    const y = (i * 89 + offset) % h;
    const size = (i % 3) + 0.5;
    const alpha = 0.15 + ((i + offset) % 7) * 0.08;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Subtle shooting star (per frame position)
  const shootX = (phase * 2 * w) % (w + 400) - 200;
  const shootY = 100 + phase * 400;
  ctx.save();
  const shootGrad = ctx.createLinearGradient(shootX - 100, shootY - 30, shootX, shootY);
  shootGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  shootGrad.addColorStop(1, "rgba(255, 255, 255, 0.6)");
  ctx.strokeStyle = shootGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(shootX - 100, shootY - 30);
  ctx.lineTo(shootX, shootY);
  ctx.stroke();
  ctx.restore();
}

// ============================================================
// ELEGANT PANEL — thin border, soft glow
// ============================================================
function drawPanel(ctx, x, y, w, h, accentColor) {
  const r = 12; // corner radius

  // Panel background
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "rgba(15, 10, 40, 0.75)");
  grad.addColorStop(1, "rgba(30, 15, 55, 0.75)");
  
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = grad;
  ctx.fill();

  // Border with soft glow
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.8;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();

  // Top accent line (gradient)
  ctx.save();
  const topGrad = ctx.createLinearGradient(x, y, x + w, y);
  topGrad.addColorStop(0, "rgba(255,255,255,0)");
  topGrad.addColorStop(0.5, accentColor);
  topGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(x + 30, y, w - 60, 2);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================================
// PANEL HEADER — icon + title
// ============================================================
function drawPanelHeader(ctx, x, y, icon, title, color) {
  ctx.save();
  ctx.font = "bold 24px monospace";
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillText(`${icon}  ${title}`, x, y);
  ctx.restore();
}

// ============================================================
// STAT ROW — BIG font
// ============================================================
function drawStatRow(ctx, x, y, label, value, valueColor, labelW) {
  const lw = labelW || 220;

  // Label
  ctx.save();
  ctx.font = "bold 22px monospace";
  ctx.fillStyle = LABEL_COLOR;
  ctx.fillText(`▸ ${label}`, x, y);

  // Value
  ctx.font = "bold 24px monospace";
  ctx.fillStyle = valueColor || WHITE;
  ctx.shadowColor = valueColor || WHITE;
  ctx.shadowBlur = 6;
  ctx.fillText(String(value), x + lw, y);
  ctx.restore();
}

// ============================================================
// RENDER FRAME
// ============================================================
function renderFrame(ctx, data, phase) {
  const w = GIF_W;
  const h = GIF_H;
  const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);

  // Background
  drawBackground(ctx, w, h, phase);

  // ============================================================
  // TOP HEADER
  // ============================================================
  // Small label top
  ctx.save();
  ctx.font = "bold 18px monospace";
  ctx.fillStyle = PINK;
  ctx.textAlign = "center";
  ctx.fillText("◆ PREMIUM PROFILE ◆", w / 2, 45);
  ctx.textAlign = "left";
  ctx.restore();

  // Divider line
  const lineGrad = ctx.createLinearGradient(0, 60, w, 60);
  lineGrad.addColorStop(0, "rgba(182, 148, 246, 0)");
  lineGrad.addColorStop(0.5, PURPLE);
  lineGrad.addColorStop(1, "rgba(182, 148, 246, 0)");
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, 58, w, 1.5);

  // ============================================================
  // AVATAR + NAME SECTION
  // ============================================================
  const avSize = 160;
  const avCX = 160; // center X
  const avCY = 180; // center Y

  if (data.avatarImage) {
    // Outer glow ring
    ctx.save();
    const ringGrad = ctx.createLinearGradient(avCX - avSize / 2, avCY - avSize / 2, avCX + avSize / 2, avCY + avSize / 2);
    ringGrad.addColorStop(0, GOLD);
    ringGrad.addColorStop(0.5, PINK);
    ringGrad.addColorStop(1, CYAN);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 5;
    ctx.shadowColor = PURPLE;
    ctx.shadowBlur = 20 + pulse * 10;
    ctx.beginPath();
    ctx.arc(avCX, avCY, avSize / 2 + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Circular avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avCX, avCY, avSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      data.avatarImage,
      avCX - avSize / 2,
      avCY - avSize / 2,
      avSize,
      avSize
    );
    ctx.restore();

    // Inner thin white border
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(avCX, avCY, avSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Online dot
    ctx.save();
    ctx.fillStyle = MINT;
    ctx.shadowColor = MINT;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(avCX + avSize / 2 - 10, avCY + avSize / 2 - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "#0a0e27";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(avCX + avSize / 2 - 10, avCY + avSize / 2 - 10, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Name block (right of avatar)
  const nameX = avCX + avSize / 2 + 50;

  // Real name — BIG
  ctx.save();
  ctx.font = "bold 46px monospace";
  ctx.fillStyle = GOLD;
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 20 + pulse * 8;
  ctx.fillText(data.realName.toUpperCase(), nameX, avCY - 35);
  ctx.restore();

  // Nickname
  ctx.save();
  ctx.font = "bold 32px monospace";
  ctx.fillStyle = CYAN;
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 12;
  ctx.fillText(`"${data.nickname}"`, nameX, avCY + 10);
  ctx.restore();

  // Tagline
  ctx.save();
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = PINK;
  ctx.shadowColor = PINK;
  ctx.shadowBlur = 10;
  ctx.fillText(`✦ ${data.tagline}`, nameX, avCY + 48);
  ctx.restore();

  // Status line
  ctx.save();
  ctx.font = "bold 18px monospace";
  ctx.fillStyle = MINT;
  ctx.fillText("● ONLINE", nameX, avCY + 78);
  ctx.restore();

  // ============================================================
  // SECTION 1: IDENTITY + CONTACT
  // ============================================================
  const s1Y = 320;
  const s1H = 380;
  const panelW = 540;
  const leftX = 60;
  const rightX = 620;

  // IDENTITY
  drawPanel(ctx, leftX, s1Y, panelW, s1H, GOLD);
  drawPanelHeader(ctx, leftX + 25, s1Y + 42, "👤", "IDENTITY", GOLD);

  const rowStart = s1Y + 95;
  const rowGap = 42;
  drawStatRow(ctx, leftX + 30, rowStart + rowGap * 0, "real_name", "Abdullah A. Mamun", GOLD, 195);
  drawStatRow(ctx, leftX + 30, rowStart + rowGap * 1, "nickname", data.nickname, CYAN, 195);
  drawStatRow(ctx, leftX + 30, rowStart + rowGap * 2, "age", data.age, WHITE, 195);
  drawStatRow(ctx, leftX + 30, rowStart + rowGap * 3, "date_of_birth", data.dob, WHITE, 195);
  drawStatRow(ctx, leftX + 30, rowStart + rowGap * 4, "blood_group", data.blood, PINK, 195);
  drawStatRow(ctx, leftX + 30, rowStart + rowGap * 5, "religion", data.religion, WHITE, 195);
  drawStatRow(ctx, leftX + 30, rowStart + rowGap * 6, "nationality", data.nationality, WHITE, 195);

  // CONTACT
  drawPanel(ctx, rightX, s1Y, panelW, s1H, CYAN);
  drawPanelHeader(ctx, rightX + 25, s1Y + 42, "📞", "CONTACT", CYAN);

  drawStatRow(ctx, rightX + 30, rowStart + rowGap * 0, "facebook", "Shah Protik Tqs", WHITE, 175);
  drawStatRow(ctx, rightX + 30, rowStart + rowGap * 1, "instagram", "@protikshah", GOLD, 175);
  drawStatRow(ctx, rightX + 30, rowStart + rowGap * 2, "gmail", "protik***@gmail", WHITE, 175);
  drawStatRow(ctx, rightX + 30, rowStart + rowGap * 3, "whatsapp", "01613****97", WHITE, 175);
  drawStatRow(ctx, rightX + 30, rowStart + rowGap * 4, "github", "protikshah", CYAN, 175);
  drawStatRow(ctx, rightX + 30, rowStart + rowGap * 5, "youtube", "@protik573", PINK, 175);
  drawStatRow(ctx, rightX + 30, rowStart + rowGap * 6, "database", "MongoDB", MINT, 175);

  // ============================================================
  // SECTION 2: EDUCATION + FAVORITES
  // ============================================================
  const s2Y = 730;
  const s2H = 380;

  // EDUCATION
  drawPanel(ctx, leftX, s2Y, panelW, s2H, PURPLE);
  drawPanelHeader(ctx, leftX + 25, s2Y + 42, "🎓", "EDUCATION", PURPLE);

  const row2Start = s2Y + 95;
  drawStatRow(ctx, leftX + 30, row2Start + rowGap * 0, "school", "Al Azhar Madrasa", WHITE, 195);
  drawStatRow(ctx, leftX + 30, row2Start + rowGap * 1, "college", data.college, GOLD, 195);
  drawStatRow(ctx, leftX + 30, row2Start + rowGap * 2, "university", data.university, CYAN, 195);
  drawStatRow(ctx, leftX + 30, row2Start + rowGap * 3, "class", data.class, WHITE, 195);
  drawStatRow(ctx, leftX + 30, row2Start + rowGap * 4, "status", "✓ Completed", MINT, 195);
  drawStatRow(ctx, leftX + 30, row2Start + rowGap * 5, "speciality", "Self-Taught Dev", GOLD, 195);
  drawStatRow(ctx, leftX + 30, row2Start + rowGap * 6, "language", "Bangla / English", WHITE, 195);

  // FAVORITES
  drawPanel(ctx, rightX, s2Y, panelW, s2H, PINK);
  drawPanelHeader(ctx, rightX + 25, s2Y + 42, "💖", "FAVORITES", PINK);

  drawStatRow(ctx, rightX + 30, row2Start + rowGap * 0, "color", "Green & White", MINT, 175);
  drawStatRow(ctx, rightX + 30, row2Start + rowGap * 1, "food", "BooBs", GOLD, 175);
  drawStatRow(ctx, rightX + 30, row2Start + rowGap * 2, "drink", data.favDrink, CYAN, 175);
  drawStatRow(ctx, rightX + 30, row2Start + rowGap * 3, "anime", "Rimuru / AOT", PURPLE, 175);
  drawStatRow(ctx, rightX + 30, row2Start + rowGap * 4, "movie", data.favMovie, PINK, 175);
  drawStatRow(ctx, rightX + 30, row2Start + rowGap * 5, "singer", "Muza / SNX", CYAN, 175);
  drawStatRow(ctx, rightX + 30, row2Start + rowGap * 6, "hobby", "Music / Games", WHITE, 175);

  // ============================================================
  // SECTION 3: BOT INFO + PERSONALITY
  // ============================================================
  const s3Y = 1140;
  const s3H = 380;

  // BOT INFO
  drawPanel(ctx, leftX, s3Y, panelW, s3H, MINT);
  drawPanelHeader(ctx, leftX + 25, s3Y + 42, "🤖", "BOT INFO", MINT);

  const row3Start = s3Y + 95;
  drawStatRow(ctx, leftX + 30, row3Start + rowGap * 0, "bot_name", data.botName, GOLD, 195);
  drawStatRow(ctx, leftX + 30, row3Start + rowGap * 1, "bot_role", data.botRole, CYAN, 195);
  drawStatRow(ctx, leftX + 30, row3Start + rowGap * 2, "bot_since", data.botSince, WHITE, 195);
  drawStatRow(ctx, leftX + 30, row3Start + rowGap * 3, "commands", "463+", GOLD, 195);
  drawStatRow(ctx, leftX + 30, row3Start + rowGap * 4, "events", "11", GOLD, 195);
  drawStatRow(ctx, leftX + 30, row3Start + rowGap * 5, "ai_engine", "Groq / Qwen", CYAN, 195);
  drawStatRow(ctx, leftX + 30, row3Start + rowGap * 6, "framework", "GoatBot V2", MINT, 195);

  // PERSONALITY
  drawPanel(ctx, rightX, s3Y, panelW, s3H, GOLD);
  drawPanelHeader(ctx, rightX + 25, s3Y + 42, "✨", "PERSONALITY", GOLD);

  drawStatRow(ctx, rightX + 30, row3Start + rowGap * 0, "motto", "Code. Fix. Repeat.", GOLD, 175);
  drawStatRow(ctx, rightX + 30, row3Start + rowGap * 1, "dream", "bow/gf Extract kora", CYAN, 175);
  drawStatRow(ctx, rightX + 30, row3Start + rowGap * 2, "goal", "bow/gf er oiita", PURPLE, 175);
  drawStatRow(ctx, rightX + 30, row3Start + rowGap * 3, "type", "Introvert-Coder", WHITE, 175);
  drawStatRow(ctx, rightX + 30, row3Start + rowGap * 4, "vibe", "Chill & Legendary", MINT, 175);
  drawStatRow(ctx, rightX + 30, row3Start + rowGap * 5, "power_level", "∞ 0000", PINK, 175);
  drawStatRow(ctx, rightX + 30, row3Start + rowGap * 6, "threat", "LEGENDARY 🔥", PINK, 175);

  // ============================================================
  // FOOTER
  // ============================================================
  const now = moment().tz("Asia/Dhaka").format("DD-MM-YYYY HH:mm:ss");

  // Divider
  const footGrad = ctx.createLinearGradient(0, h - 55, w, h - 55);
  footGrad.addColorStop(0, "rgba(255, 215, 0, 0)");
  footGrad.addColorStop(0.5, GOLD);
  footGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
  ctx.fillStyle = footGrad;
  ctx.fillRect(0, h - 55, w, 1.5);

  ctx.save();
  ctx.font = "bold 18px monospace";
  ctx.fillStyle = GOLD_SOFT;
  ctx.fillText(`◆ Last scan: ${now}`, 60, h - 22);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = MINT;
  ctx.textAlign = "right";
  ctx.fillText("◆ PROTIK'S PROFILE ◆", w - 60, h - 22);
  ctx.restore();

  // Small pulse dot
  ctx.save();
  ctx.fillStyle = MINT;
  ctx.shadowColor = MINT;
  ctx.shadowBlur = 10 + pulse * 10;
  ctx.beginPath();
  ctx.arc(w - 45, h - 28, 4 + pulse * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.textAlign = "left";
}

// ============================================================
// BUILD GIF
// ============================================================
async function buildGif(data) {
  const encoder = new https://files.catbox.moe/vd43nx.mp4
  )encoderoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(FRAME_DELAY);
  encoder.setQuality(GIF_QUALITY);constonst canvas = createCanvas(GIF_W, GIF_H);
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < FRAME_COUNT; i++) {
    const phase = i / FRAME_COUNT;
    renderFrame(ctx, data, phase);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

// ============================================================
// MODULE
// ============================================================
module.exports = {
  config: {
    name: "owner",
    aliases: ["ownerinfo", "akashinfo", "diabloinfo"],
    version: "2.0.0",
    author: "Shah Protik",
    countDown: 20,
    role: 0,
    shortDescription: "Shah Protik's premium profile card",
    category: "system",
    guide: { en: "{p}myinfo" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      console.log("[MYINFO] Starting...");

      const ping = await new Promise((resolve, reject) => {
        api.sendMessage("ʀᴇɴᴅᴇʀɪɴɢ ᴘʀᴇᴍɪᴜᴍ ᴘʀᴏꜰɪʟᴇ... (~15ꜱ)", threadID, (err, info) => {
          if (err) return reject(err);
          resolve(info);
        });
      });

      console.log("[MYINFO] Fetching avatar...");
      const avatarImage = await fetchAvatar(PROFILE.avatarUid);
      console.log("[MYINFO] Avatar:", avatarImage ? "OK" : "FAILED");

      const data = { ...PROFILE, avatarImage };

      console.log("[MYINFO] Building GIF...");
      const gifBuffer = await buildGif(data);
      console.log("[MYINFO] GIF size:", gifBuffer.length, "bytes");

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const gifPath = path.join(cacheDir, `myinfo_${Date.now()}.gif`);
      await fs.writeFile(gifPath, gifBuffer);
      console.log("[MYINFO] Saved:", gifPath);

      try { api.unsendMessage(ping.messageID, () => {}); } catch (e) {}

      await api.sendMessage({
        body: " ",
        attachment: fs.createReadStream(gifPath)
      }, threadID, (err) => {
        if (err) console.error("[MYINFO] Send error:", err);
        if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
      }, messageID);

      console.log("[MYINFO] Done!");

    } catch (err) {
      console.error("[MYINFO] ERROR:", err.message);
      console.error("[MYINFO] Stack:", err.stack);
      return api.sendMessage(`❌ ᴇʀʀᴏʀ: ${err.message || "Something went wrong"}`, threadID, messageID);
    }
  }
};
