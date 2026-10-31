import type { SaveStatus } from '../lib/useAutosave';

// 顶部固定栏：返回 + 保存状态，让人一眼看到内容已经存好，不用退出去确认。
export function PageBar({ backLabel, status, onBack }: { backLabel: string; status: SaveStatus | null; onBack: () => void }) {
  return (
    <div className="page-bar">
      <button type="button" className="bar-back" onClick={onBack}>‹ {backLabel}</button>
      <span className={`save-status${status === 'saving' ? ' busy' : ''}`} aria-live="polite">
        {status === null ? '' : status === 'saving' ? '正在保存' : '已保存'}
      </span>
    </div>
  );
}
