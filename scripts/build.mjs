import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const argument = name => {
  const i = process.argv.indexOf(name);
  if (i === -1) return null;
  if (!process.argv[i + 1] || process.argv[i + 1].startsWith('--')) throw new Error(`${name} 缺少路径`);
  return path.resolve(process.argv[i + 1]);
};
const contentPath = argument('--content') || path.join(root, 'content/site.json');
const outputPath = argument('--output');
const data = JSON.parse(await readFile(contentPath, 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function url(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error(`链接必须使用 HTTPS: ${value}`);
  return escape(parsed.href);
}
const link = (href, label) => `<a href="${url(href)}">${escape(label)}</a>`;
function date(value, required = false) {
  if (!value && !required) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error(`需要有效 ISO 日期: ${value}`);
}
async function validate() {
  for (const key of ['name', 'identity']) if (!data.profile[key]?.trim()) throw new Error(`profile.${key} 不可为空`);
  if (!data.profile.about?.length || data.profile.about.some(p => !p.trim())) throw new Error('profile.about 需要介绍段落');
  date(data.site.updated, true);
  if (!data.site.url.endsWith('/')) throw new Error('site.url 必须以 / 结尾');
  url(data.site.url);
  Object.values(data.links).forEach(url);
  for (const project of data.projects) {
    for (const key of ['title', 'name', 'kind', 'description', 'contribution', 'source']) if (!project[key]?.trim()) throw new Error(`项目缺少 ${key}`);
    url(project.url);
    if (project.readme) url(project.readme);
    if (project.demo) url(project.demo);
  }
  for (const item of [...data.writing.items, ...data.writing.xiaohongshuItems]) {
    if (!item.title?.trim() || !item.category?.trim()) throw new Error('文章需要标题和分类');
    date(item.date);
    url(item.url);
  }
  for (const item of data.updates || []) {
    date(item.date, true);
    if (!item.text?.trim() || !item.source?.trim()) throw new Error('动态需要内容与可核实来源');
    if (item.url) url(item.url);
  }
  if (data.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)) throw new Error('邮箱格式不正确');
  if (data.profile.photo) {
    if (!/^assets\/[a-z0-9.-]+\.(png|jpg|jpeg|webp)$/i.test(data.profile.photo)) throw new Error('头像必须为 assets/ 中的本地图片');
    if (!data.profile.photoAlt?.trim()) throw new Error('头像需要 photoAlt 替代文本');
    await access(path.join(root, data.profile.photo));
  }
}
await validate();

const heading = (id, cn, en) => `<h2 id="${id}">${cn}<span class="heading-en" lang="en">${en}</span></h2>`;
const section = (id, title, content) => `<section id="${id}" class="section" aria-labelledby="${id}-title">${title}${content}</section>`;
const contact = `<div class="contact-links">${link(data.links.github, 'GitHub')}${link(data.links.xiaohongshu, '小红书')}${data.profile.email ? `<a href="mailto:${escape(data.profile.email)}">邮件联系</a>` : ''}</div>`;
const profile = data.profile.photo ? `<aside class="profile" aria-label="头像与联系入口"><figure><img src="${escape(data.profile.photo)}" width="460" height="460" alt="${escape(data.profile.photoAlt)}" decoding="async">${data.profile.photoCaption ? `<figcaption>${escape(data.profile.photoCaption)}</figcaption>` : ''}</figure>${contact}</aside>` : '';
const interests = data.interests.length ? section('interests', heading('interests-title', '关注方向', 'Interests'), `<ul class="interests">${data.interests.map(p => `<li><strong>${escape(p.title)}</strong>：${escape(p.description)}</li>`).join('\n')}</ul>`) : '';
const updates = data.updates?.length ? section('updates', heading('updates-title', '近期动态', 'Updates'), `<ul class="dated-list">${data.updates.map(p => `<li class="dated-item"><time datetime="${escape(p.date)}">${escape(p.date)}</time><div class="dated-content">${p.url ? link(p.url, p.text) : escape(p.text)}</div></li>`).join('\n')}</ul>`) : '';
const writingItems = [...data.writing.items, ...data.writing.xiaohongshuItems];
const writing = writingItems.map(p => `<li class="dated-item${p.date ? '' : ' without-date'}">${p.date ? `<time datetime="${escape(p.date)}">${escape(p.date)}</time>` : ''}<div class="dated-content">${link(p.url, p.title)}<span class="category">${escape(p.category)}</span></div></li>`).join('\n');
const writingSection = writingItems.length ? section('writing', heading('writing-title', '最新文章', 'Latest Posts'), `<p class="section-note">${escape(data.writing.intro)}</p><ul class="dated-list writing-list">${writing}</ul><p class="writing-links">${link(data.links.notes, '学习资料库')} · ${link(data.links.xiaohongshu, '小红书主页')}</p>`) : '';
const projects = data.projects.map(p => `<article class="project"><h3>${link(p.url, p.name)}</h3><p class="project-description">${escape(p.description)}</p><p class="project-meta">${escape(p.kind)}</p><p class="project-contribution">${escape(p.contribution)}</p><div class="project-links">${link(p.url, 'Code')}${p.readme ? link(p.readme, 'Readme') : ''}${p.demo ? link(p.demo, 'Demo') : ''}</div></article>`).join('\n');
const projectsSection = data.projects.length ? section('work', heading('work-title', '精选项目', 'Selected Projects'), `<div class="project-list">${projects}</div><p class="all-repos">${link(`${data.links.github}?tab=repositories`, '全部公开仓库')}</p>`) : '';
const nav = [['about', '关于'], ...(interests ? [['interests', '关注方向']] : []), ...(updates ? [['updates', '动态']] : []), ...(writingSection ? [['writing', '文章']] : []), ...(projectsSection ? [['work', '项目']] : [])].map(([id, label]) => `<a href="#${id}">${label}</a>`).join('');
const schema = { '@context': 'https://schema.org', '@type': 'ProfilePage', dateModified: data.site.updated, url: data.site.url, mainEntity: { '@type': 'Person', name: data.profile.name, description: data.profile.identity, sameAs: [data.links.github, data.links.xiaohongshu] } };
const replacements = {
  TITLE: escape(data.site.title), DESCRIPTION: escape(data.site.description), URL: url(data.site.url), NAME: escape(data.profile.name), IDENTITY: escape(data.profile.identity),
  NAV: nav, ABOUT: data.profile.about.map(p => `<p>${escape(p)}</p>`).join('\n'), PROFILE: profile, PHOTO_CLASS: profile ? ' has-photo' : '', CONTACT_INLINE: profile ? '' : contact,
  INTERESTS_SECTION: interests, UPDATES_SECTION: updates, WRITING_SECTION: writingSection, PROJECTS_SECTION: projectsSection,
  YEAR: escape(data.site.updated.slice(0, 4)), UPDATED: escape(data.site.updated), SCHEMA: JSON.stringify(schema).replaceAll('<', '\\u003c')
};
const template = await readFile(path.join(root, 'templates/index.html'), 'utf8');
const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => { if (!(key in replacements)) throw new Error(`未知模板字段 ${key}`); return replacements[key]; }).replace(/^[ \t]+$/gm, '');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url(data.site.url)}</loc><lastmod>${data.site.updated}</lastmod></url></urlset>\n`;
const outputs = outputPath ? { [outputPath]: html } : { 'index.html': html, 'sitemap.xml': sitemap, 'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${data.site.url}sitemap.xml\n` };
for (const [name, content] of Object.entries(outputs)) {
  const target = path.isAbsolute(name) ? name : path.join(root, name);
  if (process.argv.includes('--check')) {
    if (await readFile(target, 'utf8') !== content) throw new Error(`${name} 需要重新构建，请运行 npm run build`);
  } else await writeFile(target, content);
}
console.log(`✓ ${data.projects.length} 个项目 · ${writingItems.length} 篇学习记录 · 静态页面${process.argv.includes('--check') ? '一致性检查通过' : '已生成'}`);
