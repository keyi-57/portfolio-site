/**
 * 站点体检工具 —— 用 CDP 驱动本机 Chrome，无头验证页面是否真的渲染出内容
 * ------------------------------------------------------------------------
 * 为什么需要它：
 * 纯 curl 只能确认 HTTP 200，确认不了"页面是不是白的"。而很多白屏是
 * JS 报错 / IntersectionObserver 没触发 / 字体损坏 / 图片 404 造成的，
 * 只有真浏览器能查出来。本项目装不了 puppeteer，所以直接用 CDP over WebSocket
 * （Node 22 内置 WebSocket，零依赖）。
 *
 * 用法:
 *   node verify_site.mjs <url> [输出目录]
 *   node verify_site.mjs http://127.0.0.1:5180/
 *
 * 检查项:
 *   1. 各区块是否存在、高度是否正常
 *   2. .reveal 入场元素是否最终全部点亮（卡在 opacity:0 = 白屏元凶）
 *   3. 图片是否有 broken（complete && naturalWidth===0）
 *   4. 自托管字体是否真的加载成功 fonts.check()
 *   5. 作品弹窗能否打开、图片与文案是否完整
 *   6. 筛选切换后卡片是否可见
 *   7. nav 吸顶
 *   8. 控制台错误 + HTTP 4xx/5xx
 *
 * 坑提醒:
 *   - 如果环境有 http_proxy，Chrome 必须加 --no-proxy-server，否则 127.0.0.1
 *     也会被代理，返回 502 页面（看起来就像"网站白屏"）。
 *   - 不要用 python -m http.server 起后台服务后用 curl 验，nohup 的子进程
 *     会随 shell 退出被杀；用前台 run_in_background 任务。
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const url = process.argv[2] || 'http://127.0.0.1:5180/'
const outDir = process.argv[3] || path.resolve(process.cwd(), '_verify')
const port = 9300 + Math.floor(Math.random() * 200)
const log = (...a) => console.log(...a)
const fail = []
const ok = m => log('  ✓', m)
const bad = m => { fail.push(m); log('  ✗', m) }

const HARD = setTimeout(() => { log('!! 硬超时'); try { chrome.kill('SIGKILL') } catch {}; process.exit(1) }, 180000)
fs.mkdirSync(outDir, { recursive: true })

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--disable-dev-shm-usage', '--no-first-run', '--disable-extensions',
  '--no-proxy-server', '--proxy-bypass-list=*',
  `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
  '--window-size=1600,1000', 'about:blank',
], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function getWs() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(800) }); if (r.ok) return (await r.json()).webSocketDebuggerUrl } catch {}
    await sleep(250)
  }
  throw new Error('CDP 未就绪')
}
const ws = new WebSocket(await getWs())
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })

let id = 0
const pending = new Map()
const errors = []
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return }
  if (m.method === 'Log.entryAdded') errors.push(`[${m.params.entry.level}] ${m.params.entry.text} ${m.params.entry.url || ''}`)
  if (m.method === 'Runtime.exceptionThrown') errors.push(`[exception] ${m.params.exceptionDetails.text}`)
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) errors.push(`[HTTP ${m.params.response.status}] ${m.params.response.url}`)
}
const send = (method, params = {}, sessionId) => new Promise(res => {
  const mid = ++id; pending.set(mid, res)
  ws.send(JSON.stringify({ id: mid, method, params, sessionId }))
  setTimeout(() => { if (pending.has(mid)) { pending.get(mid)({ error: 'timeout' }); pending.delete(mid) } }, 20000)
})
const ev = async (expr, sid) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sid)).result?.result?.value
const shot = async (name, sid) => {
  const r = await send('Page.captureScreenshot', { format: 'png' }, sid)
  if (r.result?.data) { fs.writeFileSync(path.join(outDir, name), Buffer.from(r.result.data, 'base64')); return true }
  return false
}

const list = await send('Target.getTargets')
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId: list.result.targetInfos.find(t => t.type === 'page').targetId, flatten: true })
await send('Page.enable', {}, sessionId); await send('Runtime.enable', {}, sessionId); await send('Log.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId)

log(`\n导航 → ${url}\n`)
await send('Page.navigate', { url }, sessionId)
await sleep(7000)

// ---------- 1. 基础存在性 ----------
log('【1】页面基础')
const base = JSON.parse(await ev(`JSON.stringify({
  title: document.title,
  docHeight: document.documentElement.scrollHeight,
  bodyTextLen: document.body.innerText.length,
  sections: ['about','projects','strengths','contact'].map(id => {
    const el = document.getElementById(id)
    return el ? id + '=' + Math.round(el.getBoundingClientRect().height) : id + '=MISSING'
  }).join(' '),
  fontSG: document.fonts.check('16px "Space Grotesk"'),
  fontJBM: document.fonts.check('16px "JetBrains Mono"')
})`, sessionId) || '{}')
log('  ', JSON.stringify(base))
base.title && !/^(\d+\.\d+\.\d+\.\d+|localhost)/.test(base.title) ? ok('标题正常') : bad('标题异常（可能是代理错误页）')
base.docHeight > 3000 ? ok(`文档高度 ${base.docHeight}px`) : bad(`文档高度仅 ${base.docHeight}px，内容可能没渲染`)
base.bodyTextLen > 800 ? ok(`正文 ${base.bodyTextLen} 字`) : bad(`正文仅 ${base.bodyTextLen} 字`)
base.sections.includes('MISSING') ? bad('有区块缺失: ' + base.sections) : ok('区块齐全: ' + base.sections)
base.fontSG ? ok('Space Grotesk 已加载') : bad('Space Grotesk 未加载（woff2 可能损坏）')
base.fontJBM ? ok('JetBrains Mono 已加载') : bad('JetBrains Mono 未加载')

// ---------- 2. 逐屏滚动 + reveal ----------
log('\n【2】滚动全页 + 入场元素')
const H = await ev(`document.documentElement.scrollHeight`, sessionId)
let y = 0
while (y < H) { y += 700; await ev(`window.scrollTo(0,${y})`, sessionId); await sleep(400) }
await sleep(2500)
const rev = JSON.parse(await ev(`(() => {
  const all = Array.from(document.querySelectorAll('.reveal'))
  const hidden = all.filter(e => +getComputedStyle(e).opacity <= 0.01)
  return JSON.stringify({
    total: all.length, lit: document.querySelectorAll('.reveal.is-in').length,
    stillHidden: hidden.length,
    hiddenList: hidden.map(e => e.className.slice(0,50)),
    cards: document.querySelectorAll('.pcard').length,
    cardsVisible: Array.from(document.querySelectorAll('.pcard')).filter(e=>+getComputedStyle(e).opacity>0.01).length,
    scards: document.querySelectorAll('.scard').length,
    scardsVisible: Array.from(document.querySelectorAll('.scard')).filter(e=>+getComputedStyle(e).opacity>0.01).length,
    imgs: document.querySelectorAll('img').length,
    imgsBroken: Array.from(document.querySelectorAll('img')).filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))
  })
})()`, sessionId) || '{}')
log('  ', JSON.stringify(rev))
rev.stillHidden === 0 ? ok(`${rev.total} 个入场元素全部点亮`) : bad(`${rev.stillHidden} 个元素仍不可见: ${rev.hiddenList.join(' / ')}`)
rev.cardsVisible === rev.cards && rev.cards > 0 ? ok(`${rev.cards} 张作品卡全部可见`) : bad(`作品卡 ${rev.cardsVisible}/${rev.cards} 可见`)
rev.scardsVisible === rev.scards && rev.scards > 0 ? ok(`${rev.scards} 张能力卡全部可见`) : bad(`能力卡 ${rev.scardsVisible}/${rev.scards} 可见`)
rev.imgsBroken.length === 0 ? ok(`${rev.imgs} 张图片无破损`) : bad(`图片破损: ${rev.imgsBroken.join(', ')}`)

// ---------- 3. 弹窗 ----------
log('\n【3】作品详情弹窗')
await ev(`document.querySelectorAll('.pcard')[0].scrollIntoView({block:'center'})`, sessionId); await sleep(800)
await ev(`document.querySelectorAll('.pcard')[0].click()`, sessionId); await sleep(1800)
const modal = JSON.parse(await ev(`(() => {
  const ov = document.querySelector('.modal-overlay')
  if (!ov) return JSON.stringify({ open:false })
  const m = document.querySelector('.modal'), img = document.querySelector('.modal-image img'), b = document.querySelector('.modal-body')
  const r = m.getBoundingClientRect()
  return JSON.stringify({ open:true, w:Math.round(r.width), h:Math.round(r.height),
    imgOk: !!img && img.complete && img.naturalWidth>0, imgSrc: img?.getAttribute('src'),
    bodyLen: b?.innerText.length||0, body: b?.innerText.slice(0,80) })
})()`, sessionId) || '{}')
if (!modal.open) bad('弹窗打不开')
else {
  log('  ', JSON.stringify(modal))
  modal.w > 300 && modal.h > 300 ? ok(`弹窗尺寸 ${modal.w}×${modal.h}`) : bad(`弹窗尺寸异常 ${modal.w}×${modal.h}`)
  modal.imgOk ? ok('弹窗图片已加载 ' + modal.imgSrc) : bad('弹窗图片未加载')
  modal.bodyLen > 20 ? ok('弹窗文案完整') : bad('弹窗文案为空')
  await shot('modal.png', sessionId)
}
await ev(`document.querySelector('.modal-close')?.click()`, sessionId); await sleep(800)

// ---------- 4. 筛选 ----------
log('\n【4】筛选切换')
const chips = await ev(`Array.from(document.querySelectorAll('.filter-chip')).map(c=>c.innerText.replace(/\\n/g,'|'))`, sessionId)
log('  chips:', JSON.stringify(chips))
for (let i = 0; i < (chips?.length || 0); i++) {
  await ev(`document.querySelectorAll('.filter-chip')[${i}].click()`, sessionId); await sleep(1100)
  const r = JSON.parse(await ev(`(() => {
    const c = document.querySelectorAll('.pcard')
    const vis = Array.from(c).filter(e=>+getComputedStyle(e).opacity>0.01)
    return JSON.stringify({ total:c.length, visible:vis.length, first: vis[0]?.querySelector('.pcard-title')?.innerText||'' })
  })()`, sessionId) || '{}')
  r.total > 0 && r.visible === r.total ? ok(`「${chips[i]}」→ ${r.visible}/${r.total} 可见 (${r.first})`) : bad(`「${chips[i]}」→ 只有 ${r.visible}/${r.total} 可见`)
}
await ev(`document.querySelectorAll('.filter-chip')[0].click()`, sessionId); await sleep(600)

// ---------- 5. nav ----------
log('\n【5】导航吸顶')
await ev(`window.scrollTo(0,0)`, sessionId); await sleep(900)
const navTop = await ev(`document.querySelector('.nav')?.className`, sessionId)
await ev(`window.scrollTo(0,1500)`, sessionId); await sleep(1300)
const navStuck = await ev(`document.querySelector('.nav')?.className`, sessionId)
!navTop.includes('is-stuck') && navStuck.includes('is-stuck') ? ok('吸顶生效') : bad(`吸顶异常 top="${navTop}" scrolled="${navStuck}"`)

// ---------- 6. 分区截图 ----------
log('\n【6】截图')
for (const sid of ['about', 'projects', 'strengths', 'contact']) {
  await ev(`document.getElementById('${sid}').scrollIntoView({block:'start'})`, sessionId); await sleep(1300)
  if (await shot(`${sid}.png`, sessionId)) ok(sid + '.png')
}
await ev(`window.scrollTo(0,0)`, sessionId); await sleep(1000)
await shot('hero.png', sessionId); ok('hero.png')

// ---------- 结果 ----------
log('\n【7】控制台 / 网络')
const uniq = [...new Set(errors)]
log(uniq.length ? uniq.slice(0, 20).join('\n') : '  ✓ 无错误')
if (uniq.length) fail.push(`${uniq.length} 条控制台错误`)

log('\n' + '='.repeat(56))
log(fail.length ? `✗ ${fail.length} 项异常:\n  - ${fail.join('\n  - ')}` : '✓ 全部通过')
log('截图目录:', outDir)
log('='.repeat(56))

clearTimeout(HARD); ws.close(); chrome.kill('SIGKILL'); process.exit(fail.length ? 1 : 0)
