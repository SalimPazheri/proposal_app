/*
  # User Management with Country-based Access Control

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `country` (text) - UAE, KSA, or Bahrain
      - `is_admin` (boolean) - Admin flag
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `country` column to `customers` table
    - Add `country` column to `proposals` table
    - Both columns will store: 'UAE', 'KSA', or 'Bahrain'

  3. Security
    - Enable RLS on `user_profiles` table
    - Users can read their own profile
    - Only admins can create/update user profiles
    - Update RLS policies on customers and proposals to filter by country
    - Admins can see all data regardless of country

  4. Default Currency Mapping
    - UAE: AED
    - KSA: SAR
    - Bahrain: BHD
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  country text NOT NULL CHECK (country IN ('UAE', 'KSA', 'Bahrain')),
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Add country column to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'country'
  ) THEN
    ALTER TABLE customers ADD COLUMN country text CHECK (country IN ('UAE', 'KSA', 'Bahrain'));
  END IF;
END $$;

-- Add country column to proposals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'country'
  ) THEN
    ALTER TABLE proposals ADD COLUMN country text CHECK (country IN ('UAE', 'KSA', 'Bahrain'));
  END IF;
END $$;

-- Drop existing RLS policies for customers
DROP POLICY IF EXISTS "Users can view own customers" ON customers;
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON customers;

-- Create new country-based RLS policies for customers
CREATE POLICY "Users can view customers from their country"
  ON customers FOR SELECT
  TO authenticated
  USING (
    country = (SELECT country FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can create customers in their country"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    country = (SELECT country FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update customers from their country"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    country = (SELECT country FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can delete customers from their country"
  ON customers FOR DELETE
  TO authenticated
  USING (
    country = (SELECT country FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Drop existing RLS policies for proposals
DROP POLICY IF EXISTS "Users can view own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can create proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can delete own proposals" ON proposals;

-- Create new country-based RLS policies for proposals
CREATE POLICY "Users can view proposals from their country"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    country = (SELECT country FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can create proposals in their country"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    country = (SELECT country FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update proposals from their country"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    country = (SELECT country FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can delete proposals from their country"
  ON proposals FOR DELETE
  TO authenticated
  USING (
    country = (SELECT country FROM user_profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );