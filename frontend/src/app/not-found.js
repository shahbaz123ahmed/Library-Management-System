import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="card-surface max-w-lg rounded-3xl p-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Not found</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">This page is missing</h1>
        <p className="mt-2 text-sm text-slate-500">Return to the dashboard to continue.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
