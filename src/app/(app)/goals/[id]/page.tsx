import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getOwnedGoal } from "@/lib/goal-auth";
import { GoalDetailClient } from "@/components/goals/GoalDetailClient";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const goal = await getOwnedGoal(id, user.id);

  if (!goal) {
    notFound();
  }

  return <GoalDetailClient goal={goal} />;
}
