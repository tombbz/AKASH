const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API =
  "https://toshiro-api-editz6t9.vercel.app/api/downloader/alldl";

function detectPlatform(url) {
  const u = url.toLowerCase();

  if (u.includes("tiktok.com")) return "𝙏𝙞𝙠𝙏𝙤𝙠";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "𝙁𝙖𝙘𝙚𝙗𝙤𝙤𝙠";
  if (u.includes("instagram.com")) return "𝙄𝙣𝙨𝙩𝙖𝙜𝙖𝙢";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "𝙔𝙤𝙪𝙏𝙖𝙗𝙚";
  if (u.includes("x.com") || u.includes("twitter.com")) return "𝙏𝙬𝙞𝙩𝙩𝙚𝙧 / 𝙓";
  if (u.includes("pin.it") || u.includes("pinterest.com")) return "𝙋𝙞𝙣𝙩𝙚𝙧𝙚𝙨𝙩";
  if (u.includes("soundcloud.com")) return "𝙎𝙤𝙪𝙣𝙙𝘾𝙡𝙤𝙪𝙙";
  if (u.includes("spotify.com")) return "𝙎𝙥𝙤𝙩𝙞𝙛𝙮";
  if (u.includes("capcut.com")) return "𝘾𝙖𝙥𝘾𝙪𝙩";

  return "𝙐𝙣𝙠𝙣𝙤𝙬𝙣";
}

function cleanUrl(url) {
  url = url.trim();

  try {
    const u = new URL(url);

    if (
      u.hostname.includes("youtube.com") ||
      u.hostname.includes("youtu.be")
    ) {
      return url;
    }

    return url.split("?")[0];
  } catch {
    return url;
  }
}

function findUrl(obj) {
  if (!obj) return null;

  if (typeof obj === "string") {
    if (
      obj.startsWith("http://") ||
      obj.startsWith("https://")
    ) {
      return obj;
    }

    return null;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findUrl(item);
      if (found) return found;
    }

    return null;
  }

  if (typeof obj === "object") {
    const priorityKeys = [
      "download",
      "downloadUrl",
      "download_url",
      "downloadLink",
      "download_link",
      "high_quality",
      "highQuality",
      "video",
      "videoUrl",
      "video_url",
      "url",
      "audio",
      "audioUrl",
      "audio_url",
      "downloadMp3",
      "originalVideoUrl",
      "original_video_url"
    ];

    for (const key of priorityKeys) {
      if (obj[key]) {
        const found = findUrl(obj[key]);
        if (found) return found;
      }
    }

    if (Array.isArray(obj.formats)) {
      const audio = obj.formats.find(
        x =>
          x &&
          (
            x.vcodec === "none" ||
            x.ext === "mp3" ||
            x.acodec
          ) &&
          x.url
      );

      if (audio?.url) {
        return audio.url;
      }

      const video = obj.formats.find(
        x => x?.url
      );

      if (video?.url) {
        return video.url;
      }
    }

    for (const key of Object.keys(obj)) {
      const found = findUrl(obj[key]);
      if (found) return found;
    }
  }

  return null;
}

function extractDownload(data) {
  if (!data) return null;

  return findUrl(data);
}

function decodeCapCutUrl(url) {
  try {
    if (!url.includes("3bic.com/api/cdn/")) {
      return null;
    }

    const encoded = url.split("/api/cdn/")[1];

    if (!encoded) return null;

    return Buffer.from(
      encoded,
      "base64"
    ).toString("utf8");
  } catch {
    return null;
  }
}

async function downloadFile(
  url,
  filePath,
  isCapCut = false
) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
    Accept: "*/*"
  };

  if (isCapCut) {
    headers.Referer = "https://www.capcut.com/";
    headers.Origin = "https://www.capcut.com";
  }

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 120000,
    maxRedirects: 10,
    headers
  });

  await fs.writeFile(
    filePath,
    Buffer.from(response.data)
  );
}

const SUPPORTED = [
  "https://vt.tiktok.com",
  "https://www.tiktok.com/",
  "https://vm.tiktok.com",

  "https://www.facebook.com/watch/",
  "https://www.facebook.com/reel/",
  "https://www.facebook.com/share/v",
  "https://www.facebook.com/share/r",

  "https://www.instagram.com/reel/",
  "https://www.instagram.com/p/",

  "https://youtu.be/",
  "https://youtube.com/",
  "https://www.youtube.com/",

  "https://x.com/",
  "https://twitter.com/",

  "https://pin.it/",
  "https://www.pinterest.com/",

  "https://soundcloud.com/",
  "https://open.spotify.com/",

  "https://www.capcut.com/",
  "https://capcut.com/"
];

module.exports = {
  config: {
    name: "autodl",
    version: "7.0",
    author: "Toshiro Editz",
    role: 0,
    category: "media",
    description: {
      en: "Auto download videos and audio from multiple platforms"
    },
    guide: {
      en: "[video/audio link]"
    }
  },

  onStart: async function () {},

  onChat: async function ({
    api,
    event
  }) {
    const text = event.body || "";

    if (!text.startsWith("http")) {
      return;
    }

    if (
      !SUPPORTED.some(link =>
        text.startsWith(link)
      )
    ) {
      return;
    }

    api.setMessageReaction(
      "🐤",
      event.messageID,
      event.threadID,
      () => {},
      true
    );

    const startTime = Date.now();

    try {
      const targetUrl = cleanUrl(text);
      const platform = detectPlatform(targetUrl);

      const isAudio =
        platform === "𝙎𝙤𝙪𝙣𝙙𝘾𝙡𝙤𝙪𝙙" ||
        platform === "𝙎𝙥𝙤𝙩𝙞𝙛𝙮";

      const isCapCut =
        platform === "𝘾𝙖𝙥𝘾𝙪𝙩";

      const cacheDir =
        path.join(__dirname, "cache");

      await fs.ensureDir(cacheDir);

      const filePath = path.join(
        cacheDir,
        `autodl_${Date.now()}${
          isAudio ? ".mp3" : ".mp4"
        }`
      );

      const res = await axios.get(
        API +
          "?url=" +
          encodeURIComponent(targetUrl),
        {
          timeout: 60000
        }
      );

      console.log(
        "AutoDL API:",
        JSON.stringify(
          res.data,
          null,
          2
        )
      );

      let downloadUrl =
        extractDownload(res.data);

      if (!downloadUrl) {
        api.setMessageReaction(
          "❌",
          event.messageID,
          event.threadID,
          () => {},
          true
        );

        return api.sendMessage(
          "❌ Video not found or unsupported link.",
          event.threadID
        );
      }

      let downloaded = false;

      if (isCapCut) {
        const decoded =
          decodeCapCutUrl(downloadUrl);

        if (
          decoded &&
          decoded.startsWith("http")
        ) {
          try {
            await downloadFile(
              decoded,
              filePath,
              true
            );

            downloaded = true;
          } catch (err) {
            console.error(
              "CapCut decoded download:",
              err.response?.status ||
                err.message
            );
          }
        }
      }

      if (!downloaded) {
        try {
          await downloadFile(
            downloadUrl,
            filePath,
            isCapCut
          );

          downloaded = true;
        } catch (err) {
          console.error(
            "Direct download:",
            err.response?.status ||
              err.message
          );
        }
      }

      if (!downloaded) {
        throw new Error(
          "Unable to download media"
        );
      }

      const info =
        res.data.result?.result ||
        res.data.result ||
        res.data;

      const speed = (
        (Date.now() - startTime) /
        1000
      ).toFixed(2);

      const title =
        info.title ||
        info.name ||
        "No Title";

      const author =
        info.authorName ||
        info.author ||
        info.artist ||
        "Unknown";

      const msg = {
        body:
          `╭━〔 ✅ 𝐀𝐮𝐭𝐨 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 〕━╮\n` +
          `┃ 📌 Title     : ${title}\n` +
          `┃ 🌐 Platform  : ${platform}\n` +
          `┃ 👤 Author    : ${author}\n` +
          `┃ ⚡ Speed     : ${speed}s\n` +
          `╰━━━━━━━━━━━━━━━━╯\n` +
          `⚡ Powered by AKASH ❄️`,

        attachment:
          fs.createReadStream(filePath)
      };

      api.sendMessage(
        msg,
        event.threadID,
        err => {
          if (err) {
            console.error(
              "Upload Error:",
              err
            );
          }

          api.setMessageReaction(
            err ? "❌" : "✅",
            event.messageID,
            event.threadID,
            () => {},
            true
          );

          if (
            fs.existsSync(filePath)
          ) {
            fs.unlinkSync(filePath);
          }
        },
        event.messageID
      );

    } catch (err) {
      console.error(
        "AutoDL Error:",
        err
      );

      api.setMessageReaction(
        "❌",
        event.messageID,
        event.threadID,
        () => {},
        true
      );

      api.sendMessage(
        `❌ Error: ${
          err.response?.status ||
          err.message
        }`,
        event.threadID
      );
    }
  }
};
