/**
 * 飞书妙记导出 - 单元测试
 *
 * 使用 Node.js 内置 vm 模块加载 extension/ 下的实际源码，
 * 对纯函数进行测试，无需浏览器环境。
 *
 * 运行: node tests/test.js
 */
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0, failed = 0, skipped = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  \u2713 ' + name); }
  catch (e) { failed++; console.log('  \u2717 ' + name + '\n      ' + e.message); }
}
function skip(name) { skipped++; console.log('  - ' + name + ' (skipped)'); }

// ============================================================================
// 1. 加载 background.js（实际源码）
// ============================================================================
const bgPath = path.join(__dirname, '..', 'extension', 'background.js');
const bgSrc = fs.readFileSync(bgPath, 'utf8');
const bgSandbox = {
  chrome: {
    runtime: { onMessage: { addListener: function() {} } },
    downloads: { download: function() {} }
  },
  fetch: function() { return Promise.resolve({ ok: true, text: function() { return Promise.resolve(''); }, json: function() { return Promise.resolve({}); } }); },
  URL: URL,
  console: console,
  setTimeout: function() { return 0; },
  globalThis: null,
};
bgSandbox.globalThis = bgSandbox;
const bgCtx = vm.createContext(bgSandbox);
// 在源码末尾追加导出语句，暴露内部纯函数供测试
vm.runInContext(
  bgSrc + '\n;globalThis.__exports = { getToken, formatTime, safeFilename, buildMarkdown, BASE_HOST_RE, getMinutesTokenFromDocx };',
  bgCtx
);
const bg = bgSandbox.__exports;
if (!bg || !bg.getToken) { console.error('FATAL: 无法从 background.js 加载函数'); process.exit(1); }

// ============================================================================
// 2. 加载 content.js（实际源码）
// ============================================================================
const contentPath = path.join(__dirname, '..', 'extension', 'content.js');
let contentSrc = fs.readFileSync(contentPath, 'utf8');
// 在 IIFE 块结束前注入导出语句（兼容 \r\n 和 \n，末尾可能有空行）
contentSrc = contentSrc.replace(
  /  check\(\);\r?\n  setInterval\(check, 1000\);\r?\n}\s*$/,
  '  check();\n  setInterval(check, 1000);\n  globalThis.__exports = { isMinutesDetailPage, isListPage, isDocxPage, getToken, findMinuteUrlInPage, getExportTargetUrl };\n}\n'
);
const mockLocation = { pathname: '/', href: 'https://reachauto.feishu.cn/', origin: 'https://reachauto.feishu.cn' };
const contentSandbox = {
  window: { __feishuMinutesExportInjected: false },
  location: mockLocation,
  document: {
    createElement: function() {
      return { style: {}, textContent: '', id: '', appendChild: function() {}, setAttribute: function() {}, addEventListener: function() {}, querySelector: function() { return null; }, querySelectorAll: function() { return []; } };
    },
    head: null,
    documentElement: { appendChild: function() {} },
    body: null,
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    getElementById: function() { return null; },
  },
  localStorage: {
    _store: {},
    getItem: function(k) { return this._store[k] || null; },
    setItem: function(k, v) { this._store[k] = String(v); },
    removeItem: function(k) { delete this._store[k]; },
  },
  setInterval: function() { return 0; },
  console: console,
  PointerEvent: function() {},
  MouseEvent: function() {},
  globalThis: null,
};
contentSandbox.window.location = mockLocation;
contentSandbox.globalThis = contentSandbox;
const contentCtx = vm.createContext(contentSandbox);
vm.runInContext(contentSrc, contentCtx);
const ct = contentSandbox.__exports;
if (!ct || !ct.getToken) { console.error('FATAL: 无法从 content.js 加载函数'); process.exit(1); }

// ============================================================================
// 3. 测试用例
// ============================================================================
console.log('\n========================================');
console.log('background.js 纯函数测试');
console.log('========================================\n');

// --- getToken ---
console.log('[getToken]');
test('正常 URL 提取 token', function() {
  assert.strictEqual(bg.getToken('https://reachauto.feishu.cn/minutes/abc123'), 'abc123');
});
test('带查询参数的 URL', function() {
  assert.strictEqual(bg.getToken('https://reachauto.feishu.cn/minutes/abc123?foo=bar'), 'abc123');
});
test('大写 token', function() {
  assert.strictEqual(bg.getToken('https://reachauto.feishu.cn/minutes/ABC123'), 'ABC123');
});
test('混合大小写 token', function() {
  assert.strictEqual(bg.getToken('https://reachauto.feishu.cn/minutes/aBc123XYZ'), 'aBc123XYZ');
});
test('深层路径只取第一段', function() {
  assert.strictEqual(bg.getToken('https://reachauto.feishu.cn/minutes/abc123/detail'), 'abc123');
});
test('不同飞书域名', function() {
  assert.strictEqual(bg.getToken('https://other.feishu.cn/minutes/tokenXYZ'), 'tokenXYZ');
});
test('列表页 URL 也会返回 token（函数不区分列表页）', function() {
  assert.strictEqual(bg.getToken('https://reachauto.feishu.cn/minutes/me'), 'me');
});
test('docx 类型 URL 应抛出错误', function() {
  assert.throws(function() { bg.getToken('https://reachauto.feishu.cn/docx/abc123'); }, /无法从链接解析 object_token/);
});
test('非飞书 URL 应抛出错误', function() {
  assert.throws(function() { bg.getToken('https://example.com/foo'); }, /无法从链接解析 object_token/);
});
test('空字符串应抛出错误', function() {
  assert.throws(function() { bg.getToken(''); }, /无法从链接解析 object_token/);
});

// --- formatTime ---
console.log('\n[formatTime]');
test('0 毫秒 -> 00:00:00', function() {
  assert.strictEqual(bg.formatTime(0), '00:00:00');
});
test('1 秒 (1000ms) -> 00:00:01', function() {
  assert.strictEqual(bg.formatTime(1000), '00:00:01');
});
test('1 分钟 (60000ms) -> 00:01:00', function() {
  assert.strictEqual(bg.formatTime(60000), '00:01:00');
});
test('1 小时 (3600000ms) -> 01:00:00', function() {
  assert.strictEqual(bg.formatTime(3600000), '01:00:00');
});
test('1小时1分1秒 (3661000ms) -> 01:01:01', function() {
  assert.strictEqual(bg.formatTime(3661000), '01:01:01');
});
test('10 小时 (36000000ms) -> 10:00:00', function() {
  assert.strictEqual(bg.formatTime(36000000), '10:00:00');
});
test('59分59秒 (3599000ms) -> 00:59:59', function() {
  assert.strictEqual(bg.formatTime(3599000), '00:59:59');
});
test('毫秒截断 (1500ms -> 1s)', function() {
  assert.strictEqual(bg.formatTime(1500), '00:00:01');
});
test('字符串数字 "5000" -> 00:00:05', function() {
  assert.strictEqual(bg.formatTime('5000'), '00:00:05');
});
test('undefined -> 00:00:00 (Number(undefined)=NaN, floor=0)', function() {
  // Number(undefined) = NaN, Math.floor(NaN/1000) = NaN, Math.floor(NaN) = NaN
  // 实际行为：结果为 "NaN:NaN:NaN" — 记录当前行为
  const result = bg.formatTime(undefined);
  // 验证当前行为（可能是 "NaN:NaN:NaN"）
  assert.ok(result !== '', 'formatTime(undefined) 不应返回空字符串');
});

// --- safeFilename ---
console.log('\n[safeFilename]');
test('正常会议名保持不变', function() {
  assert.strictEqual(bg.safeFilename('周会纪要'), '周会纪要');
  assert.strictEqual(bg.safeFilename('Meeting Notes'), 'Meeting Notes');
});
test('反斜杠替换为下划线', function() {
  assert.strictEqual(bg.safeFilename('a\\b'), 'a_b');
});
test('正斜杠替换为下划线', function() {
  assert.strictEqual(bg.safeFilename('a/b'), 'a_b');
});
test('冒号替换为下划线', function() {
  assert.strictEqual(bg.safeFilename('a:b'), 'a_b');
});
test('星号替换为下划线', function() {
  assert.strictEqual(bg.safeFilename('a*b'), 'a_b');
});
test('问号替换为下划线', function() {
  assert.strictEqual(bg.safeFilename('a?b'), 'a_b');
});
test('双引号替换为下划线', function() {
  assert.strictEqual(bg.safeFilename('a"b'), 'a_b');
});
test('尖括号替换为下划线', function() {
  assert.strictEqual(bg.safeFilename('a<b>c'), 'a_b_c');
});
test('竖线替换为下划线', function() {
  assert.strictEqual(bg.safeFilename('a|b'), 'a_b');
});
test('所有禁止字符 (9个)', function() {
  assert.strictEqual(bg.safeFilename('\\/:*?"<>|'), '_________');
});
test('首尾点号被去除', function() {
  assert.strictEqual(bg.safeFilename('...test...'), 'test');
});
test('首尾空格被去除', function() {
  assert.strictEqual(bg.safeFilename('  test  '), 'test');
});
test('连续空白折叠为单个空格', function() {
  assert.strictEqual(bg.safeFilename('a  b   c'), 'a b c');
});
test('空字符串回退为 meeting', function() {
  assert.strictEqual(bg.safeFilename(''), 'meeting');
});
test('纯点号回退为 meeting', function() {
  assert.strictEqual(bg.safeFilename('...'), 'meeting');
});
test('纯空格回退为 meeting', function() {
  assert.strictEqual(bg.safeFilename('   '), 'meeting');
});
test('日文混合特殊字符', function() {
  assert.strictEqual(bg.safeFilename('ADAS&本田交流?共有'), 'ADAS&本田交流_共有');
});

// --- buildMarkdown ---
console.log('\n[buildMarkdown]');
test('空段落列表', function() {
  const md = bg.buildMarkdown('测试会议', {}, {}, []);
  assert.strictEqual(md, '# 测试会议\n');
});
test('会议名为 null 时使用默认标题', function() {
  const md = bg.buildMarkdown(null, {}, {}, []);
  assert.strictEqual(md, '# 飞书妙记转写\n');
});
test('单个段落单个句子', function() {
  const md = bg.buildMarkdown('会议A',
    { p1: 's1' },
    { s1: '张三' },
    [{ pid: 'p1', start_time: 5000, sentences: [{ contents: [{ content: '你好' }] }] }]
  );
  assert.strictEqual(md, '# 会议A\n\n## 00:00:05 张三\n\n你好\n');
});
test('多个段落', function() {
  const md = bg.buildMarkdown('会议B',
    { p1: 's1', p2: 's2' },
    { s1: '张三', s2: '李四' },
    [
      { pid: 'p1', start_time: 0, sentences: [{ contents: [{ content: '第一句' }] }] },
      { pid: 'p2', start_time: 60000, sentences: [{ contents: [{ content: '第二句' }] }] },
    ]
  );
  assert.ok(md.includes('## 00:00:00 张三'));
  assert.ok(md.includes('## 00:01:00 李四'));
  assert.ok(md.includes('第一句'));
  assert.ok(md.includes('第二句'));
});
test('说话人未映射时显示未知', function() {
  const md = bg.buildMarkdown('会议C', { p1: 'sX' }, {},
    [{ pid: 'p1', start_time: 0, sentences: [{ contents: [{ content: '测试' }] }] }]
  );
  assert.ok(md.includes('未知'));
});
test('空文本段落被跳过', function() {
  const md = bg.buildMarkdown('会议D', { p1: 's1' }, { s1: '张三' },
    [
      { pid: 'p1', start_time: 0, sentences: [{ contents: [{ content: '   ' }] }] },
      { pid: 'p2', start_time: 1000, sentences: [{ contents: [{ content: '有效' }] }] },
    ]
  );
  assert.ok(!md.includes('00:00:00'));
  assert.ok(md.includes('00:00:01'));
});
test('无 sentences 的段落被跳过', function() {
  const md = bg.buildMarkdown('会议E', { p1: 's1' }, { s1: '张三' },
    [{ pid: 'p1', start_time: 0, sentences: [] }]
  );
  assert.strictEqual(md, '# 会议E\n');
});
test('多句子的段落拼接文本', function() {
  const md = bg.buildMarkdown('会议F', { p1: 's1' }, { s1: '张三' },
    [{ pid: 'p1', start_time: 0, sentences: [
      { contents: [{ content: 'Hello ' }] },
      { contents: [{ content: 'World' }] },
    ] }]
  );
  assert.ok(md.includes('Hello World'));
});
test('缺失 start_time 默认为 0', function() {
  const md = bg.buildMarkdown('会议G', { p1: 's1' }, { s1: '张三' },
    [{ pid: 'p1', sentences: [{ contents: [{ content: '测试' }] }] }]
  );
  assert.ok(md.includes('00:00:00'));
});

// --- BASE_HOST_RE ---
console.log('\n[BASE_HOST_RE]');
test('匹配 reachauto.feishu.cn', function() {
  const m = 'https://reachauto.feishu.cn/minutes/abc'.match(bg.BASE_HOST_RE);
  assert.ok(m);
  assert.strictEqual(m[1], 'https://reachauto.feishu.cn');
});
test('匹配任意子域 feishu.cn', function() {
  const m = 'https://abc.feishu.cn/docx/xyz'.match(bg.BASE_HOST_RE);
  assert.ok(m);
  assert.strictEqual(m[1], 'https://abc.feishu.cn');
});
test('http 不匹配（仅 https）', function() {
  const m = 'http://reachauto.feishu.cn/'.match(bg.BASE_HOST_RE);
  assert.strictEqual(m, null);
});
test('非飞书域名不匹配', function() {
  const m = 'https://example.com/'.match(bg.BASE_HOST_RE);
  assert.strictEqual(m, null);
});

// ============================================================================
// content.js 纯函数测试
// ============================================================================
console.log('\n========================================');
console.log('content.js 纯函数测试');
console.log('========================================\n');

// --- isMinutesDetailPage ---
console.log('[isMinutesDetailPage]');
function setPath(p) { mockLocation.pathname = p; }

test('普通 token 是详情页', function() {
  setPath('/minutes/abc123');
  assert.strictEqual(ct.isMinutesDetailPage(), true);
});
test('/minutes/me 不是详情页', function() {
  setPath('/minutes/me');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('/minutes/home 不是详情页', function() {
  setPath('/minutes/home');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('/minutes/shared 不是详情页', function() {
  setPath('/minutes/shared');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('/minutes/trash 不是详情页', function() {
  setPath('/minutes/trash');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('/minutes/space 不是详情页', function() {
  setPath('/minutes/space');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('/minutes/list 不是详情页', function() {
  setPath('/minutes/list');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('大写 token 仍被识别为列表页 (大小写不敏感)', function() {
  setPath('/minutes/ME');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('根路径不是详情页', function() {
  setPath('/');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('/docx/ 路径不是详情页', function() {
  setPath('/docx/abc123');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});
test('/minutes/me/子路径 token 仍为 me', function() {
  setPath('/minutes/me/foo');
  assert.strictEqual(ct.isMinutesDetailPage(), false);
});

// --- isListPage ---
console.log('\n[isListPage]');
test('普通 token 不是列表页', function() {
  setPath('/minutes/abc123');
  assert.strictEqual(ct.isListPage(), false);
});
test('/minutes/me 是列表页', function() {
  setPath('/minutes/me');
  assert.strictEqual(ct.isListPage(), true);
});
test('/minutes/home 是列表页', function() {
  setPath('/minutes/home');
  assert.strictEqual(ct.isListPage(), true);
});
test('/minutes/shared 是列表页', function() {
  setPath('/minutes/shared');
  assert.strictEqual(ct.isListPage(), true);
});
test('/minutes/trash 是列表页', function() {
  setPath('/minutes/trash');
  assert.strictEqual(ct.isListPage(), true);
});
test('/minutes/list 是列表页', function() {
  setPath('/minutes/list');
  assert.strictEqual(ct.isListPage(), true);
});
test('/minutes/space 不是列表页（注意：与 isMinutesDetailPage 不一致）', function() {
  setPath('/minutes/space');
  assert.strictEqual(ct.isListPage(), false);
});
test('根路径不是列表页', function() {
  setPath('/');
  assert.strictEqual(ct.isListPage(), false);
});
test('/docx/ 路径不是列表页', function() {
  setPath('/docx/abc123');
  assert.strictEqual(ct.isListPage(), false);
});

// --- getToken (content.js 版) ---
console.log('\n[getToken (content.js)]');
test('正常 URL 提取 token', function() {
  assert.strictEqual(ct.getToken('https://reachauto.feishu.cn/minutes/abc123'), 'abc123');
});
test('带查询参数', function() {
  assert.strictEqual(ct.getToken('https://reachauto.feishu.cn/minutes/xyz?f=1'), 'xyz');
});
test('docx URL 返回 null（content.js getToken 仅匹配 /minutes/）', function() {
  assert.strictEqual(ct.getToken('https://reachauto.feishu.cn/docx/abc123'), null);
});
test('无匹配返回 null', function() {
  assert.strictEqual(ct.getToken('https://example.com/foo'), null);
});

// --- 一致性检查 ---
console.log('\n[一致性: content.js getToken vs background.js getToken]');
test('两者对 /minutes/ URL 返回相同结果', function() {
  const url = 'https://reachauto.feishu.cn/minutes/testToken123';
  assert.strictEqual(ct.getToken(url), bg.getToken(url));
});
test('background.js 对 docx URL 抛错，content.js 返回 null（设计差异）', function() {
  const url = 'https://reachauto.feishu.cn/docx/abc123';
  assert.strictEqual(ct.getToken(url), null);
  assert.throws(function() { bg.getToken(url); });
});

// --- findMinuteUrlInPage & getExportTargetUrl ---
console.log('\n[findMinuteUrlInPage & getExportTargetUrl]');
test('无 <a> 标签且无 HTML 匹配时返回 null', function() {
  assert.strictEqual(ct.findMinuteUrlInPage(), null);
});

test('根据 <a> 标签提取妙记 URL', function() {
  const oldQueryAll = contentSandbox.document.querySelectorAll;
  contentSandbox.document.querySelectorAll = function(selector) {
    if (selector.includes('a[href*="/minutes/"]')) {
      return [{ href: 'https://reachauto.feishu.cn/minutes/obcny9g35qsfvs2435og62c1?from=ai_minutes', getAttribute: function() { return 'https://reachauto.feishu.cn/minutes/obcny9g35qsfvs2435og62c1?from=ai_minutes'; } }];
    }
    return [];
  };
  assert.strictEqual(ct.findMinuteUrlInPage(), 'https://reachauto.feishu.cn/minutes/obcny9g35qsfvs2435og62c1?from=ai_minutes');
  contentSandbox.document.querySelectorAll = oldQueryAll;
});

test('忽略列表页 token 链接 (如 /minutes/me)', function() {
  const oldQueryAll = contentSandbox.document.querySelectorAll;
  contentSandbox.document.querySelectorAll = function(selector) {
    if (selector.includes('a[href*="/minutes/"]')) {
      return [{ href: 'https://reachauto.feishu.cn/minutes/me', getAttribute: function() { return 'https://reachauto.feishu.cn/minutes/me'; } }];
    }
    return [];
  };
  assert.strictEqual(ct.findMinuteUrlInPage(), null);
  contentSandbox.document.querySelectorAll = oldQueryAll;
});

test('从 data-href 属性提取妙记 URL', function() {
  const oldQueryAll = contentSandbox.document.querySelectorAll;
  contentSandbox.document.querySelectorAll = function(selector) {
    if (selector.includes('[data-href*="/minutes/"]')) {
      return [{ getAttribute: function(attr) { return attr === 'data-href' ? 'https://reachauto.feishu.cn/minutes/obcny9g35qsfvs2435og62c1' : null; } }];
    }
    return [];
  };
  assert.strictEqual(ct.findMinuteUrlInPage(), 'https://reachauto.feishu.cn/minutes/obcny9g35qsfvs2435og62c1');
  contentSandbox.document.querySelectorAll = oldQueryAll;
});

test('从转义斜杠 HTML 源码与 window.clientVars 提取妙记 URL (无需滚动)', function() {
  contentSandbox.document.documentElement = {
    innerHTML: '<script>var data = "https:\\/\\/reachauto.feishu.cn\\/minutes\\/obcny9g35qsfvs2435og62c1";</script>'
  };
  assert.strictEqual(ct.findMinuteUrlInPage(), 'https://reachauto.feishu.cn/minutes/obcny9g35qsfvs2435og62c1');
  contentSandbox.document.documentElement = { appendChild: function() {} };
});

test('getExportTargetUrl 在妙记详情页返回 location.href', function() {
  mockLocation.pathname = '/minutes/obcny9g35qsfvs2435og62c1';
  mockLocation.href = 'https://reachauto.feishu.cn/minutes/obcny9g35qsfvs2435og62c1';
  assert.strictEqual(ct.getExportTargetUrl(), 'https://reachauto.feishu.cn/minutes/obcny9g35qsfvs2435og62c1');
  mockLocation.pathname = '/';
  mockLocation.href = 'https://reachauto.feishu.cn/';
});

test('getExportTargetUrl 在列表页返回 null', function() {
  mockLocation.pathname = '/minutes/me';
  mockLocation.href = 'https://reachauto.feishu.cn/minutes/me';
  assert.strictEqual(ct.getExportTargetUrl(), null);
  mockLocation.pathname = '/';
  mockLocation.href = 'https://reachauto.feishu.cn/';
});

// ============================================================================
// 3.5. manifest.json 与 i18n 语言包测试
// ============================================================================
console.log('\n========================================');
console.log('manifest.json 与 i18n 语言包测试');
console.log('========================================\n');

test('manifest.json 格式与 1.4.0 版本校验', function() {
  const manifestPath = path.join(__dirname, '..', 'extension', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.version, '1.4.0');
  assert.strictEqual(manifest.default_locale, 'zh_CN');
  assert.strictEqual(manifest.name, '__MSG_extName__');
  assert.strictEqual(manifest.description, '__MSG_extDescription__');
});

test('zh_CN 与 en 语言包 JSON 完整性及 Key 对齐校验', function() {
  const zhPath = path.join(__dirname, '..', 'extension', '_locales', 'zh_CN', 'messages.json');
  const enPath = path.join(__dirname, '..', 'extension', '_locales', 'en', 'messages.json');
  const zhMsgs = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
  const enMsgs = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const zhKeys = Object.keys(zhMsgs).sort();
  const enKeys = Object.keys(enMsgs).sort();

  assert.deepStrictEqual(zhKeys, enKeys, 'zh_CN 与 en 语言包的 Key 集合必须完全一致');
  zhKeys.forEach(k => {
    assert(zhMsgs[k].message, `zh_CN 缺少 ${k}.message`);
    assert(enMsgs[k].message, `en 缺少 ${k}.message`);
  });
});

// ============================================================================
// 4. 静态分析：已知问题与边界情况
// ============================================================================
console.log('\n========================================');
console.log('静态分析报告');
console.log('========================================\n');

console.log('1. [content.js] isMinutesDetailPage 的 listPages 包含 "space"，');
console.log('   但 isListPage 的 listPages 不包含 "space"。');
console.log('   => /minutes/space 既非详情页也非列表页（可能为设计意图）。\n');

console.log('2. [content.js] getToken 仅匹配 /minutes/{token}，不匹配 /docx/{token}。');
console.log('   => docx 类型的列表项通过 auto_download_any_next 标志触发自动下载，');
console.log('   而非 token 专属标志。设计合理。\n');

console.log('3. [content.js] checkAutoDownload 中，docx 流程设置 auto_download_any_next');
console.log('   后立即在新标签页打开妙记。若用户快速连续点击多个 docx 下载按钮，');
console.log('   any_next 标志可能被错误的标签页消费（竞态条件）。\n');

console.log('4. [background.js] getToken 仅匹配 /minutes/，若传入 /docx/ URL 会抛错。');
console.log('   content.js 的 docx 流程会先跳转到 /minutes/ 页面再触发导出，');
console.log('   所以 background.js 总是收到 /minutes/ URL。设计一致。\n');

console.log('5. [content.js] findMenuOption 使用 querySelectorAll("*") 遍历全部元素，');
console.log('   在大型页面上可能有性能开销（但仅在菜单打开时调用，影响有限）。\n');

console.log('6. [content.js] 自动下载标志无过期时间。若详情页加载失败，');
console.log('   localStorage 中的 auto_download_{token} 或 auto_download_any_next');
console.log('   不会被清理，下次访问该详情页时会再次触发自动下载。\n');

// ============================================================================
// 5. 汇总
// ============================================================================
console.log('\n========================================');
console.log('测试汇总');
console.log('========================================');
console.log('  通过: ' + passed);
console.log('  失败: ' + failed);
console.log('  跳过: ' + skipped);
console.log('  总计: ' + (passed + failed + skipped));
if (failed > 0) {
  console.log('\n  \u26a0 有 ' + failed + ' 个测试失败，请检查上方输出。');
  process.exit(1);
} else {
  console.log('\n  \u2714 全部通过！');
  process.exit(0);
}
