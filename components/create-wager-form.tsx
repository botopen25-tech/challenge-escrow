'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, defaultStake, supportedChainId, toUsdcAmount, usdcAbi } from '@/lib/contract';
import { baseSepoliaTxUrl } from '@/lib/explorer';
import { ActionFeedback } from './action-feedback';

const initialState = {
  opponent: '',
  stake: defaultStake,
  title: '',
  details: '',
  responseWindowHours: '24',
};

const quickStarts = [
  {
    label: 'Weekend fitness bet',
    title: 'Weekend workout challenge',
    details: 'Both sides post an Apple Fitness, Strava, or screenshot update by Sunday night. Missed proof loses.',
    responseWindowHours: '24',
  },
  {
    label: 'Game night wager',
    title: 'Friday night 1v1',
    details: 'Best-of-3. Both players confirm the result in the app right after the match ends.',
    responseWindowHours: '12',
  },
  {
    label: 'Custom',
    title: '',
    details: '',
    responseWindowHours: '24',
  },
] as const;

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function CreateWagerForm() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState<string>('');
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info');
  const [txHash, setTxHash] = useState<string>('');

  const hasContracts = Boolean(contractAddresses.escrow && contractAddresses.usdc);
  const onSupportedChain = chainId === supportedChainId;

  const trimmedTitle = form.title.trim();
  const trimmedDetails = form.details.trim();
  const trimmedOpponent = form.opponent.trim();
  const stakeNumber = Number(form.stake);
  const responseWindowNumber = Number(form.responseWindowHours);

  const fieldErrors = {
    opponent: trimmedOpponent.length === 0 ? 'Add your opponent wallet address.' : !isAddress(trimmedOpponent) ? 'Enter a full 0x wallet address.' : '',
    stake: !Number.isFinite(stakeNumber) || stakeNumber <= 0 ? 'Stake must be greater than 0 USDC.' : '',
    responseWindowHours:
      !Number.isFinite(responseWindowNumber) || responseWindowNumber < 1 || responseWindowNumber > 168
        ? 'Choose a response window between 1 and 168 hours.'
        : '',
    title: trimmedTitle.length < 4 ? 'Add a short title so both sides know the challenge.' : '',
    details: trimmedDetails.length < 12 ? 'Explain the rules or proof so settlement is obvious later.' : '',
  };

  const hasValidationErrors = Object.values(fieldErrors).some(Boolean);
  const ready = hasContracts && isConnected && onSupportedChain && !hasValidationErrors;
  const summary = useMemo(
    () => `${form.stake || '0'} USDC · ${form.responseWindowHours || '0'}h response window · ${trimmedTitle || 'Untitled challenge'}`,
    [form, trimmedTitle],
  );

  function applyQuickStart(index: number) {
    const preset = quickStarts[index];
    setForm((current) => ({
      ...current,
      title: preset.title,
      details: preset.details,
      responseWindowHours: preset.responseWindowHours,
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTxHash('');

    if (!hasContracts || !contractAddresses.escrow || !contractAddresses.usdc) {
      setTone('error');
      setMessage('Missing contract config. Set NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS and NEXT_PUBLIC_USDC_ADDRESS.');
      return;
    }

    if (!isConnected) {
      setTone('error');
      setMessage('Connect your wallet first.');
      return;
    }

    if (!onSupportedChain) {
      setTone('error');
      setMessage('Switch your wallet to Base Sepolia first.');
      return;
    }

    if (hasValidationErrors) {
      setTone('error');
      setMessage('Clean up the highlighted fields before creating the wager.');
      return;
    }

    if (!publicClient) {
      setTone('error');
      setMessage('Public client unavailable. Refresh and try again.');
      return;
    }

    try {
      const stakeAmount = toUsdcAmount(form.stake);

      setTone('info');
      setMessage('Approving USDC in your wallet...');
      const approvalHash = await writeContractAsync({
        address: contractAddresses.usdc,
        abi: usdcAbi,
        functionName: 'approve',
        args: [contractAddresses.escrow, stakeAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });

      setTone('info');
      setMessage('Approval confirmed. Create the wager in your wallet.');

      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName: 'createWager',
        args: [
          trimmedOpponent as `0x${string}`,
          contractAddresses.usdc,
          stakeAmount,
          BigInt(Number(form.responseWindowHours) * 60 * 60),
          trimmedTitle,
          trimmedDetails,
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setTxHash(hash);
      setTone('success');
      setMessage('Wager confirmed on-chain.');
      setForm(initialState);
    } catch (error) {
      setTone('error');
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  return (
    <form className="card space-y-5" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="badge">Create a wager</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Challenge a friend in under a minute</h2>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        <p className="font-medium text-white">Before you submit</p>
        <ul className="mt-2 space-y-1 text-emerald-50/90">
          <li>• You fund your side first, then send the invite.</li>
          <li>• Your opponent must accept from Base Sepolia to lock the full pool.</li>
          <li>• Clear rules now make settlement way less annoying later.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {quickStarts.map((preset, index) => (
            <button key={preset.label} className="button-secondary px-3 py-2 text-sm" onClick={() => applyQuickStart(index)} type="button">
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">Quick starts fill in a title, proof notes, and response window so you are not staring at a blank form.</p>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Opponent wallet</span>
        <input
          className="field"
          placeholder="0x..."
          value={form.opponent}
          onChange={(e) => setForm({ ...form, opponent: e.target.value })}
        />
        <p className="text-xs text-slate-400">Paste the wallet that needs to accept this wager.</p>
        {fieldErrors.opponent ? <p className="text-xs text-rose-300">{fieldErrors.opponent}</p> : null}
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">Stake (USDC)</span>
          <input className="field" inputMode="decimal" value={form.stake} onChange={(e) => setForm({ ...form, stake: e.target.value })} />
          <p className="text-xs text-slate-400">This is your side of the wager. Your opponent matches the same amount.</p>
          {fieldErrors.stake ? <p className="text-xs text-rose-300">{fieldErrors.stake}</p> : null}
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">Response window (hours)</span>
          <input
            className="field"
            inputMode="numeric"
            value={form.responseWindowHours}
            onChange={(e) => setForm({ ...form, responseWindowHours: e.target.value })}
          />
          <p className="text-xs text-slate-400">How long the other side has to accept before the invite feels stale.</p>
          {fieldErrors.responseWindowHours ? <p className="text-xs text-rose-300">{fieldErrors.responseWindowHours}</p> : null}
        </label>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Challenge title</span>
        <input className="field" placeholder="Sunday 10k" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <p className="text-xs text-slate-400">Keep it short enough to scan on a wager card.</p>
        {fieldErrors.title ? <p className="text-xs text-rose-300">{fieldErrors.title}</p> : null}
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Rules / proof notes</span>
        <textarea
          className="field min-h-28"
          placeholder="How the result will be verified..."
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
        />
        <p className="text-xs text-slate-400">Write the proof source, deadline, and what counts as a win. Future-you will thank you.</p>
        {fieldErrors.details ? <p className="text-xs text-rose-300">{fieldErrors.details}</p> : null}
      </label>

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-white">Summary</p>
        <p className="mt-1">{summary}</p>
        <p className="mt-2 text-xs text-slate-400">Connected wallet: {address ?? 'not connected'}</p>
        <p className="mt-1 text-xs text-slate-400">Network: {chainId === supportedChainId ? 'Base Sepolia' : 'wrong network or not connected'}</p>
        {!ready ? (
          <p className="mt-2 text-xs text-amber-200">Finish the required fields, connect your wallet, and stay on Base Sepolia before you open the wallet approval flow.</p>
        ) : (
          <p className="mt-2 text-xs text-emerald-200">Looks good. Next up: approve USDC, then confirm the wager transaction.</p>
        )}
      </div>

      <button className="button-primary w-full" disabled={!ready || isPending} type="submit">
        {isPending ? 'Waiting for wallet...' : 'Approve USDC and create challenge'}
      </button>
      {message ? <ActionFeedback tone={tone} message={message} txHash={txHash} txHref={baseSepoliaTxUrl(txHash)} /> : null}
    </form>
  );
}
