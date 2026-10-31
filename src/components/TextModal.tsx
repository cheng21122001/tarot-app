export function TextModal({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ padding: 16 }} onClick={(e) => e.stopPropagation()}>
        <p className="hint">{title}</p>
        <textarea readOnly rows={16} value={text} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
