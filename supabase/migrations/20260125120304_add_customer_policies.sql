/*
  # Add Customer Policies

  1. Security Changes
    - Add SELECT policy so users can view their own customers
    - Add UPDATE policy so users can update their own customers
    - Add DELETE policy so users can delete their own customers
  
  2. Notes
    - Currently only INSERT policy exists
    - Users cannot see customers they created without SELECT policy
*/

-- Allow users to view their own customers
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own customers
CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own customers
CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);