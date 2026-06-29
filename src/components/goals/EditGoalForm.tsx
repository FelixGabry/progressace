"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Goal, GoalStatus, Step } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  equalSplitPercentages,
  validateStepPercentages,
} from "@/lib/goals";

type GoalWithSteps = Goal & { steps: Step[] };

type StepDraft = {
  id?: string;
  title: string;
  percentage: number;
};

export function EditGoalForm({ goal: initial }: { goal: GoalWithSteps }) {
  const router = useRouter();
  const sorted = [...initial.steps].sort((a, b) => a.order - b.order);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [deadline, setDeadline] = useState(
    initial.deadline
      ? new Date(initial.deadline).toISOString().slice(0, 10)
      : ""
  );
  const [priority, setPriority] = useState(String(initial.priority));
  const [status, setStatus] = useState<GoalStatus>(initial.status);
  const [steps, setSteps] = useState<StepDraft[]>(
    sorted.map((s) => ({ id: s.id, title: s.title, percentage: s.percentage }))
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isComplex = initial.type === "COMPLEX";
  const percentageSum = steps.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);

  function addStep() {
    const splits = equalSplitPercentages(steps.length + 1);
    setSteps((current) =>
      current
        .map((s, i) => ({ ...s, percentage: splits[i] }))
        .concat({ title: "", percentage: splits[splits.length - 1] })
    );
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== index);
    const splits = equalSplitPercentages(next.length);
    setSteps(next.map((s, i) => ({ ...s, percentage: splits[i] })));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateStep(index: number, field: "title" | "percentage", value: string) {
    setSteps((current) =>
      current.map((step, i) =>
        i === index
          ? {
              ...step,
              [field]: field === "percentage" ? Number(value) || 0 : value,
            }
          : step
      )
    );
  }

  function equalizePercentages() {
    const splits = equalSplitPercentages(steps.length);
    setSteps((current) =>
      current.map((s, i) => ({ ...s, percentage: splits[i] }))
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const filledSteps = isComplex
      ? steps.filter((s) => s.title.trim())
      : [];

    if (isComplex && filledSteps.length === 0) {
      setLoading(false);
      setError("Add at least one step.");
      return;
    }

    if (isComplex) {
      const validationError = validateStepPercentages(
        filledSteps.map((s) => s.percentage)
      );
      if (validationError) {
        setLoading(false);
        setError(validationError);
        return;
      }
    }

    try {
      const goalRes = await fetch(`/api/goals/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          priority: Number(priority),
          status,
        }),
      });

      if (!goalRes.ok) {
        const data = await goalRes.json();
        setLoading(false);
        setError(data.error ?? "Failed to update goal.");
        return;
      }

      if (isComplex) {
        const stepsRes = await fetch(`/api/goals/${initial.id}/steps`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            steps: filledSteps.map((s) => ({
              id: s.id,
              title: s.title.trim(),
              percentage: s.percentage,
            })),
          }),
        });

        if (!stepsRes.ok) {
          const data = await stepsRes.json();
          setLoading(false);
          setError(data.error ?? "Failed to save steps.");
          return;
        }
      }

      router.push(`/goals/${initial.id}`);
      router.refresh();
    } catch {
      setLoading(false);
      setError("Could not reach the server.");
    }
  }

  async function handleDeleteGoal() {
    if (!confirm("Delete this goal permanently? This cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${initial.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to delete goal.");
        setLoading(false);
      }
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <Link
        href={`/goals/${initial.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to goal
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">Edit goal</h1>
      <p className="mt-1 text-sm text-slate-600">
        Update details, steps, and percentages.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
        <Input
          id="title"
          label="Goal title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="deadline"
            label="Deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div className="space-y-1.5">
            <label htmlFor="priority" className="block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="0">Normal</option>
              <option value="1">High</option>
              <option value="2">Urgent</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as GoalStatus)}
            className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {isComplex && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">Steps</span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium ${
                    percentageSum === 100 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  Total: {percentageSum}%
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={equalizePercentages}>
                  Equal split
                </Button>
              </div>
            </div>

            {steps.map((step, index) => (
              <div key={step.id ?? `new-${index}`} className="flex gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveStep(index, -1)}
                    className="flex h-5 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === steps.length - 1}
                    onClick={() => moveStep(index, 1)}
                    className="flex h-5 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  id={`step-${index}`}
                  value={step.title}
                  onChange={(e) => updateStep(index, "title", e.target.value)}
                  placeholder={`Step ${index + 1}`}
                  className="flex-1"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={step.percentage}
                  onChange={(e) => updateStep(index, "percentage", e.target.value)}
                  className="h-11 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  aria-label={`Step ${index + 1} percentage`}
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-red-500"
                    aria-label="Remove step"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1">
              <Plus className="h-4 w-4" />
              Add step
            </Button>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleDeleteGoal}
            className="text-red-600 hover:text-red-700"
          >
            Delete goal
          </Button>
        </div>
      </form>
    </div>
  );
}
