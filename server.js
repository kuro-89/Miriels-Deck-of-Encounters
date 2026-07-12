import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3000;

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"]
]);

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parsePort(value) {
  const port = Number.parseInt(value ?? "", 10);
  return Number.isInteger(port) && port >= 0 && port <= 65535
    ? port
    : DEFAULT_PORT;
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl ?? "/", "http://localhost");
  let pathname;

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const normalizedPath = normalize(relativePath);
  const absolutePath = resolve(PROJECT_ROOT, normalizedPath);
  const rootPrefix = PROJECT_ROOT.endsWith(sep) ? PROJECT_ROOT : `${PROJECT_ROOT}${sep}`;

  if (absolutePath !== PROJECT_ROOT && !absolutePath.startsWith(rootPrefix)) {
    return null;
  }

  return absolutePath;
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(message);
}

export function createStaticServer() {
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      sendText(response, 405, "Method Not Allowed\n");
      return;
    }

    let filePath = resolveRequestPath(request.url);
    if (!filePath) {
      sendText(response, 400, "Bad Request\n");
      return;
    }

    try {
      let fileStats = await stat(filePath);
      if (fileStats.isDirectory()) {
        filePath = join(filePath, "index.html");
        fileStats = await stat(filePath);
      }

      if (!fileStats.isFile()) {
        sendText(response, 404, "Not Found\n");
        return;
      }

      response.writeHead(200, {
        "Content-Type": MIME_TYPES.get(extname(filePath).toLowerCase()) ?? "application/octet-stream",
        "Content-Length": fileStats.size,
        "Cache-Control": "no-cache"
      });

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      const stream = createReadStream(filePath);
      stream.on("error", () => {
        if (!response.headersSent) sendText(response, 500, "Internal Server Error\n");
        else response.destroy();
      });
      stream.pipe(response);
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
        sendText(response, 404, "Not Found\n");
        return;
      }

      console.error(error);
      sendText(response, 500, "Internal Server Error\n");
    }
  });
}

function startFromCommandLine() {
  const host = readArgument("--host") ?? process.env.HOST ?? DEFAULT_HOST;
  const port = parsePort(readArgument("--port") ?? process.env.PORT);
  const server = createStaticServer();

  server.on("error", error => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} ist bereits belegt. Beende den anderen Server oder wähle einen anderen Port.`);
    } else {
      console.error("Der lokale Server konnte nicht gestartet werden:", error);
    }
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : port;
    console.log(`Miriel’s Deck läuft unter http://${host}:${activePort}`);
    console.log("Beenden mit Strg+C.");
  });

  const stop = () => server.close(() => process.exit(0));
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startFromCommandLine();
}
