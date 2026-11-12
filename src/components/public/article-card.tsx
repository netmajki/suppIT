import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ArticleCard({
  a,
  locale,
  readMore,
}: {
  a: { slug: string; title: string; excerpt: string | null; content: string; article: { category: string | null; coverImage: string | null; publishedAt: Date | null } };
  locale: string;
  readMore: string;
}) {
  const excerpt = a.excerpt ?? a.content.replace(/[#*_>`\[\]()-]/g, "").slice(0, 160) + "…";
  return (
    <Card className="flex flex-col overflow-hidden">
      {a.article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.article.coverImage} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
      )}
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {a.article.category && <Badge tone="blue">{a.article.category}</Badge>}
          {formatDate(a.article.publishedAt, locale)}
        </div>
        <CardTitle className="text-lg leading-7">
          <Link href={`/articles/${a.slug}`} className="hover:text-primary">{a.title}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4 text-[15px] leading-6 text-muted-foreground">
        <p>{excerpt}</p>
        <Link href={`/articles/${a.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {readMore}<ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
