#!/usr/bin/env node
import { chromium } from "playwright";

const BASE = process.env.PORTAL_URL || "http://127.0.0.1:8766";
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const externalRequests = [];
page.on("pageerror", error => errors.push("pageerror: " + error.message));
page.on("request", request => {
  if (new URL(request.url()).origin !== new URL(BASE).origin) externalRequests.push(request.url());
});
page.on("response", response => {
  if (response.url().startsWith(BASE) && response.status() >= 400) errors.push("HTTP " + response.status() + " " + response.url());
});

try {
  const response = await page.goto(BASE + "/funny-generators/", { waitUntil: "domcontentloaded" });
  if (!response || response.status() !== 200) errors.push("Generator page did not return HTTP 200");
  await page.waitForSelector("#generate");
  const modes = await page.locator("[data-mode]").count();
  if (modes !== 14) errors.push("Expected 14 generator modes, got " + modes);

  for (const button of await page.locator("[data-mode]").all()) {
    await button.click();
    await page.locator("#generate").click();
    const result = await page.locator("#result").innerText();
    if (!result.trim()) errors.push("Empty result for mode " + await button.getAttribute("data-mode"));
  }

  await page.locator('[data-mode="mom"]').click();
  const payload = '<img src=x onerror=alert(1)>';
  await page.locator("#activity").fill(payload);
  await page.locator("#generate").click();
  const visible = await page.locator("#result").innerText();
  if (!visible.includes(payload)) errors.push("Custom text was not preserved as plain text");
  if (await page.locator("#result img").count()) errors.push("Custom text created an HTML element (possible XSS)");

  await page.locator("#five").click();
  if (await page.locator("#options li").count() !== 5) errors.push("Five-alternatives button did not render five options");
  await page.locator("#options li:first-child button").click();
  if ((await page.locator("#result").innerText()).trim() === "") errors.push("Selecting an alternative did not update the main result");

  const metadata = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || "",
    canonical: document.querySelector('link[rel="canonical"]')?.href || "",
    h1: document.querySelectorAll("h1").length,
    appScripts: [...document.scripts].filter(script => script.src && new URL(script.src).origin !== location.origin).length
  }));
  if (!metadata.title || !metadata.description || !metadata.canonical || metadata.h1 !== 1 || metadata.appScripts) {
    errors.push("SEO/security metadata check failed: " + JSON.stringify(metadata));
  }
  if (externalRequests.length) errors.push("Unexpected external network request: " + externalRequests.join(", "));
} finally {
  await browser.close();
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Funny generator smoke tests passed.");
}
