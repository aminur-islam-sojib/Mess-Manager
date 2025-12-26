/* eslint-disable @typescript-eslint/no-explicit-any */
import { collections, dbConnect } from "@/lib/dbConnect";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await dbConnect(collections.USERS).findOne({
          email: credentials.email,
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // ✅ MUST return id
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role, // user | manager
        };
      },
    }),
  ],

  session: {
    strategy: "jwt" as const,
  },

  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id;
      session.user.role = token.role;
      console.log(session);
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXT_AUTH_SECRET,
};
