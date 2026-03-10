import { ConnectWalletButton } from '@/components/connect-wallet-button';
import { CreateWagerForm } from '@/components/create-wager-form';
import { LiveWagers } from '@/components/live-wagers';
import { MintUsdcCard } from '@/components/mint-usdc-card';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-6 sm:max-w-2xl sm:px-6 lg:max-w-5xl">
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="badge">ChallengeEscrow</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Friendly wagers. Clear rules. No awkward IOUs.</h1>
            </div>
            <ConnectWalletButton />
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">Create a one-on-one challenge, lock both deposits in escrow, then settle by mutual confirmation. If nobody agrees, the timeout path keeps funds from getting stuck forever.</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-white/5 p-3"><p className="text-slate-400">1. Mint</p><p className="mt-1 font-semibold text-white">Grab test USDC</p></div>
            <div className="rounded-2xl bg-white/5 p-3"><p className="text-slate-400">2. Create</p><p className="mt-1 font-semibold text-white">Open a wager</p></div>
            <div className="rounded-2xl bg-white/5 p-3"><p className="text-slate-400">3. Accept</p><p className="mt-1 font-semibold text-white">Friend confirms</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <MintUsdcCard />
        <CreateWagerForm />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="badge">Dashboard</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Your wagers</h2>
          </div>
          <p className="text-sm text-slate-400">Actions live inside each wager card</p>
        </div>
        <LiveWagers />
      </section>
    </main>
  );
}
