import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, image: true, password: true },
        });

        if (!user || !user.password) return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
        // Stamp tokenVersion on sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id! },
          select: { tokenVersion: true },
        });
        token.tokenVersion = dbUser?.tokenVersion ?? 0;
        token.tokenVersionCheckedAt = Date.now();
      }
      if (profile && "login" in profile) {
        token.username = profile.login as string;
      }
      // Periodically check tokenVersion (every 5 minutes)
      if (
        token.id &&
        !user &&
        (!token.tokenVersionCheckedAt ||
          Date.now() - token.tokenVersionCheckedAt > 5 * 60 * 1000)
      ) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { tokenVersion: true },
        });
        if (!dbUser || dbUser.tokenVersion !== token.tokenVersion) {
          // Token version mismatch — force re-authentication
          return null as unknown as typeof token;
        }
        token.tokenVersionCheckedAt = Date.now();
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
