import { daYunText, pillarsText, wuXingText, type BaziChart } from '../bazi/chart';
import { SCHOOL_LABELS, SCHOOLS, type Client, type Reading, type School } from '../domain/types';
import { sectionsFor } from '../reading/sections';

function chartLines(c: BaziChart): string[] {
  return [
    `四柱：${pillarsText(c)}`,
    `日主：${c.dayMaster}；月令：${c.yueLing}`,
    ...c.pillars.map(
      (p) =>
        `${p.label} ${p.gan}${p.zhi}：天干${p.gan}（${p.ganShiShen}），地支${p.zhi}藏${p.hidden.map((h) => `${h.gan}（${h.shiShen}）`).join('')}，纳音${p.naYin}，星运${p.diShi}`,
    ),
    `五行（干支本气计数）：${wuXingText(c)}`,
    `空亡：${c.kongWang}；胎元：${c.taiYuan}${c.mingGong ? `；命宫：${c.mingGong}` : ''}`,
    `大运：${c.startYun}，依次为 ${c.daYun.map(daYunText).join('、')}`,
  ];
}

// 各流派的取用方法与侧重。格局看成就与外在发展，调候看心态与身心状态，扶抑看日主承受力。
const SCHOOL_RULES: Record<School, string> = {
  geju: '格局派（以《子平真诠》为本）：依月令取格，写明格局名称、相神，以及格局的成败与救应；由此说明客人适合追求的成就、事业路径和社会位置。',
  tiaohou: '调候派（以《穷通宝鉴》为本）：依日干与月令看寒暖燥湿，写明《穷通宝鉴》中此日干生于此月的调候用神，以及原局有没有、透不透、得不得力；由此说明客人的心态底色、情绪、身心状态和怎样才过得舒服。',
  fuyi: '扶抑派（旺衰扶抑，以《滴天髓》一路为本）：从得令、得地、得势判断日主强弱，定出喜神、用神与忌神，说明客人的承受力以及顺势与逆势时的表现。',
};

// 解读口吻只改这个文件。
export function buildPrompt(r: Reading, client: Client, c: BaziChart): string {
  const name = client.name.trim() || '客人';
  const isYear = r.kind === 'year';
  const schools = SCHOOLS.filter((s) => r.schools.includes(s));
  const headings = sectionsFor(r.kind, schools).map((t) => `【${t}】`);

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

  const schoolRules = schools.length
    ? [
        `这次用 ${schools.map((s) => SCHOOL_LABELS[s]).join('、')} 来看。各派取用的依据不同，结论可能一致，也可能相反：`,
        ...schools.map((s) => `- ${SCHOOL_RULES[s]}`),
        ...(schools.length > 1
          ? [
              `- 每一派在自己的段落里独立分析、写出该派的用神与喜忌，不要互相迁就、混成一个结论。`,
              `- ${schools.length === 2 ? '两派' : '几派'}对照一段：逐条说清哪里一致、哪里相反；相反时不要硬判谁对，而是讲清怎么同时看（例如格局管外在成就，调候管内在状态），以及对客人实际意味着什么。`,
              `- 后面的分项段落里，几派判断一致就直接说；不一致时分别说明各派的看法。`,
            ]
          : []),
      ]
    : [];

  const steps = isYear
    ? [
        '直接使用上面的排盘，不要自己重新排盘或改动干支。',
        schools.length
          ? '年度总览先给出这一年的整体基调，再在各派段落里分别结合原局、大运和流年的生克冲合刑害讲依据。'
          : '先简要判断日主强弱与喜用神，再结合原局、大运和流年之间的生克冲合刑害，定出这一年的整体基调，在年度总览里讲清依据。',
        '事业、财运、感情、健康与心态各段给出明确判断：这一年哪里顺、哪里要防，落到具体的表现和时间段，不说模棱两可的话。',
        '逐月提示按流月顺序写 12 行，每行以「寅月（2/4 起）：」这样的格式开头，跟一两句提示；没有特别之处的月份也写一句。',
        '建议要具体到客人这一年可以做的事、适合把握或避开的时段。',
      ]
    : [
        '直接使用上面的排盘，不要自己重新排盘或改动干支。',
        schools.length
          ? '先按各派分别论命，后面的性格、事业学业、财运、感情婚姻各段都以前面的分析为基础。'
          : '先判断日主强弱、格局和喜用神，在命局总览里说明依据（月令、通根、透干、生扶克泄），后面各段都以此为基础。',
        '性格、事业学业、财运、感情婚姻各段给出明确判断，落到具体的倾向、适合的方向和容易遇到的问题，不说放之四海而皆准的空话。',
        '大运走势按顺序讲每一步大运的基调，已经走过的简略，当前和接下来两步详细。',
        '建议要具体到客人可以做的事。',
      ];
  const general = [
    '口吻专业、克制、清楚，用客人听得懂的话；用到术语时顺带解释一句。不渲染恐惧，不写鸡汤，不堆砌玄乎的修辞。',
    '不预测寿数、死亡、重大疾病或灾祸，不下宿命论的断语；涉及健康只谈作息与保养方向，不给医疗结论；也不要在正文里写免责声明。',
    ...(r.focus.trim() ? ['客人特别想了解的方面，在相关段落里重点展开。'] : []),
    ...(c.timeKnown ? [] : ['客人时辰不详，只依据年月日三柱判断，不要臆测时柱。']),
  ];
  const length = 1800 + Math.max(0, schools.length - 1) * 500;

  return [
    `你是一位资深的八字命理师，正在为一位付费客人做${isYear ? `${c.year}年流年运势` : '命盘总论'}解读。`,
    '',
    '本次材料（由程序排盘）',
    ...materials,
    '',
    ...(schoolRules.length ? ['流派', ...schoolRules, ''] : []),
    '写作要求',
    ...[...steps, ...general].map((t, i) => `${i + 1}. ${t}`),
    `全文 ${length} 到 ${length + 700} 字。`,
    '',
    '输出格式',
    `严格按下面 ${headings.length} 个标题输出，每个标题独占一行，标题下面直接写正文。不要加其他标题、开场白或结束语，不要使用 Markdown 符号。`,
    ...headings,
  ].join('\n');
}
