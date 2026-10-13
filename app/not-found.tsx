import Link from 'next/link';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 max-w-md w-full shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Page Not Found (404)
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          The requested page or resource could not be found. Please verify the URL or return to the WiFi Check dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 transition-colors"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to Dashboard
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Assessment History
          </Link>
        </div>
      </div>
    </div>
  );
}

