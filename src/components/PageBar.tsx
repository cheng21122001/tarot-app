import type { SaveStatus } from '../lib/useAutosave';

// 顶部固定栏：返回 + 标题 + 保存状态，让人一眼看到内容已经存好，不用退出去确认。
export function PageBar({ title, status, onBack }: { title: string; status: SaveStatus | null; onBack: () => void }) {
  return (
    <div className="page-bar">
      <button type="button" className="text-btn" onClick={onBack}>‹ 返回</button>
      <span className="page-bar-title">{title}</span>
      <span className={`save-status${status === 'saving' ? ' busy' : ''}`}>{status === null ? '' : status === 'saving' ? '保存中…' : '已保存 ✓'}</span>
    </div>
  );
}
