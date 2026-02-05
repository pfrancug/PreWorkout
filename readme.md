# 🏋️ PreWorkout

**Fuel Your Gains** — A modern fitness & nutrition tracking app with AI-powered insights.

Built with React 19, TypeScript, Firebase, and Tailwind CSS 4.

---

## Features

### 📊 Dashboard

Real-time spark charts tracking your **weight**, **calories**, and **protein** trends at a glance.

### 📓 Food Diary

Full-featured data table with inline editing, sorting, pagination, and multi-row selection. Track daily weight, calories, protein, fat, and carbs.

### 🧮 TDEE Calculator

Mifflin-St Jeor equation-based calculator with activity multipliers. Shows maintenance, mild, moderate, and extreme deficit targets.

### 🤖 AI Chat

Conversational AI assistant for personalized fitness and nutrition advice:

- **Dual providers** — Gemini (Google) and Grok (xAI) with manual switching
- **Auto-fallback** — Seamlessly switches provider on rate limit
- **Context-aware** — Uses your profile data for personalized responses
- **Data attachment** — Send your diary data to the AI for analysis
- **Streaming** — Real-time token-by-token response rendering
- Available as a **dedicated page** or **sidebar panel**

### ⚙️ Settings

Manage your personal profile (name, age, height, sex) for personalized calculator defaults and AI recommendations.

### 🔐 Authentication

Google Sign-In via Firebase Authentication. All user data is securely stored per-user.

---

## Tech Stack

| Layer             | Technology                           |
| ----------------- | ------------------------------------ |
| **Framework**     | React 19 + TypeScript                |
| **Build**         | Vite 7                               |
| **Styling**       | Tailwind CSS 4 + Radix UI primitives |
| **UI Components** | shadcn/ui (custom)                   |
| **State**         | React Context + custom hooks         |
| **Database**      | Firebase Realtime Database           |
| **Auth**          | Firebase Authentication (Google)     |
| **AI**            | Google Gemini + xAI Grok             |
| **Charts**        | Recharts                             |
| **i18n**          | i18next                              |
| **Tables**        | TanStack Table                       |
| **Notifications** | Sonner                               |

---

## Project Structure

```
src/
├── components/         # Shared components
│   ├── charts/         # SparkChart
│   ├── DataTable/      # Table, pagination, toolbar, editable cells
│   └── ui/             # shadcn/ui primitives
├── contexts/           # Auth, Settings, Data providers
├── firebase/           # Auth, config, database operations
├── hooks/              # useDataSet, useIsMobile
├── i18n/               # Internationalization (en)
├── lib/
│   └── ai/             # Gemini & Grok streaming clients
├── pages/
│   ├── Calculator/     # TDEE calculator with form, equation, results
│   ├── ChatPage.tsx    # Full-page AI chat
│   ├── DiaryPage.tsx   # Food diary with data table
│   ├── LoginPage.tsx   # Google Sign-In
│   ├── MainPage.tsx    # Dashboard with spark charts
│   └── SettingsPage.tsx
├── styles/             # Global CSS
└── types/              # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js **>= 24.10.0**
- npm **>= 11.7.0**

### Installation

```bash
git clone https://github.com/pfrancug/PreWorkout.git
cd preworkout
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# AI Providers
VITE_GEMINI_API_KEY=
VITE_XAI_API_KEY=
```

### Development

```bash
npm run dev
```

### Available Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm run dev`       | Start dev server              |
| `npm run build`     | Type-check + production build |
| `npm run preview`   | Preview production build      |
| `npm run lint`      | ESLint with auto-fix          |
| `npm run format`    | Prettier format all files     |
| `npm run typecheck` | TypeScript type checking      |

---

## Code Quality

- **ESLint** — Flat config with React, hooks, and import sorting plugins. Arrow function style enforced.
- **Prettier** — Consistent formatting
- **Husky + lint-staged** — Pre-commit hooks run ESLint + Prettier on staged files
- **TypeScript** — Strict mode with React Compiler support

---

## Deployment

Deployed on **Vercel** with SPA routing via `vercel.json` rewrites.

Add all environment variables in Vercel project settings before deploying.

---

## License

[MIT](LICENSE)
