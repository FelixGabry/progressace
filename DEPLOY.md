# ProgressAce — Deploy Guide (Phase D)

Deploy the V1 MVP to **Vercel** with **Neon** (database), **Supabase** (auth), and **Resend** (verification emails).

## Prerequisites

- [Neon](https://neon.tech) project with PostgreSQL
- [Supabase](https://supabase.com) project for auth
- [Resend](https://resend.com) account for OTP emails
- [Vercel](https://vercel.com) account
- Git repository (GitHub recommended)

## 1. Database (Neon)

1. Create a Neon project and copy the **connection string**.
2. From your machine (with `DATABASE_URL` set locally):

```bash
npm run db:push
```

This applies the Prisma schema (`User`, `Goal`, `Step`, `PendingSignup`) to production.

## 2. Supabase Auth

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://YOUR_DOMAIN` |
| Redirect URLs | `https://YOUR_DOMAIN/auth/callback` |
| | `https://YOUR_DOMAIN/auth/reset-password` |

For local dev, also add:

- `http://localhost:5000/auth/callback`
- `http://localhost:5000/auth/reset-password`

Copy from **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` — base URL only (`https://xxx.supabase.co`, no `/rest/v1/`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never expose to client)

## 3. Resend (verification codes)

1. Create an API key → `RESEND_API_KEY`
2. For production, verify your domain (e.g. `progressace.com`) in Resend
3. Set `RESEND_FROM_EMAIL="ProgressAce <noreply@progressace.com>"`

Until your domain is verified, use the Resend sandbox sender for testing.

## 4. Deploy to Vercel

### Option A — GitHub + Vercel UI

1. Initialize git and push to GitHub:

```bash
git init
git add .
git commit -m "ProgressAce V1 MVP"
git remote add origin https://github.com/YOUR_USER/progressace.git
git push -u origin main
```

2. In Vercel: **Add New Project** → import the repo
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variables (same as `.env.example`):

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret — server only |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` or custom domain |

5. Deploy. Vercel runs `npm run build` (includes `prisma generate`).

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
vercel env add DATABASE_URL
# ... add all env vars
vercel --prod
```

## 5. Custom domain (ProgressAce.com)

1. Vercel → Project → **Settings → Domains** → add `progressace.com` and `www.progressace.com`
2. Update DNS at your registrar (Vercel shows the records)
3. Update env vars:
   - `NEXT_PUBLIC_SITE_URL=https://progressace.com`
4. Update Supabase redirect URLs to use `https://progressace.com`
5. Redeploy

## 6. Post-deploy verification

Run through this checklist on the live URL:

| Flow | Steps |
|------|-------|
| Health | `GET /api/health` → `{ "status": "ok" }` |
| Register | Sign up → receive 6-digit code email → verify → auto-login |
| Login | Log out → log back in |
| Password reset | Forgot password → email link → set new password |
| Create goal | Simple + Complex from dashboard |
| Progress | Complete steps → bar updates → goal completes |
| Edit goal | Change steps, percentages, reorder |
| Profile | Update display name |
| Protected routes | `/dashboard` redirects to login when logged out |

## 7. Share with testers

Send 10–20 people:

- Live URL
- Brief: *"Create a real goal you're working on, use it for 2 weeks, tell me if the progress bar feels motivating."*

Collect feedback on:

- Is signup smooth?
- Does the progress bar feel meaningful?
- Would they use this instead of Notes/Notion for goals?

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Invalid path specified in request URL` | Wrong `NEXT_PUBLIC_SUPABASE_URL` — remove `/rest/v1/` |
| Emails not sending | Check `RESEND_API_KEY` and sender domain |
| DB errors on deploy | Run `npm run db:push` against production `DATABASE_URL` |
| Auth redirect loop | Supabase redirect URLs must match production domain exactly |
| Prisma client missing | `postinstall` runs `prisma generate` — redeploy |

## Local production test

```bash
npm run build
PORT=5000 npm start
# Windows PowerShell:
$env:PORT=5000; npm start
```

Then open `http://localhost:5000`.
