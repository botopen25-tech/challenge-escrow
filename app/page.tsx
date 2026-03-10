import { ConnectWalletButton } from '@/components/connect-wallet-button';
import { CreateWagerForm } from '@/components/create-wager-form';
import { LiveWagers } from '@/components/live-wagers';
import { MintUsdcCard } from '@/components/mint-usdc-card';
import { WagerActions } from '@/components/wager-actions';

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
            <div className="rounded-2xl bg-white/5 p-3"><p className="text-slate-400">Create</p><p className="mt-1 font-semibold text-white">Deposit once</p></div>
            <div className="rounded-2xl bg-white/5 p-3"><p className="text-slate-400">Accept</p><p className="mt-1 font-semibold text-white">Friend matches</p></div>
            <div className="rounded-2xl bg-white/5 p-3"><p className="text-slate-400">Settle</p><p className="mt-1 font-semibold text-white">Agree or timeout</p></div>
          </div>
        </div>
      </section>

      <MintUsdcCard />

      <CreateWagerForm />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="badge">Dashboard</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Your recent wagers</h2>
          </div>
          <p className="text-sm text-slate-400">Designed for quick mobile check-ins</p>
        </div>
        <LiveWagers />
      </section>

      <WagerActions wagerId={1} creator={'0x7915329107802f20Abe4217c38951B847f5c0Da5'} opponent={'0x5089f22CC4a15F61656A2c15B6f3782019A845CB'} />
    </main>
  );
}
