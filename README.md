# Trip Journal

A full-stack web app for logging travels, uploading photo galleries, and generating AI-written narrative summaries of each trip. Built as a capstone project.

**Live demo:** [your-vercel-url-here.vercel.app](https://your-vercel-url-here.vercel.app)

---

## What it does

- **Log trips** with destination, dates, and personal notes
- **Upload photo galleries** for each trip (JPG/PNG/WebP up to 5 MB)
- **AI summaries** — generate a literary, journal-style narrative of your trip in seconds, streamed word-by-word
- **Public/private toggle** — share specific trips with anyone, keep the rest private
- **Explore page** — browse trips other travelers have made public
- **Email confirmation** — get a notification email when a trip is logged
- **Search** your trip history by destination or notes

## Tech stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (Postgres + Row Level Security) |
| Auth | Supabase Auth with Google OAuth |
| Storage | Supabase Storage (public bucket) |
| Email | Resend |
| AI | Anthropic API (Claude Haiku 4.5) with streaming |
| Styling | Tailwind CSS v4 |
| UI components | lucide-react icons, Sonner for toasts |
| Hosting | Vercel |

## Architecture

**Two relational tables with foreign key:**

- `trips` — id, user_id (FK → auth.users), destination, start_date, end_date, notes, ai_summary, is_public, created_at
- `photos` — id, trip_id (FK → trips.id), user_id, storage_path, caption, created_at

Row Level Security policies ensure users can only modify their own data, while public trips are readable by anonymous visitors.

## Local development

### Prerequisites
- Node.js 18+
- A Supabase project, Resend account, and Anthropic API key
- A Google Cloud OAuth client configured with your Supabase callback URL

### Setup

```bash
git clone https://github.com/your-username/trip-journal.git
cd trip-journal
npm install
```

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
RESEND_API_KEY=re_...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run:

```bash
npm run dev
```

Open http://localhost:3000.

## Project structure

```
trip-journal/
├── app/
│   ├── api/
│   │   ├── ai-summary/route.ts        (Streaming Anthropic endpoint)
│   │   └── send-confirmation/route.ts (Resend email endpoint)
│   ├── auth/
│   │   ├── callback/route.ts          (OAuth callback handler)
│   │   └── error/page.tsx
│   ├── explore/page.tsx               (Public feed, no auth required)
│   ├── trips/
│   │   ├── [id]/page.tsx              (Trip detail)
│   │   └── page.tsx                   (Owner dashboard)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                       (Landing + public preview)
├── components/
│   ├── NewTripModal.tsx
│   ├── SignInButton.tsx
│   ├── TripDetailClient.tsx
│   └── TripsClient.tsx
├── lib/supabase/
│   ├── client.ts
│   └── server.ts
└── proxy.ts                           (Auth session refresh)
```

## Capstone requirements checklist

- ✅ Google OAuth via Supabase Auth
- ✅ Two related tables (`trips` ↔ `photos`) with foreign key
- ✅ Row Level Security policies for owner and public access
- ✅ Full CRUD with confirmation modal on delete
- ✅ File storage with MIME type and size validation
- ✅ Search with 300ms debounce and live spinner
- ✅ Email notifications via Resend on trip creation
- ✅ AI feature with streaming response (key never exposed to browser)

### UX polish features

1. Loading state with spinner
2. Empty state with emoji and call-to-action
3. Toast notifications via Sonner
4. Confirmation modal for delete
5. Inline form validation on blur
6. Debounced search (300ms) with spinner
7. Responsive design (1 / 2 / 3 column grid)

## Security notes

- All AI calls go through `/api/ai-summary` — the Anthropic API key never reaches the browser
- The Resend route validates that the `to` email matches the signed-in user's email
- Photo upload paths are namespaced by user ID and trip ID to prevent collisions
- Private trips return 404 to anonymous visitors to avoid leaking their existence

## License

MIT