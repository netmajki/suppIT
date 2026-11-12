const map: Record<string, string> = { ł: "l", Ł: "l", ß: "ss", ø: "o", æ: "ae", œ: "oe" };

/** "Laptop się przegrzewa — co robić?" → "laptop-sie-przegrzewa-co-robic" */
export function slugify(input: string) {
  return input
    .replace(/[łŁßøæœ]/g, (c) => map[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
