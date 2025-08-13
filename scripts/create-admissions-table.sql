-- Create admissions table for tracking potential students through customer journey
CREATE TABLE public.admissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NULL DEFAULT 'pending'::text,
  application_date date NULL DEFAULT now(),
  data jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  student_name text NULL,
  phone character varying NULL,
  email character varying NULL,
  parent_name text NULL,
  location text NULL,
  CONSTRAINT admissions_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add RLS policies for admissions
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view all admissions
CREATE POLICY "Allow authenticated users to view admissions" ON public.admissions
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert admissions
CREATE POLICY "Allow authenticated users to insert admissions" ON public.admissions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update admissions
CREATE POLICY "Allow authenticated users to update admissions" ON public.admissions
FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete admissions
CREATE POLICY "Allow authenticated users to delete admissions" ON public.admissions
FOR DELETE USING (auth.role() = 'authenticated');

-- Add indexes for better performance
CREATE INDEX idx_admissions_status ON public.admissions(status);
CREATE INDEX idx_admissions_application_date ON public.admissions(application_date);
CREATE INDEX idx_admissions_phone ON public.admissions(phone);
CREATE INDEX idx_admissions_email ON public.admissions(email);

-- Add comments
COMMENT ON TABLE public.admissions IS 'Table for tracking potential students through admission process';
COMMENT ON COLUMN public.admissions.status IS 'Current status in admission journey: pending, fanpage_inquiry, zalo_consultation, trial_class, enrolled, follow_up, rejected';
COMMENT ON COLUMN public.admissions.data IS 'Additional data stored as JSON for flexibility';
