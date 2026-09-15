import { PRESETS, type Positions, type Reading, type SpreadPreset } from '../../reading/types';

const OPTIONS: { value: SpreadPreset; label: string }[] = [
  { value: 'past_present_future', label: '过去 / 现在 / 未来' },
  { value: 'situation_obstacle_advice', label: '现状 / 阻碍 / 建议' },
  { value: 'you_them_outcome', label: '你 / 对方 / 关系走向' },
  { value: 'custom', label: '自定义' },
];

export function QuestionSection({ reading: r, onChange }: { reading: Reading; onChange: (patch: Partial<Reading>) => void }) {
  const pick = (value: SpreadPreset) =>
    onChange(value === 'custom' ? { spreadPreset: 'custom' } : { spreadPreset: value, positions: [...PRESETS[value]] });

  const setPosition = (i: number, text: string) => {
    const positions = [...r.positions] as Positions;
    positions[i] = text;
    onChange({ positions });
  };

  return (
    <section className="section">
      <h2>问题</h2>
      <label className="field">
        <span>客人称呼</span>
        <input value={r.clientName} onChange={(e) => onChange({ clientName: e.target.value })} />
      </label>
      <label className="field">
        <span>问题</span>
        <textarea rows={3} value={r.question} onChange={(e) => onChange({ question: e.target.value })} />
      </label>
      <div className="field">
        <span>牌阵位置</span>
        <div className="chips">
          {OPTIONS.map((o) => (
            <button type="button" key={o.value} className={`chip${r.spreadPreset === o.value ? ' on' : ''}`} onClick={() => pick(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
        {r.spreadPreset === 'custom' && (
          <div className="custom-positions">
            {[0, 1, 2].map((i) => (
              <input key={i} placeholder={`位置${i + 1}`} value={r.positions[i]} onChange={(e) => setPosition(i, e.target.value)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
