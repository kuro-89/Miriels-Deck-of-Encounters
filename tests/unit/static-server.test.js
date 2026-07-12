import { afterEach, describe, expect, test } from "vitest";
import { createStaticServer } from "../../server.js";

let server;

afterEach(async () => {
  if (server?.listening) {
    await new Promise(resolve => server.close(resolve));
  }
});

async function startServer() {
  server = createStaticServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

describe("lokaler statischer Node-Server", () => {
  test("liefert index.html und JavaScript mit passenden MIME-Typen aus", async () => {
    const baseUrl = await startServer();
    const htmlResponse = await fetch(`${baseUrl}/`);
    const jsResponse = await fetch(`${baseUrl}/js/app.js`);

    expect(htmlResponse.status).toBe(200);
    expect(htmlResponse.headers.get("content-type")).toContain("text/html");
    expect(await htmlResponse.text()).toContain("Miriel's Deck of Encounters");

    expect(jsResponse.status).toBe(200);
    expect(jsResponse.headers.get("content-type")).toContain("text/javascript");
  });

  test("liefert für fehlende Dateien 404", async () => {
    const baseUrl = await startServer();
    const response = await fetch(`${baseUrl}/existiert-nicht.txt`);
    expect(response.status).toBe(404);
  });

  test("weist nicht unterstützte HTTP-Methoden zurück", async () => {
    const baseUrl = await startServer();
    const response = await fetch(`${baseUrl}/`, { method: "POST" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
  });
});
