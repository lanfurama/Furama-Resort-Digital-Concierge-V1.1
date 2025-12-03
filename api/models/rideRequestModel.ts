import pool from '../config/database.js';

export interface RideRequest {
  id: number;
  guest_name: string;
  room_number: string;
  pickup: string;
  destination: string;
  status: 'IDLE' | 'SEARCHING' | 'ASSIGNED' | 'ARRIVING' | 'ON_TRIP' | 'COMPLETED';
  timestamp: number;
  driver_id?: number;
  eta?: number;
  created_at: Date;
  updated_at: Date;
}

export const rideRequestModel = {
  async getAll(): Promise<RideRequest[]> {
    const result = await pool.query('SELECT * FROM ride_requests ORDER BY timestamp DESC');
    return result.rows;
  },

  async getById(id: number): Promise<RideRequest | null> {
    const result = await pool.query('SELECT * FROM ride_requests WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async getByRoomNumber(roomNumber: string): Promise<RideRequest[]> {
    const result = await pool.query(
      'SELECT * FROM ride_requests WHERE room_number = $1 ORDER BY timestamp DESC',
      [roomNumber]
    );
    return result.rows;
  },

  async getActiveByRoomNumber(roomNumber: string): Promise<RideRequest | null> {
    const result = await pool.query(
      "SELECT * FROM ride_requests WHERE room_number = $1 AND status != 'COMPLETED' ORDER BY timestamp DESC LIMIT 1",
      [roomNumber]
    );
    return result.rows[0] || null;
  },

  async getByStatus(status: RideRequest['status']): Promise<RideRequest[]> {
    const result = await pool.query(
      'SELECT * FROM ride_requests WHERE status = $1 ORDER BY timestamp DESC',
      [status]
    );
    return result.rows;
  },

  async create(rideRequest: Omit<RideRequest, 'id' | 'created_at' | 'updated_at'>): Promise<RideRequest> {
    const result = await pool.query(
      'INSERT INTO ride_requests (guest_name, room_number, pickup, destination, status, timestamp, driver_id, eta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        rideRequest.guest_name,
        rideRequest.room_number,
        rideRequest.pickup,
        rideRequest.destination,
        rideRequest.status,
        rideRequest.timestamp,
        rideRequest.driver_id || null,
        rideRequest.eta || null
      ]
    );
    return result.rows[0];
  },

  async update(id: number, rideRequest: Partial<Omit<RideRequest, 'id' | 'created_at' | 'updated_at'>>): Promise<RideRequest | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (rideRequest.guest_name !== undefined) {
      fields.push(`guest_name = $${paramCount++}`);
      values.push(rideRequest.guest_name);
    }
    if (rideRequest.room_number !== undefined) {
      fields.push(`room_number = $${paramCount++}`);
      values.push(rideRequest.room_number);
    }
    if (rideRequest.pickup !== undefined) {
      fields.push(`pickup = $${paramCount++}`);
      values.push(rideRequest.pickup);
    }
    if (rideRequest.destination !== undefined) {
      fields.push(`destination = $${paramCount++}`);
      values.push(rideRequest.destination);
    }
    if (rideRequest.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(rideRequest.status);
    }
    if (rideRequest.timestamp !== undefined) {
      fields.push(`timestamp = $${paramCount++}`);
      values.push(rideRequest.timestamp);
    }
    if (rideRequest.driver_id !== undefined) {
      fields.push(`driver_id = $${paramCount++}`);
      values.push(rideRequest.driver_id);
    }
    if (rideRequest.eta !== undefined) {
      fields.push(`eta = $${paramCount++}`);
      values.push(rideRequest.eta);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE ride_requests SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM ride_requests WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

