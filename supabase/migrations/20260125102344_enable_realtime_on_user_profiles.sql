/*
  # Enable Realtime on User Profiles

  1. Changes
    - Enable realtime replication for user_profiles table
    - This allows clients to subscribe to real-time changes

  2. Purpose
    - Users will see their profile updates immediately without refreshing
    - Admin status changes will be reflected instantly
*/

-- Enable realtime for user_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;