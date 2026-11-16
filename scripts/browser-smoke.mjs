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
page.on("pageerror", error => pageErrors.push(error.message));
page.on("response", response => {
  if (response.url().startsWith(BASE) && response.status() >= 400) localFailures.push(response.status() + " " + response.url());
});
page.on("requestfailed", request => {
  if (request.url().startsWith(BASE)) localFailures.push("failed " + request.url());
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
    await page.locator("#qr-text").fill("https://example.com/audit");
    await page.locator("#gen-qr").click();
    await page.waitForSelector("#qr-result img", { timeout: 5000 });
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
    if (!(await page.locator("#regex-result").innerText()).includes("123")) errors.push("regex-tester: match result missing");
  }]
];
for (const [id, test] of textTests) {
  await openTool(id);
  try { await test(); } catch (error) { errors.push(id + ": interaction failed: " + error.message); }
  record(id + " interaction");
}

await browser.close();
console.log("Tools Portal: " + active.length + " active tools opened.");
console.log("Image conversions tested: " + imageTests.length + ".");
console.log("Text tools exercised: " + textTests.length + ".");
console.log("Errors: " + errors.length);
for (const error of errors) console.error("ERROR:", error);
if (errors.length) process.exitCode = 1;
