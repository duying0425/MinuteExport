// 飞书妙记导出 - content script
// 防止重复注入
if (!window.__feishuMinutesExportInjected) {
  window.__feishuMinutesExportInjected = true;

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

  function injectListDownloadButtons() {
    if (!isListPage()) return;

    const rows = document.querySelectorAll('.meeting-list-item-wrapper');
    rows.forEach(row => {
      const menuWrapper = row.querySelector('.meeting-item-menu-wrapper');
      if (!menuWrapper) return;

      if (row.querySelector('.__fme_list_download_btn')) return;

      const btn = document.createElement('button');
      btn.className = '__fme_list_download_btn';
      btn.title = '直接下载 Markdown';
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
            alert('未找到会议链接');
            return;
          }

          const href = linkEl.href;
          if (href.includes('/minutes/')) {
            const token = getToken(href);
            if (token) {
              localStorage.setItem('auto_download_' + token, 'true');
              window.open(href, '_blank');
            } else {
              alert('无法解析会议Token');
            }
          } else if (href.includes('/docx/')) {
            const menuBtn = row.querySelector('.meeting-menu-btn');
            if (!menuBtn) {
              alert('未找到操作菜单按钮');
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
              const openMinutesOption = findMenuOption('查看妙记') || findMenuOption('打开妙记');
              if (openMinutesOption) {
                clearInterval(pollInterval);
                localStorage.setItem('auto_download_any_next', 'true');
                simulateClick(openMinutesOption);
              } else if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                alert('打开菜单超时，未找到“查看妙记”或“打开妙记”选项');
              }
              if (attempts >= maxAttempts || openMinutesOption) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
              }
            }, 50);
            return;
          } else {
            alert('未知的链接类型：' + href);
          }
        } catch (err) {
          console.error('[飞书妙记导出] 触发下载失败:', err);
          alert('下载失败: ' + err.message);
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

  // 定时检查 URL（妙记是 SPA，路由变化不会重新注入 content script）
  function check() {
    const should = isMinutesDetailPage();
    if (should && !lastShown) mountButton();
    else if (!should && lastShown) unmountButton();
    lastShown = should;

    // 检查列表页的按钮注入
    if (isListPage()) {
      injectListDownloadButtons();
    }

    // 检查是否有自动下载的命令
    if (should) {
      checkAutoDownload();
    }
  }

  check();
  setInterval(check, 1000);
}
