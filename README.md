# 🏘️ Mess Manager

> A production-grade, role-based web application for managing shared living spaces (hostels, messes, co-living communities) with real-time meal tracking, expense management, and secure member invitations.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Authentication & Authorization](#authentication--authorization)
- [Deployment](#deployment)
- [Performance & Optimization](#performance--optimization)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🎯 Overview

**Mess Manager** is a comprehensive platform designed to streamline the administration and day-to-day operations of shared living communities. Whether managing a hostel, residential mess, or co-living space, this application provides managers and members with tools to:

- **Track meals** in real-time with daily and monthly analytics
- **Manage member** registrations and access control
- **Handle expenses** transparently with approval workflows
- **Generate reports** for financial reconciliation
- **Automate invitations** via secure email tokens

Built with **Next.js 16 (Turbopack)**, **TypeScript**, and **MongoDB**, the platform emphasizes scalability, type safety, and production-ready architecture.

### Key Benefits

✅ **Role-Based Access Control** — Separate interfaces for managers and members  
✅ **Real-Time Analytics** — Daily and monthly meal dashboards with aggregated data  
✅ **Secure Invitations** — Time-limited, token-based member onboarding  
✅ **Type-Safe Operations** — 100% TypeScript with discriminated unions for error handling  
✅ **Mobile-Responsive** — Full Tailwind CSS implementation with responsive breakpoints  
✅ **Production-Ready** — Comprehensive error handling, caching, and optimization  

---

## ✨ Core Features

### Manager Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Mess Creation** | Create and manage multiple messes | ✅ Complete |
| **Member Invitations** | Send time-limited invites via email with tracking | ✅ Complete |
| **Daily Meal Tracking** | Record breakfast, lunch, dinner for all/individual members | ✅ Complete |
| **Monthly Reports** | Aggregated meal data with cost calculations | ✅ Complete |
| **Custom Date Range** | Query meal data between specific dates with filtering | ✅ Complete |
| **Member Management** | View active members, roles, and join dates | ✅ Complete |
| **Dashboard Analytics** | Overview of key metrics and pending items | ✅ Complete |

### Member/User Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Join via Invitation** | Accept time-limited invitations with validation | ✅ Complete |
| **View Mess Details** | Access mess information and member count | ✅ Complete |
| **Meal History** | Track personal meal records with date range filtering | ✅ Complete |
| **Monthly Meal Report** | Personal meal analytics and consumption trends | ✅ Complete |
| **Dashboard** | Quick overview of balance, expenses, and pending items | ✅ Complete |

### Planned Features

- 📊 Shopping expense approval workflows
- 💰 Automated cost-per-meal calculations
- 📧 Email digest reports (daily/weekly/monthly)
- 🔔 Real-time notifications
- 📱 Mobile app (React Native)
- 🌍 Multi-currency support
- 🔐 Two-factor authentication

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
├─────────────────────────────────────────────────────────────┤
│  Pages (SSR/SSG)    │  Server Actions  │  API Routes        │
│  • Dashboard        │  • Meals         │  • Auth             │
│  • Auth            │  • Mess          │  • Init              │
│  • Invitations     │  • Users         │                      │
│                    │  • Invitations   │                      │
├─────────────────────────────────────────────────────────────┤
│               Client Components (React 19)                   │
│  • Sidebar Nav  │  • Meal Tracking  │  • Forms             │
│  • Dialogs      │  • Reports        │  • Cards             │
├─────────────────────────────────────────────────────────────┤
│                 NextAuth Session Layer                       │
│  • Google OAuth  │  • Credentials  │  • Role Middleware    │
├─────────────────────────────────────────────────────────────┤
│                    MongoDB Database                          │
│  Users  │  Mess  │  Members  │  Meals  │  Invitations      │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

**Manager Adding Meals:**
```
Manager → Page Form → Server Action (addMealEntry)
  → MongoDB Aggregation → Validation → Upsert Operation
  → Revalidate Cache → Response
```

**Member Joining:**
```
Email Link (Token) → GetInvitationsByToken → Validate Expiry
  → Check Existing Member → Insert to mess_members
  → Accept Invitation → Update Cache → Redirect Dashboard
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16.1.1 (Turbopack)
- **Language:** TypeScript 5.0
- **UI Framework:** React 19.2.3
- **Styling:** Tailwind CSS 4 + PostCSS
- **Component Library:** Radix UI primitives
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Forms:** Custom validation
- **Notifications:** Sonner (toast) + SweetAlert2 (dialogs)

### Backend
- **Runtime:** Node.js (via Next.js)
- **Database:** MongoDB 7.0
- **Authentication:** NextAuth 4.24.13
- **Email:** Nodemailer 7.0.12
- **Hashing:** bcryptjs 3.0.3

### Developer Tools
- **Linting:** ESLint 9
- **Type Checking:** TypeScript strict mode
- **Build Tool:** Turbopack (Next.js built-in)
- **Package Manager:** npm

---

## 📋 Prerequisites

Before installing, ensure you have:

- **Node.js** ≥ 18.0.0 ([Download](https://nodejs.org/))
- **npm** ≥ 9.0.0 (included with Node.js)
- **MongoDB** 7.0+ ([Atlas free tier](https://www.mongodb.com/cloud/atlas) or self-hosted)
- **Git** for version control

Optional but recommended:
- **VS Code** with TypeScript support
- **MongoDB Compass** for database visualization

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/mess-manager.git
cd mess-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create `.env.local` in the root directory:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=mess_manager_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Service (Gmail/SendGrid/etc)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Frontend
NEXT_PUBLIC_APP_NAME=Mess Manager
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Initialize Database

```bash
# Run database initialization
npm run dev
# Navigate to http://localhost:3000/api/init
```

This creates necessary indexes and collections.

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

### NextAuth Setup

**File:** `src/app/api/auth/[...nextauth]/options.ts`

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Email/password authentication
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
  },
};
```

### Email Configuration

**File:** `src/lib/mailer.ts`

Supports:
- ✅ Gmail (App Password required)
- ✅ SendGrid
- ✅ Custom SMTP servers

```typescript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

### Database Indexes

**File:** `src/lib/dbIndexes.ts`

Automatic index creation for:
- `users.email` (unique)
- `mess.managerId` (indexed)
- `mess_members.messId, userId` (compound)
- `meal_entries.messId, date` (compound)
- `invitations.token` (unique)

---

## 📁 Project Structure

```
mess-manager/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth configuration
│   │   │   ├── init/                 # Database initialization
│   │   │   └── route.ts
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Auth & role middleware
│   │   │   ├── manager/
│   │   │   │   ├── meals/            # Meal entry form
│   │   │   │   ├── meals-report/     # Daily/monthly reports
│   │   │   │   └── invite/           # Member invitations
│   │   │   └── user/
│   │   │       ├── meals-report/     # Personal meal history
│   │   │       └── page.tsx
│   │   ├── globals.css               # Tailwind imports
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing/role selection
│   │   └── not-found.tsx
│   │
│   ├── actions/                      # Server Actions
│   │   └── server/
│   │       ├── Meals.ts              # Meal CRUD & aggregation
│   │       ├── Mess.ts               # Mess & member operations
│   │       ├── Users.ts              # User registration
│   │       └── Invitations.ts        # Invitation workflows
│   │
│   ├── components/
│   │   ├── Auth/                     # Login/register forms
│   │   ├── ManagerComponents/
│   │   │   ├── Meal-Tracking/        # Daily/monthly/custom reports
│   │   │   ├── Meals/                # Meal entry forms
│   │   │   ├── InvitePage.tsx
│   │   │   └── ManagerHeader.tsx
│   │   ├── UserComponents/           # User-specific components
│   │   ├── Navbar/                   # Sidebar navigation
│   │   ├── Shared/                   # Reusable components
│   │   ├── Providers/                # Context/session provider
│   │   └── ui/                       # Base UI components
│   │
│   ├── config/
│   │   └── nav.config.ts             # Navigation menu config
│   │
│   ├── lib/
│   │   ├── dbConnect.ts              # MongoDB connection
│   │   ├── dbIndexes.ts              # Schema indexes
│   │   ├── mailer.ts                 # Email service
│   │   ├── getUserMess.ts            # Helper: Get user's mess
│   │   ├── user.service.ts           # User operations
│   │   └── utils.ts                  # Utility functions
│   │
│   ├── types/
│   │   ├── Model.ts                  # User type definitions
│   │   ├── MealManagement.ts         # Meal types
│   │   ├── MealManagementTypes.ts    # Response types (NEW)
│   │   ├── Invitations.ts            # Invitation types
│   │   ├── MessTypes.ts              # Mess types
│   │   └── next-auth.d.ts            # NextAuth type extensions
│   │
│   └── middleware.ts                 # Auth middleware (future)
│
├── public/                           # Static assets
├── .env.local                        # Environment variables (not in repo)
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.mjs                # PostCSS configuration
├── eslint.config.mjs                 # ESLint configuration
├── package.json
└── README.md
```

---

## 💾 Database Schema

### Collections Structure

#### `users`
```typescript
{
  _id: ObjectId,
  name: string,
  email: string (unique),
  password: string (hashed),
  role: "manager" | "user" | "admin",
  image?: string,
  createdAt: Date,
  updatedAt: Date,
}
```

#### `mess`
```typescript
{
  _id: ObjectId,
  messName: string,
  managerId: ObjectId (reference: users._id),
  managerEmail: string,
  status: "active" | "inactive",
  createdAt: Date,
  updatedAt: Date,
}
```

#### `mess_members`
```typescript
{
  _id: ObjectId,
  messId: ObjectId (reference: mess._id),
  userId: ObjectId (reference: users._id),
  role: "manager" | "member",
  status: "active" | "inactive",
  joinDate: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

#### `meal_entries`
```typescript
{
  _id: ObjectId,
  messId: ObjectId (reference: mess._id),
  userId: ObjectId (reference: users._id),
  date: string (format: "YYYY-MM-DD"),
  meals: number (total count),
  breakdown: {
    breakfast: number,
    lunch: number,
    dinner: number,
  },
  createdBy: ObjectId (reference: users._id - manager),
  createdAt: Date,
  updatedAt: Date,
}
```

#### `invitations`
```typescript
{
  _id: ObjectId,
  messId: ObjectId (reference: mess._id),
  token: string (unique, URL-safe),
  messName: string,
  inviterName: string,
  memberCount: number,
  createdBy: ObjectId (reference: users._id),
  status: "pending" | "accepted" | "expired",
  expiresAt: Date,
  acceptedBy?: ObjectId,
  acceptedAt?: Date,
  createdAt: Date,
}
```

#### `invitations` (Indexes)
```
db.invitations.createIndex({ token: 1 }, { unique: true })
db.invitations.createIndex({ messId: 1 })
db.invitations.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

## 🔌 API Reference

### Server Actions (RPC-style)

All server actions are located in `src/actions/server/` and return discriminated unions for type-safe error handling.

#### Meal Management

**`getTodayMeals()`**
```typescript
// Returns today's meal records with aggregated data
const response: GetTodayMealsResponse = await getTodayMeals();
// { success: true, date, messId, messName, data: MealMember[] }
// or
// { success: false, message: string }
```

**`getMonthlyMeals({ month, year })`**
```typescript
const response: GetMonthlyMealsResponse = await getMonthlyMeals({
  month: 1,
  year: 2025,
});
// { success: true, month, year, messId, messName, data: MealMember[] }
```

**`getMealsByDateRange({ from?, to? })`**
```typescript
const response: GetMealsByDateRangeResponse = await getMealsByDateRange({
  from: "2025-01-01",
  to: "2025-01-31",
});
// { success: true, from, to, messId, messName, data: MealMember[] }
```

**`addMealEntry(payload)`**
```typescript
type MealPayload = {
  date: string; // "2025-01-23"
  meals: { breakfast: number; lunch: number; dinner: number };
  mode: "all" | "individual";
  memberId?: string; // required for individual mode
};

const response = await addMealEntry({
  date: "2025-01-23",
  meals: { breakfast: 8, lunch: 9, dinner: 7 },
  mode: "all",
});
// { success: true, message: string }
// or
// { success: false, message: string }
```

#### Mess Operations

**`createMess({ managerId, messName, managerEmail })`**
```typescript
const response = await createMess({
  managerId: "507f1f77bcf86cd799439011",
  messName: "Sunrise Hostel",
  managerEmail: "manager@example.com",
});
// { success: true, messId: string }
```

**`getSingleMessForUser(userId)`**
```typescript
const response = await getSingleMessForUser(userId);
// Manager: { success: true, role: "manager", mess: { ... } }
// Member: { success: true, role: "member", mess: { ... } }
// None: { success: false, message: string }
```

**`getMessMembers()`**
```typescript
const response = await getMessMembers();
// {
//   success: true,
//   messId: string,
//   messName: string,
//   members: {
//     userId: string,
//     name: string,
//     email: string,
//     role: "manager" | "member",
//     joinDate: string,
//   }[]
// }
```

#### Invitations

**`sendInvitation({ email, messName })`** (Manager only)
```typescript
const response = await sendInvitation({
  email: "newmember@example.com",
  messName: "Sunrise Hostel",
});
// { success: true, invitationId: string, expiresIn: "24h" }
```

**`getInvitationsByToken(token)`**
```typescript
const response = await getInvitationsByToken(token);
// {
//   success: true,
//   invitation: {
//     messName: string,
//     expiresAt: Date,
//     inviterName: string,
//     memberCount: number,
//   }
// }
// or
// { success: false, errorType: "expired" | "invalid" | "used" }
```

**`acceptInvitation(token)`**
```typescript
const response = await acceptInvitation(token);
// { success: true, redirectUrl: "/dashboard" }
// or
// { success: false, errorType: "expired" | "unauthorized" }
```

---

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

| Route | Manager | Member | Admin | Status |
|-------|---------|--------|-------|--------|
| `/dashboard` | ✅ | ✅ | ✅ | Protected |
| `/dashboard/manager/*` | ✅ | ❌ | ✅ | Protected |
| `/dashboard/user/*` | ❌ | ✅ | ✅ | Protected |
| `/auth/login` | ✅ | ✅ | ✅ | Public |
| `/api/init` | ⚠️ | ⚠️ | ⚠️ | Dev only |

### Session Validation

**File:** `src/app/dashboard/layout.tsx`

```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  redirect("/auth/login");
}

if (!["user", "manager", "admin"].includes(session.user.role)) {
  notFound();
}
```

### Password Security

- ✅ Bcrypt hashing (10 salt rounds)
- ✅ Never stored in plain text
- ✅ Never exposed in API responses
- ✅ Secure password reset flow (future)

### NextAuth Configuration

**Credentials Provider:**
```typescript
CredentialsProvider({
  async authorize(credentials) {
    const user = await getUser(credentials.email);
    if (user && await bcrypt.compare(credentials.password, user.password)) {
      return { id: user._id.toString(), email: user.email, role: user.role };
    }
    return null;
  }
})
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel
# Dashboard → Add New Project → Select Repository

# 3. Configure Environment Variables
# Settings → Environment Variables
# Add all variables from .env.local

# 4. Deploy
# Automatic on every push to main
```

### Self-Hosted (VPS/Server)

**Prerequisites:**
- Node.js 18+
- PM2 for process management
- Nginx as reverse proxy
- SSL certificate (Let's Encrypt)

```bash
# 1. Build production bundle
npm run build

# 2. Start with PM2
pm2 start npm --name "mess-manager" -- start

# 3. Configure Nginx
server {
  listen 443 ssl http2;
  server_name yourdomain.com;
  
  ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# 4. Start Nginx
systemctl start nginx
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      MONGO_URI: mongodb://mongo:27017
      NEXTAUTH_URL: https://yourdomain.com
    depends_on:
      - mongo
  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:
```

---

## ⚡ Performance & Optimization

### Frontend Optimization

✅ **Next.js Built-in Features:**
- Image optimization with `next/image`
- Automatic code splitting
- Server-side rendering (SSR) for critical pages
- Static generation (SSG) with incremental revalidation

✅ **Client-Side Optimization:**
```typescript
// Framer Motion with AnimatePresence for smooth transitions
<AnimatePresence mode="wait">
  {isOpen && <motion.div>...</motion.div>}
</AnimatePresence>

// React compiler optimization (Babel plugin)
// Automatic memoization of expensive computations
```

✅ **CSS Optimization:**
- Tailwind CSS with JIT compilation
- CSS purging in production (unused styles removed)
- Critical CSS inlining

### Backend Optimization

✅ **MongoDB Aggregation Pipelines:**
```typescript
// Single pipeline for complex queries (vs N+1 queries)
const data = await mealCollection
  .aggregate([
    { $match: { messId: mess._id, date: today } },
    { $lookup: { from: "users", ... } },
    { $unwind: "$user" },
    { $group: { _id: "$userId", meals: { $sum: "$breakdown.breakfast" } } }
  ])
  .toArray();
```

✅ **Database Indexing:**
- Compound indexes on frequently queried fields
- TTL indexes for automatic expiration
- Text indexes for search (future)

✅ **Caching Strategy:**
```typescript
// Server-side cache revalidation
revalidatePath("/dashboard/manager");
revalidatePath("/dashboard/user");

// Reduces unnecessary DB queries
```

### Monitoring Checklist

- [ ] Database query performance (< 100ms)
- [ ] Page load time (< 2s on 4G)
- [ ] Time to First Contentful Paint (< 1.5s)
- [ ] Cumulative Layout Shift (< 0.1)
- [ ] Server response time (< 200ms)

---

## 🔒 Security Considerations

### Data Protection

| Area | Implementation |
|------|-----------------|
| **Password** | Bcrypt 10 rounds, never plain text |
| **Session** | JWT with NextAuth, httpOnly cookies |
| **API Calls** | NextAuth session validation, Server Actions |
| **Database** | MongoDB connection pooling, credentials in .env |
| **Email** | Token-based invitations with 24h expiry |

### OWASP Top 10 Mitigation

1. **Injection** — TypeScript + MongoDB schema validation
2. **Broken Auth** — NextAuth with role-based middleware
3. **Sensitive Data Exposure** — HTTPS + httpOnly cookies
4. **XML External Entities** — Not applicable (no XML)
5. **Broken Access Control** — Server-side role checks
6. **Security Misconfiguration** — Environment-based config
7. **XSS** — React JSX escaping + Tailwind sanitization
8. **Insecure Deserialization** — NextAuth secure serialization
9. **Using Components with Known Vulnerabilities** — Regular npm audits
10. **Insufficient Logging** — console.error for critical events

### Best Practices

✅ **Never expose:**
- MongoDB connection strings in client code
- API keys in version control
- User passwords in logs
- Full error messages to frontend

✅ **Always:**
- Validate input on server-side
- Use HTTPS in production
- Keep dependencies updated
- Implement rate limiting (future)
- Add CSRF protection (future)

---

## 🛠️ Troubleshooting

### Common Issues

**Issue:** `MongoNetworkError: getaddrinfo ENOTFOUND`
```bash
# Cause: Invalid MONGO_URI or network connection
# Solution: 
# 1. Verify MONGO_URI in .env.local
# 2. Check MongoDB Atlas firewall (add 0.0.0.0/0 for development)
# 3. Test connection: mongosh "your_connection_string"
```

**Issue:** `NextAuth session is undefined`
```bash
# Cause: Missing NEXTAUTH_SECRET or session configuration
# Solution:
# 1. Generate secret: openssl rand -base64 32
# 2. Add to .env.local: NEXTAUTH_SECRET=your_secret
# 3. Restart dev server
```

**Issue:** `Email not sending`
```bash
# Cause: Invalid SMTP credentials or provider permissions
# Solution for Gmail:
# 1. Enable 2FA on Gmail account
# 2. Generate App Password: myaccount.google.com/apppasswords
# 3. Use app password in EMAIL_PASSWORD (not regular password)
```

**Issue:** `Page renders but data is undefined`
```bash
# Cause: Server action failed silently
# Solution:
# 1. Check browser console for errors
# 2. Add console.error in server action catch block
# 3. Return typed error response with detailed message
```

### Debugging

**Enable Debug Logging:**
```typescript
// src/lib/dbConnect.ts
process.env.DEBUG = "mongodb:*";

// src/app/api/auth/[...nextauth]/options.ts
debug: true, // NextAuth debug mode
```

**MongoDB Query Debugging:**
```bash
# Connect to MongoDB and check indexes
mongosh "your_connection_string"
use mess_manager_db
db.collection.find({...}).explain("executionStats")
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Code Style
- ✅ TypeScript strict mode
- ✅ ESLint configuration (run `npm run lint`)
- ✅ Prettier formatting (2-space indentation)
- ✅ Descriptive commit messages

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request with detailed description

### Testing Checklist
- [ ] Page renders correctly
- [ ] All forms validate input
- [ ] Error messages display properly
- [ ] No TypeScript errors
- [ ] No console warnings/errors
- [ ] Mobile responsive

---

## 🗓️ Roadmap

### Phase 2 (Next)
- [ ] Expense approval workflows
- [ ] Automated cost-per-meal calculations
- [ ] Email digest reports
- [ ] Real-time notifications (WebSocket)
- [ ] Admin dashboard

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Multi-currency support
- [ ] Two-factor authentication
- [ ] Advanced analytics & forecasting
- [ ] Integration with payment gateways

### Community Requests
- Request a feature: [GitHub Issues](https://github.com/yourusername/mess-manager/issues)
- Discuss ideas: [GitHub Discussions](https://github.com/yourusername/mess-manager/discussions)

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

## 👥 Support & Contact

| Channel | Link |
|---------|------|
| **GitHub Issues** | [Report bugs](https://github.com/yourusername/mess-manager/issues) |
| **Email** | support@mess-manager.com |
| **Documentation** | [Wiki](https://github.com/yourusername/mess-manager/wiki) |
| **Twitter** | [@MessManagerApp](https://twitter.com/mess_manager) |

---

## 🎉 Acknowledgments

- Next.js team for the incredible framework
- MongoDB for the flexible database
- Tailwind CSS for design utilities
- All contributors and community members

---

<div align="center">

**Made with ❤️ for managing shared communities**

[⬆ Back to Top](#mess-manager)

</div>
