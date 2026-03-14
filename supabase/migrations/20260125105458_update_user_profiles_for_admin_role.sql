/*
  # Update User Profiles for Admin Role Support

  1. Changes
    - Make country optional (NULL) for admin users
    - Admin users don't need a country assignment
    - Regular users must have a country
    - Update RLS policies to handle admin users without country
    - Remove auto-profile creation trigger (we'll handle it in the app)
    
  2. Security
    - Maintain existing RLS policies
    - Admin users can access all data regardless of country
*/

-- Drop the auto-creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Alter user_profiles to make country nullable
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_country_check;

ALTER TABLE user_profiles 
  ALTER COLUMN country DROP NOT NULL;

-- Add new constraint: country is required for non-admin users
ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_country_check 
  CHECK (
    (is_admin = true) OR 
    (is_admin = false AND country IN ('UAE', 'KSA', 'Bahrain'))
  );

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Allow users to create their own profile during signup
CREATE POLICY "Users can create own profile on signup"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id 
    AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid())
  );

-- Allow users to update their own profile (but not admin status)
CREATE POLICY "Users can update own non-admin fields"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND is_admin = false)
  WITH CHECK (
    auth.uid() = id 
    AND is_admin = false
  );

-- Update country-based policies to handle NULL country for admins
DROP POLICY IF EXISTS "Users can view customers from their country" ON customers;
CREATE POLICY "Users can view customers from their country"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR country = customers.country)
    )
  );

DROP POLICY IF EXISTS "Users can create customers in their country" ON customers;
CREATE POLICY "Users can create customers in their country"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR country = customers.country)
    )
  );

DROP POLICY IF EXISTS "Users can update customers from their country" ON customers;
CREATE POLICY "Users can update customers from their country"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR country = customers.country)
    )
  );

DROP POLICY IF EXISTS "Users can delete customers from their country" ON customers;
CREATE POLICY "Users can delete customers from their country"
  ON customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR country = customers.country)
    )
  );

DROP POLICY IF EXISTS "Users can view proposals from their country" ON proposals;
CREATE POLICY "Users can view proposals from their country"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR country = proposals.country)
    )
  );

DROP POLICY IF EXISTS "Users can create proposals in their country" ON proposals;
CREATE POLICY "Users can create proposals in their country"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR country = proposals.country)
    )
  );

DROP POLICY IF EXISTS "Users can update proposals from their country" ON proposals;
CREATE POLICY "Users can update proposals from their country"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR country = proposals.country)
    )
  );

DROP POLICY IF EXISTS "Users can delete proposals from their country" ON proposals;
CREATE POLICY "Users can delete proposals from their country"
  ON proposals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR country = proposals.country)
    )
  );
