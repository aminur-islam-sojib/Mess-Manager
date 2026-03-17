import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(16,185,129,0.2),transparent_40%),linear-gradient(160deg,#020617_0%,#0b1220_45%,#0f172a_100%)]" />

      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full border border-cyan-300/20" />
      <div className="pointer-events-none absolute bottom-10 right-8 h-56 w-56 rounded-full border border-emerald-300/20" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 md:px-10 md:py-10">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Mess Manager
          </div>
          <Link
            href="/auth/login"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Login
          </Link>
        </header>

        <div className="grid items-end gap-10 pb-10 pt-16 md:grid-cols-2 md:gap-16 md:py-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Operational Clarity
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white md:text-6xl">
              Built for disciplined, scalable mess operations.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-300 md:text-base">
              A streamlined platform for tracking meals, shared costs, and
              day-to-day accountability across teams.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Workflow
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                Create mess, invite members, monitor all shared costs.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Accuracy
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                Single source of truth for meals, expenses, and balances.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
