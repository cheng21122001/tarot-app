import { SCHOOLS, type ReadingKind, type School } from '../domain/types';

const SCHOOL_SECTION: Record<ReadingKind, Record<School, string>> = {
  natal: { geju: '格局派：成就与方向', tiaohou: '调候派：心态与状态', fuyi: '扶抑派：强弱与喜忌' },
  year: { geju: '格局派看这一年', tiaohou: '调候派看这一年', fuyi: '扶抑派看这一年' },
};

// 每次测算要求输出的段落标题，提示词、拆分、导出共用。
// schools 为空是加入流派之前的旧测算，保持原来的分段。
export function sectionsFor(kind: ReadingKind, schools: School[]): string[] {
  const chosen = SCHOOLS.filter((s) => schools.includes(s));
  if (!chosen.length) {
    return kind === 'natal'
      ? ['命局总览', '性格特点', '事业学业', '财运', '感情婚姻', '大运走势', '建议']
      : ['年度总览', '事业', '财运', '感情', '健康与心态', '逐月提示', '建议'];
  }
  const views = chosen.map((s) => SCHOOL_SECTION[kind][s]);
  const compare = chosen.length > 1 ? [chosen.length === 2 ? '两派对照' : '几派对照'] : [];
  return kind === 'natal'
    ? [...views, ...compare, '性格特点', '事业学业', '财运', '感情婚姻', '大运走势', '建议']
    : ['年度总览', ...views, ...compare, '事业', '财运', '感情', '健康与心态', '逐月提示', '建议'];
}
