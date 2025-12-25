export type User = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

export type InputUser = {
  fullName: string;
  email: string;
  confirmPassword: string;
  role?: string;
};
