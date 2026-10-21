// Author: AKASH AHMED | ULTRA X CHEAT
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// লোকাল ডাটাবেস পাথ
const dbPath = path.join(__dirname, "..", "..", "welcome-config.json");

function loadDB() {
    try { if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, "utf8")); } catch (e) {}
    return {};
}
function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    config: {
        name: "setwelcome",
        aliases: ["setwc"],
        version: "2.0",
        author: "Ariyan Shihab",
        role: 1, // Admin Only
        category: "system",
        description: "Edit welcome message content when new member join your group chat"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, body, senderID, messageReply } = event;
        const db = loadDB();

        // ডিফল্ট সেটিংস (অল টাইম অন থাকবে)
        if (!db[threadID]) {
            db[threadID] = { 
                enabled: true, // 🚨 ডিফল্টভাবে সবসময় অন থাকবে
                text: "🎉 Welcome {userName} to {boxName}!",
                attachmentUrl: null,
                attachmentType: null
            };
        }

        const action = args[0] ? args[0].toLowerCase() : "";

        switch (action) {
            case "text": {
                if (!args[1]) {
                    return api.sendMessage("⚠️ Please enter the welcome message content.", threadID, messageID);
                } else if (args[1].toLowerCase() === "reset") {
                    db[threadID].text = "🎉 Welcome {userName} to {boxName}!";
                    saveDB(db);
                    return api.sendMessage("✅ The welcome message has been reset.", threadID, messageID);
                } else {
                    const newText = body.slice(body.indexOf("text") + 4).trim();
                    db[threadID].text = newText;
                    saveDB(db);
                    return api.sendMessage(`✅ The group welcome message has been updated:\n\n${newText}`, threadID, messageID);
                }
            }

            case "file": {
                if (args[1] && args[1].toLowerCase() === "reset") {
                    db[threadID].attachmentUrl = null;
                    db[threadID].attachmentType = null;
                    saveDB(db);
                    return api.sendMessage("✅ Welcome attachments have been cleared successfully.", threadID, messageID);
                }
                
                if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
                    return api.sendMessage("⚠️ Please reply to this message with an image, video, or audio file.", threadID, messageID);
                }

                const att = messageReply.attachments[0];
                if (!["photo", "png", "animated_image", "video", "audio"].includes(att.type)) {
                    return api.sendMessage("❌ Unsupported file type. Only photo/video/audio allowed.", threadID, messageID);
                }

                db[threadID].attachmentUrl = att.url;
                db[threadID].attachmentType = att.type;
                saveDB(db);
                return api.sendMessage("✅ Added 1 attachment to the group welcome message.", threadID, messageID);
            }

            case "on":
            case "off": {
                db[threadID].enabled = (args[0].toLowerCase() === "on");
                saveDB(db);
                return api.sendMessage(db[threadID].enabled ? "✅ Welcome messages are now enabled." : "❌ Welcome messages are now disabled.", threadID, messageID);
            }

            default: {
                const helpMsg = `⚙️ **SETWELCOME GUIDE**\n\n` +
                                `➜ !setwelcome on / off\n` +
                                `➜ !setwelcome text <your text>\n` +
                                `➜ !setwelcome text reset\n` +
                                `➜ !setwelcome file (reply to media)\n` +
                                `➜ !setwelcome file reset\n\n` +
                                `**Shortcuts:**\n` +
                                `{userName} - New member name\n` +
                                `{boxName} - Group name`;
                return api.sendMessage(helpMsg, threadID, messageID);
            }
        }
    }
};
