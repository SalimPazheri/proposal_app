/*
  # Cities Reference Table

  ## Overview
  Creates a reference table for cities and their corresponding countries.
  This enables autocomplete functionality and automatic country population.

  ## New Tables
  
  ### `cities`
  Stores city and country pairs:
  - `id` (uuid, primary key) - Unique identifier
  - `city` (text, unique) - City name
  - `country` (text) - Country name
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the `cities` table
  - All authenticated users can read cities (for autocomplete)
  - All authenticated users can insert new cities (when entering new city names)
  - Cities table is shared across all users for convenience
  
  ## Notes
  - Cities are normalized (trimmed and proper case)
  - Unique constraint on city name to prevent duplicates
  - Public read access for all authenticated users
*/

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text UNIQUE NOT NULL,
  country text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cities table
-- All authenticated users can read cities for autocomplete
CREATE POLICY "Authenticated users can view all cities"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert new cities
CREATE POLICY "Authenticated users can insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS cities_city_idx ON cities(city);

-- Insert some common cities as seed data
INSERT INTO cities (city, country) VALUES
  ('New York', 'United States'),
  ('London', 'United Kingdom'),
  ('Paris', 'France'),
  ('Tokyo', 'Japan'),
  ('Sydney', 'Australia'),
  ('Toronto', 'Canada'),
  ('Berlin', 'Germany'),
  ('Dubai', 'United Arab Emirates'),
  ('Singapore', 'Singapore'),
  ('Mumbai', 'India')
ON CONFLICT (city) DO NOTHING;