import { cn } from "@/lib/utils";

/**
 * Znak słowny suppIT.me. Gdy pliki logo trafią do /public/brand
 * (suppit-logo-horizontal.svg), można tu podmienić tekst na <Image>.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading text-2xl font-bold tracking-tight", className)}>
      <span className="text-brand-graphite dark:text-foreground">supp</span>
      <span className="text-brand-blue">IT</span>
      <span className="text-brand-gray-light">.me</span>
    </span>
  );
}
