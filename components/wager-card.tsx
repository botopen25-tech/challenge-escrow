'use client';

import { useAccount } from 'wagmi';
import { WagerView } from '@/lib/sample-data';
import { StatusPill } from './status-pill';
import { WagerActions } from './wager-actions';

export function WagerCard({ wager }: { wager: WagerView }) {
  const { address } = useAccount();
  const role = !address
    ? null
    : wager.creatorAddress?.toLowerCase() === address.toLowerCase()
      ? 'Creator'
      : wager.opponentAddress?.toLowerCase() === address.toLowerCase()
        ? 'Opponent'
        : null;

  return (
    <article className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Wager #{wager.id}</p>
            {role ? <span className="rounded-full bg-brand/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">{role}</span> : null}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">{wager.title}</h3>
        </div>
        <StatusPill status={wager.status} />
      </div>

      <p className="text-sm leading-6 text-slate-300">{wager.details}</p>

      <dl className="grid grid-cols-2 gap-3 text-sm text-slate-300">
        <div>
          <dt className="text-slate-500">Stake</dt>
          <dd className="mt-1 font-medium text-white">{wager.stake}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Deadline</dt>
          <dd className="mt-1 font-medium text-white">{wager.deadline}</dd>
        </div>
      </dl>

      <p className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-300">{wager.outcomeHint}</p>
      <WagerActions wager={wager} />
    </article>
  );
}
