import type { Client, Reading } from '../domain/types';
import { sectionsFor } from '../reading/sections';
import {
  dashaText,
  formatDeg,
  md,
  nakText,
  PLANET_NAMES,
  saturnFromMoon,
  signLord,
  SIGN_SA,
  SIGNS,
  type VedicChart,
  type VPlanet,
} from '../vedic/chart';

const sign = (i: number) => `${SIGNS[i]}（${SIGN_SA[i]}）`;

function planetLine(p: VPlanet): string {
  const tags = [p.dignity, p.retro && p.id !== 'rahu' && p.id !== 'ketu' ? '逆行' : ''].filter(Boolean);
  return `${PLANET_NAMES[p.id]}：${sign(p.sign)} ${formatDeg(p.deg)}，第${p.house}宫，${nakText(p)}，D9 ${SIGNS[p.navamsa]}${tags.length ? `，${tags.join('、')}` : ''}`;
}

export function vedicChartLines(c: VedicChart): string[] {
  const base = c.houseBase === 'lagna' ? '上升' : '月亮';
  const houses = Array.from({ length: 12 }, (_, i) => {
    const s = (c.baseSign + i) % 12;
    const lord = signLord(s);
    const lordHouse = c.planets.find((p) => p.id === lord)!.house;
    const inside = c.planets.filter((p) => p.sign === s).map((p) => PLANET_NAMES[p.id]);
    return `  第${i + 1}宫 ${SIGNS[s]}，宫主${PLANET_NAMES[lord]}落第${lordHouse}宫${inside.length ? `；宫内：${inside.join('、')}` : ''}`;
  });
  return [
    `出生：${c.birthText}，出生地 ${c.placeText}，即 ${c.utcText}`,
    '体系：恒星黄道，Lahiri 岁差，整宫制（Whole Sign），罗睺计都取平均交点',
    c.lagna
      ? `上升（Lagna）：${sign(c.lagna.sign)} ${formatDeg(c.lagna.deg)}，${nakText(c.lagna)}`
      : '上升：时辰不详，无法确定上升，以月亮所在星座为第一宫（Chandra Lagna）',
    `月亮星座（Rashi）：${sign(c.moon.sign)}；月宿（Janma Nakshatra）：${nakText(c.moon)}`,
    '行星：',
    ...c.planets.map((p) => `  ${planetLine(p)}`),
    `宫位（从${base}起算）：`,
    ...houses,
    `维姆肖塔里大运（Vimshottari Dasha）：${c.dashaBalance}`,
    ...c.mahadashas.map((d) => `  ${dashaText(d, c.tz)}`),
  ];
}

// 解读口吻只改这个文件。
export function buildVedicPrompt(r: Reading, client: Client, c: VedicChart): string {
  const name = client.name.trim() || '命主';
  const isYear = r.kind === 'year';
  const headings = sectionsFor(r.kind, [], 'vedic').map((t) => `【${t}】`);
  const now = c.currentMd ? `大运 ${dashaText(c.currentMd, c.tz)}${c.currentAd ? `，小运 ${dashaText(c.currentAd, c.tz)}` : ''}` : '不在大运范围内';

  const transitLines = (['jupiter', 'saturn', 'rahu', 'ketu'] as const).map((id) => {
    const steps = c.transits[id].map((s) => {
      const where = `${s.fromLagna ? `第${s.fromLagna}宫、` : ''}月亮起第${s.fromMoon}宫`;
      const sat = id === 'saturn' ? saturnFromMoon(s.fromMoon) : null;
      return `${md(s.from, c.tz)} 起 ${SIGNS[s.sign]}（${where}${sat ? `，${sat}` : ''}）`;
    });
    return `  ${PLANET_NAMES[id]}：${steps.join('；')}`;
  });

  const materials = [
    `命主称呼：${name}`,
    `性别：${client.birth.gender === 'male' ? '男' : '女'}`,
    ...vedicChartLines(c),
    ...(isYear
      ? [
          `要看的年份：${c.year}年`,
          '这一年经过的大运与小运：',
          ...c.yearDashas.map((x) => `  ${PLANET_NAMES[x.md.lord]}大运 / ${dashaText(x.ad, c.tz)}`),
          '这一年的慢星行运（宫位从本命上升和本命月亮分别起算）：',
          ...transitLines,
          '太阳月（太阳进入各星座之日）：',
          ...c.solarMonths.map((m) => `  ${md(m.start, c.tz)} 太阳入${SIGNS[m.sign]}`),
        ]
      : [`当前（${c.year}年）：${now}`, `当前大运里的小运：`, ...c.antardashas.map((d) => `  ${dashaText(d, c.tz)}`)]),
  ];

  const steps = isYear
    ? [
        '直接使用上面的星盘和日期，不要自己重新推算行星位置、上升或大运。',
        '年度总览先给出这一年的整体基调，说明依据：大运主星与小运主星在本命盘的位置、所主宫位、强弱，以及木星、土星、罗睺计都的行运。',
        '大运与小运一段讲清这一年所在的大运和小运各自带来的主题；年中换小运的，分别说明换运前后的变化和时间点。',
        '事业、财运、感情、健康与心态各段给出明确判断：这一年哪里顺、哪里要防，落到具体表现和时间段，不说模棱两可的话。',
        '逐月提示按上面的太阳月顺序写 12 行，每行以「1/14 起 太阳入摩羯：」这样的格式开头，跟一两句提示；没有特别之处的月份也写一句。',
        '建议要具体到命主这一年可以做的事、适合把握或避开的时段。',
      ]
    : [
        '直接使用上面的星盘和日期，不要自己重新推算行星位置、上升或大运。',
        '星盘总览先说上升、月亮星座和月宿给出的底色，再说盘中最突出的配置：入旺落陷的行星、重要的宫主落宫、合相与相互照会（按吠陀的 Graha Drishti：所有行星照第 7 宫，火星另照第 4、8 宫，木星另照第 5、9 宫，土星另照第 3、10 宫）、常见的瑜伽（Yoga）组合，有就点名并说明依据。',
        '性格与心性、事业学业、财富、感情婚姻各段，以对应宫位（第 1、10、2 与 11、7 宫等）、宫主和征象星为依据给出明确判断，落到具体的倾向、适合的方向和容易遇到的问题，不说放之四海而皆准的空话。',
        '大运走势按顺序讲每一步大运的基调，已经走过的简略，当前和接下来两步详细；当前大运里的小运也简要说一下。',
        '建议要具体到命主可以做的事；可以提吠陀传统里与相关行星对应的日常做法（如作息、颜色、布施、念诵），但不推销宝石或法事。',
      ];
  const general = [
    '口吻专业、克制、清楚，用命主听得懂的话；用到梵文术语时顺带用中文解释一句。不渲染恐惧，不写鸡汤，不堆砌玄乎的修辞。',
    '不预测寿数、死亡、重大疾病或灾祸，不下宿命论的断语；涉及健康只谈作息与保养方向，不给医疗结论；也不要在正文里写免责声明。',
    ...(c.timeKnown ? [] : ['命主时辰不详：上升和宫位以月亮星座代替，月亮度数按当天正午取，月宿和大运起点可能有偏差，解读时不要依赖上升和精确宫位。']),
  ];

  return [
    `你是一位资深的吠陀占星师（Jyotish），正在为命主做${isYear ? `${c.year}年流年运势` : '本命星盘总论'}解读。`,
    '',
    '本次材料（由程序按天文历算排盘）',
    ...materials,
    '',
    '写作要求',
    ...[...steps, ...general].map((t, i) => `${i + 1}. ${t}`),
    `全文 ${isYear ? 2000 : 1800} 到 ${isYear ? 2700 : 2500} 字。`,
    '',
    '输出格式',
    `严格按下面 ${headings.length} 个标题输出，每个标题独占一行，标题下面直接写正文。不要加其他标题、开场白或结束语，不要使用 Markdown 符号。`,
    ...headings,
  ].join('\n');
}
