#!/usr/bin/env bash
set -Eeuo pipefail

GROUP="all"
FORMAT="appimage"
DEST="$HOME/Downloads/IvanTools-Linux"

usage() {
  cat <<'EOF'
Использование:
  ./install-ivan-tools.sh [--group all|core|developer|ai|browser] [--format appimage|deb] [--dest ПАПКА]

Группы:
  core       Тирпроц
  developer  Понятный
  ai         Учитель ИИ
  browser    Super Ext Pro
  all        Всё перечисленное (по умолчанию)

Формат --format выбирает AppImage или DEB для Тирпроц и Учителя ИИ.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --group) GROUP="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --dest) DEST="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Неизвестный аргумент: $1" >&2; usage; exit 2 ;;
  esac
done

case "$GROUP" in all|core|developer|ai|browser) ;; *) echo "Неизвестная группа: $GROUP" >&2; usage; exit 2 ;; esac
case "$FORMAT" in appimage|deb) ;; *) echo "Формат должен быть appimage или deb." >&2; exit 2 ;; esac

# Direct downloads only: clear proxy variables and tell curl not to use proxies.
unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY ftp_proxy FTP_PROXY
if ! command -v curl >/dev/null 2>&1; then
  echo "Для прямой загрузки требуется curl." >&2
  exit 1
fi
if ! command -v sha256sum >/dev/null 2>&1; then
  echo "Для проверки файлов требуется sha256sum." >&2
  exit 1
fi

mkdir -p "$DEST"
PACKAGES=""

add_package() {
  if [[ -n "$PACKAGES" ]]; then PACKAGES="$PACKAGES"$'\n'; fi
  PACKAGES="$PACKAGES$1|$2|$3|$4|$5"
}

if [[ "$GROUP" == "all" || "$GROUP" == "core" ]]; then
  if [[ "$FORMAT" == "appimage" ]]; then
    add_package "Тирпроц" "Tirproc-1.3.1-x86_64.AppImage" "https://github.com/ivanivorontsov-sudo/tirproc/releases/download/v1.3.1/Tirproc-1.3.1-x86_64.AppImage" "6c88a5b56b60de836d33bb1d312f6e3a1959e0963232a5ab2ec83335a76d74e6" "exec"
  else
    add_package "Тирпроц" "Tirproc-1.3.1-amd64.deb" "https://github.com/ivanivorontsov-sudo/tirproc/releases/download/v1.3.1/Tirproc-1.3.1-amd64.deb" "60c7a1393a589d9a207949f994ab1795024b2b1198c455dd964046b08403a869" "deb"
  fi
fi

if [[ "$GROUP" == "all" || "$GROUP" == "developer" ]]; then
  add_package "Понятный" "ponyatny-linux" "https://github.com/ivanivorontsov-sudo/ponyatny/releases/download/v2.5.0/ponyatny-linux" "de2867667bbb4745fede095a03e41da13b81da54001706d7ea7b031b30454e13" "exec"
fi

if [[ "$GROUP" == "all" || "$GROUP" == "ai" ]]; then
  if [[ "$FORMAT" == "appimage" ]]; then
    add_package "Учитель ИИ" "UchitelII-1.2.0-x86_64.AppImage" "https://github.com/ivanivorontsov-sudo/uchitel-ii/releases/download/v1.2.0/UchitelII-1.2.0-x86_64.AppImage" "e62c0d8961b6b065ae8a04fff22088f4e740fd970688ca603214c357213a77ed" "exec"
  else
    add_package "Учитель ИИ" "UchitelII-1.2.0-amd64.deb" "https://github.com/ivanivorontsov-sudo/uchitel-ii/releases/download/v1.2.0/UchitelII-1.2.0-amd64.deb" "a98b004b999065143d842088cc447f39eb2e58e5572c70ed4829543e4ed837de" "deb"
  fi
fi

if [[ "$GROUP" == "all" || "$GROUP" == "browser" ]]; then
  add_package "Super Ext Pro" "super-ext-pro-v1.1.zip" "https://github.com/ivanivorontsov-sudo/super-ext-pro/releases/download/v1.1/super-ext-pro-v1.1.zip" "f0df0943f28f9f8a5294baa5d4d09dc3492ba4b8ecc33e1e9240524e12372bf2" "zip"
fi

download_package() {
  local entry="$1"
  local name file url expected kind target temporary actual
  IFS='|' read -r name file url expected kind <<< "$entry"
  target="$DEST/$file"
  temporary="$target.part"

  if [[ -f "$target" ]]; then
    actual="$(sha256sum "$target" | cut -d ' ' -f 1)"
    if [[ "$actual" == "$expected" ]]; then
      echo "[OK] Уже есть: $file"
      return
    fi
    rm -f "$target"
  fi

  rm -f "$temporary"
  echo "Скачиваю: $name ($file)"
  curl --disable --noproxy '*' -fL --retry 3 --connect-timeout 20 -o "$temporary" "$url"
  actual="$(sha256sum "$temporary" | cut -d ' ' -f 1)"
  if [[ "$actual" != "$expected" ]]; then
    rm -f "$temporary"
    echo "Ошибка SHA-256: $file" >&2
    return 1
  fi
  mv "$temporary" "$target"

  if [[ "$kind" == "exec" ]]; then chmod +x "$target"; fi
  echo "[OK] Проверено: $file"
}

while IFS= read -r entry; do
  [[ -n "$entry" ]] && download_package "$entry"
done <<< "$PACKAGES"

echo
echo "Готово. Файлы находятся в: $DEST"
echo "Ничего не устанавливалось и не запускалось автоматически."
if [[ "$FORMAT" == "deb" ]]; then
  echo "Для установки DEB вручную: sudo apt install ./имя-файла.deb"
fi
