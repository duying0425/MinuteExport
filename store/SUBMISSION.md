# Edge Add-ons Store Submission

This folder contains all assets and texts required for submitting the **Feishu Minutes Exporter** extension to the Microsoft Edge Add-ons Store.

## Files

| File | Purpose | Specs |
|---|---|---|
| `../extension/icons/icon.png` | Extension logo (reused from extension) | 256x256 PNG |
| `promo_small_440x280.png` | Small promotional tile | 440x280 PNG |
| `promo_large_1400x560.png` | Large promotional tile | 1400x560 PNG |
| `screenshot1_1280x800.png` | Screenshot | 1280x800 PNG |
| `PRIVACY.md` | Privacy policy (URL: https://github.com/duying0425/MinuteExport/blob/master/store/PRIVACY.md) | Markdown |

---

## Extension name

```
Feishu Minutes Exporter
```

(From `manifest.json`, auto-populated)

---

## Description

```
Feishu Minutes Exporter lets you export any Feishu Minutes (飞书妙记) meeting transcript as a Markdown file with one click.

★ Why install it
The Feishu Minutes web interface has no built-in export button. This extension fills that gap — archive transcripts, share them offline, or import into Obsidian, Notion, or VS Code in seconds.

★ Features
• One-click export to .md
• Auto-filenames by meeting title
• Clean Markdown with speaker labels and timestamps
• Reuses your Feishu login session — no setup needed
• 100% local, no third-party servers

★ How to use
1. Open a Feishu Minutes page (https://*.feishu.cn/minutes/...)
2. Click the toolbar icon
3. Markdown file downloads automatically

★ Permissions
• cookies — read Feishu session for API auth
• downloads — save the .md file
• declarativeNetRequest — add Referer header required by Feishu API

★ Notes
• Must be logged in to Feishu first
• Supports feishu.cn only (not larksuite.com)
• Plain text only, no audio/video

★ Open source
https://github.com/duying0425/MinuteExport
```

---

## Search terms

(Up to 7, each ≤ 30 characters)

```
Feishu Minutes
妙记导出
minutes transcript
meeting notes export
飞书转写
markdown export
飞书妙记
```

---

## Privacy & Permissions page

### Single purpose description

```
This extension allows users to export the transcript content of their own Feishu Minutes (飞书妙记) meetings as Markdown files. It runs only on the feishu.cn domain, reads the currently logged-in user's session cookie to call the official Feishu Minutes transcript API, retrieves the meeting name, and downloads a Markdown file named after the meeting. The extension does not collect, transmit, or share any user data with any third party.
```

### cookies justification

```
The "cookies" permission is used to read the user's existing Feishu login session cookie (on feishu.cn) in order to authenticate the request to the Feishu Minutes transcript API (https://*.feishu.cn/space/api/minutes/...). Without this cookie, the API returns 401 and the transcript cannot be exported. The cookie is read locally in the browser, included only in requests sent to feishu.cn, and is never collected, stored, or transmitted to any server other than feishu.cn itself.
```

### downloads justification

```
The "downloads" permission is used to save the generated Markdown file to the user's local Downloads folder via the chrome.downloads.download API. After the transcript is retrieved from Feishu and converted to Markdown, the extension triggers a browser download with the meeting name as the filename. The extension does not access, read, or modify any other files on the user's device.
```

### declarativeNetRequest justification

```
The "declarativeNetRequest" permission is used to add a "Referer: https://*.feishu.cn/" header to API requests sent to feishu.cn. The Feishu Minutes API rejects requests without a valid Referer header (returns HTTP 400 "referer empty abort"). This rule is defined statically in rules_referer.json and only applies to requests initiated by the extension to feishu.cn. No other request modification is performed.
```

### Host permission justification (https://*.feishu.cn/*)

```
The host permission "https://*.feishu.cn/*" is required for two purposes: (1) to read the user's Feishu session cookie for authenticating API calls to the Feishu Minutes transcript endpoint, and (2) to inject a content script that reads the meeting name from the page DOM. The extension only operates on the feishu.cn domain and makes API requests solely to feishu.cn. No data is sent to any other host.
```

### Are you using remote code?

```
No
```

### Justification (optional)

```
The extension does not load, execute, or evaluate any remote code (no eval, no remote scripts, no dynamic script injection). All JavaScript is bundled within the extension package and executes locally.
```

---

## Privacy policy URL

```
https://github.com/duying0425/MinuteExport/blob/master/store/PRIVACY.md
```

---

## Notes for certification (optional but recommended)

```
This extension exports Feishu Minutes (飞书妙记) transcripts to Markdown.

Test steps:
1. Log in to https://feishu.cn in Edge.
2. Open any Feishu Minutes page (URL: https://*.feishu.cn/minutes/...).
3. Click the extension toolbar icon.
4. A Markdown file will be downloaded, named after the meeting title.

Notes:
- The "cookies" permission is required to read the Feishu session cookie for API authentication.
- The "declarativeNetRequest" permission adds a Referer header required by the Feishu API.
- The "downloads" permission saves the Markdown file locally.
- All processing is local; no data is sent to third-party servers.

A test meeting URL (requires Feishu account login):
https://reachauto.feishu.cn/minutes/obcnnok34m3ax8bxn4k6eab2
```

---

## Category

```
Productivity
```

---

## Submission history

| Version | Date | Status |
|---|---|---|
| 1.2.0 | 2026-07-07 | Pending submission |
