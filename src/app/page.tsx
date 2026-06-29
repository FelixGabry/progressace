import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Route } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: Route,
    title: "See the full path",
    description:
      "Break big goals into clear steps. Know exactly where you are and what comes next.",
  },
  {
    icon: BarChart3,
    title: "Measure every step",
    description:
      "Weighted milestones show real progress — not just checked boxes on a endless list.",
  },
  {
    icon: CheckCircle2,
    title: "Stay motivated",
    description:
      "Each completed step moves the bar forward. Small wins keep you moving toward the finish.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/60 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 inline-flex rounded-full border border-brand-200 bg-brand-50 px-4 py-1 text-sm font-medium text-brand-700">
                Goal-centric progress tracking
              </p>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Turn goals into{" "}
                <span className="text-brand-600">measurable progress</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
                ProgressAce does not just remind you what to do. It shows you
                where you are going, how much you have already done, and how much
                remains to reach the result.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Log in
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">
                  Publish my website
                </span>
                <span className="font-semibold text-brand-600">60%</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-all"
                  style={{ width: "60%" }}
                />
                <div className="absolute inset-y-0 left-[25%] w-0.5 bg-white/80" />
                <div className="absolute inset-y-0 left-[50%] w-0.5 bg-white/80" />
                <div className="absolute inset-y-0 left-[75%] w-0.5 bg-white/80" />
              </div>
              <ul className="mt-6 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Plan the project
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Create the design
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Build the frontend
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-300" />
                  Connect domain
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-300" />
                  Publish
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Not a to-do list. A progress system.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              The unit is the goal — not scattered tasks. Every step exists to
              move you closer to something that matters.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
