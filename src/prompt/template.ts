import { buildChart, daYunText, pillarsText, wuXingText } from '../bazi/chart';
import { cardLabel, ORDINALS } from '../reading/labels';
import type { Reading } from '../reading/types';

// 解读口吻只改这个文件。
export function buildPrompt(r: Reading): string {
  const cardLines = r.positions.map((p, i) => `${ORDINALS[i]}（${p}）：${cardLabel(r.cards[i])}`);
  const headings = r.positions.map((p, i) => `【${ORDINALS[i]}｜${p}｜${cardLabel(r.cards[i])}】`);
  const chart = r.birth ? buildChart(r.birth, new Date(r.createdAt)) : null;

  const chartLines = chart
    ? [
        '',
        '客人八字（由程序按出生时间排出，直接使用，不要自己重新排盘）',
        `出生：${chart.solarText}（${chart.lunarText}），${r.birth!.gender === 'male' ? '男' : '女'}`,
        `四柱：${pillarsText(chart)}`,
        `十神（天干）：${chart.pillars.map((p) => `${p.label}${p.shiShen}`).join('、')}`,
        `日主：${chart.dayMaster}`,
        `五行（干支本气计数）：${wuXingText(chart)}`,
        `大运：${chart.startYun}；当前大运 ${chart.currentDaYun ? daYunText(chart.currentDaYun) : '尚未起运'}`,
        `流年：${chart.liuNian.year} ${chart.liuNian.ganZhi}`,
      ]
    : [];

  const chartRules = chart
    ? [
        '8. 八字只作背景：结合日主强弱、五行喜忌、当前大运与流年，说明客人眼下所处的大环境，以及它如何呼应或修正三张牌的走向。判断仍以三张牌为主，不要用八字推翻牌面。',
        `9. 命盘参考一段 150 到 250 字，用客人听得懂的话讲，少堆术语；不预测寿数、灾病，不下宿命论断语。${chart.timeKnown ? '' : '客人时辰不详，只依据年月日三柱，不要臆测时柱。'}`,
      ]
    : [];

  return [
    chart
      ? '你是一位使用韦特塔罗体系的专业塔罗师，同时懂八字命理，正在为一位付费客人做三张牌解读，并以客人八字作为背景参考。'
      : '你是一位使用韦特塔罗体系的专业塔罗师，正在为一位付费客人做三张牌解读。',
    '',
    '本次材料',
    `客人称呼：${r.clientName.trim() || '客人'}`,
    `问题：${r.question.trim()}`,
    `牌阵：三张牌，位置依次为 ${r.positions.join(' / ')}`,
    ...cardLines,
    ...chartLines,
    '',
    '写作要求',
    '1. 每张牌先说明这张牌（含正逆位）在该位置上的含义，再具体落到客人的问题上。',
    '2. 讲清三张牌之间的关联和走向，不要三段各说各的。',
    '3. 整体解读要给出明确判断，不说模棱两可的话。',
    '4. 建议要具体到客人接下来可以做的事。',
    '5. 口吻专业、克制、清楚：不渲染恐惧，不写鸡汤，不堆砌玄乎的修辞。',
    chart ? '6. 全文 800 到 1100 字。' : '6. 全文 600 到 900 字。',
    '7. 如果问题涉及健康、怀孕或法律纠纷，只谈心态与方向，不给医疗或法律上的结论；也不要在正文里写免责声明。',
    ...chartRules,
    '',
    '输出格式',
    `严格按下面${chart ? '六' : '五'}个标题输出，每个标题独占一行，标题下面直接写正文。不要加其他标题、开场白或结束语，不要使用 Markdown 符号。`,
    ...headings,
    ...(chart ? ['【命盘参考】'] : []),
    '【整体解读】',
    '【建议】',
  ].join('\n');
}
