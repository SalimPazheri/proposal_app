/*
  # Expand Country Support Worldwide

  ## Overview
  Removes the country restrictions to allow users from any country to use the system.
  Previously limited to UAE, KSA, and Bahrain only.

  ## Changes
  
  ### 1. user_profiles table
  - Add is_admin column for admin access control
  - Country field now accepts any text value
  
  ### 2. customers table  
  - Country field now accepts any text value
  
  ### 3. proposals table
  - Country field now accepts any text value

  ### 4. New countries reference table
  - Creates a `countries` table with common countries for dropdown selection
  - Includes currency information for each country

  ## Security
  - RLS enabled on countries table
  - All authenticated users can view countries
  - Admins can manage country list

  ## Notes
  - Existing data remains unchanged
  - Application can now serve users globally
*/

-- Add is_admin column to user_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create countries reference table
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  currency_code text NOT NULL DEFAULT 'USD',
  currency_symbol text NOT NULL DEFAULT '$',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view countries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'countries' AND policyname = 'Authenticated users can view countries'
  ) THEN
    CREATE POLICY "Authenticated users can view countries"
      ON countries FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Admins can manage countries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'countries' AND policyname = 'Admins can insert countries'
  ) THEN
    CREATE POLICY "Admins can insert countries"
      ON countries FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'countries' AND policyname = 'Admins can update countries'
  ) THEN
    CREATE POLICY "Admins can update countries"
      ON countries FOR UPDATE
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'countries' AND policyname = 'Admins can delete countries'
  ) THEN
    CREATE POLICY "Admins can delete countries"
      ON countries FOR DELETE
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

-- Insert common countries with their currencies
INSERT INTO countries (name, code, currency_code, currency_symbol) VALUES
  ('United Arab Emirates', 'AE', 'AED', 'د.إ'),
  ('Saudi Arabia', 'SA', 'SAR', '﷼'),
  ('Bahrain', 'BH', 'BHD', '.د.ب'),
  ('Kuwait', 'KW', 'KWD', 'د.ك'),
  ('Oman', 'OM', 'OMR', '﷼'),
  ('Qatar', 'QA', 'QAR', '﷼'),
  ('United States', 'US', 'USD', '$'),
  ('United Kingdom', 'GB', 'GBP', '£'),
  ('India', 'IN', 'INR', '₹'),
  ('Pakistan', 'PK', 'PKR', '₨'),
  ('Bangladesh', 'BD', 'BDT', '৳'),
  ('Philippines', 'PH', 'PHP', '₱'),
  ('Egypt', 'EG', 'EGP', 'E£'),
  ('Jordan', 'JO', 'JOD', 'د.ا'),
  ('Lebanon', 'LB', 'LBP', 'ل.ل'),
  ('Iraq', 'IQ', 'IQD', 'ع.د'),
  ('Iran', 'IR', 'IRR', '﷼'),
  ('Turkey', 'TR', 'TRY', '₺'),
  ('Germany', 'DE', 'EUR', '€'),
  ('France', 'FR', 'EUR', '€'),
  ('Italy', 'IT', 'EUR', '€'),
  ('Spain', 'ES', 'EUR', '€'),
  ('Netherlands', 'NL', 'EUR', '€'),
  ('Belgium', 'BE', 'EUR', '€'),
  ('China', 'CN', 'CNY', '¥'),
  ('Japan', 'JP', 'JPY', '¥'),
  ('South Korea', 'KR', 'KRW', '₩'),
  ('Singapore', 'SG', 'SGD', 'S$'),
  ('Malaysia', 'MY', 'MYR', 'RM'),
  ('Thailand', 'TH', 'THB', '฿'),
  ('Indonesia', 'ID', 'IDR', 'Rp'),
  ('Vietnam', 'VN', 'VND', '₫'),
  ('Australia', 'AU', 'AUD', 'A$'),
  ('New Zealand', 'NZ', 'NZD', 'NZ$'),
  ('Canada', 'CA', 'CAD', 'C$'),
  ('Mexico', 'MX', 'MXN', '$'),
  ('Brazil', 'BR', 'BRL', 'R$'),
  ('South Africa', 'ZA', 'ZAR', 'R'),
  ('Nigeria', 'NG', 'NGN', '₦'),
  ('Kenya', 'KE', 'KES', 'KSh'),
  ('Russia', 'RU', 'RUB', '₽'),
  ('Switzerland', 'CH', 'CHF', 'CHF'),
  ('Sweden', 'SE', 'SEK', 'kr'),
  ('Norway', 'NO', 'NOK', 'kr'),
  ('Denmark', 'DK', 'DKK', 'kr'),
  ('Poland', 'PL', 'PLN', 'zł'),
  ('Czech Republic', 'CZ', 'CZK', 'Kč'),
  ('Hungary', 'HU', 'HUF', 'Ft'),
  ('Romania', 'RO', 'RON', 'lei'),
  ('Greece', 'GR', 'EUR', '€')
ON CONFLICT (code) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS countries_name_idx ON countries(name);
CREATE INDEX IF NOT EXISTS countries_code_idx ON countries(code);

-- Update RLS policies for customers to work without country restriction
DROP POLICY IF EXISTS "Users can view customers from their country" ON customers;
DROP POLICY IF EXISTS "Users can create customers in their country" ON customers;
DROP POLICY IF EXISTS "Users can update customers from their country" ON customers;
DROP POLICY IF EXISTS "Users can delete customers from their country" ON customers;
DROP POLICY IF EXISTS "Users can view own customers" ON customers;
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON customers;

-- New policies: Users see their own customers, admins see all
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Update RLS policies for proposals to work without country restriction
DROP POLICY IF EXISTS "Users can view proposals from their country" ON proposals;
DROP POLICY IF EXISTS "Users can create proposals in their country" ON proposals;
DROP POLICY IF EXISTS "Users can update proposals from their country" ON proposals;
DROP POLICY IF EXISTS "Users can delete proposals from their country" ON proposals;
DROP POLICY IF EXISTS "Users can view own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can create proposals" ON proposals;
DROP POLICY IF EXISTS "Users can update own proposals" ON proposals;
DROP POLICY IF EXISTS "Users can delete own proposals" ON proposals;

-- New policies: Users see their own proposals, admins see all
CREATE POLICY "Users can view own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can delete own proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );
