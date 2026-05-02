# ⏱️ Forth WorkTime Analyzer

A premium, high-performance web application designed for analyzing and summarizing monthly work hours and OT reports from PDF exports.

## ✨ Features

- **🚀 Advanced PDF Parsing**: Automatically extracts and normalizes daily clock-in/out segments.
- **📊 Analytics Dashboard**: Real-time KPI visualization for average hours, max work days, and total count.
- **🌓 Premium Dark Mode**: Sophisticated glassmorphic UI with dynamic theme switching.
- **📱 Fully Responsive**: Optimized for desktop, tablet, and mobile (PWA ready).
- **☁️ Cloud Sync**: Anonymous authentication with Firestore persistence for your OT settings.
- **📑 Professional Exports**: High-fidelity Excel export and print-ready reports.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/)
- **Database/Auth**: [Firebase](https://firebase.google.com/) (Firestore & Auth)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **PWA**: [@ducanh2912/next-pwa](https://www.npmjs.com/package/@ducanh2912/next-pwa)

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` file with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## 📚 Knowledge Base

Detailed documentation and architectural decisions are maintained in the [Wiki](./wiki/index.md).

---
© 2025 WorkTime Analyzer. All rights reserved.
