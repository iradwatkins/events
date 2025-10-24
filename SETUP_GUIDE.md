# Setup Guide - SteppersLife Events

## 🚨 You Need to Complete Convex Setup

The server is running but can't connect to Convex because the API files haven't been generated yet.

### **Quick Fix (2 minutes):**

#### **Step 1: Open a New Terminal**
```bash
cd "/Users/irawatkins/Desktop/File Cabinet/event.stepperslife.com"
```

#### **Step 2: Run Convex Setup**
```bash
npx convex dev
```

This will:
1. Ask for your **project name** → Type: `stepperslife-events`
2. Ask if you want to **create a new project** → Press `y`
3. **Generate API files** in `convex/_generated/`
4. **Watch for changes** (keep this running!)

#### **Step 3: In Another Terminal, Start Next.js**
```bash
cd "/Users/irawatkins/Desktop/File Cabinet/event.stepperslife.com"
npm run dev
```

#### **Step 4: Visit the Site**
Open: **http://localhost:3004**

---

## ✅ What You'll See

Once Convex is running, the homepage will show:
- Search bar and category filters
- Masonry grid layout (4 columns on desktop)
- "No events found" message (until you create events)

---

## 📝 Alternative: Use Existing Convex Deployment

If you already have a Convex deployment (`expert-vulture-775`), follow these steps:

#### **Step 1: Create `.env.local` (Already Done ✅)**
File exists with your deployment URL.

#### **Step 2: Link to Existing Deployment**
```bash
npx convex dev --url https://expert-vulture-775.convex.cloud
```

This will:
- Connect to your existing Convex project
- Generate the API files
- Push your schema and functions

---

## 🔧 Troubleshooting

### **Error: "Module not found: Can't resolve '@/convex/_generated/api'"**
**Solution**: Run `npx convex dev` in a separate terminal

### **Error: "Cannot prompt for input in non-interactive terminals"**
**Solution**: You need to run the command manually in your terminal (not through automation)

### **Server starts but shows blank page**
**Solution**: Check browser console for errors, ensure Convex is running

---

## 📦 What's Already Installed

✅ All npm packages installed
✅ Database schema created (`convex/schema.ts`)
✅ All backend functions created
✅ Homepage components built
✅ `.env.local` created with Convex URL

**Missing**: Convex API files generation (requires interactive setup)

---

## 🎯 Once Setup is Complete

You can test:
1. **Homepage** - http://localhost:3004
2. **Search & Filters** - Try searching and filtering (when events exist)
3. **Create Sample Events** - Navigate to `/organizer/events/create` (coming next)

---

## 🚀 Next Steps After Setup

1. **Create Sample Events** - Add test events to see the masonry grid
2. **Build Event Detail Page** - Show event with Buy Tickets button
3. **Build Login Page** - Magic Link authentication UI
4. **Test Payment Flow** - Set up Stripe and test ticket purchases

---

## 💡 Pro Tip

Keep **two terminals open**:
- Terminal 1: `npx convex dev` (watches backend changes)
- Terminal 2: `npm run dev` (runs Next.js)

Both need to be running for the site to work!

---

**Need help?** Check the Convex dashboard: https://dashboard.convex.dev
