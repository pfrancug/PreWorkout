<div align="center">

# PreWorkout

**Fuel Your Gains**

A fitness & nutrition tracking app with AI-powered insights and personal trainer features.

[**preworkout.fit**](https://preworkout.fit/)

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=flat&logo=firebase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat&logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)

</div>

---

## About

PreWorkout helps you stay on top of your nutrition and fitness goals. Track your daily calorie intake, monitor your weight, calculate your calorie needs, and get personalized advice from an AI assistant. Personal trainers can connect with clients, manage training sessions, and monitor progress.

> Available in **English** and **Polish** &middot; Works on desktop and mobile (PWA)

---

## Features

|     | Feature                | Description                                                                                 |
| --- | ---------------------- | ------------------------------------------------------------------------------------------- |
| 📊  | **Dashboard**          | Real-time charts for weight, calories, and protein trends at a glance                       |
| 📓  | **Diary**              | Track daily calorie and macro intake with inline editing, sorting, and multi-day management |
| 📅  | **Calendar**           | Full calendar with activity tracking, time ranges, notes, and custom activity categories    |
| 🧮  | **Calorie Calculator** | TDEE calculator based on your profile and activity level with deficit targets               |
| 🤖  | **AI Assistant**       | Chat with Gemini or Grok for personalized nutrition advice with streaming responses         |
| 🏋️  | **Personal Trainer**   | Trainer-client connections, training session management, packages, and payment tracking     |
| 👁️  | **Trainee View**       | Trainers can view client diary data (read-only) and manage their calendar                   |
| ⚙️  | **Settings**           | Profile, preferences, activity categories, language, and data import/export                 |
| 🛡️  | **Admin Panel**        | User management, message limits, usage analytics, and trainer role assignment               |
| 🔐  | **Auth**               | One-tap Google Sign-In with secure per-user data and role-based access                      |

### AI Assistant

- **Two models** — Switch between Gemini and Grok on the fly
- **Auto-fallback** — Seamlessly switches provider if one is unavailable
- **Context-aware** — Tailored to your profile and goals
- **Diary attachment** — Share your data with the AI for deeper analysis
- **Streaming** — Responses appear in real-time with rate limiting
- **Flexible** — Use as a full page or from the sidebar

### Personal Trainer

- **Invite system** — Trainers generate invite codes, clients connect via code
- **Training sessions** — Schedule, complete, cancel, and reactivate sessions
- **Session packages** — Group sessions into packages with payment tracking
- **Calendar integration** — Trainer availability and session scheduling on the calendar
- **Trainee monitoring** — Read-only access to client diary and calendar data

---

## Tech Stack

| Layer         | Technology                                                           |
| ------------- | -------------------------------------------------------------------- |
| Frontend      | React 19, TypeScript 5, Vite 7, Tailwind CSS 4                       |
| UI            | Radix UI, shadcn/ui (New York), Lucide icons, Recharts, FullCalendar |
| State & Forms | React Context, react-hook-form, Zod                                  |
| Backend       | Vercel Serverless Functions, Firebase Admin SDK                      |
| Database      | Firebase Realtime Database                                           |
| Auth          | Firebase Auth (Google Sign-In)                                       |
| AI            | Google Gemini, xAI Grok (via Vercel AI SDK)                          |
| i18n          | i18next (English, Polish)                                            |
| Testing       | Vitest, React Testing Library, Playwright                            |
| Code Quality  | ESLint, Prettier, Husky, lint-staged                                 |

---

## License

Proprietary — &copy; 2025-2026 Piotr Francug HotCode. All rights reserved. See [LICENSE](LICENSE).
