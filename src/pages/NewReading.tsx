import { useState } from 'react';

// 选测算种类：命盘总论，或某一年的流年运势（默认今年，可改）。
export function NewReadingButtons({ onCreate }: { onCreate: (kind: 'natal' | 'year', year: number) => void }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  return (
    <div className="new-reading">
      <button type="button" className="primary" onClick={() => onCreate('natal', thisYear)}>＋ 命盘总论</button>
      <div className="year-pick">
        <button type="button" className="primary" onClick={() => onCreate('year', year)}>＋ {year} 流年运势</button>
        <div className="chips">
          {[thisYear, thisYear + 1].map((y) => (
            <button type="button" key={y} className={`chip${year === y ? ' on' : ''}`} onClick={() => setYear(y)}>
              {y === thisYear ? '今年' : '明年'}
            </button>
          ))}
          <input className="year-input" inputMode="numeric" value={year} onChange={(e) => setYear(Number(e.target.value.replace(/\D/g, '').slice(0, 4)) || thisYear)} aria-label="年份" />
        </div>
      </div>
    </div>
  );
}
