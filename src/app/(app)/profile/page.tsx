import { getCurrentUser } from "@/lib/user";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-600">Your account details.</p>

      <ProfileForm
        initialName={user.name ?? ""}
        email={user.email}
        emailVerified={
          user.emailVerified
            ? user.emailVerified.toLocaleDateString(undefined, { dateStyle: "medium" })
            : null
        }
        memberSince={user.createdAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
      />
    </div>
  );
}
