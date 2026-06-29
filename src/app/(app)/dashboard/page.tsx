import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/goals/ProgressBar";
import { formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, status: { in: ["ACTIVE", "PAUSED"] } },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  const completedGoals = await prisma.goal.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const completedCount = await prisma.goal.count({
    where: { userId: user.id, status: "COMPLETED" },
  });

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back{user.name ? `, ${user.name}` : ""}. Track your goals
            and progress.
          </p>
        </div>
        <Link href="/goals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New goal
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active goals" value={String(goals.length)} />
        <StatCard label="Completed" value={String(completedCount)} />
        <StatCard
          label="Avg. progress"
          value={
            goals.length
              ? formatPercent(
                  goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length
                )
              : "0%"
          }
        />
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Target className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Create your first goal
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Set a goal, add steps, and watch your progress bar move forward with
            every milestone you complete.
          </p>
          <Link href="/goals/new" className="mt-6 inline-block">
            <Button>New goal</Button>
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Active goals
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </>
      )}

      {completedGoals.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recently completed
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

type GoalCardProps = {
  goal: {
    id: string;
    title: string;
    percentage: number;
    steps: {
      id: string;
      title: string;
      percentage: number;
      completed: boolean;
      order: number;
    }[];
  };
};

function GoalCard({ goal }: GoalCardProps) {
  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
          {goal.title}
        </h3>
        <span className="shrink-0 text-sm font-semibold text-brand-600">
          {formatPercent(goal.percentage)}
        </span>
      </div>
      <div className="mb-3">
        <ProgressBar percentage={goal.percentage} steps={goal.steps} size="sm" />
      </div>
      <p className="text-xs text-slate-500">
        {goal.steps.filter((s) => s.completed).length} of {goal.steps.length}{" "}
        steps completed
      </p>
    </Link>
  );
}
