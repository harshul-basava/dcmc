import type { ReactNode } from "react";
import { unlockDirectory } from "./actions";
import { conference } from "@/content/site";
import "../dashboard/dashboard.css";
import "../schedule/schedule.css";

export default function DirectoryPortal({ active, unlocked, error, children }: {
  active: "directory" | "schedule";
  unlocked: boolean;
  error?: string;
  children?: ReactNode;
}) {
  const schedule = active === "schedule";
  if (!unlocked) {
    return (
      <main id="top" className="grid min-h-screen place-items-center bg-sand px-6 py-12">
        <section className="w-full max-w-[21rem]">
          <form action={unlockDirectory} className="grid gap-3">
            <input type="hidden" name="returnTo" value={schedule ? "/directory/schedule" : "/directory"} />
            <label htmlFor="directory-password" className="font-display text-2xl tracking-tight text-foreground">Password</label>
            <input id="directory-password" name="password" type="password" autoComplete="current-password" required autoFocus maxLength={256}
              aria-invalid={error === "password"} aria-describedby={error ? "directory-error" : undefined}
              className="h-13 w-full rounded-card border border-rule bg-surface px-4 text-base text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgba(147,51,51,0.12)] aria-[invalid=true]:border-accent" />
            {error ? <p id="directory-error" role="alert" className="-mt-1 text-xs text-accent">
              {error === "unavailable" ? "Access is temporarily unavailable." : "That password isn't correct."}
            </p> : null}
            <button type="submit" className="h-12 rounded-card bg-accent text-sm font-semibold tracking-[0.01em] text-on-accent transition hover:bg-accent-hover active:scale-[0.96]">Continue</button>
          </form>
          <p className="mt-8 text-xs text-muted">
            Trouble signing in?{" "}
            <a href={`mailto:${conference.email}`} className="text-accent underline underline-offset-2">{conference.email}</a>
          </p>
        </section>
      </main>
    );
  }
  return (
    <main id="top" className="portal public-schedule mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          {schedule ? "DC Mini-Conference Schedule" : "DC Mini-Conference Attendee Directory"}
        </h1>
        {schedule ? <>
          <p className="mt-3 text-sm font-semibold">All times are Eastern Time (Washington, DC).</p>
          <p className="mt-1 text-xs text-muted">Schedule subject to change</p>
        </> : <p className="mt-3 text-sm text-muted">Directory updated as attendees complete their profiles</p>}
      </header>
      <>
        <nav aria-label="Conference pages" className="mb-8 flex gap-2 border-b border-rule">
          {([ ["directory", "/directory", "Directory"], ["schedule", "/directory/schedule", "Schedule"] ] as const).map(([key, href, label]) => (
            <a key={key} href={href} aria-current={active === key ? "page" : undefined}
              className={`border-b-2 px-5 py-3 text-sm font-semibold ${active === key ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
              {label}
            </a>
          ))}
        </nav>
        {children}
      </>
    </main>
  );
}
