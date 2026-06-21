"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const DEFAULT_PORT = 4173;
const DEFAULT_HOST = "0.0.0.0";
const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  response.end(body);
}

function resolveRequestedFile(root, requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(String(requestUrl).split(/[?#]/, 1)[0]);
  } catch {
    return null;
  }

  if (pathname.includes("\0") || pathname.includes("\\")) return null;

  const pathSegments = pathname.split("/");
  if (pathSegments.includes("..")) return null;

  const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(root, requestedPath);
  const relativePath = path.relative(root, filePath);

  if (
    relativePath === "" ||
    relativePath.startsWith(`..${path.sep}`) ||
    relativePath === ".." ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return filePath;
}

function createRequestHandler(root) {
  const absoluteRoot = path.resolve(root);

  return (request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) {
      send(response, 405, "Method not allowed", { Allow: "GET, HEAD" });
      return;
    }

    const filePath = resolveRequestedFile(absoluteRoot, request.url);
    if (!filePath) {
      send(response, 403, "Forbidden");
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError?.code === "ENOENT" || statError?.code === "ENOTDIR" || stats?.isDirectory()) {
        send(response, 404, "Not found");
        return;
      }
      if (statError) {
        send(response, 500, "Internal server error");
        return;
      }

      const headers = {
        "Content-Type": CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Content-Length": stats.size,
        "X-Content-Type-Options": "nosniff",
      };
      response.writeHead(200, headers);

      if (request.method === "HEAD") {
        response.end();
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.on("error", () => {
        if (!response.headersSent) send(response, 500, "Internal server error");
        else response.destroy();
      });
      stream.pipe(response);
    });
  };
}

function createServer({ root = __dirname } = {}) {
  return http.createServer(createRequestHandler(root));
}

if (require.main === module) {
  const port = Number(process.env.PORT || DEFAULT_PORT);
  const host = process.env.HOST || DEFAULT_HOST;

  createServer().listen(port, host, () => {
    console.log(`Side Work Finder: http://127.0.0.1:${port}`);
    console.log(`Same Wi-Fi devices: http://<your-pc-ip>:${port}`);
  });
}

module.exports = {
  createServer,
  createRequestHandler,
  resolveRequestedFile,
};
