# 飞书妙记导出 - 浏览器插件

一个 Manifest V3 的 Chrome/Edge 插件，一键把飞书妙记转写导出为 Markdown 文件，文件名自动用会议名。

## 特性

- 自动复用浏览器已登录的飞书 cookie，**无需粘贴 cookie**
- 自动从妙记页面解析会议名作为导出文件名
- 调用与 Python 版相同的内部 API（`/minutes/api/speakers`、`/minutes/api/subtitles_v2`）
- 输出带时间戳和说话人的 Markdown
- 三种触发方式：弹窗导出、详情页浮动按钮、列表页直接下载

## 安装（开发者模式）

1. 打开 Chrome/Edge：地址栏访问 `chrome://extensions/`（Edge 是 `edge://extensions/`）
2. 右上角打开「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本目录（`extension/`）

## 使用

### 方式一：弹窗导出

1. 在浏览器登录飞书
2. 点击插件图标，弹出窗口
3. 粘贴妙记链接（如果在妙记页面打开插件，会自动填充当前 URL）
4. 点击「导出为 Markdown」
5. 文件会下载到浏览器默认下载目录，文件名为会议名（如 `ADAS&RJ本田交流情报共享 のビデオ会議.md`）

### 方式二：详情页浮动按钮

在妙记详情页（`/minutes/{token}`）右下角会自动出现「📥 导出妙记」按钮，点击即可导出。

### 方式三：列表页直接下载

在妙记列表页（`/minutes/me`、`/minutes/home`、`/minutes/shared`、`/minutes/trash`、`/minutes/list`）每条记录的操作菜单旁会注入一个下载图标按钮。

- 点击后自动打开对应妙记详情页并触发下载
- 下载完成后自动关闭新打开的标签页
- 支持 `/minutes/{token}`（旧版）和 `/docx/{token}`（新版）两种链接类型
- `/docx/` 类型会自动点击「查看妙记/打开妙记」菜单项跳转到妙记详情页后再触发下载

## 权限说明

| 权限 | 用途 |
| --- | --- |
| `cookies` | 读取飞书域 cookie（实际通过 `credentials: 'include'` 由浏览器自动带上，此项主要用于声明） |
| `downloads` | 调用 `chrome.downloads.download` 保存 Markdown 文件 |
| `declarativeNetRequest` | 给飞书 API 请求注入 `Referer` 头（飞书网关强制校验，规则见 `rules_referer.json`） |
| `host_permissions: https://*.feishu.cn/*` | 允许 fetch 飞书域接口和页面 |

## 文件结构

```
extension/
├── manifest.json        # 插件配置
├── popup.html           # 弹窗 UI
├── popup.js             # 弹窗逻辑
├── background.js        # service worker：调 API、生成并下载 Markdown
├── content.js           # content script：浮动按钮 + 列表页直接下载按钮 + 自动下载流程
├── rules_referer.json   # declarativeNetRequest 规则（注入 Referer）
└── icons/
    └── icon.png         # 图标（256x256 PNG）
```

## 已知限制

- 仅在已登录飞书的浏览器中可用
- 飞书内部 API 变更可能导致失效
- service worker 在 MV3 下不常驻，每次点击会重新启动（不影响功能）
- 列表页 `/docx/` 类型下载通过模拟点击菜单实现，飞书 UI 变更可能影响按钮定位

## 测试

单元测试位于仓库根目录的 `tests/` 下，无需浏览器环境：

```bash
# 在仓库根目录运行
node tests/test.js
```

测试使用 Node.js `vm` 模块加载本目录下的实际源码进行纯函数验证。
