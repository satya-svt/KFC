/*
  # Create data_rows table with user email tracking

  1. New Tables
    - `data_rows`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `category` (text, required)
      - `value` (numeric, default 0)
      - `status` (text, default 'pending')
      - `date` (date, default current date)
      - `tags` (text array, default empty)
      - `priority` (text, default 'medium')
      - `assignee` (text, default empty)
      - `progress` (integer, default 0)
      - `user_email` (text, for tracking survey submissions)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `data_rows` table
    - Add policies for authenticated users to manage data
    - Add policy for public read access

  3. Constraints
    - Check constraints for status, priority, and progress values
    - Indexes for better query performance
*/

-- Create the data_rows table
CREATE TABLE IF NOT EXISTS data_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  category text NOT NULL,
  value numeric DEFAULT 0,
  status text DEFAULT 'pending'::text,
  date date DEFAULT CURRENT_DATE,
  tags text[] DEFAULT '{}'::text[],
  priority text DEFAULT 'medium'::text,
  assignee text DEFAULT ''::text,
  progress integer DEFAULT 0,
  user_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints
ALTER TABLE data_rows ADD CONSTRAINT data_rows_status_check 
  CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text]));

ALTER TABLE data_rows ADD CONSTRAINT data_rows_priority_check 
  CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]));

ALTER TABLE data_rows ADD CONSTRAINT data_rows_progress_check 
  CHECK (progress >= 0 AND progress <= 100);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_data_rows_updated_at
  BEFORE UPDATE ON data_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_data_rows_user_email ON data_rows(user_email);
CREATE INDEX IF NOT EXISTS idx_data_rows_status ON data_rows(status);
CREATE INDEX IF NOT EXISTS idx_data_rows_category ON data_rows(category);
CREATE INDEX IF NOT EXISTS idx_data_rows_created_at ON data_rows(created_at);

-- Enable Row Level Security
ALTER TABLE data_rows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON data_rows
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert"
  ON data_rows
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update"
  ON data_rows
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete"
  ON data_rows
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comments to document the table and columns
COMMENT ON TABLE data_rows IS 'Table for storing survey responses and data entries';
COMMENT ON COLUMN data_rows.user_email IS 'Email address of the authenticated user who submitted this survey response';
COMMENT ON COLUMN data_rows.name IS 'Name or title of the data entry';
COMMENT ON COLUMN data_rows.description IS 'Optional description or notes';
COMMENT ON COLUMN data_rows.category IS 'Category classification for the entry';
COMMENT ON COLUMN data_rows.value IS 'Numeric value associated with the entry';
COMMENT ON COLUMN data_rows.status IS 'Current status: active, inactive, or pending';
COMMENT ON COLUMN data_rows.date IS 'Date associated with the entry';
COMMENT ON COLUMN data_rows.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN data_rows.priority IS 'Priority level: low, medium, or high';
COMMENT ON COLUMN data_rows.assignee IS 'Person assigned to handle this entry';
COMMENT ON COLUMN data_rows.progress IS 'Progress percentage (0-100)';