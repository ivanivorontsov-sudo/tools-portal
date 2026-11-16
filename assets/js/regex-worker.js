"use strict";

self.onmessage = event => {
  const { pattern, text, maxMatches = 500 } = event.data || {};
  try {
    if (typeof pattern !== "string" || typeof text !== "string") throw new Error("Некорректные входные данные.");
    if (pattern.length > 256 || text.length > 20000) throw new Error("Превышен лимит размера ввода.");
    const expression = new RegExp(pattern, "g");
    const matches = [];
    let count = 0;
    let match;
    while ((match = expression.exec(text)) !== null) {
      count++;
      if (matches.length < maxMatches) matches.push(match[0]);
      if (match[0] === "") expression.lastIndex += 1;
    }
    self.postMessage({ ok: true, count, matches });
  } catch (error) {
    self.postMessage({ ok: false, error: error && error.message ? error.message : "Ошибка регулярного выражения." });
  }
};