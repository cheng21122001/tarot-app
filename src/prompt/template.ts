import { daYunText, pillarsText, wuXingText, type BaziChart } from '../bazi/chart';
import type { Client, Reading } from '../domain/types';
import { SECTIONS } from '../reading/sections';

function chartLines(c: BaziChart): string[] {
  return [
    `四柱：${pillarsText(c)}`,
    `日主：${c.dayMaster}`,
    ...c.pillars.map(
      (p) =>
        `${p.label} ${p.gan}${p.zhi}：天干${p.gan}（${p.ganShiShen}），地支${p.zhi}藏${p.hidden.map((h) => `${h.gan}（${h.shiShen}）`).join('')}，纳音${p.naYin}，星运${p.diShi}`,
    ),
    `五行（干支本气计数）：${wuXingText(c)}`,
    `空亡：${c.kongWang}；胎元：${c.taiYuan}${c.mingGong ? `；命宫：${c.mingGong}` : ''}`,
    `大运：${c.startYun}，依次为 ${c.daYun.map(daYunText).join('、')}`,
  ];
}

// 解读口吻只改这个文件。
export function buildPrompt(r: Reading, client: Client, c: BaziChart): string {
  const name = client.name.trim() || '客人';
  const isYear = r.kind === 'year';
  const headings = SECTIONS[r.kind].map((t) => `【${t}】`);

  const materials = [
    `客人称呼：${name}`,
    `性别：${c.genderText}`,
    `出生：${c.solarText}，${c.lunarText}`,
    ...chartLines(c),
    isYear
      ? `要看的流年：${c.year}年 ${c.liuNian.ganZhi}（天干${c.liuNian.shiShen}），所在大运 ${c.currentDaYun ? daYunText(c.currentDaYun) : '尚未起运'}`
      : `当前（${c.year}年）：大运 ${c.currentDaYun ? daYunText(c.currentDaYun) : '尚未起运'}，流年 ${c.liuNian.ganZhi}（天干${c.liuNian.shiShen}）`,
    ...(isYear ? ['流月（以节为界）：', ...c.liuYue.map((m) => `  ${m.ganZhi[1]}月 ${m.ganZhi}（${m.shiShen}），${m.jie} ${m.start} 起`)] : []),
    ...(r.focus.trim() ? [`客人特别想了解：${r.focus.trim()}`] : []),
  ];

  const rules = isYear
    ? [
        '1. 直接使用上面的排盘，不要自己重新排盘或改动干支。',
        '2. 先简要判断日主强弱与喜用神，再结合原局、大运和流年之间的生克冲合刑害，定出这一年的整体基调，在年度总览里讲清依据。',
        '3. 事业、财运、感情、健康与心态各段给出明确判断：这一年哪里顺、哪里要防，落到具体的表现和时间段，不说模棱两可的话。',
        `4. 逐月提示按流月顺序写 12 行，每行以「寅月（2/4 起）：」这样的格式开头，跟一两句提示；没有特别之处的月份也写一句。`,
        '5. 建议要具体到客人这一年可以做的事、适合把握或避开的时段。',
      ]
    : [
        '1. 直接使用上面的排盘，不要自己重新排盘或改动干支。',
        '2. 先判断日主强弱、格局和喜用神，在命局总览里说明依据（月令、通根、透干、生扶克泄），后面各段都以此为基础。',
        '3. 性格、事业学业、财运、感情婚姻各段给出明确判断，落到具体的倾向、适合的方向和容易遇到的问题，不说放之四海而皆准的空话。',
        '4. 大运走势按顺序讲每一步大运的基调，已经走过的简略，当前和接下来两步详细。',
        '5. 建议要具体到客人可以做的事。',
      ];

  return [
    `你是一位资深的八字命理师，正在为一位付费客人做${isYear ? `${c.year}年流年运势` : '命盘总论'}解读。`,
    '',
    '本次材料（由程序排盘）',
    ...materials,
    '',
    '写作要求',
    ...rules,
    '6. 口吻专业、克制、清楚，用客人听得懂的话；用到术语时顺带解释一句。不渲染恐惧，不写鸡汤，不堆砌玄乎的修辞。',
    '7. 不预测寿数、死亡、重大疾病或灾祸，不下宿命论的断语；涉及健康只谈作息与保养方向，不给医疗结论；也不要在正文里写免责声明。',
    ...(r.focus.trim() ? ['8. 客人特别想了解的方面，在相关段落里重点展开。'] : []),
    ...(c.timeKnown ? [] : ['9. 客人时辰不详，只依据年月日三柱判断，不要臆测时柱。']),
    '全文 1800 到 2500 字。',
    '',
    '输出格式',
    `严格按下面 ${headings.length} 个标题输出，每个标题独占一行，标题下面直接写正文。不要加其他标题、开场白或结束语，不要使用 Markdown 符号。`,
    ...headings,
  ].join('\n');
}
