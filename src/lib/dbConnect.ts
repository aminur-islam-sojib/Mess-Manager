import { MongoClient, ServerApiVersion } from "mongodb";

export const collections = {
  USERS: "users",
  MESS: "mess",
  INVITATIONS: "invitations",
};

const uri = process.env.MONGO_URI;
const dname = process.env.DB_NAME;

// here code changes
if (!uri) {
  throw new Error("❌ Please add MONGO_URI to .env.local");
}

// here code changes
if (!dname) {
  throw new Error("❌ Please add DB_NAME to .env.local");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export const dbConnect = (cname: string) => {
  return client.db(dname).collection(cname);
};
