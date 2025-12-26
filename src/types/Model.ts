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
  role?: string;
};
