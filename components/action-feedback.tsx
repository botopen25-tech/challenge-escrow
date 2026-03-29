'use client';

type ActionFeedbackProps = {
  tone: 'info' | 'success' | 'error';
  message: string;
  txHash?: string;
  txHref?: string;
};

const toneConfig = {
  success: {
    title: 'Success',
    icon: '✓',
    className: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  },
  error: {
    title: 'Action failed',
    icon: '!',
    className: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
  },
  info: {
    title: 'In progress',
    icon: '…',
    className: 'border-sky-400/20 bg-sky-500/10 text-sky-100',
  },
} as const;

export function ActionFeedback({ tone, message, txHash, txHref }: ActionFeedbackProps) {
  const config = toneConfig[tone];

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${config.className}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold">
          {config.icon}
        </span>
        <p className="text-sm font-semibold text-white">{config.title}</p>
      </div>
      <p className="mt-2 text-sm text-current/90">{message}</p>
      {txHash && txHref ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-current/90">
            Tx {txHash.slice(0, 10)}…
          </span>
          <a className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-current/90 underline-offset-2 hover:underline" href={txHref} target="_blank" rel="noreferrer">
            View on BaseScan
          </a>
        </div>
      ) : null}
    </div>
  );
}
