import { switchCalendar } from '../bazi/chart';
import type { BirthInfo } from '../domain/types';
import { PlaceEditor } from './PlaceEditor';

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const LUNAR_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = i + 1;
  if (d <= 10) return `初${'一二三四五六七八九十'[d - 1]}`;
  if (d < 20) return `十${'一二三四五六七八九'[d - 11]}`;
  if (d === 20) return '二十';
  if (d < 30) return `廿${'一二三四五六七八九'[d - 21]}`;
  return '三十';
});
const ZHI = '子丑寅卯辰巳午未申酉戌亥';
// 0 点、23 点都是子时，1–2 点丑时，依此类推。
const shiChen = (h: number) => `${ZHI[Math.floor(((h + 1) % 24) / 2)]}时`;
const pad = (n: number) => String(n).padStart(2, '0');

// 年份直接输入、月日时分用下拉，比系统日期滚轮和 AM/PM 时间框快。
export function BirthEditor({ birth: b, onChange }: { birth: BirthInfo; onChange: (b: BirthInfo) => void }) {
  const set = (patch: Partial<BirthInfo>) => onChange({ ...b, ...patch });
  const lunar = b.calendar === 'lunar';
  const [y = '', m = '', d = ''] = b.date.split('-');
  const setPart = (part: 0 | 1 | 2, value: string) => {
    const parts = [y, m, d];
    parts[part] = value;
    set({ date: parts.join('-') });
  };
  const [hh, mm] = b.time ? b.time.split(':').map(Number) : [null, 0];

  return (
    <>
      <div className="field">
        <span>出生日期</span>
        <div className="seg">
          <button type="button" className={!lunar ? 'on' : ''} onClick={() => onChange(switchCalendar(b, 'solar'))}>公历</button>
          <button type="button" className={lunar ? 'on' : ''} onClick={() => onChange(switchCalendar(b, 'lunar'))}>农历</button>
        </div>
        <div className="birth-date">
          <label className="unit">
            <input inputMode="numeric" placeholder="1998" value={y} onChange={(e) => setPart(0, e.target.value.replace(/\D/g, '').slice(0, 4))} aria-label="出生年份" />
            年
          </label>
          <select value={Number(m) || ''} onChange={(e) => setPart(1, pad(Number(e.target.value)))} aria-label="出生月份">
            <option value="" disabled>月</option>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{lunar ? `${LUNAR_MONTHS[i]}月` : `${i + 1}月`}</option>)}
          </select>
          <select value={Number(d) || ''} onChange={(e) => setPart(2, pad(Number(e.target.value)))} aria-label="出生日">
            <option value="" disabled>日</option>
            {Array.from({ length: lunar ? 30 : 31 }, (_, i) => <option key={i} value={i + 1}>{lunar ? LUNAR_DAYS[i] : `${i + 1}日`}</option>)}
          </select>
          {lunar && (
            <label className="check">
              <input type="checkbox" checked={b.leapMonth} onChange={(e) => set({ leapMonth: e.target.checked })} />闰月
            </label>
          )}
        </div>
      </div>
      <div className="birth-row">
        <div className="field">
          <span>出生时间</span>
          <div className="birth-time">
            <select value={hh ?? ''} onChange={(e) => set({ time: e.target.value === '' ? null : `${pad(Number(e.target.value))}:${pad(mm)}` })} aria-label="出生小时">
              <option value="">时辰不详</option>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h} 点 · {shiChen(h)}</option>)}
            </select>
            {hh !== null && (
              <select value={mm} onChange={(e) => set({ time: `${pad(hh)}:${pad(Number(e.target.value))}` })} aria-label="出生分钟">
                {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{pad(i)} 分</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="field">
          <span>性别</span>
          <div className="seg">
            <button type="button" className={b.gender === 'female' ? 'on' : ''} onClick={() => set({ gender: 'female' })}>女</button>
            <button type="button" className={b.gender === 'male' ? 'on' : ''} onClick={() => set({ gender: 'male' })}>男</button>
          </div>
        </div>
      </div>
      <PlaceEditor place={b.place} onChange={(place) => set({ place })} />
    </>
  );
}
