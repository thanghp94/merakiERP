-- Add current_unit column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS current_unit VARCHAR(10);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_classes_current_unit ON classes(current_unit);

-- Update existing records to populate current_unit from JSONB data
UPDATE classes 
SET current_unit = data->>'unit' 
WHERE data->>'unit' IS NOT NULL AND current_unit IS NULL;
