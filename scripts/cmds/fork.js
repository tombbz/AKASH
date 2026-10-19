const axios = require("axios");

const OWNER = "lazyanik";
const REPO = "SATURO-BOT-V2";
const GITHUB_TOKEN = "";

module.exports = {
  config: {
    name: "fork",
    aliases: ["repo", "source"],
    version: "3.0",
    author: "Anik Islam Sadik",
    countDown: 5,
    role: 0,
    longDescription: "Shows the official repository link with live forks, stars and views.",
    category: "system",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ message }) {
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "SATURO-BOT-V2"
    };
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const base = `https://api.github.com/repos/${OWNER}/${REPO}`;
    let forks = "N/A";
    let stars = "N/A";
    let views = "N/A";

    try {
      const { data } = await axios.get(base, { headers });
      forks = data.forks_count;
      stars = data.stargazers_count;
    } catch (e) {}

    if (GITHUB_TOKEN) {
      try {
        const { data } = await axios.get(`${base}/traffic/views`, { headers });
        views = data.count;
      } catch (e) {}
    }

    const text = `╭━━━ 〈 𝐒𝐀𝐓𝐔𝐑𝐎-𝐁𝐎𝐓-𝐕𝟐 〉 ━━━╮

✧ 𝐂𝐫𝐞𝐚𝐭𝐨𝐫 ➪ 👑 𝐀𝐧𝐢𝐤 𝐈𝐬𝐥𝐚𝐦 𝐒𝐚𝐝𝐢𝐤
✧ 𝐅𝐨𝐫𝐤𝐬   ➪ 🍴 ${forks}
✧ 𝐒𝐭𝐚𝐫𝐬   ➪ ⭐ ${stars}
✧ 𝐕𝐢𝐞𝐰𝐬   ➪ 👁️ ${views}
✧ 𝐆𝐢𝐭𝐇𝐮𝐛  ➪ 🔗 https://github.com/${OWNER}/${REPO}

╰━━━ 〈 𝐊𝐞𝐞𝐩 𝐒𝐮𝐩𝐩𝐨𝐫𝐭𝐢𝐧𝐠 ❤️ 〉 ━━━╯`;

    await message.reply(text);
  }
};
