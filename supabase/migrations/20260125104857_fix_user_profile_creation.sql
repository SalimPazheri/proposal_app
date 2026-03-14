/*
  # Fix User Profile Creation

  1. Changes
    - Add policy to allow users to create their own profile during signup
    - Create a trigger to automatically create user profile when a new user signs up
    - Make the first user (or users without profiles) able to set themselves as admin
    
  2. Security
    - Users can insert their own profile once (during signup)
    - Users can update their own profile details (but not admin status unless no admins exist)
    - First user to create a profile becomes admin automatically
*/

-- Allow users to create their own profile
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id 
    AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid())
  );

-- Allow users to update their own non-admin fields
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- If trying to change is_admin, only allow if no admins exist or user is already admin
      (is_admin = (SELECT is_admin FROM user_profiles WHERE id = auth.uid()))
      OR 
      (NOT EXISTS (SELECT 1 FROM user_profiles WHERE is_admin = true))
    )
  );

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user boolean;
BEGIN
  -- Check if this is the first user
  is_first_user := NOT EXISTS (SELECT 1 FROM user_profiles LIMIT 1);
  
  -- Create profile for new user
  INSERT INTO public.user_profiles (id, email, country, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    'UAE', -- Default country
    is_first_user -- First user becomes admin
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- For existing users without profiles, create profiles with first one as admin
DO $$
DECLARE
  user_record RECORD;
  is_first boolean := true;
BEGIN
  FOR user_record IN 
    SELECT id, email 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM user_profiles)
  LOOP
    INSERT INTO user_profiles (id, email, country, is_admin)
    VALUES (user_record.id, user_record.email, 'UAE', is_first)
    ON CONFLICT (id) DO NOTHING;
    
    is_first := false;
  END LOOP;
END $$;
