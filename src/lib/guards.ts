import "server-only";
import { auth } from "@/auth";
import { isStaff } from "@/lib/roles";

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}

/** Do użycia w server actions: wymaga zalogowanego admina lub pracownika. */
export async function requireStaff() {
  const session = await auth();
  if (!session || !isStaff(session.user.role)) throw new ForbiddenError();
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new ForbiddenError();
  return session.user;
}
