import type { Role } from "@prisma/client";

export const STAFF_ROLES: Role[] = ["ADMIN", "EMPLOYEE"];

export const isStaff = (role?: Role | null) => !!role && STAFF_ROLES.includes(role);

/** Strona startowa po zalogowaniu, zależna od roli. */
export const homeForRole = (role?: Role | null) => (isStaff(role) ? "/admin" : "/panel");
