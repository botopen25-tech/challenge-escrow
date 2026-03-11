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
          className="button-primary"
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
        className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100"
        onClick={() => disconnect()}
        type="button"
      >
        {shortenAddress(address)} · Disconnect
      </button>
    );
  }

  return (
    <div className="space-y-2 text-right">
      <button
        className="button-primary"
        onClick={() => connect({ connector: injected() })}
        disabled={isPending}
        type="button"
      >
        {isPending ? 'Connecting...' : 'Connect MetaMask'}
      </button>
      <p className="text-xs text-slate-400">Use the wallet that created or received the wager so the right actions unlock.</p>
    </div>
  );
}
