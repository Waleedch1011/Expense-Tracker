-- ============================================
-- OPTIONAL: Run this in Supabase SQL Editor
-- ============================================
-- This lets the /quick page (without login) read your categories,
-- accounts, etc. from user_settings so any custom items you add
-- via the dashboard Settings tab also show up on Quick Add.
--
-- Without this policy, /quick falls back to the hardcoded defaults
-- baked into the QuickAdd component. The form will still work fully —
-- it just won't reflect newly-added categories.
--
-- Safe to run: this only allows READING the settings row for ONE
-- specific user_id (yours), nothing else.

CREATE POLICY "quick_read_settings_for_owner"
ON public.user_settings
FOR SELECT
TO anon
USING (user_id = 'ca0169ae-f0ba-40ce-9ff2-b7dfacce6380');
