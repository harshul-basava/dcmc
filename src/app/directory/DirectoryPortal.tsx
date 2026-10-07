import type { ReactNode } from "react";
import { unlockDirectory } from "./actions";
import "../dashboard/dashboard.css";
import "../schedule/schedule.css";

export default function DirectoryPortal({ active, unlocked, error, children }: {
  active: "directory" | "schedule";
  unlocked: boolean;
  error?: string;
  children?: ReactNode;
}) {
  const schedule = active === "schedule";
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
      {unlocked ? <>
        <nav aria-label="Conference pages" className="mb-8 flex gap-2 border-b border-rule">
          {([ ["directory", "/directory", "Directory"], ["schedule", "/directory/schedule", "Schedule"] ] as const).map(([key, href, label]) => (
            <a key={key} href={href} aria-current={active === key ? "page" : undefined}
              className={`border-b-2 px-5 py-3 text-sm font-semibold ${active === key ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
              {label}
            </a>
          ))}
        </nav>
        {children}
      </> : <form action={unlockDirectory} className="grid max-w-sm gap-3">
        <input type="hidden" name="returnTo" value={schedule ? "/directory/schedule" : "/directory"} />
        <label htmlFor="directory-password" className="text-sm font-semibold">Password</label>
        <input id="directory-password" name="password" type="password" autoComplete="current-password" required maxLength={256}
          aria-invalid={error === "password"} aria-describedby={error ? "directory-error" : undefined}
          className="min-h-12 rounded-card border border-rule bg-surface px-4 text-base" />
        {error ? <p id="directory-error" role="alert" className="text-sm text-accent">
          {error === "unavailable" ? "Access is temporarily unavailable." : "That password isn't correct."}
        </p> : null}
        <button type="submit" className="min-h-12 rounded-card bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">Continue</button>
      </form>}
    </main>
  );
}
