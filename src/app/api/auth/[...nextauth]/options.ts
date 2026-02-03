/* eslint-disable @typescript-eslint/no-explicit-any */
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { createOAuthUser, findUserByEmail } from "@/lib/user.service";
import { JWT } from "next-auth/jwt";
import { Account, Session, User } from "next-auth";

export const authOptions = {
  session: {
    strategy: "jwt" as const,
  },

  providers: [
    // ---------------- CREDENTIALS ----------------
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          // here code changes
          throw new Error("Email and password are required");
        }

        const user = await findUserByEmail(credentials.email);

        if (!user) {
          // here code changes
          throw new Error("No account found with this email");
        }

        if (!user.password) {
          // here code changes
          throw new Error(
            "This account was created using Google. Please sign in with Google",
          );
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          // here code changes
          throw new Error("Incorrect password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),

    // ---------------- GOOGLE ----------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // 🔑 Always sync JWT with DB
    async jwt({ token, user }: { token: JWT; user?: User }) {
      // On initial sign in, the user object is provided
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.image = user.image;
        return token;
      }

      // On subsequent calls, verify user still exists
      if (!token.email) return null;

      const dbUser = await findUserByEmail(token.email);

      // User deleted from DB - force logout
      if (!dbUser) {
        return null;
      }

      // Keep token in sync with DB
      token.id = dbUser._id.toString();
      token.role = dbUser.role;
      token.name = dbUser.name;
      token.image = dbUser.image;

      return token;
    },

    // 🧾 Session is derived from JWT only
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },

    // 🛂 OAuth first-login handler
    async signIn({ account, user }: { account: Account; user: User }) {
      if (account?.provider !== "google") return true;

      if (!user.email) return false;

      const existingUser = await findUserByEmail(user.email);

      if (!existingUser) {
        await createOAuthUser({
          name: user.name as string,
          email: user.email,
          image: user.image as string,
          role: "user",
          provider: "google",
        });
      }

      return true;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXT_AUTH_SECRET,
};
