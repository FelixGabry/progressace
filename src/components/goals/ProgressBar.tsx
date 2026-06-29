import { cn, formatPercent } from "@/lib/utils";
import { cumulativeStepPositions } from "@/lib/goals";

export type ProgressStep = {
  id: string;
  title: string;
  percentage: number;
  completed: boolean;
  order: number;
};

type ProgressBarProps = {
  percentage: number;
  steps?: ProgressStep[];
  size?: "sm" | "lg";
  className?: string;
};

export function ProgressBar({
  percentage,
  steps = [],
  size = "lg",
  className,
}: ProgressBarProps) {
  const isLarge = size === "lg";
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const markers = cumulativeStepPositions(sorted);

  return (
    <div className={cn("w-full", className)}>
      {isLarge && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Progress</span>
          <span className="font-semibold text-brand-600">
            {formatPercent(percentage)}
          </span>
        </div>
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-slate-200",
          isLarge ? "h-4" : "h-2"
        )}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />

        {isLarge &&
          sorted.map((step, index) => {
            const position = markers[index];
            return (
              <div
                key={step.id}
                className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${position}%` }}
                title={`${step.title} (${position}%)`}
              >
                <div
                  className={cn(
                    "rounded-full border-2 border-white shadow-sm transition-colors",
                    isLarge ? "h-3.5 w-3.5" : "h-2 w-2",
                    step.completed ? "bg-emerald-500" : "bg-slate-300"
                  )}
                />
              </div>
            );
          })}
      </div>

      {isLarge && sorted.length > 0 && (
        <ul className="mt-6 space-y-2">
          {sorted.map((step, index) => (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-3 text-sm",
                step.completed ? "text-slate-500" : "text-slate-700"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  step.completed
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {step.completed ? "✓" : index + 1}
              </span>
              <span className={cn(step.completed && "line-through")}>
                {step.title}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {step.percentage}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
