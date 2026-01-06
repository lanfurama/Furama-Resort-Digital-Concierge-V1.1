import pool from '../_config/database.js';

export interface DriverSchedule {
  id: number;
  driver_id: number;
  date: string; // YYYY-MM-DD format
  shift_start: string | null; // HH:MM:SS format
  shift_end: string | null; // HH:MM:SS format
  is_day_off: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export const driverScheduleModel = {
  // Get all schedules for a driver
  async getByDriverId(driverId: number): Promise<DriverSchedule[]> {
    const result = await pool.query(
      'SELECT * FROM driver_schedules WHERE driver_id = $1 ORDER BY date ASC',
      [driverId]
    );
    return result.rows;
  },

  // Get schedule for a specific date
  async getByDriverIdAndDate(driverId: number, date: string): Promise<DriverSchedule | null> {
    const result = await pool.query(
      'SELECT * FROM driver_schedules WHERE driver_id = $1 AND date = $2',
      [driverId, date]
    );
    return result.rows[0] || null;
  },

  // Get schedules for a date range
  async getByDriverIdAndDateRange(
    driverId: number,
    startDate: string,
    endDate: string
  ): Promise<DriverSchedule[]> {
    const result = await pool.query(
      'SELECT * FROM driver_schedules WHERE driver_id = $1 AND date >= $2 AND date <= $3 ORDER BY date ASC',
      [driverId, startDate, endDate]
    );
    return result.rows;
  },

  // Get all schedules for a date range (all drivers)
  async getByDateRange(startDate: string, endDate: string): Promise<DriverSchedule[]> {
    const result = await pool.query(
      'SELECT * FROM driver_schedules WHERE date >= $1 AND date <= $2 ORDER BY driver_id, date ASC',
      [startDate, endDate]
    );
    return result.rows;
  },

  // Check if driver is scheduled to work on a specific date and time
  async isDriverAvailable(driverId: number, date: string, time?: string): Promise<boolean> {
    const schedule = await this.getByDriverIdAndDate(driverId, date);
    
    if (!schedule) {
      // No schedule entry means driver is available (default behavior)
      return true;
    }

    // If it's a day off, driver is not available
    if (schedule.is_day_off) {
      return false;
    }

    // If no time specified, just check if it's not a day off
    if (!time) {
      return true;
    }

    // Check if current time is within shift hours
    if (schedule.shift_start && schedule.shift_end) {
      return time >= schedule.shift_start && time <= schedule.shift_end;
    }

    // If shift times are not set but not a day off, assume available
    return true;
  },

  // Create or update a schedule
  async upsert(schedule: {
    driver_id: number;
    date: string;
    shift_start?: string | null;
    shift_end?: string | null;
    is_day_off?: boolean;
    notes?: string | null;
  }): Promise<DriverSchedule> {
    const result = await pool.query(
      `INSERT INTO driver_schedules (driver_id, date, shift_start, shift_end, is_day_off, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (driver_id, date)
       DO UPDATE SET
         shift_start = EXCLUDED.shift_start,
         shift_end = EXCLUDED.shift_end,
         is_day_off = EXCLUDED.is_day_off,
         notes = EXCLUDED.notes,
         updated_at = NOW()
       RETURNING *`,
      [
        schedule.driver_id,
        schedule.date,
        schedule.shift_start || null,
        schedule.shift_end || null,
        schedule.is_day_off || false,
        schedule.notes || null,
      ]
    );
    return result.rows[0];
  },

  // Delete a schedule
  async delete(driverId: number, date: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM driver_schedules WHERE driver_id = $1 AND date = $2',
      [driverId, date]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  // Delete all schedules for a driver
  async deleteByDriverId(driverId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM driver_schedules WHERE driver_id = $1',
      [driverId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },
};

