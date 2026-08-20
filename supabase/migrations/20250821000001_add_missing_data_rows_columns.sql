/*
  # Add remaining missing columns to data_rows table

  These columns existed in the original Supabase project but had no migration files.
  They are referenced by the ResponseData interface in supabase.ts.

  New Columns:
    - user_id (uuid, references auth.users)
    - entry_id (bigint, auto-generated)
    - phone_number (text)
    - energy_emission (double precision)
    - processed_poultry_quantity (real)
    - processed_poultry_unit (text)
    - kfc_share (real)
    - bird_count (bigint)
    - waste_water_treated (numeric)
    - oxygen_demand (numeric)
    - etp_type (text)
    - water_treatment_type (text)
    - waste_emission (numeric)
    - manure_emission (numeric)
    - transport_emission (numeric)
*/

-- Helper: Add a column only if it does not already exist
DO $$
BEGIN
  -- user_id: links to auth.users
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'user_id') THEN
    ALTER TABLE data_rows ADD COLUMN user_id uuid REFERENCES auth.users ON DELETE CASCADE;
  END IF;

  -- entry_id: auto-incrementing identifier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'entry_id') THEN
    ALTER TABLE data_rows ADD COLUMN entry_id bigint GENERATED ALWAYS AS IDENTITY;
  END IF;

  -- phone_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'phone_number') THEN
    ALTER TABLE data_rows ADD COLUMN phone_number text;
  END IF;

  -- energy_emission
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'energy_emission') THEN
    ALTER TABLE data_rows ADD COLUMN energy_emission double precision DEFAULT 0;
  END IF;

  -- processed_poultry_quantity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'processed_poultry_quantity') THEN
    ALTER TABLE data_rows ADD COLUMN processed_poultry_quantity real;
  END IF;

  -- processed_poultry_unit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'processed_poultry_unit') THEN
    ALTER TABLE data_rows ADD COLUMN processed_poultry_unit text;
  END IF;

  -- kfc_share
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'kfc_share') THEN
    ALTER TABLE data_rows ADD COLUMN kfc_share real;
  END IF;

  -- bird_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'bird_count') THEN
    ALTER TABLE data_rows ADD COLUMN bird_count bigint;
  END IF;

  -- waste_water_treated
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'waste_water_treated') THEN
    ALTER TABLE data_rows ADD COLUMN waste_water_treated numeric;
  END IF;

  -- oxygen_demand
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'oxygen_demand') THEN
    ALTER TABLE data_rows ADD COLUMN oxygen_demand numeric;
  END IF;

  -- etp_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'etp_type') THEN
    ALTER TABLE data_rows ADD COLUMN etp_type text;
  END IF;

  -- water_treatment_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'water_treatment_type') THEN
    ALTER TABLE data_rows ADD COLUMN water_treatment_type text;
  END IF;

  -- waste_emission
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'waste_emission') THEN
    ALTER TABLE data_rows ADD COLUMN waste_emission numeric DEFAULT 0;
  END IF;

  -- manure_emission
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'manure_emission') THEN
    ALTER TABLE data_rows ADD COLUMN manure_emission numeric DEFAULT 0;
  END IF;

  -- transport_emission
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_rows' AND column_name = 'transport_emission') THEN
    ALTER TABLE data_rows ADD COLUMN transport_emission numeric DEFAULT 0;
  END IF;
END $$;

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_data_rows_user_id ON data_rows(user_id);
CREATE INDEX IF NOT EXISTS idx_data_rows_entry_id ON data_rows(entry_id);

-- Add comments
COMMENT ON COLUMN data_rows.user_id IS 'References the authenticated user in auth.users';
COMMENT ON COLUMN data_rows.entry_id IS 'Auto-incrementing entry identifier';
COMMENT ON COLUMN data_rows.energy_emission IS 'Calculated energy emission value';
COMMENT ON COLUMN data_rows.processed_poultry_quantity IS 'Quantity of processed poultry';
COMMENT ON COLUMN data_rows.processed_poultry_unit IS 'Unit of measurement for processed poultry';
COMMENT ON COLUMN data_rows.kfc_share IS 'KFC share percentage';
COMMENT ON COLUMN data_rows.bird_count IS 'Number of birds';
COMMENT ON COLUMN data_rows.waste_water_treated IS 'Amount of waste water treated';
COMMENT ON COLUMN data_rows.oxygen_demand IS 'Oxygen demand measurement';
COMMENT ON COLUMN data_rows.etp_type IS 'Type of effluent treatment plant';
COMMENT ON COLUMN data_rows.water_treatment_type IS 'Type of water treatment';
COMMENT ON COLUMN data_rows.waste_emission IS 'Calculated waste emission value';
COMMENT ON COLUMN data_rows.manure_emission IS 'Calculated manure emission value';
COMMENT ON COLUMN data_rows.transport_emission IS 'Calculated transport emission value';
