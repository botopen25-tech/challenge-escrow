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

  const roleGuidance = !address
    ? 'Connect a wallet to see whether you are the creator or the opponent.'
    : role === 'Creator'
      ? 'You created this wager. Your opponent must accept before settlement can begin.'
      : role === 'Opponent'
        ? 'You were challenged on this wager. Accept it or submit your result when the wager is active.'
        : 'This connected wallet is not part of this wager.';

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

      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-white">Current state</p>
          {wager.nextStep ? <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">{wager.nextStep}</span> : null}
        </div>
        <p className="mt-1 text-white">{wager.settlementState ?? wager.outcomeHint}</p>
        <p className="mt-2 text-xs text-slate-400">{wager.settlementDetail ?? wager.outcomeHint}</p>
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-xs text-slate-300">
          <span className="font-medium text-white">Wallet role:</span> {role ?? 'Viewer'} · {roleGuidance}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-400 sm:grid-cols-3">
          <div><span className="text-slate-500">Your pick:</span> {wager.myVote ?? 'Waiting'}</div>
          <div><span className="text-slate-500">Creator:</span> {wager.creatorVote ?? 'Waiting'}</div>
          <div><span className="text-slate-500">Opponent:</span> {wager.opponentVote ?? 'Waiting'}</div>
        </div>
      </div>

      <WagerActions wager={wager} />
    </article>
  );
}
