import type { SaveStatus } from '../lib/useAutosave';

export interface Crumb {
  label: string;
  onClick: () => void;
}

// 顶部固定栏：可以直接点回任意上一级的路径，加保存状态。也可以在页面上右滑返回。
export function PageBar({ crumbs, status }: { crumbs: Crumb[]; status: SaveStatus | null }) {
  return (
    <div className="page-bar">
      <nav className="crumbs" aria-label="返回到">
        {crumbs.map((c, i) => (
          <span key={i}>
            <button type="button" className={i === 0 ? 'crumb first' : 'crumb'} onClick={c.onClick}>
              {i === 0 && '‹ '}
              {c.label}
            </button>
          </span>
        ))}
      </nav>
      <span className={`save-status${status === 'saving' ? ' busy' : ''}`} aria-live="polite">
        {status === null ? '' : status === 'saving' ? '正在保存' : '已保存'}
      </span>
    </div>
  );
}
