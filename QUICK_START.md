# 🚀 Mess Manager - Quick Start Guide

## 📦 Installation (5 minutes)

```bash
# 1. Clone
git clone https://github.com/yourusername/mess-manager.git && cd mess-manager

# 2. Install
npm install

# 3. Setup .env.local
cat > .env.local << 'EOF'
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=mess_manager_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EOF

# 4. Run
npm run dev

# 5. Open browser
open http://localhost:3000
```

---

## 🎯 Core Workflows

### Manager: Add Daily Meals

1. Login as Manager
2. Navigate: Dashboard → Meals
3. Select Date → Enter Meals (breakfast/lunch/dinner)
4. Choose Mode: "All Members" or "Individual"
5. Submit ✅

### Manager: Send Invitation

1. Navigate: Dashboard → Invite
2. Enter member email
3. Select expiry (24h default)
4. Send via email ✅

### Member: Join Mess

1. Click email invitation link
2. Review mess details
3. Click "Accept Invitation"
4. Redirected to dashboard ✅

### View Reports

**Daily:** Dashboard → Meals Report → Today
**Monthly:** Dashboard → Meals Report → This Month
**Custom:** Dashboard → Meals Report → Custom Range

---

## 🛠️ Development Commands

```bash
npm run dev       # Start dev server (port 3000)
npm run build     # Create production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## 📊 Database Collections

```javascript
// users - Authentication & profiles
{
  (_id, name, email, password(hashed), role, createdAt);
}

// mess - Mess/community management
{
  (_id, messName, managerId, status, createdAt);
}

// mess_members - Membership tracking
{
  (_id, messId, userId, role, status, joinDate);
}

// meal_entries - Meal records
{
  (_id, messId, userId, date, meals, breakdown);
}

// invitations - Email invites (TTL: 24h)
{
  (_id, messId, token, status, expiresAt);
}
```

---

## 🔐 Environment Variables Checklist

- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `DB_NAME` - Database name
- [ ] `NEXTAUTH_URL` - Application URL
- [ ] `NEXTAUTH_SECRET` - Generated secret (`openssl rand -base64 32`)
- [ ] `GOOGLE_CLIENT_ID` - OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - OAuth secret
- [ ] `EMAIL_USER` - Sender email (Gmail)
- [ ] `EMAIL_PASSWORD` - App password (not regular password)

---

## 🚨 Common Issues & Fixes

| Issue                    | Solution                                             |
| ------------------------ | ---------------------------------------------------- |
| MongoDB connection fails | Check MONGO_URI, whitelist IP in Atlas               |
| Email not sending        | Use Gmail App Password, not regular password         |
| Session undefined        | Generate NEXTAUTH_SECRET, restart server             |
| Page data undefined      | Check browser console, verify server action response |
| Build fails TypeScript   | Run `npm run build` - shows detailed errors          |

---

## 📱 Feature Matrix

| Feature          | Manager | Member | Status   |
| ---------------- | ------- | ------ | -------- |
| Create Mess      | ✅      | ❌     | Complete |
| Invite Members   | ✅      | ❌     | Complete |
| Add Meals        | ✅      | ❌     | Complete |
| View Reports     | ✅      | ✅     | Complete |
| Dashboard        | ✅      | ✅     | Complete |
| Expense Approval | 🔄      | 🔄     | Planned  |
| Notifications    | 🔄      | 🔄     | Planned  |

---

## 📚 File Map

```
Quick Reference:
├── 🔑 Auth          → src/app/api/auth/[...nextauth]/
├── 📊 Dashboard     → src/app/dashboard/
├── ⚡ Server Actions → src/actions/server/
├── 🎨 Components    → src/components/
├── 💾 Database      → src/lib/dbConnect.ts
└── 📝 Types         → src/types/
```

---

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [MongoDB Docs](https://docs.mongodb.com/)
- [NextAuth Docs](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

## 📞 Support

Need help? Check:

1. [README.md](./README.md) - Full documentation
2. [GitHub Issues](https://github.com/yourusername/mess-manager/issues)
3. Console logs - `npm run dev` shows detailed errors

---

**Version:** 1.0.0 | **Last Updated:** Jan 23, 2025 | **License:** MIT
