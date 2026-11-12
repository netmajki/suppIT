import { Archive, ArchiveRestore } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { setOrderArchived } from "@/lib/actions/orders";
import { SubmitButton } from "@/components/submit-button";

export async function ArchiveButton({ orderId, archived }: { orderId: string; archived: boolean }) {
  const t = await getTranslations("Orders");
  return (
    <form action={setOrderArchived.bind(null, orderId, !archived)}>
      <SubmitButton variant="outline">
        {archived ? <ArchiveRestore /> : <Archive />}
        {archived ? t("unarchive") : t("archive")}
      </SubmitButton>
    </form>
  );
}
