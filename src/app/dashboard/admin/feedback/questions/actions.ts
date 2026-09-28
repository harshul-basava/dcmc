"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { EDITABLE_FORMS, getFeedbackQuestions, saveFeedbackQuestions, type FeedbackQuestion } from "@/server/feedback-questions";

export async function saveQuestions(formData: FormData) {
  await requireAdmin();
  const form = String(formData.get("form") ?? "");
  if (!EDITABLE_FORMS.some((key) => key === form)) redirect("/dashboard/admin/feedback/questions?error=form");

  const current = await getFeedbackQuestions(form);
  const questions: FeedbackQuestion[] = current.map((q, index) => ({
    ...q,
    label: String(formData.get(`label-${q.key}`) ?? "").trim().slice(0, 500),
    type: q.type === "ranked" || q.type === "sessions" || q.type === "conversations"
      ? q.type : formData.get(`type-${q.key}`) === "rating" ? "rating" : "text",
    scale: formData.get(`scale-${q.key}`) === "0-10" ? "0-10" : "1-5",
    required: formData.get(`required-${q.key}`) === "on",
    enabled: formData.get(`enabled-${q.key}`) === "on",
    position: Number(formData.get(`position-${q.key}`) ?? index + 1),
  }));

  const newLabel = String(formData.get("new-label") ?? "").trim().slice(0, 500);
  if (newLabel) questions.push({
    key: `q-${randomUUID().replace(/-/g, "").slice(0, 16)}`,
    label: newLabel,
    type: formData.get("new-type") === "rating" ? "rating" : "text",
    scale: formData.get("new-scale") === "0-10" ? "0-10" : "1-5",
    required: formData.get("new-required") === "on",
    enabled: true,
    position: questions.length + 1,
  });

  try {
    await saveFeedbackQuestions(form, questions);
  } catch {
    redirect(`/dashboard/admin/feedback/questions?form=${form}&error=save`);
  }
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/admin/feedback/questions?form=${form}&saved=1`);
}
