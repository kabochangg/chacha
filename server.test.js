"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createServer, resolveRequestedFile } = require("./server");

const root = __dirname;

function request(server, pathname, options = {}) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const requestObject = require("node:http").request(
      {
        host: "127.0.0.1",
        port: address.port,
        path: pathname,
        method: options.method || "GET",
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    requestObject.on("error", reject);
    requestObject.end();
  });
}

test("ルートURLをindex.htmlへ解決する", () => {
  assert.equal(resolveRequestedFile(root, "/"), path.join(root, "index.html"));
});

test("作業フォルダー外へのパスを拒否する", () => {
  assert.equal(resolveRequestedFile(root, "/../package.json"), null);
  assert.equal(resolveRequestedFile(root, "/%2e%2e/package.json"), null);
});

test("静的ファイル、HEAD、404、未対応メソッドを処理する", async (context) => {
  const server = createServer({ root });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const page = await request(server, "/");
  assert.equal(page.statusCode, 200);
  assert.match(page.headers["content-type"], /text\/html/);
  assert.match(page.body, /副業タイプ診断/);
  assert.match(page.body, /id="next-button" type="submit" hidden>結果を見る/);
  assert.doesNotMatch(page.body, /id="next-button"[^>]*>次へ/);

  const head = await request(server, "/data.js", { method: "HEAD" });
  assert.equal(head.statusCode, 200);
  assert.equal(head.body, "");

  assert.equal((await request(server, "/missing-file")).statusCode, 404);
  assert.equal((await request(server, "/", { method: "POST" })).statusCode, 405);
});
