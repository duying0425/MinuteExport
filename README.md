# MinuteExport

飞书妙记（Feishu Minutes）转写内容导出工具。通过模拟浏览器请求，调用飞书妙记的内部 API，把会议转写内容导出为带时间戳和说话人的 Markdown 文件。

提供两种使用方式：

- **Python 脚本**：本地运行，需准备 cookie
- **浏览器插件**（Chrome/Edge，MV3）：一键导出，自动复用浏览器登录态，无需粘贴 cookie

## 功能

- 根据妙记链接提取 `object_token`
- 调用 `/space/api/meta/`（type=28）获取会议名作为文件名
- 调用 `/minutes/api/speakers` 获取说话人映射
- 调用 `/minutes/api/subtitles_v2` 获取分段字幕
- 输出带时间戳和说话人的 Markdown 文件，文件名即会议名
- 两种方式输出内容完全一致

---

## 方式一：Python 脚本

### 环境要求

- Python 3.x
- `requests` 库：`pip install requests`

### 1. 准备 cookies

浏览器登录飞书后，从开发者工具中复制以下 cookie 值，按 [cookies.example.json](cookies.example.json) 的格式保存为 `cookies.json`：

必需的核心 cookie：

| Cookie 名 | 说明 |
| --- | --- |
| `session` | 主登录态 |
| `session_list` | 会话列表 |
| `sl_session` | SSO 会话 token |
| `passport_app_access_token` | 用户 access token |
| `minutes_csrf_token` | 妙记接口 CSRF |
| `swp_csrf_token` | 网关 CSRF |
| `passport_web_did` / `X-Larkgw-Web-DID` | 设备指纹 |

建议同时保留以下风控相关 cookie：`MM_U_ID`、`msToken`、`t_beda37`、`s_v_web_id`、`ot`、`vt`。

### 2. 运行

```bash
python export.py https://<your-tenant>.feishu.cn/minutes/<token>
```

输出文件：`output/<会议名>.md`（会议名通过 `/space/api/meta/` 接口获取）

可选第二个参数指定输出文件名：

```bash
python export.py https://xxx.feishu.cn/minutes/xxxx 自定义名.md
```

文件仍会保存到 `output/` 目录下。

---

## 方式二：浏览器插件（推荐）

无需粘贴 cookie，直接复用浏览器已登录的飞书会话，点击一下即可下载 Markdown。

### 安装（开发者模式）

1. 打开扩展管理页：Chrome 访问 `chrome://extensions/`，Edge 访问 `edge://extensions/`
2. 打开右上角「开发者模式」开关
3. 点击「加载已解压的扩展程序」/「加载解压缩的扩展」
4. 选择本仓库的 [extension/](extension) 目录（**注意是 `extension` 子目录，不是仓库根目录**）
5. 建议在工具栏拼图图标里把「飞书妙记导出」固定到工具栏方便使用

> Edge 用户提示：因为是未签名扩展，每次启动 Edge 可能弹一次「禁用开发者扩展」提示，点「允许」保留即可。

### 使用

1. 在浏览器登录飞书
2. 打开任意妙记页面（或直接点插件图标）
3. 点击工具栏的插件图标，弹窗打开
4. 链接框会自动填充当前妙记页 URL（如果不是妙记页可手动粘贴）
5. 点击「导出为 Markdown」
6. 文件下载到浏览器默认下载目录，文件名为会议名（如 `ADAS&RJ本田交流情报共享 のビデオ会議.md`）

#### 三种触发导出的方式

1. **弹窗导出**：点击工具栏图标 → 弹窗中粘贴链接 → 点击「导出为 Markdown」
2. **详情页浮动按钮**：在妙记详情页（`/minutes/{token}`）右下角会自动出现「📥 导出妙记」按钮，点击即可导出
3. **列表页直接下载**（v1.2.0 新增）：在妙记列表页（`/minutes/me`、`/minutes/home` 等）每条记录的操作菜单旁会注入一个下载图标按钮，点击后会自动打开对应妙记并下载，下载完成后自动关闭标签页
   - 支持 `/minutes/{token}`（旧版）和 `/docx/{token}`（新版）两种链接类型
   - `/docx/` 类型会自动点击「查看妙记/打开妙记」菜单项跳转到妙记详情页后触发下载

### 权限说明

| 权限 | 用途 |
| --- | --- |
| `cookies` | 声明飞书域 cookie 访问（实际由 `credentials: 'include'` 自动带上） |
| `downloads` | 调用 `chrome.downloads.download` 保存 Markdown 文件 |
| `declarativeNetRequest` | 给飞书 API 请求注入 `Referer` 头（飞书网关强制校验） |
| `host_permissions: https://*.feishu.cn/*` | 允许 fetch 飞书域接口和页面 |

### 修改代码后如何生效

每次修改 `extension/` 下的文件后，需要去扩展管理页点对应卡片上的 ↻「重新加载」按钮，新代码才会生效。

---

## 测试

项目内置单元测试，使用 Node.js 内置 `vm` 模块加载 `extension/` 下的实际源码进行测试，无需浏览器环境。

### 运行测试

```bash
node tests/test.js
```

### 测试覆盖

共 76 个用例，覆盖以下纯函数：

| 文件 | 函数 | 用例数 | 说明 |
| --- | --- | --- | --- |
| `background.js` | `getToken` | 10 | URL 解析、各种链接格式、错误处理 |
| `background.js` | `formatTime` | 10 | 毫秒转 `HH:MM:SS`、边界值、类型转换 |
| `background.js` | `safeFilename` | 16 | Windows 非法字符替换、首尾清理、回退值 |
| `background.js` | `buildMarkdown` | 9 | Markdown 拼装、空段落、说话人映射、多句子 |
| `background.js` | `BASE_HOST_RE` | 4 | 飞书域名正则匹配 |
| `content.js` | `isMinutesDetailPage` | 11 | 详情页识别、列表页排除、大小写 |
| `content.js` | `isListPage` | 9 | 列表页识别 |
| `content.js` | `getToken` | 4 | URL 解析（仅匹配 `/minutes/`） |
| 一致性检查 | — | 2 | content.js 与 background.js 的 getToken 行为对比 |
| 静态分析 | — | 6 | 已知问题与边界情况记录 |

### 测试机制

- 通过 `vm.createContext` 创建沙箱，模拟 `chrome`、`document`、`localStorage`、`location` 等浏览器环境
- 在源码末尾注入导出语句，暴露内部纯函数供测试调用
- 所有测试针对**真实源码**而非副本，源码修改后重跑即可验证

---

## 示例输出

```markdown
# ADAS&RJ本田交流情报共享 のビデオ会議

## 00:00:15 张三

能听见吗？

## 00:00:21 李四

啊，能听见。
```

## 注意事项

- `cookies.json` 等同于你的登录态，**切勿提交到公开仓库**，已在 `.gitignore` 中排除。
- 用完后建议在飞书退出登录让旧 cookie 失效。
- 飞书内部 API 可能随时变化，如遇失效需自行抓包更新接口。
- 请遵守飞书相关使用条款，仅用于导出自己有权访问的妙记内容。

## 文件结构

```
MinuteExport/
├── export.py              # Python 主脚本
├── cookies.json           # 真实 cookie（不提交）
├── cookies.example.json   # cookie 模板
├── output/                # Python 导出结果目录（不提交）
│   └── <会议名>.md
├── extension/             # 浏览器插件（MV3）
│   ├── manifest.json      # 插件配置
│   ├── background.js      # service worker：调 API、生成并下载 Markdown
│   ├── content.js         # content script：浮动按钮 + 列表页直接下载按钮
│   ├── popup.html         # 弹窗 UI
│   ├── popup.js           # 弹窗逻辑
│   ├── rules_referer.json # declarativeNetRequest 规则（注入 Referer）
│   ├── icons/icon.png     # 图标（256x256 PNG）
│   └── README.md          # 插件详细说明
├── tests/                 # 单元测试
│   └── test.js           # Node.js vm 沙箱测试（76 用例）
├── store/                 # Edge Add-ons 商店提交素材
│   ├── SUBMISSION.md      # 商店提交文本汇总（描述、关键词、权限说明、审核备注）
│   ├── PRIVACY.md         # 隐私政策
│   ├── promo_small_440x280.png   # 小推广图（440x280）
│   ├── promo_large_1400x560.png  # 大推广图（1400x560）
│   └── screenshot1_1280x800.png  # 商店截图（1280x800）
└── README.md
```
