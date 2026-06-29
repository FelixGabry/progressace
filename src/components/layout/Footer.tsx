import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} ProgressAce. Turn goals into measurable
          progress.
        </p>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link href="/login" className="hover:text-slate-900">
            Log in
          </Link>
          <Link href="/register" className="hover:text-slate-900">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
