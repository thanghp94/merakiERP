-- Add missing foreign key constraints for sessions table

-- Add foreign key constraint for teacher_id
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_teacher_id 
FOREIGN KEY (teacher_id) REFERENCES employees(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ta_id ON sessions(teaching_assistant_id);
