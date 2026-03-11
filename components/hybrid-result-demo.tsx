'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export function HybridResultDemo() {
  const { address } = useAccount();
  const [challengeId, setChallengeId] = useState('');
  const [status, setStatus] = useState('No hybrid challenge yet.');
  const [createdId, setCreatedId] = useState('');

  async function createDemoChallenge() {
    if (!address) {
      setStatus('Connect a wallet first.');
      return;
    }

    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Hybrid result flow test',
        details: 'Off-chain result coordination demo',
        stakeAmount: '25',
        creatorAddress: address,
        responseWindowHours: 24,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Could not create challenge');
      return;
    }

    setCreatedId(data.challenge.id);
    setChallengeId(data.challenge.id);
    setStatus(`Created hybrid challenge ${data.challenge.id}`);
  }

  async function submit(choice: 'creator_won' | 'opponent_won' | 'tie') {
    if (!address || !challengeId) {
      setStatus('Need a connected wallet and challenge id first.');
      return;
    }

    const res = await fetch(`/api/challenges/${challengeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: address, choice }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Could not submit result');
      return;
    }

    setStatus(`Result saved off-chain: ${choice} · agreement ${data.challenge.resultAgreement}`);
  }

  return (
    <section className="card space-y-3">
      <div>
        <p className="badge">Hybrid test</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Off-chain result coordination</h2>
      </div>
      <p className="text-sm text-slate-300">This is the first ugly-but-real hybrid slice: create a challenge record and submit results off-chain without touching the contract.</p>
      <button className="button-secondary w-full" onClick={createDemoChallenge} type="button">Create demo hybrid challenge</button>
      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Challenge ID</span>
        <input className="field" value={challengeId} onChange={(e) => setChallengeId(e.target.value)} placeholder="Paste challenge id" />
      </label>
      {createdId ? <p className="text-xs text-slate-400 break-all">Latest created: {createdId}</p> : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button className="button-secondary" onClick={() => submit('creator_won')} type="button">Creator won</button>
        <button className="button-secondary" onClick={() => submit('opponent_won')} type="button">Opponent won</button>
        <button className="button-secondary" onClick={() => submit('tie')} type="button">Tie</button>
      </div>
      <p className="text-sm text-slate-300 break-all">{status}</p>
    </section>
  );
}
