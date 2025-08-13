-- Add GPS coordinates and location verification columns to facilities table
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 20;

-- Add location tracking columns to employee_clock_ins table
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id);
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS clock_in_latitude DECIMAL(10, 8);
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS clock_in_longitude DECIMAL(11, 8);
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;
ALTER TABLE employee_clock_ins ADD COLUMN IF NOT EXISTS distance_meters DECIMAL(8, 2);

-- Update existing facilities with GPS coordinates (sample data for Ho Chi Minh City area)
-- You should replace these with actual coordinates of your Meraki facilities
UPDATE facilities 
SET 
    latitude = 10.7769,
    longitude = 106.7009,
    radius_meters = 20,
    data = COALESCE(data, '{}') || '{"type": "Meraki", "address": "123 Business Street, District 1, Ho Chi Minh City"}'::jsonb
WHERE data->>'type' = 'Meraki' OR name ILIKE '%meraki%';

-- If no Meraki facilities exist, create sample ones
INSERT INTO facilities (name, status, latitude, longitude, radius_meters, data) 
SELECT 
    'Meraki Main Campus',
    'active',
    10.7769,
    106.7009,
    20,
    '{"type": "Meraki", "address": "123 Business Street, District 1, Ho Chi Minh City", "description": "Main campus for employee clock-in"}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM facilities WHERE data->>'type' = 'Meraki'
);

INSERT INTO facilities (name, status, latitude, longitude, radius_meters, data) 
SELECT 
    'Meraki Branch Office',
    'active',
    10.7829,
    106.6934,
    25,
    '{"type": "Meraki", "address": "456 Work Avenue, District 3, Ho Chi Minh City", "description": "Branch office for employee clock-in"}'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM facilities WHERE data->>'type' = 'Meraki' AND name = 'Meraki Branch Office'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facilities_coordinates ON facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities USING GIN ((data->>'type'));
CREATE INDEX IF NOT EXISTS idx_employee_clock_ins_facility ON employee_clock_ins(facility_id);
CREATE INDEX IF NOT EXISTS idx_employee_clock_ins_verified ON employee_clock_ins(location_verified);

-- Add comments for documentation
COMMENT ON COLUMN facilities.latitude IS 'Latitude coordinate of the facility for GPS verification';
COMMENT ON COLUMN facilities.longitude IS 'Longitude coordinate of the facility for GPS verification';
COMMENT ON COLUMN facilities.radius_meters IS 'Allowed radius in meters for clock-in verification';
COMMENT ON COLUMN employee_clock_ins.facility_id IS 'Reference to the facility where clock-in occurred';
COMMENT ON COLUMN employee_clock_ins.clock_in_latitude IS 'Employee latitude at time of clock-in';
COMMENT ON COLUMN employee_clock_ins.clock_in_longitude IS 'Employee longitude at time of clock-in';
COMMENT ON COLUMN employee_clock_ins.location_verified IS 'Whether the employee was within allowed radius of facility';
COMMENT ON COLUMN employee_clock_ins.distance_meters IS 'Distance in meters from designated facility';
