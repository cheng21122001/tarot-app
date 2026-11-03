import { useState } from 'react';
import { SYSTEM_LABELS, type System } from '../domain/types';

export type CreateReading = (kind: 'natal' | 'year', year: number, system: System) => void;

// 选测算种类：八字或吠陀；命盘总论，或某一年的流年运势（默认今年，可改）。
// system 由外面定时（命主页按当前看的盘）不显示切换。
export function NewReadingButtons({ onCreate, system: fixed, hasPlace = true }: { onCreate: CreateReading; system?: System; hasPlace?: boolean }) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [chosen, setChosen] = useState<System>('bazi');
  const system = fixed ?? chosen;
  const vedic = system === 'vedic';
  return (
    <div className="new-reading">
      {!fixed && (
        <div className="seg">
          {(['bazi', 'vedic'] as const).map((s) => (
            <button type="button" key={s} className={system === s ? 'on' : ''} onClick={() => setChosen(s)}>{SYSTEM_LABELS[s]}</button>
          ))}
        </div>
      )}
      {vedic && !hasPlace && <p className="hint">这位命主还没填出生地，建好后要先去补上才能排吠陀星盘。</p>}
      <button type="button" className="kind-card" onClick={() => onCreate('natal', thisYear, system)}>
        <strong>{vedic ? '吠陀 命盘总论' : '命盘总论'}</strong>
        <span>{vedic ? '本命星盘：上升、月宿、宫位、行星与大运' : '一生格局：性格、事业、财运、感情、大运'}</span>
      </button>
      <div className="kind-card year">
        <button type="button" className="kind-main" onClick={() => onCreate('year', year, system)}>
          <strong>{vedic ? '吠陀 ' : ''}{year} 流年运势</strong>
          <span>{vedic ? '大运小运与木星土星行运，附十二个太阳月提示' : '这一年的走势，附十二个月提示'}</span>
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
