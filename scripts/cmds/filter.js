function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

function toIDs(list) {
	return (list || []).map(a => String(a && a.id ? a.id : a));
}

async function getThreadState(api, threadsData, threadID) {
	let info = null;
	let data = null;
	try {
		info = await api.getThreadInfo(threadID);
	} catch (e) {}
	try {
		data = await threadsData.get(threadID);
	} catch (e) {}
	if (!info && !data) throw new Error("Could not load thread info");
	const admins = new Set([
		...toIDs(info && info.adminIDs),
		...toIDs(data && data.adminIDs)
	]);
	return { info, data, admins };
}

module.exports = {
	config: {
		name: "filteruser",
		aliases: ["filter"],
		version: "1.9",
		author: "NTKhang (Fixed by Anik Islam Sadik)",
		countDown: 5,
		role: 1,
		description: {
			vi: "lọc thành viên nhóm theo số tin nhắn hoặc bị khóa acc",
			en: "filter group members by number of messages or locked account"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} [<số tin nhắn> | die]",
			en: "   {pn} [<number of messages> | die]"
		}
	},

	langs: {
		vi: {
			needAdmin: "⚠ | Vui lòng thêm bot làm quản trị viên của box để sử dụng lệnh này",
			confirm: "⚠ | Bạn có chắc chắn muốn xóa thành viên nhóm có số tin nhắn nhỏ hơn %1 không?\nThả cảm xúc bất kì vào tin nhắn này để xác nhận",
			kickByBlock: "✓ | Đã xóa thành công %1 thành viên bị khóa acc",
			kickByMsg: "✓ | Đã xóa thành công %1 thành viên có số tin nhắn nhỏ hơn %2",
			kickError: "✗ | Đã xảy ra lỗi không thể kick %1 thành viên:\n%2",
			noBlock: "✓ | Không có thành viên nào bị khóa acc",
			noMsg: "✓ | Không có thành viên nào có số tin nhắn nhỏ hơn %1"
		},
		en: {
			needAdmin: "⚠ | Please add the bot as a group admin to use this command",
			confirm: "⚠ | Are you sure you want to delete group members with less than %1 messages?\nReact to this message to confirm",
			kickByBlock: "✓ | Successfully removed %1 members with unavailable accounts",
			kickByMsg: "✓ | Successfully removed %1 members with less than %2 messages",
			kickError: "✗ | An error occurred and could not kick %1 members:\n%2",
			noBlock: "✓ | There are no members with locked accounts",
			noMsg: "✓ | There are no members with less than %1 messages"
		}
	},

	onStart: async function ({ api, args, threadsData, message, event, commandName, getLang }) {
		try {
			const botID = String(api.getCurrentUserID());
			const { info, data, admins } = await getThreadState(api, threadsData, event.threadID);

			if (admins.size > 0 && !admins.has(botID)) {
				return message.reply(getLang("needAdmin"));
			}

			const input = args[0] ? args[0].toLowerCase() : "die";

			if (!isNaN(input)) {
				return message.reply(getLang("confirm", input), (err, msgInfo) => {
					if (err) return;
					global.GoatBot.onReaction.set(msgInfo.messageID, {
						author: event.senderID,
						messageID: msgInfo.messageID,
						minimum: Number(input),
						commandName
					});
				});
			}

			if (input === "die") {
				const userInfo = (info && info.userInfo) || [];
				const knownIDs = new Set(userInfo.map(u => String(u.id)));
				const participantIDs = ((info && info.participantIDs) || (data && data.members ? data.members.filter(m => m.inGroup).map(m => m.userID) : [])).map(String);

				const deadList = [];

				for (const user of userInfo) {
					const uid = String(user.id);
					const badName = !user.name || user.name === "Facebook User";
					if ((user.type !== "User" || badName) && uid !== botID && !admins.has(uid)) {
						deadList.push({ id: uid, name: user.name || uid });
					}
				}

				for (const uid of participantIDs) {
					if (!knownIDs.has(uid) && uid !== botID && !admins.has(uid)) {
						deadList.push({ id: uid, name: uid });
					}
				}

				const errors = [];
				const success = [];

				for (const user of deadList) {
					try {
						await api.removeUserFromGroup(user.id, event.threadID);
						success.push(user.id);
					} catch (e) {
						errors.push(user.name);
					}
					await sleep(700);
				}

				let msg = "";
				if (success.length > 0) msg += `${getLang("kickByBlock", success.length)}\n`;
				if (errors.length > 0) msg += `${getLang("kickError", errors.length, errors.join("\n"))}\n`;
				if (msg === "") msg += getLang("noBlock");

				return message.reply(msg);
			}

			return message.SyntaxError();
		} catch (error) {
			return message.reply(`✗ | Error: ${error.message}`);
		}
	},

	onReaction: async function ({ api, Reaction, event, threadsData, message, getLang }) {
		try {
			const { minimum = 1, author } = Reaction;
			if (event.userID != author) return;

			const botID = String(api.getCurrentUserID());
			const { data, admins } = await getThreadState(api, threadsData, event.threadID);
			const members = (data && data.members) || [];

			const membersCountLess = members.filter(member =>
				member.count < minimum
				&& member.inGroup == true
				&& String(member.userID) !== botID
				&& !admins.has(String(member.userID))
			);

			const errors = [];
			const success = [];
			for (const member of membersCountLess) {
				try {
					await api.removeUserFromGroup(member.userID, event.threadID);
					success.push(member.userID);
				} catch (e) {
					errors.push(member.name || member.userID);
				}
				await sleep(700);
			}

			let msg = "";
			if (success.length > 0) msg += `${getLang("kickByMsg", success.length, minimum)}\n`;
			if (errors.length > 0) msg += `${getLang("kickError", errors.length, errors.join("\n"))}\n`;
			if (msg === "") msg += getLang("noMsg", minimum);

			return message.reply(msg);
		} catch (error) {
			return message.reply(`✗ | Error: ${error.message}`);
		}
	}
};
