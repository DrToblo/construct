import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
}

export function Panel({ title, children, className = '', headerActions }: PanelProps) {
  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800 shrink-0">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">{title}</h2>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
