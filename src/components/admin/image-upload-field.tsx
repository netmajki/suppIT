"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { uploadImage } from "@/lib/actions/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Pole URL obrazka z możliwością wgrania pliku (wynik trafia do pola o nazwie `name`). */
export function ImageUploadField({ name, id, defaultValue = "", previewClassName = "h-12" }: { name: string; id?: string; defaultValue?: string; previewClassName?: string }) {
  const t = useTranslations("Settings");
  const te = useTranslations("Errors");
  const [url, setUrl] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const res = await uploadImage(fd);
      if (res.url) setUrl(res.url);
      else setError(res.error ?? "generic");
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input id={id} name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… / /uploads/…" />
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Upload />}
          <span className="hidden sm:inline">{pending ? t("uploading") : t("upload")}</span>
        </Button>
        {url && (
          <Button type="button" variant="ghost" size="icon" aria-label={t("remove")} onClick={() => setUrl("")}><Trash2 /></Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{te.has(error as never) ? te(error as never) : error}</p>}
      {url && (
        <div className="inline-block rounded-md border bg-muted/50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className={`${previewClassName} w-auto max-w-full object-contain`} />
        </div>
      )}
    </div>
  );
}
