# 个人作品集网站（React + Vite）

暗色 / 克制 / 科技感的个人作品集，PC 端优先，版心 1700px。

## 运行

```bash
npm install
npm run dev      # 开发预览 http://127.0.0.1:5180
npm run build    # 生产构建，输出 dist/
npm run preview  # 预览构建产物
```

> 素材（图片 / 视频）放在 `public/media/`，Vite 会原样输出到 `dist/`，路径引用以 `/media/...` 开头。
> 注意：视频等大文件**不要放进 `src/assets`**（会被打包进 JS，体积爆炸）。

## 目录结构

```
portfolio-site/
├── index.html                 入口 HTML（字体、标题）
├── vite.config.js             端口 5180
├── public/
│   └── media/
│       ├── hero.mp4           Hero 视频背景
│       ├── portrait.jpg       人物图
│       └── works/             作品图 01–07
└── src/
    ├── main.jsx               入口
    ├── App.jsx                页面装配
    ├── data.js                ★ 所有文案 / 作品 / 能力数据
    ├── styles/global.css      ★ 全部样式 + 设计 token
    ├── hooks/useReveal.js     滚动揭示 + 导航吸顶
    └── components/
        ├── Nav.jsx            固定导航（滚动后加模糊背景）
        ├── Hero.jsx           全屏视频背景 + 大标题
        ├── About.jsx          人物图 + 介绍 + 联系方式 + 数据 + 经历
        ├── Projects.jsx       精选项目大卡片（2 列）
        ├── Strengths.jsx      个人优势卡片（3 列）
        └── Contact.jsx        整屏收尾 + 页脚
```

## 改内容

**只改 `src/data.js` 就够了** —— 姓名、职位、联系方式、项目数据、经历时间线、
7 个作品、6 项能力全在里面，组件会自动渲染，不用碰 JSX。

## 设计 token（`src/styles/global.css` 顶部 `:root`）

| 变量 | 值 | 用途 |
|---|---|---|
| `--bg` | `#08080a` | 近黑底色 |
| `--line` | `rgba(255,255,255,.07)` | 极细分隔线 |
| `--text` | `#f0f0ee` | 主文字 |
| `--text-2` / `--text-3` | `#9a9aa0` / `#5e5e66` | 次级 / 弱文字 |
| `--accent` | `#bef264` | 强调色（**只用小面积**：圆点 / 序号 / hover） |
| `--maxw` | `1700px` | 版心宽度 |
| `--sec-pad` | `160px` | 模块上下留白 |

### 避免"模板感"的几个做法

- 不用紫蓝渐变、不用玻璃拟态堆砌
- 强调色只出现在极小面积，大面积保持中性
- Hero 标题第二行用 `-webkit-text-stroke` 描边空心，比实心更有设计感
- 图片默认 `brightness(.86)`，hover 才恢复——制造"未激活 / 激活"层次
- 卡片之间用 1px 网格线分隔（`gap:1px` + 背景色），不用阴影
- Hero 叠了一层 SVG 噪点，避免纯色渐变的廉价感

## 待优化（后续迭代方向）

- [ ] Hero 视频较长，可考虑截取 8–12 秒循环片段减小体积（当前 51MB）
- [ ] 项目卡片可加点击灯箱 / 详情页
- [ ] 补充更多作品后可加分类筛选
- [ ] 可接入 framer-motion 做更顺滑的滚动叙事
