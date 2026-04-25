import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">HomeLoop</h1>
      <p className="text-neutral-500 mt-3 max-w-md">
        Your home, organized and handled. Track maintenance, manage systems,
        store documents, and never miss what matters.
      </p>
      <div className="flex gap-3 mt-8">
        <Link
          href="/signup"
          className="bg-neutral-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="border border-neutral-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
