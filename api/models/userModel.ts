import pool from '../config/database.js';

export interface User {
  id: number;
  last_name: string;
  room_number: string;
  villa_type?: string;
  role: 'GUEST' | 'ADMIN' | 'DRIVER' | 'STAFF' | 'SUPERVISOR';
  password?: string;
  created_at: Date;
  updated_at: Date;
}

export const userModel = {
  async getAll(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  async getById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async getByRoomNumber(roomNumber: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE room_number = $1', [roomNumber]);
    return result.rows[0] || null;
  },

  async getByRoomNumberAndPassword(roomNumber: string, password: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE room_number = $1 AND password = $2',
      [roomNumber, password]
    );
    return result.rows[0] || null;
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (last_name, room_number, villa_type, role, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.last_name, user.room_number, user.villa_type || null, user.role, user.password || null]
    );
    return result.rows[0];
  },

  async update(id: number, user: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (user.last_name !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(user.last_name);
    }
    if (user.room_number !== undefined) {
      fields.push(`room_number = $${paramCount++}`);
      values.push(user.room_number);
    }
    if (user.villa_type !== undefined) {
      fields.push(`villa_type = $${paramCount++}`);
      values.push(user.villa_type);
    }
    if (user.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(user.role);
    }
    if (user.password !== undefined) {
      fields.push(`password = $${paramCount++}`);
      values.push(user.password);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

