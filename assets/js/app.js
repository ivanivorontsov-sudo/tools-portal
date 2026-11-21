// Tools Portal App
const app = document.getElementById('app');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');

// Theme
function initTheme() {
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('theme'); } catch (_) {}
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  document.documentElement.classList.toggle('dark', savedTheme === 'dark' || (!savedTheme && prefersDark));
}
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  } catch (_) {}
});
initTheme();

// Routing
function getRoute() {
  const hash = location.hash.slice(1) || '/';
  if (hash.startsWith('tool/')) {
    return { type: 'tool', id: hash.replace('tool/', '') };
  }
  return { type: 'home', category: hash === '/' ? null : hash };
}

function navigate(to) {
  location.hash = to;
}

// Catalog rendering helpers
function categoryPageHref(key) {
  return app.dataset.category ? "./" + key + ".html" : "categories/" + key + ".html";
}
function catalogHomeHref() {
  return app.dataset.category ? "../index.html" : "./";
}
function renderToolCards(tools) {
  return tools.map(function(tool) {
    const cat = CATEGORIES[tool.category] || CATEGORIES.utility;
    const status = tool.externalUrl
      ? '<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">Отдельный проект</span>'
      : tool.client
        ? '<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Готов</span>'
        : '<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Скоро</span>';
    return '<a href="#tool/' + encodeURIComponent(tool.id) + '" class="tool-card block p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition duration-200">' +
      '<div class="flex items-start justify-between gap-3 mb-3">' +
        '<div class="w-12 h-12 shrink-0 rounded-xl ' + cat.color + ' flex items-center justify-center text-xl"><i class="fas ' + escapeHtml(tool.icon) + '"></i></div>' +
        status +
      '</div>' +
      '<h3 class="font-semibold text-lg mb-1">' + escapeHtml(tool.name) + '</h3>' +
      '<p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">' + escapeHtml(tool.desc) + '</p>' +
    '</a>';
  }).join("");
}

// Home page and separate category pages
function renderHome(filterCategory = null, search = "") {
  const cats = Object.entries(CATEGORIES);
  const activeCategory = app.dataset.category || filterCategory;
  const isCategoryPage = Boolean(activeCategory);
  let tools = activeCategory ? TOOLS.filter(t => t.category === activeCategory) : TOOLS.slice();
  const q = String(search || "").trim().toLowerCase();
  if (q) {
    tools = tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  }

  const activeLocalCount = TOOLS.filter(tool => tool.client && !tool.externalUrl).length;
  const linkedProjectCount = TOOLS.filter(tool => Boolean(tool.externalUrl)).length;
  const upcomingCount = TOOLS.filter(tool => !tool.client && !tool.externalUrl).length;
  const mobileSearch = '<div class="md:hidden mb-6">' +
    '<input id="mobile-search-input" type="search" value="' + escapeHtml(window._search || "") + '" placeholder="Поиск по каталогу..." ' +
    'oninput="window._search = this.value; render()" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" />' +
    '</div>';

  if (isCategoryPage) {
    const category = CATEGORIES[activeCategory];
    if (!category) {
      app.innerHTML = '<div class="text-center py-20"><h1 class="text-2xl font-bold mb-4">Раздел не найден</h1><a href="' + catalogHomeHref() + '" class="text-brand-600 hover:underline">← Все инструменты</a></div>';
      return;
    }
    const categoryNav = cats.map(([key, cat]) =>
      '<a href="' + categoryPageHref(key) + '" class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ' +
      (key === activeCategory ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700') +
      '"><i class="fas ' + cat.icon + '"></i>' + cat.name + '<span class="opacity-70">(' + TOOLS.filter(t => t.category === key).length + ')</span></a>'
    ).join("");
    app.innerHTML =
      '<div class="mb-6"><a href="' + catalogHomeHref() + '" class="text-sm text-brand-600 hover:underline">← Все инструменты</a>' +
      '<h1 class="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">' + category.name + '</h1>' +
      '<p class="mt-2 text-slate-600 dark:text-slate-400">' + tools.length + ' инструментов в разделе. Рабочие функции отмечены статусом «Готов», незавершённые — «Скоро».</p></div>' +
      '<nav class="category-page-nav flex flex-wrap gap-2 mb-7" aria-label="Другие разделы">' + categoryNav + '</nav>' +
      mobileSearch +
      (tools.length ? '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">' + renderToolCards(tools) + '</div>' :
        '<p class="text-center text-slate-500 py-20">По этому запросу ничего не найдено.</p>');
    return;
  }

  const quickNav = cats.map(([key, cat]) =>
    '<button type="button" class="category-jump-button" data-jump="' + key + '">' +
    '<i class="fas ' + cat.icon + '" aria-hidden="true"></i><span>' + cat.name + '</span>' +
    '<span class="category-jump-count">' + TOOLS.filter(t => t.category === key).length + '</span></button>'
  ).join("");

  const sections = cats.map(([key, cat]) => {
    const group = tools.filter(t => t.category === key);
    if (!group.length) return "";
    return '<section id="category-' + key + '" class="tool-category-section mb-12" aria-labelledby="category-title-' + key + '">' +
      '<div class="flex flex-wrap items-center justify-between gap-3 mb-5">' +
        '<div class="flex items-center gap-3"><div class="w-11 h-11 rounded-xl ' + cat.color + ' grid place-items-center text-xl"><i class="fas ' + cat.icon + '"></i></div>' +
        '<div><h2 id="category-title-' + key + '" class="text-2xl font-bold">' + cat.name + '</h2>' +
        '<p class="text-sm text-slate-500 dark:text-slate-400">' + group.length + ' найдено · всего в разделе ' + TOOLS.filter(t => t.category === key).length + '</p></div></div>' +
        '<a href="' + categoryPageHref(key) + '" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-sm font-semibold">Открыть отдельную страницу <i class="fas fa-arrow-right"></i></a>' +
      '</div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">' + renderToolCards(group) + '</div>' +
      '</section>';
  }).join("");

  app.innerHTML =
    '<div id="catalog-top" class="mb-8 text-center">' +
      '<h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"><span class="bg-gradient-to-r from-brand-600 to-cyan-500 bg-clip-text text-transparent">Каталог инструментов</span></h1>' +
      '<p class="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">Все ' + TOOLS.length + ' карточек собраны здесь, по темам. Можно перейти к нужному разделу кнопкой сверху или открыть его как отдельную страницу.</p>' +
      '<div class="flex flex-wrap justify-center gap-2 mt-5 text-sm text-slate-500 dark:text-slate-400">' +
        '<span class="rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-3 py-1">' + activeLocalCount + ' готовы</span>' +
        '<span class="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">' + linkedProjectCount + ' отдельных проекта</span>' +
        '<span class="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">' + upcomingCount + ' в разработке</span>' +
      '</div>' +
    '</div>' +
    '<nav class="category-quicknav mb-8" aria-label="Быстрый переход к разделу">' +
      '<div class="category-quicknav-inner"><span class="category-quicknav-label">Перейти к:</span>' + quickNav + '</div>' +
    '</nav>' +
    mobileSearch +
    (sections || '<p class="text-center text-slate-500 py-20">По этому запросу ничего не найдено.</p>');

  app.querySelectorAll("[data-jump]").forEach(button => {
    button.addEventListener("click", () => {
      const section = document.getElementById("category-" + button.dataset.jump);
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// Tool page
function renderTool(id) {
  const tool = TOOLS.find(t => t.id === id);
  if (!tool) {
    app.innerHTML = `<div class="text-center py-20"><h2 class="text-2xl font-bold mb-4">Инструмент не найден</h2><a href="#" class="text-brand-600 hover:underline">← На главную</a></div>`;
    return;
  }
  const cat = CATEGORIES[tool.category];
  if (tool.externalUrl) {
    app.innerHTML = `
      <div class="max-w-3xl mx-auto">
        <a href="#" class="text-sm text-brand-600 hover:underline flex items-center gap-1 mb-5"><i class="fas fa-arrow-left"></i> Назад к списку</a>
        <div class="p-7 sm:p-9 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div class="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 grid place-items-center text-3xl mb-5"><i class="fas ${tool.icon}"></i></div>
          <h1 class="text-3xl font-bold mb-3">${tool.name}</h1>
          <p class="text-slate-600 dark:text-slate-400 mb-5">${tool.desc}</p>
          <div class="flex flex-wrap gap-3">
            <a href="${tool.externalUrl}" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold"><i class="fas fa-arrow-up-right-from-square"></i> Открыть инструмент</a>
            <a href="${tool.externalUrl}privacy.html" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500">Политика конфиденциальности</a>
          </div>
          <p class="text-xs text-slate-500 mt-6">Инструмент открывается на основном сайте автора. Его собственная страница содержит описание обработки данных.</p>
        </div>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="mb-6">
      <a href="#" class="text-sm text-brand-600 hover:underline flex items-center gap-1 mb-4">
        <i class="fas fa-arrow-left"></i> Назад к списку
      </a>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center text-2xl">
          <i class="fas ${tool.icon}"></i>
        </div>
        <div>
          <h1 class="text-3xl font-bold">${tool.name}</h1>
          <p class="text-slate-500 dark:text-slate-400">${tool.desc}</p>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          ${renderToolUI(tool)}
        </div>
      </div>
      <div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm sticky top-24">
          <h3 class="font-semibold mb-3">Как пользоваться</h3>
          <ol class="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
            <li>Загрузите файл (или введите данные)</li>
            <li>Выберите параметры при необходимости</li>
            <li>Нажмите «Конвертировать»</li>
            <li>Скачайте результат</li>
          </ol>
          <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p class="text-xs text-slate-500">
              ${tool.client 
                ? '✅ Обработка происходит полностью в вашем браузере. Файлы не отправляются на сервер.' 
                : '⏳ Этот инструмент пока в разработке. Скоро появится полноценная конвертация.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Init tool specific logic
  initToolLogic(tool);
}

function renderToolUI(tool) {
  if (tool.id === 'zip-create') {
    return `
      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm">
          <p class="font-semibold mb-1">Выберите несколько файлов</p>
          <p class="text-slate-500">Архив создаётся локально. Ограничение: 100 файлов и 250 МБ суммарно.</p>
        </div>
        <label class="block text-sm font-medium mb-1" for="zip-create-files">Файлы для архива</label>
        <input id="zip-create-files" type="file" multiple class="block w-full text-sm" />
        <label class="block text-sm font-medium mb-1" for="zip-create-name">Имя архива</label>
        <input id="zip-create-name" type="text" maxlength="80" value="archive.zip" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900" />
        <button id="zip-create-run" type="button" class="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">Создать ZIP</button>
        <p id="zip-create-status" role="status" aria-live="polite" class="text-sm"></p>
      </div>`;
  }
  if (tool.id === 'zip-extract') {
    return `
      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm">
          <p class="font-semibold mb-1">Выберите ZIP-архив</p>
          <p class="text-slate-500">Локальное извлечение без загрузки на сервер. Максимум 100 МБ сжатого архива, 200 файлов и 250 МБ распакованных данных.</p>
        </div>
        <label class="block text-sm font-medium mb-1" for="zip-extract-file">ZIP-файл</label>
        <input id="zip-extract-file" type="file" accept=".zip,application/zip" class="block w-full text-sm" />
        <button id="zip-extract-run" type="button" class="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">Открыть архив</button>
        <p id="zip-extract-status" role="status" aria-live="polite" class="text-sm"></p>
        <div id="zip-extract-list" class="space-y-2"></div>
      </div>`;
  }

  // Text-based tools
  if (['password-generator', 'uuid-generator', 'lorem-ipsum', 'unit-converter', 'color-picker', 'base64-encoder', 'url-encoder', 'json-formatter', 'hash-generator', 'case-converter', 'word-counter', 'timestamp-converter', 'regex-tester', 'qr-generator'].includes(tool.id)) {
    return renderTextTool(tool);
  }

  // File upload tools
  return `
    <div id="dropzone" class="dropzone border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center cursor-pointer transition hover:border-brand-500">
      <i class="fas fa-cloud-upload-alt text-4xl text-slate-400 mb-4"></i>
      <p class="font-medium mb-1">Перетащите файл сюда</p>
      <p class="text-sm text-slate-500">или нажмите для выбора</p>
      <input type="file" id="file-input" class="hidden" accept="${getAccept(tool)}" />
    </div>
    <div id="file-info" class="hidden mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl"></div>
    <div id="options" class="mt-6 space-y-4"></div>
    <button id="convert-btn" disabled class="mt-6 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition">
      Конвертировать
    </button>
    <div id="result" class="mt-6 hidden"></div>
  `;
}

function getAccept(tool) {
  const map = {
    'jpg-to-png': 'image/jpeg',
    'png-to-jpg': 'image/png',
    'webp-to-png': 'image/webp',
    'png-to-webp': 'image/png',
    'jpg-to-webp': 'image/jpeg',
    'svg-to-png': 'image/svg+xml',
    'bmp-to-jpg': 'image/bmp',
    'ico-to-png': 'image/x-icon,image/vnd.microsoft.icon',
    'gif-to-png': 'image/gif',
    'png-to-ico': 'image/png',
    'image-to-base64': 'image/*',
    'image-resizer': 'image/*',
    'image-compressor': 'image/jpeg,image/png,image/webp',
    'jpg-to-pdf': 'image/*',
    'favicon-generator': 'image/*',
    'audio-to-base64': 'audio/*',
  };
  return map[tool.id] || '*/*';
}

const QR_SHORTENER_HOSTS = new Set([
  "bit.ly", "t.co", "tinyurl.com", "is.gd", "cutt.ly",
  "rb.gy", "rebrand.ly", "shorturl.at", "ow.ly", "buff.ly"
]);

function inspectQrPayload(rawValue) {
  const value = String(rawValue || "").trim();
  const warnings = [];
  const add = (level, text) => warnings.push({ level, text });
  if (!value) {
    return { value, summary: "Введите содержимое QR-кода", level: "info", warnings, href: null, host: "" };
  }

  if (/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/.test(value)) {
    add("warning", "В строке есть управляющие или невидимые символы. Проверьте адрес посимвольно.");
  }
  if (value.length > 4096) {
    add("warning", "Содержимое необычно длинное. Не открывайте его, пока не разберётесь, зачем оно нужно.");
  }

  const schemeMatch = value.match(/^([a-z][a-z0-9+.-]*):/i);
  const dangerousSchemes = new Set(["javascript", "data", "file", "vbscript", "intent"]);
  if (schemeMatch && dangerousSchemes.has(schemeMatch[1].toLowerCase())) {
    add("danger", "Используется схема " + schemeMatch[1].toLowerCase() + ": она не является обычной веб-ссылкой и может запускать действие или открывать локальный ресурс.");
    return { value, summary: "Есть опасные признаки — не открывайте автоматически", level: "danger", warnings, href: null, host: "" };
  }

  let candidate = value;
  if (!schemeMatch && /^(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i.test(value)) {
    candidate = "https://" + value;
    add("warning", "В QR-коде не указана схема. Для анализа добавлено https://, но исходный текст не изменён.");
  } else if (schemeMatch && !["http", "https"].includes(schemeMatch[1].toLowerCase())) {
    const kind = schemeMatch[1].toLowerCase();
    add("info", "Это не обычная веб-ссылка (тип: " + kind + "). Приложение не запускает её и не выполняет действие.");
    return { value, summary: "QR-код содержит специальный тип данных", level: "info", warnings, href: null, host: "" };
  }

  let url;
  try {
    url = new URL(candidate);
  } catch (_) {
    add("info", "Содержимое не распознано как обычная веб-ссылка. Никаких действий не выполнено.");
    return { value, summary: "Текстовый или специальный QR-код", level: "info", warnings, href: null, host: "" };
  }

  if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
    add("danger", "Разрешены только обычные HTTP/HTTPS-ссылки. Другие схемы автоматически не открываются.");
    return { value, summary: "Ссылка не поддерживает безопасный предпросмотр", level: "danger", warnings, href: null, host: "" };
  }

  const host = url.hostname.toLowerCase();
  if (url.protocol === "http:") {
    add("warning", "Используется HTTP без шифрования. Содержимое соединения может быть перехвачено или изменено.");
  }
  if (url.username || url.password) {
    add("danger", "В адрес встроены имя пользователя или пароль. Такой URL может маскировать настоящий домен.");
  }
  if (host.split(".").some(label => label.startsWith("xn--"))) {
    add("warning", "Домен содержит Punycode. Проверьте написание: похожие символы разных алфавитов могут маскировать подмену сайта.");
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  const isIpv4 = Boolean(ipv4 && ipv4.slice(1).every(part => Number(part) <= 255));
  const isIpv6 = /^\[[0-9a-f:]+\]$/i.test(host);
  if (isIpv4 || isIpv6) {
    add("warning", "Вместо доменного имени используется IP-адрес. Убедитесь, что вы ожидаете именно этот сервер.");
  }
  if (host === "localhost" || host.endsWith(".local") ||
      /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    add("warning", "Адрес ведёт в локальную сеть или на устройство. Не открывайте его, если не знаете источник.");
  }

  const normalizedHost = host.replace(/^www\./, "");
  if (QR_SHORTENER_HOSTS.has(normalizedHost)) {
    add("warning", "Используется сокращатель ссылок. Конечный адрес скрыт до перехода.");
  }
  if (url.port) {
    add("warning", "Указан нестандартный порт " + url.port + ". Проверьте, почему сайт использует его.");
  }
  const trackingKeys = Array.from(url.searchParams.keys()).filter(key =>
    /^(utm_|fbclid$|gclid$|yclid$|mc_cid$|mc_eid$)/i.test(key)
  );
  if (trackingKeys.length) {
    add("info", "Обнаружены параметры отслеживания: " + trackingKeys.slice(0, 5).join(", ") + ".");
  }

  if (!warnings.length) {
    add("info", "Автоматических предупреждений по формату адреса не найдено. Это не означает, что сайт безопасен.");
  }
  const level = warnings.some(item => item.level === "danger") ? "danger" :
    warnings.some(item => item.level === "warning") ? "warning" : "info";
  const summary = level === "danger" ? "Есть опасные признаки — не открывайте ссылку" :
    level === "warning" ? "Проверьте адрес перед переходом" :
      "Явных предупреждений по формату не найдено";
  return {
    value,
    summary,
    level,
    warnings,
    host: url.host,
    href: (url.username || url.password) ? null : url.href
  };
}

function renderQrAnalysis(container, rawValue) {
  const result = inspectQrPayload(rawValue);
  const box = document.createElement("div");
  box.className = "rounded-xl border p-4 space-y-4";
  const isDark = document.documentElement.classList.contains("dark");
  const palettes = {
    danger: {
      light: { border: "#fca5a5", background: "#fef2f2", color: "#7f1d1d" },
      dark: { border: "#7f1d1d", background: "rgba(127, 29, 29, .22)", color: "#fecaca" }
    },
    warning: {
      light: { border: "#fcd34d", background: "#fffbeb", color: "#78350f" },
      dark: { border: "#92400e", background: "rgba(120, 53, 15, .25)", color: "#fde68a" }
    },
    info: {
      light: { border: "#e2e8f0", background: "#f8fafc", color: "#1e293b" },
      dark: { border: "#334155", background: "#0f172a", color: "#e2e8f0" }
    }
  };
  const palette = palettes[result.level][isDark ? "dark" : "light"];
  box.style.borderColor = palette.border;
  box.style.backgroundColor = palette.background;
  box.style.color = palette.color;

  const heading = document.createElement("h3");
  heading.className = "font-semibold";
  heading.textContent = result.summary;
  box.appendChild(heading);

  if (result.host) {
    const host = document.createElement("p");
    host.className = "text-sm font-mono break-all";
    host.textContent = "Адрес назначения: " + result.host;
    box.appendChild(host);
  }

  if (result.warnings.length) {
    const list = document.createElement("ul");
    list.className = "text-sm";
    list.style.listStyleType = "disc";
    list.style.paddingLeft = "1.25rem";
    list.style.display = "grid";
    list.style.rowGap = "0.25rem";
    for (const item of result.warnings) {
      const row = document.createElement("li");
      row.textContent = item.text;
      list.appendChild(row);
    }
    box.appendChild(list);
  }

  if (result.href) {
    const link = document.createElement("a");
    link.href = result.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-white font-medium";
    link.textContent = "Открыть в новой вкладке после проверки";
    box.appendChild(link);
  }

  const details = document.createElement("details");
  details.className = "text-sm";
  const summary = document.createElement("summary");
  summary.className = "cursor-pointer font-medium";
  summary.textContent = "Показать полное содержимое QR-кода";
  const payload = document.createElement("pre");
  payload.className = "mt-2 break-all rounded-lg p-3 font-mono text-xs";
  payload.style.whiteSpace = "pre-wrap";
  payload.style.backgroundColor = isDark ? "rgba(0, 0, 0, .2)" : "rgba(255, 255, 255, .7)";
  payload.textContent = result.value;
  details.append(summary, payload);
  box.appendChild(details);

  const disclaimer = document.createElement("p");
  disclaimer.className = "text-xs";
  disclaimer.style.opacity = "0.8";
  disclaimer.textContent = "Проверка выполняется локально и по простым признакам формата. Репутация сайта и фактическое содержимое страницы не проверяются; предупреждений может быть недостаточно.";
  box.appendChild(disclaimer);

  container.replaceChildren(box);
}

function renderTextTool(tool) {
  switch (tool.id) {
    case 'password-generator':
      return `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Длина пароля</label>
            <input type="range" id="pw-length" min="8" max="64" value="16" class="w-full" />
            <div class="text-center font-mono text-lg" id="pw-len-val">16</div>
          </div>
          <div class="flex flex-wrap gap-4 text-sm">
            <label class="flex items-center gap-2"><input type="checkbox" id="pw-upper" checked /> Заглавные</label>
            <label class="flex items-center gap-2"><input type="checkbox" id="pw-lower" checked /> Строчные</label>
            <label class="flex items-center gap-2"><input type="checkbox" id="pw-nums" checked /> Цифры</label>
            <label class="flex items-center gap-2"><input type="checkbox" id="pw-syms" checked /> Символы</label>
          </div>
          <button id="gen-pw" class="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">Сгенерировать</button>
          <div id="pw-result" class="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl font-mono text-center text-lg break-all hidden"></div>
        </div>`;
    case 'uuid-generator':
      return `
        <button id="gen-uuid" class="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold mb-4">Сгенерировать UUID</button>
        <div id="uuid-result" class="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl font-mono text-center break-all"></div>`;
    case 'qr-generator':
      return `
        <div class="space-y-4">
          <section class="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 p-4">
            <h2 class="font-semibold text-lg mb-3">Создать QR-код</h2>
            <textarea id="qr-text" rows="3" placeholder="Введите текст или URL..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"></textarea>
            <button id="gen-qr" type="button" class="mt-4 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">Создать QR</button>
            <div id="qr-result" class="mt-6 flex justify-center flex-wrap gap-3"></div>
          </section>
          <section class="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 p-4">
            <h2 class="font-semibold text-lg mb-2">Сканировать QR из изображения</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Выберите фото или скриншот с QR-кодом. Изображение читается прямо в браузере и не загружается на сервер.</p>
            <input id="qr-scan-file" type="file" accept="image/*" class="block w-full text-sm" />
            <p id="qr-scan-status" role="status" aria-live="polite" class="mt-3 text-sm"></p>
          </section>
          <section class="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 p-4">
            <h2 class="font-semibold text-lg mb-2">Проверить содержимое QR-кода</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Можно вставить текст, скопированный из любого сканера. Ссылки не открываются автоматически.</p>
            <textarea id="qr-check-input" rows="3" placeholder="Вставьте содержимое QR-кода..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"></textarea>
            <button id="qr-analyze" type="button" class="mt-3 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">Проверить адрес и содержимое</button>
            <div id="qr-analysis" class="mt-4" role="status" aria-live="polite"></div>
          </section>
        </div>`;
    case 'base64-encoder':
      return `
        <textarea id="b64-input" rows="5" placeholder="Текст..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>
        <div class="flex gap-3 mt-4">
          <button id="b64-encode" class="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-medium">Закодировать</button>
          <button id="b64-decode" class="flex-1 py-2.5 rounded-xl bg-slate-600 text-white font-medium">Декодировать</button>
        </div>
        <textarea id="b64-output" rows="5" readonly class="w-full mt-4 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>`;
    case 'json-formatter':
      return `
        <textarea id="json-input" rows="8" placeholder='{"key": "value"}' class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono text-sm"></textarea>
        <button id="json-format" class="mt-4 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">Форматировать</button>
        <pre id="json-output" class="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-auto text-sm font-mono hidden"></pre>`;
    case 'hash-generator':
      return `
        <textarea id="hash-input" rows="4" placeholder="Текст для хеширования..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>
        <button id="gen-hash" class="mt-4 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">Сгенерировать хеши</button>
        <div id="hash-result" class="mt-4 space-y-2 text-sm font-mono"></div>`;
    case 'case-converter':
      return `
        <textarea id="case-input" rows="4" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          <button data-case="upper" class="case-btn py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">UPPER</button>
          <button data-case="lower" class="case-btn py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">lower</button>
          <button data-case="title" class="case-btn py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">Title Case</button>
          <button data-case="camel" class="case-btn py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">camelCase</button>
          <button data-case="snake" class="case-btn py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">snake_case</button>
          <button data-case="kebab" class="case-btn py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm">kebab-case</button>
        </div>
        <textarea id="case-output" rows="4" readonly class="w-full mt-4 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>`;
    case 'word-counter':
      return `
        <textarea id="wc-input" rows="8" placeholder="Введите текст..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>
        <div id="wc-stats" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div class="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl"><div class="text-2xl font-bold" id="wc-words">0</div><div class="text-xs text-slate-500">Слов</div></div>
          <div class="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl"><div class="text-2xl font-bold" id="wc-chars">0</div><div class="text-xs text-slate-500">Символов</div></div>
          <div class="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl"><div class="text-2xl font-bold" id="wc-chars-ns">0</div><div class="text-xs text-slate-500">Без пробелов</div></div>
          <div class="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl"><div class="text-2xl font-bold" id="wc-lines">0</div><div class="text-xs text-slate-500">Строк</div></div>
        </div>`;
    case 'unit-converter':
      return `
        <div class="space-y-4">
          <select id="unit-type" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
            <option value="length">Длина</option>
            <option value="weight">Вес</option>
            <option value="temp">Температура</option>
          </select>
          <div class="flex items-center gap-3">
            <input type="number" id="unit-from" value="1" class="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900" />
            <select id="unit-from-unit" class="p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></select>
          </div>
          <div class="text-center text-2xl">↓</div>
          <div class="flex items-center gap-3">
            <input type="number" id="unit-to" readonly class="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800" />
            <select id="unit-to-unit" class="p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></select>
          </div>
        </div>`;
    case 'color-picker':
      return `
        <div class="flex flex-col items-center gap-4">
          <input type="color" id="color-input" value="#0ea5e9" class="w-32 h-32 rounded-2xl cursor-pointer border-0" />
          <div class="grid grid-cols-1 gap-2 w-full max-w-xs text-sm font-mono">
            <div class="flex justify-between p-2 bg-slate-100 dark:bg-slate-900 rounded-lg"><span>HEX</span><span id="color-hex">#0ea5e9</span></div>
            <div class="flex justify-between p-2 bg-slate-100 dark:bg-slate-900 rounded-lg"><span>RGB</span><span id="color-rgb">14, 165, 233</span></div>
            <div class="flex justify-between p-2 bg-slate-100 dark:bg-slate-900 rounded-lg"><span>HSL</span><span id="color-hsl">199, 89%, 48%</span></div>
          </div>
        </div>`;
    case 'lorem-ipsum':
      return `
        <div class="flex items-center gap-4 mb-4">
          <label>Параграфов: <input type="number" id="lorem-count" value="3" min="1" max="20" class="w-16 p-1 rounded border dark:bg-slate-800" /></label>
          <button id="gen-lorem" class="px-4 py-2 rounded-xl bg-brand-600 text-white">Сгенерировать</button>
        </div>
        <textarea id="lorem-output" rows="10" readonly class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>`;
    case 'timestamp-converter':
      return `
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Unix Timestamp</label>
            <input type="number" id="ts-input" class="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900" placeholder="1710000000" />
          </div>
          <button id="ts-to-date" class="w-full py-2.5 rounded-xl bg-brand-600 text-white">В дату</button>
          <div id="ts-result" class="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl text-center font-mono"></div>
          <hr class="border-slate-200 dark:border-slate-700" />
          <button id="ts-now" class="w-full py-2.5 rounded-xl bg-slate-600 text-white">Текущий timestamp</button>
        </div>`;
    case 'url-encoder':
      return `
        <textarea id="url-input" rows="4" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>
        <div class="flex gap-3 mt-4">
          <button id="url-encode" class="flex-1 py-2.5 rounded-xl bg-brand-600 text-white">Encode</button>
          <button id="url-decode" class="flex-1 py-2.5 rounded-xl bg-slate-600 text-white">Decode</button>
        </div>
        <textarea id="url-output" rows="4" readonly class="w-full mt-4 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>`;
    case 'regex-tester':
      return `
        <input id="regex-pattern" placeholder="Регулярное выражение" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 mb-3 font-mono" />
        <textarea id="regex-text" rows="5" placeholder="Текст для проверки" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"></textarea>
        <button id="regex-test" class="mt-4 w-full py-3 rounded-xl bg-brand-600 text-white font-semibold">Проверить</button>
        <div id="regex-result" class="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl text-sm font-mono hidden"></div>`;
    default:
      return `<p class="text-slate-500">Интерфейс в разработке</p>`;
  }
}

function initToolLogic(tool) {
  if (tool.id === 'zip-create') {
    const input = document.getElementById('zip-create-files');
    const nameInput = document.getElementById('zip-create-name');
    const button = document.getElementById('zip-create-run');
    const status = document.getElementById('zip-create-status');
    button.addEventListener('click', async () => {
      const files = [...(input.files || [])];
      if (!files.length) { status.textContent = 'Выберите хотя бы один файл.'; return; }
      if (files.length > 100) { status.textContent = 'Слишком много файлов: максимум 100.'; return; }
      const total = files.reduce((sum, file) => sum + file.size, 0);
      if (total > 250 * 1024 * 1024) { status.textContent = 'Общий размер файлов превышает 250 МБ.'; return; }
      if (typeof window.JSZip !== 'function') { status.textContent = 'Локальная библиотека JSZip не загружена. Обновите страницу.'; return; }
      button.disabled = true;
      status.textContent = 'Создаю архив…';
      try {
        const archive = new window.JSZip();
        for (const file of files) {
          const rawPath = file.webkitRelativePath || file.name;
          const safeParts = rawPath.replace(/\\/g, '/').split('/').filter(part =>
            part && part !== '.' && part !== '..' && !/^[A-Za-z]:$/.test(part)
          ).map(part => part.replace(/[\x00-\x1F]/g, '_'));
          const safeName = safeParts.join('/');
          if (!safeName) continue;
          archive.file(safeName, file);
        }
        const blob = await archive.generateAsync(
          { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
          meta => { status.textContent = 'Упаковка: ' + Math.round(meta.percent) + '%'; }
        );
        const objectUrl = URL.createObjectURL(blob);
        const safeBase = (nameInput.value || 'archive').trim().replace(/\.zip$/i, '').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 70) || 'archive';
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = safeBase + '.zip';
        link.className = 'inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold';
        link.textContent = 'Скачать ' + link.download + ' (' + (blob.size / 1024 / 1024).toFixed(2) + ' МБ)';
        link.addEventListener('click', () => setTimeout(() => URL.revokeObjectURL(objectUrl), 30000), { once: true });
        status.replaceChildren(document.createTextNode('Архив готов. '), link);
      } catch (error) {
        status.textContent = 'Не удалось создать архив: ' + (error?.message || String(error));
      } finally {
        button.disabled = false;
      }
    });
    return;
  }

  if (tool.id === 'zip-extract') {
    const input = document.getElementById('zip-extract-file');
    const button = document.getElementById('zip-extract-run');
    const status = document.getElementById('zip-extract-status');
    const list = document.getElementById('zip-extract-list');
    button.addEventListener('click', async () => {
      const file = input.files?.[0];
      list.replaceChildren();
      if (!file) { status.textContent = 'Выберите ZIP-файл.'; return; }
      if (file.size > 100 * 1024 * 1024) { status.textContent = 'Архив больше допустимых 100 МБ.'; return; }
      if (typeof window.JSZip !== 'function') { status.textContent = 'Локальная библиотека JSZip не загружена. Обновите страницу.'; return; }
      button.disabled = true;
      status.textContent = 'Проверяю архив…';
      try {
        const archive = await window.JSZip.loadAsync(file);
        const entries = Object.values(archive.files).filter(entry => !entry.dir);
        if (entries.length > 200) throw new Error('В архиве более 200 файлов.');
        let declaredTotal = 0;
        for (const entry of entries) {
          const size = Number(entry._data?.uncompressedSize);
          if (!Number.isSafeInteger(size) || size < 0) throw new Error('Не удалось безопасно проверить размер одного из файлов.');
          declaredTotal += size;
          if (declaredTotal > 250 * 1024 * 1024) throw new Error('Распакованный размер превышает 250 МБ.');
          const parts = entry.name.replace(/\\\\/g, '/').split('/');
          if (!entry.name || entry.name.startsWith('/') || /^[A-Za-z]:/.test(entry.name) || parts.some(part => part === '..')) {
            throw new Error('В архиве найден небезопасный путь: ' + entry.name);
          }
        }
        if (!entries.length) throw new Error('В архиве нет файлов.');
        const fragment = document.createDocumentFragment();
        for (const entry of entries) {
          const row = document.createElement('div');
          row.className = 'flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700';
          const details = document.createElement('div');
          details.className = 'min-w-0 flex-1';
          const label = document.createElement('p');
          label.className = 'font-medium break-all';
          label.textContent = entry.name;
          const size = document.createElement('p');
          size.className = 'text-xs text-slate-500';
          size.textContent = (entry._data.uncompressedSize / 1024).toFixed(1) + ' КБ';
          details.append(label, size);
          const download = document.createElement('button');
          download.type = 'button';
          download.className = 'px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold';
          download.textContent = 'Скачать';
          download.addEventListener('click', async () => {
            download.disabled = true;
            try {
              const content = await entry.async('blob');
              const url = URL.createObjectURL(content);
              const safeName = entry.name.split('/').filter(Boolean).join('__').replace(/[\\:*?"<>|]+/g, '_');
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = safeName || 'extracted-file';
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 30000);
              status.textContent = 'Файл подготовлен для скачивания: ' + safeName;
            } catch (error) {
              status.textContent = 'Ошибка извлечения: ' + (error?.message || String(error));
            } finally {
              download.disabled = false;
            }
          });
          row.append(details, download);
          fragment.append(row);
        }
        list.replaceChildren(fragment);
        status.textContent = 'Найдено файлов: ' + entries.length + '. Распаковка выполняется отдельно после нажатия «Скачать».';
      } catch (error) {
        status.textContent = 'Не удалось открыть архив: ' + (error?.message || String(error));
      } finally {
        button.disabled = false;
      }
    });
    return;
  }

  // File based
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const convertBtn = document.getElementById('convert-btn');
  let selectedFile = null;

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

    function handleFile(file) {
      selectedFile = file;
      document.getElementById('file-info').classList.remove('hidden');
      const info = document.getElementById('file-info');
      info.replaceChildren();
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between';
      const details = document.createElement('div');
      const name = document.createElement('p');
      name.className = 'font-medium';
      name.textContent = file.name;
      const meta = document.createElement('p');
      meta.className = 'text-sm text-slate-500';
      meta.textContent = `${(file.size / 1024).toFixed(1)} KB · ${file.type || 'unknown'}`;
      details.append(name, meta);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'text-red-500';
      remove.setAttribute('aria-label', 'Убрать выбранный файл');
      const removeIcon = document.createElement('i');
      removeIcon.className = 'fas fa-times';
      remove.append(removeIcon);
      remove.addEventListener('click', () => {
        info.classList.add('hidden');
        info.replaceChildren();
        selectedFile = null;
        convertBtn.disabled = true;
      });
      row.append(details, remove);
      info.append(row);
      convertBtn.disabled = false;
    }

    convertBtn.addEventListener('click', () => {
      if (!selectedFile) return;
      if (tool.client) {
        processClientConversion(tool, selectedFile);
      } else {
        const result = document.getElementById('result');
        result.classList.remove('hidden');
        result.innerHTML = `<div class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200">
          <i class="fas fa-hourglass-half mr-2"></i> Этот конвертер пока в разработке. Скоро будет доступна серверная или FFmpeg.wasm обработка.
        </div>`;
      }
    });
  }

  // Text tools logic
  if (tool.id === 'password-generator') {
    const len = document.getElementById('pw-length');
    const res = document.getElementById('pw-result');
    len.addEventListener('input', () => document.getElementById('pw-len-val').textContent = len.value);
    document.getElementById('gen-pw').addEventListener('click', () => {
      const length = Math.min(64, Math.max(8, Number(len.value) || 16));
      let chars = '';
      if (document.getElementById('pw-upper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (document.getElementById('pw-lower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (document.getElementById('pw-nums').checked) chars += '0123456789';
      if (document.getElementById('pw-syms').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      res.classList.remove('hidden');
      if (!chars) {
        res.textContent = 'Выберите хотя бы один набор символов.';
        return;
      }
      if (!globalThis.crypto?.getRandomValues) {
        res.textContent = 'Криптографический генератор случайных чисел недоступен в этом контексте.';
        return;
      }
      let pw = '';
      const limit = Math.floor(0x100000000 / chars.length) * chars.length;
      while (pw.length < length) {
        const batch = new Uint32Array(Math.max(16, length - pw.length));
        crypto.getRandomValues(batch);
        for (const value of batch) {
          if (value >= limit) continue;
          pw += chars[value % chars.length];
          if (pw.length === length) break;
        }
      }
      res.textContent = pw;
    });
  }

  if (tool.id === 'uuid-generator') {
    document.getElementById('gen-uuid').addEventListener('click', () => {
      document.getElementById('uuid-result').textContent = crypto.randomUUID();
    });
    document.getElementById('uuid-result').textContent = crypto.randomUUID();
  }

  if (tool.id === 'qr-generator') {
    const qrText = document.getElementById('qr-text');
    const qrResult = document.getElementById('qr-result');
    const checkInput = document.getElementById('qr-check-input');
    const analysis = document.getElementById('qr-analysis');
    const scanStatus = document.getElementById('qr-scan-status');
    const scanFile = document.getElementById('qr-scan-file');

    document.getElementById('gen-qr').addEventListener('click', () => {
      const text = qrText.value.trim();
      if (!text) {
        qrResult.textContent = 'Сначала введите текст или ссылку.';
        return;
      }
      try {
        if (typeof window.qrcode !== 'function') throw new Error('Локальная библиотека QR-кодов не загружена');
        const qr = window.qrcode(0, 'M');
        qr.addData(text, 'Byte');
        qr.make();
        qrResult.innerHTML = qr.createImgTag(5, 12, 'QR-код') +
          '<p class="mt-2 w-full text-center text-sm text-slate-500">Код создан прямо в браузере. Сохраните изображение правой кнопкой мыши.</p>';
      } catch (error) {
        qrResult.textContent = 'Не удалось создать QR-код: ' + (error && error.message ? error.message : String(error));
      }
    });

    document.getElementById('qr-analyze').addEventListener('click', () => {
      renderQrAnalysis(analysis, checkInput.value);
    });

    scanFile.addEventListener('change', async () => {
      const file = scanFile.files && scanFile.files[0];
      if (!file) return;
      scanStatus.textContent = '';
      if (!file.type.startsWith('image/')) {
        scanStatus.textContent = 'Выберите файл изображения.';
        scanFile.value = '';
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        scanStatus.textContent = 'Изображение больше 12 МБ. Выберите файл поменьше.';
        scanFile.value = '';
        return;
      }
      if (typeof window.jsQR !== 'function') {
        scanStatus.textContent = 'Локальный декодер QR-кодов не загружен.';
        scanFile.value = '';
        return;
      }

      let source = null;
      let objectUrl = null;
      try {
        if (typeof createImageBitmap === 'function') {
          source = await createImageBitmap(file);
        } else {
          objectUrl = URL.createObjectURL(file);
          source = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Браузер не смог открыть изображение.'));
            image.src = objectUrl;
          });
        }

        const sourceWidth = source.width || source.naturalWidth;
        const sourceHeight = source.height || source.naturalHeight;
        if (!sourceWidth || !sourceHeight) throw new Error('Не удалось определить размер изображения.');
        const scale = Math.min(1, 2400 / Math.max(sourceWidth, sourceHeight));
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Canvas недоступен в этом браузере.');
        context.drawImage(source, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height);
        const decoded = window.jsQR(pixels.data, width, height, { inversionAttempts: 'attemptBoth' });
        if (!decoded) {
          scanStatus.textContent = 'QR-код не найден. Попробуйте более чёткое изображение без сильного обрезания.';
          return;
        }
        checkInput.value = decoded.data;
        renderQrAnalysis(analysis, decoded.data);
        scanStatus.textContent = 'QR-код распознан. Изображение обработано только в браузере.';
      } catch (error) {
        scanStatus.textContent = 'Не удалось прочитать изображение: ' +
          (error && error.message ? error.message : String(error));
      } finally {
        if (source && typeof source.close === 'function') source.close();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        scanFile.value = '';
      }
    });
  }

  if (tool.id === 'base64-encoder') {
    document.getElementById('b64-encode').addEventListener('click', () => {
      document.getElementById('b64-output').value = btoa(unescape(encodeURIComponent(document.getElementById('b64-input').value)));
    });
    document.getElementById('b64-decode').addEventListener('click', () => {
      try {
        document.getElementById('b64-output').value = decodeURIComponent(escape(atob(document.getElementById('b64-input').value)));
      } catch { document.getElementById('b64-output').value = 'Ошибка декодирования'; }
    });
  }

  if (tool.id === 'json-formatter') {
    document.getElementById('json-format').addEventListener('click', () => {
      try {
        const obj = JSON.parse(document.getElementById('json-input').value);
        const out = document.getElementById('json-output');
        out.textContent = JSON.stringify(obj, null, 2);
        out.classList.remove('hidden');
      } catch (e) {
        alert('Невалидный JSON: ' + e.message);
      }
    });
  }

  if (tool.id === 'hash-generator') {
    document.getElementById('gen-hash').addEventListener('click', async () => {
      const text = document.getElementById('hash-input').value;
      const enc = new TextEncoder().encode(text);
      const result = document.getElementById('hash-result');
      const hashes = [];
      for (const algo of ['SHA-1', 'SHA-256', 'SHA-512']) {
        const buf = await crypto.subtle.digest(algo, enc);
        const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        hashes.push(`<div class="p-2 bg-slate-50 dark:bg-slate-800 rounded"><span class="text-slate-500">${algo}:</span> ${hex}</div>`);
      }
      result.replaceChildren();
      for (const item of hashes) {
        const line = document.createElement('div');
        line.className = 'p-2 bg-slate-50 dark:bg-slate-800 rounded break-all';
        line.textContent = item.replace(/<[^>]*>/g, '');
        result.append(line);
      }
      const note = document.createElement('p');
      note.className = 'text-xs text-slate-500 mt-2';
      note.textContent = 'Хеши подходят для контрольных сумм, но не для хранения паролей. SHA-1 устарел для задач криптографической защиты.';
      result.append(note);
    });
  }

  if (tool.id === 'case-converter') {
    document.querySelectorAll('.case-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = document.getElementById('case-input').value;
        let out = text;
        switch (btn.dataset.case) {
          case 'upper': out = text.toUpperCase(); break;
          case 'lower': out = text.toLowerCase(); break;
          case 'title': out = text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()); break;
          case 'camel': out = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase()); break;
          case 'snake': out = text.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''); break;
          case 'kebab': out = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); break;
        }
        document.getElementById('case-output').value = out;
      });
    });
  }

  if (tool.id === 'word-counter') {
    document.getElementById('wc-input').addEventListener('input', e => {
      const t = e.target.value;
      document.getElementById('wc-words').textContent = t.trim() ? t.trim().split(/\s+/).length : 0;
      document.getElementById('wc-chars').textContent = t.length;
      document.getElementById('wc-chars-ns').textContent = t.replace(/\s/g, '').length;
      document.getElementById('wc-lines').textContent = t ? t.split('\n').length : 0;
    });
  }

  if (tool.id === 'color-picker') {
    const input = document.getElementById('color-input');
    const update = () => {
      const hex = input.value;
      document.getElementById('color-hex').textContent = hex;
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      document.getElementById('color-rgb').textContent = `${r}, ${g}, ${b}`;
      // Simple HSL approx
      document.getElementById('color-hsl').textContent = rgbToHsl(r,g,b);
    };
    input.addEventListener('input', update);
    update();
  }

  if (tool.id === 'lorem-ipsum') {
    document.getElementById('gen-lorem').addEventListener('click', () => {
      const count = +document.getElementById('lorem-count').value || 3;
      const para = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
      document.getElementById('lorem-output').value = Array(count).fill(para).join('\n\n');
    });
  }

  if (tool.id === 'timestamp-converter') {
    document.getElementById('ts-to-date').addEventListener('click', () => {
      const ts = +document.getElementById('ts-input').value;
      if (!ts) return;
      document.getElementById('ts-result').textContent = new Date(ts * 1000).toLocaleString('ru-RU');
    });
    document.getElementById('ts-now').addEventListener('click', () => {
      const now = Math.floor(Date.now() / 1000);
      document.getElementById('ts-input').value = now;
      document.getElementById('ts-result').textContent = new Date().toLocaleString('ru-RU');
    });
  }

  if (tool.id === 'url-encoder') {
    document.getElementById('url-encode').addEventListener('click', () => {
      document.getElementById('url-output').value = encodeURIComponent(document.getElementById('url-input').value);
    });
    document.getElementById('url-decode').addEventListener('click', () => {
      try {
        document.getElementById('url-output').value = decodeURIComponent(document.getElementById('url-input').value);
      } catch { document.getElementById('url-output').value = 'Ошибка'; }
    });
  }

  if (tool.id === 'regex-tester') {
    document.getElementById('regex-test').addEventListener('click', () => {
      const pattern = document.getElementById('regex-pattern').value;
      const text = document.getElementById('regex-text').value;
      const res = document.getElementById('regex-result');
      res.classList.remove('hidden');
      res.textContent = 'Проверяю выражение…';
      if (pattern.length > 256 || text.length > 20000) {
        res.textContent = 'Слишком большой ввод: максимум 256 символов для выражения и 20 000 для текста.';
        return;
      }
      let worker;
      try {
        worker = new Worker(new URL('assets/js/regex-worker.js', document.baseURI));
      } catch (error) {
        res.textContent = 'Не удалось запустить безопасную проверку Regex: ' + error.message;
        return;
      }
      const timeout = setTimeout(() => {
        worker.terminate();
        res.textContent = 'Проверка остановлена: выражение выполнялось слишком долго. Упростите шаблон.';
      }, 1500);
      worker.onmessage = event => {
        clearTimeout(timeout);
        worker.terminate();
        const data = event.data || {};
        if (!data.ok) {
          res.textContent = 'Ошибка: ' + (data.error || 'неверное регулярное выражение');
          return;
        }
        res.replaceChildren();
        const summary = document.createElement('p');
        summary.textContent = data.count > data.matches.length
          ? `Найдено: более ${data.matches.length} совпадений (показаны первые ${data.matches.length}).`
          : `Найдено: ${data.count}`;
        res.append(summary);
        if (!data.matches.length) {
          const empty = document.createElement('p');
          empty.textContent = 'Совпадений нет';
          res.append(empty);
        }
        for (const match of data.matches) {
          const line = document.createElement('div');
          line.textContent = match;
          res.append(line);
        }
      };
      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        res.textContent = 'Ошибка Worker при проверке выражения.';
      };
      worker.postMessage({ pattern, text, maxMatches: 500 });
    });
  }

  if (tool.id === 'unit-converter') {
    const units = {
      length: { m: 1, km: 0.001, cm: 100, mm: 1000, mi: 0.000621371, ft: 3.28084, in: 39.3701 },
      weight: { kg: 1, g: 1000, mg: 1e6, lb: 2.20462, oz: 35.274 },
      temp: null // special
    };
    const typeSel = document.getElementById('unit-type');
    const fromUnit = document.getElementById('unit-from-unit');
    const toUnit = document.getElementById('unit-to-unit');
    const fromVal = document.getElementById('unit-from');
    const toVal = document.getElementById('unit-to');

    function populateUnits() {
      const t = typeSel.value;
      fromUnit.innerHTML = '';
      toUnit.innerHTML = '';
      if (t === 'temp') {
        ['C', 'F', 'K'].forEach(u => {
          fromUnit.innerHTML += `<option value="${u}">${u}</option>`;
          toUnit.innerHTML += `<option value="${u}">${u}</option>`;
        });
      } else {
        Object.keys(units[t]).forEach(u => {
          fromUnit.innerHTML += `<option value="${u}">${u}</option>`;
          toUnit.innerHTML += `<option value="${u}">${u}</option>`;
        });
      }
      convert();
    }

    function convert() {
      const t = typeSel.value;
      const v = parseFloat(fromVal.value) || 0;
      if (t === 'temp') {
        let c = v;
        if (fromUnit.value === 'F') c = (v - 32) * 5/9;
        if (fromUnit.value === 'K') c = v - 273.15;
        let out = c;
        if (toUnit.value === 'F') out = c * 9/5 + 32;
        if (toUnit.value === 'K') out = c + 273.15;
        toVal.value = out.toFixed(4);
      } else {
        const base = v / units[t][fromUnit.value];
        toVal.value = (base * units[t][toUnit.value]).toFixed(6);
      }
    }

    typeSel.addEventListener('change', populateUnits);
    fromUnit.addEventListener('change', convert);
    toUnit.addEventListener('change', convert);
    fromVal.addEventListener('input', convert);
    populateUnits();
  }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return `${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%`;
}

async function processClientConversion(tool, file) {
  const result = document.getElementById('result');
  result.classList.remove('hidden');
  result.innerHTML = `<div class="p-4 text-center"><i class="fas fa-spinner fa-spin text-2xl text-brand-500"></i><p class="mt-2">Обработка...</p></div>`;

  try {
    if (['jpg-to-png', 'png-to-jpg', 'webp-to-png', 'png-to-webp', 'jpg-to-webp', 'bmp-to-jpg', 'gif-to-png', 'svg-to-png', 'ico-to-png', 'png-to-ico', 'image-resizer', 'image-compressor', 'image-to-base64'].includes(tool.id)) {
      if (file.size > 25 * 1024 * 1024) throw new Error('Файл изображения превышает 25 МБ.');
      const img = await loadImageForTool(file, tool);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let w = img.width, h = img.height;
      if (w * h > 40000000) throw new Error('Изображение слишком большое: максимум 40 мегапикселей.');
      if (tool.id === 'image-resizer') {
        w = Math.max(1, Math.round(w / 2)); h = Math.max(1, Math.round(h / 2));
      }
      canvas.width = w;
      canvas.height = h;

      let mime = 'image/png';
      let quality = 0.92;
      let ext = 'png';

      if (tool.id === 'png-to-jpg' || tool.id === 'bmp-to-jpg') { mime = 'image/jpeg'; ext = 'jpg'; }
      if (tool.id === 'png-to-webp' || tool.id === 'jpg-to-webp') { mime = 'image/webp'; ext = 'webp'; }
      if (mime !== 'image/jpeg') {
        ctx.drawImage(img, 0, 0, w, h);
      }
      if (tool.id === 'image-compressor') {
        const allowedImageTypes = {
          'image/jpeg': { mime: 'image/jpeg', ext: 'jpg' },
          'image/png': { mime: 'image/png', ext: 'png' },
          'image/webp': { mime: 'image/webp', ext: 'webp' }
        };
        const imageType = allowedImageTypes[file.type];
        if (!imageType) throw new Error('Поддерживаются только JPEG, PNG и WEBP.');
        mime = imageType.mime;
        ext = imageType.ext;
        quality = 0.7;
      }
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
      }
      if (tool.id === 'image-to-base64') {
        const dataUrl = canvas.toDataURL(mime, quality);
        const label = document.createElement('p');
        label.className = 'text-sm mb-2';
        label.textContent = 'Base64:';
        const textarea = document.createElement('textarea');
        textarea.className = 'w-full h-32 p-2 text-xs font-mono rounded border dark:bg-slate-900';
        textarea.readOnly = true;
        textarea.value = dataUrl;
        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'mt-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm';
        copyButton.textContent = 'Копировать';
        copyButton.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(textarea.value);
            copyButton.textContent = 'Скопировано';
          } catch (_) {
            textarea.focus();
            textarea.select();
            copyButton.textContent = 'Выделите текст и скопируйте вручную';
          }
        });
        result.replaceChildren(label, textarea, copyButton);
        return;
      }

      if (tool.id === 'png-to-ico') {
        // ICO can contain an embedded PNG image; keep dimensions within the 256×256 ICO limit.
        const iconCanvas = document.createElement('canvas');
        const scale = Math.min(1, 256 / Math.max(w, h));
        const iconWidth = Math.max(1, Math.round(w * scale));
        const iconHeight = Math.max(1, Math.round(h * scale));
        iconCanvas.width = iconWidth;
        iconCanvas.height = iconHeight;
        iconCanvas.getContext('2d').drawImage(img, 0, 0, iconWidth, iconHeight);
        const pngBlob = await new Promise((resolve, reject) => {
          iconCanvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Не удалось создать PNG для ICO')), 'image/png');
        });
        const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
        const icoBytes = new Uint8Array(22 + pngBytes.length);
        const view = new DataView(icoBytes.buffer);
        view.setUint16(0, 0, true);       // reserved
        view.setUint16(2, 1, true);       // image type: icon
        view.setUint16(4, 1, true);       // one image
        icoBytes[6] = iconWidth === 256 ? 0 : iconWidth;
        icoBytes[7] = iconHeight === 256 ? 0 : iconHeight;
        icoBytes[8] = 0;                 // palette
        icoBytes[9] = 0;                 // reserved
        view.setUint16(10, 1, true);      // color planes
        view.setUint16(12, 32, true);     // bits per pixel
        view.setUint32(14, pngBytes.length, true);
        view.setUint32(18, 22, true);     // image data offset
        icoBytes.set(pngBytes, 22);
        const icoBlob = new Blob([icoBytes], { type: 'image/x-icon' });
        const icoUrl = URL.createObjectURL(icoBlob);
        const preview = document.createElement('img');
        preview.src = icoUrl;
        preview.alt = 'Предпросмотр ICO';
        preview.className = 'max-w-full max-h-64 mx-auto rounded-xl shadow mb-4';
        const link = document.createElement('a');
        link.href = icoUrl;
        link.download = 'converted.ico';
        link.className = 'inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold';
        link.textContent = 'Скачать ICO';
        link.addEventListener('click', () => setTimeout(() => URL.revokeObjectURL(icoUrl), 30000), { once: true });
        const wrap = document.createElement('div');
        wrap.className = 'text-center';
        wrap.append(preview, link);
        result.replaceChildren(wrap);
        return;
      }

      const outputBlob = await new Promise((resolve, reject) => {
        if (!canvas.toBlob) return reject(new Error('Браузер не поддерживает безопасное создание файла.'));
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Не удалось создать файл изображения.')), mime, quality);
      });
      const outputUrl = URL.createObjectURL(outputBlob);
      const preview = document.createElement('img');
      preview.src = outputUrl;
      preview.alt = 'Результат конвертации';
      preview.className = 'max-w-full max-h-64 mx-auto rounded-xl shadow mb-4';
      const download = document.createElement('a');
      download.href = outputUrl;
      download.download = 'converted.' + ext;
      download.className = 'inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold';
      const icon = document.createElement('i');
      icon.className = 'fas fa-download';
      download.append(icon, document.createTextNode(' Скачать ' + ext.toUpperCase()));
      download.addEventListener('click', () => setTimeout(() => URL.revokeObjectURL(outputUrl), 30000), { once: true });
      setTimeout(() => URL.revokeObjectURL(outputUrl), 10 * 60 * 1000);
      const outputWrap = document.createElement('div');
      outputWrap.className = 'text-center';
      outputWrap.append(preview, download);
      result.replaceChildren(outputWrap);
      if (tool.id === 'image-compressor' && outputBlob.size >= file.size) {
        const note = document.createElement('p');
        note.className = 'mt-3 text-xs text-slate-500';
        note.textContent = 'После перекодирования файл не стал меньше исходного. Для этого изображения сжатие не дало выигрыша.';
        outputWrap.append(note);
      }
    } else if (tool.id === 'base64-to-image') {
      // handled differently, but for file it's text
      result.innerHTML = `<p class="text-slate-500">Загрузите текстовый файл с Base64 или используйте текстовый инструмент</p>`;
    } else if (tool.id === 'csv-to-json' || tool.id === 'json-to-csv' || tool.id === 'markdown-to-html') {
      const text = await file.text();
      let out = '';
      if (tool.id === 'csv-to-json') {
        out = JSON.stringify(parseCsv(text), null, 2);
      } else if (tool.id === 'json-to-csv') {
        const arr = JSON.parse(text);
        if (!Array.isArray(arr) || !arr.length || arr.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
          throw new Error('Ожидается непустой массив объектов JSON.');
        }
        const headers = [...new Set(arr.flatMap(row => Object.keys(row)))];
        const csvCell = value => {
          let cell = value == null ? '' : (typeof value === 'object' ? JSON.stringify(value) : String(value));
          if (/[",\r\n]/.test(cell)) cell = '"' + cell.replace(/"/g, '""') + '"';
          return cell;
        };
        out = [headers.map(csvCell).join(','), ...arr.map(row => headers.map(key => csvCell(row[key])).join(','))].join('\r\n');
      } else if (tool.id === 'markdown-to-html') {
        // Escape source HTML before converting the supported Markdown subset.
        out = escapeHtml(text)
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
          .replace(/\*(.*)\*/gim, '<i>$1</i>')
          .replace(/\n/g, '<br>');
      }
      const preview = document.createElement('pre');
      preview.className = 'p-4 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-auto text-sm max-h-96';
      preview.textContent = out;
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'mt-3 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm';
      copyButton.textContent = 'Копировать';
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(out);
          copyButton.textContent = 'Скопировано';
        } catch {
          copyButton.textContent = 'Не удалось скопировать';
        }
      });
      result.replaceChildren(preview, copyButton);
    } else {
      result.innerHTML = `<div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">Файл обработан (демо). Полная реализация скоро.</div>`;
    }
  } catch (e) {
    const errorBox = document.createElement('div');
    errorBox.className = 'p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl';
    errorBox.textContent = 'Ошибка: ' + (e && e.message ? e.message : String(e));
    result.replaceChildren(errorBox);
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Не удалось прочитать изображение.'));
    };
    img.src = objectUrl;
  });
}

async function loadImageForTool(file, tool) {
  if (tool.id !== 'svg-to-png') return loadImage(file);
  const source = await file.text();
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('SVG с DTD/ENTITY не поддерживается.');
  const documentXml = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = documentXml.documentElement;
  if (!root || root.localName !== 'svg' || documentXml.querySelector('parsererror')) {
    throw new Error('Некорректный SVG-файл.');
  }
  if (documentXml.querySelector('script,foreignObject,iframe,object,embed,animate,animateTransform,set,audio,video,link')) {
    throw new Error('SVG содержит активные или неподдерживаемые элементы.');
  }
  const checkCss = value => {
    if (/@import/i.test(value)) throw new Error('Внешние CSS-импорты в SVG запрещены.');
    const urls = value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi);
    for (const match of urls) {
      if (!match[2].trim().startsWith('#')) {
        throw new Error('Внешние ресурсы внутри SVG запрещены.');
      }
    }
  };
  for (const element of documentXml.querySelectorAll('*')) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on')) throw new Error('Обработчики событий в SVG запрещены.');
      if ((name === 'href' || name.endsWith(':href')) && value && !value.startsWith('#')) {
        throw new Error('Внешние ссылки и встроенные ресурсы в SVG запрещены.');
      }
      checkCss(value);
    }
    if (element.localName === 'style') checkCss(element.textContent || '');
  }
  const safeSvg = new Blob([new XMLSerializer().serializeToString(documentXml)], { type: 'image/svg+xml' });
  return loadImage(safeSvg);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function parseCsv(input) {
  const text = String(input).replace(/^\uFEFF/, '');
  if (!text.trim()) throw new Error('CSV-файл пуст.');
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"' && cell.length === 0) { quoted = true; continue; }
    if (char === ',') { row.push(cell); cell = ''; continue; }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(value => value !== '') || rows.length) rows.push(row);
      row = [];
      continue;
    }
    cell += char;
  }
  if (quoted) throw new Error('CSV содержит незакрытое поле в кавычках.');
  row.push(cell);
  if (row.some(value => value !== '') || !rows.length) rows.push(row);
  if (!rows.length) throw new Error('В CSV нет строк.');
  const rawHeaders = rows.shift();
  const headers = [];
  const used = new Set();
  rawHeaders.forEach((raw, index) => {
    const base = raw.trim() || 'column_' + (index + 1);
    let key = base, suffix = 2;
    while (used.has(key)) key = base + '_' + suffix++;
    used.add(key);
    headers.push(key);
  });
  return rows.map((values, index) => {
    if (values.length > headers.length) throw new Error('Строка ' + (index + 2) + ' содержит больше столбцов, чем заголовок.');
    const object = {};
    headers.forEach((header, column) => { object[header] = values[column] ?? ''; });
    return object;
  });
}

// Main render
function render() {
  const focusedMobileSearch = document.activeElement?.id === 'mobile-search-input';
  const selectionStart = focusedMobileSearch ? document.activeElement.selectionStart : null;
  const selectionEnd = focusedMobileSearch ? document.activeElement.selectionEnd : null;
  const route = getRoute();
  const search = searchInput?.value || window._search || '';
  if (route.type === 'tool') {
    renderTool(route.id);
  } else {
    const pageCategory = app.dataset.category || (route.category === '/' ? null : route.category);
    renderHome(pageCategory, search);
    if (focusedMobileSearch) {
      const replacement = document.getElementById('mobile-search-input');
      if (replacement) {
        replacement.focus();
        if (selectionStart !== null && selectionEnd !== null) replacement.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}

window.addEventListener('hashchange', render);
searchInput?.addEventListener('input', () => {
  if (getRoute().type === 'home') render();
});

// Initial
render();
