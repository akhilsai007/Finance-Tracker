# 💰 Finance Tracker

A full-stack personal finance management web application built to track and organize family finances in one place. Manage daily expenses, rental income, properties, gold, insurance, and more — with real-time syncing across all your devices.

---

## ✨ Features

### 📊 Dashboard
An at-a-glance overview of all financial activity — total expenses, rental income, property value, insurance premiums, house taxes, and more.

### 💸 Daily Expenses
Track day-to-day spending with custom user-created groups, an analytics summary, and date-range filters (last 7 days, this month, custom range, etc.). Expenses are organized by group and month for easy review.

### 🏠 Rental Income
A complete rental-management suite, organized into sub-sections:
- **Rent Status** — Track rent payments and their paid/unpaid status
- **Properties** — A register of your rental properties (name, location, owner, type)
- **Tenants** — Tenant records with lease dates, deposit, and contact details
- **Rental Owners** — Property owner records and contact information
- **Outstanding Balances** — View all unpaid rent and mark payments as received

### 💰 Interest Tracker
Track money lent or borrowed, with automatic interest calculations based on frequency (monthly, half-yearly, yearly).

### 📋 Insurance Policies
Keep track of insurance premiums, due dates, and upcoming renewals.

### 🏘️ House Taxes
Record property tax details including assessment, water, and sewerage charges with receipt numbers.

### 🏘️ Property Details
Document property ownership records — purchase value, dates, document numbers — with Google Maps location coordinates for each property.

### 💎 Gold
Track gold ornaments by weight and purity, with live valuation that updates based on the current market gold price.

---

## 🔑 Key Capabilities

- 🔄 **Real-time sync** — Changes appear instantly across all your devices
- 🔐 **Secure authentication** — Email/password login with password reset
- ⏱️ **Auto-logout** — Automatic sign-out after a period of inactivity
- 👤 **User-scoped data** — Row Level Security ensures each user only sees their own data
- 📱 **Multi-device access** — Use it on your laptop and phone

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite)
- **Backend & Database:** Supabase (PostgreSQL)
- **Authentication & Realtime:** Supabase Auth + Realtime subscriptions

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) and npm installed

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd finance-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to the local address shown in the terminal (usually `http://localhost:5173`).

---

## 📂 Project Structure

```
finance-tracker/
├── src/
│   ├── components/      # All feature modules (Expenses, Gold, Tenants, etc.)
│   ├── lib/             # Supabase client setup
│   ├── App.jsx          # Main app + sidebar navigation
│   └── main.jsx         # Entry point
├── .env                 # Supabase credentials (not committed)
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔒 Security Note

The `.env` file contains private Supabase keys and should **never** be committed to version control. Make sure `.env` is listed in your `.gitignore` file before pushing to GitHub.

---

## 📝 License

This is a personal project built for family use.