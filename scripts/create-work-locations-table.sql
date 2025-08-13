-- Create work_locations table for GPS-based clock-in verification
CREATE TABLE IF NOT EXISTS work_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample work locations
INSERT INTO work_locations (name, address, latitude, longitude, radius_meters) VALUES
('Main Office', '123 Business Street, Ho Chi Minh City', 10.7769, 106.7009, 20),
('Branch Office', '456 Work Avenue, Ho Chi Minh City', 10.7829, 106.6934, 25),
('Remote Site A', '789 Project Road, Ho Chi Minh City', 10.7589, 106.6619, 30);

-- Add location_id to employee_clock_ins table
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES work_locations(id);
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS clock_in_latitude DECIMAL(10, 8);
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS clock_in_longitude DECIMAL(11, 8);
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS distance_meters DECIMAL(8, 2);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_locations_active ON work_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_work_locations_coordinates ON work_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_employee_clock_ins_location ON employee_clock_ins(location_id);
CREATE INDEX IF NOT EXISTS idx_employee_clock_ins_verified ON employee_clock_ins(location_verified);

-- Add RLS policies for work_locations
ALTER TABLE work_locations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view work locations
CREATE POLICY "All users can view work locations" ON work_locations
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can manage work locations
CREATE POLICY "Admins can manage work locations" ON work_locations
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT id::text FROM employees 
            WHERE data->>'role' = 'admin'
        )
    );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_work_locations_updated_at 
    BEFORE UPDATE ON work_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE work_locations IS 'Designated work locations for GPS-based clock-in verification';
COMMENT ON COLUMN work_locations.latitude IS 'Latitude coordinate of the work location';
COMMENT ON COLUMN work_locations.longitude IS 'Longitude coordinate of the work location';
COMMENT ON COLUMN work_locations.radius_meters IS 'Allowed radius in meters for clock-in verification';
COMMENT ON COLUMN employee_clock_ins.location_id IS 'Reference to the work location where clock-in occurred';
COMMENT ON COLUMN employee_clock_ins.clock_in_latitude IS 'Employee latitude at time of clock-in';
COMMENT ON COLUMN employee_clock_ins.clock_in_longitude IS 'Employee longitude at time of clock-in';
COMMENT ON COLUMN employee_clock_ins.location_verified IS 'Whether the employee was within allowed radius';
COMMENT ON COLUMN employee_clock_ins.distance_meters IS 'Distance in meters from designated location';
