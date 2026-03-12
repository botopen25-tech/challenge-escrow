'use client';

import { useAccount } from 'wagmi';
import { supportedChainId } from '@/lib/contract';
import { WagerView, shortenAddress } from '@/lib/sample-data';
import { StatusPill } from './status-pill';
import { WagerActions } from './wager-actions';

function formatSettlementLabel(settlementState?: string, fallback?: string) {
  switch (settlementState) {
    case 'waitingOnOpponent':
      return 'Waiting on opponent';
    case 'waitingOnYourVote':
      return 'Waiting on your vote';
    case 'waitingOnOpponentVote':
      return 'Waiting on opponent vote';
    case 'agreed':
      return 'Agreed';
    case 'disputed':
      return 'Disputed';
    case 'refunded':
      return 'Refunded';
    case 'resolved':
      return 'Resolved';
    default:
      return fallback;
  }
}

export function WagerCard({ wager }: { wager: WagerView }) {
  const { address, chainId, isConnected } = useAccount();
  const role = !address
    ? null
    : wager.creatorAddress?.toLowerCase() === address.toLowerCase()
      ? 'Creator'
      : wager.opponentAddress?.toLowerCase() === address.toLowerCase()
        ? 'Opponent'
        : null;

  const creatorLabel = wager.creatorAddress ? shortenAddress(wager.creatorAddress) : wager.creator;
  const opponentLabel = wager.opponentAddress ? shortenAddress(wager.opponentAddress) : wager.opponent;
  const isWrongNetwork = isConnected && chainId !== supportedChainId;

  const roleGuidance = !isConnected
    ? 'Connect the wallet that created or received this challenge to unlock the right actions.'
    : isWrongNetwork
      ? 'This wallet is connected on the wrong network. Switch to Base Sepolia to accept, vote, or claim a refund.'
      : role === 'Creator'
        ? 'You are the creator on this wager. You can wait for acceptance, then confirm the outcome once the challenge ends.'
        : role === 'Opponent'
          ? 'You are the opponent on this wager. Accept the wager first, then submit your result when the challenge is over.'
          : 'This connected wallet is not one of the two wager participants. Switch to the creator or opponent wallet to take action.';

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

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-3 text-sm text-slate-300 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Creator wallet</p>
          <p className="mt-1 font-medium text-white">{creatorLabel}</p>
          <p className="mt-1 text-xs text-slate-400">Started the wager and set the challenge terms.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Opponent wallet</p>
          <p className="mt-1 font-medium text-white">{opponentLabel}</p>
          <p className="mt-1 text-xs text-slate-400">Needs to accept before funds are locked and settlement can start.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-white">Current state</p>
          {wager.nextStep ? <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">{wager.nextStep}</span> : null}
        </div>
        <p className="mt-1 text-white">{formatSettlementLabel(wager.settlementState, wager.outcomeHint)}</p>
        <p className="mt-2 text-xs text-slate-400">{wager.settlementDetail ?? wager.outcomeHint}</p>
        <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${isWrongNetwork ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-white/10 bg-slate-950/30 text-slate-300'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">Wallet role:</span>
            <span>{role ?? 'Viewer'}</span>
            {isConnected ? (
              <span className={`rounded-full px-2 py-1 uppercase tracking-[0.16em] ${isWrongNetwork ? 'bg-amber-500/20 text-amber-100' : 'bg-white/5 text-slate-300'}`}>
                {isWrongNetwork ? 'Wrong network' : 'Ready on Base Sepolia'}
              </span>
            ) : null}
          </div>
          <p className="mt-2">{roleGuidance}</p>
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
