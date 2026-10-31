import { switchCalendar } from '../bazi/chart';
import type { BirthInfo } from '../domain/types';

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const LUNAR_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = i + 1;
  if (d <= 10) return `初${'一二三四五六七八九十'[d - 1]}`;
  if (d < 20) return `十${'一二三四五六七八九'[d - 11]}`;
  if (d === 20) return '二十';
  if (d < 30) return `廿${'一二三四五六七八九'[d - 21]}`;
  return '三十';
});

export function BirthEditor({ birth: b, onChange }: { birth: BirthInfo; onChange: (b: BirthInfo) => void }) {
  const set = (patch: Partial<BirthInfo>) => onChange({ ...b, ...patch });
  const [y = '', m = '', d = ''] = b.date.split('-');
  const setLunarPart = (part: 0 | 1 | 2, value: string) => {
    const parts = [y, m, d];
    parts[part] = value;
    set({ date: parts.join('-') });
  };

  return (
    <>
      <div className="field">
        <span>出生日期</span>
        <div className="chips">
          <button type="button" className={`chip${b.calendar === 'solar' ? ' on' : ''}`} onClick={() => onChange(switchCalendar(b, 'solar'))}>公历</button>
          <button type="button" className={`chip${b.calendar === 'lunar' ? ' on' : ''}`} onClick={() => onChange(switchCalendar(b, 'lunar'))}>农历</button>
        </div>
        <div className="birth-date">
          {b.calendar === 'solar' ? (
            <input type="date" value={b.date} min="1900-01-01" max="2100-12-31" onChange={(e) => set({ date: e.target.value })} />
          ) : (
            <>
              <input inputMode="numeric" placeholder="年份" value={y} onChange={(e) => setLunarPart(0, e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <select value={Number(m) || ''} onChange={(e) => setLunarPart(1, e.target.value.padStart(2, '0'))}>
                <option value="" disabled>月</option>
                {LUNAR_MONTHS.map((name, i) => <option key={i} value={i + 1}>{name}月</option>)}
              </select>
              <select value={Number(d) || ''} onChange={(e) => setLunarPart(2, e.target.value.padStart(2, '0'))}>
                <option value="" disabled>日</option>
                {LUNAR_DAYS.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
              </select>
              <label className="check">
                <input type="checkbox" checked={b.leapMonth} onChange={(e) => set({ leapMonth: e.target.checked })} />闰月
              </label>
            </>
          )}
        </div>
      </div>
      <div className="birth-row">
        <label className="field">
          <span>出生时间（不知道就留空）</span>
          <input type="time" value={b.time ?? ''} onChange={(e) => set({ time: e.target.value || null })} />
        </label>
        <div className="field">
          <span>性别</span>
          <div className="chips">
            <button type="button" className={`chip${b.gender === 'female' ? ' on' : ''}`} onClick={() => set({ gender: 'female' })}>女</button>
            <button type="button" className={`chip${b.gender === 'male' ? ' on' : ''}`} onClick={() => set({ gender: 'male' })}>男</button>
          </div>
        </div>
      </div>
    </>
  );
}
