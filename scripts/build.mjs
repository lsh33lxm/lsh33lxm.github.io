import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const data = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function url(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error(`链接必须使用 HTTPS: ${value}`);
  return escape(parsed.href);
}
function link(href, label) {
  return `<a class="text-link" href="${url(href)}">${escape(label)}<span class="arrow" aria-hidden="true">↗</span></a>`;
}
function validate() {
  for (const key of ['name', 'identity', 'intro', 'summary']) {
    if (!data.profile[key]?.trim()) throw new Error(`profile.${key} 不可为空`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.site.updated) || Number.isNaN(Date.parse(data.site.updated))) throw new Error('site.updated 需要有效 ISO 日期');
  if (!data.site.url.endsWith('/')) throw new Error('site.url 必须以 / 结尾');
  url(data.site.url);
  Object.values(data.links).forEach(url);
  for (const project of data.projects) {
    for (const key of ['title', 'name', 'kind', 'description', 'contribution', 'source']) if (!project[key]?.trim()) throw new Error(`项目缺少 ${key}`);
    url(project.url);
  }
  for (const item of [...data.writing.items, ...data.writing.xiaohongshuItems]) {
    if (!item.title?.trim() || !item.category?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || Number.isNaN(Date.parse(item.date))) throw new Error('文章需要标题、分类和有效 ISO 日期');
    url(item.url);
  }
  if (data.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)) throw new Error('邮箱格式不正确');
}
validate();

// 标准正态概率密度；x∈[-3.5, 3.5]，y 轴范围 [0, 0.45]。
const pdf = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
const sx = x => 28 + (x + 3.5) / 7 * 324;
const sy = y => 185 - y / 0.45 * 148;
const points = (from, to, n) => Array.from({ length: n + 1 }, (_, i) => { const x = from + (to - from) * i / n; return `${sx(x).toFixed(3)},${sy(pdf(x)).toFixed(3)}`; });
const density = `<svg viewBox="0 0 380 226" role="img" aria-labelledby="density-title density-desc" xmlns="http://www.w3.org/2000/svg">
  <title id="density-title">标准正态概率密度曲线</title><desc id="density-desc">均值为零、标准差为一的正态分布。横轴是标准化变量 x，纵轴是概率密度。阴影从负一到一，面积约为 0.6827。这是数学示意，不是个人研究数据。</desc>
  <path d="M${sx(-1)},185 L${points(-1,1,80).join(' L')} L${sx(1)},185 Z" fill="#9b402b" fill-opacity=".13"/>
  <path d="M28,37 V185 H352" fill="none" stroke="#b8b2a6" stroke-width="1"/>
  <path d="M${sx(-1)},185 V${sy(pdf(-1))} M${sx(1)},185 V${sy(pdf(1))}" stroke="#9b402b" stroke-opacity=".55" stroke-dasharray="3 4" fill="none"/>
  <path d="M${points(-3.5,3.5,280).join(' L')}" fill="none" stroke="#9b402b" stroke-width="2.2" stroke-linecap="round"/>
  <g fill="#66675e" font-family="Consolas,monospace" font-size="10">${[-3,-2,-1,0,1,2,3].map(x=>`<path d="M${sx(x)},185 v5" stroke="#b8b2a6"/><text x="${sx(x)}" y="207" text-anchor="middle">${x}</text>`).join('')}<text x="15" y="189" text-anchor="end">0</text><text x="15" y="${sy(.4)+4}" text-anchor="end">.4</text><text x="354" y="223">x</text><text x="28" y="22">f(x)</text><text x="190" y="170" text-anchor="middle" fill="#9b402b">68.27%</text></g>
</svg>`;
const projects = data.projects.map((p, i) => `<article class="project"><span class="project-number mono" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><h3>${escape(p.title)}</h3><p class="project-subtitle">${escape(p.name)}</p><span class="project-kind">${escape(p.kind)}</span></div><div class="project-detail"><p class="project-description">${escape(p.description)}</p><p class="project-contribution">${escape(p.contribution)}</p>${link(p.url,`查看 ${p.name} 仓库`)}</div></article>`).join('\n');
const writing = items => items.map(p => `<a class="writing-item" href="${url(p.url)}"><time class="mono" datetime="${escape(p.date)}">${escape(p.date)}</time><div class="writing-title"><h3>${escape(p.title)}</h3><p class="category">${escape(p.category)}</p></div><span class="arrow" aria-hidden="true">↗</span></a>`).join('\n');
const social = link(data.links.github,'GitHub') + link(data.links.xiaohongshu,'小红书');
const intro = data.profile.intro.split('\n').map(line => `<span class="intro-line">${line.split(/(?<=，)/u).map(phrase=>`<span class="intro-phrase">${escape(phrase)}</span>`).join('')}</span>`).join('');
const schema = { '@context': 'https://schema.org', '@type': 'ProfilePage', dateModified: data.site.updated, url: data.site.url, mainEntity: { '@type': 'Person', name: data.profile.name, description: data.profile.identity, sameAs: [data.links.github,data.links.xiaohongshu] } };
const replacements = {
  TITLE: escape(data.site.title), DESCRIPTION: escape(data.site.description), URL: url(data.site.url), NAME: escape(data.profile.name), IDENTITY: escape(data.profile.identity), INTRO: intro, SUMMARY: escape(data.profile.summary), SOCIAL: social, DENSITY: density,
  ABOUT: data.profile.about.map(p=>`<p>${escape(p)}</p>`).join('\n'), ALL_REPOS: link(`${data.links.github}?tab=repositories`,'全部仓库'), PROJECTS: projects, NOTES_LINK: link(data.links.notes,'学习资料库'), WRITING_INTRO: escape(data.writing.intro), WRITING: writing(data.writing.items), XHS_LINK: link(data.links.xiaohongshu,'去小红书看看'), XHS_ITEMS: data.writing.xiaohongshuItems.length ? `<div class="writing-list">${writing(data.writing.xiaohongshuItems)}</div>` : '',
  INTERESTS: data.interests.map(p=>`<article class="interest"><div class="interest-heading"><h3>${escape(p.title)}</h3><span class="interest-status">${escape(p.status)}</span></div><p>${escape(p.description)}</p></article>`).join('\n'),
  CONTACT: data.profile.email ? `${social}<a class="text-link" href="mailto:${escape(data.profile.email)}">邮件联系 <span class="arrow" aria-hidden="true">↗</span></a>` : social,
  YEAR: escape(data.site.updated.slice(0,4)), UPDATED: escape(data.site.updated), SCHEMA: JSON.stringify(schema).replaceAll('<','\\u003c')
};
const template = await readFile(path.join(root,'templates/index.html'),'utf8');
const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => { if (!(key in replacements)) throw new Error(`未知模板字段 ${key}`); return replacements[key]; });
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url(data.site.url)}</loc><lastmod>${data.site.updated}</lastmod></url></urlset>\n`;
const outputs = { 'index.html': html, 'sitemap.xml': sitemap, 'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${data.site.url}sitemap.xml\n` };
for (const [name, content] of Object.entries(outputs)) {
  if (process.argv.includes('--check')) {
    if (await readFile(path.join(root,name),'utf8') !== content) throw new Error(`${name} 需要重新构建，请运行 npm run build`);
  } else await writeFile(path.join(root,name),content);
}
console.log(`✓ ${data.projects.length} 个项目 · ${data.writing.items.length + data.writing.xiaohongshuItems.length} 篇记录 · 静态页面${process.argv.includes('--check') ? '一致性检查通过' : '已生成'}`);
