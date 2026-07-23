// 飞书妙记导出 - content script
// 防止重复注入
if (!window.__feishuMinutesExportInjected) {
  window.__feishuMinutesExportInjected = true;

  function getMessage(key, fallback) {
    if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
      const msg = chrome.i18n.getMessage(key);
      if (msg) return msg;
    }
    return fallback;
  }

  let btnEl = null;      // 当前挂载 of the root element
  let styleEl = null;    // injected style
  let lastShown = false; // current visibility of the details page floating button

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

    /* 列表页直接下载按钮样式 */
    .__fme_list_download_btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 28px !important;
      height: 28px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      background: transparent !important;
      border: none !important;
      margin-right: 8px !important;
      transition: background-color 0.15s ease, color 0.15s ease !important;
      color: #646a73 !important;
    }
    .__fme_list_download_btn:hover {
      background-color: rgba(31, 35, 41, 0.08) !important;
      color: #3370ff !important;
    }
    .__fme_list_download_btn svg {
      width: 16px !important;
      height: 16px !important;
      fill: currentColor !important;
    }
  `;
  (document.head || document.documentElement).appendChild(styleEl);

  function isMinutesDetailPage() {
    const path = location.pathname;
    const m = path.match(/^\/minutes\/([a-zA-Z0-9]+)/);
    if (!m) return false;
    const token = m[1].toLowerCase();
    const listPages = ['me', 'home', 'shared', 'trash', 'space', 'list'];
    return !listPages.includes(token);
  }

  function isListPage() {
    const path = location.pathname;
    const m = path.match(/^\/minutes\/([a-zA-Z0-9]+)/);
    if (!m) return false;
    const token = m[1].toLowerCase();
    const listPages = ['me', 'home', 'shared', 'trash', 'list'];
    return listPages.includes(token);
  }

  function isDocxPage() {
    const path = location.pathname;
    return /^\/(docx|docs|wiki)\/([a-zA-Z0-9]+)/i.test(path);
  }

  function getToken(url) {
    const m = url.match(/\/minutes\/([a-zA-Z0-9]+)/);
    return m ? m[1] : null;
  }

  function simulateClick(el) {
    const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
    events.forEach(name => {
      let ev;
      if (name.startsWith('pointer')) {
        ev = new PointerEvent(name, {
          bubbles: true,
          cancelable: true,
          view: window
        });
      } else {
        ev = new MouseEvent(name, {
          bubbles: true,
          cancelable: true,
          view: window
        });
      }
      el.dispatchEvent(ev);
    });
  }

  function findMenuOption(text) {
    const elements = Array.from(document.querySelectorAll('*'));
    const candidates = elements.filter(el => {
      const content = el.textContent.trim();
      return content.includes(text);
    });
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.innerHTML.length - b.innerHTML.length);
    return candidates[0];
  }

  function getOrigin() {
    if (typeof location !== 'undefined' && location.origin && location.origin !== 'null' && location.origin !== 'undefined') {
      return location.origin;
    }
    if (typeof location !== 'undefined' && location.href) {
      try { return new URL(location.href).origin; } catch (e) {}
    }
    return 'https://reachauto.feishu.cn';
  }

  function findMinuteUrlInPage() {
    const listPages = ['me', 'home', 'shared', 'trash', 'space', 'list'];

    // 1. 高效 DOM 节点选择器匹配 (支持 href, src, data-url, data-href, data-raw-href, data-link)
    if (document.querySelectorAll) {
      const selectors = [
        'a[href*="/minutes/"]',
        'a[data-href*="/minutes/"]',
        'iframe[src*="/minutes/"]',
        '[data-url*="/minutes/"]',
        '[data-href*="/minutes/"]',
        '[data-raw-href*="/minutes/"]',
        '[data-link*="/minutes/"]'
      ];
      const elements = Array.from(document.querySelectorAll(selectors.join(',')));
      for (const el of elements) {
        const rawUrl = el.href || el.getAttribute('data-href') || el.src || el.getAttribute('data-url') || el.getAttribute('data-raw-href') || el.getAttribute('data-link') || el.getAttribute('href') || '';
        const m = rawUrl.match(/(?:\\\/|\/|%2F)minutes(?:\\\/|\/|%2F)([a-zA-Z0-9]+)/i);
        if (m && !listPages.includes(m[1].toLowerCase())) {
          if (rawUrl.startsWith('http') && !rawUrl.includes('\\/')) return rawUrl;
          return getOrigin() + '/minutes/' + m[1];
        }
      }
    }

    // 2. 只有在按钮未挂载或未检测到目标时，全局 HTML 源码 + JS 内存数据深度匹配
    if (!btnEl || !activeTargetUrl) {
      let fullHtml = (document.documentElement && document.documentElement.innerHTML) || '';
      
      // 深度提取页面全局内存数据 (如 window.clientVars, SSR_DATA, __INITIAL_STATE__)
      try {
        if (typeof window !== 'undefined') {
          if (window.clientVars) fullHtml += JSON.stringify(window.clientVars);
          if (window.SSR_DATA) fullHtml += JSON.stringify(window.SSR_DATA);
          if (window.__INITIAL_STATE__) fullHtml += JSON.stringify(window.__INITIAL_STATE__);
        }
      } catch (e) {}

      // 支持普通斜杠 /minutes/、JSON 转义斜杠 \/minutes\/ 以及 URL 编码 %2Fminutes%2F
      const regex = /(?:\\\/|\/|%2F)minutes(?:\\\/|\/|%2F)([a-zA-Z0-9]{15,})/gi;
      const matches = fullHtml.match(regex);
      if (matches) {
        for (const rawMatch of matches) {
          const tokenMatch = rawMatch.match(/(?:\\\/|\/|%2F)minutes(?:\\\/|\/|%2F)([a-zA-Z0-9]+)/i);
          if (tokenMatch) {
            const token = tokenMatch[1];
            if (!listPages.includes(token.toLowerCase())) {
              return getOrigin() + '/minutes/' + token;
            }
          }
        }
      }
    }

    return null;
  }

  function getExportTargetUrl() {
    if (isMinutesDetailPage()) {
      return location.href;
    }
    if (isListPage()) {
      return null;
    }
    const found = findMinuteUrlInPage();
    if (found) return found;

    // 若为云文档页面（/docx/ /docs/ /wiki/），即使 DOM 尚未滚动出妙记卡片，
    // 也立即挂载按钮，由 Service Worker 在导出时通过 API 解析 Block 结构
    if (isDocxPage()) {
      return location.href;
    }

    return activeTargetUrl;
  }

  let activeTargetUrl = null;

  function mountButton(targetUrl) {
    activeTargetUrl = targetUrl;
    if (btnEl) return;
    const root = document.createElement('div');
    root.id = '__feishu_minutes_export_btn';
    root.innerHTML = `
      <button id="__fme_action">${getMessage('btnExport', '📥 导出妙记')}</button>
      <div id="__fme_tip"></div>
    `;
    (document.body || document.documentElement).appendChild(root);

    const btn = root.querySelector('#__fme_action');
    const tip = root.querySelector('#__fme_tip');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      showTip(getMessage('btnExporting', '正在导出…'), '');
      try {
        const exportUrl = activeTargetUrl || location.href;
        const result = await chrome.runtime.sendMessage({ type: 'export', url: exportUrl });
        if (result && result.ok) {
          showTip(getMessage('tipDownloaded', '✅ 已下载：') + result.filename, 'ok');
        } else {
          showTip(getMessage('tipFailed', '❌ 失败：') + (result && result.error ? result.error : getMessage('tipUnknownErr', '未知错误')), 'error');
        }
      } catch (e) {
        showTip(getMessage('tipFailed', '❌ 失败：') + e.message, 'error');
      } finally {
        btn.disabled = false;
      }
    });

    function showTip(msg, kind) {
      tip.textContent = msg;
      tip.className = 'show' + (kind ? ' ' + kind : '');
    }

    btnEl = root;
    console.log('[飞书妙记导出] 按钮已挂载 @', location.href, '目标 URL:', targetUrl);
  }

  function unmountButton() {
    if (!btnEl) return;
    btnEl.remove();
    btnEl = null;
  }

  function injectListDownloadButtons() {
    if (!isListPage()) return;

    const rows = document.querySelectorAll('.meeting-list-item-wrapper');
    rows.forEach(row => {
      const menuWrapper = row.querySelector('.meeting-item-menu-wrapper');
      if (!menuWrapper) return;

      if (row.querySelector('.__fme_list_download_btn')) return;

      const btn = document.createElement('button');
      btn.className = '__fme_list_download_btn';
      btn.title = getMessage('listBtnTitle', '直接下载 Markdown');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16L7 11H10V4H14V11H17L12 16Z" fill="currentColor"/>
          <path d="M5 18H19V20H5V18Z" fill="currentColor"/>
        </svg>
      `;

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';

        try {
          const linkEl = row.querySelector('a.meeting-list-item');
          if (!linkEl) {
            alert(getMessage('errNoMeetingLink', '未找到会议链接'));
            return;
          }

          const href = linkEl.href;
          if (href.includes('/minutes/')) {
            const token = getToken(href);
            if (token) {
              localStorage.setItem('auto_download_' + token, 'true');
              window.open(href, '_blank');
            } else {
              alert(getMessage('errParseToken', '无法解析会议Token'));
            }
          } else if (href.includes('/docx/')) {
            const menuBtn = row.querySelector('.meeting-menu-btn');
            if (!menuBtn) {
              alert(getMessage('errNoMenuBtn', '未找到操作菜单按钮'));
              return;
            }
            const targetBtn = menuBtn.querySelector('.meeting-list-item-action-icon') || menuBtn;
            const svgEl = menuBtn.querySelector('svg');
            
            // Dispatch clicks to the button, the icon span, and the SVG to cover all possible target event listeners
            simulateClick(menuBtn);
            if (targetBtn !== menuBtn) simulateClick(targetBtn);
            if (svgEl) simulateClick(svgEl);

            let attempts = 0;
            const maxAttempts = 40;
            const pollInterval = setInterval(() => {
              attempts++;
              const openMinutesOption = findMenuOption('查看妙记') || findMenuOption('打开妙记') || findMenuOption('View Minutes') || findMenuOption('Open Minutes');
              if (openMinutesOption) {
                clearInterval(pollInterval);
                localStorage.setItem('auto_download_any_next', 'true');
                simulateClick(openMinutesOption);
              } else if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                alert(getMessage('errMenuTimeout', '打开菜单超时，未找到“查看妙记”或“打开妙记”选项'));
              }
              if (attempts >= maxAttempts || openMinutesOption) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
              }
            }, 50);
            return;
          } else {
            alert(getMessage('errUnknownLink', '未知的链接类型：') + href);
          }
        } catch (err) {
          console.error('[飞书妙记导出] 触发下载失败:', err);
          alert(getMessage('errDownloadFailed', '下载失败: ') + err.message);
        }

        setTimeout(() => {
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
        }, 1000);
      });

      const menuBtnContainer = menuWrapper.querySelector('.meeting-menu-btn')?.parentNode || menuWrapper;
      menuBtnContainer.insertBefore(btn, menuBtnContainer.firstChild);
    });
  }

  function checkAutoDownload() {
    if (!isMinutesDetailPage()) return;

    const token = getToken(location.href);
    const hasTokenFlag = token && localStorage.getItem('auto_download_' + token) === 'true';
    const hasAnyFlag = localStorage.getItem('auto_download_any_next') === 'true';

    if (hasTokenFlag || hasAnyFlag) {
      if (token) localStorage.removeItem('auto_download_' + token);
      localStorage.removeItem('auto_download_any_next');

      console.log('[飞书妙记导出] 检测到自动下载标记，准备导出...');

      let attempts = 0;
      const btnInterval = setInterval(() => {
        attempts++;
        const btn = document.getElementById('__fme_action');
        if (btn) {
          clearInterval(btnInterval);
          console.log('[飞书妙记导出] 触发导出按钮点击');
          btn.click();

          const tip = document.getElementById('__fme_tip');
          let tipAttempts = 0;
          const closeInterval = setInterval(() => {
            tipAttempts++;
            if (tip && (tip.classList.contains('ok') || tip.classList.contains('error'))) {
              clearInterval(closeInterval);
              console.log('[飞书妙记导出] 导出完成，准备在 1.5 秒后关闭窗口');
              setTimeout(() => {
                window.close();
              }, 1500);
            } else if (tipAttempts > 120) {
              clearInterval(closeInterval);
              console.warn('[飞书妙记导出] 自动导出超时或未检测到状态更新');
            }
          }, 500);
        } else if (attempts > 100) {
          clearInterval(btnInterval);
          console.error('[飞书妙记导出] 未找到导出按钮');
        }
      }, 100);
    }
  }

  // 定时检查 URL（妙记/文档是 SPA，路由变化不会重新注入 content script）
  function check() {
    const targetUrl = getExportTargetUrl();
    if (targetUrl) {
      activeTargetUrl = targetUrl;
      if (!lastShown) mountButton(targetUrl);
    } else {
      activeTargetUrl = null;
      if (lastShown) unmountButton();
    }
    lastShown = !!targetUrl;

    // 检查列表页的按钮注入
    if (isListPage()) {
      injectListDownloadButtons();
    }

    // 检查是否有自动下载的命令
    if (isMinutesDetailPage()) {
      checkAutoDownload();
    }
  }

  check();
  setInterval(check, 1000);
}
