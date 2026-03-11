'use client';

import { injected } from '@wagmi/core';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { supportedChainId } from '@/lib/contract';

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  if (isConnected && chainId !== supportedChainId) {
    return (
      <div className="space-y-2 text-right">
        <button
          className="rounded-2xl border border-amber-400/30 bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-50 shadow-[0_0_30px_rgba(245,158,11,0.18)]"
          onClick={() => switchChain({ chainId: supportedChainId })}
          disabled={isSwitching}
          type="button"
        >
          {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
        </button>
        <p className="text-xs text-amber-300">Wrong network. ChallengeEscrow only works on Base Sepolia right now.</p>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <button
        className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.14)]"
        onClick={() => disconnect()}
        type="button"
      >
        {shortenAddress(address)}
        <span className="mx-2 text-emerald-300/60">•</span>
        Disconnect
      </button>
    );
  }

  return (
    <div className="space-y-2 text-right">
      <button
        className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => connect({ connector: injected() })}
        disabled={isPending}
        type="button"
      >
        {isPending ? 'Connecting...' : 'Connect wallet'}
      </button>
      <p className="text-xs text-slate-400">Use the wallet that created or received the wager so the right actions unlock.</p>
    </div>
  );
}
