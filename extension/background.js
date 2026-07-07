// 飞书妙记导出 - service worker
// 流程：
// 1. 从 URL 提取 object_token
// 2. 调用 /space/api/meta/ 获取会议名（title）
// 3. 调用 /minutes/api/speakers 和 /minutes/api/subtitles_v2
// 4. 拼装 Markdown，用 chrome.downloads.download 保存

// 捕获完整的 origin（含 https://），避免 new URL() 报错
const BASE_HOST_RE = /^(https:\/\/[^/]+\.feishu\.cn)/;

function getToken(url) {
  const m = url.match(/\/minutes\/([a-zA-Z0-9]+)/);
  if (!m) throw new Error('无法从链接解析 object_token');
  return m[1];
}

async function callApi(baseUrl, path, params) {
  const u = new URL(baseUrl + path);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  const r = await fetch(u.toString(), {
    credentials: 'include',
    headers: {
      accept: 'application/json, text/plain, */*',
      platform: 'web',
      'x-lsc-terminal': 'web',
    },
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`API ${path} 失败 ${r.status}: ${body.substring(0, 200)}`);
  }
  const data = await r.json();
  if (data.code !== 0) {
    throw new Error(`API ${path} 业务错误: ${JSON.stringify(data).substring(0, 300)}`);
  }
  return data.data;
}

// 通过 /space/api/meta/ 获取会议名（type=28 表示妙记）
async function getMeetingName(baseUrl, token) {
  try {
    const data = await callApi(baseUrl, '/space/api/meta/', {
      need_extra_fields: '1',
      token: token,
      type: 28,
    });
    return {
      title: data.title || null,
      create_time: data.create_time,
      owner: data.owner_user_name,
    };
  } catch (e) {
    console.warn('获取会议名失败:', e);
    return null;
  }
}

async function getSpeakers(baseUrl, token) {
  const data = await callApi(baseUrl, '/minutes/api/speakers', {
    size: 10000,
    translate_lang: 'default',
    object_token: token,
    language: 'zh_cn',
  });
  const speakerMap = {};
  Object.entries(data.speaker_info_map || {}).forEach(([k, v]) => {
    speakerMap[k] = (v && v.user_name) || '未知';
  });
  return { paragraphToSpeaker: data.paragraph_to_speaker || {}, speakerMap };
}

async function getSubtitles(baseUrl, token) {
  const data = await callApi(baseUrl, '/minutes/api/subtitles_v2', {
    paragraph_id: '',
    size: 10000,
    translate_lang: 'default',
    is_fluent: 'false',
    filter_speaker: 'true',
    object_token: token,
    language: 'zh_cn',
  });
  return data.paragraphs || [];
}

function formatTime(ms) {
  const sec = Math.floor(Number(ms) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function safeFilename(name) {
  // Windows 禁用字符
  let n = name.replace(/[\\/:*?"<>|]/g, '_');
  n = n.trim().replace(/^\.+|\.+$/g, '');
  n = n.replace(/\s+/g, ' ');
  return n || 'meeting';
}

function buildMarkdown(meetingName, paragraphToSpeaker, speakerMap, paragraphs) {
  const lines = [];
  lines.push(`# ${meetingName || '飞书妙记转写'}\n`);
  for (const p of paragraphs) {
    const pid = p.pid;
    const speakerId = paragraphToSpeaker[pid];
    const speaker = speakerMap[speakerId] || '未知';
    const start = p.start_time || 0;
    let text = '';
    for (const sent of p.sentences || []) {
      for (const c of sent.contents || []) {
        text += c.content || '';
      }
    }
    if (text.trim()) {
      lines.push(`## ${formatTime(start)} ${speaker}\n`);
      lines.push(text.trim() + '\n');
    }
  }
  return lines.join('\n');
}

async function exportMinutes(url) {
  const hostMatch = url.match(BASE_HOST_RE);
  if (!hostMatch) throw new Error('无法识别飞书域名');
  const baseUrl = hostMatch[1];

  const token = getToken(url);
  console.log('object_token:', token);

  const meta = await getMeetingName(baseUrl, token);
  const meetingName = meta && meta.title;
  console.log('会议名:', meetingName);

  const { paragraphToSpeaker, speakerMap } = await getSpeakers(baseUrl, token);
  const paragraphs = await getSubtitles(baseUrl, token);

  const md = buildMarkdown(meetingName, paragraphToSpeaker, speakerMap, paragraphs);

  const filename = (meetingName ? safeFilename(meetingName) : 'meeting') + '.md';
  // service worker 里没有 URL.createObjectURL / Blob，
  // 用 data: URL 直接嵌入内容（UTF-8 百分号编码）
  const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);

  await new Promise((resolve, reject) => {
    chrome.downloads.download(
      { url: dataUrl, filename: filename, saveAs: false },
      (id) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(id);
        }
      },
    );
  });

  return { filename };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'export') return;
  exportMinutes(msg.url)
    .then((result) => sendResponse({ ok: true, filename: result.filename }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));
  // 必须返回 true 表示异步响应
  return true;
});
