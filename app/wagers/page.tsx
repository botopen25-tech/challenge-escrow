import Link from 'next/link';
import { ConnectWalletButton } from '@/components/connect-wallet-button';
import { LiveWagers } from '@/components/live-wagers';

export default function WagersPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="badge">Wagers</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Active and settled wagers</h1>
        </div>
        <ConnectWalletButton />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="button-secondary" href="/">Back home</Link>
        <Link className="button-primary" href="/create">Create a wager</Link>
      </div>

      <LiveWagers />
    </main>
  );
}
