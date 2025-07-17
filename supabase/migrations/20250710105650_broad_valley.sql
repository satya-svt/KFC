/*
  # Add organization_name column to data_rows table

  1. New Columns
    - `organization_name` (text, optional)
      - Organization or company name associated with the user

  2. Changes
    - Add organization_name column to existing data_rows table
    - Add index for better query performance
    - Add comment to document the new column

  3. Notes
    - This field stores the organization/company name provided by users
    - Field is optional and can be null
*/

-- Add organization_name column to data_rows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'data_rows' AND column_name = 'organization_name'
  ) THEN
    ALTER TABLE data_rows ADD COLUMN organization_name text;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_data_rows_organization_name ON data_rows(organization_name);

-- Add comment to document the new column
COMMENT ON COLUMN data_rows.organization_name IS 'Organization or company name associated with the user';