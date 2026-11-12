import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="space-y-4">
        <Logo />
        <h1>404</h1>
        <Link href="/" className="text-primary underline">suppIT.me</Link>
      </div>
    </main>
  );
}
