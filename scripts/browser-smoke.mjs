#!/usr/bin/env node
/** Browser smoke tests for every active tool in Tools Portal. */
import fs from "node:fs";
import { chromium } from "playwright";

const ROOT = process.cwd();
const BASE = process.env.PORTAL_URL || "http://127.0.0.1:8766";
const source = fs.readFileSync(ROOT + "/assets/js/tools-data.js", "utf8");
const tools = source.split("\n").filter(line => line.includes("{ id:")).map(line => ({
  id: (line.match(/id:\s*"([^"]+)"/) || [])[1],
  name: (line.match(/name:\s*"([^"]+)"/) || [])[1],
  category: (line.match(/category:\s*"([^"]+)"/) || [])[1],
  client: /client:\s*true/.test(line),
  external: /externalUrl:/.test(line)
})).filter(tool => tool.id);
const active = tools.filter(tool => tool.client);
const errors = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
const page = await context.newPage();
page.setDefaultTimeout(7000);
let pageErrors = [];
let localFailures = [];
let externalRequests = 0;
page.on("pageerror", error => pageErrors.push(error.message));
page.on("response", response => {
  if (response.url().startsWith(BASE) && response.status() >= 400) localFailures.push(response.status() + " " + response.url());
});
page.on("requestfailed", request => {
  if (request.url().startsWith(BASE)) localFailures.push("failed " + request.url());
});
page.on("request", request => {
  if (!request.url().startsWith(BASE)) externalRequests++;
});

function record(label) {
  for (const error of pageErrors) errors.push(label + ": " + error);
  for (const failure of [...new Set(localFailures)]) errors.push(label + ": local asset " + failure);
  pageErrors = [];
  localFailures = [];
}
async function openTool(toolOrId) {
  const tool = typeof toolOrId === "string" ? tools.find(item => item.id === toolOrId) : toolOrId;
  if (!tool) { errors.push(String(toolOrId) + ": tool definition missing"); return; }
  pageErrors = [];
  localFailures = [];
  await page.evaluate(id => { window.location.hash = "tool/" + id; }, tool.id);
  await page.waitForFunction(name => {
    const heading = document.querySelector("#app h1");
    return heading && heading.textContent.trim() === name;
  }, tool.name, { timeout: 7000 }).catch(() => errors.push(tool.id + ": tool heading not rendered"));
  record(tool.id);
}

const response = await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
if (!response || response.status() >= 400) errors.push("index.html: page did not load");
await page.waitForSelector("#app", { timeout: 7000 }).catch(() => errors.push("index.html: app root missing"));
record("index");

// Category shortcuts must jump to the right section on the all-in-one page.
const categoryIds = ["image", "video", "audio", "document", "utility"];
const categoryNames = { image: "Изображения", video: "Видео", audio: "Аудио", document: "Документы", utility: "Утилиты" };
for (const key of categoryIds) {
  if (!(await page.locator('[data-jump="' + key + '"]').count())) errors.push("index: missing quick navigation for " + key);
  if (!(await page.locator("#category-" + key).count())) errors.push("index: missing category section " + key);
}
await page.locator('[data-jump="document"]').click();
await page.waitForFunction(() => window.scrollY > 0, null, { timeout: 3000 }).catch(() => errors.push("index: category shortcut did not scroll"));
record("category shortcuts");

// Each category is also a real standalone HTML page with the expected cards.
for (const key of categoryIds) {
  const categoryResponse = await page.goto(BASE + "/categories/" + key + ".html", { waitUntil: "domcontentloaded" });
  if (!categoryResponse || categoryResponse.status() >= 400) errors.push("category page " + key + ": page did not load");
  await page.waitForFunction(name => document.querySelector("#app h1")?.textContent.trim() === name, categoryNames[key], { timeout: 7000 })
    .catch(() => errors.push("category page " + key + ": heading missing"));
  const expectedCount = tools.filter(tool => tool.category === key).length;
  const actualCount = await page.locator("#app .tool-card").count();
  if (actualCount !== expectedCount) errors.push("category page " + key + ": expected " + expectedCount + " cards, got " + actualCount);
  record("category page " + key);
}
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#app .tool-card", { timeout: 7000 }).catch(() => errors.push("index: catalog did not return after category tests"));

for (const tool of active) {
  await openTool(tool);
  if (tool.external) {
    const link = page.locator('#app a[href]').first();
    if (!(await link.count())) errors.push(tool.id + ": external tool route has no link");
  } else {
    const text = (await page.locator("#app").innerText().catch(() => "")).trim();
    if (!text) errors.push(tool.id + ": empty tool interface");
  }
}

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=", "base64");
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#16a34a"/></svg>');
const imageTests = [
  "jpg-to-png","png-to-jpg","webp-to-png","png-to-webp","jpg-to-webp",
  "svg-to-png","bmp-to-jpg","ico-to-png","gif-to-png","png-to-ico",
  "image-to-base64","image-resizer","image-compressor"
];
for (const id of imageTests) {
  await openTool(tools.find(tool => tool.id === id));
  const isSvg = id === "svg-to-png";
  await page.locator("#file-input").setInputFiles({
    name: isSvg ? "audit.svg" : "audit.png",
    mimeType: isSvg ? "image/svg+xml" : "image/png",
    buffer: isSvg ? svg : png
  });
  await page.locator("#convert-btn").click();
  await page.waitForFunction(() => {
    const result = document.querySelector("#result");
    if (!result || result.classList.contains("hidden")) return false;
    if (result.querySelector(".fa-spinner")) return false;
    return Boolean(result.querySelector('a[download]') || result.querySelector("textarea[readonly]") || result.querySelector(".bg-red-50"));
  }, null, { timeout: 10000 }).catch(() => errors.push(id + ": conversion did not finish with an output"));
  const output = await page.locator("#result").innerText().catch(() => "");
  if (pageErrors.length) errors.push(id + ": " + pageErrors.join("; "));
  if (await page.locator("#result .bg-red-50").count()) errors.push(id + ": conversion returned an error: " + output);
  if (id === "png-to-ico") {
    if (!(await page.locator('#result a[download="converted.ico"]').count())) errors.push(id + ": ICO file was not generated");
  } else if (id === "image-to-base64") {
    if (!(await page.locator("#result textarea[readonly]").count())) errors.push(id + ": Base64 image output is missing");
  } else if (!(await page.locator("#result a[download]").count())) {
    errors.push(id + ": downloadable converted image is missing");
  }
  record(id + " conversion");
}

// SVG files may use internal fragments, but must not trigger external requests.
let externalSvgRequests = 0;
await page.route("https://example.invalid/**", async route => {
  externalSvgRequests++;
  await route.abort();
});
await openTool("svg-to-png");
await page.locator("#file-input").setInputFiles({
  name: "external-reference.svg",
  mimeType: "image/svg+xml",
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><image xlink:href="https://example.invalid/tracker.png" width="16" height="16"/></svg>')
});
await page.locator("#convert-btn").click();
await page.waitForFunction(() => Boolean(document.querySelector("#result .bg-red-50")), null, { timeout: 5000 })
  .catch(() => errors.push("svg-to-png: external resource was not rejected"));
if (externalSvgRequests !== 0) errors.push("svg-to-png: attempted to request an external resource");
await page.unroute("https://example.invalid/**");
record("SVG external-resource rejection");

// ZIP tools: create a real archive, inspect it, and download an extracted file.
let zipScenarios = 0;
try {
  await openTool("zip-create");
  await page.locator("#zip-create-files").setInputFiles([
    { name: "first.txt", mimeType: "text/plain", buffer: Buffer.from("alpha") },
    { name: "second.txt", mimeType: "text/plain", buffer: Buffer.from("beta") }
  ]);
  await page.locator("#zip-create-name").fill("audit-bundle.zip");
  await page.locator("#zip-create-run").click();
  await page.waitForSelector("#zip-create-status a[download]", { timeout: 15000 });
  const createDownloadPromise = page.waitForEvent("download", { timeout: 10000 });
  await page.locator("#zip-create-status a[download]").click();
  const createdDownload = await createDownloadPromise;
  if (createdDownload.suggestedFilename() !== "audit-bundle.zip") errors.push("zip-create: wrong download name");
  const createdBytes = fs.readFileSync(await createdDownload.path());
  const createdContent = await page.evaluate(async bytes => {
    const archive = await window.JSZip.loadAsync(new Uint8Array(bytes));
    return {
      names: Object.keys(archive.files).filter(name => !archive.files[name].dir).sort(),
      first: await archive.file("first.txt").async("string"),
      second: await archive.file("second.txt").async("string")
    };
  }, [...createdBytes]);
  if (createdContent.names.join(",") !== "first.txt,second.txt" || createdContent.first !== "alpha" || createdContent.second !== "beta") {
    errors.push("zip-create: generated archive contents are incorrect");
  }
  zipScenarios++;

  const fixture = await page.evaluate(async () => {
    const archive = new window.JSZip();
    archive.file("folder/hello.txt", "hello from zip");
    archive.file("<img src=x onerror=alert(1)>.txt", "filename must be rendered as text");
    return [...new Uint8Array(await archive.generateAsync({ type: "uint8array" }))];
  });
  await openTool("zip-extract");
  await page.locator("#zip-extract-file").setInputFiles({
    name: "fixture.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(fixture)
  });
  await page.locator("#zip-extract-run").click();
  await page.waitForSelector("#zip-extract-list button", { timeout: 10000 });
  if (await page.locator("#zip-extract-list .font-medium").count() !== 2) errors.push("zip-extract: expected two file entries");
  if (await page.locator("#zip-extract-list img").count() !== 0) errors.push("zip-extract: filename was interpreted as HTML");
  const firstRow = page.locator("#zip-extract-list > div").filter({ hasText: "folder/hello.txt" }).first();
  const extractDownloadPromise = page.waitForEvent("download", { timeout: 10000 });
  await firstRow.locator("button").click();
  const extractedDownload = await extractDownloadPromise;
  if (!extractedDownload.suggestedFilename().includes("hello.txt")) errors.push("zip-extract: wrong extracted filename");
  const extractedBytes = fs.readFileSync(await extractedDownload.path());
  if (extractedBytes.toString("utf8") !== "hello from zip") errors.push("zip-extract: extracted bytes do not match source");
  zipScenarios++;
  record("ZIP tools");
} catch (error) {
  errors.push("ZIP tools interaction failed: " + error.message);
  record("ZIP tools");
}

const textTests = [
  ["password-generator", async () => {
    await page.locator("#gen-pw").click();
    const value = await page.locator("#pw-result").innerText();
    if (value.length !== 16) errors.push("password-generator: expected a 16-character password");
  }],
  ["uuid-generator", async () => {
    await page.locator("#gen-uuid").click();
    const value = await page.locator("#uuid-result").innerText();
    if (!/^[0-9a-f-]{36}$/i.test(value)) errors.push("uuid-generator: invalid UUID output");
  }],
  ["qr-generator", async () => {
    const payload = "https://example.com/qr-image-smoke";
    await page.locator("#qr-text").fill(payload);
    await page.locator("#gen-qr").click();
    await page.waitForSelector("#qr-result img", { timeout: 5000 });

    const dataUrl = await page.evaluate(value => {
      const qr = window.qrcode(0, "M");
      qr.addData(value, "Byte");
      qr.make();
      const markup = qr.createImgTag(5, 12, "QR");
      const match = markup.match(/src=["']([^"']+)["']/);
      return match ? match[1] : "";
    }, payload);
    if (!dataUrl.startsWith("data:image/")) {
      errors.push("qr-generator: local QR image fixture was not created");
      return;
    }
    const mimeType = dataUrl.slice(5, dataUrl.indexOf(";"));
    const extension = mimeType === "image/png" ? "png" : "gif";
    const imageBuffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
    const externalBefore = externalRequests;
    await page.locator("#qr-scan-file").setInputFiles({
      name: "qr-smoke." + extension,
      mimeType,
      buffer: imageBuffer
    });
    await page.waitForFunction(() =>
      document.querySelector("#qr-scan-status")?.textContent.includes("распознан") ||
      document.querySelector("#qr-scan-status")?.textContent.includes("не найден") ||
      document.querySelector("#qr-scan-status")?.textContent.includes("Не удалось"),
      null,
      { timeout: 10000 }
    );
    const scanStatus = await page.locator("#qr-scan-status").innerText();
    if (!scanStatus.includes("распознан")) errors.push("qr-generator: image scan failed: " + scanStatus);
    if ((await page.locator("#qr-check-input").inputValue()) !== payload) {
      errors.push("qr-generator: decoded QR payload does not match the source");
    }
    if (!(await page.locator("#qr-analysis").innerText()).includes("example.com")) {
      errors.push("qr-generator: decoded URL was not analysed");
    }
    if (externalRequests !== externalBefore) {
      errors.push("qr-generator: scanning an image triggered an external network request");
    }

    await page.locator("#qr-check-input").fill("http://user:secret@xn--e1afmkfd.xn--p1ai:8080/?utm_source=smoke");
    await page.locator("#qr-analyze").click();
    const warnings = await page.locator("#qr-analysis").innerText();
    for (const term of ["HTTP", "Punycode", "пароль", "порт", "отслеживания"]) {
      if (!warnings.includes(term)) errors.push("qr-generator: missing warning for " + term);
    }
    if (await page.locator("#qr-analysis a").count()) {
      errors.push("qr-generator: credential-bearing URL was made clickable");
    }

    await page.locator("#qr-check-input").fill("javascript:alert(1)");
    await page.locator("#qr-analyze").click();
    if (!(await page.locator("#qr-analysis").innerText()).includes("опасные признаки")) {
      errors.push("qr-generator: dangerous URL scheme was not rejected");
    }
    if (await page.locator("#qr-analysis a").count()) {
      errors.push("qr-generator: dangerous scheme received an open link");
    }
  }],
  ["base64-encoder", async () => {
    await page.locator("#b64-input").fill("audit");
    await page.locator("#b64-encode").click();
    if ((await page.locator("#b64-output").inputValue()) !== "YXVkaXQ=") errors.push("base64-encoder: wrong UTF-8 Base64 output");
  }],
  ["json-formatter", async () => {
    await page.locator("#json-input").fill('{"audit":true}');
    await page.locator("#json-format").click();
    if (!(await page.locator("#json-output").innerText()).includes('"audit"')) errors.push("json-formatter: no formatted JSON");
  }],
  ["hash-generator", async () => {
    await page.locator("#hash-input").fill("audit");
    await page.locator("#gen-hash").click();
    await page.waitForFunction(() => document.querySelector("#hash-result")?.innerText.includes("SHA-256"));
  }],
  ["case-converter", async () => {
    await page.locator("#case-input").fill("audit test");
    await page.locator('.case-btn[data-case="upper"]').click();
    if ((await page.locator("#case-output").inputValue()) !== "AUDIT TEST") errors.push("case-converter: uppercase conversion failed");
  }],
  ["word-counter", async () => {
    await page.locator("#wc-input").fill("one two three");
    if ((await page.locator("#wc-words").innerText()) !== "3") errors.push("word-counter: incorrect word count");
  }],
  ["unit-converter", async () => {
    await page.locator("#unit-from").fill("2");
    if (!(await page.locator("#unit-to").inputValue())) errors.push("unit-converter: no result");
  }],
  ["color-picker", async () => {
    await page.locator("#color-input").fill("#ff0000");
    if ((await page.locator("#color-hex").innerText()).toLowerCase() !== "#ff0000") errors.push("color-picker: HEX value did not update");
  }],
  ["lorem-ipsum", async () => {
    await page.locator("#gen-lorem").click();
    if (!(await page.locator("#lorem-output").inputValue()).trim()) errors.push("lorem-ipsum: no generated text");
  }],
  ["timestamp-converter", async () => {
    await page.locator("#ts-now").click();
    if (!(await page.locator("#ts-result").innerText()).trim()) errors.push("timestamp-converter: no current time");
  }],
  ["url-encoder", async () => {
    await page.locator("#url-input").fill("/тест");
    await page.locator("#url-encode").click();
    if (!(await page.locator("#url-output").inputValue()).includes("%2F")) errors.push("url-encoder: URL encoding failed");
  }],
  ["regex-tester", async () => {
    await page.locator("#regex-pattern").fill("\\d+");
    await page.locator("#regex-text").fill("audit123");
    await page.locator("#regex-test").click();
    await page.waitForFunction(() => document.querySelector("#regex-result")?.innerText.includes("123"), null, { timeout: 5000 });
    if (!(await page.locator("#regex-result").innerText()).includes("123")) errors.push("regex-tester: match result missing");
  }]
];
for (const [id, test] of textTests) {
  await openTool(id);
  try { await test(); } catch (error) { errors.push(id + ": interaction failed: " + error.message); }
  record(id + " interaction");
}

// Verify mobile search survives its own re-render after each keystroke.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.locator("#mobile-search-input").fill("QR");
await page.waitForFunction(() => document.activeElement?.id === "mobile-search-input" && window._search === "QR");
if (!(await page.locator("#app").innerText()).includes("QR")) errors.push("mobile-search: filtering did not update the catalog");
record("mobile search");
await page.setViewportSize({ width: 1280, height: 900 });

// CSV with quoted commas, embedded newlines and escaped quotes must round-trip safely.
await openTool("csv-to-json");
await page.locator("#file-input").setInputFiles({
  name: "quoted.csv",
  mimeType: "text/csv",
  buffer: Buffer.from('name,note\r\nAlice,"hello, world"\r\nBob,"line one\nline two"\r\n')
});
await page.locator("#convert-btn").click();
await page.waitForFunction(() => document.querySelector("#result pre")?.textContent.includes("hello, world"));
const csvJson = await page.locator("#result pre").innerText();
if (!csvJson.includes("line two")) errors.push("csv-to-json: quoted multiline field was not parsed");

await openTool("json-to-csv");
await page.locator("#file-input").setInputFiles({
  name: "records.json",
  mimeType: "application/json",
  buffer: Buffer.from('[{"name":"Alice","note":"hello, \\"world\\""},{"name":"Bob","extra":"x"}]')
});
await page.locator("#convert-btn").click();
await page.waitForFunction(() => document.querySelector("#result pre")?.textContent.includes("extra"));
const csvText = await page.locator("#result pre").innerText();
if (!csvText.includes('"hello, ""world"""') || !csvText.includes("extra")) errors.push("json-to-csv: fields with commas/quotes or later-object keys were lost");
record("CSV round-trip");

// PDF.js core API must render documents without executing embedded PDF JavaScript.
await page.goto(BASE + "/pdf-master/", { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => Boolean(window.PDFLib), null, { timeout: 15000 });
const scriptedPdf = await page.evaluate(async () => {
  const doc = await window.PDFLib.PDFDocument.create();
  doc.addPage();
  doc.addJavaScript("security-smoke", "window.__pdfEmbeddedScriptRan = true;");
  return Array.from(await doc.save());
});
await page.locator("#files").setInputFiles({
  name: "scripted-test.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from(scriptedPdf)
});
await page.waitForFunction(() => document.querySelector("#page-count")?.textContent.includes("1"), null, { timeout: 15000 })
  .catch(() => errors.push("pdf-master: test PDF did not load"));
if (await page.evaluate(() => Boolean(window.__pdfEmbeddedScriptRan))) {
  errors.push("pdf-master: embedded JavaScript executed");
}
record("PDF embedded-script protection");

await browser.close();
console.log("Tools Portal: " + active.length + " active tools opened.");
console.log("Image conversions tested: " + imageTests.length + ".");
console.log("ZIP scenarios tested: " + zipScenarios + ".");
console.log("Text tools exercised: " + textTests.length + ".");
console.log("Errors: " + errors.length);
for (const error of errors) console.error("ERROR:", error);
if (errors.length) process.exitCode = 1;
