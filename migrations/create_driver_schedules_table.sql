-- Migration: Create driver_schedules table
-- Description: Manages work shifts and days off for drivers
-- Date: 2025-01-XX

-- Create driver_schedules table
CREATE TABLE IF NOT EXISTS driver_schedules (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_start TIME,
    shift_end TIME,
    is_day_off BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, date)
);

-- Add comments for documentation
COMMENT ON TABLE driver_schedules IS 'Manages work schedules and days off for drivers';
COMMENT ON COLUMN driver_schedules.driver_id IS 'Foreign key to users table (DRIVER role)';
COMMENT ON COLUMN driver_schedules.date IS 'Date of the schedule entry';
COMMENT ON COLUMN driver_schedules.shift_start IS 'Start time of work shift (NULL if day off)';
COMMENT ON COLUMN driver_schedules.shift_end IS 'End time of work shift (NULL if day off)';
COMMENT ON COLUMN driver_schedules.is_day_off IS 'True if driver is off on this date';
COMMENT ON COLUMN driver_schedules.notes IS 'Additional notes about the schedule';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_driver_schedules_driver_id ON driver_schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_date ON driver_schedules(date);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_driver_date ON driver_schedules(driver_id, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_driver_schedules_updated_at
    BEFORE UPDATE ON driver_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_schedules_updated_at();

