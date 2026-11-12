import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function CtaBand({ title, text, button, href = "/repair" }: { title: string; text?: string; button: string; href?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-8 py-10 text-primary-foreground sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-bold">{title}</h3>
          {text && <p className="text-primary-foreground/85">{text}</p>}
        </div>
        <Button asChild size="lg" variant="outline" className="border-white/40 bg-white text-primary hover:bg-white/90 hover:text-primary">
          <Link href={href}>{button}<ArrowRight /></Link>
        </Button>
      </div>
    </section>
  );
}
