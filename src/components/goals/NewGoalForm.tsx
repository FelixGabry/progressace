"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { equalSplitPercentages } from "@/lib/goals";

type GoalTypeChoice = "SIMPLE" | "COMPLEX";

type StepDraft = { title: string };

export function NewGoalForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalTypeChoice>("COMPLEX");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("0");
  const [steps, setSteps] = useState<StepDraft[]>([
    { title: "" },
    { title: "" },
    { title: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addStep() {
    setSteps((s) => [...s, { title: "" }]);
  }

  function removeStep(index: number) {
    setSteps((s) => s.filter((_, i) => i !== index));
  }

  function updateStep(index: number, value: string) {
    setSteps((s) => s.map((step, i) => (i === index ? { title: value } : step)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const filledSteps = steps.filter((s) => s.title.trim());

    if (type === "COMPLEX" && filledSteps.length === 0) {
      setLoading(false);
      setError("Add at least one step for a complex goal.");
      return;
    }

    const splits = equalSplitPercentages(filledSteps.length);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      priority: Number(priority),
      steps:
        type === "COMPLEX"
          ? filledSteps.map((s, i) => ({
              title: s.title.trim(),
              percentage: splits[i],
            }))
          : undefined,
    };

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Failed to create goal.");
        return;
      }

      router.push(`/goals/${data.id}`);
      router.refresh();
    } catch {
      setLoading(false);
      setError("Could not reach the server.");
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">New goal</h1>
      <p className="mt-1 text-sm text-slate-600">
        Set a goal and define the steps that move your progress bar forward.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
        <Input
          id="title"
          label="Goal title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Publish my website"
        />

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="What does success look like?"
          />
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-700">Goal type</span>
          <div className="grid grid-cols-2 gap-3">
            <TypeOption
              selected={type === "SIMPLE"}
              onClick={() => setType("SIMPLE")}
              title="Simple"
              description="One action — 0% to 100% when done"
            />
            <TypeOption
              selected={type === "COMPLEX"}
              onClick={() => setType("COMPLEX")}
              title="Complex"
              description="Multiple steps with a progress path"
            />
          </div>
        </div>

        {type === "COMPLEX" && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Steps</span>
              <span className="text-xs text-slate-500">
                Percentages split equally (100% total)
              </span>
            </div>
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  id={`step-${index}`}
                  value={step.title}
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                  className="flex-1"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="deadline"
            label="Deadline (optional)"
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

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Creating…" : "Create goal"}
        </Button>
      </form>
    </div>
  );
}

function TypeOption({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </button>
  );
}
