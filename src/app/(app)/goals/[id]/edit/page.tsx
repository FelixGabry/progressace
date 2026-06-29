import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { getOwnedGoal } from "@/lib/goal-auth";
import { EditGoalForm } from "@/components/goals/EditGoalForm";

export default async function EditGoalPage({
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

  return <EditGoalForm goal={goal} />;
}
