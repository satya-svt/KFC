/*
  # Add username column to data_rows table

  1. New Columns
    - `username` (text, optional)
      - User chosen username (3-20 alphanumeric characters)

  2. Security
    - Add index for better query performance
    - Add check constraint for username format validation

  3. Changes
    - Add username column to existing data_rows table
    - Add validation constraint for username format
    - Add index for username queries
*/

-- Add username column to data_rows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'data_rows' AND column_name = 'username'
  ) THEN
    ALTER TABLE data_rows ADD COLUMN username text;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_data_rows_username ON data_rows(username);

-- Add check constraint for username format validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'data_rows_username_format_check'
  ) THEN
    ALTER TABLE data_rows ADD CONSTRAINT data_rows_username_format_check
      CHECK (username IS NULL OR (username ~ '^[a-zA-Z0-9]{3,20}$'));
  END IF;
END $$;

-- Add comment to document the new column
COMMENT ON COLUMN data_rows.username IS 'User chosen username (3-20 alphanumeric characters)';