import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const portIndex = process.argv.findIndex((arg) => arg === "--port" || arg === "-p");
const port = Number(portIndex === -1 ? process.env.PORT || 8080 : process.argv[portIndex + 1]);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
	throw new Error(`Invalid port: ${port}`);
}

const mimeTypes = {
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".mp3": "audio/mpeg",
	".ogg": "audio/ogg",
	".ttf": "font/ttf",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

function resolvePath(input = "") {
	const decoded = decodeURIComponent(String(input)).replace(/^[/\\]+/, "");
	const target = path.resolve(root, decoded);
	if (target !== root && !target.startsWith(root + path.sep)) {
		throw new Error("Path is outside the project directory");
	}
	return target;
}

function json(response, statusCode, value) {
	const body = JSON.stringify(value);
	response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
	response.end(body);
	return true;
}

function success(response, data) {
	return json(response, 200, { success: true, ...(data === undefined ? {} : { data }) });
}

function getLanAddresses(requestAddress = "") {
	const normalizedRequestAddress = requestAddress.replace(/^::ffff:/, "");
	const virtualInterfacePattern = /virtual|vmware|vbox|hyper-v|wsl|docker|vethernet|bluetooth|zerotier|tailscale/i;
	const zeroTierInterfacePattern = /zerotier/i;
	const preferredInterfacePattern = /wi-?fi|wlan|wireless|ethernet|无线|以太网/i;
	const addresses = [];

	for (const [name, entries] of Object.entries(networkInterfaces())) {
		for (const entry of entries || []) {
			if ((entry.family !== "IPv4" && entry.family !== 4) || entry.internal) continue;
			const isZeroTier = zeroTierInterfacePattern.test(name);
			if ((virtualInterfacePattern.test(name) && !isZeroTier) || /^169\.254\./.test(entry.address)) continue;
			let priority = 0;
			if (entry.address === normalizedRequestAddress) priority += 100;
			if (/^(10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(entry.address)) priority += 20;
			if (preferredInterfacePattern.test(name)) priority += 10;
			if (isZeroTier) priority += 15;
			addresses.push({ name, address: entry.address, priority, isZeroTier });
		}
	}

	return addresses.sort((a, b) => b.priority - a.priority || a.address.localeCompare(b.address));
}

async function readBody(request) {
	const chunks = [];
	for await (const chunk of request) chunks.push(chunk);
	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleApi(request, response, url) {
	try {
		if (url.pathname === "/networkInfo" && request.method === "GET") {
			const addresses = getLanAddresses(request.socket.localAddress);
			const lanAddress = addresses.find(({ isZeroTier }) => !isZeroTier)?.address || null;
			const zeroTierAddress = addresses.find(({ isZeroTier }) => isZeroTier)?.address || null;
			return success(response, {
				addresses: addresses.map(({ name, address, isZeroTier }) => ({ name, address, isZeroTier })),
				preferredAddress: lanAddress || zeroTierAddress,
				zeroTierAddress,
				webPort: port,
				multiplayerPort: 8082,
			});
		}
		if (url.pathname === "/readFile") {
			const data = await fs.readFile(resolvePath(url.searchParams.get("fileName")));
			return success(response, Array.from(data));
		}
		if (url.pathname === "/readFileAsText") {
			const data = await fs.readFile(resolvePath(url.searchParams.get("fileName")), "utf8");
			return success(response, data);
		}
		if (url.pathname === "/writeFile" && request.method === "POST") {
			const body = await readBody(request);
			const data = typeof body.data === "string" ? body.data : Buffer.from(body.data || []);
			const target = resolvePath(body.path);
			await fs.mkdir(path.dirname(target), { recursive: true });
			await fs.writeFile(target, data);
			return success(response);
		}
		if (url.pathname === "/removeFile") {
			await fs.rm(resolvePath(url.searchParams.get("fileName")), { force: true });
			return success(response);
		}
		if (url.pathname === "/createDir") {
			await fs.mkdir(resolvePath(url.searchParams.get("dir")), { recursive: true });
			return success(response);
		}
		if (url.pathname === "/removeDir") {
			await fs.rm(resolvePath(url.searchParams.get("dir")), { recursive: true, force: true });
			return success(response);
		}
		if (url.pathname === "/getFileList") {
			const entries = await fs.readdir(resolvePath(url.searchParams.get("dir")), { withFileTypes: true });
			return success(response, {
				folders: entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
				files: entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
			});
		}
		return false;
	} catch (error) {
		json(response, 400, { success: false, errorMsg: error instanceof Error ? error.message : String(error) });
		return true;
	}
}

const server = createServer(async (request, response) => {
	const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
	if (await handleApi(request, response, url)) return;
	try {
		const requested = url.pathname === "/" ? "/index.html" : url.pathname;
		const file = resolvePath(requested);
		const stat = await fs.stat(file);
		if (!stat.isFile()) throw new Error("Not a file");
		response.writeHead(200, {
			"Content-Type": mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
			"Cache-Control": "no-cache",
		});
		response.end(await fs.readFile(file));
	} catch {
		json(response, 404, { success: false, errorMsg: "Not found" });
	}
});

server.listen(port, "0.0.0.0", () => {
	console.log(`Web server listening on http://0.0.0.0:${port}`);
});
