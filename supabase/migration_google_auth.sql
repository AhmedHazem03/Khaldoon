-- Migration: Switch to Google-only auth
-- Run this in the Supabase SQL Editor on existing databases.
--
-- phone_number was NOT NULL UNIQUE (designed for phone+password auth).
-- Google OAuth users have no phone number, so we make it optional.

-- 1. Drop the NOT NULL constraint
ALTER TABLE public.users
  ALTER COLUMN phone_number DROP NOT NULL;

-- 2. Replace the unique index: allow multiple NULLs, keep uniqueness for non-NULL values
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_phone_number_key;

DROP INDEX IF EXISTS idx_users_phone_number;

CREATE UNIQUE INDEX idx_users_phone_number
  ON public.users(phone_number)
  WHERE phone_number IS NOT NULL AND phone_number <> '';

-- 3. Update the handle_new_user trigger to insert NULL instead of empty string
--    for users who have no phone_number in their metadata (e.g. Google OAuth users).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, phone_number, name)
  VALUES (
    NEW.id,
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone_number', ''), ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
