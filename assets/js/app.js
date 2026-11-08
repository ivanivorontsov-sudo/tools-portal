// Tools Portal App
const app = document.getElementById('app');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');

// Theme
function initTheme() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
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

// Home page
function renderHome(filterCategory = null, search = '') {
  let tools = TOOLS;
  if (filterCategory) tools = tools.filter(t => t.category === filterCategory);
  if (search) {
    const q = search.toLowerCase();
    tools = tools.filter(t => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.id.includes(q));
  }

  const cats = Object.entries(CATEGORIES);

  app.innerHTML = `
    <div class="mb-10 text-center">
      <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
        <span class="bg-gradient-to-r from-brand-600 to-cyan-500 bg-clip-text text-transparent">60+ инструментов</span>
      </h1>
      <p class="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        Конвертеры файлов любого формата и полезные утилиты. Всё работает прямо в браузере.
      </p>
    </div>

    <!-- Categories -->
    <div class="flex flex-wrap justify-center gap-3 mb-10">
      <button onclick="navigate('/')" class="px-4 py-2 rounded-full text-sm font-medium transition ${!filterCategory ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}">
        Все (${TOOLS.length})
      </button>
      ${cats.map(([key, cat]) => `
        <button onclick="navigate('${key}')" class="px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${filterCategory === key ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}">
          <i class="fas ${cat.icon}"></i> ${cat.name} (${TOOLS.filter(t => t.category === key).length})
        </button>
      `).join('')}
    </div>

    <!-- Mobile search -->
    <div class="md:hidden mb-6">
      <input type="search" placeholder="Поиск..." oninput="window._search = this.value; render()" 
        class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" />
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      ${tools.map(tool => {
        const cat = CATEGORIES[tool.category];
        return `
          <a href="#tool/${tool.id}" class="tool-card block p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition duration-200">
            <div class="flex items-start justify-between mb-3">
              <div class="w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-xl">
                <i class="fas ${tool.icon}"></i>
              </div>
              ${tool.client ? '<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Клиент</span>' : '<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Скоро</span>'}
            </div>
            <h3 class="font-semibold text-lg mb-1">${tool.name}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">${tool.desc}</p>
          </a>
        `;
      }).join('')}
    </div>

    ${tools.length === 0 ? '<p class="text-center text-slate-500 py-20">Ничего не найдено</p>' : ''}
  `;
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
          <div class="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 grid place-items-center text-3xl mb-5"><i class="fas fa-file-pdf"></i></div>
          <h1 class="text-3xl font-bold mb-3">PDF Мастер</h1>
          <p class="text-slate-600 dark:text-slate-400 mb-5">Объединение нескольких PDF, сортировка и поворот страниц, удаление лишнего, извлечение диапазонов, нумерация и очистка стандартных метаданных. Файлы обрабатываются в браузере, без аккаунта и подписки.</p>
          <div class="flex flex-wrap gap-3">
            <a href="${tool.externalUrl}" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold"><i class="fas fa-arrow-up-right-from-square"></i> Открыть PDF Мастер</a>
            <a href="${tool.externalUrl}privacy.html" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500">Политика конфиденциальности</a>
          </div>
          <p class="text-xs text-slate-500 mt-6">PDF-файлы не отправляются на сервер. Библиотеки PDF.js и pdf-lib загружаются с публичных CDN; их поставщики видят технические запросы на получение библиотек.</p>
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
    'image-compressor': 'image/*',
    'jpg-to-pdf': 'image/*',
    'favicon-generator': 'image/*',
    'audio-to-base64': 'audio/*',
  };
  return map[tool.id] || '*/*';
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
        <textarea id="qr-text" rows="3" placeholder="Введите текст или URL..." class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"></textarea>
        <button id="gen-qr" class="mt-4 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold">Создать QR</button>
        <div id="qr-result" class="mt-6 flex justify-center"></div>`;
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
      document.getElementById('file-info').innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">${file.name}</p>
            <p class="text-sm text-slate-500">${(file.size / 1024).toFixed(1)} KB · ${file.type || 'unknown'}</p>
          </div>
          <button onclick="document.getElementById('file-info').classList.add('hidden'); selectedFile=null; document.getElementById('convert-btn').disabled=true;" class="text-red-500"><i class="fas fa-times"></i></button>
        </div>`;
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
    len.addEventListener('input', () => document.getElementById('pw-len-val').textContent = len.value);
    document.getElementById('gen-pw').addEventListener('click', () => {
      const length = +len.value;
      let chars = '';
      if (document.getElementById('pw-upper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (document.getElementById('pw-lower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (document.getElementById('pw-nums').checked) chars += '0123456789';
      if (document.getElementById('pw-syms').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      if (!chars) return;
      let pw = '';
      const arr = new Uint32Array(length);
      crypto.getRandomValues(arr);
      for (let i = 0; i < length; i++) pw += chars[arr[i] % chars.length];
      const res = document.getElementById('pw-result');
      res.textContent = pw;
      res.classList.remove('hidden');
    });
  }

  if (tool.id === 'uuid-generator') {
    document.getElementById('gen-uuid').addEventListener('click', () => {
      document.getElementById('uuid-result').textContent = crypto.randomUUID();
    });
    document.getElementById('uuid-result').textContent = crypto.randomUUID();
  }

  if (tool.id === 'qr-generator') {
    // Simple QR using external API or canvas (for demo use Google Chart API style or just text)
    document.getElementById('gen-qr').addEventListener('click', () => {
      const text = document.getElementById('qr-text').value.trim();
      if (!text) return;
      const res = document.getElementById('qr-result');
      // Use a free QR API for simplicity (or implement pure JS later)
      res.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}" alt="QR" class="rounded-xl shadow" />
        <p class="mt-2 text-sm text-slate-500">Скачайте изображение правой кнопкой</p>`;
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
      // Simple MD5 is not in WebCrypto, skip or note
      result.innerHTML = hashes.join('') + '<p class="text-xs text-slate-500 mt-2">MD5 недоступен в Web Crypto API</p>';
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
      try {
        const pattern = document.getElementById('regex-pattern').value;
        const text = document.getElementById('regex-text').value;
        const re = new RegExp(pattern, 'g');
        const matches = [...text.matchAll(re)];
        const res = document.getElementById('regex-result');
        res.classList.remove('hidden');
        res.innerHTML = matches.length ? `Найдено: ${matches.length}<br>` + matches.map(m => m[0]).join('<br>') : 'Совпадений нет';
      } catch (e) {
        document.getElementById('regex-result').classList.remove('hidden');
        document.getElementById('regex-result').textContent = 'Ошибка: ' + e.message;
      }
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
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let w = img.width, h = img.height;
      if (tool.id === 'image-resizer') {
        // simple half size for demo, or add inputs later
        w = Math.round(w / 2); h = Math.round(h / 2);
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      let mime = 'image/png';
      let quality = 0.92;
      let ext = 'png';

      if (tool.id.includes('jpg') || tool.id === 'bmp-to-jpg') { mime = 'image/jpeg'; ext = 'jpg'; }
      if (tool.id.includes('webp')) { mime = 'image/webp'; ext = 'webp'; }
      if (tool.id === 'image-compressor') { mime = file.type || 'image/jpeg'; quality = 0.7; ext = file.name.split('.').pop(); }
      if (tool.id === 'image-to-base64') {
        const dataUrl = canvas.toDataURL(mime, quality);
        result.innerHTML = `
          <p class="text-sm mb-2">Base64:</p>
          <textarea class="w-full h-32 p-2 text-xs font-mono rounded border dark:bg-slate-900" readonly>${dataUrl}</textarea>
          <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)" class="mt-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">Копировать</button>`;
        return;
      }

      const dataUrl = canvas.toDataURL(mime, quality);
      result.innerHTML = `
        <div class="text-center">
          <img src="${dataUrl}" class="max-w-full max-h-64 mx-auto rounded-xl shadow mb-4" />
          <a href="${dataUrl}" download="converted.${ext}" class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold">
            <i class="fas fa-download"></i> Скачать ${ext.toUpperCase()}
          </a>
        </div>`;
    } else if (tool.id === 'base64-to-image') {
      // handled differently, but for file it's text
      result.innerHTML = `<p class="text-slate-500">Загрузите текстовый файл с Base64 или используйте текстовый инструмент</p>`;
    } else if (tool.id === 'csv-to-json' || tool.id === 'json-to-csv' || tool.id === 'markdown-to-html') {
      const text = await file.text();
      let out = '';
      if (tool.id === 'csv-to-json') {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const vals = line.split(',');
          const obj = {};
          headers.forEach((h, i) => obj[h] = vals[i]?.trim() || '');
          return obj;
        });
        out = JSON.stringify(data, null, 2);
      } else if (tool.id === 'json-to-csv') {
        const arr = JSON.parse(text);
        if (!Array.isArray(arr) || !arr.length) throw new Error('Ожидается массив объектов');
        const headers = Object.keys(arr[0]);
        out = headers.join(',') + '\n' + arr.map(o => headers.map(h => o[h]).join(',')).join('\n');
      } else if (tool.id === 'markdown-to-html') {
        // very basic
        out = text
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
          .replace(/\*(.*)\*/gim, '<i>$1</i>')
          .replace(/\n/g, '<br>');
      }
      result.innerHTML = `
        <pre class="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-auto text-sm max-h-96">${escapeHtml(out)}</pre>
        <button onclick="navigator.clipboard.writeText(\`${out.replace(/`/g, '\\`')}\`)" class="mt-3 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">Копировать</button>`;
    } else {
      result.innerHTML = `<div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">Файл обработан (демо). Полная реализация скоро.</div>`;
    }
  } catch (e) {
    result.innerHTML = `<div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">Ошибка: ${e.message}</div>`;
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Main render
function render() {
  const route = getRoute();
  const search = searchInput?.value || window._search || '';
  if (route.type === 'tool') {
    renderTool(route.id);
  } else {
    renderHome(route.category === '/' ? null : route.category, search);
  }
}

window.addEventListener('hashchange', render);
searchInput?.addEventListener('input', () => {
  if (getRoute().type === 'home') render();
});

// Initial
render();
