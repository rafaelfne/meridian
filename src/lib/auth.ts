import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [GitHub],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
      }
      if (profile && "login" in profile) {
        token.username = profile.login as string;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.username) {
        session.user.username = token.username;
      }
      return session;
    },
  },
});
