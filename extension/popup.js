// 飞书妙记导出 - popup 逻辑

function getMessage(key, fallback) {
  if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
    const msg = chrome.i18n.getMessage(key);
    if (msg) return msg;
  }
  return fallback;
}

const titleEl = document.getElementById('title');
const urlLabelEl = document.getElementById('urlLabel');
const urlInput = document.getElementById('url');
const btn = document.getElementById('export');
const statusEl = document.getElementById('status');

// 初始化 i18n UI 文本
if (titleEl) titleEl.textContent = getMessage('popupTitle', '飞书妙记导出');
if (urlLabelEl) urlLabelEl.textContent = getMessage('popupUrlLabel', '妙记链接');
if (urlInput) urlInput.placeholder = getMessage('popupUrlPlaceholder', 'https://reachauto.feishu.cn/minutes/xxxx');
if (btn) btn.textContent = getMessage('popupExportBtn', '导出为 Markdown');

// 当前激活标签页的 URL（用于自动填充）
if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabUrl = tabs[0] && tabs[0].url;
    if (tabUrl && /https:\/\/[^/]+\.feishu\.cn\/(minutes|docx|docs|wiki)\//.test(tabUrl)) {
      urlInput.value = tabUrl;
    }
  });
}

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = kind || '';
}

btn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    setStatus(getMessage('popupEmptyUrlErr', '请填入妙记链接'), 'error');
    return;
  }
  if (!/^https:\/\/[^/]+\.feishu\.cn\/(minutes|docx|docs|wiki)\//.test(url)) {
    setStatus(getMessage('popupInvalidUrlErr', '链接格式不对，需要是 https://xxx.feishu.cn/minutes/xxx 或 /docx/xxx'), 'error');
    return;
  }

  btn.disabled = true;
  setStatus(getMessage('popupExporting', '正在导出…'));

  try {
    const result = await chrome.runtime.sendMessage({ type: 'export', url });
    if (result.ok) {
      setStatus(`${getMessage('popupSuccess', '完成：')}${result.filename}`, 'ok');
    } else {
      setStatus(`${getMessage('popupFailed', '失败：')}${result.error}`, 'error');
    }
  } catch (e) {
    setStatus(`${getMessage('popupFailed', '失败：')}${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
});
