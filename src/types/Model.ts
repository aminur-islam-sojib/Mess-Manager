export type User = {
  name: string;
  email: string;
  password: string;
  role?: string;
  createdAt: Date;
};

export type InputUser = {
  fullName: string;
  email: string;
  confirmPassword: string;
  role: "user" | "manager";
};
export type FormDataType = {
  provider: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "user" | "manager";
};

export type SessionUser = {
  email?: string | null | undefined;
  id?: string | null | undefined;
  name?: string | null | undefined;
  role?: "user" | "manager" | "admin";
  image?: string | null | undefined;
};
