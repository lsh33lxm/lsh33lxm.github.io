# lshlxm 的个人主页

![个人主页分享预览](assets/share.png)

**应用统计、AI 工具实践与学习记录。** 页面采用安静的米白底色、中文衬线标题与细线条，按「关于 → 作品 → 笔记 → 关注」组织内容。

- 网站：<https://lsh33lxm.github.io/>
- 仓库：<https://github.com/lsh33lxm/lsh33lxm.github.io>
- 原生 HTML / CSS，无框架、无运行时 API、无外部字体或追踪脚本。
- Node.js 仅用于本地生成与预览；GitHub Pages 直接发布完整 HTML。主要内容不依赖 JavaScript。

## 本地预览

需要 Node.js 18 或更高版本。无需 `npm install`。

```powershell
cd D:\proj\0.githubio
npm run build
npm start
```

打开 <http://127.0.0.1:4173/>。按 `Ctrl+C` 停止。端口冲突时先运行 `$env:PORT = '4174'`。修改数据后重新运行 `npm run build`，刷新浏览器。

## 文件与维护

| 文件 | 用途 |
| --- | --- |
| `content/site.json` | **主要编辑入口**：个人资料、项目、文章、关注方向、更新日期、来源与待补充项 |
| `.gitattributes` | 统一文本换行，保证 Windows 和线上检出的构建一致 |
| `templates/index.html` | 语义化页面模板，需改布局时编辑 |
| `assets/style.css` | 色彩、字体、留白、手机布局、减少动态效果 |
| `assets/favicon.svg` | 正态曲线图标 |
| `assets/share.png` | 1200 × 630 分享预览图 |
| `scripts/build.mjs` | 校验数据并生成完整 HTML、sitemap、robots |
| `scripts/serve.mjs` | 只绑定本机的静态预览服务 |
| `scripts/check-browser.cjs` | 可选：响应式、键盘与无障碍自动检查 |
| `scripts/share-image.cjs` | 可选：重新生成分享图 |
| `index.html` / `sitemap.xml` / `robots.txt` | 构建产物，**需要提交**；不要直接编辑 |

### 修改个人资料

编辑 `profile.name`、`identity`、`intro`、`summary` 与 `about`。`intro` 中的 `\n` 控制标题换行；同时更新 `site.title`、`site.description` 与 `site.updated`。

`profile.email` 默认为 `null`；填入你确认愿意公开的邮箱后，页尾自动出现邮件入口。`profile.photo` 当前保留为 `null`，第一版不展示头像；将来加照片需要在模板中增加图片与准确的替代文本。`verification` 只用于维护，不显示在网页上。

### 添加项目

在 `projects` 中复制一条，修改：

```json
{
  "title": "项目中文标题",
  "name": "仓库或工具名称",
  "kind": "工具项目 / 资料整理 / 教程复现 / fork",
  "description": "它解决什么问题，如何解决。",
  "contribution": "你实际完成的工作；若只有仓库功能证据，请只写实现范围。",
  "url": "https://github.com/lsh33lxm/真实仓库名",
  "source": "README、源码或你确认的个人分工依据。"
}
```

示例值仅供编辑说明，不会显示在网站。不能因为仓库不是 fork 就推断全部内容原创；教程整理必须保留来源，不把工具功能扩大成个人独立贡献。

### 添加文章

在 `writing.items` 中增加一项；核实小红书单篇标题与稳定链接后，可放入 `writing.xiaohongshuItems`，它会出现在小红书入口下方。

```json
{
  "title": "已经核实的文章标题",
  "category": "统计学习 / 项目复盘 / 小红书笔记",
  "date": "2026-10-14",
  "url": "https://真实的文章地址"
}
```

不要提交 Cookie、访问令牌或临时签名链接。资料库条目的日期目前来自目录与文件名，不等同于额外核实过的发表日期。

## 内容依据与待补充

核实日期：**2026-10-14**。

- 硕士身份：由本人在本次需求中提供，并非通过公开学籍验证。
- `lshlxm`：GitHub 账号 `lsh33lxm` 的公开显示名称，暂作网站昵称。
- 四个精选项目：公开仓库列表、README、Git 树支持页面中的实现范围；均非 GitHub fork。**未据此声称独立开发、作者身份或个人贡献比例。**
- Langchain：README 明确为三套教程整理；公开列出 QunBB、B 站与黑马来源，页面按资料整理与复现展示。
- minnn-learning-notes：公开文件目录可访问，未发现根目录 README。三条笔记标题按文件名做空格、大小写整理，未为 PDF 增写内容摘要，也未将归档材料全部标为原创文章。
- 小红书：用户给出的主页链接有效，读取时只取得页面壳，未核实单篇内容，因此只提供主页入口。
- `magic-resume` 与 `claude-code`：公开列表标为 fork，未放入精选作品。
- 旧站参考：本机 `D:\4.writing\fitness-ui-redesign\frontend\public\about-assets\site-data.json`，参考栏目组织；没有搬入旧站邮箱、详情地址或带临时访问参数的小红书单篇链接。
- 审美参考：<https://jiaxuanzou0714.github.io/>，仅借鉴留白、字体层次与信息结构，未复制源码、文案、图片或经历。
- 自我介绍与兴趣描述：依据用户指定定位与公开学习仓库拟定的第一版文案，待本人确认；不代表已经形成的研究成果或具体学习进度。
- 密度图：标准正态分布 `f(x) = exp(-x²/2) / sqrt(2π)`，阴影表示 `P(-1 ≤ X ≤ 1) ≈ 0.6827`，不是个人实验数据。

集中待填写（不在网页上显示生硬占位）：

- [ ] 展示姓名或昵称：是否继续使用 `lshlxm`。
- [ ] 照片：可选，当前无头像也完整可用。
- [ ] 愿意公开的联系邮箱：可选，当前用 GitHub / 小红书联系。
- [ ] 各原创工具中的个人分工、协作信息与实际贡献。
- [ ] 确认自我介绍、兴趣与学习方向文案。
- [ ] 统计学习、项目复盘的真实标题、日期和链接。
- [ ] 小红书笔记的真实标题与稳定链接。
- [ ] 归档材料的作者、原创或整理属性与来源说明。

不需要填写论文、奖项、导师、实习或详细住址。当前页面不展示这些信息。

## 部署到 GitHub Pages

发布源使用 **main 分支 / 根目录**，不需要 Actions、Jekyll 或线上构建。

首次发布（如果仓库尚未创建）：在 GitHub 创建公开仓库 `lsh33lxm.github.io`，不要自动初始化 README；然后执行：

```powershell
git init -b main
git add .
git commit -m "Build personal homepage"
git remote add github git@github.com:lsh33lxm/lsh33lxm.github.io.git
git push -u github main
```

在仓库 **Settings → Pages → Build and deployment** 中选择 **Deploy from a branch → main → / (root) → Save**。首次发布可能需要几分钟。网址为 <https://lsh33lxm.github.io/>，HTTPS 由 GitHub Pages 提供。

日常更新：

```powershell
# 编辑 content/site.json 后
npm run build
npm run check
git add content/site.json index.html sitemap.xml robots.txt
git commit -m "Update profile and notes"
git push github main
```

改样式、模板或图片时，也提交对应文件。若改了站点标题或展示昵称，同时刷新分享图。更新后检查仓库 Actions 中的 Pages 发布状态与线上页面；浏览器缓存未更新时强制刷新。

## 检查与截图

最快的数据与产物一致性检查：

```powershell
npm run build
npm run check
```

可选浏览器验证（仅本地开发依赖，不参与发布）：

```powershell
npm install --no-save --package-lock=false playwright axe-core
npx playwright install chromium
# 先在另一个终端运行 npm start
node scripts/check-browser.cjs
node scripts/share-image.cjs
```

检查涵盖 320 / 390 / 768 / 1440px、横向及文本溢出、站内锚点、跳转正文、键盘焦点、减少动态效果、关闭 JavaScript、WCAG 2.1 AA 自动规则。报告与截图保存在被 Git 忽略的 `artifacts/`。自动检查不替代人工阅读与屏幕阅读器评估。

本次开发使用环境已有的 Playwright，通过 `NODE_PATH` 指定其模块目录；axe-core 使用临时文件路径 `AXE_PATH`，未将工具库加入网站。

预览图：`artifacts/desktop.png` 和 `artifacts/mobile.png`（本地检查生成）。网站运行时所有资源均在 `assets/`，字体使用系统中文回退，不请求外部 CDN。
