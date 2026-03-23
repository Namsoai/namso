# Namso Connect — Live Launch Checklist

This document is the definitive **GO / NO-GO** checklist for production environments. 
Without perfectly asserting every step below, the launch sequence must be aborted.

## 1. Database & Schema Integrity
- [ ] **Migrations**: All migrations applied cleanly to Production DB (`supabase db push`).
- [ ] **RLS Enforcement**: Active policies are running and denying default anonymous writes completely.
- [ ] **RPC Availability**: Core routines (`resolve_dispute`, `claim_notification_deliveries`) exist securely under `SECURITY DEFINER` with exact arguments.

## 2. Network Environment & Secrets
- [ ] **Supabase Links**: Local project correctly bound to the authentic production UUID.
- [ ] **Environment Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` map strictly to production properties on the hosting provider (e.g. Vercel/Netlify).
- [ ] **Root Keys**: `SUPABASE_SERVICE_ROLE_KEY` is completely isolated from frontend clients and explicitly restricted into secure Edge/Cron contexts.
- [ ] **Frontend Domain**: Authenticated callback redirects match real `https://namso.com/auth/callback`.

## 3. Communication & Edge Services
- [ ] **Resend Configuration**: Active domain mathematically verified. Webhooks actively receiving events. `RESEND_FROM_EMAIL` accurately set.
- [ ] **Edge Deployments**: All handlers pushed remotely (`supabase functions deploy`).
  - [ ] `process-notifications`
  - [ ] `cron-reconcile-escrow`
- [ ] **Webhook Bindings**: Supabase Database Webhooks (listening to `tasks` and `payments`) successfully routing to Edge endpoints utilizing JWT secrets.

## 4. `pg_cron` Scheduling
Must be physically enacted on the production SQL interface or via standard Dashboards:

**Job A: process-notifications**
- *Schedule:* Every 1 minute (`* * * * *`)
- *Function Called:* `SELECT net.http_post(url: 'https://[proj].supabase.co/functions/v1/process-notifications', body: '{"cron":true}')`
- *Verify:* `SELECT * FROM cron.job WHERE jobname = 'process-notifications';`

**Job B: cron-reconcile-escrow**
- *Schedule:* Every 15 minutes (`*/15 * * * *`)
- *Function Called:* `SELECT net.http_post(...)`
- *Verify:* `SELECT * FROM cron.job WHERE jobname = 'reconcile-escrow';`

## 5. Live Mode Awareness Switch
- [ ] Ensure Escrow.com configuration transitions cleanly from Sandbox credentials into full Live Production endpoints and authentic API keys.
- [ ] Scrub local sandbox seed-users out of live production arrays.
- [ ] **Final Integrity Constraint**: Admin Panel (`AdminDashboard`, `AdminDisputes`, `AdminNotifications`) loads seamlessly pointing to accurate production arrays, rendering zero 500 exceptions.
- [ ] **Smoke Test**: The idempotent `scripts/dev/live_smoke_run.ts` passes with absolutely zero failed asserts.
