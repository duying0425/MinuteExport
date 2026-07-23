# Edge Add-ons / Chrome Web Store Submission Guide (商店发布指南)

This document contains all bilingual (English & Simplified Chinese) texts and metadata required for submitting **Feishu Minutes Exporter (飞书妙记导出)** v1.3.0 to the Microsoft Edge Add-ons Store and Chrome Web Store.

---

## Files / 提交素材清单

| File | Purpose | Specs |
|---|---|---|
| `../extension/icons/icon.png` | Extension logo (reused from extension) | 256x256 PNG |
| `promo_small_440x280.png` | Small promotional tile | 440x280 PNG |
| `promo_large_1400x560.png` | Large promotional tile | 1400x560 PNG |
| `screenshot1_1280x800.png` | Screenshot | 1280x800 PNG |
| `PRIVACY.md` | Privacy policy | Markdown |

---

## Extension Basic Info / 扩展基本信息

### Extension Name / 插件名称

**English**:
```text
Feishu Minutes Exporter
```

**Chinese (Simplified)**:
```text
飞书妙记导出
```

---

## Description / 商店详细描述

### English Version (英文版)

```text
Feishu Minutes Exporter lets you export any Feishu Minutes (飞书妙记) meeting transcript as a Markdown file with one click.

★ Why install it
The Feishu web interface has no built-in export button for meeting transcripts. This extension fills that gap — archive transcripts, share them offline, or import into Obsidian, Notion, or VS Code in seconds.

★ Key Features
• One-click export to .md (Markdown)
• Auto-filenames based on the meeting title
• Clean Markdown layout with speaker labels and timestamps
• Zero-scroll recognition: Automatically resolves embedded Minutes cards on Feishu Cloud Document (Docx/Docs/Wiki) pages without scrolling!
• Full bilingual support (English & Simplified Chinese)
• Reuses your Feishu login session — no setup needed
• 100% local processing — no third-party servers

★ How to use
1. Open a Feishu Minutes page (https://*.feishu.cn/minutes/...) or a Feishu Cloud Document (https://*.feishu.cn/docx/...)
2. Click the extension toolbar icon or the floating "📥 Export Minutes" button in the bottom right corner
3. Markdown file downloads automatically

★ Permissions
• cookies — read Feishu session for API authentication
• downloads — save the generated .md file locally
• declarativeNetRequest — add required Referer header for Feishu API

★ Notes
• Must be logged in to Feishu first
• Supports feishu.cn domain
• Plain text transcript export only, no audio/video

★ Open source
https://github.com/duying0425/MinuteExport
```

### Chinese Version (中文版)

```text
飞书妙记导出 (Feishu Minutes Exporter) 是一款专注于帮助用户一键导出“飞书妙记”会议转写文本为 Markdown 文件的浏览器扩展。

★ 为什么选择它
飞书妙记网页端默认未提供直接导出 Markdown 文件的功能。本插件填补了这一空白 — 帮助您轻松归档会议记录、离线分享，或无缝导入至 Obsidian、Notion、VS Code 等主流笔记软件中。

★ 核心功能
• 一键导出为 .md (Markdown) 格式
• 自动使用会议标题作为文件名
• 完美保留说话人姓名与精确时间戳
• 云文档零滚动识别：在飞书云文档 (Docx/Docs/Wiki) 页面中无需滚动页面即可自动精准识别并导出妙记内容
• 全中英文双语界面与自动切换
• 直接复用当前飞书登录态，无需额外配置账号
• 100% 本地转换处理，绝不出售或上传任何用户隐私数据

★ 使用方法
1. 打开任意飞书妙记页面 (https://*.feishu.cn/minutes/...) 或飞书云文档页面 (https://*.feishu.cn/docx/...)
2. 点击浏览器工具栏插件图标，或页面右下角的“📥 导出妙记”浮动按钮
3. 系统将自动下载格式化好的 Markdown 文件

★ 权限说明
• cookies — 读取 feishu.cn 域名的会话 Cookie 以通过飞书官方 API 认证
• downloads — 将生成的 .md 文件保存至本地下载目录
• declarativeNetRequest — 为 API 请求自动补充飞书要求的 Referer 请求头

★ 注意事项
• 需在浏览器中先登录飞书账号
• 仅针对文本转写，不包含音视频原文件下载

★ 开源地址
https://github.com/duying0425/MinuteExport
```

---

## Search terms / 搜索关键词

(Up to 7 terms, max 30 chars each)

**English**:
```text
Feishu Minutes
Feishu transcript export
meeting notes to markdown
docx minutes export
minutes exporter
Feishu exporter
lark minutes
```

**Chinese (Simplified)**:
```text
飞书妙记
妙记导出
飞书转写导出
飞书云文档导出
会议纪要导出
Markdown 导出
飞书导出
```

---

## Privacy & Permissions / 隐私与权限说明

### Single Purpose Description / 单一用途说明

**English**:
```text
This extension allows users to export the transcript content of their own Feishu Minutes (飞书妙记) meetings or embedded document minutes as Markdown files. It operates on feishu.cn domain, reads the logged-in user's session cookie to authenticate API calls to Feishu Minutes endpoints, and saves a formatted Markdown file named after the meeting. No data is collected, stored, or transmitted to any third party.
```

**Chinese (Simplified)**:
```text
本扩展的单一用途是帮助用户将自己的飞书妙记（或飞书云文档中关联的妙记）转写文本一键导出为 Markdown 文件。本扩展仅在 feishu.cn 域名运行，读取登录态 Cookie 以调用飞书官方 API 获取转写文本与会议名称，并在本地生成 Markdown 文件下载。扩展绝不收集、存储或向任何第三方传输用户数据。
```

### Justifications / 权限声明理由

#### cookies permission justification
**English**:
```text
Used to read the user's existing Feishu login session cookie on feishu.cn in order to authenticate API requests to the Feishu Minutes transcript and Docx endpoints. Without this cookie, the API returns 401 Unauthorized. The cookie is read locally and sent exclusively to feishu.cn.
```

**Chinese (Simplified)**:
```text
用于读取用户在 feishu.cn 的飞书登录会话 Cookie，以通过飞书官方妙记与文档 API 的身份验证。若无此 Cookie，API 将返回 401 认证失败。Cookie 仅在本地浏览器读取并仅随请求发送至 feishu.cn 官方服务器。
```

#### downloads permission justification
**English**:
```text
Used to save the generated Markdown (.md) file to the user's local Downloads folder via chrome.downloads.download API. The extension does not access, read, or modify any existing files on the user's computer.
```

**Chinese (Simplified)**:
```text
用于通过 chrome.downloads.download API 将生成的 Markdown 文件保存至用户本地“下载”文件夹。扩展不会访问、读取或修改用户设备上的任何其他现有文件。
```

#### declarativeNetRequest permission justification
**English**:
```text
Used to statically append a "Referer: https://*.feishu.cn/" header to API requests sent to feishu.cn. Feishu API rejects requests without a valid Referer header (HTTP 400).
```

**Chinese (Simplified)**:
```text
用于静态为发送至 feishu.cn 的 API 请求追加“Referer: https://*.feishu.cn/”标头。飞书官方 API 会拒绝没有有效 Referer 标头的请求。
```

#### Host Permission (`https://*.feishu.cn/*`) justification
**English**:
```text
Required to (1) read the Feishu session cookie for API authentication, and (2) inject the content script that provides the floating export button on Feishu Minutes and Cloud Document pages.
```

**Chinese (Simplified)**:
```text
用于 (1) 读取飞书会话 Cookie 进行 API 认证，及 (2) 注入 Content Script 在飞书妙记和云文档页面提供快捷导出悬浮按钮。
```

---

## Privacy Policy URL / 隐私政策链接

```text
https://github.com/duying0425/MinuteExport/blob/master/store/PRIVACY.md
```

---

## Notes for Certification / 给审核人员的备注

**English**:
```text
This extension exports Feishu Minutes (飞书妙记) meeting transcripts to Markdown format.

Test steps:
1. Log in to https://feishu.cn in the browser.
2. Open any Feishu Minutes page (https://*.feishu.cn/minutes/...) or Feishu Cloud Document (https://*.feishu.cn/docx/...).
3. Click the extension toolbar icon or the bottom-right "📥 Export Minutes" button.
4. A Markdown file will be downloaded, named after the meeting title.

Features in v1.3.0:
- Full English and Simplified Chinese bilingual support automatically matched with browser locale.
- Zero-scroll Docx resolution: Extracts embedded Minutes tokens via Feishu Docx block APIs directly without requiring user scroll.
```

**Chinese (Simplified)**:
```text
本扩展用于将飞书妙记会议转写内容导出为 Markdown 文件。

测试步骤：
1. 在浏览器中登录 https://feishu.cn 账号。
2. 打开任意飞书妙记页面 (https://*.feishu.cn/minutes/...) 或飞书云文档页面 (https://*.feishu.cn/docx/...)。
3. 点击插件工具栏图标或页面右下角的“📥 导出妙记”按钮。
4. 格式化好的 Markdown 文件将自动保存至本地。

v1.3.0 新增功能：
- 完整支持中英文双语界面，根据浏览器语言环境自动切换。
- 支持云文档零滚动识别：通过飞书 Docx API 直接提取嵌套的妙记 Token，无需滚动页面即可完成导出。
```

---

## Category / 分类

```text
Productivity / 生产力
```

---

## Submission History / 发布历史

| Version | Date | Status | Highlights |
|---|---|---|---|
| 1.2.0 | 2026-07-07 | Released | Single-click export for Feishu Minutes pages |
| 1.3.0 | 2026-07-23 | Ready for submission | Full bilingual (zh_CN/en) i18n support & zero-scroll Docx API resolution |
