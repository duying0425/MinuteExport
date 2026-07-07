# MinuteExport

飞书妙记（Feishu Minutes）转写内容导出工具。通过模拟浏览器请求，调用飞书妙记的内部 API，把会议转写内容导出为 Markdown 文件。

## 功能

- 根据妙记链接提取 `object_token`
- 调用 `/space/api/meta/`（type=28）获取会议名作为文件名
- 调用 `/minutes/api/speakers` 获取说话人映射
- 调用 `/minutes/api/subtitles_v2` 获取分段字幕
- 输出带时间戳和说话人的 Markdown 文件到 `output/` 目录，文件名即会议名

## 环境要求

- Python 3.x
- `requests` 库：`pip install requests`
- GitHub CLI（可选，仅用于推送仓库）

## 使用方法

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

## 示例输出

```markdown
# 飞书妙记转写

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
├── export.py              # 主脚本
├── cookies.json           # 真实 cookie（不提交）
├── cookies.example.json   # cookie 模板
├── output/                # 导出结果目录（不提交）
│   └── <会议名>.md
├── extension/             # 浏览器插件
└── README.md
```
