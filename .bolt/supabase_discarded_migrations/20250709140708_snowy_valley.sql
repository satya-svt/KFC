/*
  # Add phone_number column to data_rows table

  1. New Columns
    - `phone_number` (text, optional)
      - User phone number in XXX-XXX-XXXX format

  2. Security
    - Add index for better query performance
    - Add check constraint for phone number format validation

  3. Changes
    - Add phone_number column to existing data_rows table
    - Add validation constraint for phone number format
    - Add index for phone number queries
*/

-- Add phone_number column to data_rows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'data_rows' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE data_rows ADD COLUMN phone_number text;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_data_rows_phone_number ON data_rows(phone_number);

-- Add check constraint for phone number format validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'data_rows_phone_number_format_check'
  ) THEN
    ALTER TABLE data_rows ADD CONSTRAINT data_rows_phone_number_format_check
      CHECK (phone_number IS NULL OR (phone_number ~ '^\d{3}-\d{3}-\d{4}$'));
  END IF;
END $$;

-- Add comment to document the new column
COMMENT ON COLUMN data_rows.phone_number IS 'User phone number in XXX-XXX-XXXX format';

-- Create unique index to ensure only one profile entry per user email
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_profile 
  ON data_rows(user_email, category) 
  WHERE category = 'profile';

COMMENT ON INDEX idx_unique_user_profile IS 'Ensures only one profile entry per user email';