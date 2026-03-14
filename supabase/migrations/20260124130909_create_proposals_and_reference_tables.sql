/*
  # Proposals and Reference Data Tables

  ## Overview
  Creates tables for managing freight proposals with reference data for dropdowns.

  ## New Tables
  
  ### `proposals`
  Stores freight proposal information:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Links to authenticated user
  - `customer_id` (uuid, foreign key) - Optional link to customer
  - `land_freight` (text) - Land freight details
  - `equipment_type` (text) - Type of equipment
  - `pol` (text) - Place of Loading
  - `pod` (text) - Place of Delivery
  - `scope_of_service` (text) - Service scope description
  - `commodity` (text) - Commodity type
  - `packing` (text) - Packing type
  - `weight` (text) - Weight information
  - `volume` (text) - Volume information
  - `export_documentation` (text) - Export documentation details
  - `origin_border_clearance_fee` (text) - Origin border clearance fees
  - `transit_border_clearance_fee` (text) - Transit border clearance fees
  - `permission_naquel_toll_charges` (text) - Permission, Naquel & Toll charges
  - `required_documents` (text) - Required documents
  - `other_documents` (text) - Other documents
  - `return_freight` (text) - Return freight details
  - `free_time_loading` (text) - Free time for loading
  - `free_time_origin_border` (text) - Free time for origin border
  - `free_time_destination_border` (text) - Free time for destination border
  - `detention_charges` (text) - Detention charges
  - `payment_terms` (text) - Payment terms
  - `validity` (text) - Validity period
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `equipment_types`
  Reference data for equipment types:
  - `id` (uuid, primary key)
  - `name` (text, unique) - Equipment type name
  - `created_at` (timestamptz)

  ### `commodities`
  Reference data for commodities:
  - `id` (uuid, primary key)
  - `name` (text, unique) - Commodity name
  - `created_at` (timestamptz)

  ### `packing_types`
  Reference data for packing types:
  - `id` (uuid, primary key)
  - `name` (text, unique) - Packing type name
  - `created_at` (timestamptz)

  ### `locations`
  Reference data for POL/POD locations:
  - `id` (uuid, primary key)
  - `name` (text, unique) - Location name
  - `created_at` (timestamptz)

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Users can only access their own proposals
  - Reference data is readable by all authenticated users
  - Reference data can be inserted by all authenticated users
  
  ## Notes
  - Proposals are user-specific
  - Reference data is shared across all users
  - All text fields to accommodate flexible data entry
*/

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  land_freight text DEFAULT '',
  equipment_type text DEFAULT '',
  pol text DEFAULT '',
  pod text DEFAULT '',
  scope_of_service text DEFAULT '',
  commodity text DEFAULT '',
  packing text DEFAULT '',
  weight text DEFAULT '',
  volume text DEFAULT '',
  export_documentation text DEFAULT '',
  origin_border_clearance_fee text DEFAULT '',
  transit_border_clearance_fee text DEFAULT '',
  permission_naquel_toll_charges text DEFAULT '',
  required_documents text DEFAULT '',
  other_documents text DEFAULT '',
  return_freight text DEFAULT '',
  free_time_loading text DEFAULT '',
  free_time_origin_border text DEFAULT '',
  free_time_destination_border text DEFAULT '',
  detention_charges text DEFAULT '',
  payment_terms text DEFAULT '',
  validity text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create equipment_types table
CREATE TABLE IF NOT EXISTS equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create commodities table
CREATE TABLE IF NOT EXISTS commodities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create packing_types table
CREATE TABLE IF NOT EXISTS packing_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Proposals policies
CREATE POLICY "Users can view own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own proposals"
  ON proposals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reference data policies (read and insert for all authenticated users)
CREATE POLICY "Authenticated users can view equipment types"
  ON equipment_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert equipment types"
  ON equipment_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view commodities"
  ON commodities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert commodities"
  ON commodities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view packing types"
  ON packing_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert packing types"
  ON packing_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS proposals_user_id_idx ON proposals(user_id);
CREATE INDEX IF NOT EXISTS proposals_customer_id_idx ON proposals(customer_id);
CREATE INDEX IF NOT EXISTS proposals_created_at_idx ON proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS equipment_types_name_idx ON equipment_types(name);
CREATE INDEX IF NOT EXISTS commodities_name_idx ON commodities(name);
CREATE INDEX IF NOT EXISTS packing_types_name_idx ON packing_types(name);
CREATE INDEX IF NOT EXISTS locations_name_idx ON locations(name);

-- Insert seed data for equipment types
INSERT INTO equipment_types (name) VALUES
  ('20ft Container'),
  ('40ft Container'),
  ('40ft HC Container'),
  ('Flatbed Truck'),
  ('Refrigerated Container'),
  ('Open Top Container'),
  ('Tank Container')
ON CONFLICT (name) DO NOTHING;

-- Insert seed data for commodities
INSERT INTO commodities (name) VALUES
  ('General Cargo'),
  ('Electronics'),
  ('Textiles'),
  ('Machinery'),
  ('Food Products'),
  ('Chemicals'),
  ('Automotive Parts'),
  ('Furniture'),
  ('Raw Materials'),
  ('Consumer Goods')
ON CONFLICT (name) DO NOTHING;

-- Insert seed data for packing types
INSERT INTO packing_types (name) VALUES
  ('Palletized'),
  ('Crated'),
  ('Loose'),
  ('Boxed'),
  ('Shrink Wrapped'),
  ('Bulk'),
  ('Containerized')
ON CONFLICT (name) DO NOTHING;

-- Insert seed data for locations
INSERT INTO locations (name) VALUES
  ('New York, USA'),
  ('Los Angeles, USA'),
  ('London, UK'),
  ('Hamburg, Germany'),
  ('Rotterdam, Netherlands'),
  ('Shanghai, China'),
  ('Dubai, UAE'),
  ('Singapore'),
  ('Mumbai, India'),
  ('Tokyo, Japan')
ON CONFLICT (name) DO NOTHING;