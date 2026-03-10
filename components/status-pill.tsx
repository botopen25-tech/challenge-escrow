import clsx from 'clsx';

const styles = {
  Created: 'bg-slate-500/15 text-slate-200',
  Accepted: 'bg-sky-500/15 text-sky-200',
  Resolved: 'bg-emerald-500/15 text-emerald-200',
  Refunded: 'bg-amber-500/15 text-amber-200',
  Disputed: 'bg-orange-500/15 text-orange-200',
} as const;

export function StatusPill({ status }: { status: keyof typeof styles }) {
  return <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', styles[status])}>{status}</span>;
}
