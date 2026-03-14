/*
  # Add Currency Field to Proposals
  
  1. Changes
    - Add `currency` column to `proposals` table
      - Type: text
      - Default: 'AED' (UAE Dirhams)
      - Stores the currency code for the proposal
  
  2. Notes
    - Currency codes include:
      - AED = UAE Dirhams
      - BHD = Bahrain Dinar
      - SAR = Saudi Arabian Riyal
      - KWD = Kuwaiti Dinar
      - OMR = Omani Rial
      - QAR = Qatari Riyal
      - EUR = Euro
      - USD = US Dollar
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'proposals' AND column_name = 'currency'
  ) THEN
    ALTER TABLE proposals ADD COLUMN currency text DEFAULT 'AED';
  END IF;
END $$;