// 飞书妙记导出 - popup 逻辑

const urlInput = document.getElementById('url');
const btn = document.getElementById('export');
const statusEl = document.getElementById('status');

// 当前激活标签页的 URL（用于自动填充）
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabUrl = tabs[0] && tabs[0].url;
  if (tabUrl && /https:\/\/[^/]+\.feishu\.cn\/minutes\//.test(tabUrl)) {
    urlInput.value = tabUrl;
  }
});

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = kind || '';
}

btn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    setStatus('请填入妙记链接', 'error');
    return;
  }
  if (!/^https:\/\/[^/]+\.feishu\.cn\/minutes\//.test(url)) {
    setStatus('链接格式不对，需要是 https://xxx.feishu.cn/minutes/xxx', 'error');
    return;
  }

  btn.disabled = true;
  setStatus('正在导出…');

  try {
    const result = await chrome.runtime.sendMessage({ type: 'export', url });
    if (result.ok) {
      setStatus(`完成：${result.filename}`, 'ok');
    } else {
      setStatus(`失败：${result.error}`, 'error');
    }
  } catch (e) {
    setStatus(`失败：${e.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
});
