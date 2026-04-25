# HomeLoop

**Your home, organized and handled.**

HomeLoop is a home management platform that helps homeowners track maintenance, systems, documents, and vendors. It auto-generates maintenance schedules based on your home's systems and alerts you when things need attention.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel (frontend) + Supabase (backend)

---

## Getting Started

### 1. Clone and install

```bash
cd homeloop
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your project URL and anon key
3. Copy the env template and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create the database tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

This creates all tables (homes, systems, maintenance_tasks, documents, vendors) with Row Level Security policies so each user can only see their own data.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
homeloop/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── login/              # Auth: login
│   │   ├── signup/             # Auth: signup
│   │   ├── dashboard/          # Main dashboard
│   │   └── homes/              # Home management
│   │       ├── new/            # Add home form
│   │       └── [id]/           # Home detail
│   │           ├── systems/    # System management
│   │           │   ├── new/    # Add system form
│   │           │   └── [systemId]/ # System detail
│   │           └── tasks/      # Task list view
│   ├── components/             # Reusable UI components
│   │   └── AppShell.tsx        # Main navigation layout
│   ├── lib/                    # Utilities and config
│   │   ├── supabase/           # Supabase client setup
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── maintenance-rules.ts # Maintenance engine logic
│   │   └── ai.ts               # OpenAI integration (tips, chat, costs, summaries)
│   ├── types/
│   │   └── database.ts         # TypeScript types for all tables
│   └── middleware.ts            # Next.js middleware (auth guard)
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # Database schema + RLS policies
│       └── 002_storage_bucket.sql  # Document storage bucket + policies
├── .env.local.example          # Environment variable template
└── package.json
```

---

## Core Features

1. **Auth** — Email/password sign up and login via Supabase Auth
2. **Home Profile** — Add homes with address, year built, sqft, rooms
3. **Systems Tracking** — Track HVAC, roof, water heater, etc. with age/condition
4. **Maintenance Engine** — Auto-generates tasks based on system type and rules
5. **Dashboard** — "What needs attention now" with overdue alerts and upcoming tasks
6. **Task Management** — View, filter, and complete maintenance tasks
7. **Document Storage** — Upload, tag, search, and download home documents (Supabase Storage)
8. **Vendor Management** — Save contractors with specialty, contact info, and star ratings
9. **AI Assistant** — Chat with your home data, get personalized answers
10. **AI Smart Tips** — Seasonal, system-specific maintenance recommendations
11. **AI Cost Estimates** — Service/repair/replace cost ranges for the Atlanta market
12. **AI Document Summaries** — Extract key dates, coverage, and action items from uploads

---

## Maintenance Rules

When you add a system, HomeLoop automatically creates maintenance tasks based on industry standards:

| System | Task | Frequency |
|--------|------|-----------|
| HVAC | Service / tune-up | 6 months |
| HVAC | Replace air filter | 3 months |
| Roof | Inspection | 2 years |
| Water Heater | Flush tank | 12 months |
| Gutters | Clean gutters | 6 months |
| Electrical | Test smoke/CO detectors | 6 months |

Full rules are in `src/lib/maintenance-rules.ts`.

---

## AI Features

HomeLoop uses OpenAI (GPT-4o-mini) for intelligent features. Add your API key to `.env.local`:

```
OPENAI_API_KEY=sk-your-key-here
```

The app works without this key — AI features simply won't load. API endpoints:

- `GET /api/ai/tips?homeId=xxx` — Personalized maintenance tips
- `POST /api/ai/chat` — Home Q&A (body: `{ homeId, question }`)
- `POST /api/ai/cost-estimate` — Cost estimates (body: `{ systemId, estimateType }`)
- `POST /api/ai/summarize` — Document summary (body: `{ documentText, documentName }`)

---

## Deployment

### Vercel (recommended)

1. Push code to GitHub
2. Connect your repo at [vercel.com](https://vercel.com)
3. Add your env variables in Vercel project settings
4. Deploy

### Supabase

Your Supabase project runs as a managed service — no deployment needed. Just keep your `.env.local` values in sync with your Vercel environment variables.

---

## Future Roadmap

- Predictive maintenance (ML-based failure probability)
- Vendor marketplace and automated booking
- Multi-home comparison and portfolio view
- Push notifications for overdue tasks
- Home value tracking and improvement ROI
