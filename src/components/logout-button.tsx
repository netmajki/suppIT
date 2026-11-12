import { LogOut } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export async function LogoutButton() {
  const t = await getTranslations("Nav");
  const locale = await getLocale();
  return (
    <form action={logoutAction}>
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" variant="ghost" size="sm"><LogOut />{t("logout")}</Button>
    </form>
  );
}
