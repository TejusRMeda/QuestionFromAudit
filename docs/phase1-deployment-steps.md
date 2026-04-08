# Phase 1 Deployment Steps

Complete these steps in order. Do NOT skip ahead.

---

## Step 1: Get your Supabase Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings > API**
4. Copy the **service_role** key (the secret one, NOT the anon key)

## Step 2: Add the key to your environment

Open your `.env` file (or `.env.local`) in the `QuestionFromAudit/` folder and add this line:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

If you're using Vercel (or another host), also add this as an environment variable there.

## Step 3: Test the app locally

```bash
cd QuestionFromAudit
npm run dev
```

Then test these flows with your hardcoded login:

- [ ] Sign in works
- [ ] Dashboard loads and shows your questionnaires
- [ ] Upload a CSV (creates a new master questionnaire)
- [ ] Create a trust instance from a master
- [ ] Open a trust link (the share link) in an incognito window
- [ ] Submit a suggestion as a trust user
- [ ] View suggestions as the admin
- [ ] Approve or reject a suggestion
- [ ] Add a comment from both admin and trust user side
- [ ] Export CASOD CSV

If anything fails, check the browser console and terminal for errors. The most likely issue is a missing or incorrect `SUPABASE_SERVICE_ROLE_KEY`.

## Step 4: Run the RLS migration

Only do this AFTER Step 3 passes. This locks down direct database access.

Option A - Supabase CLI:
```bash
supabase db push
```

Option B - Supabase Dashboard:
1. Go to **SQL Editor** in your Supabase dashboard
2. Open `QuestionFromAudit/supabase/migrations/015_tighten_rls_policies.sql`
3. Copy the entire contents and paste into the SQL editor
4. Click **Run**

## Step 5: Test again after the migration

Repeat the same tests from Step 3. Everything should still work because the API routes now use the service role key (bypasses RLS).

Additionally, test that direct access is blocked:
1. Open browser DevTools (F12) on any page
2. Go to the Console tab
3. Try running:
   ```js
   const { createClient } = await import('@supabase/supabase-js')
   const sb = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY')
   const { data } = await sb.from('master_questionnaires').select('*')
   console.log(data)
   ```
4. This should return an empty array or null (blocked by RLS). Before the migration it would have returned all data.

## Step 6: Deploy

If you're on Vercel:
1. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment variables
2. Push the branch or merge to trigger a deploy
3. Run Step 5 tests against the deployed version

---

## If something breaks

- **"Internal server error" on all pages**: The `SUPABASE_SERVICE_ROLE_KEY` is missing or wrong. Check your `.env` file.
- **Can sign in but can't see data**: The RLS migration was applied before the service key was set. Add the key and restart.
- **Trust users can't submit suggestions**: Check that the trust link URL is correct. The submission flow doesn't require login.
- **Admin actions return 401**: Make sure you're signed in. The admin routes now require authentication.
