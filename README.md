# VibeTeams 🚀

**Vibe Coding Team Builder** — Automatically allocate participants into teams of up to 4 for vibe coding sessions.

## Features

- 📧 **Email-gated dashboard** — No auth required; just an email to view teams
- 🎯 **Domain selection** — 14 industry domains (healthcare, finance, etc.)
- ⚡ **Auto-assign** — Instantly placed in a matching team or a new one is created
- 🔍 **Manual browse** — Browse all teams, filter by domain, and join manually
- 👥 **Max 4 per team** — Enforced at the database and API level
- 🏗️ **Create a team** — Start a new team in your domain if none fit
- 🔄 **Live dashboard** — Auto-refreshes every 30 seconds

---

## Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router)
- **Database**: PostgreSQL via [Neon](https://neon.tech) serverless
- **Hosting**: [Vercel](https://vercel.com)
- **Styling**: Tailwind CSS

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd vibe-teams
npm install
```

### 2. Set up Neon Database

1. Go to [console.neon.tech](https://console.neon.tech) and create a free account
2. Create a new project (e.g., `vibe-teams`)
3. Copy the **Connection string** from the dashboard
4. Create a `.env.local` file:

```bash
cp .env.example .env.local
# Then edit .env.local and paste your DATABASE_URL
```

### 3. Initialize the database

Run the SQL schema against your Neon database. You can do this via:

**Option A: Neon SQL Editor** (easiest)
- Open your Neon project dashboard
- Click **SQL Editor**
- Paste the contents of `schema.sql` and run it

**Option B: psql**
```bash
psql $DATABASE_URL -f schema.sql
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B: Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your Neon connection string
5. Click **Deploy**

> ⚠️ Make sure to use the **pooled connection string** from Neon for Vercel deployments (it handles serverless connections better).

---

## User Flow

```
Landing (/) 
  ├── Existing email → /join (if no team) OR /dashboard (if has team)
  └── New email → /register → /join → /dashboard
```

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — email entry |
| `/register` | New user registration (name + domain) |
| `/join` | Choose auto-assign or browse teams |
| `/dashboard` | View all teams (email-gated) |

### API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/users/check` | Check if email exists |
| `POST` | `/api/users/register` | Register new user |
| `GET` | `/api/teams` | Get all teams (with `?domain=` filter) |
| `POST` | `/api/teams` | Create a new team |
| `POST` | `/api/teams/[id]/join` | Join a specific team |
| `POST` | `/api/teams/auto-assign` | Auto-assign user to best team |

---

## Database Schema

```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(100) NOT NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Available Domains

| Domain | Value |
|--------|-------|
| 💪 Personal Training | `personal-training` |
| 🏥 Healthcare | `healthcare` |
| 💰 Financial Services | `financial` |
| 🏡 Estate Planning | `estate-planning` |
| 📊 Bookkeeping | `bookkeeping` |
| 🛍️ E-Commerce | `e-commerce` |
| 🎓 Education | `education` |
| 🏢 Real Estate | `real-estate` |
| ⚖️ Legal Services | `legal` |
| 🍽️ Food & Restaurant | `food-restaurant` |
| ✈️ Travel & Tourism | `travel` |
| 🧠 Mental Health | `mental-health` |
| 💻 Technology | `technology` |
| 🤝 Non-Profit | `nonprofit` |

---

## Pre-loading Participants

To pre-register a batch of participants, run SQL directly against your Neon database:

```sql
-- Insert initial participants (they'll be assigned to teams when they log in)
INSERT INTO users (name, email, domain) VALUES
  ('Alice Johnson', 'alice@example.com', 'healthcare'),
  ('Bob Smith', 'bob@example.com', 'financial'),
  ('Carol White', 'carol@example.com', 'bookkeeping');
```

Participants can then visit the site, enter their email, and be taken directly to team selection.

---

## Configuration

Edit `lib/constants.js` to:
- Add/remove domains
- Change team naming patterns
- Adjust team adjectives

The max team size is `4` — change `MAX_TEAM_SIZE` in:
- `app/api/teams/[id]/join/route.js`
- `app/api/teams/auto-assign/route.js`
- `app/join/page.js`
- `app/dashboard/page.js`
