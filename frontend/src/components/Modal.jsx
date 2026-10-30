import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide = false, serial }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`ticket animate-lift relative max-h-[88vh] w-full overflow-y-auto bg-white ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="flex items-start justify-between gap-6 border-b-2 border-ink px-6 py-4">
          <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
          <div className="flex items-center gap-3">
            {serial && <span className="mono text-[10px] text-ink-faint">{serial}</span>}
            <button onClick={onClose} aria-label="Close" className="border-2 border-ink p-1.5 text-ink transition hover:bg-fold">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
