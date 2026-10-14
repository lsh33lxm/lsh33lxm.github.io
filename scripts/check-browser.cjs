// 可选开发工具，不参与网站运行或构建。依赖安装方式见 README。
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const base = process.env.CHECK_URL || 'http://127.0.0.1:4173/';
const out = process.env.CHECK_OUT ? path.resolve(process.env.CHECK_OUT) : path.resolve(__dirname, '../artifacts/redesign');
const overflowCheck = page => page.locator('html').evaluate(e => e.scrollWidth <= innerWidth);
async function main() {
  await fs.mkdir(out, { recursive: true });
  const content=JSON.parse(await fs.readFile(path.resolve(__dirname,'../content/site.json'),'utf8'));
  const projectCount=content.projects.length;
  const writingCount=content.writing.items.length+content.writing.xiaohongshuItems.length;
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    const errors = [];
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto(base, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('h1').textContent(), content.profile.name);
      assert.equal(await page.locator('article.project').count(), projectCount);
      assert(await overflowCheck(page), `${width}px 页面横向溢出`);
      assert.equal(await page.locator('#updates').count(), content.updates.length ? 1 : 0);
      assert.equal(await page.locator('.profile img').count(), content.profile.photo ? 1 : 0);
      assert(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete && i.naturalWidth>0)), '图片加载失败');
      const clipping = await page.locator('h1,h2,h3,p,nav,a').evaluateAll(elements => elements.filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline').map(e=>e.textContent));
      assert.deepEqual(clipping, [], `${width}px 文本溢出`);
      const badAnchors = await page.locator('a[href^="#"]').evaluateAll(elements=>elements.filter(e=>!document.getElementById(e.hash.slice(1))).map(e=>e.hash));
      assert.deepEqual(badAnchors, []);
      await page.screenshot({ path: path.join(out,`after-${width}-full.png`),fullPage:true });
      await page.screenshot({ path: path.join(out,`after-${width}.png`) });
      results.push({ width, overflow: false, clipping: false, anchors: 'passed' });
    }
    await page.goto(base);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), '跳到正文');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').textContent(), 'GitHub');
    const outline = await page.locator(':focus').evaluate(e=>getComputedStyle(e).outlineStyle);
    assert.notEqual(outline,'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).scrollBehavior),'auto');
    // WCAG 2.1 AA 自动检查：页面在手机和桌面分别执行。
    const axePath = process.env.AXE_PATH || require.resolve('axe-core/axe.min.js');
    for (const width of [390,1440]) {
      await page.setViewportSize({width,height:1000});
      await page.goto(base);
      await page.addScriptTag({path:axePath});
      const axe = await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
      await fs.writeFile(path.join(out,`accessibility-${width}.json`),JSON.stringify(axe,null,2));
      assert.deepEqual(axe.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})),[]);
      results.push({width, wcagViolations:axe.violations.length});
    }
    const offline = await browser.newContext({javaScriptEnabled:false, viewport:{width:390,height:844}});
    const plain = await offline.newPage();
    await plain.goto(base);
    assert.equal(await plain.locator('article.project').count(),projectCount);
    assert.equal(await plain.locator('.writing-list > li').count(),writingCount);
    await offline.close();
    // 独立数据夹具：不修改正式内容，输出只写到被 Git 忽略的 artifacts。
    const fixtures = [
      ['no-photo', d=>{ d.profile.photo=null; }],
      ['empty-sections', d=>{ d.profile.photo=null; d.interests=[]; d.updates=[]; d.projects=[]; d.writing.items=[]; d.writing.xiaohongshuItems=[]; }],
      ['long-content', d=>{ d.projects[0].name='LongProjectName'.repeat(12); d.projects[0].description+=' https://github.com/'+ 'long-path-'.repeat(30); d.writing.items[0].title='长文章标题与统计学习记录'.repeat(10); d.writing.items[0].date=null; }]
    ];
    for (const [name, mutate] of fixtures) {
      const fixture=structuredClone(content);
      mutate(fixture);
      const input=path.join(out,`${name}.json`),output=path.join(out,`${name}.html`);
      await fs.writeFile(input,JSON.stringify(fixture));
      execFileSync(process.execPath,[path.resolve(__dirname,'build.mjs'),'--content',input,'--output',output]);
      const html=await fs.readFile(output,'utf8');
      for (const width of [320,390,768,1440]) {
        await page.setViewportSize({width,height:1000});
        await page.goto(base);
        await page.setContent(html,{waitUntil:'networkidle'});
        assert(await overflowCheck(page), `${name} ${width}px 溢出`);
        if (!fixture.profile.photo) assert.equal(await page.locator('.profile').count(),0);
        if (name==='empty-sections') {
          assert.equal(await page.locator('.section').count(),0);
          assert.equal(await page.locator('nav a').count(),1);
        }
        if (name==='long-content') assert.equal(await page.locator('.writing-list > li:first-child time').count(),0);
        if (width===390) await page.screenshot({path:path.join(out,`fixture-${name}.png`),fullPage:true});
      }
      results.push({fixture:name,viewports:[320,390,768,1440],passed:true});
    }
    assert.deepEqual(errors,[]);
    const report = {url:base,results,keyboard:'passed',reducedMotion:'passed',javascriptDisabled:'passed',pageErrors:errors};
    await fs.writeFile(path.join(out,'browser-check.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
