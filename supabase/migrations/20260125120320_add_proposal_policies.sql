/*
  # Add Proposal Policies

  1. Security Changes
    - Add SELECT policy so users can view their own proposals
    - Add UPDATE policy so users can update their own proposals
    - Add DELETE policy so users can delete their own proposals
  
  2. Notes
    - Currently only INSERT policy exists
    - Users cannot see proposals they created without SELECT policy
*/

-- Allow users to view their own proposals
CREATE POLICY "Users can view own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own proposals
CREATE POLICY "Users can update own proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own proposals
CREATE POLICY "Users can delete own proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);