export function PageHero({ title, intro, children }: { title: string; intro?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b bg-muted/40">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-12 sm:py-16">
        <h1 className="text-brand-graphite dark:text-foreground">{title}</h1>
        {intro && <p className="max-w-3xl text-muted-foreground">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
