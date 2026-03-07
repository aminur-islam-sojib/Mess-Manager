import { MongoClient, ServerApiVersion } from "mongodb";

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
  PUSH_SUBSCRIPTIONS: "push_subscriptions",
};

const uri = process.env.MONGO_URI;
const dname = process.env.DB_NAME;
const globalForMongo = globalThis as typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
};

// here code changes
if (!uri) {
  throw new Error("❌ Please add MONGO_URI to .env.local");
}

// here code changes
if (!dname) {
  throw new Error("❌ Please add DB_NAME to .env.local");
}

const mongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

const isClientClosed = (client?: MongoClient) => {
  if (!client) return true;

  const internalClient = client as MongoClient & {
    s?: { hasBeenClosed?: boolean };
    topology?: { isDestroyed?: () => boolean };
  };

  return (
    internalClient.s?.hasBeenClosed === true ||
    internalClient.topology?.isDestroyed?.() === true
  );
};

const createClient = () => new MongoClient(uri, mongoClientOptions);

const ensureClientPromise = () => {
  const client = getMongoClient();

  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = client.connect().catch((error) => {
      if (globalForMongo._mongoClient === client) {
        globalForMongo._mongoClient = undefined;
        globalForMongo._mongoClientPromise = undefined;
      }

      throw error;
    });
  }

  return globalForMongo._mongoClientPromise;
};

const getMongoClient = () => {
  if (!isClientClosed(globalForMongo._mongoClient)) {
    return globalForMongo._mongoClient as MongoClient;
  }

  const client = createClient();
  globalForMongo._mongoClient = client;
  globalForMongo._mongoClientPromise = undefined;

  return client;
};

void ensureClientPromise();

export const dbConnect = (cname: string) => {
  const client = getMongoClient();
  void ensureClientPromise();

  return client.db(dname).collection(cname);
};
