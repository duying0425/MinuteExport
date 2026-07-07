# Privacy Policy — Feishu Minutes Exporter

Last updated: 2026-07-07

This privacy policy explains how the **Feishu Minutes Exporter** browser extension ("the extension") handles data. The extension is open source, and its source code is available at https://github.com/duying0425/MinuteExport.

## 1. Overview

The extension is designed with a strict **local-first, no-tracking** principle. It does **not** collect, store, or transmit any personal data to the developer or any third-party server. All processing happens locally in your browser.

## 2. What data the extension accesses

The extension only operates on the `feishu.cn` domain and accesses the following data, all of which stays in your browser:

| Data | Purpose | Stored? | Transmitted? |
|---|---|---|---|
| Feishu session cookie (`https://*.feishu.cn/*`) | Authenticate requests to the official Feishu Minutes transcript API | No (read on demand from browser cookie store) | Only sent to `feishu.cn` as part of API requests |
| Meeting name (page DOM) | Used as the filename of the exported Markdown file | No | No |
| Transcript text (Feishu API response) | Converted to Markdown and saved to your Downloads folder | Only as the downloaded `.md` file on your local disk | No |

## 3. Permissions and why each is required

- **`cookies`** — Reads your existing Feishu login session cookie so the extension can call the Feishu Minutes transcript API on your behalf. Without this, the API returns 401 and no export is possible. The cookie is never read by, or sent to, any party other than `feishu.cn`.
- **`downloads`** — Saves the generated Markdown file to your local Downloads folder via the browser's built-in download API. The extension does not read, list, or modify any other files on your device.
- **`declarativeNetRequest`** — Adds a `Referer: https://*.feishu.cn/` header to API requests, because the Feishu API rejects requests without a valid Referer (HTTP 400 "referer empty abort"). The rule is defined statically in `rules_referer.json` and applies only to requests the extension sends to `feishu.cn`.
- **Host permission `https://*.feishu.cn/*`** — Required to (1) read the Feishu session cookie and (2) inject a content script that reads the meeting name from the page DOM. The extension does not access any other website.

## 4. What the extension does NOT do

- Does **not** collect analytics, telemetry, or usage data.
- Does **not** include any third-party analytics or advertising SDK.
- Does **not** upload, sync, or back up your data to any server (including the developer's).
- Does **not** read or modify any data outside the `feishu.cn` domain.
- Does **not** access, read, or list your local files (other than writing the downloaded Markdown file via the browser's download API).
- Does **not** execute any remote code. All JavaScript is bundled inside the extension package and runs locally.

## 5. Data retention

The extension does not retain any data. The only artifact created on your device is the Markdown file you explicitly download, which is saved to your browser's Downloads folder. You can delete it at any time like any other file.

## 6. Third-party services

The extension makes network requests **only** to `feishu.cn` (the website you are already browsing). It does not communicate with any other server. Your use of Feishu is governed by Feishu's own terms and privacy policy.

## 7. Open source

The extension is 100% open source. You can audit every line of code at:
https://github.com/duying0425/MinuteExport

## 8. Changes to this policy

Any changes to this privacy policy will be posted in this file on the GitHub repository and reflected in the extension's next release.

## 9. Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/duying0425/MinuteExport/issues
