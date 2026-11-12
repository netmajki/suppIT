import "server-only";
import path from "node:path";

/** Katalog na wgrane pliki (w Dockerze: wolumen /app/uploads). */
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

export const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
