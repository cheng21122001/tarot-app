import type { ReadingKind } from '../domain/types';

// 每种测算要求 Claude 输出的段落标题，提示词、拆分、导出共用。
export const SECTIONS: Record<ReadingKind, string[]> = {
  natal: ['命局总览', '性格特点', '事业学业', '财运', '感情婚姻', '大运走势', '建议'],
  year: ['年度总览', '事业', '财运', '感情', '健康与心态', '逐月提示', '建议'],
};
