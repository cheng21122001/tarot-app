import { useState } from 'react';

// 选测算种类：命盘总论，或某一年的流年运势（默认今年，可改）。
export function NewReadingButtons({ onCreate }: { onCreate: (kind: 'natal' | 'year', year: number) => void }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  return (
    <div className="new-reading">
      <button type="button" className="kind-card" onClick={() => onCreate('natal', thisYear)}>
        <strong>命盘总论</strong>
        <span>一生格局：性格、事业、财运、感情、大运</span>
      </button>
      <div className="kind-card year">
        <button type="button" className="kind-main" onClick={() => onCreate('year', year)}>
          <strong>{year} 流年运势</strong>
          <span>这一年的走势，附十二个月提示</span>
        </button>
        <div className="seg small">
          {[thisYear, thisYear + 1].map((y) => (
            <button type="button" key={y} className={year === y ? 'on' : ''} onClick={() => setYear(y)}>
              {y === thisYear ? '今年' : '明年'}
            </button>
          ))}
          <input
            className={`year-input${year !== thisYear && year !== thisYear + 1 ? ' on' : ''}`}
            inputMode="numeric"
            placeholder="其他年"
            value={year !== thisYear && year !== thisYear + 1 ? year : ''}
            onChange={(e) => {
              const y = Number(e.target.value.replace(/\D/g, '').slice(0, 4));
              setYear(y >= 1900 && y <= 2100 ? y : thisYear);
            }}
            aria-label="其他年份"
          />
        </div>
      </div>
    </div>
  );
}
