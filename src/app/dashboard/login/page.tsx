import LoginForm from "@/components/dashboard/LoginForm";
import { conference } from "@/content/site";
import { getSession } from "@/server/auth";
import { portalHome } from "@/server/portal-pages";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  // Already signed in? Don't make them type a password to get back in.
  const session = await getSession();
  if (session?.role === "admin") redirect("/dashboard/admin");
  if (session?.role === "participant") redirect(await portalHome("participant"));
  if (session?.role === "guest") redirect(await portalHome("guest"));

  const { returnTo } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-sand px-6 py-12">
      <section className="w-full max-w-[21rem]">
        <LoginForm returnTo={returnTo} />
        <p className="mt-8 text-xs text-muted">
          Trouble signing in?{" "}
          <a href={`mailto:${conference.email}`} className="text-accent underline underline-offset-2">
            {conference.email}
          </a>
        </p>
      </section>
    </main>
  );
}
