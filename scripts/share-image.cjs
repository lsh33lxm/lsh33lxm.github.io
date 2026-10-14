const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function main() {
  const root=path.resolve(__dirname,'..');
  const data=JSON.parse(await fs.readFile(path.join(root,'content/site.json'),'utf8'));
  const pageHtml=await fs.readFile(path.join(root,'index.html'),'utf8');
  const curve=pageHtml.match(/<svg viewBox="0 0 380 226"[\s\S]*?<\/svg>/)[0];
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
    await page.setContent(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f7f4ee;color:#292b26;font-family:"Microsoft YaHei",sans-serif}.frame{margin:58px 72px;border-top:1px solid #d8d3c8;padding-top:30px}.name{font:32px Georgia,serif}.name span{color:#9b402b}.content{display:flex;align-items:center;gap:50px;margin-top:46px}.copy{width:610px}.identity{font-size:18px;color:#66675e}h1{font:44px/1.6 Georgia,"SimSun",serif;margin:22px 0 30px}.bottom{font-size:15px;letter-spacing:3px;color:#66675e}.figure{width:340px}.figure svg{width:100%}.caption{font-size:14px;color:#66675e;text-align:center}.url{font:15px Consolas,monospace;margin-top:36px;color:#9b402b}</style><div class="frame"><div class="name">${esc(data.profile.name)}<span>.</span></div><div class="content"><div class="copy"><div class="identity">${esc(data.profile.identity)}</div><h1>${esc(data.profile.intro).replaceAll('\n','<br>')}</h1><div class="bottom">统计与数据 / AI 实践 / 学习记录</div></div><div class="figure">${curve}<div class="caption">标准正态分布 · X ∼ N(0, 1)</div></div></div><div class="url">${esc(new URL(data.site.url).hostname)}</div></div></html>`);
    await page.screenshot({path:path.join(root,'assets/share.png')});
    console.log('✓ 分享预览图 assets/share.png 已生成（1200 × 630）');
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
