import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Konfiguracja bezpieczna dla Edge (używana w middleware) — bez Prisma i bcrypt.
export const authConfig = {
  pages: { signIn: "/pl/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
