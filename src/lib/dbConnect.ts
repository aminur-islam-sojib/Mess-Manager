import { MongoClient, ServerApiVersion } from "mongodb";
import dns from "node:dns";

export const collections = {
  USERS: "users",
  MESS: "mess",
  INVITATIONS: "invitations",
  MESS_MEMBERS: "mess_member",
  MEAL_ENTRIES: "meal_entries",
  EXPENSES: "expenses",
  DEPOSITS: "deposits",
  DEPOSIT_REQUESTS: "deposit_requests",
};

const uri = process.env.MONGO_URI;
const dname = process.env.DB_NAME;

if (process.env.NODE_ENV === "development") {
  const dnsServers = process.env.MONGO_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  try {
    dns.setServers(
      dnsServers && dnsServers.length > 0 ? dnsServers : ["8.8.8.8", "1.1.1.1"],
    );
  } catch (error) {
    console.warn("Failed to set custom DNS servers for MongoDB:", error);
  }
}

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
export async function checkMongoConnection() {
  try {
    await client.connect();
    await client.db(dname).command({ ping: 1 });
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    return false;
  }
}
export const dbConnect = (cname: string) => {
  return client.db(dname).collection(cname);
};
