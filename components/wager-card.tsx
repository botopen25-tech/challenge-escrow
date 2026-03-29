'use client';

import { useAccount } from 'wagmi';
import { supportedChainId } from '@/lib/contract';
import { WagerView, shortenAddress } from '@/lib/sample-data';
import { StatusPill } from './status-pill';
import { WagerActions } from './wager-actions';

type TimelineStep = {
  label: string;
  detail: string;
  state: 'complete' | 'current' | 'upcoming';
};

type StateCopy = {
  badge: string;
  headline: string;
  helper: string;
  nextStepLabel: string;
  nextStepDetail: string;
  summaryLabel: string;
  summaryTone: 'neutral' | 'success' | 'warning' | 'danger';
};

type WalletGuidance = {
  tone: 'neutral' | 'warning' | 'danger' | 'success';
  title: string;
  body: string;
  roleLabel: string;
  roleBadge?: string;
};

function formatSettlementLabel(settlementState?: string, fallback?: string) {
  switch (settlementState) {
    case 'waitingOnOpponent':
      return 'Waiting on opponent';
    case 'awaitingVotes':
      return 'Waiting on votes';
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

function getStateCopy(wager: WagerView, role: 'Creator' | 'Opponent' | null): StateCopy {
  const state = formatSettlementLabel(wager.settlementState, wager.outcomeHint) ?? 'In progress';

  if (wager.status === 'Created') {
    return {
      badge: 'Waiting on opponent',
      headline: 'This wager is posted, but not locked yet.',
      helper: role === 'Opponent'
        ? 'You are the missing step right now. Accept the wager to lock both sides in and start the challenge.'
        : 'Nothing settles yet. The opponent still needs to accept before funds lock and the challenge officially starts.',
      nextStepLabel: role === 'Opponent' ? 'Next action for you' : 'Next action',
      nextStepDetail: role === 'Opponent'
        ? 'Approve USDC and accept the wager.'
        : 'Wait for the opponent to approve USDC and accept.',
      summaryLabel: 'Escrow is not funded by both sides yet',
      summaryTone: 'warning',
    };
  }

  if (wager.status === 'Resolved') {
    return {
      badge: 'Resolved',
      headline: 'Settlement is complete.',
      helper: 'Settlement finished on-chain. The agreed result has already been paid out from escrow.',
      nextStepLabel: 'What happens next',
      nextStepDetail: 'Nothing else is required. This wager is finished.',
      summaryLabel: 'Winner payout completed on-chain',
      summaryTone: 'success',
    };
  }

  if (wager.status === 'Refunded') {
    return {
      badge: 'Refunded',
      headline: 'This wager closed without a winner payout.',
      helper: 'Funds were returned from escrow instead of being paid to one side.',
      nextStepLabel: 'What happens next',
      nextStepDetail: 'Nothing else is required. This wager is closed.',
      summaryLabel: 'Funds returned from escrow',
      summaryTone: 'warning',
    };
  }

  if (wager.status === 'Disputed') {
    return {
      badge: 'Disputed',
      headline: 'The submitted outcomes do not match.',
      helper: 'The current votes do not line up cleanly. The next step is dispute or timeout refund handling, not another normal settlement vote.',
      nextStepLabel: 'Next action',
      nextStepDetail: 'Use the refund/dispute path that is currently available on-chain.',
      summaryLabel: 'Votes conflict, so normal settlement is blocked',
      summaryTone: 'danger',
    };
  }

  switch (wager.settlementState) {
    case 'awaitingVotes':
      return {
        badge: 'Waiting on votes',
        headline: 'The challenge is live, but no result has been submitted yet.',
        helper: role
          ? 'The wager is live, but nobody has submitted a result yet. Once one side votes, the next action will become obvious here.'
          : 'The wager is live, but neither side has submitted a result yet.',
        nextStepLabel: role ? 'Next action for you' : 'Next action',
        nextStepDetail: role ? 'Submit your result when the challenge is over.' : 'A participant needs to submit the first result vote.',
        summaryLabel: 'Challenge is active and waiting for the first settlement vote',
        summaryTone: 'neutral',
      };
    case 'waitingOnYourVote':
      return {
        badge: 'Waiting on your vote',
        headline: 'You are the next required step.',
        helper: 'Submit your result on-chain to move this wager toward agreement or dispute handling.',
        nextStepLabel: 'Next action for you',
        nextStepDetail: 'Submit your result vote on-chain.',
        summaryLabel: 'Settlement is blocked until you vote',
        summaryTone: 'warning',
      };
    case 'waitingOnOpponentVote':
      return {
        badge: 'Waiting on opponent vote',
        headline: 'Your vote is in. The other side still needs to respond.',
        helper: 'You already voted. Now the opponent needs to submit their result before this can settle.',
        nextStepLabel: 'Next action',
        nextStepDetail: 'Wait for the opponent to submit their result vote.',
        summaryLabel: 'Your side is done; waiting on the other participant',
        summaryTone: 'neutral',
      };
    case 'agreed':
      return {
        badge: 'Agreed',
        headline: 'Both sides submitted the same outcome.',
        helper: 'The wager is lined up for final settlement on-chain.',
        nextStepLabel: 'What happens next',
        nextStepDetail: 'The contract can finalize payout from escrow.',
        summaryLabel: 'Votes match and payout can complete',
        summaryTone: 'success',
      };
    case 'disputed':
      return {
        badge: 'Disputed',
        headline: 'The submitted outcomes conflict.',
        helper: 'Expect dispute or timeout handling next instead of an automatic payout.',
        nextStepLabel: 'What happens next',
        nextStepDetail: 'Use the fallback path available for this disputed wager.',
        summaryLabel: 'Conflicting votes require fallback resolution',
        summaryTone: 'danger',
      };
    default:
      return {
        badge: state,
        headline: state,
        helper: wager.settlementDetail ?? wager.outcomeHint,
        nextStepLabel: 'Next action',
        nextStepDetail: wager.nextStep ?? 'Check the wager actions below.',
        summaryLabel: state,
        summaryTone: 'neutral',
      };
  }
}

function getTimelineSteps(wager: WagerView): TimelineStep[] {
  const isCreated = wager.status === 'Created';
  const isAccepted = wager.status === 'Accepted';
  const isResolved = wager.status === 'Resolved';
  const isRefunded = wager.status === 'Refunded';
  const isDisputed = wager.status === 'Disputed';
  const isFinished = isResolved || isRefunded;

  return [
    {
      label: 'Created',
      detail: 'Challenge terms were posted.',
      state: 'complete',
    },
    {
      label: 'Accepted',
      detail: isCreated ? 'Waiting for the opponent to lock in.' : 'Both sides are locked into escrow.',
      state: isCreated ? 'current' : 'complete',
    },
    {
      label: isDisputed ? 'Disputed' : 'Result votes',
      detail: isAccepted
        ? wager.settlementState === 'waitingOnYourVote'
          ? 'Your vote is the next action.'
          : wager.settlementState === 'awaitingVotes'
            ? 'Neither side has voted yet.'
            : wager.settlementState === 'waitingOnOpponentVote'
              ? 'Opponent vote is the next action.'
              : wager.settlementState === 'agreed'
                ? 'Both votes match.'
                : wager.settlementState === 'disputed'
                  ? 'Votes conflict and need fallback handling.'
                  : 'Players confirm winner or tie.'
        : isDisputed
          ? 'Votes or timing forced dispute handling.'
          : isFinished
            ? 'Result voting is complete.'
            : 'Voting unlocks after acceptance.'
      ,
      state: isAccepted || isDisputed ? 'current' : isFinished ? 'complete' : 'upcoming',
    },
    {
      label: isRefunded ? 'Refunded' : 'Settled',
      detail: isResolved
        ? 'Winner paid from escrow.'
        : isRefunded
          ? 'Funds returned from escrow.'
          : isDisputed
            ? 'Waiting on dispute or timeout resolution.'
            : 'Final on-chain outcome.',
      state: isFinished ? 'complete' : isDisputed ? 'current' : 'upcoming',
    },
  ];
}

function getProgressValue(steps: TimelineStep[]) {
  const completeCount = steps.filter((step) => step.state === 'complete').length;
  const currentCount = steps.some((step) => step.state === 'current') ? 0.5 : 0;
  return Math.round(((completeCount + currentCount) / steps.length) * 100);
}

function getSummaryToneClasses(tone: StateCopy['summaryTone']) {
  switch (tone) {
    case 'success':
      return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100';
    case 'warning':
      return 'border-amber-400/20 bg-amber-500/10 text-amber-100';
    case 'danger':
      return 'border-orange-400/20 bg-orange-500/10 text-orange-100';
    default:
      return 'border-white/10 bg-slate-950/40 text-slate-200';
  }
}

function getWalletGuidance({
  isConnected,
  isWrongNetwork,
  role,
  creatorLabel,
  opponentLabel,
}: {
  isConnected: boolean;
  isWrongNetwork: boolean;
  role: 'Creator' | 'Opponent' | null;
  creatorLabel: string;
  opponentLabel: string;
}): WalletGuidance {
  if (!isConnected) {
    return {
      tone: 'warning',
      title: 'Connect a participant wallet',
      body: `Use the creator wallet (${creatorLabel}) or opponent wallet (${opponentLabel}) to unlock wager actions.`,
      roleLabel: 'Viewer',
      roleBadge: 'Not connected',
    };
  }

  if (isWrongNetwork) {
    return {
      tone: 'danger',
      title: 'Wrong network for this wager',
      body: 'This wallet is connected, but not on Base Sepolia. Switch networks before accepting, voting, settling, or claiming a refund.',
      roleLabel: role ?? 'Viewer',
      roleBadge: 'Wrong network',
    };
  }

  if (role === 'Creator') {
    return {
      tone: 'success',
      title: 'You are the creator on this wager',
      body: `This wallet matches the creator side (${creatorLabel}). You set the challenge terms and can submit a result after the wager is active.`,
      roleLabel: role,
      roleBadge: 'Creator wallet',
    };
  }

  if (role === 'Opponent') {
    return {
      tone: 'success',
      title: 'You are the opponent on this wager',
      body: `This wallet matches the opponent side (${opponentLabel}). Accept the wager first, then submit your result when the challenge ends.`,
      roleLabel: role,
      roleBadge: 'Opponent wallet',
    };
  }

  return {
    tone: 'warning',
    title: 'Connected wallet is not part of this wager',
    body: `Switch to the creator wallet (${creatorLabel}) or opponent wallet (${opponentLabel}) to take action on this challenge.`,
    roleLabel: 'Viewer',
    roleBadge: 'Wrong wallet',
  };
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
  const stateCopy = getStateCopy(wager, role);
  const timelineSteps = getTimelineSteps(wager);
  const progressValue = getProgressValue(timelineSteps);

  const walletGuidance = getWalletGuidance({
    isConnected,
    isWrongNetwork,
    role,
    creatorLabel,
    opponentLabel,
  });

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
        <StatusPill status={wager.status} label={stateCopy.badge} />
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
        <div className={`rounded-2xl border px-3 py-3 ${role === 'Creator' ? 'border-brand/40 bg-brand/10' : 'border-white/10 bg-transparent'}`}>
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Creator wallet</p>
            {role === 'Creator' ? <span className="rounded-full bg-brand/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">You</span> : null}
          </div>
          <p className="mt-1 font-medium text-white">{creatorLabel}</p>
          <p className="mt-1 text-xs text-slate-400">Started the wager and set the challenge terms.</p>
        </div>
        <div className={`rounded-2xl border px-3 py-3 ${role === 'Opponent' ? 'border-brand/40 bg-brand/10' : 'border-white/10 bg-transparent'}`}>
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Opponent wallet</p>
            {role === 'Opponent' ? <span className="rounded-full bg-brand/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">You</span> : null}
          </div>
          <p className="mt-1 font-medium text-white">{opponentLabel}</p>
          <p className="mt-1 text-xs text-slate-400">Needs to accept before funds are locked and settlement can start.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-white">What&apos;s happening now</p>
            <p className="mt-1 text-lg font-semibold text-white">{stateCopy.headline}</p>
          </div>
          <div className="min-w-[160px] text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Progress</p>
            <p className="mt-1 text-sm font-medium text-white">{progressValue}% complete</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-300">{stateCopy.helper}</p>
        <p className="mt-2 text-xs text-slate-500">{wager.settlementDetail ?? wager.outcomeHint}</p>

        <div className={`mt-4 rounded-2xl border px-3 py-3 text-sm ${getSummaryToneClasses(stateCopy.summaryTone)}`}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-current/70">Current settlement state</p>
          <p className="mt-1 font-medium text-current">{stateCopy.summaryLabel}</p>
        </div>

        <div className="mt-4 overflow-hidden rounded-full bg-slate-900/80">
          <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${progressValue}%` }} />
        </div>

        <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/10 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-brand/80">{stateCopy.nextStepLabel}</p>
          <p className="mt-1 font-medium text-white">{stateCopy.nextStepDetail}</p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {timelineSteps.map((step, index) => {
            const isCurrent = step.state === 'current';
            const isComplete = step.state === 'complete';
            return (
              <div
                key={`${step.label}-${index}`}
                className={`rounded-2xl border px-3 py-3 ${
                  isComplete
                    ? 'border-emerald-400/30 bg-emerald-500/10'
                    : isCurrent
                      ? 'border-brand/40 bg-brand/10'
                      : 'border-white/10 bg-slate-950/30'
                }`}
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      isComplete ? 'bg-emerald-300' : isCurrent ? 'bg-brand' : 'bg-slate-600'
                    }`}
                  />
                  {step.state}
                </div>
                <p className="mt-2 font-medium text-white">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{step.detail}</p>
              </div>
            );
          })}
        </div>

        <div className={`mt-3 rounded-xl border px-3 py-3 text-xs ${
          walletGuidance.tone === 'danger'
            ? 'border-orange-500/30 bg-orange-500/10 text-orange-100'
            : walletGuidance.tone === 'warning'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
              : walletGuidance.tone === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                : 'border-white/10 bg-slate-950/30 text-slate-300'
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">Wallet role:</span>
            <span>{walletGuidance.roleLabel}</span>
            {walletGuidance.roleBadge ? (
              <span className={`rounded-full px-2 py-1 uppercase tracking-[0.16em] ${
                walletGuidance.tone === 'danger'
                  ? 'bg-orange-500/20 text-orange-100'
                  : walletGuidance.tone === 'warning'
                    ? 'bg-amber-500/20 text-amber-100'
                    : walletGuidance.tone === 'success'
                      ? 'bg-emerald-500/20 text-emerald-100'
                      : 'bg-white/5 text-slate-300'
              }`}>
                {walletGuidance.roleBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-medium text-white">{walletGuidance.title}</p>
          <p className="mt-1">{walletGuidance.body}</p>
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
