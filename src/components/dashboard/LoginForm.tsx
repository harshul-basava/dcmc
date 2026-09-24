"use client";

import { useActionState } from "react";
import { signIn } from "@/app/dashboard/actions";

/**
 * The only client component on the sign-in path, and only so the error can be
 * shown without a round-trip through a query parameter. It is a plain form
 * with a server action, so it still submits with JavaScript disabled.
 */
export default function LoginForm({ returnTo }: { returnTo?: string }) {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="grid gap-3">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <label htmlFor="password" className="font-display text-2xl tracking-tight text-foreground">
        Password
      </label>

      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        maxLength={256}
        required
        autoFocus
        aria-invalid={state?.error ? "true" : "false"}
        aria-describedby={state?.error ? "password-error" : undefined}
        className="h-13 w-full rounded-card border border-rule bg-surface px-4 text-base text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.12)] aria-[invalid=true]:border-accent"
      />

      {state?.error ? (
        <span id="password-error" role="alert" className="-mt-1 text-xs text-accent">
          {state.error}
        </span>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-card bg-accent text-sm font-semibold tracking-[0.01em] text-on-accent transition hover:bg-accent-hover active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
