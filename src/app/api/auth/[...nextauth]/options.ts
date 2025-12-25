/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const options = {
  providers: [
    {
      name: "Credentials",
      credentials: {},
      async authorize(credentials: any, req: any) {
        console.log(credentials);
      },
    },
  ],
};
