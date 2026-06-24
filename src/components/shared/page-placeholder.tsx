/**
 * Consistent placeholder used by the route stubs we scaffold in Phase 1.
 * Each real screen replaces its `<PagePlaceholder />` in a later phase.
 */
export function PagePlaceholder({
  area,
  title,
  description,
}: {
  area: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16">
      <span className="inline-block rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        {area}
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      <div className="mt-8 rounded-xl border border-dashed border-black/15 p-8 text-sm text-zinc-400 dark:border-white/15">
        Placeholder — this screen gets built in a later phase.
      </div>
    </section>
  );
}
