# 小艾塔罗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一个给小艾自己用的三张牌塔罗测算 PWA：录入实体牌 → 复制提示词给 Claude → 粘回解读 → 导出长图/微信文字，记录在手机和电脑间同步。

**Architecture:** Vite + React + TypeScript 单页应用，hash 路由，三个页面（登录/列表/测算）。纯逻辑（牌库、提示词、解读拆分、微信文字、合并规则）放在无 DOM 依赖的模块里用 Vitest 测。数据本地优先：IndexedDB 为显示来源，Supabase `readings` 表做同步。长图用 html-to-image 渲染一个 1080px 宽的离屏 React 组件，字体按需从 Google Fonts `text=` 子集接口取，失败时退回系统字体。

**Tech Stack:** Vite, React, TypeScript, Vitest, @supabase/supabase-js v2, idb-keyval, html-to-image, vite-plugin-pwa, sharp + tsx（仅构建脚本）。

Spec: `docs/superpowers/specs/2026-09-15-tarot-reading-app-design.md`

## Global Constraints

- 项目根目录：`/Users/chengyuri/MyAIAgent/tarot-app`，Node v26，npm 11。
- 部署：GitHub Pages，仓库 `cheng21122001/tarot-app`（公开），Vite `base: '/tarot-app/'`。线上地址 `https://cheng21122001.github.io/tarot-app/`。
- Supabase 项目 `qsqcmsznxhuwjrjnihob`（与「河」「小熊红黑榜」共用），URL `https://qsqcmsznxhuwjrjnihob.supabase.co`，anon key 从 `~/Downloads/网站/river-of-feelings/js/config.js` 复制。anon key 是公开值可以进仓库；除此之外任何密钥不得进仓库。
- 同源隔离：`cheng21122001.github.io` 下还有「河」和「小熊红黑榜」。supabase auth `storageKey` 必须是 `xiaoai-tarot-auth`；idb-keyval 必须用 `createStore('xiaoai-tarot', 'kv')`，不得用默认 store。
- 登录：邮箱 + 密码（`signInWithPassword`）。不做注册、不做验证码、不做魔法链接。
- 界面文案只写功能性文字，中文。署名固定为「小艾」，app 名「小艾塔罗」。
- 主题色：白天 bg `#f4efe6` / ink `#2b2620` / 标题 `#6d5530` / 金线 `#b89a5e`；夜间 bg `#141a2b` / 正文 `#d6d1c4` / 金 `#c9a95c` / 分隔 `#2e3650`。
- 字体栈：`"Noto Serif SC", "Songti SC", "STSong", serif`。
- 长图宽 1080px，PNG。
- 自动保存防抖 1000ms；空白记录（称呼、问题、解读都空且三张牌都没选）不保存。
- 牌 id 格式：大阿卡纳 `major-00`…`major-21`，小阿卡纳 `wands-01`…`wands-14`、`cups-…`、`swords-…`、`pentacles-…`。
- 不做：删除记录、客人档案、API 生成、电子抽牌、其他牌阵。
- 需要小艾本人操作的步骤（输入密码登录、在 Supabase 建表、创建公开仓库）必须停下来在对话里请她确认或操作，不得代输密码。

## File Structure

```
tarot-app/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  .claude/launch.json
  .github/workflows/deploy.yml
  supabase/readings.sql
  scripts/fetch-cards.ts        下载 78 张牌面并转 webp
  scripts/make-icons.ts         生成 PWA 图标
  public/cards/*.webp           78 张（脚本产物，入库）
  public/icons/icon-192.png, icon-512.png
  src/
    main.tsx                    入口，注册 SW
    App.tsx                     登录门 + hash 路由 + 同步状态角标
    styles/tokens.css           主题变量
    styles/app.css              通用：页面、字段、按钮、chip、弹窗
    cards/deck.ts               78 张牌数据、getCard、searchCards、cardImageUrl
    reading/types.ts            Reading 类型、预设、newReading、isBlank、isReadyForPrompt、isComplete
    reading/labels.ts           ORDINALS、orientationLabel、cardLabel、cardDisplayName
    reading/parse.ts            parseInterpretation
    reading/wechat.ts           toWechatText
    reading/search.ts           searchReadings、formatDate
    prompt/template.ts          buildPrompt（口吻只改这里）
    data/rows.ts                Reading <-> 数据库行
    data/merge.ts               mergeReadings、idsToPush、sortByCreatedDesc
    data/supabase.ts            supabase client
    data/local.ts               IndexedDB 读写
    data/remote.ts              拉取/推送
    data/useReadings.ts         同步 hook
    lib/clipboard.ts            copyText
    lib/useHashRoute.ts
    lib/useSystemTheme.ts
    components/TextModal.tsx
    pages/Login.tsx
    pages/ListPage.tsx + list.css
    pages/ReadingPage.tsx + reading.css
    pages/reading/QuestionSection.tsx
    pages/reading/CardSlots.tsx
    pages/reading/CardPicker.tsx
    pages/reading/InterpretationSection.tsx
    pages/reading/ExportSection.tsx
    export/LongImage.tsx + longImage.css
    export/ExportModal.tsx
    export/font.ts              字体子集 CSS
    export/render.ts            renderLongImage
  测试与源文件同目录：*.test.ts
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/app.css`, `.claude/launch.json`
- Modify: `.gitignore`（已存在，确认含 `.superpowers/ node_modules/ dist/ .env*`）

**Interfaces:**
- Produces: `npm run dev`（端口 5174）、`npm test`（`vitest run --passWithNoTests`）、`npm run build`（`tsc --noEmit && vite build`）；CSS 类 `.page .section .field .chips .chip .on .primary .text-btn .hint .error .empty .modal-backdrop .modal .offscreen`。

- [ ] **Step 1: 写 package.json 并安装依赖**

```json
{
  "name": "tarot-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174 --strictPort",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --port 5175",
    "test": "vitest run --passWithNoTests",
    "fetch-cards": "tsx scripts/fetch-cards.ts",
    "make-icons": "tsx scripts/make-icons.ts"
  }
}
```

Run:
```bash
cd /Users/chengyuri/MyAIAgent/tarot-app
npm install react react-dom @supabase/supabase-js idb-keyval html-to-image
npm install -D vite @vitejs/plugin-react typescript vitest @types/react @types/react-dom @types/node vite-plugin-pwa sharp tsx
```
Expected: 安装成功，生成 `package-lock.json`。

- [ ] **Step 2: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "types": ["vite/client", "vite-plugin-pwa/client", "node"]
  },
  "include": ["src", "scripts", "vite.config.ts"]
}
```

- [ ] **Step 3: vite.config.ts（PWA 在 Task 12 加）**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/tarot-app/',
  plugins: [react()],
  test: { environment: 'node' },
});
```

- [ ] **Step 4: index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="小艾塔罗" />
    <link rel="apple-touch-icon" href="%BASE_URL%icons/icon-192.png" />
    <title>小艾塔罗</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 样式**

`src/styles/tokens.css`:
```css
:root {
  --bg: #f4efe6;
  --surface: #fbf8f2;
  --ink: #2b2620;
  --muted: #7a6f60;
  --accent: #6d5530;
  --gold: #b89a5e;
  --line: #d9ccb2;
  --danger: #9b3b2e;
  --font: "Noto Serif SC", "Songti SC", "STSong", serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #141a2b;
    --surface: #1b2238;
    --ink: #e6e1d3;
    --muted: #8e96ad;
    --accent: #c9a95c;
    --gold: #c9a95c;
    --line: #2e3650;
    --danger: #e08a7a;
    color-scheme: dark;
  }
}
```

`src/styles/app.css`:
```css
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--font); }
body { -webkit-text-size-adjust: 100%; }
button, input, textarea { font: inherit; color: inherit; }
.page { max-width: 720px; margin: 0 auto; padding: max(16px, env(safe-area-inset-top)) 16px calc(96px + env(safe-area-inset-bottom)); }
h1 { font-size: 20px; font-weight: 600; margin: 8px 0 12px; color: var(--accent); }
.section { border-top: 1px solid var(--line); padding: 16px 0; }
.section h2 { font-size: 15px; font-weight: 600; color: var(--accent); margin: 0 0 12px; letter-spacing: .1em; }
.field { display: block; margin-bottom: 12px; }
.field > span { display: block; font-size: 13px; color: var(--muted); margin-bottom: 4px; }
input[type=text], input[type=email], input[type=password], input[type=search], input:not([type]), textarea {
  width: 100%; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; font-size: 16px; outline: none;
}
input:focus, textarea:focus { border-color: var(--gold); }
textarea { resize: vertical; line-height: 1.7; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid var(--line); background: transparent; border-radius: 999px; padding: 6px 12px; font-size: 14px; cursor: pointer; }
.chip.on { border-color: var(--gold); background: var(--gold); color: var(--bg); }
.primary { border: 0; background: var(--accent); color: var(--bg); border-radius: 6px; padding: 10px 16px; font-size: 15px; cursor: pointer; }
.primary:disabled { opacity: .4; cursor: default; }
.text-btn { border: 0; background: none; color: var(--accent); padding: 6px 8px; font-size: 15px; cursor: pointer; }
.hint { font-size: 13px; color: var(--muted); margin: 6px 0; }
.error { font-size: 14px; color: var(--danger); }
.empty { text-align: center; color: var(--muted); padding: 48px 0; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-end; justify-content: center; z-index: 20; }
.modal { background: var(--bg); width: 100%; max-width: 720px; max-height: 92vh; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; overflow: hidden; }
@media (min-width: 760px) { .modal-backdrop { align-items: center; } .modal { border-radius: 12px; } }
.offscreen { position: fixed; left: -20000px; top: 0; pointer-events: none; }
.sync-badge { position: fixed; top: max(8px, env(safe-area-inset-top)); right: 12px; font-size: 12px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 2px 8px; background: var(--bg); z-index: 10; }
```

- [ ] **Step 6: 入口与临时 App**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`（Task 8 替换）:
```tsx
export default function App() {
  return <div className="page"><h1>小艾塔罗</h1></div>;
}
```

`.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "tarot-app", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5174 }
  ]
}
```

- [ ] **Step 7: 验证**

Run: `npm test && npm run build`
Expected: vitest 报 no test files 但退出码 0；build 生成 `dist/`。

- [ ] **Step 8: Commit**

```bash
git add -A ':!dist' && git commit -m "chore: scaffold Vite React TS app"
```

---

### Task 2: 牌库与牌面图

**Files:**
- Create: `src/cards/deck.ts`, `src/cards/deck.test.ts`, `scripts/fetch-cards.ts`, `public/cards/*.webp`

**Interfaces:**
- Produces:
  - `type CardGroup = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles'`
  - `interface Card { id: string; nameZh: string; nameEn: string; group: CardGroup; commonsFile: string; keywords: string[] }`
  - `const DECK: Card[]`（78 张，大阿卡纳在前，按权杖/圣杯/宝剑/星币顺序）
  - `getCard(id: string): Card`（未知 id 抛错）
  - `searchCards(query: string): Card[]`
  - `cardImageUrl(id: string): string` → `${import.meta.env.BASE_URL}cards/${id}.webp`
  - `GROUP_LABELS: Record<CardGroup, string>`

- [ ] **Step 1: 写失败测试** `src/cards/deck.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { DECK, getCard, searchCards } from './deck';

describe('deck', () => {
  it('has 78 unique cards', () => {
    expect(DECK).toHaveLength(78);
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78);
  });

  it('names majors and minors in Chinese', () => {
    expect(getCard('major-00').nameZh).toBe('愚人');
    expect(getCard('major-16').nameZh).toBe('塔');
    expect(getCard('swords-03').nameZh).toBe('宝剑三');
    expect(getCard('wands-01').nameZh).toBe('权杖王牌');
    expect(getCard('pentacles-12').nameZh).toBe('星币骑士');
    expect(getCard('cups-13').nameZh).toBe('圣杯王后');
    expect(getCard('pentacles-12').commonsFile).toBe('Pents12.jpg');
  });

  it('throws on unknown id', () => {
    expect(() => getCard('nope')).toThrow();
  });

  it('searches by Chinese name, digits and English', () => {
    expect(searchCards('塔').map((c) => c.id)).toContain('major-16');
    expect(searchCards('宝剑三').map((c) => c.id)).toEqual(['swords-03']);
    expect(searchCards('宝剑3').map((c) => c.id)).toEqual(['swords-03']);
    expect(searchCards('权杖一').map((c) => c.id)).toEqual(['wands-01']);
    expect(searchCards('knight')).toHaveLength(4);
    expect(searchCards(' 星 星 ').map((c) => c.id)).toContain('major-17');
  });

  it('returns whole deck for empty query', () => {
    expect(searchCards('  ')).toHaveLength(78);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/cards`
Expected: FAIL，找不到 `./deck`。

- [ ] **Step 3: 实现** `src/cards/deck.ts`

```ts
export type CardGroup = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export interface Card {
  id: string;
  nameZh: string;
  nameEn: string;
  group: CardGroup;
  commonsFile: string;
  keywords: string[];
}

export const GROUP_LABELS: Record<CardGroup, string> = {
  major: '大阿卡纳',
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
};

const MAJORS: [string, string, string][] = [
  ['愚人', 'The Fool', 'RWS_Tarot_00_Fool.jpg'],
  ['魔术师', 'The Magician', 'RWS_Tarot_01_Magician.jpg'],
  ['女祭司', 'The High Priestess', 'RWS_Tarot_02_High_Priestess.jpg'],
  ['皇后', 'The Empress', 'RWS_Tarot_03_Empress.jpg'],
  ['皇帝', 'The Emperor', 'RWS_Tarot_04_Emperor.jpg'],
  ['教皇', 'The Hierophant', 'RWS_Tarot_05_Hierophant.jpg'],
  ['恋人', 'The Lovers', 'RWS_Tarot_06_Lovers.jpg'],
  ['战车', 'The Chariot', 'RWS_Tarot_07_Chariot.jpg'],
  ['力量', 'Strength', 'RWS_Tarot_08_Strength.jpg'],
  ['隐士', 'The Hermit', 'RWS_Tarot_09_Hermit.jpg'],
  ['命运之轮', 'Wheel of Fortune', 'RWS_Tarot_10_Wheel_of_Fortune.jpg'],
  ['正义', 'Justice', 'RWS_Tarot_11_Justice.jpg'],
  ['倒吊人', 'The Hanged Man', 'RWS_Tarot_12_Hanged_Man.jpg'],
  ['死神', 'Death', 'RWS_Tarot_13_Death.jpg'],
  ['节制', 'Temperance', 'RWS_Tarot_14_Temperance.jpg'],
  ['恶魔', 'The Devil', 'RWS_Tarot_15_Devil.jpg'],
  ['塔', 'The Tower', 'RWS_Tarot_16_Tower.jpg'],
  ['星星', 'The Star', 'RWS_Tarot_17_Star.jpg'],
  ['月亮', 'The Moon', 'RWS_Tarot_18_Moon.jpg'],
  ['太阳', 'The Sun', 'RWS_Tarot_19_Sun.jpg'],
  ['审判', 'Judgement', 'RWS_Tarot_20_Judgement.jpg'],
  ['世界', 'The World', 'RWS_Tarot_21_World.jpg'],
];

const SUITS: { group: Exclude<CardGroup, 'major'>; zh: string; en: string; commons: string }[] = [
  { group: 'wands', zh: '权杖', en: 'Wands', commons: 'Wands' },
  { group: 'cups', zh: '圣杯', en: 'Cups', commons: 'Cups' },
  { group: 'swords', zh: '宝剑', en: 'Swords', commons: 'Swords' },
  { group: 'pentacles', zh: '星币', en: 'Pentacles', commons: 'Pents' },
];

const RANKS_ZH = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王'];
const NUMERALS_ZH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const RANKS_EN = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

const pad = (n: number) => String(n).padStart(2, '0');
const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();

function buildDeck(): Card[] {
  const majors: Card[] = MAJORS.map(([zh, en, file], i) => ({
    id: `major-${pad(i)}`,
    nameZh: zh,
    nameEn: en,
    group: 'major',
    commonsFile: file,
    keywords: [zh, norm(en), String(i)],
  }));
  const minors: Card[] = SUITS.flatMap((suit) =>
    RANKS_ZH.map((rank, i) => {
      const n = i + 1;
      const nameZh = `${suit.zh}${rank}`;
      const nameEn = `${RANKS_EN[i]} of ${suit.en}`;
      const keywords = [nameZh, norm(nameEn)];
      if (n <= 10) keywords.push(`${suit.zh}${NUMERALS_ZH[i]}`, `${suit.zh}${n}`);
      if (n === 1) keywords.push(`${suit.zh}首牌`);
      return {
        id: `${suit.group}-${pad(n)}`,
        nameZh,
        nameEn,
        group: suit.group,
        commonsFile: `${suit.commons}${pad(n)}.jpg`,
        keywords,
      };
    }),
  );
  return [...majors, ...minors];
}

export const DECK: Card[] = buildDeck();
const BY_ID = new Map(DECK.map((c) => [c.id, c]));

export function getCard(id: string): Card {
  const card = BY_ID.get(id);
  if (!card) throw new Error(`Unknown card id: ${id}`);
  return card;
}

export function searchCards(query: string): Card[] {
  const q = norm(query);
  if (!q) return DECK;
  const exact = DECK.filter((c) => c.keywords.some((k) => k === q));
  if (exact.length) return exact;
  return DECK.filter((c) => c.keywords.some((k) => k.includes(q)));
}

export function cardImageUrl(id: string): string {
  return `${import.meta.env.BASE_URL}cards/${id}.webp`;
}
```

说明：精确匹配优先，所以「宝剑三」只返回宝剑三；「塔」没有其他精确匹配，只返回塔本身——测试用 `toContain` 足够。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/cards`
Expected: PASS（5 tests）。

- [ ] **Step 5: 下载脚本** `scripts/fetch-cards.ts`

```ts
import { access, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { DECK } from '../src/cards/deck';

const OUT = 'public/cards';
await mkdir(OUT, { recursive: true });

for (const card of DECK) {
  const out = `${OUT}/${card.id}.webp`;
  try {
    await access(out);
    continue;
  } catch {
    // not downloaded yet
  }
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(card.commonsFile)}?width=500`;
  const res = await fetch(url, { headers: { 'User-Agent': 'xiaoai-tarot/1.0 (personal, non-commercial)' } });
  if (!res.ok) throw new Error(`${card.id}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize({ width: 360 }).webp({ quality: 80 }).toFile(out);
  console.log('ok', card.id);
  await new Promise((r) => setTimeout(r, 300));
}
console.log('done');
```

- [ ] **Step 6: 跑脚本并检查**

Run: `npm run fetch-cards && ls public/cards | wc -l && du -sh public/cards`
Expected: 78 个文件，总量约 2–3 MB。失败时重跑（已下载的会跳过）。

- [ ] **Step 7: Commit**

```bash
git add src/cards scripts/fetch-cards.ts public/cards && git commit -m "feat: tarot deck data and RWS card images"
```

---

### Task 3: Reading 类型、牌名标签、提示词

**Files:**
- Create: `src/reading/types.ts`, `src/reading/types.test.ts`, `src/reading/labels.ts`, `src/prompt/template.ts`, `src/prompt/template.test.ts`

**Interfaces:**
- Consumes: `getCard` (Task 2)
- Produces:
  - `type SpreadPreset = 'past_present_future' | 'situation_obstacle_advice' | 'you_them_outcome' | 'custom'`
  - `type Theme = 'day' | 'night'`
  - `interface CardPick { id: string; reversed: boolean }`
  - `type Positions = [string, string, string]`, `type CardSlotsValue = [CardPick | null, CardPick | null, CardPick | null]`
  - `interface Reading { id; createdAt: string; updatedAt: string; clientName: string; question: string; spreadPreset: SpreadPreset; positions: Positions; cards: CardSlotsValue; interpretation: string; exportTheme: Theme | null }`
  - `PRESETS: Record<Exclude<SpreadPreset,'custom'>, Positions>`
  - `newReading(now?: Date): Reading`, `isBlank(r): boolean`, `isReadyForPrompt(r): boolean`, `isComplete(r): boolean`
  - `ORDINALS: readonly ['第一张','第二张','第三张']`, `orientationLabel(reversed: boolean): '正位'|'逆位'`, `cardLabel(pick: CardPick|null): string`（`宝剑三·逆位`）, `cardDisplayName(pick: CardPick|null): string`（`宝剑三 逆位`）
  - `buildPrompt(r: Reading): string`

- [ ] **Step 1: 写失败测试**

`src/reading/types.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { isBlank, isComplete, isReadyForPrompt, newReading, PRESETS, type Reading } from './types';

describe('reading helpers', () => {
  it('creates a blank reading with default preset', () => {
    const r = newReading(new Date('2026-09-15T10:00:00Z'));
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.createdAt).toBe('2026-09-15T10:00:00.000Z');
    expect(r.updatedAt).toBe(r.createdAt);
    expect(r.spreadPreset).toBe('past_present_future');
    expect(r.positions).toEqual(PRESETS.past_present_future);
    expect(r.cards).toEqual([null, null, null]);
    expect(r.exportTheme).toBeNull();
    expect(isBlank(r)).toBe(true);
    expect(isComplete(r)).toBe(false);
  });

  it('is not blank once anything is filled', () => {
    expect(isBlank({ ...newReading(), clientName: '小林' })).toBe(false);
    expect(isBlank({ ...newReading(), cards: [{ id: 'major-00', reversed: false }, null, null] })).toBe(false);
  });

  it('is ready for prompt only with question, positions and three cards', () => {
    const r: Reading = {
      ...newReading(),
      question: '要继续合作吗？',
      cards: [
        { id: 'pentacles-12', reversed: false },
        { id: 'swords-03', reversed: true },
        { id: 'major-17', reversed: false },
      ],
    };
    expect(isReadyForPrompt(r)).toBe(true);
    expect(isReadyForPrompt({ ...r, question: '  ' })).toBe(false);
    expect(isReadyForPrompt({ ...r, positions: ['现状', '', '建议'] })).toBe(false);
    expect(isReadyForPrompt({ ...r, cards: [r.cards[0], null, r.cards[2]] })).toBe(false);
  });

  it('is complete when interpretation has text', () => {
    expect(isComplete({ ...newReading(), interpretation: ' \n ' })).toBe(false);
    expect(isComplete({ ...newReading(), interpretation: '解读' })).toBe(true);
  });
});
```

`src/prompt/template.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { newReading, type Reading } from '../reading/types';
import { buildPrompt } from './template';

const sample: Reading = {
  ...newReading(),
  clientName: '小林',
  question: '我和现在的合作方，还要继续合作吗？',
  spreadPreset: 'situation_obstacle_advice',
  positions: ['现状', '阻碍', '建议'],
  cards: [
    { id: 'pentacles-12', reversed: false },
    { id: 'swords-03', reversed: true },
    { id: 'major-17', reversed: false },
  ],
};

describe('buildPrompt', () => {
  it('includes the materials', () => {
    const p = buildPrompt(sample);
    expect(p).toContain('客人称呼：小林');
    expect(p).toContain('问题：我和现在的合作方，还要继续合作吗？');
    expect(p).toContain('第二张（阻碍）：宝剑三·逆位');
  });

  it('spells out the exact output headings', () => {
    const p = buildPrompt(sample);
    expect(p).toContain('【第一张｜现状｜星币骑士·正位】\n【第二张｜阻碍｜宝剑三·逆位】\n【第三张｜建议｜星星·正位】\n【整体解读】\n【建议】');
  });

  it('carries the writing rules', () => {
    const p = buildPrompt(sample);
    expect(p).toContain('600 到 900 字');
    expect(p).toContain('韦特');
    expect(p).toContain('不要在正文里写免责声明');
  });

  it('falls back to 客人 when name is empty', () => {
    expect(buildPrompt({ ...sample, clientName: ' ' })).toContain('客人称呼：客人');
  });
});
```


- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/reading src/prompt`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 types.ts**

```ts
export type SpreadPreset = 'past_present_future' | 'situation_obstacle_advice' | 'you_them_outcome' | 'custom';
export type Theme = 'day' | 'night';

export interface CardPick {
  id: string;
  reversed: boolean;
}

export type Positions = [string, string, string];
export type CardSlotsValue = [CardPick | null, CardPick | null, CardPick | null];

export interface Reading {
  id: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  question: string;
  spreadPreset: SpreadPreset;
  positions: Positions;
  cards: CardSlotsValue;
  interpretation: string;
  exportTheme: Theme | null;
}

export const PRESETS: Record<Exclude<SpreadPreset, 'custom'>, Positions> = {
  past_present_future: ['过去', '现在', '未来'],
  situation_obstacle_advice: ['现状', '阻碍', '建议'],
  you_them_outcome: ['你', '对方', '关系走向'],
};

export function newReading(now: Date = new Date()): Reading {
  const t = now.toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: t,
    updatedAt: t,
    clientName: '',
    question: '',
    spreadPreset: 'past_present_future',
    positions: [...PRESETS.past_present_future],
    cards: [null, null, null],
    interpretation: '',
    exportTheme: null,
  };
}

export function isBlank(r: Reading): boolean {
  return !r.clientName.trim() && !r.question.trim() && !r.interpretation.trim() && r.cards.every((c) => c === null);
}

export function isReadyForPrompt(r: Reading): boolean {
  return Boolean(r.question.trim()) && r.positions.every((p) => p.trim()) && r.cards.every((c) => c !== null);
}

export function isComplete(r: Reading): boolean {
  return Boolean(r.interpretation.trim());
}
```

- [ ] **Step 4: 实现 labels.ts**

```ts
import { getCard } from '../cards/deck';
import type { CardPick } from './types';

export const ORDINALS = ['第一张', '第二张', '第三张'] as const;

export function orientationLabel(reversed: boolean): '正位' | '逆位' {
  return reversed ? '逆位' : '正位';
}

export function cardLabel(pick: CardPick | null): string {
  return pick ? `${getCard(pick.id).nameZh}·${orientationLabel(pick.reversed)}` : '未选牌';
}

export function cardDisplayName(pick: CardPick | null): string {
  return pick ? `${getCard(pick.id).nameZh} ${orientationLabel(pick.reversed)}` : '未选牌';
}
```

- [ ] **Step 5: 实现 template.ts**

```ts
import { cardLabel, ORDINALS } from '../reading/labels';
import type { Reading } from '../reading/types';

// 解读口吻只改这个文件。
export function buildPrompt(r: Reading): string {
  const cardLines = r.positions.map((p, i) => `${ORDINALS[i]}（${p}）：${cardLabel(r.cards[i])}`);
  const headings = r.positions.map((p, i) => `【${ORDINALS[i]}｜${p}｜${cardLabel(r.cards[i])}】`);
  return [
    '你是一位使用韦特塔罗体系的专业塔罗师，正在为一位付费客人做三张牌解读。',
    '',
    '本次材料',
    `客人称呼：${r.clientName.trim() || '客人'}`,
    `问题：${r.question.trim()}`,
    `牌阵：三张牌，位置依次为 ${r.positions.join(' / ')}`,
    ...cardLines,
    '',
    '写作要求',
    '1. 每张牌先说明这张牌（含正逆位）在该位置上的含义，再具体落到客人的问题上。',
    '2. 讲清三张牌之间的关联和走向，不要三段各说各的。',
    '3. 整体解读要给出明确判断，不说模棱两可的话。',
    '4. 建议要具体到客人接下来可以做的事。',
    '5. 口吻专业、克制、清楚：不渲染恐惧，不写鸡汤，不堆砌玄乎的修辞。',
    '6. 全文 600 到 900 字。',
    '7. 如果问题涉及健康、怀孕或法律纠纷，只谈心态与方向，不给医疗或法律上的结论；也不要在正文里写免责声明。',
    '',
    '输出格式',
    '严格按下面五个标题输出，每个标题独占一行，标题下面直接写正文。不要加其他标题、开场白或结束语，不要使用 Markdown 符号。',
    ...headings,
    '【整体解读】',
    '【建议】',
  ].join('\n');
}
```

- [ ] **Step 6: 跑测试确认通过**

Run: `npx vitest run src/reading src/prompt`
Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add src/reading src/prompt && git commit -m "feat: reading model and prompt builder"
```

---

### Task 4: 解读拆分

**Files:**
- Create: `src/reading/parse.ts`, `src/reading/parse.test.ts`

**Interfaces:**
- Produces:
  - `type ParsedInterpretation = { kind: 'sections'; cards: [string, string, string]; overall: string; advice: string } | { kind: 'plain'; text: string }`
  - `parseInterpretation(raw: string): ParsedInterpretation`

- [ ] **Step 1: 写失败测试** `src/reading/parse.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { parseInterpretation } from './parse';

const standard = `【第一张｜现状｜星币骑士·正位】
现状段落。

【第二张｜阻碍｜宝剑三·逆位】
阻碍段落第一句。
阻碍段落第二句。
【第三张｜建议｜星星·正位】
建议牌段落。
【整体解读】
整体段落。
【建议】
行动建议。`;

describe('parseInterpretation', () => {
  it('splits the standard format', () => {
    expect(parseInterpretation(standard)).toEqual({
      kind: 'sections',
      cards: ['现状段落。', '阻碍段落第一句。\n阻碍段落第二句。', '建议牌段落。'],
      overall: '整体段落。',
      advice: '行动建议。',
    });
  });

  it('ignores a preamble before the first heading', () => {
    const r = parseInterpretation(`好的，以下是解读：\n\n${standard}`);
    expect(r.kind).toBe('sections');
  });

  it('collapses runs of blank lines inside a section', () => {
    const r = parseInterpretation(standard.replace('整体段落。', '第一段。\n\n\n\n第二段。'));
    expect(r.kind === 'sections' && r.overall).toBe('第一段。\n\n第二段。');
  });

  it('accepts half-width brackets, markdown decoration and CRLF', () => {
    const messy = standard
      .replace('【整体解读】', '**【整体解读】**')
      .replace('【建议】', '## [建议]')
      .replace('【第一张｜现状｜星币骑士·正位】', '[第一张 | 现状 | 星币骑士·正位]')
      .replace(/\n/g, '\r\n');
    const r = parseInterpretation(messy);
    expect(r.kind).toBe('sections');
    expect(r.kind === 'sections' && r.advice).toBe('行动建议。');
  });

  it('still splits when the card name in a heading does not match', () => {
    const r = parseInterpretation(standard.replace('宝剑三·逆位', '宝剑四·正位'));
    expect(r.kind).toBe('sections');
  });

  it('falls back to plain when a section is missing', () => {
    const noAdvice = standard.replace('【建议】\n行动建议。', '');
    expect(parseInterpretation(noAdvice)).toEqual({ kind: 'plain', text: noAdvice.trim() });
  });

  it('falls back to plain when a section is empty', () => {
    const empty = standard.replace('整体段落。', '');
    expect(parseInterpretation(empty).kind).toBe('plain');
  });

  it('falls back to plain when there are no headings', () => {
    expect(parseInterpretation('  一整段解读。\n第二行。 ')).toEqual({ kind: 'plain', text: '一整段解读。\n第二行。' });
  });

  it('returns empty plain for empty input', () => {
    expect(parseInterpretation('')).toEqual({ kind: 'plain', text: '' });
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/reading/parse.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现** `src/reading/parse.ts`

```ts
export type ParsedInterpretation =
  | { kind: 'sections'; cards: [string, string, string]; overall: string; advice: string }
  | { kind: 'plain'; text: string };

type Key = 0 | 1 | 2 | 'overall' | 'advice';

const HEADING = /^[\s*#>]*[【[]\s*([^【】[\]]+?)\s*[】\]][\s*]*$/;

function keyOf(label: string): Key | null {
  const s = label.replace(/\s/g, '');
  if (/^第(一|1)张/.test(s)) return 0;
  if (/^第(二|2)张/.test(s)) return 1;
  if (/^第(三|3)张/.test(s)) return 2;
  if (s.startsWith('整体解读')) return 'overall';
  if (s.startsWith('建议')) return 'advice';
  return null;
}

export function parseInterpretation(raw: string): ParsedInterpretation {
  const text = raw.replace(/\r\n?/g, '\n').trim();
  const bodies = new Map<Key, string[]>();
  let current: Key | null = null;

  for (const line of text.split('\n')) {
    const m = line.match(HEADING);
    if (m) {
      const key = keyOf(m[1]);
      if (key !== null && !bodies.has(key)) {
        bodies.set(key, []);
        current = key;
        continue;
      }
    }
    if (current !== null) bodies.get(current)!.push(line);
  }

  const body = (k: Key) => (bodies.get(k) ?? []).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const cards: [string, string, string] = [body(0), body(1), body(2)];
  const overall = body('overall');
  const advice = body('advice');

  if (bodies.size === 5 && [...cards, overall, advice].every(Boolean)) {
    return { kind: 'sections', cards, overall, advice };
  }
  return { kind: 'plain', text };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/reading/parse.test.ts`
Expected: PASS（9 tests）。

- [ ] **Step 5: Commit**

```bash
git add src/reading/parse.ts src/reading/parse.test.ts && git commit -m "feat: split pasted interpretation into sections"
```

---

### Task 5: 微信文字、列表搜索、日期格式

**Files:**
- Create: `src/reading/wechat.ts`, `src/reading/wechat.test.ts`, `src/reading/search.ts`, `src/reading/search.test.ts`

**Interfaces:**
- Consumes: `Reading` (Task 3), `ORDINALS`, `cardDisplayName` (Task 3), `ParsedInterpretation` (Task 4)
- Produces:
  - `SIGNATURE = '小艾'`
  - `cardTitle(r: Reading, i: 0|1|2): string` → `第一张 · 现状 · 星币骑士 正位`
  - `toWechatText(r: Reading, parsed: ParsedInterpretation): string`
  - `searchReadings(list: Reading[], query: string): Reading[]`
  - `formatDate(iso: string): string` → 本地时区 `2026.09.15`

- [ ] **Step 1: 写失败测试**

`src/reading/wechat.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { newReading, type Reading } from './types';
import { cardTitle, toWechatText } from './wechat';

const r: Reading = {
  ...newReading(),
  question: ' 要继续合作吗？ ',
  positions: ['现状', '阻碍', '建议'],
  cards: [
    { id: 'pentacles-12', reversed: false },
    { id: 'swords-03', reversed: true },
    { id: 'major-17', reversed: false },
  ],
};

describe('toWechatText', () => {
  it('builds card titles', () => {
    expect(cardTitle(r, 1)).toBe('第二张 · 阻碍 · 宝剑三 逆位');
  });

  it('formats sections', () => {
    const text = toWechatText(r, { kind: 'sections', cards: ['A', 'B', 'C'], overall: 'D', advice: 'E' });
    expect(text).toBe(
      [
        '问题：要继续合作吗？',
        '',
        '第一张 · 现状 · 星币骑士 正位',
        'A',
        '——',
        '第二张 · 阻碍 · 宝剑三 逆位',
        'B',
        '——',
        '第三张 · 建议 · 星星 正位',
        'C',
        '——',
        '整体解读',
        'D',
        '——',
        '建议',
        'E',
        '',
        '小艾',
      ].join('\n'),
    );
  });

  it('formats plain text', () => {
    expect(toWechatText(r, { kind: 'plain', text: '整段' })).toBe('问题：要继续合作吗？\n\n整段\n\n小艾');
  });
});
```

`src/reading/search.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatDate, searchReadings } from './search';
import { newReading } from './types';

const a = { ...newReading(), clientName: '小林', question: '合作还继续吗' };
const b = { ...newReading(), clientName: 'Amy', question: '他会回来吗' };

describe('searchReadings', () => {
  it('returns all for empty query', () => {
    expect(searchReadings([a, b], ' ')).toEqual([a, b]);
  });
  it('matches name or question, case-insensitive', () => {
    expect(searchReadings([a, b], '小林')).toEqual([a]);
    expect(searchReadings([a, b], '回来')).toEqual([b]);
    expect(searchReadings([a, b], 'amy')).toEqual([b]);
  });
});

describe('formatDate', () => {
  it('formats local date with dots', () => {
    const iso = new Date(2026, 8, 5, 23, 30).toISOString();
    expect(formatDate(iso)).toBe('2026.09.05');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/reading/wechat.test.ts src/reading/search.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现**

`src/reading/wechat.ts`:
```ts
import { cardDisplayName, ORDINALS } from './labels';
import type { ParsedInterpretation } from './parse';
import type { Reading } from './types';

export const SIGNATURE = '小艾';

export function cardTitle(r: Reading, i: 0 | 1 | 2): string {
  return `${ORDINALS[i]} · ${r.positions[i]} · ${cardDisplayName(r.cards[i])}`;
}

export function toWechatText(r: Reading, parsed: ParsedInterpretation): string {
  const head = `问题：${r.question.trim()}`;
  if (parsed.kind === 'plain') return [head, '', parsed.text, '', SIGNATURE].join('\n');
  const blocks = ([0, 1, 2] as const).map((i) => `${cardTitle(r, i)}\n${parsed.cards[i]}`);
  blocks.push(`整体解读\n${parsed.overall}`, `建议\n${parsed.advice}`);
  return [head, '', blocks.join('\n——\n'), '', SIGNATURE].join('\n');
}
```

`src/reading/search.ts`:
```ts
import type { Reading } from './types';

export function searchReadings(list: Reading[], query: string): Reading[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((r) => r.clientName.toLowerCase().includes(q) || r.question.toLowerCase().includes(q));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/reading`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/reading && git commit -m "feat: wechat text export, search and date format"
```

---

### Task 6: 数据行映射与合并规则

**Files:**
- Create: `src/data/rows.ts`, `src/data/rows.test.ts`, `src/data/merge.ts`, `src/data/merge.test.ts`

**Interfaces:**
- Consumes: `Reading`, `CardPick`, `Theme` (Task 3)
- Produces:
  - `interface ReadingRow { id: string; created_at: string; updated_at: string; client_name: string; question: string; spread_preset: string; positions: string[]; cards: (CardPick | null)[]; interpretation: string; export_theme: Theme | null }`
  - `toRow(r: Reading): ReadingRow`, `fromRow(row: ReadingRow): Reading`
  - `sortByCreatedDesc(list: Reading[]): Reading[]`
  - `mergeReadings(local: Reading[], remote: Reading[]): Reading[]`（按 id，`updatedAt` 较新者胜，相等取远端，结果按创建时间倒序）
  - `idsToPush(local: Reading[], remote: Reading[], pending: string[]): string[]`（在 pending 里、远端没有、或本地更新的本地记录 id）

- [ ] **Step 1: 写失败测试**

`src/data/rows.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { newReading, type Reading } from '../reading/types';
import { fromRow, toRow } from './rows';

describe('rows', () => {
  it('round-trips a reading', () => {
    const r: Reading = { ...newReading(), clientName: '小林', cards: [{ id: 'major-00', reversed: true }, null, null], exportTheme: 'night' };
    expect(fromRow(toRow(r))).toEqual(r);
  });

  it('pads short positions/cards and normalises unknown preset', () => {
    const r = fromRow({
      id: 'x', created_at: '2026-09-15T00:00:00Z', updated_at: '2026-09-15T00:00:00Z',
      client_name: '', question: '', spread_preset: 'weird', positions: ['A'], cards: [], interpretation: '', export_theme: null,
    });
    expect(r.positions).toEqual(['A', '', '']);
    expect(r.cards).toEqual([null, null, null]);
    expect(r.spreadPreset).toBe('custom');
  });
});
```

`src/data/merge.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { newReading, type Reading } from '../reading/types';
import { idsToPush, mergeReadings } from './merge';

const make = (id: string, created: string, updated: string, name = id): Reading => ({
  ...newReading(), id, createdAt: created, updatedAt: updated, clientName: name,
});

describe('mergeReadings', () => {
  it('keeps the newer copy of each record and sorts by createdAt desc', () => {
    const local = [make('a', '2026-09-01T00:00:00Z', '2026-09-10T00:00:00Z', 'local-a'), make('b', '2026-09-02T00:00:00Z', '2026-09-02T00:00:00Z', 'local-b')];
    const remote = [make('a', '2026-09-01T00:00:00Z', '2026-09-05T00:00:00Z', 'remote-a'), make('b', '2026-09-02T00:00:00Z', '2026-09-08T00:00:00Z', 'remote-b'), make('c', '2026-09-03T00:00:00Z', '2026-09-03T00:00:00Z')];
    const merged = mergeReadings(local, remote);
    expect(merged.map((r) => r.id)).toEqual(['c', 'b', 'a']);
    expect(merged.find((r) => r.id === 'a')!.clientName).toBe('local-a');
    expect(merged.find((r) => r.id === 'b')!.clientName).toBe('remote-b');
  });

  it('prefers remote on equal timestamps', () => {
    const t = '2026-09-01T00:00:00Z';
    expect(mergeReadings([make('a', t, t, 'L')], [make('a', t, t, 'R')])[0].clientName).toBe('R');
  });
});

describe('idsToPush', () => {
  it('pushes pending, missing-remotely and locally newer records', () => {
    const t1 = '2026-09-01T00:00:00Z';
    const t2 = '2026-09-02T00:00:00Z';
    const local = [make('pending', t1, t1), make('new', t1, t1), make('newer', t1, t2), make('same', t1, t1)];
    const remote = [make('pending', t1, t1), make('newer', t1, t1), make('same', t1, t1)];
    expect(idsToPush(local, remote, ['pending']).sort()).toEqual(['new', 'newer', 'pending']);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/data`
Expected: FAIL。

- [ ] **Step 3: 实现**

`src/data/rows.ts`:
```ts
import type { CardPick, CardSlotsValue, Positions, Reading, SpreadPreset, Theme } from '../reading/types';

export interface ReadingRow {
  id: string;
  created_at: string;
  updated_at: string;
  client_name: string;
  question: string;
  spread_preset: string;
  positions: string[];
  cards: (CardPick | null)[];
  interpretation: string;
  export_theme: Theme | null;
}

const PRESET_VALUES: SpreadPreset[] = ['past_present_future', 'situation_obstacle_advice', 'you_them_outcome', 'custom'];

export function toRow(r: Reading): ReadingRow {
  return {
    id: r.id,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    client_name: r.clientName,
    question: r.question,
    spread_preset: r.spreadPreset,
    positions: [...r.positions],
    cards: [...r.cards],
    interpretation: r.interpretation,
    export_theme: r.exportTheme,
  };
}

export function fromRow(row: ReadingRow): Reading {
  const positions = [0, 1, 2].map((i) => row.positions?.[i] ?? '') as Positions;
  const cards = [0, 1, 2].map((i) => row.cards?.[i] ?? null) as CardSlotsValue;
  const preset = PRESET_VALUES.includes(row.spread_preset as SpreadPreset) ? (row.spread_preset as SpreadPreset) : 'custom';
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    clientName: row.client_name ?? '',
    question: row.question ?? '',
    spreadPreset: preset,
    positions,
    cards,
    interpretation: row.interpretation ?? '',
    exportTheme: row.export_theme === 'day' || row.export_theme === 'night' ? row.export_theme : null,
  };
}
```

说明：Postgres 返回的 timestamptz 形如 `2026-09-15T10:00:00+00:00`，`fromRow` 统一转成 `toISOString()` 格式，round-trip 测试因此成立（`newReading` 本就用 ISO 格式）。

`src/data/merge.ts`:
```ts
import type { Reading } from '../reading/types';

const time = (r: Reading) => Date.parse(r.updatedAt);

export function sortByCreatedDesc(list: Reading[]): Reading[] {
  return [...list].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function mergeReadings(local: Reading[], remote: Reading[]): Reading[] {
  const byId = new Map<string, Reading>();
  for (const r of remote) byId.set(r.id, r);
  for (const l of local) {
    const rm = byId.get(l.id);
    if (!rm || time(l) > time(rm)) byId.set(l.id, l);
  }
  return sortByCreatedDesc([...byId.values()]);
}

export function idsToPush(local: Reading[], remote: Reading[], pending: string[]): string[] {
  const rmap = new Map(remote.map((r) => [r.id, r]));
  return local
    .filter((l) => {
      const rm = rmap.get(l.id);
      return pending.includes(l.id) || !rm || time(l) > time(rm);
    })
    .map((l) => l.id);
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/data`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/data && git commit -m "feat: row mapping and last-write-wins merge"
```

---

### Task 7: Supabase 表与同步层

**Files:**
- Create: `supabase/readings.sql`, `src/data/supabase.ts`, `src/data/local.ts`, `src/data/remote.ts`, `src/data/useReadings.ts`

**Interfaces:**
- Consumes: `toRow/fromRow` (Task 6), `mergeReadings/idsToPush/sortByCreatedDesc` (Task 6), `Reading` (Task 3)
- Produces:
  - `supabase`（client 实例）
  - `useReadings(userId: string): { readings: Reading[]; loaded: boolean; synced: boolean; saveReading: (r: Reading) => void }`

- [ ] **Step 1: 建表 SQL** `supabase/readings.sql`

```sql
create table if not exists public.readings (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  client_name text not null default '',
  question text not null default '',
  spread_preset text not null,
  positions text[] not null,
  cards jsonb not null,
  interpretation text not null default '',
  export_theme text check (export_theme in ('day', 'night'))
);

create index if not exists readings_user_created_idx on public.readings (user_id, created_at desc);

alter table public.readings enable row level security;

drop policy if exists readings_select_own on public.readings;
create policy readings_select_own on public.readings for select using (user_id = auth.uid());

drop policy if exists readings_insert_own on public.readings;
create policy readings_insert_own on public.readings for insert with check (user_id = auth.uid());

drop policy if exists readings_update_own on public.readings;
create policy readings_update_own on public.readings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
```

- [ ] **Step 2: 停下来，请小艾建表**

在对话里说明：需要在 Supabase 项目 `qsqcmsznxhuwjrjnihob` 的 SQL Editor 跑 `supabase/readings.sql`。给两个选项：她自己粘贴运行；或同意后由我用 Claude in Chrome 在她已登录的控制台里跑（按 memory `supabase-sql-editor-automation` 的做法：用 `monaco.editor.getModels()[0].setValue(sql)` 写入、JS 复核内容、⌘Enter 运行、跑完清空编辑器）。等她确认表建好再继续后续需要真实数据的验证；代码步骤可以先做。

- [ ] **Step 3: supabase client** `src/data/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js';

// anon key 是设计上公开的值，权限由 readings 表的 RLS 决定。
export const SUPABASE_URL = 'https://qsqcmsznxhuwjrjnihob.supabase.co';
export const SUPABASE_ANON_KEY = '<从 ~/Downloads/网站/river-of-feelings/js/config.js 原样复制>';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'xiaoai-tarot-auth' },
});
```

实现者必须把 `<…>` 替换成真实 key（`grep -A1 SUPABASE_ANON_KEY ~/Downloads/网站/river-of-feelings/js/config.js`），提交前 `grep -n '<从' src/data/supabase.ts` 应无输出。

- [ ] **Step 4: 本地存储** `src/data/local.ts`

```ts
import { createStore, del, get, set } from 'idb-keyval';
import type { Reading } from '../reading/types';

const store = createStore('xiaoai-tarot', 'kv');
const K = { readings: 'readings', pending: 'pending', user: 'user' };

export async function loadLocal(): Promise<{ readings: Reading[]; pending: string[] }> {
  const [readings, pending] = await Promise.all([
    get<Record<string, Reading>>(K.readings, store),
    get<string[]>(K.pending, store),
  ]);
  return { readings: Object.values(readings ?? {}), pending: pending ?? [] };
}

let chain: Promise<void> = Promise.resolve();

export function writeLocal(readings: Reading[], pending: string[]): Promise<void> {
  chain = chain
    .then(async () => {
      await set(K.readings, Object.fromEntries(readings.map((r) => [r.id, r])), store);
      await set(K.pending, pending, store);
    })
    .catch((e) => console.error('writeLocal failed', e));
  return chain;
}

// 换了账号就清掉本地数据，同一账号重新登录保留（含未同步的）。
export async function claimLocalFor(userId: string): Promise<void> {
  const current = await get<string>(K.user, store);
  if (current && current !== userId) {
    await del(K.readings, store);
    await del(K.pending, store);
  }
  await set(K.user, userId, store);
}
```

- [ ] **Step 5: 远端** `src/data/remote.ts`

```ts
import type { Reading } from '../reading/types';
import { fromRow, toRow, type ReadingRow } from './rows';
import { supabase } from './supabase';

export async function fetchRemote(): Promise<Reading[]> {
  const { data, error } = await supabase.from('readings').select('id,created_at,updated_at,client_name,question,spread_preset,positions,cards,interpretation,export_theme');
  if (error) throw error;
  return (data as ReadingRow[]).map(fromRow);
}

export async function pushRemote(list: Reading[]): Promise<void> {
  if (!list.length) return;
  const { error } = await supabase.from('readings').upsert(list.map(toRow));
  if (error) throw error;
}
```

- [ ] **Step 6: 同步 hook** `src/data/useReadings.ts`

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Reading } from '../reading/types';
import { claimLocalFor, loadLocal, writeLocal } from './local';
import { idsToPush, mergeReadings, sortByCreatedDesc } from './merge';
import { fetchRemote, pushRemote } from './remote';

export function useReadings(userId: string) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const state = useRef<{ readings: Reading[]; pending: string[] }>({ readings: [], pending: [] });
  const pushing = useRef(false);

  const commit = useCallback((next: Reading[], nextPending: string[]) => {
    state.current = { readings: next, pending: nextPending };
    setReadings(next);
    setPending(nextPending);
    void writeLocal(next, nextPending);
  }, []);

  const push = useCallback(async () => {
    if (pushing.current || !state.current.pending.length) return;
    pushing.current = true;
    const { readings: list, pending: ids } = state.current;
    const batch = list.filter((r) => ids.includes(r.id));
    let again = false;
    try {
      await pushRemote(batch);
      const pushedAt = new Map(batch.map((r) => [r.id, r.updatedAt]));
      const cur = state.current;
      const left = cur.pending.filter((id) => {
        const r = cur.readings.find((x) => x.id === id);
        return r !== undefined && pushedAt.get(id) !== r.updatedAt;
      });
      commit(cur.readings, left);
      again = left.length > 0;
    } catch (e) {
      console.warn('push failed, will retry', e);
    } finally {
      pushing.current = false;
    }
    if (again) void push();
  }, [commit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await claimLocalFor(userId);
      const local = await loadLocal();
      if (cancelled) return;
      commit(sortByCreatedDesc(local.readings), local.pending);
      setLoaded(true);
      try {
        const remote = await fetchRemote();
        if (cancelled) return;
        const cur = state.current;
        commit(mergeReadings(cur.readings, remote), idsToPush(cur.readings, remote, cur.pending));
        await push();
      } catch (e) {
        console.warn('fetch failed, staying local', e);
      }
    })();
    const onOnline = () => void push();
    window.addEventListener('online', onOnline);
    const timer = window.setInterval(() => void push(), 30_000);
    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      window.clearInterval(timer);
    };
  }, [userId, commit, push]);

  const saveReading = useCallback(
    (r: Reading) => {
      const stamped: Reading = { ...r, updatedAt: new Date().toISOString() };
      const cur = state.current;
      const exists = cur.readings.some((x) => x.id === r.id);
      const next = exists ? cur.readings.map((x) => (x.id === r.id ? stamped : x)) : sortByCreatedDesc([stamped, ...cur.readings]);
      const nextPending = cur.pending.includes(r.id) ? cur.pending : [...cur.pending, r.id];
      commit(next, nextPending);
      void push();
    },
    [commit, push],
  );

  return { readings, loaded, synced: pending.length === 0, saveReading };
}
```

- [ ] **Step 7: 类型检查**

Run: `npx tsc --noEmit && npm test`
Expected: 无类型错误，已有测试全过。

- [ ] **Step 8: Commit**

```bash
git add supabase src/data && git commit -m "feat: supabase table, local-first sync hook"
```

---

### Task 8: 登录门、路由、通用小工具

**Files:**
- Create: `src/pages/Login.tsx`, `src/lib/useHashRoute.ts`, `src/lib/useSystemTheme.ts`, `src/lib/clipboard.ts`, `src/components/TextModal.tsx`
- Modify: `src/App.tsx`（整体替换）

**Interfaces:**
- Consumes: `supabase` (Task 7), `useReadings` (Task 7), `newReading` (Task 3)
- Produces:
  - `useHashRoute(): [hash: string, go: (hash: string) => void]`
  - `useSystemTheme(): Theme`
  - `copyText(text: string): Promise<boolean>`
  - `<TextModal title text onClose />`
  - App 路由：`#/` 列表；`#/r/<uuid>` 测算页。Task 9/10 的页面组件签名：
    - `ListPage({ readings, onOpen: (id: string) => void, onNew: () => void, onSignOut: () => void })`
    - `ReadingPage({ initial: Reading, onSave: (r: Reading) => void, onBack: () => void })`

- [ ] **Step 1: 小工具**

`src/lib/useHashRoute.ts`:
```ts
import { useCallback, useEffect, useState } from 'react';

export function useHashRoute(): [string, (hash: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const go = useCallback((next: string) => {
    window.location.hash = next;
  }, []);
  return [hash, go];
}
```

`src/lib/useSystemTheme.ts`:
```ts
import { useEffect, useState } from 'react';
import type { Theme } from '../reading/types';

const query = '(prefers-color-scheme: dark)';

export function useSystemTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => (window.matchMedia(query).matches ? 'night' : 'day'));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setTheme(mq.matches ? 'night' : 'day');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return theme;
}
```

`src/lib/clipboard.ts`:
```ts
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
```

`src/components/TextModal.tsx`:
```tsx
export function TextModal({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ padding: 16 }} onClick={(e) => e.stopPropagation()}>
        <p className="hint">{title}</p>
        <textarea readOnly rows={16} value={text} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="text-btn" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 登录页** `src/pages/Login.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { supabase } from '../data/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError(/invalid login/i.test(err.message) ? '邮箱或密码不对' : `登录失败：${err.message}`);
  };

  return (
    <div className="page">
      <h1>小艾塔罗</h1>
      <p className="hint">使用「河」和「小熊红黑榜」的账号登录</p>
      <form onSubmit={submit}>
        <label className="field">
          <span>邮箱</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>密码</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={busy}>{busy ? '登录中…' : '登录'}</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: App** `src/App.tsx`（列表页和测算页先用最小占位组件，Task 9/10 创建真实文件时替换 import）

```tsx
import type { Session } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { supabase } from './data/supabase';
import { useReadings } from './data/useReadings';
import { useHashRoute } from './lib/useHashRoute';
import { ListPage } from './pages/ListPage';
import { Login } from './pages/Login';
import { ReadingPage } from './pages/ReadingPage';
import { newReading, type Reading } from './reading/types';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) return <Login />;
  return <Shell userId={session.user.id} />;
}

function Shell({ userId }: { userId: string }) {
  const { readings, loaded, synced, saveReading } = useReadings(userId);
  const [hash, go] = useHashRoute();
  const drafts = useRef(new Map<string, Reading>());

  const match = hash.match(/^#\/r\/([0-9a-f-]+)$/);
  let page = null;
  if (match) {
    const r = readings.find((x) => x.id === match[1]) ?? drafts.current.get(match[1]);
    if (r) {
      page = <ReadingPage key={r.id} initial={r} onSave={saveReading} onBack={() => go('#/')} />;
    } else if (loaded) {
      page = (
        <div className="page">
          <p className="empty">找不到这条记录</p>
          <button type="button" className="text-btn" onClick={() => go('#/')}>返回列表</button>
        </div>
      );
    }
  } else {
    page = (
      <ListPage
        readings={readings}
        onOpen={(id) => go(`#/r/${id}`)}
        onNew={() => {
          const r = newReading();
          drafts.current.set(r.id, r);
          go(`#/r/${r.id}`);
        }}
        onSignOut={() => void supabase.auth.signOut()}
      />
    );
  }

  return (
    <>
      {!synced && <div className="sync-badge">未同步</div>}
      {page}
    </>
  );
}
```

为了让本任务可以独立编译，先建占位：

`src/pages/ListPage.tsx`:
```tsx
import type { Reading } from '../reading/types';

export function ListPage(props: { readings: Reading[]; onOpen: (id: string) => void; onNew: () => void; onSignOut: () => void }) {
  return (
    <div className="page">
      <h1>小艾塔罗</h1>
      <p className="hint">{props.readings.length} 条记录</p>
      <button type="button" className="primary" onClick={props.onNew}>新建</button>
    </div>
  );
}
```

`src/pages/ReadingPage.tsx`:
```tsx
import type { Reading } from '../reading/types';

export function ReadingPage(props: { initial: Reading; onSave: (r: Reading) => void; onBack: () => void }) {
  return (
    <div className="page">
      <button type="button" className="text-btn" onClick={props.onBack}>‹ 记录</button>
      <p className="hint">{props.initial.id}</p>
    </div>
  );
}
```

- [ ] **Step 4: 类型检查与浏览器验证**

Run: `npx tsc --noEmit && npm test`
Expected: PASS。

用 Browser pane `preview_start {name: "tarot-app"}`，导航到 `http://localhost:5174/tarot-app/`。Expected：显示登录页，控制台无报错。登录需要她的密码——停下来请小艾在 Browser pane 里自己登录一次（会话会保存在该浏览器里），登录后应看到占位列表页「0 条记录」。

- [ ] **Step 5: Commit**

```bash
git add src && git commit -m "feat: login gate, hash routing, clipboard helpers"
```

---

### Task 9: 列表页

**Files:**
- Modify: `src/pages/ListPage.tsx`（整体替换占位）
- Create: `src/pages/list.css`

**Interfaces:**
- Consumes: `searchReadings`, `formatDate` (Task 5), `isComplete` (Task 3), `cardImageUrl` (Task 2)
- Produces: `ListPage` 签名同 Task 8。

- [ ] **Step 1: 实现** `src/pages/ListPage.tsx`

```tsx
import { useState } from 'react';
import { cardImageUrl } from '../cards/deck';
import { formatDate, searchReadings } from '../reading/search';
import { isComplete, type Reading } from '../reading/types';
import './list.css';

export function ListPage({ readings, onOpen, onNew, onSignOut }: { readings: Reading[]; onOpen: (id: string) => void; onNew: () => void; onSignOut: () => void }) {
  const [query, setQuery] = useState('');
  const shown = searchReadings(readings, query);

  return (
    <div className="page">
      <header className="list-header">
        <h1>小艾塔罗</h1>
        <button type="button" className="text-btn" onClick={onSignOut}>退出</button>
      </header>
      <input type="search" placeholder="搜称呼或问题" value={query} onChange={(e) => setQuery(e.target.value)} />

      {shown.length === 0 && <p className="empty">{readings.length ? '没有匹配的记录' : '还没有测算记录'}</p>}

      <ul className="reading-list">
        {shown.map((r) => (
          <li key={r.id}>
            <button type="button" className="reading-item" onClick={() => onOpen(r.id)}>
              <div className="thumbs">
                {r.cards.map((c, i) =>
                  c ? <img key={i} src={cardImageUrl(c.id)} className={c.reversed ? 'reversed' : ''} alt="" /> : <span key={i} className="thumb-empty" />,
                )}
              </div>
              <div className="item-text">
                <div className="item-top">
                  <span className="item-name">{r.clientName || '未填称呼'}</span>
                  <span className="item-date">{formatDate(r.createdAt)}</span>
                </div>
                <div className="item-q">{r.question || '未填问题'}</div>
                {!isComplete(r) && <span className="badge">未完成</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="fab" onClick={onNew} aria-label="新建测算">＋</button>
    </div>
  );
}
```

- [ ] **Step 2: 样式** `src/pages/list.css`

```css
.list-header { display: flex; align-items: center; justify-content: space-between; }
.reading-list { list-style: none; margin: 12px 0 0; padding: 0; }
.reading-item { width: 100%; display: flex; gap: 12px; align-items: center; text-align: left; background: none; border: 0; border-bottom: 1px solid var(--line); padding: 12px 0; cursor: pointer; }
.thumbs { display: flex; gap: 3px; flex: none; }
.thumbs img, .thumb-empty { width: 26px; height: 45px; border-radius: 2px; object-fit: cover; display: block; }
.thumb-empty { border: 1px dashed var(--line); }
img.reversed { transform: rotate(180deg); }
.item-text { min-width: 0; flex: 1; }
.item-top { display: flex; justify-content: space-between; gap: 8px; }
.item-name { font-weight: 600; }
.item-date { font-size: 12px; color: var(--muted); flex: none; }
.item-q { font-size: 14px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.badge { display: inline-block; margin-top: 4px; font-size: 11px; color: var(--accent); border: 1px solid var(--gold); border-radius: 3px; padding: 0 5px; }
.fab { position: fixed; right: 20px; bottom: calc(24px + env(safe-area-inset-bottom)); width: 56px; height: 56px; border-radius: 50%; border: 0; background: var(--accent); color: var(--bg); font-size: 28px; line-height: 1; box-shadow: 0 4px 14px rgba(0,0,0,.2); cursor: pointer; }
```

- [ ] **Step 3: 验证**

Run: `npx tsc --noEmit`
Expected: 无错误。Browser pane 刷新，已登录状态下看到标题、搜索框、「还没有测算记录」、右下角 ＋ 按钮；点 ＋ 进入占位测算页。

- [ ] **Step 4: Commit**

```bash
git add src/pages && git commit -m "feat: reading list page with search"
```

---

### Task 10: 测算页（问题、牌面、选牌、解读）

**Files:**
- Modify: `src/pages/ReadingPage.tsx`（整体替换占位）
- Create: `src/pages/reading.css`, `src/pages/reading/QuestionSection.tsx`, `src/pages/reading/CardSlots.tsx`, `src/pages/reading/CardPicker.tsx`, `src/pages/reading/InterpretationSection.tsx`

**Interfaces:**
- Consumes: `Reading`, `PRESETS`, `isBlank`, `isReadyForPrompt` (Task 3), `DECK`, `getCard`, `searchCards`, `cardImageUrl`, `GROUP_LABELS` (Task 2), `buildPrompt` (Task 3), `copyText`, `TextModal` (Task 8)
- Produces: 每个 section 组件签名 `({ reading: Reading; onChange: (patch: Partial<Reading>) => void })`；`ReadingPage` 里渲染 `<ExportSection reading onChange />`（Task 11 创建，本任务先不渲染）。

- [ ] **Step 1: ReadingPage** `src/pages/ReadingPage.tsx`

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { isBlank, type Reading } from '../reading/types';
import { CardSlots } from './reading/CardSlots';
import { InterpretationSection } from './reading/InterpretationSection';
import { QuestionSection } from './reading/QuestionSection';
import './reading.css';

export function ReadingPage({ initial, onSave, onBack }: { initial: Reading; onSave: (r: Reading) => void; onBack: () => void }) {
  const [reading, setReading] = useState(initial);
  const latest = useRef(reading);
  latest.current = reading;
  const dirty = useRef(false);

  const onChange = useCallback((patch: Partial<Reading>) => {
    dirty.current = true;
    setReading((prev) => ({ ...prev, ...patch }));
  }, []);

  const flush = useCallback(() => {
    if (!dirty.current || isBlank(latest.current)) return;
    dirty.current = false;
    onSave(latest.current);
  }, [onSave]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = window.setTimeout(flush, 1000);
    return () => window.clearTimeout(t);
  }, [reading, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  return (
    <div className="page">
      <button type="button" className="text-btn back" onClick={onBack}>‹ 记录</button>
      <QuestionSection reading={reading} onChange={onChange} />
      <CardSlots reading={reading} onChange={onChange} />
      <InterpretationSection reading={reading} onChange={onChange} />
    </div>
  );
}
```

- [ ] **Step 2: QuestionSection**

```tsx
import { PRESETS, type Positions, type Reading, type SpreadPreset } from '../../reading/types';

const OPTIONS: { value: SpreadPreset; label: string }[] = [
  { value: 'past_present_future', label: '过去 / 现在 / 未来' },
  { value: 'situation_obstacle_advice', label: '现状 / 阻碍 / 建议' },
  { value: 'you_them_outcome', label: '你 / 对方 / 关系走向' },
  { value: 'custom', label: '自定义' },
];

export function QuestionSection({ reading: r, onChange }: { reading: Reading; onChange: (patch: Partial<Reading>) => void }) {
  const pick = (value: SpreadPreset) =>
    onChange(value === 'custom' ? { spreadPreset: 'custom' } : { spreadPreset: value, positions: [...PRESETS[value]] });

  const setPosition = (i: number, text: string) => {
    const positions = [...r.positions] as Positions;
    positions[i] = text;
    onChange({ positions });
  };

  return (
    <section className="section">
      <h2>问题</h2>
      <label className="field">
        <span>客人称呼</span>
        <input value={r.clientName} onChange={(e) => onChange({ clientName: e.target.value })} />
      </label>
      <label className="field">
        <span>问题</span>
        <textarea rows={3} value={r.question} onChange={(e) => onChange({ question: e.target.value })} />
      </label>
      <div className="field">
        <span>牌阵位置</span>
        <div className="chips">
          {OPTIONS.map((o) => (
            <button type="button" key={o.value} className={`chip${r.spreadPreset === o.value ? ' on' : ''}`} onClick={() => pick(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        {r.spreadPreset === 'custom' && (
          <div className="custom-positions">
            {[0, 1, 2].map((i) => (
              <input key={i} placeholder={`位置${i + 1}`} value={r.positions[i]} onChange={(e) => setPosition(i, e.target.value)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: CardPicker**

```tsx
import { useState } from 'react';
import { cardImageUrl, DECK, GROUP_LABELS, searchCards, type CardGroup } from '../../cards/deck';

export function CardPicker({ exclude, onPick, onClose }: { exclude: string[]; onPick: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const results = query.trim() ? searchCards(query) : DECK;
  const groups = (Object.keys(GROUP_LABELS) as CardGroup[])
    .map((g) => ({ g, cards: results.filter((c) => c.group === g) }))
    .filter((x) => x.cards.length);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <input type="search" placeholder="搜牌名，如 塔、宝剑三" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="button" className="text-btn" onClick={onClose}>取消</button>
        </div>
        <div className="picker-body">
          {groups.map(({ g, cards }) => (
            <div key={g}>
              <h3>{GROUP_LABELS[g]}</h3>
              <div className="picker-grid">
                {cards.map((c) => (
                  <button type="button" key={c.id} disabled={exclude.includes(c.id)} onClick={() => onPick(c.id)}>
                    <img src={cardImageUrl(c.id)} alt="" loading="lazy" />
                    <span>{c.nameZh}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="empty">没有找到这张牌</p>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: CardSlots**

```tsx
import { useState } from 'react';
import { cardImageUrl, getCard } from '../../cards/deck';
import type { CardPick, CardSlotsValue, Reading } from '../../reading/types';
import { CardPicker } from './CardPicker';

export function CardSlots({ reading: r, onChange }: { reading: Reading; onChange: (patch: Partial<Reading>) => void }) {
  const [picking, setPicking] = useState<number | null>(null);

  const setCard = (i: number, pick: CardPick | null) => {
    const cards = [...r.cards] as CardSlotsValue;
    cards[i] = pick;
    onChange({ cards });
  };

  return (
    <section className="section">
      <h2>牌面</h2>
      <div className="slots">
        {[0, 1, 2].map((i) => {
          const c = r.cards[i];
          return (
            <div className="slot" key={i}>
              <div className="slot-pos">{r.positions[i] || `位置${i + 1}`}</div>
              <button type="button" className="slot-card" onClick={() => setPicking(i)}>
                {c ? <img src={cardImageUrl(c.id)} className={c.reversed ? 'reversed' : ''} alt={getCard(c.id).nameZh} /> : <span className="slot-empty">选牌</span>}
              </button>
              {c && (
                <>
                  <div className="slot-name">{getCard(c.id).nameZh}</div>
                  <div className="chips orient">
                    <button type="button" className={`chip${!c.reversed ? ' on' : ''}`} onClick={() => setCard(i, { ...c, reversed: false })}>正位</button>
                    <button type="button" className={`chip${c.reversed ? ' on' : ''}`} onClick={() => setCard(i, { ...c, reversed: true })}>逆位</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {picking !== null && (
        <CardPicker
          exclude={r.cards.flatMap((c, idx) => (c && idx !== picking ? [c.id] : []))}
          onPick={(id) => {
            setCard(picking, { id, reversed: r.cards[picking]?.reversed ?? false });
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 5: InterpretationSection**

```tsx
import { useState } from 'react';
import { TextModal } from '../../components/TextModal';
import { copyText } from '../../lib/clipboard';
import { buildPrompt } from '../../prompt/template';
import { isReadyForPrompt, type Reading } from '../../reading/types';

export function InterpretationSection({ reading: r, onChange }: { reading: Reading; onChange: (patch: Partial<Reading>) => void }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const ready = isReadyForPrompt(r);

  const copy = async () => {
    const text = buildPrompt(r);
    if (await copyText(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setFallback(text);
    }
  };

  return (
    <section className="section">
      <h2>解读</h2>
      <button type="button" className="primary" disabled={!ready} onClick={copy}>{copied ? '已复制' : '复制提示词'}</button>
      {!ready && <p className="hint">填好问题、三个位置和三张牌后可复制</p>}
      <textarea className="interp" rows={14} placeholder="粘贴 Claude 生成的解读，可直接修改" value={r.interpretation} onChange={(e) => onChange({ interpretation: e.target.value })} />
      {fallback !== null && <TextModal title="复制失败，请手动全选复制" text={fallback} onClose={() => setFallback(null)} />}
    </section>
  );
}
```

- [ ] **Step 6: 样式** `src/pages/reading.css`

```css
.back { margin-left: -8px; }
.custom-positions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.slot { text-align: center; }
.slot-pos { font-size: 13px; color: var(--muted); margin-bottom: 6px; }
.slot-card { width: 100%; aspect-ratio: 360 / 622; border: 1px solid var(--line); background: var(--surface); border-radius: 4px; padding: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.slot-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
.slot-empty { font-size: 13px; color: var(--muted); }
.slot-name { font-size: 14px; margin: 6px 0 4px; }
.orient { justify-content: center; gap: 4px; }
.orient .chip { padding: 3px 8px; font-size: 12px; }
img.reversed { transform: rotate(180deg); }
.interp { margin-top: 12px; }
.picker { height: 92vh; }
.picker-head { display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid var(--line); }
.picker-body { overflow-y: auto; padding: 0 12px 24px; }
.picker-body h3 { font-size: 13px; color: var(--muted); font-weight: 500; margin: 16px 0 8px; }
.picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; }
.picker-grid button { background: none; border: 0; padding: 0; cursor: pointer; font-size: 12px; }
.picker-grid button:disabled { opacity: .3; cursor: default; }
.picker-grid img { width: 100%; aspect-ratio: 360 / 622; object-fit: cover; border-radius: 3px; display: block; margin-bottom: 3px; }
```

- [ ] **Step 7: 浏览器验证**

Run: `npx tsc --noEmit && npm test`，然后 Browser pane 里：
1. 点 ＋，填称呼「测试」、问题，切换预设和自定义，确认位置名跟着变。
2. 三个牌位分别选牌（搜「宝剑3」「塔」），已选的牌在别的牌位的选牌面板里是灰的；切逆位，图倒转。
3. 「复制提示词」变为可点，点后显示「已复制」；`javascript_tool` 读 `navigator.clipboard.readText()` 或检查按钮文案。
4. 粘贴一段解读，等 1 秒以上，点「‹ 记录」，列表出现该条，有三张缩略图；清空解读后显示「未完成」。
5. `read_console_messages` 无报错；若表已建，`read_network_requests` 过滤 `readings` 看到 upsert 200/201。
6. `resize_window` mobile 预设检查布局，结束后 `preset: desktop`。

- [ ] **Step 8: Commit**

```bash
git add src/pages && git commit -m "feat: reading page with question, card slots, picker and prompt copy"
```

---

### Task 11: 导出（长图 + 微信文字）

**Files:**
- Create: `src/export/font.ts`, `src/export/font.test.ts`, `src/export/render.ts`, `src/export/LongImage.tsx`, `src/export/longImage.css`, `src/export/ExportModal.tsx`, `src/pages/reading/ExportSection.tsx`
- Modify: `src/pages/ReadingPage.tsx`（加 `<ExportSection />`）

**Interfaces:**
- Consumes: `parseInterpretation` (Task 4), `toWechatText`, `SIGNATURE` (Task 5), `formatDate` (Task 5), `ORDINALS`, `cardDisplayName` (Task 3), `cardImageUrl` (Task 2), `useSystemTheme`, `copyText`, `TextModal` (Task 8)
- Produces:
  - `fontSubsetChars(text: string): string`, `fontCssUrl(chars: string): string`, `buildFontEmbedCss(text: string): Promise<string>`
  - `renderLongImage(node: HTMLElement): Promise<Blob>`
  - `<LongImage reading parsed theme />`, `<ExportModal reading parsed theme onClose />`, `<ExportSection reading onChange />`

- [ ] **Step 1: 写失败测试** `src/export/font.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { fontCssUrl, fontSubsetChars } from './font';

describe('font subset', () => {
  it('dedupes characters, drops whitespace and always includes basics', () => {
    const chars = fontSubsetChars('塔 塔\n罗');
    expect(chars.startsWith('塔罗')).toBe(true);
    expect(chars.match(/塔/g)).toHaveLength(1);
    expect(chars).not.toMatch(/\s/);
    expect(chars).toContain('·');
    expect(chars).toContain('R');
  });

  it('builds a Google Fonts css2 url with both weights', () => {
    const url = fontCssUrl('塔罗');
    expect(url).toBe('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&text=%E5%A1%94%E7%BD%97');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/export`
Expected: FAIL。

- [ ] **Step 3: 实现 font.ts**

```ts
const BASICS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.·|｜/：:，。、—「」（）';

export function fontSubsetChars(text: string): string {
  return [...new Set([...text.replace(/\s/g, ''), ...BASICS])].join('');
}

export function fontCssUrl(chars: string): string {
  return `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&text=${encodeURIComponent(chars)}`;
}

async function fetchOk(url: string): Promise<Response> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// 只取长图里实际出现的字，Google Fonts 返回一个很小的子集字体；断网时调用方退回系统字体。
export async function buildFontEmbedCss(text: string): Promise<string> {
  let css = await (await fetchOk(fontCssUrl(fontSubsetChars(text)))).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  for (const url of urls) {
    const dataUrl = await blobToDataUrl(await (await fetchOk(url)).blob());
    css = css.split(url).join(dataUrl);
  }
  return css;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/export`
Expected: PASS。

- [ ] **Step 5: render.ts**

```ts
import { toBlob } from 'html-to-image';
import { buildFontEmbedCss } from './font';

export async function renderLongImage(node: HTMLElement): Promise<Blob> {
  let fontEmbedCSS = '';
  try {
    fontEmbedCSS = await buildFontEmbedCss(node.textContent ?? '');
  } catch (e) {
    console.warn('font subset unavailable, using system font', e);
  }
  const blob = await toBlob(node, {
    pixelRatio: 1,
    cacheBust: false,
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  });
  if (!blob) throw new Error('toBlob returned null');
  return blob;
}
```

- [ ] **Step 6: LongImage**

`src/export/LongImage.tsx`:
```tsx
import { cardImageUrl } from '../cards/deck';
import { cardDisplayName, ORDINALS } from '../reading/labels';
import type { ParsedInterpretation } from '../reading/parse';
import { formatDate } from '../reading/search';
import type { Reading, Theme } from '../reading/types';
import { SIGNATURE } from '../reading/wechat';
import './longImage.css';

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n+/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

export function LongImage({ reading: r, parsed, theme }: { reading: Reading; parsed: ParsedInterpretation; theme: Theme }) {
  return (
    <div className={`li li-${theme}`}>
      <header className="li-top">
        <div className="li-kicker">TAROT READING</div>
        <div className="li-q">{r.question.trim()}</div>
        <div className="li-meta">{[r.clientName.trim() || '客人', formatDate(r.createdAt), r.positions.join(' / ')].join(' · ')}</div>
        <div className="li-orn">✦ ✦ ✦</div>
      </header>

      <div className="li-cards">
        {([0, 1, 2] as const).map((i) => {
          const c = r.cards[i];
          return (
            <figure key={i}>
              {c && <img src={cardImageUrl(c.id)} className={c.reversed ? 'reversed' : ''} alt="" />}
              <figcaption>
                <div>{r.positions[i]}</div>
                <div>{cardDisplayName(c)}</div>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {parsed.kind === 'sections' ? (
        <>
          {([0, 1, 2] as const).map((i) => (
            <section className="li-sec" key={i}>
              <h4>
                {ORDINALS[i]} · {r.positions[i]} <span>{cardDisplayName(r.cards[i])}</span>
              </h4>
              <Paragraphs text={parsed.cards[i]} />
            </section>
          ))}
          <section className="li-sec">
            <h4>整体解读</h4>
            <Paragraphs text={parsed.overall} />
          </section>
          <section className="li-sec">
            <h4>建议</h4>
            <Paragraphs text={parsed.advice} />
          </section>
        </>
      ) : (
        <section className="li-sec">
          <Paragraphs text={parsed.text} />
        </section>
      )}

      <footer className="li-sign">— {SIGNATURE} —</footer>
    </div>
  );
}
```

`src/export/longImage.css`（小样 300px 宽的尺寸 ×3.6）:
```css
.li { width: 1080px; padding: 96px 80px 80px; font-family: "Noto Serif SC", "Songti SC", "STSong", serif; }
.li p { margin: 0 0 18px; font-size: 40px; line-height: 1.8; }
.li-top { text-align: center; padding-bottom: 48px; margin-bottom: 56px; }
.li-kicker { font-size: 34px; letter-spacing: .3em; }
.li-q { font-size: 56px; line-height: 1.5; margin: 28px 0 14px; }
.li-meta { font-size: 34px; }
.li-orn { display: none; font-size: 32px; letter-spacing: .5em; margin-top: 32px; }
.li-cards { display: flex; justify-content: center; gap: 36px; margin-bottom: 24px; }
.li-cards figure { margin: 0; text-align: center; width: 270px; }
.li-cards img { width: 270px; height: 467px; object-fit: cover; display: block; box-sizing: border-box; }
.li-cards img.reversed { transform: rotate(180deg); }
.li-cards figcaption { font-size: 32px; line-height: 1.5; margin-top: 16px; }
.li-sec { margin-top: 64px; }
.li-sec h4 { margin: 0 0 22px; font-size: 44px; font-weight: 600; }
.li-sec h4 span { font-weight: 400; font-size: 36px; margin-left: 12px; }
.li-sign { text-align: center; font-size: 36px; margin-top: 88px; letter-spacing: .2em; }

.li-day { background: #f4efe6; color: #2b2620; }
.li-day .li-top { border-bottom: 3px solid #b89a5e; }
.li-day .li-kicker, .li-day .li-cards figcaption, .li-day .li-sec h4 span { color: #8a7350; }
.li-day .li-meta { color: #7a6f60; }
.li-day .li-cards img { border: 3px solid #cdbb96; padding: 10px; background: #fff; }
.li-day .li-sec h4 { color: #6d5530; }
.li-day .li-sign { color: #6d5530; }

.li-night { background: #141a2b; color: #d6d1c4; }
.li-night .li-kicker, .li-night .li-orn, .li-night .li-cards figcaption, .li-night .li-sec h4, .li-night .li-sign { color: #c9a95c; }
.li-night .li-orn { display: block; }
.li-night .li-q { color: #f3ecd9; }
.li-night .li-meta { color: #8e96ad; }
.li-night .li-cards img { border: 3px solid #c9a95c; border-radius: 12px; }
.li-night .li-sec { border-top: 3px solid #2e3650; padding-top: 44px; }
.li-night .li-sec h4 span { color: #c9a95c; }
```

- [ ] **Step 7: ExportModal**

```tsx
import { useEffect, useRef, useState } from 'react';
import type { ParsedInterpretation } from '../reading/parse';
import { formatDate } from '../reading/search';
import type { Reading, Theme } from '../reading/types';
import { LongImage } from './LongImage';
import { renderLongImage } from './render';

type State = { status: 'working' } | { status: 'done'; blob: Blob; url: string } | { status: 'error' };

export function ExportModal({ reading, parsed, theme, onClose }: { reading: Reading; parsed: ParsedInterpretation; theme: Theme; onClose: () => void }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ status: 'working' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    setState({ status: 'working' });
    (async () => {
      try {
        const blob = await renderLongImage(nodeRef.current!);
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ status: 'done', blob, url });
      } catch (e) {
        console.error('long image failed', e);
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [attempt, theme]);

  const fileName = `塔罗-${reading.clientName.trim() || '客人'}-${formatDate(reading.createdAt)}.png`;

  const save = () => {
    if (state.status !== 'done') return;
    const file = new File([state.blob], fileName, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file] }).catch(() => undefined);
      return;
    }
    const a = document.createElement('a');
    a.href = state.url;
    a.download = fileName;
    a.click();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal export" onClick={(e) => e.stopPropagation()}>
        <div className="export-head">
          <button type="button" className="text-btn" onClick={onClose}>关闭</button>
          <button type="button" className="primary" disabled={state.status !== 'done'} onClick={save}>保存 / 分享</button>
        </div>
        <div className="export-body">
          {state.status === 'working' && <p className="hint">正在生成…</p>}
          {state.status === 'error' && (
            <p className="hint">
              生成失败 <button type="button" className="text-btn" onClick={() => setAttempt((a) => a + 1)}>重试</button>
            </p>
          )}
          {state.status === 'done' && (
            <>
              <p className="hint">手机上也可以长按图片保存</p>
              <img className="export-preview" src={state.url} alt="长图预览" />
            </>
          )}
        </div>
        <div className="offscreen">
          <div ref={nodeRef}>
            <LongImage reading={reading} parsed={parsed} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

注意：`renderLongImage` 传的是 `nodeRef.current`（包裹 div），截图会包含 `.li` 的背景；包裹 div 本身无样式，宽度由 `.li` 的 1080px 撑开。

- [ ] **Step 8: ExportSection**

```tsx
import { useMemo, useState } from 'react';
import { TextModal } from '../../components/TextModal';
import { ExportModal } from '../../export/ExportModal';
import { copyText } from '../../lib/clipboard';
import { useSystemTheme } from '../../lib/useSystemTheme';
import { parseInterpretation } from '../../reading/parse';
import { isComplete, isReadyForPrompt, type Reading } from '../../reading/types';
import { toWechatText } from '../../reading/wechat';

export function ExportSection({ reading: r, onChange }: { reading: Reading; onChange: (patch: Partial<Reading>) => void }) {
  const systemTheme = useSystemTheme();
  const theme = r.exportTheme ?? systemTheme;
  const parsed = useMemo(() => parseInterpretation(r.interpretation), [r.interpretation]);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const ready = isReadyForPrompt(r) && isComplete(r);

  const copyWechat = async () => {
    const text = toWechatText(r, parsed);
    if (await copyText(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setFallback(text);
    }
  };

  return (
    <section className="section">
      <h2>导出</h2>
      <div className="field">
        <span>长图主题</span>
        <div className="chips">
          <button type="button" className={`chip${theme === 'day' ? ' on' : ''}`} onClick={() => onChange({ exportTheme: 'day' })}>白天</button>
          <button type="button" className={`chip${theme === 'night' ? ' on' : ''}`} onClick={() => onChange({ exportTheme: 'night' })}>夜间</button>
        </div>
      </div>
      <div className="export-actions">
        <button type="button" className="primary" disabled={!ready} onClick={() => setPreview(true)}>生成长图</button>
        <button type="button" className="primary" disabled={!ready} onClick={copyWechat}>{copied ? '已复制' : '复制微信文字'}</button>
      </div>
      {!ready && <p className="hint">牌面填全、粘贴解读后可导出</p>}
      {parsed.kind === 'plain' && isComplete(r) && <p className="hint">解读没有识别出分段标题，将按整段排版</p>}
      {preview && <ExportModal reading={r} parsed={parsed} theme={theme} onClose={() => setPreview(false)} />}
      {fallback !== null && <TextModal title="复制失败，请手动全选复制" text={fallback} onClose={() => setFallback(null)} />}
    </section>
  );
}
```

追加到 `src/pages/reading.css`:
```css
.export-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.export-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--line); }
.export-body { overflow-y: auto; padding: 12px; }
.export-preview { width: 100%; display: block; border: 1px solid var(--line); }
```

在 `ReadingPage.tsx` 加 import `import { ExportSection } from './reading/ExportSection';`，并在 `<InterpretationSection …/>` 下一行渲染 `<ExportSection reading={reading} onChange={onChange} />`。

- [ ] **Step 9: 浏览器验证**

Run: `npx tsc --noEmit && npm test`。Browser pane 里用 Task 10 建的测试记录：
1. 粘贴一份标准格式解读（用 parse.test.ts 的 `standard` 扩写成几百字），点「生成长图」，预览出现；`javascript_tool` 检查 `document.querySelector('.export-preview').naturalWidth === 1080`。
2. 切「夜间」再生成，确认配色是深蓝底金字；截图对比两版，与头脑风暴小样一致。
3. `read_network_requests` 过滤 `fonts.g` 看到 css2 与字体文件请求成功；把网络断开（`javascript_tool` 无法断网时，临时把 `fontCssUrl` 指向不存在域名验证退回逻辑后还原）确认仍能生成。
4. 删掉解读里的【建议】标题，确认出现「将按整段排版」提示且长图仍能生成。
5. 「复制微信文字」后按钮显示「已复制」。
6. `read_console_messages onlyErrors` 为空。

- [ ] **Step 10: Commit**

```bash
git add src && git commit -m "feat: long image and wechat text export with day/night themes"
```

---

### Task 12: PWA、图标、部署

**Files:**
- Create: `scripts/make-icons.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `.github/workflows/deploy.yml`
- Modify: `vite.config.ts`, `src/main.tsx`

**Interfaces:**
- Consumes: 全部前序任务
- Produces: 线上 `https://cheng21122001.github.io/tarot-app/`

- [ ] **Step 1: 图标脚本** `scripts/make-icons.ts`

```ts
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#141a2b"/>
  <path d="M256 96 C272 200 312 240 416 256 C312 272 272 312 256 416 C240 312 200 272 96 256 C200 240 240 200 256 96 Z" fill="#c9a95c"/>
</svg>`;

await mkdir('public/icons', { recursive: true });
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
console.log('icons done');
```

Run: `npm run make-icons && ls public/icons`
Expected: `icon-192.png icon-512.png`。

- [ ] **Step 2: vite.config.ts 加 PWA**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/tarot-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '小艾塔罗',
        short_name: '小艾塔罗',
        start_url: '/tarot-app/',
        scope: '/tarot-app/',
        display: 'standalone',
        background_color: '#141a2b',
        theme_color: '#141a2b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
  test: { environment: 'node' },
});
```

- [ ] **Step 3: 注册 SW** — `src/main.tsx` 顶部 import 之后加：

```ts
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
```

- [ ] **Step 4: 构建验证**

Run: `npm test && npm run build && ls dist && grep -c webp dist/sw.js`
Expected: 构建成功，`dist/sw.js` 与 `dist/manifest.webmanifest` 存在，sw.js 预缓存列表包含 webp（计数 ≥ 1）。

- [ ] **Step 5: 部署 workflow** `.github/workflows/deploy.yml`

```yaml
name: deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

- [ ] **Step 6: Commit**

```bash
git add scripts/make-icons.ts public/icons vite.config.ts src/main.tsx .github && git commit -m "feat: PWA manifest, icons and Pages deploy workflow"
```

- [ ] **Step 7: 停下来，确认创建公开仓库**

在对话里请小艾确认：将创建公开仓库 `cheng21122001/tarot-app` 并推送（GitHub Pages 免费账号只能用公开仓库；仓库里只有代码、牌面图和公开的 anon key，客人数据只在 Supabase）。得到明确同意后：

```bash
gh repo create cheng21122001/tarot-app --public --source . --remote origin
git branch -M main
git push -u origin main
gh api -X POST repos/cheng21122001/tarot-app/pages -f build_type=workflow
gh workflow run deploy --repo cheng21122001/tarot-app
```

若 `pages` API 报已存在，改用 `-X PUT`。

- [ ] **Step 8: 线上验证**

Run: `gh run watch --repo cheng21122001/tarot-app $(gh run list --repo cheng21122001/tarot-app -L1 --json databaseId -q '.[0].databaseId')`
Expected: build 与 deploy 都成功。Browser pane 打开 `https://cheng21122001.github.io/tarot-app/`，显示登录页，`/tarot-app/cards/major-16.webp` 返回 200，manifest 可访问。

---

### Task 13: 端到端验收

**Files:** 无代码改动（发现问题回到对应任务修）。

- [ ] **Step 1: 线上完整流程**（请小艾在 Browser pane 里登录线上地址一次）
1. 新建 → 填问题 → 选三张牌（含一张逆位）→ 复制提示词。
2. 用复制出的提示词实际让 Claude 生成一份解读（在本对话里按提示词生成即可），粘回 → 1 秒后返回列表确认已保存且无「未同步」。
3. 白天、夜间各生成一张长图并截图给小艾看。
4. 复制微信文字，把文本贴出来给小艾看。

- [ ] **Step 2: 离线**
Browser pane 无法断网时跳过自动化，改为向小艾说明在手机上验证：开飞行模式打开 app → 能看到列表和牌面 → 新建一条 → 角落出现「未同步」→ 关飞行模式 → 角标消失。

- [ ] **Step 3: 手机安装说明**
告诉小艾：iPhone 用 Safari 打开线上地址 → 分享 → 添加到主屏幕；Mac 用 Chrome 打开 → 地址栏安装图标。

- [ ] **Step 4: 更新 memory**
写 `tarot-reading-app` project memory：目录、线上地址、Supabase 表名、共用项目、同源 storageKey/IndexedDB 隔离、提示词模板位置、字体子集方案，并在 MEMORY.md 加索引行。
