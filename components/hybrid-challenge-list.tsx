'use client';

import { useEffect, useState } from 'react';
import type { HybridChallenge } from '@/lib/hybrid-types';

function labelForStatus(status: HybridChallenge['status']) {
  switch (status) {
    case 'pending_creator_funding': return 'Waiting for creator funding';
    case 'pending_opponent': return 'Waiting for opponent';
    case 'active': return 'Active';
    case 'awaiting_settlement': return 'Awaiting settlement';
    case 'resolved': return 'Resolved';
    case 'refunded': return 'Refunded';
    case 'disputed': return 'Disputed';
    case 'expired': return 'Expired';
    default: return 'Draft';
  }
}

function short(address?: string) {
  if (!address) return '—';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function HybridChallengeList() {
  const [challenges, setChallenges] = useState<HybridChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/challenges', { cache: 'no-store' });
        const data = await res.json();
        setChallenges(data.challenges ?? []);
      } catch {
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="badge">Hybrid challenges</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Off-chain coordination layer</h2>
        </div>
        <p className="text-sm text-slate-400">Create, share, agree</p>
      </div>

      {loading ? <p className="text-sm text-slate-400">Loading hybrid challenges...</p> : null}

      {!loading && !challenges.length ? (
        <p className="text-sm text-slate-400">No hybrid challenges yet. Create one with the hybrid test card.</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {challenges.map((challenge) => (
          <article key={challenge.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{challenge.id.slice(0, 8)}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{challenge.title}</h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{labelForStatus(challenge.status)}</span>
            </div>
            <p className="text-sm text-slate-300">{challenge.details || 'No details yet.'}</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div>
                <p className="text-slate-500">Stake</p>
                <p className="mt-1 text-white">{challenge.stakeAmount} {challenge.tokenSymbol}</p>
              </div>
              <div>
                <p className="text-slate-500">Agreement</p>
                <p className="mt-1 text-white">{challenge.resultAgreement ?? 'pending'}</p>
              </div>
              <div>
                <p className="text-slate-500">Creator</p>
                <p className="mt-1 text-white">{short(challenge.creatorAddress)}</p>
              </div>
              <div>
                <p className="text-slate-500">Opponent</p>
                <p className="mt-1 text-white">{short(challenge.opponentAddress)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
