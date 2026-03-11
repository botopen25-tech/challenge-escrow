'use client';

type ActionFeedbackProps = {
  tone: 'info' | 'success' | 'error';
  message: string;
  txHash?: string;
  txHref?: string;
};

export function ActionFeedback({ tone, message, txHash, txHref }: ActionFeedbackProps) {
  const toneClass = tone === 'success'
    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
    : tone === 'error'
      ? 'border-rose-400/20 bg-rose-500/10 text-rose-100'
      : 'border-sky-400/20 bg-sky-500/10 text-sky-100';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
      <p>{message}</p>
      {txHash && txHref ? (
        <a className="mt-2 inline-block text-xs underline" href={txHref} target="_blank" rel="noreferrer">
          View transaction {txHash.slice(0, 10)}... on BaseScan
        </a>
      ) : null}
    </div>
  );
}
