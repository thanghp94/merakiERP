-- Migration script to update attendance table to use main_session_id instead of session_id

-- First, let's see what we have
SELECT 'Current attendance records:' as info;
SELECT COUNT(*) as count FROM attendance;

-- Add the new column if it doesn't exist
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS main_session_id UUID;

-- Update existing attendance records to use main_session_id
-- This maps session_id to the corresponding lesson_id (which is the main_session_id)
UPDATE attendance 
SET main_session_id = sessions.lesson_id
FROM sessions 
WHERE attendance.session_id = sessions.id
AND attendance.main_session_id IS NULL;

-- Check the migration
SELECT 'After migration:' as info;
SELECT 
  COUNT(*) as total_records,
  COUNT(main_session_id) as records_with_main_session_id,
  COUNT(session_id) as records_with_session_id
FROM attendance;

-- Drop the old session_id column and constraint (uncomment when ready)
-- ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_session_id_fkey;
-- ALTER TABLE attendance DROP COLUMN IF EXISTS session_id;

-- Add the new foreign key constraint
ALTER TABLE attendance 
ADD CONSTRAINT attendance_main_session_id_fkey 
FOREIGN KEY (main_session_id) REFERENCES main_sessions(main_session_id) ON DELETE CASCADE;

-- Update the index
DROP INDEX IF EXISTS idx_attendance_session;
CREATE INDEX IF NOT EXISTS idx_attendance_main_session ON attendance(main_session_id);

SELECT 'Migration completed!' as info;
