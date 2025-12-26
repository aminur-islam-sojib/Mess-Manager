declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "user" | "manager";
    };
  }

  interface User {
    id: string;
    role: "user" | "manager";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "user" | "manager";
  }
}
