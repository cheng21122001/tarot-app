// lunar-javascript 不带类型声明，这里只声明用到的部分。
declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(y: number, m: number, d: number): Solar;
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
  }
  export class Lunar {
    static fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Lunar;
    getSolar(): Solar;
    getEightChar(): EightChar;
    getYear(): number;
    getMonth(): number; // 闰月为负数
    getDay(): number;
    getYearInGanZhiExact(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhi(): string;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getPrevJie(): JieQi;
  }
  export class JieQi {
    getName(): string;
    getSolar(): Solar;
  }
  type P = 'Year' | 'Month' | 'Day' | 'Time';
  export type EightChar = {
    getDayGan(): string;
    getDayXunKong(): string;
    getMingGong(): string;
    getTaiYuan(): string;
    getYun(gender: 0 | 1): Yun;
  } & { [K in `get${P}`]: () => string } & { [K in `get${P}WuXing` | `get${P}NaYin` | `get${P}DiShi`]: () => string } & {
    [K in `get${P}HideGan`]: () => string[];
  };
  export class Yun {
    getStartYear(): number;
    getStartMonth(): number;
    getDaYun(): DaYun[];
  }
  export class DaYun {
    getGanZhi(): string;
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
  }
}
