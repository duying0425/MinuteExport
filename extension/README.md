# 飞书妙记导出 - 浏览器插件

一个 Manifest V3 的 Chrome/Edge 插件，一键把飞书妙记转写导出为 Markdown 文件，文件名自动用会议名。

## 特性

- 自动复用浏览器已登录的飞书 cookie，**无需粘贴 cookie**
- 自动从妙记页面解析会议名作为导出文件名
- 调用与 Python 版相同的内部 API（`/minutes/api/speakers`、`/minutes/api/subtitles_v2`）
- 输出带时间戳和说话人的 Markdown

## 安装（开发者模式）

1. 打开 Chrome/Edge：地址栏访问 `chrome://extensions/`（Edge 是 `edge://extensions/`）
2. 右上角打开「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本目录（`extension/`）

## 使用

1. 在浏览器登录飞书
2. 点击插件图标，弹出窗口
3. 粘贴妙记链接（如果在妙记页面打开插件，会自动填充当前 URL）
4. 点击「导出为 Markdown」
5. 文件会下载到浏览器默认下载目录，文件名为会议名（如 `ADAS&RJ本田交流情报共享 のビデオ会議.md`）

## 权限说明

| 权限 | 用途 |
| --- | --- |
| `cookies` | 读取飞书域 cookie（实际通过 `credentials: 'include'` 由浏览器自动带上，此项主要用于声明） |
| `downloads` | 调用 `chrome.downloads.download` 保存 Markdown 文件 |
| `host_permissions: https://*.feishu.cn/*` | 允许 fetch 飞书域接口和页面 |

## 文件结构

```
extension/
├── manifest.json    # 插件配置
├── popup.html       # 弹窗 UI
├── popup.js         # 弹窗逻辑
├── background.js    # service worker：抓页面、调 API、下载
└── icons/
    └── icon.svg     # 图标
```

## 已知限制

- 仅在已登录飞书的浏览器中可用
- 飞书内部 API 变更可能导致失效
- SVG 图标在某些旧版 Chrome 可能不显示，可自行替换为 PNG
- service worker 在 MV3 下不常驻，每次点击会重新启动（不影响功能）
