import { wxKey } from '../bazi/chart';

// 干支字按五行上色。
export function Gz({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`gz ${className}`}>
      {[...text].map((ch, i) => (
        <span key={i} className={wxKey(ch) ? `wx-${wxKey(ch)}` : undefined}>{ch}</span>
      ))}
    </span>
  );
}
