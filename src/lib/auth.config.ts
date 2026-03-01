import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/w/") ||
        nextUrl.pathname.startsWith("/workspaces");

      if (isProtected) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
