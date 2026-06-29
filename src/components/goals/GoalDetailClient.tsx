"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, CheckCircle2, Pencil, Plus } from "lucide-react";
import { Goal, GoalStatus, Step } from "@prisma/client";
import { ProgressBar } from "@/components/goals/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PRIORITY_LABELS } from "@/lib/goals";
import { formatPercent, cn } from "@/lib/utils";

type GoalWithSteps = Goal & { steps: Step[] };

function celebrationMessage(percentage: number): string {
  if (percentage >= 100) return "Goal complete — you did it!";
  if (percentage >= 75) return "Almost there — the finish line is in sight.";
  if (percentage >= 50) return "Halfway there — less road ahead than behind.";
  if (percentage >= 25) return "Great momentum — keep going!";
  return "Step complete — progress unlocked!";
}

export function GoalDetailClient({ goal: initial }: { goal: GoalWithSteps }) {
  const router = useRouter();
  const [goal, setGoal] = useState(initial);
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [addingStep, setAddingStep] = useState(false);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    };
  }, []);

  function showCelebration(message: string) {
    setCelebration(message);
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    celebrationTimer.current = setTimeout(() => setCelebration(null), 3500);
  }

  async function toggleStep(stepId: string) {
    const step = goal.steps.find((s) => s.id === stepId);
    const wasCompleted = step?.completed ?? false;

    setLoadingStepId(stepId);
    try {
      const res = await fetch(`/api/goals/${goal.id}/steps/${stepId}/toggle`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setGoal(data);
        if (!wasCompleted && data.percentage > goal.percentage) {
          showCelebration(celebrationMessage(data.percentage));
        }
      }
    } finally {
      setLoadingStepId(null);
    }
  }

  async function addStep(e: React.FormEvent) {
    e.preventDefault();
    const title = newStepTitle.trim();
    if (!title) return;

    setAddingStep(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoal(data);
        setNewStepTitle("");
      }
    } finally {
      setAddingStep(false);
    }
  }

  async function updateStatus(status: GoalStatus) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        if (status === "ARCHIVED") {
          router.push("/dashboard");
          router.refresh();
        } else {
          setGoal(data);
        }
      }
    } finally {
      setActionLoading(false);
    }
  }

  const sortedSteps = [...goal.steps].sort((a, b) => a.order - b.order);
  const nextStep = sortedSteps.find((s) => !s.completed);

  return (
    <div className="p-6 sm:p-8">
      {celebration && (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 shadow-lg transition-opacity sm:left-1/2 sm:-translate-x-1/2">
          {celebration}
        </div>
      )}

      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={goal.status} />
            {goal.priority > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {PRIORITY_LABELS[goal.priority]}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{goal.title}</h1>
          {goal.description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{goal.description}</p>
          )}
          {goal.deadline && (
            <p className="mt-2 text-sm text-slate-500">
              Deadline:{" "}
              {new Date(goal.deadline).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/goals/${goal.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          {goal.status !== "COMPLETED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => updateStatus("COMPLETED")}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark complete
            </Button>
          )}
          {goal.status !== "ARCHIVED" && (
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              onClick={() => updateStatus("ARCHIVED")}
              className="gap-1.5"
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProgressBar
          percentage={goal.percentage}
          steps={sortedSteps}
          size="lg"
        />
        {nextStep && goal.percentage < 100 && (
          <p className="mt-4 text-sm text-slate-600">
            Next up:{" "}
            <span className="font-medium text-slate-900">{nextStep.title}</span>
            {" — "}
            <span className="text-brand-600">{formatPercent(goal.percentage)} done</span>
          </p>
        )}
        {goal.percentage >= 100 && (
          <p className="mt-4 text-sm font-medium text-emerald-600">
            Goal complete — great work!
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Steps</h2>
          <p className="text-sm text-slate-500">
            Check off each step to advance your progress bar.
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {sortedSteps.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                disabled={loadingStepId === step.id}
                onClick={() => toggleStep(step.id)}
                className={cn(
                  "flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50",
                  step.completed && "bg-emerald-50/30",
                  loadingStepId === step.id && "opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                    step.completed
                      ? "scale-110 border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white"
                  )}
                >
                  {step.completed && <CheckCircle2 className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-medium text-slate-900 transition-colors",
                      step.completed && "text-slate-500 line-through"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-400">Step {index + 1}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-slate-500">
                  +{step.percentage}%
                </span>
              </button>
            </li>
          ))}
        </ul>

        {goal.type === "COMPLEX" && (
          <form
            onSubmit={addStep}
            className="flex gap-2 border-t border-slate-100 px-6 py-4"
          >
            <Input
              id="new-step"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              placeholder="Quick add a step…"
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={addingStep} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GoalStatus }) {
  const styles: Record<GoalStatus, string> = {
    ACTIVE: "bg-brand-100 text-brand-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PAUSED: "bg-slate-100 text-slate-600",
    ARCHIVED: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status]
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
