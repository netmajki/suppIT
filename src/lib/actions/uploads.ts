"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "@/lib/crypto";
import { ForbiddenError, requireStaff } from "@/lib/guards";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES, UPLOAD_DIR } from "@/lib/uploads";

export type UploadResult = { url?: string; error?: string };

/** Wgrywa obrazek (logo, zdjęcie artykułu, logo partnera). Zwraca publiczny URL /uploads/… */
export async function uploadImage(fd: FormData): Promise<UploadResult> {
  try {
    await requireStaff();
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return { error: "required" };
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { error: "invalidFileType" };
    if (file.size > MAX_UPLOAD_BYTES) return { error: "fileTooLarge" };
    const name = `${Date.now().toString(36)}-${randomToken().slice(0, 10)}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    return { url: `/uploads/${name}` };
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: "forbidden" };
    console.error(e);
    return { error: "generic" };
  }
}
