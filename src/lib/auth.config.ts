import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/w/") ||
        nextUrl.pathname.startsWith("/workspaces");

      if (isProtected && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
