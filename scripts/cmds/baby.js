const axios = require('axios');

const PRIMARY_API = "https://noobs-api.top/dipto";
const SECONDARY_API = "https://baby-apisx.vercel.app";

function looksLikeErrorPayload(raw) {
    if (!raw || typeof raw !== "object") return true;
    if (raw.error) return true;
    const text = `${raw.reply ?? ""} ${raw.message ?? ""}`;
    return /cannot read propert|undefined|is not a function|internal server error|^error:/i.test(text);
}

function normalize(raw) {
    return {
        ...raw,
        reply: raw.reply ?? "🤔 I couldn't come up with a reply.",
        message: raw.message ?? "✅ Done (the API didn't send a confirmation message)."
    };
}

async function fetchWithFallback(path) {
    let primaryError;
    try {
        const res = await axios.get(`${PRIMARY_API}${path}`, { timeout: 10000 });
        if (res.data && typeof res.data === "object" && !looksLikeErrorPayload(res.data)) return normalize(res.data);
        primaryError = new Error(`Primary API returned a bad payload: ${JSON.stringify(res.data)}`);
    } catch (e) {
        primaryError = e;
    }

    try {
        const res = await axios.get(`${SECONDARY_API}${path}`, { timeout: 10000 });
        if (res.data && typeof res.data === "object" && !looksLikeErrorPayload(res.data)) return normalize(res.data);
        throw new Error(`Secondary API returned a bad payload: ${JSON.stringify(res.data)}`);
    } catch (e) {
        console.log("baby: primary failed ->", primaryError?.message);
        console.log("baby: secondary failed ->", e.message);
        throw new Error("Both baby APIs are currently unavailable. Please try again later.");
    }
}

const utils = {
    monospace: (text) => {
        if (typeof text !== "string" || !text) return text ?? "🤔 No reply received.";
        const monospaceMap = {
            'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
            'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
            'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
            'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
            'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
            'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
            '0': '𝟶', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
        };
        return text.split('').map(char => monospaceMap[char] || char).join('');
    },
    realMention: (name, uid, message) => {
        const finalMessage = `『 ${name} 』\n\n${message}`;
        return { body: finalMessage, mentions: [{ tag: name, id: uid }] };
    }
};

const triggers = ["baby", "bby", "bot", "jan", "babu", "janu", "বট"];

async function sendAttachmentReply(api, event) {
    const attType = event.attachments?.[0]?.type;
    let endpoint = null;
    if (attType === "sticker") endpoint = "sticker";
    else if (attType === "photo" || attType === "animated_image") endpoint = "picture";
    if (!endpoint) return false;

    const raw = (await axios.get(`${SECONDARY_API}/baby/${endpoint}?senderID=${event.senderID}`, { timeout: 10000 })).data;
    if (looksLikeErrorPayload(raw)) return false;
    const data = normalize(raw);
    await api.sendMessage(data.reply, event.threadID, (error, info) => {
        global.GoatBot.onReply.set(info.messageID, {
            commandName: "baby",
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
        });
    }, event.messageID);
    return true;
}

module.exports.config = {
    name: "baby",
    aliases: ["bby"],
    version: "11.1",
    author: "xalman",
    countDown: 0,
    role: 0,
    description: "api by dipto || aryan",
    category: "CHATTING",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach react [YourMessage] - [react1], [react2]... OR\nteach amar [YourMessage] - [reply] OR\nteach sticker - [Reply1], [Reply2]... OR\nteach picture - [Reply1], [Reply2]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nedit [YourMessage] - [NewReply] OR\nmsg [YourMessage] OR\nlist OR\nlist all"
    }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const body = args.join(" ").toLowerCase();
    const uid = event.senderID;

    try {
        if (!args[0]) {
            if (event.attachments?.length > 0) {
                const handled = await sendAttachmentReply(api, event);
                if (handled) return;
            }
            const ran = [""];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        if (args[0] === 'remove') {
            const key = body.replace("remove ", "");
            const data
