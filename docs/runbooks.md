# Operator Runbooks
Execute these absolute playbooks in response to escalating health anomalies across the Administrative dashboard. Operators are prohibited from deviating from outcome-directed flows without Engineering escalation.

---

## 🩸 Runbook: Dead Letter Alert
**Triggered when:** Global Dashboard flags `dead_letter` instances > 0.
**Context:** An email completely exhausted its bounded retry cycle (5 attempts) and fundamentally cannot be resolved by automation.

**Decision Matrix:**
1. *IF* `error` / `dead_letter_reason` contains **"Template validation failed"**:
   - **Resolution**: Engineering has altered a DB payload format heavily. 
   - **Action**: Alert `Eng/Platform`. Operator: Leave ticket suspended.

2. *IF* `error` contains **"domain not verified"** or **"RESEND_API_KEY invalid"**:
   - **Resolution**: Secrets have structurally desynced or domain registration expired.
   - **Action**: Contact `Platform`. Immediate credential refresh natively through Provider portal.

3. *IF* `error` contains **"User Preference: Opted out"**:
   - **Resolution**: This should historically fail instantly cleanly (not Dead Letter), but if trapped:
   - **Action**: No engineering action. Ignore.

4. *IF* `error` contains **"Network/Timeout"**:
   - **Resolution**: Intermittent provider API degradation spanning over 6 hours.
   - **Action**: Press the **"Force Ping"** manual override button exactly once native on `AdminNotifications` to reset row parameters recursively back to `pending`.

---

## 📪 Runbook: Bounced Emails
**Triggered when:** Global Dashboard flags `bounced` occurrences continuously.
**Context:** The recipient mailbox specifically rejected the incoming sequence (e.g. invalid domain, user does not exist, full inbox). Automation immediately drops these to conserve domain credibility.

**Decision Matrix:**
1. *IF* The email is for `freelancer_approved` or `escrow_created`:
   - **Action**: Check Freelancer profile immediately. If email is structurally gibberish (e.g., `faketest1@temp.com`), freeze the account.
   - **Action**: If legitimate typo: Contact via secondary channel, update database email natively, manually execute **"Force Ping"** on original.

2. *IF* Bounces originate from internal system triggers (e.g. admin accounts):
   - **Action**: Verify `RESEND_FROM_EMAIL` against internal allowed aliases.

---

## ⏱️ Runbook: SLA Breached (>48h)
**Triggered when:** Dispute board flags ⚠️ `SLA Breached` violently.
**Context:** A Dispute ticket has fundamentally halted with zero Audit Logging activity or Resolution actions logged natively across Ops teams for over 48 contiguous hours.

**Decision Matrix:**
1. *IF* Dispute state requires external evidence (awaiting Client):
   - **Action**: Add an explicit `Operator Note` clarifying the pause ("Still waiting on client photos"). *This immediately silences the SLA alarm by injecting chronological audit evidence.*

2. *IF* Dispute state requires Administration consensus:
   - **Action**: Force resolution via explicit RPC (`Resolve Refund` or `Release Funds`).

---

## 🔀 Runbook: Reconciliation Mismatch
**Triggered when:** `AdminDashboard` uncovers logged mismatches inside `reconciliation_logs` table (State drift on Financial sequences).
**Context:** Missing webhooks or dropped network responses have historically stranded an Escrow payment locally while Gateway API secured funds perfectly.

**Decision Matrix:**
1. *IF* Local `pending` & Remote Gateway `succeeded`:
   - **Context**: User paid, we dropped the packet.
   - **Action**: Access Stripe/Paypal directly. Confirm identity + amount. Manually transition Postgres row via DB-escalated SQL to `funded`. *Wait for upcoming UI tool extension allowing `Force Sync Remote` natively.*

2. *IF* Local `pending` & Remote Gateway `canceled`:
   - **Context**: User abandoned payment portal organically without hitting the callback URL.
   - **Action**: Ignore natively. Routine architecture automatically cleans abandoned tasks periodically, or manually hit Cancel on Task.

---

## ⏪ Runbook: Emergency Rollbacks
**Triggered when:** Deployments break central APIs completely post-launch (End-to-end failure).

1. **Edge Function Rollback**: 
   - Identify prior working hash. Execute: 
   `supabase functions deploy [name] --project-ref [ref] --no-verify-jwt` natively via CI bindings.
   
2. **Database Migration Rollback**:
   - **WARNING**: Always prioritize forward-fix (deploying a new migration reversing or repairing logic). 
   - Write targeted **Data Repair SQL** scripts directly into `supabase/migrations` and push.
   - If catastrophic state corruption occurs, execute controlled restoration via explicit Supabase Cloud DB Backups. Never run raw `db reset` commands against production arrays.
