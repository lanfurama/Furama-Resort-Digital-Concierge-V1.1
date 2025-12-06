import pool from '../_config/database.js';

export interface Room {
  id: number;
  number: string;
  type_id: number;
  status?: 'Available' | 'Occupied' | 'Maintenance';
  created_at: Date;
  updated_at: Date;
}

export const roomModel = {
  async getAll(): Promise<Room[]> {
    const result = await pool.query('SELECT * FROM rooms ORDER BY number');
    return result.rows;
  },

  async getById(id: number): Promise<Room | null> {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async getByNumber(number: string): Promise<Room | null> {
    const result = await pool.query('SELECT * FROM rooms WHERE number = $1', [number]);
    return result.rows[0] || null;
  },

  async getByTypeId(typeId: number): Promise<Room[]> {
    const result = await pool.query('SELECT * FROM rooms WHERE type_id = $1 ORDER BY number', [typeId]);
    return result.rows;
  },

  async create(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> {
    const result = await pool.query(
      'INSERT INTO rooms (number, type_id, status) VALUES ($1, $2, $3) RETURNING *',
      [room.number, room.type_id, room.status || 'Available']
    );
    return result.rows[0];
  },

  async update(id: number, room: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>): Promise<Room | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (room.number !== undefined) {
      fields.push(`number = $${paramCount++}`);
      values.push(room.number);
    }
    if (room.type_id !== undefined) {
      fields.push(`type_id = $${paramCount++}`);
      values.push(room.type_id);
    }
    if (room.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(room.status);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE rooms SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async bulkCreate(rooms: Omit<Room, 'id' | 'created_at' | 'updated_at'>[]): Promise<Room[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const createdRooms: Room[] = [];

      for (const room of rooms) {
        // Check if room number already exists
        const existing = await client.query('SELECT id FROM rooms WHERE number = $1', [room.number]);
        if (existing.rows.length > 0) {
          // Update existing room
          const updated = await client.query(
            'UPDATE rooms SET type_id = $1, status = $2 WHERE number = $3 RETURNING *',
            [room.type_id, room.status || 'Available', room.number]
          );
          createdRooms.push(updated.rows[0]);
        } else {
          // Insert new room
          const inserted = await client.query(
            'INSERT INTO rooms (number, type_id, status) VALUES ($1, $2, $3) RETURNING *',
            [room.number, room.type_id, room.status || 'Available']
          );
          createdRooms.push(inserted.rows[0]);
        }
      }

      await client.query('COMMIT');
      return createdRooms;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

