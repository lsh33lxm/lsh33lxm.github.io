const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function main() {
  const root = path.resolve(__dirname, '..');
  const data = JSON.parse(await fs.readFile(path.join(root, 'content/site.json'), 'utf8'));
  const photo = data.profile.photo ? `data:image/${path.extname(data.profile.photo).slice(1)};base64,${(await fs.readFile(path.join(root, data.profile.photo))).toString('base64')}` : null;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f7f9fc;color:#101828;font-family:"Segoe UI","Microsoft YaHei",sans-serif}.frame{margin:70px 85px;border-top:1px solid #d4deeb;padding-top:65px}.content{display:flex;gap:65px;align-items:center}.copy{flex:1}h1{font-size:54px;margin:0 0 24px}.identity{font:24px/1.75 Georgia,SimSun,serif}.topics{font-size:19px;color:#526277;line-height:2;margin-top:30px}.photo{width:230px;text-align:center}.photo img{width:230px;height:230px;border-radius:50%;object-fit:cover}.photo p{font-size:13px;color:#526277}.url{font-size:19px;margin-top:74px;color:#115fb3}</style><div class="frame"><div class="content"><div class="copy"><h1>${esc(data.profile.name)}</h1><div class="identity">${esc(data.profile.identity)}</div><div class="topics">关注方向 · 学习资料 · 精选项目<br>应用统计 / LangChain &amp; RAG / AI 工具实践</div></div>${photo ? `<div class="photo"><img src="${photo}" alt="${esc(data.profile.photoAlt)}"><p>${esc(data.profile.photoCaption || '')}</p></div>` : ''}</div><div class="url">${esc(new URL(data.site.url).hostname)}</div></div></html>`);
    await page.screenshot({ path: path.join(root, 'assets/share.png') });
    console.log('✓ 分享预览图 assets/share.png 已生成（1200 × 630）');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
