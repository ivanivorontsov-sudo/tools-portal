# Иван Tools — наборы программ для Windows и Linux

Подборка готовых сборок из публичных репозиториев ivanivorontsov-sudo. Комплекты разделены по платформам; загрузчики скачивают файлы из официальных GitHub Releases и проверяют SHA-256.

**В комплекте нет VPN, прокси, клиентов туннелирования, конфигураций или инструментов настройки прокси.** Загрузчики выполняют прямые HTTP(S)-запросы к GitHub без использования прокси и ничего не запускают автоматически.

## Windows 10/11 x64

Запуск PowerShell:

~~~powershell
Set-ExecutionPolicy -Scope Process Bypass
.\Install-IvanTools.ps1
~~~

Группы: **daily**, **developer**, **creative**, **browser**, **all** (по умолчанию).

| Группа | Программа | Что делает |
|---|---|---|
| daily | Быстрый скрин 1.0.0 | Снимок выбранной области экрана; portable EXE |
| daily | Подсветка мыши 1.0.0 | Подсветка курсора и визуализация щелчков |
| daily | Тирпроц 1.3.1 | Офлайн-редактор тир-листов; экспорт PNG/JSON |
| developer | Понятный 2.5.0 | Компилятор русского языка программирования; CLI |
| developer | Учитель ИИ 1.2.0 | Обучение и дообучение моделей; Windows ZIP содержит Setup и Portable |
| developer | ИванКод 1.4.0 | IDE, работа с ИИ, запуск и анализ кода; Windows ZIP содержит Setup и Portable |
| creative | Кадр 1.0.0 | ИИ-студия сценария, кадров, озвучки и монтажа видео |
| browser | Super Ext Pro 1.1 | Расширение для Chrome, Edge и Яндекс Браузера |

Загрузчик сохраняет файлы в папку Загрузки/IvanTools-Windows. Он только скачивает и проверяет их — установку или запуск пользователь выполняет сам.

Для Super Ext Pro распакуйте ZIP, откройте страницу расширений браузера (chrome://extensions, edge://extensions или browser://extensions), включите режим разработчика и выберите «Загрузить распакованное».

## Linux x86_64

Подходит для Debian 13, Ubuntu и совместимых систем. По умолчанию загружаются AppImage; можно выбрать DEB:

~~~bash
chmod +x install-ivan-tools.sh
./install-ivan-tools.sh --group all --format appimage
./install-ivan-tools.sh --group all --format deb
~~~

Группы: **core**, **developer**, **ai**, **browser**, **all**.

| Группа | Программа | Формат |
|---|---|---|
| core | Тирпроц 1.3.1 | AppImage или DEB |
| developer | Понятный 2.5.0 | Исполняемый файл Linux x86_64 |
| ai | Учитель ИИ 1.2.0 | AppImage или DEB |
| browser | Super Ext Pro 1.1 | ZIP расширения для Chromium-браузеров |

Загрузчик сохраняет файлы в ~/Downloads/IvanTools-Linux, проверяет SHA-256 и выставляет право запуска для AppImage и «Понятного». DEB-файлы не устанавливаются автоматически. После скачивания их можно установить командой sudo apt install ./имя-файла.deb.

## Дополнительно

### Тихо для ПК — Windows и Linux

Настольная сборка на Firefox ESR. Успешная CI-сборка от 7 ноября 2026 года содержит артефакты Tiho-Windows-x64 и Tiho-Linux-x86_64-DEB. Это временные артефакты Actions, а не постоянные файлы релиза, поэтому загрузчики выше их не скачивают.

[Открыть сборку и скачать артефакт в GitHub Actions](https://github.com/ivanivorontsov-sudo/tiho-browser/actions/runs/42315913419) · [Инструкция для ПК](https://github.com/ivanivorontsov-sudo/tiho-browser/blob/main/desktop/README.md)

### Онлайн-инструменты для обеих систем

- [Tools Portal](https://ivanivorontsov-sudo.github.io/) — веб-каталог инструментов.
- [Ежедневная мастерская](https://ivanivorontsov-sudo.github.io/daily-tools/) — локальные инструменты для текста, файлов, изображений и хешей.
- [PDF Мастер](https://ivanivorontsov-sudo.github.io/pdf-master/) — обработка PDF в браузере.

## Замечания

- Загрузки рассчитаны на Windows x64 и Linux x86_64; ARM-сборки здесь не заявлены.
- «Учитель ИИ», «ИванКод» и «Кадр» — крупные пакеты. Перед загрузкой проверьте свободное место.
- У «Кадра» часть ИИ-функций обращается к внешним сервисам; отдельные провайдеры могут требовать собственные ключи.
- Установщики Windows могут показывать SmartScreen: у некоторых выпусков нет доверенной публичной подписи.
- Скрипты не устанавливают программы молча, не меняют системные настройки и не запускают скачанные EXE.
- В комплект включены только проекты с найденными опубликованными сборками. Экспериментальные или неподтверждённые сборки не маскируются под стабильные.

## Репозитории

- [Тирпроц](https://github.com/ivanivorontsov-sudo/tirproc)
- [Понятный](https://github.com/ivanivorontsov-sudo/ponyatny)
- [Учитель ИИ](https://github.com/ivanivorontsov-sudo/uchitel-ii)
- [ИванКод](https://github.com/ivanivorontsov-sudo/ivankod)
- [Кадр](https://github.com/ivanivorontsov-sudo/kadr-studio)
- [Быстрый скрин](https://github.com/ivanivorontsov-sudo/bystryj-skrin)
- [Подсветка мыши](https://github.com/ivanivorontsov-sudo/podsvetka-myshi)
- [Super Ext Pro](https://github.com/ivanivorontsov-sudo/super-ext-pro)
- [Тихо](https://github.com/ivanivorontsov-sudo/tiho-browser)
