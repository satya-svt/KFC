/*
  # Add feed emission calculation functionality

  1. New Columns
    - `feed_emission` (numeric, calculated field)
      - Stores the calculated emission value (quantity × emission factor)

  2. Changes
    - Add feed_emission column to data_rows table
    - Add index for better query performance
    - Add comment to document the new column

  3. Notes
    - Emission is calculated as: Feed quantity × Emission factor
    - Values are stored as numeric for precision
*/

-- Add feed_emission column to data_rows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'data_rows' AND column_name = 'feed_emission'
  ) THEN
    ALTER TABLE data_rows ADD COLUMN feed_emission numeric DEFAULT 0;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_data_rows_feed_emission ON data_rows(feed_emission);

-- Add comment to document the new column
COMMENT ON COLUMN data_rows.feed_emission IS 'Calculated feed emission value (quantity × emission factor)';