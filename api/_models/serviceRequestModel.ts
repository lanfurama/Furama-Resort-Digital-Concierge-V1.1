import pool from '../_config/database.js';

export interface ServiceRequest {
  id: number;
  type: 'DINING' | 'SPA' | 'HOUSEKEEPING' | 'POOL' | 'BUTLER' | 'EXTEND_STAY';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED';
  details: string;
  room_number: string;
  timestamp: number;
  rating?: number | null;
  feedback?: string | null;
  created_at: Date;
  updated_at: Date;
}

export const serviceRequestModel = {
  async getAll(): Promise<ServiceRequest[]> {
    const result = await pool.query('SELECT * FROM service_requests ORDER BY timestamp DESC');
    return result.rows;
  },

  async getById(id: number): Promise<ServiceRequest | null> {
    const result = await pool.query('SELECT * FROM service_requests WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async getByRoomNumber(roomNumber: string): Promise<ServiceRequest[]> {
    const result = await pool.query(
      'SELECT * FROM service_requests WHERE room_number = $1 ORDER BY timestamp DESC',
      [roomNumber]
    );
    return result.rows;
  },

  async getByStatus(status: ServiceRequest['status']): Promise<ServiceRequest[]> {
    const result = await pool.query(
      'SELECT * FROM service_requests WHERE status = $1 ORDER BY timestamp DESC',
      [status]
    );
    return result.rows;
  },

  async getByType(type: ServiceRequest['type']): Promise<ServiceRequest[]> {
    const result = await pool.query(
      'SELECT * FROM service_requests WHERE type = $1 ORDER BY timestamp DESC',
      [type]
    );
    return result.rows;
  },

  async create(serviceRequest: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceRequest> {
    const result = await pool.query(
      'INSERT INTO service_requests (type, status, details, room_number, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        serviceRequest.type,
        serviceRequest.status,
        serviceRequest.details,
        serviceRequest.room_number,
        serviceRequest.timestamp
      ]
    );
    return result.rows[0];
  },

  async update(id: number, serviceRequest: Partial<Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>>): Promise<ServiceRequest | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (serviceRequest.type !== undefined) {
      fields.push(`type = $${paramCount++}`);
      values.push(serviceRequest.type);
    }
    if (serviceRequest.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(serviceRequest.status);
    }
    if (serviceRequest.details !== undefined) {
      fields.push(`details = $${paramCount++}`);
      values.push(serviceRequest.details);
    }
    if (serviceRequest.room_number !== undefined) {
      fields.push(`room_number = $${paramCount++}`);
      values.push(serviceRequest.room_number);
    }
    if (serviceRequest.timestamp !== undefined) {
      fields.push(`timestamp = $${paramCount++}`);
      values.push(serviceRequest.timestamp);
    }
    if (serviceRequest.rating !== undefined) {
      fields.push(`rating = $${paramCount++}`);
      values.push(serviceRequest.rating || null);
    }
    if (serviceRequest.feedback !== undefined) {
      fields.push(`feedback = $${paramCount++}`);
      values.push(serviceRequest.feedback || null);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE service_requests SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM service_requests WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

