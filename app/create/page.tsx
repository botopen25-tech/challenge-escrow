import Link from 'next/link';
import { ConnectWalletButton } from '@/components/connect-wallet-button';
import { CreateWagerForm } from '@/components/create-wager-form';
import { MintUsdcCard } from '@/components/mint-usdc-card';

export default function CreatePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="badge">Create wager</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Build the line and fund your side</h1>
        </div>
        <ConnectWalletButton />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="button-secondary" href="/">Back home</Link>
        <Link className="button-secondary" href="/wagers">Go to wagers</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.2fr]">
        <MintUsdcCard />
        <CreateWagerForm />
      </div>
    </main>
  );
}
