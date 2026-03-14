# User Management Setup Guide

## Overview

Your freight management application now includes a comprehensive user management system with country-based access control for UAE, KSA, and Bahrain offices.

## Key Features

- **Country-based Data Isolation**: Users can only see customers and proposals from their assigned country
- **Admin Role**: Admins can see all data across countries and manage users
- **Default Currency**: Automatically set based on user's country
  - UAE → AED
  - KSA → SAR
  - Bahrain → BHD

## Creating Your First Admin User

Since you're setting up the system for the first time, you need to create an admin user. Follow these steps:

### Step 1: Create an Admin Account

Run this SQL in your Supabase SQL Editor:

```sql
-- First, create a user account in Supabase Auth
-- Go to Authentication > Users in Supabase Dashboard
-- Click "Add User" and create an account with your email and password

-- Then, run this SQL to make yourself an admin
-- Replace 'your-email@example.com' with your actual email

INSERT INTO user_profiles (id, email, country, is_admin)
SELECT
  id,
  email,
  'UAE' as country,  -- Change to 'KSA' or 'Bahrain' if needed
  true as is_admin
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Step 2: Sign In

After creating your admin account, sign in to the application with your credentials.

### Step 3: Create Other Users

Once signed in as admin:

1. Navigate to the **Users** tab in the dashboard
2. Click **Add User**
3. Fill in the user details:
   - Email
   - Password (minimum 6 characters)
   - Country (UAE, KSA, or Bahrain)
   - Admin checkbox (check if this user should also be an admin)
4. Click **Create User**

## How Data Isolation Works

- **Regular Users**: Can only see and create customers/proposals for their assigned country
- **Admin Users**: Can see and manage all data across all countries
- **Automatic Country Assignment**: When a user creates a customer or proposal, it's automatically assigned to their country

## Currency Mapping

The system automatically sets the default currency based on the user's country:

- **UAE** users → Proposals default to **AED**
- **KSA** users → Proposals default to **SAR**
- **Bahrain** users → Proposals default to **BHD**

Users can still change the currency manually when creating proposals if needed.

## Security Notes

- Only admin users can create new users
- The public sign-up feature has been disabled for security
- All data is protected by Row Level Security (RLS) policies
- Users cannot access data from other countries unless they are admins

## Deploying to GoDaddy

For deployment instructions to your GoDaddy hosting, please refer to the deployment documentation or contact support for hosting-specific guidance.
