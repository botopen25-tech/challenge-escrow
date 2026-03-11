import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-full flex-col gap-8">
      <section className="card overflow-hidden border-brand/20 bg-gradient-to-br from-emerald-500/10 via-white/5 to-cyan-500/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-5">
            <p className="badge">ChallengeEscrow</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Set the line. Lock the pool. Settle on-chain.</h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              ChallengeEscrow turns friend-to-friend bets into a clean, sportsbook-style flow. Both sides lock funds into escrow, then the app guides the wager from challenge to result without the awkward "pay me later" nonsense.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="button-primary" href="/create">Create a wager</Link>
              <Link className="button-secondary" href="/wagers">View active wagers</Link>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">How it works</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-slate-500">1. Fund</p>
                  <p className="mt-1 font-medium text-white">Load test USDC and set your stake</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-slate-500">2. Challenge</p>
                  <p className="mt-1 font-medium text-white">Send the wager to your opponent on Base Sepolia</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-slate-500">3. Settle</p>
                  <p className="mt-1 font-medium text-white">Both sides agree on-chain and the pool pays out</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="card space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Why it feels better</p>
          <h2 className="text-xl font-semibold text-white">No chasing people down</h2>
          <p className="text-sm leading-6 text-slate-300">Escrow holds the pool up front, so the app handles the awkward part before the challenge begins.</p>
        </article>
        <article className="card space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Built for mobile</p>
          <h2 className="text-xl font-semibold text-white">Wallet-first flow</h2>
          <p className="text-sm leading-6 text-slate-300">Connect, fund, create, accept, settle. The app is centered around a clean action flow instead of a giant admin dashboard.</p>
        </article>
        <article className="card space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current network</p>
          <h2 className="text-xl font-semibold text-white">Base Sepolia testnet</h2>
          <p className="text-sm leading-6 text-slate-300">The current version runs on Base Sepolia with MockUSDC so the whole product can be tested end-to-end without real money risk.</p>
        </article>
      </section>
    </main>
  );
}
