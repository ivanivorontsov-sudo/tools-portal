# Third-party notices

This file supplements, and does not replace, the license texts stored alongside bundled components. Versions below were checked against upstream package metadata and release/source repositories on 16 November 2026.

## Bundled in this repository

| Component | Version | License / chosen option | Location / notice |
|---|---:|---|---|
| JSZip | 3.10.2 | MIT OR GPL-3.0-or-later; this project uses the MIT option | `assets/js/vendor/jszip.min.js`; full dual-license text: `assets/js/vendor/JSZIP-LICENSE.txt` |
| Pako | 1.0.5 | MIT | Bundled dependency of JSZip; `assets/js/vendor/PAKO-LICENSE.txt` |
| JSZip browser-bundle dependencies | versions recorded in the upstream JSZip 3.10.2 lock file | MIT and ISC | `assets/js/vendor/JSZIP-DEPENDENCY-LICENSES.txt` |
| QR Code Generator for JavaScript (Kazuhiko Arase) | bundled source | MIT | `assets/js/vendor/qrcode-generator.js`; `assets/js/vendor/QRCODE-LICENSE.txt` |
| jsQR | 1.4.0 | Apache-2.0 | `assets/js/vendor/jsQR.js`; full license: `assets/js/vendor/JSQR-LICENSE.txt` |
| Tailwind CSS | 3.4.19 | MIT | Compiled into `assets/css/tailwind.min.css`; `assets/css/TAILWIND-LICENSE.txt` |

The JSZip browser distribution also bundles its runtime dependency graph (including `lie`, `immediate`, `readable-stream`, `setimmediate` and their smaller utility modules). The exact versions, copyright notices and MIT/ISC terms are collected in `assets/js/vendor/JSZIP-DEPENDENCY-LICENSES.txt`; the list is based on the upstream JSZip 3.10.2 manifest and lock file: [package.json](https://github.com/Stuk/jszip/blob/v3.10.2/package.json) · [package-lock.json](https://github.com/Stuk/jszip/blob/v3.10.2/package-lock.json). The project retains the upstream JSZip distribution rather than modifying those embedded modules.

## Loaded from external CDNs at runtime

| Component | Version | License information | Source |
|---|---:|---|---|
| Font Awesome Free | 6.7.2 | CSS/JavaScript code: MIT; icon assets: CC BY 4.0; web-font files: SIL OFL 1.1 | [cdnjs release](https://cdnjs.com/libraries/font-awesome/6.7.2) · [Font Awesome Free license](https://fontawesome.com/license/free) |
| PDF.js | 6.5.438 | Apache-2.0 | [Mozilla PDF.js](https://github.com/mozilla/pdf.js) |
| pdf-lib | 1.17.1 | MIT | [pdf-lib](https://github.com/Hopding/pdf-lib) |

External components are loaded only when the relevant page/tool is opened. Their providers may receive standard network metadata (for example, IP address, time and requested resource). This repository does not send user-selected files to these CDNs as upload payloads. The PDF page also documents the CDN supply-chain boundary and the relevant security controls.

## Project license

Code authored for this portal is licensed under the MIT License in the repository root. That license does not replace the licenses and notices of the third-party components listed above.
