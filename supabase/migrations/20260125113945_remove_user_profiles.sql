/*
  # Remove User Profiles System

  This migration removes the user profiles functionality including:
  - Drops the user_profiles table
  - Removes all associated RLS policies
  - Cleans up realtime subscriptions
  
  This reverts the application to basic authentication without user profiles.
*/

DROP TABLE IF EXISTS user_profiles CASCADE;