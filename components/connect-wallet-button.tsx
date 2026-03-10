'use client';

import { injected, useAccount, useConnect, useDisconnect } from 'wagmi';

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

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
    <button
      className="button-primary"
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      type="button"
    >
      {isPending ? 'Connecting...' : 'Connect MetaMask'}
    </button>
  );
}
