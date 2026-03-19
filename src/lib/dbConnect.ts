import { MongoClient, ServerApiVersion } from "mongodb";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";

export const collections = {
  USERS: "users",
  MESS: "mess",
  INVITATIONS: "invitations",
  MESS_MEMBERS: "mess_member",
  MEAL_ENTRIES: "meal_entries",
  EXPENSES: "expenses",
  DEPOSITS: "deposits",
  DEPOSIT_REQUESTS: "deposit_requests",
  NOTIFICATIONS: "notifications",
  AUDIT_LOGS: "audit_logs",
};

const uri = process.env.MONGO_URI;
const dname = process.env.DB_NAME;

const currentServers = dns.getServers();
const localhostResolvers = ["127.0.0.1", "::1"];
const looksLikeLocalStubOnly =
  currentServers.length > 0 &&
  currentServers.every((server) => localhostResolvers.includes(server));

const dnsServers = process.env.MONGO_DNS_SERVERS?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (looksLikeLocalStubOnly && (!dnsServers || dnsServers.length === 0)) {
  console.warn(
    "Node DNS is using localhost resolver only. If MongoDB SRV lookup fails with ECONNREFUSED, set MONGO_DNS_SERVERS in .env (example: MONGO_DNS_SERVERS=192.168.0.1).",
  );
}

// Apply explicit DNS override whenever configured.
if (dnsServers && dnsServers.length > 0) {
  try {
    dns.setServers(dnsServers);
    dnsPromises.setServers(dnsServers);
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
