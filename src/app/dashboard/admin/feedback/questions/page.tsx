import PortalShell from "@/components/dashboard/PortalShell";
import PageHeading from "@/components/dashboard/PageHeading";
import BackLink from "@/components/dashboard/BackLink";
import { requireAdmin } from "@/server/auth";
import { EDITABLE_FORMS, getFeedbackQuestions } from "@/server/feedback-questions";
import { FEEDBACK_FORMS } from "@/server/feedback";
import { saveQuestions } from "./actions";

const field = "min-h-10 w-full rounded-card border border-rule bg-surface px-3 py-2 text-sm text-foreground";

export default async function FeedbackQuestionsPage({ searchParams }: {
  searchParams: Promise<{ form?: string; saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const form = EDITABLE_FORMS.find((key) => key === params.form) ?? "goals";
  const questions = await getFeedbackQuestions(form);
  return (
    <PortalShell role="admin" active="feedback">
      <BackLink href="/dashboard/admin/feedback">Feedback</BackLink>
      <PageHeading title="Feedback questions" lead="Edit the questions attendees see. Removed questions stay in past responses." />
      <nav aria-label="Feedback form" className="mb-7 flex flex-wrap gap-2">
        {FEEDBACK_FORMS.map((item) => (
          <a key={item.key} href={`?form=${item.key}`} aria-current={form === item.key ? "page" : undefined}
            className={`rounded-card border px-3 py-2 text-xs ${form === item.key ? "border-accent text-accent" : "border-rule text-muted"}`}>
            {item.label}
          </a>
        ))}
      </nav>
      {params.saved ? <p className="mb-5 text-sm text-[color:var(--color-success)]">Questions saved.</p> : null}
      {params.error ? <p role="alert" className="mb-5 text-sm text-accent">Could not save those questions. Check the labels and try again.</p> : null}
      <form action={saveQuestions} className="grid gap-4">
        <input type="hidden" name="form" value={form} />
        {questions.map((q, index) => (
          <section key={q.key} className="grid gap-4 rounded-card border border-rule bg-card p-5 lg:grid-cols-[4rem_minmax(0,1fr)_7rem_6rem_5rem_4rem]">
            <label className="grid gap-1 text-xs text-muted">Order
              <input className={field} type="number" name={`position-${q.key}`} min="0" max="1000" defaultValue={q.position || index + 1} />
            </label>
            <label className="grid gap-1 text-xs text-muted">Question
              <input className={field} name={`label-${q.key}`} maxLength={500} required defaultValue={q.label} />
            </label>
            <label className="grid gap-1 text-xs text-muted">Answer
              {q.type === "text" || q.type === "rating" ? (
                <select className={field} name={`type-${q.key}`} defaultValue={q.type}>
                  <option value="text">Written</option><option value="rating">Rating</option>
                </select>
              ) : <span className="flex min-h-10 items-center text-sm text-foreground">{q.type === "ranked" ? "1:1 ranking" : q.type === "sessions" ? "Session ratings" : "Conversation ratings"}</span>}
            </label>
            <label className="grid gap-1 text-xs text-muted">Scale
              <select className={field} name={`scale-${q.key}`} defaultValue={q.scale}>
                <option value="1-5">1–5</option><option value="0-10">0–10</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input type="checkbox" name={`required-${q.key}`} defaultChecked={q.required} disabled={q.type === "sessions" || q.type === "conversations"} />Required
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input type="checkbox" name={`enabled-${q.key}`} defaultChecked={q.enabled} />Show
            </label>
          </section>
        ))}
        <section className="rounded-card border border-dashed border-rule p-5">
          <h2 className="mb-4 font-display text-lg text-foreground">Add a question</h2>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem_6rem_6rem]">
            <label className="grid gap-1 text-xs text-muted">Question
              <input className={field} name="new-label" maxLength={500} placeholder="New question" />
            </label>
            <label className="grid gap-1 text-xs text-muted">Answer
              <select className={field} name="new-type"><option value="text">Written</option><option value="rating">Rating</option></select>
            </label>
            <label className="grid gap-1 text-xs text-muted">Scale
              <select className={field} name="new-scale"><option value="1-5">1–5</option><option value="0-10">0–10</option></select>
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" name="new-required" />Required</label>
          </div>
        </section>
        <div><button className="min-h-11 rounded-card bg-accent px-6 text-sm font-semibold text-on-accent">Save questions</button></div>
      </form>
    </PortalShell>
  );
}
