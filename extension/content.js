// 飞书妙记导出 - content script
// 在妙记页面右下角注入一个浮动按钮，一键导出
// 防止重复注入
if (!window.__feishuMinutesExportInjected) {
  window.__feishuMinutesExportInjected = true;

  let btnEl = null;      // 当前挂载的根元素
  let styleEl = null;    // 注入的 style
  let lastShown = false; // 当前是否处于显示状态

  // 注入一次全局样式
  styleEl = document.createElement('style');
  styleEl.id = '__feishu_minutes_export_style';
  styleEl.textContent = `
    #__feishu_minutes_export_btn {
      position: fixed !important;
      right: 24px !important;
      bottom: 24px !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      pointer-events: auto;
    }
    #__feishu_minutes_export_btn button {
      background: #3370ff;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(51, 112, 255, 0.4);
      transition: all 0.15s ease;
    }
    #__feishu_minutes_export_btn button:hover:not(:disabled) {
      background: #245bdb;
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(51, 112, 255, 0.5);
    }
    #__feishu_minutes_export_btn button:disabled {
      background: #aaa;
      cursor: wait;
      transform: none;
      box-shadow: none;
    }
    #__feishu_minutes_export_btn #__fme_tip {
      margin-top: 8px;
      background: rgba(30, 30, 30, 0.92);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      max-width: 320px;
      word-break: break-all;
      display: none;
      line-height: 1.5;
    }
    #__feishu_minutes_export_btn #__fme_tip.show { display: block; }
    #__feishu_minutes_export_btn #__fme_tip.ok { background: rgba(20, 120, 50, 0.95); }
    #__feishu_minutes_export_btn #__fme_tip.error { background: rgba(180, 30, 30, 0.95); }
  `;
  (document.head || document.documentElement).appendChild(styleEl);

  function isMinutesPage() {
    return /https:\/\/[^/]+\.feishu\.cn\/minutes\//.test(location.href);
  }

  function mountButton() {
    if (btnEl) return;
    const root = document.createElement('div');
    root.id = '__feishu_minutes_export_btn';
    root.innerHTML = `
      <button id="__fme_action">📥 导出妙记</button>
      <div id="__fme_tip"></div>
    `;
    (document.body || document.documentElement).appendChild(root);

    const btn = root.querySelector('#__fme_action');
    const tip = root.querySelector('#__fme_tip');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      showTip('正在导出…', '');
      try {
        const result = await chrome.runtime.sendMessage({ type: 'export', url: location.href });
        if (result && result.ok) {
          showTip('✅ 已下载：' + result.filename, 'ok');
        } else {
          showTip('❌ 失败：' + (result && result.error ? result.error : '未知错误'), 'error');
        }
      } catch (e) {
        showTip('❌ 失败：' + e.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });

    function showTip(msg, kind) {
      tip.textContent = msg;
      tip.className = 'show' + (kind ? ' ' + kind : '');
    }

    btnEl = root;
    console.log('[飞书妙记导出] 按钮已挂载 @', location.href);
  }

  function unmountButton() {
    if (!btnEl) return;
    btnEl.remove();
    btnEl = null;
  }

  // 定时检查 URL（妙记是 SPA，路由变化不会重新注入 content script）
  function check() {
    const should = isMinutesPage();
    if (should && !lastShown) mountButton();
    else if (!should && lastShown) unmountButton();
    lastShown = should;
  }
  check();
  setInterval(check, 1000);
}
