-- Migration: 20260322000027_lock_payment_updates.sql
-- Description: Ensures no direct client UPDATEs can alter the payment status.

-- Currently, there is no UPDATE policy on public.payments, which means 
-- all client originating UPDATE requests are denied by default.
-- However, as an explicit guardrail requested in Phase 5:

DROP POLICY IF EXISTS "payments: clients can update" ON public.payments;
DROP POLICY IF EXISTS "payments: payer or payee can update own" ON public.payments;

-- If we ever need clients to update non-financial fields (like a memo), 
-- we would add a policy here with a strict WHEN/CHECK constraint:
--   WITH CHECK (status = xmin::text::payment_status)  -- pseudo-code blocking status changes
--
-- For now, we leave it strictly locked down. 
-- ALL state transitions MUST go through the SECURITY DEFINER RPCs.
