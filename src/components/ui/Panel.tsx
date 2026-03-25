import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
}

export function Panel({ title, children, className = '', headerActions }: PanelProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h2>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
