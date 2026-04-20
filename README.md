# Weekly Check-in App

A personal weekly tracking app built with React, Vite, and Supabase.

---

## Stack

- **React** — UI components
- **Vite** — dev server and build tool
- **Supabase** — Postgres database (free tier)
- **Recharts** — trend charts
- **CSS Modules** — scoped styles per component

---

## Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (pick any name, any region close to you)
3. Once it's ready, open the **SQL Editor** and run this to create your table:

```sql
create table checkins (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  week_of         date not null,
  exercise_days   text[] default '{}',
  exercise_count  int default 0,
  mood            int check (mood between 1 and 5),
  sleep_quality   int check (sleep_quality between 1 and 5),
  spending        int check (spending between 1 and 5),
  work_stress     int check (work_stress between 1 and 5),
  wins            text,
  intention       text
);
```

4. Go to **Settings → API** and copy:
   - Project URL (looks like `https://abcxyz.supabase.co`)
   - anon/public key (the long JWT string)

---

## Step 2: Configure the app

1. Copy `.env.example` to `.env.local`:
   ```
   cp .env.example .env.local
   ```

2. Open `.env.local` and paste your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## Step 3: Run locally

Make sure you have [Node.js](https://nodejs.org) installed (v18+ recommended).

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you should see the app.

---

## Step 4: Deploy to Vercel (optional)

1. Push the project to a GitHub repo
2. Go to [vercel.com](https://vercel.com), connect your GitHub account
3. Import the repo — Vercel auto-detects Vite
4. Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**
5. Deploy — you get a public URL instantly

---

## Project structure

```
checkin-app/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
├── .env.example                # Template for environment variables
└── src/
    ├── main.jsx                # Mounts React into the DOM
    ├── App.jsx                 # Root component, handles tab switching
    ├── App.module.css          # Layout and header styles
    ├── index.css               # Global reset and CSS variables
    ├── supabaseClient.js       # Supabase connection (singleton)
    └── components/
        ├── CheckInForm.jsx     # The weekly survey form
        ├── CheckInForm.module.css
        ├── History.jsx         # Trend charts + entry log
        └── History.module.css
```

---

## How to add a new metric

1. Add a column to your Supabase table via the SQL editor:
   ```sql
   alter table checkins add column energy int check (energy between 1 and 5);
   ```

2. Add the label array and slider in `CheckInForm.jsx`
3. Add it to the `METRICS` array in `History.jsx`

That's it — the chart renders automatically.

---

## Key concepts this project teaches

| Concept | Where to find it |
|---|---|
| React state (`useState`) | `CheckInForm.jsx` — every slider and input |
| Side effects (`useEffect`) | `History.jsx` — fetching data on mount |
| Props (passing data between components) | `App.jsx` passes `onSaved` to `CheckInForm` |
| Async/await with error handling | Both components, Supabase calls |
| CSS Modules (scoped styles) | Every `.module.css` file |
| Environment variables | `.env.local` + `supabaseClient.js` |
