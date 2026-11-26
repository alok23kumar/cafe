"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coffee, Loader2, Lock } from "lucide-react";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      router.push("/admin");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Failed to authenticate. Check your Supabase credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-cafe-bg px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-cafe-border bg-cafe-surface p-8 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-cafe-muted hover:text-cafe-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Storefront</span>
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cafe-accent/40 bg-cafe-bg text-cafe-accent">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-cafe-cream">
              Owner Admin Login
            </h1>
            <p className="text-xs text-cafe-muted">
              Ember &amp; Bean Live Counter &amp; Stock Console
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cafe-muted">
              Admin Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@emberandbean.in"
              className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-bg px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-cafe-muted">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-cafe-border bg-cafe-bg px-3.5 py-2.5 text-sm text-cafe-cream focus:border-cafe-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-cafe-nonveg/40 bg-cafe-nonveg/10 p-3 text-xs text-cafe-nonveg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-cafe-accent py-3 text-sm font-semibold text-cafe-bg transition hover:bg-cafe-accent-hover disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span>Sign In to Counter</span>
          </button>
        </form>
      </div>
    </main>
  );
}
