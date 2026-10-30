const axios = require("axios");
const Canvas = require("canvas");
const { createCanvas, registerFont } = Canvas;
const { getStreamFromURL } = global.utils;

const API_BASE = "https://pin.neokex.xyz";
const SEARCH_ENDPOINT = {
	image: "/api/pins",
	video: "/api/videos"
};
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ITEMS_PER_PAGE = 12;
const FETCH_LIMIT = 50;
const DOWNLOAD_LIMIT = 83 * 1024 * 1024;
const VIDEO_WIDTHS = [720, 540, 360, 240];

try {
	registerFont(__dirname + "/assets/font/BeVietnamPro-Regular.ttf", { family: "Pinterest" });
	registerFont(__dirname + "/assets/font/BeVietnamPro-Bold.ttf", { family: "PinterestBold" });
}
catch (err) {
}
const FONT = "Pinterest, 'BeVietnamPro-Regular', 'DejaVu Sans', Arial, sans-serif";
const FONT_BOLD = "PinterestBold, 'BeVietnamPro-Bold', 'DejaVu Sans', Arial, sans-serif";

const PIN_RED = "#E60023";

function react(api, messageID, emoji) {
	if (messageID)
		api.setMessageReaction(emoji, messageID, () => { }, true);
}

function cleanText(text) {
	return String(text || "").replace(/\s+/g, " ").trim();
}

function formatDuration(seconds) {
	const total = Math.floor(Number(seconds) || 0);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

function shortNumber(number) {
	const n = Number(number) || 0;
	if (n >= 1000000)
		return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1).replace(/\.0$/, "") + "M";
	if (n >= 1000)
		return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(/\.0$/, "") + "K";
	return String(n);
}

function thumbUrl(url) {
	if (!url)
		return url;
	if (url.includes("/videos/thumbnails/"))
		return url;
	return url.replace("/originals/", "/474x/");
}

function mp4Urls(hlsUrl) {
	const match = String(hlsUrl || "").match(/^(https?:\/\/[^/]+\/videos\/(?:iht|mc))\/hls\/(.+)\.m3u8$/);
	if (!match)
		return [];
	const base = match[1];
	const hash = match[2];
	const urls = [];
	for (const width of VIDEO_WIDTHS) {
		urls.push(`${base}/expMp4/${hash}_${width}w.mp4`);
		urls.push(`${base}/${width}p/${hash}.mp4`);
	}
	return urls;
}

async function apiSearch(type, query, bookmark) {
	const params = { q: query, limit: FETCH_LIMIT };
	if (bookmark)
		params.bookmark = bookmark;
	const { data } = await axios.get(API_BASE + SEARCH_ENDPOINT[type], {
		params,
		timeout: 45000,
		headers: { "user-agent": USER_AGENT, "accept": "application/json" }
	});
	if (!data || data.success === false || !Array.isArray(data.results))
		throw new Error((data && data.error && data.error.message) || "The Pinterest API returned an invalid response");
	return data;
}

function toItem(result, type) {
	const isVideo = type === "video" || result.is_video === true;
	const video = result.video || {};
	const poster = (result.image && result.image.url) || video.thumbnail || "";
	const thumbnail = poster || video.thumbnail || "";
	const author = result.author || (result.board && result.board.owner) || {};
	const reactions = result.reactions || {};
	const likes = reactions.like || reactions.likes || 0;
	return {
		id: result.id,
		isVideo,
		title: cleanText(result.title) || cleanText(result.alt_text),
		description: cleanText(result.description) || cleanText(result.alt_text),
		image: (result.image && result.image.url) || thumbnail,
		thumbnail,
		videoUrl: isVideo ? video.url : null,
		duration: video.duration_seconds || 0,
		author: cleanText(author.full_name) || cleanText(author.username) || "Unknown",
		authorAvatar: author.avatar || "",
		likes,
		link: result.pin_url || result.link || ""
	};
}

function computeLayout(count) {
	if (count <= 4)
		return { columns: 2, rows: Math.ceil(count / 2) };
	if (count <= 9)
		return { columns: 3, rows: Math.ceil(count / 3) };
	return { columns: 4, rows: Math.ceil(count / 4) };
}

function coverRect(image, x, y, w, h) {
	const ratio = Math.max(w / image.width, h / image.height);
	const dw = image.width * ratio;
	const dh = image.height * ratio;
	return [x + (w - dw) / 2, y + (h - dh) / 2, dw, dh];
}

function roundRect(ctx, x, y, w, h, radius) {
	const r = Math.min(radius, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

async function loadImageSafe(url) {
	try {
		return await Canvas.loadImage(url);
	}
	catch (err) {
		return null;
	}
}

async function loadThumb(url) {
	if (!url)
		return null;
	const resized = thumbUrl(url);
	const image = await loadImageSafe(resized);
	if (image)
		return image;
	return resized === url ? null : loadImageSafe(url);
}

function drawCover(ctx, image, x, y, w, h, radius) {
	ctx.save();
	roundRect(ctx, x, y, w, h, radius);
	ctx.clip();
	ctx.fillStyle = "#E9E9E9";
	ctx.fillRect(x, y, w, h);
	if (image) {
		const [dx, dy, dw, dh] = coverRect(image, x, y, w, h);
		ctx.drawImage(image, dx, dy, dw, dh);
	}
	ctx.restore();
}

function drawTruncatedText(ctx, text, maxWidth) {
	let out = "";
	for (const char of String(text)) {
		if (ctx.measureText(out + char).width > maxWidth)
			return out.slice(0, -1) + "…";
		out += char;
	}
	return out;
}

function drawIcon(ctx, kind, x, y, size, color) {
	ctx.save();
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(2, size / 12);
	const cx = x + size / 2;
	const cy = y + size / 2;
	if (kind === "heart") {
		const s = size / 16;
		ctx.beginPath();
		ctx.moveTo(cx, cy + 5 * s);
		ctx.bezierCurveTo(cx - 8 * s, cy - 1 * s, cx - 5 * s, cy - 8 * s, cx, cy - 4 * s);
		ctx.bezierCurveTo(cx + 5 * s, cy - 8 * s, cx + 8 * s, cy - 1 * s, cx, cy + 5 * s);
		ctx.closePath();
		ctx.fill();
	}
	else if (kind === "play") {
		ctx.beginPath();
		ctx.moveTo(cx - size / 5, cy - size / 3.5);
		ctx.lineTo(cx + size / 3.5, cy);
		ctx.lineTo(cx - size / 5, cy + size / 3.5);
		ctx.closePath();
		ctx.fill();
	}
	else if (kind === "search") {
		ctx.beginPath();
		ctx.arc(cx - size / 12, cy - size / 12, size / 4.2, 0, Math.PI * 2);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(cx + size / 7, cy + size / 7);
		ctx.lineTo(cx + size / 2.6, cy + size / 2.6);
		ctx.stroke();
	}
	ctx.restore();
}

function drawLogo(ctx, cx, cy, radius) {
	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.fillStyle = PIN_RED;
	ctx.fill();
	ctx.fillStyle = "#FFFFFF";
	ctx.font = `${radius * 1.5}px ${FONT_BOLD}`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("P", cx, cy + radius * 0.08);
	ctx.restore();
}

async function renderBoard({ items, page, totalPages, query, type }) {
	const { columns, rows } = computeLayout(items.length);
	const margin = 26;
	const headerHeight = 104;
	const footerHeight = 62;
	const gap = 14;
	const boardWidth = 1080;
	const cardWidth = Math.floor((boardWidth - margin * 2 - gap * (columns - 1)) / columns);
	const cardHeight = Math.round(cardWidth * 1.5);
	const boardHeight = headerHeight + rows * cardHeight + (rows - 1) * gap + footerHeight;

	const canvas = createCanvas(boardWidth, boardHeight);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, boardWidth, boardHeight);

	drawLogo(ctx, margin + 24, 52, 24);
	ctx.fillStyle = "#111111";
	ctx.font = `bold 34px ${FONT_BOLD}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "middle";
	ctx.fillText("Pinterest", margin + 62, 50);

	ctx.fillStyle = "#767676";
	ctx.font = `22px ${FONT}`;
	ctx.fillText(`${type === "video" ? "Video" : "Image"} · "${query}"`, margin + 62, 82);

	const pillText = `${page} / ${totalPages}`;
	ctx.font = `bold 22px ${FONT_BOLD}`;
	const pillWidth = Math.max(92, ctx.measureText(pillText).width + 40);
	const pillX = boardWidth - margin - pillWidth;
	roundRect(ctx, pillX, 30, pillWidth, 46, 23);
	ctx.fillStyle = "#F1F1F1";
	ctx.fill();
	ctx.fillStyle = "#111111";
	ctx.textAlign = "center";
	ctx.fillText(pillText, pillX + pillWidth / 2, 54);

	const images = await Promise.all(items.map(item => loadThumb(item.thumbnail)));

	ctx.textAlign = "left";
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const col = i % columns;
		const row = Math.floor(i / columns);
		const x = margin + col * (cardWidth + gap);
		const y = headerHeight + row * (cardHeight + gap);

		ctx.save();
		ctx.shadowColor = "rgba(0, 0, 0, 0.16)";
		ctx.shadowBlur = 12;
		ctx.shadowOffsetY = 4;
		roundRect(ctx, x, y, cardWidth, cardHeight, 18);
		ctx.fillStyle = "#FFFFFF";
		ctx.fill();
		ctx.restore();

		drawCover(ctx, images[i], x, y, cardWidth, cardHeight, 18);

		ctx.beginPath();
		ctx.arc(x + 24, y + 24, 19, 0, Math.PI * 2);
		ctx.fillStyle = PIN_RED;
		ctx.fill();
		ctx.fillStyle = "#FFFFFF";
		ctx.font = `bold 22px ${FONT_BOLD}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(String(i + 1), x + 24, y + 25);

		if (item.isVideo) {
			const badgeWidth = item.duration ? 84 : 46;
			const badgeX = x + cardWidth - badgeWidth - 12;
			const badgeY = y + 12;
			roundRect(ctx, badgeX, badgeY, badgeWidth, 32, 16);
			ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
			ctx.fill();
			ctx.textAlign = "left";
			drawIcon(ctx, "play", badgeX + 8, badgeY + 8, 16, "#FFFFFF");
			if (item.duration) {
				ctx.fillStyle = "#FFFFFF";
				ctx.font = `bold 16px ${FONT_BOLD}`;
				ctx.textBaseline = "middle";
				ctx.fillText(formatDuration(item.duration), badgeX + 28, badgeY + 17);
			}
		}

		const gradient = ctx.createLinearGradient(0, y + cardHeight - 96, 0, y + cardHeight);
		gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
		gradient.addColorStop(1, "rgba(0, 0, 0, 0.72)");
		ctx.save();
		roundRect(ctx, x, y + cardHeight - 100, cardWidth, 100, 18);
		ctx.clip();
		ctx.fillStyle = gradient;
		ctx.fillRect(x, y + cardHeight - 100, cardWidth, 100);
		ctx.restore();

		const caption = drawTruncatedText(ctx, item.title || item.description || "Pinterest", cardWidth - 32);
		ctx.fillStyle = "#FFFFFF";
		ctx.font = `bold 20px ${FONT_BOLD}`;
		ctx.textAlign = "left";
		ctx.textBaseline = "alphabetic";
		ctx.fillText(caption, x + 16, y + cardHeight - 34);

		const subtitle = item.likes ? `♥ ${shortNumber(item.likes)}` : item.author;
		ctx.font = `18px ${FONT}`;
		ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
		ctx.fillText(drawTruncatedText(ctx, subtitle, cardWidth - 32), x + 16, y + cardHeight - 12);
	}

	ctx.fillStyle = "#767676";
	ctx.font = `20px ${FONT}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "middle";
	ctx.fillText("Reply with a number to open · \"next\" · \"prev\" · \"cancel\"", margin, boardHeight - 30);

	const stream = canvas.createPNGStream();
	stream.path = `pinterest_${Date.now()}.png`;
	return stream;
}

function buildBody(items, page, totalPages, type, query) {
	const lines = items.map((item, i) => {
		const kind = item.isVideo ? (item.duration ? ` · ${formatDuration(item.duration)}` : "") : "";
		return `${i + 1}. ${item.title || item.description || (item.isVideo ? "Video" : "Image")}${kind}`;
	});
	return `${type === "video" ? "🎬" : "🖼️"} Pinterest · "${query}"`
		+ `\nPage ${page}/${totalPages}`
		+ "\n\n" + lines.join("\n")
		+ "\n\nReply a number to open · next · prev · cancel";
}

async function fetchMedia(item, type) {
	const fallback = { url: item.image || item.thumbnail, ext: "jpg" };
	if (type !== "video" || !item.isVideo)
		return fallback;
	for (const url of mp4Urls(item.videoUrl)) {
		try {
			const response = await axios({
				url,
				method: "GET",
				responseType: "stream",
				timeout: 120000,
				maxRedirects: 5,
				headers: { "user-agent": USER_AGENT, "range": "bytes=0-" }
			});
			const contentType = String(response.headers["content-type"] || "");
			if (!/video|octet-stream/i.test(contentType)) {
				response.data.destroy();
				continue;
			}
			const size = Number(response.headers["content-length"]) || 0;
			if (size > DOWNLOAD_LIMIT) {
				response.data.destroy();
				continue;
			}
			response.data.path = `pinterest_${Date.now()}.mp4`;
			return { url: null, stream: response.data, ext: "mp4" };
		}
		catch (err) {
		}
	}
	return fallback;
}

async function sendMedia({ api, event, message, getLang, item, type, replyTo }) {
	react(api, event.messageID, "⏳");
	try {
		const media = await fetchMedia(item, type);
		const caption = `📌 ${item.title || item.description || (item.isVideo ? "Video" : "Image")}`
			+ (item.author ? `\n👤 ${item.author}` : "")
			+ (item.likes ? `\n❤️ ${shortNumber(item.likes)}` : "")
			+ (item.link ? `\n🔗 ${item.link}` : "");
		const attachment = media.stream || await getStreamFromURL(media.url, `pinterest_${Date.now()}.${media.ext}`);
		if (!attachment)
			throw new Error("empty attachment");
		const payload = { body: caption, attachment };
		if (replyTo)
			message.reply(payload, () => { });
		else
			await message.reply(payload);
		react(api, event.messageID, "✅");
	}
	catch (err) {
		react(api, event.messageID, "❌");
		await message.reply(getLang("error", err.message || JSON.stringify(err)));
	}
}

module.exports = {
	config: {
		name: "pinterest",
		aliases: ["pin"],
		version: "1.0",
		author: "Neoaz 🐊",
		countDown: 5,
		role: 0,
		description: {
			en: "Search Pinterest and browse the results as a Pinterest board (images or videos)"
		},
		category: "media",
		guide: {
			en: "   {pn} [-i | -v] <keyword>"
				+ "\n   -i: search image pins (default)"
				+ "\n   -v: search video pins"
				+ "\n   Example: {pn} -v cats"
				+ "\n"
				+ "\n   The board shows numbered pins. Reply with:"
				+ "\n    a number  → get that image/video"
				+ "\n    next      → show the next page"
				+ "\n    prev      → show the previous page"
				+ "\n    cancel    → close the board"
		}
	},

	langs: {
		en: {
			error: "An error occurred: %1",
			noResult: "No result found for \"%1\"",
			busy: "Pinterest is not responding right now, please try again in a few minutes.",
			invalidReply: "Please reply with a number between 1 and %1, or \"next\", \"prev\", \"cancel\"",
			noMore: "There is no %1 page",
			cancelled: "Closed the Pinterest board."
		}
	},

	onStart: async function ({ api, args, event, message, getLang, commandName }) {
		let type = "image";
		const rest = [];
		for (const arg of args) {
			if (arg === "-v" || arg === "--video" || arg === "video")
				type = "video";
			else if (arg === "-i" || arg === "--image" || arg === "image")
				type = "image";
			else
				rest.push(arg);
		}
		const query = rest.join(" ").trim();
		if (!query)
			return message.SyntaxError();

		react(api, event.messageID, "⏳");
		let data;
		try {
			data = await apiSearch(type, query);
		}
		catch (err) {
			react(api, event.messageID, "❌");
			return message.reply(getLang("busy"));
		}

		const items = (data.results || []).map(result => toItem(result, type));
		if (!items.length) {
			react(api, event.messageID, "❌");
			return message.reply(getLang("noResult", query));
		}
		items.__query = query;

		const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
		const state = {
			type,
			query,
			items,
			bookmark: data.bookmark || null,
			hasMore: data.has_more !== false,
			page: 1,
			totalPages
		};

		try {
			await sendBoard({ api, event, message, getLang, commandName, state });
		}
		catch (err) {
			react(api, event.messageID, "❌");
			return message.reply(getLang("error", err.message || JSON.stringify(err)));
		}
	},

	onReply: async function ({ api, event, message, getLang, commandName, Reply }) {
		if (event.senderID !== Reply.author)
			return;
		const state = Reply.state;
		const body = cleanText(event.body).toLowerCase();

		if (body === "cancel" || body === "close" || body === "stop") {
			global.GoatBot.onReply.delete(Reply.messageID);
			api.unsendMessage(Reply.messageID);
			react(api, event.messageID, "✅");
			return message.reply(getLang("cancelled"));
		}

		const current = state.items.slice((state.page - 1) * ITEMS_PER_PAGE, state.page * ITEMS_PER_PAGE);

		const choice = parseInt(body);
		if (!isNaN(choice) && /^\d+$/.test(body)) {
			if (choice < 1 || choice > current.length) {
				react(api, event.messageID, "❌");
				return message.reply(getLang("invalidReply", current.length));
			}
			return sendMedia({ api, event, message, getLang, item: current[choice - 1], type: state.type, replyTo: true });
		}

		let targetPage;
		if (body === "next" || body === "n" || body === ">") {
			if (state.page < state.totalPages)
				targetPage = state.page + 1;
			else if (state.hasMore && state.bookmark)
				targetPage = state.page + 1;
			else
				return message.reply(getLang("noMore", "next"));
		}
		else if (body === "prev" || body === "previous" || body === "p" || body === "<") {
			if (state.page > 1)
				targetPage = state.page - 1;
			else
				return message.reply(getLang("noMore", "previous"));
		}
		else {
			react(api, event.messageID, "❌");
			return message.reply(getLang("invalidReply", current.length));
		}

		if (targetPage > state.totalPages && state.hasMore && state.bookmark) {
			react(api, event.messageID, "⏳");
			let data;
			try {
				data = await apiSearch(state.type, state.query, state.bookmark);
			}
			catch (err) {
				react(api, event.messageID, "❌");
				return message.reply(getLang("busy"));
			}
			const newItems = (data.results || []).map(result => toItem(result, state.type));
			if (!newItems.length) {
				state.hasMore = false;
				react(api, event.messageID, "❌");
				return message.reply(getLang("noMore", "next"));
			}
			state.items = state.items.concat(newItems);
			state.bookmark = data.bookmark || null;
			state.hasMore = data.has_more !== false && !!data.bookmark;
			state.totalPages = Math.ceil(state.items.length / ITEMS_PER_PAGE);
		}

		state.page = targetPage;
		global.GoatBot.onReply.delete(Reply.messageID);
		api.unsendMessage(Reply.messageID);
		try {
			await sendBoard({ api, event, message, getLang, commandName, state });
		}
		catch (err) {
			react(api, event.messageID, "❌");
			return message.reply(getLang("error", err.message || JSON.stringify(err)));
		}
	}
};

async function sendBoard({ api, event, message, commandName, state }) {
	const start = (state.page - 1) * ITEMS_PER_PAGE;
	const pageItems = state.items.slice(start, start + ITEMS_PER_PAGE);
	const stream = await renderBoard({
		items: pageItems,
		page: state.page,
		totalPages: state.totalPages,
		query: state.query,
		type: state.type
	});
	const body = buildBody(pageItems, state.page, state.totalPages, state.type, state.query);
	await new Promise((resolve, reject) => {
		message.reply({ body, attachment: stream }, (err, info) => {
			if (err)
				return reject(err);
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				author: event.senderID,
				state
			});
			resolve();
		});
	});
	react(api, event.messageID, "✅");
}
