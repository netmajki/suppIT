import { Link } from "@/i18n/navigation";
import { getCompanySettings } from "@/lib/settings";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Wspólny układ stron logowania / resetu hasła. */
export async function AuthShell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const company = await getCompanySettings();
  return (
    <main className="grid min-h-dvh place-items-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex justify-center"><Logo className="h-12" src={company.logoUrl} /></Link>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
