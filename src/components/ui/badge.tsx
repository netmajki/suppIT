import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 whitespace-nowrap", {
  variants: {
    tone: {
      gray: "bg-muted text-muted-foreground",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
      amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
      violet: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
      green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
      red: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
      cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300",
    },
  },
  defaultVariants: { tone: "gray" },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
