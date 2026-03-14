/*
  # Customer Data Management System - Initial Schema

  ## Overview
  Creates the foundation for a customer data management system with full authentication support.

  ## New Tables
  
  ### `customers`
  Stores comprehensive customer/company information including:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to authenticated user who created the record
  - `company_name` (text) - Name of the company
  - `company_address` (text) - Physical address of the company
  - `company_tel` (text) - Company telephone number
  - `company_email` (text) - Company email address
  - `city` (text) - City location
  - `country` (text) - Country location
  - `contact_person` (text) - Name of the contact person
  - `contact_email` (text) - Email of the contact person
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the `customers` table
  - Users can only view their own customer records
  - Users can only insert records linked to their own account
  - Users can only update their own customer records
  - Users can only delete their own customer records
  
  ## Notes
  - All policies require authentication
  - The schema is designed to be extensible for future data entry pages
  - Timestamps are automatically managed
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  company_address text DEFAULT '',
  company_tel text DEFAULT '',
  company_email text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT '',
  contact_person text DEFAULT '',
  contact_email text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers table
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);
CREATE INDEX IF NOT EXISTS customers_created_at_idx ON customers(created_at DESC);