/** Shared breadcrumb on every handbook child page. */
export default function HandbookBack() {
  return (
    <a
      href="/dashboard/handbook"
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
    >
      <span aria-hidden="true">←</span> Handbook
    </a>
  );
}
