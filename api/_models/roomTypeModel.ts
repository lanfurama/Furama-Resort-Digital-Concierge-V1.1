import pool from '../_config/database.js';

export interface RoomType {
  id: number;
  name: string;
  description?: string;
  location_id?: number;
  created_at: Date;
  updated_at: Date;
}

export const roomTypeModel = {
  async getAll(): Promise<RoomType[]> {
    const result = await pool.query('SELECT * FROM room_types ORDER BY name');
    return result.rows;
  },

  async getById(id: number): Promise<RoomType | null> {
    const result = await pool.query('SELECT * FROM room_types WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(roomType: Omit<RoomType, 'id' | 'created_at' | 'updated_at'>): Promise<RoomType> {
    const result = await pool.query(
      'INSERT INTO room_types (name, description, location_id) VALUES ($1, $2, $3) RETURNING *',
      [roomType.name, roomType.description || null, roomType.location_id || null]
    );
    return result.rows[0];
  },

  async update(id: number, roomType: Partial<Omit<RoomType, 'id' | 'created_at' | 'updated_at'>>): Promise<RoomType | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (roomType.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(roomType.name);
    }
    if (roomType.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(roomType.description || null);
    }
    if (roomType.location_id !== undefined) {
      fields.push(`location_id = $${paramCount++}`);
      values.push(roomType.location_id || null);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE room_types SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM room_types WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

