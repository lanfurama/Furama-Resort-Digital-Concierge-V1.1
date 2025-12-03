import pool from '../config/database.js';

export interface Location {
  id: number;
  lat: number;
  lng: number;
  name: string;
  type?: 'VILLA' | 'FACILITY' | 'RESTAURANT';
  created_at: Date;
  updated_at: Date;
}

export const locationModel = {
  async getAll(): Promise<Location[]> {
    const result = await pool.query('SELECT * FROM locations ORDER BY name');
    return result.rows;
  },

  async getById(id: number): Promise<Location | null> {
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    const result = await pool.query(
      'INSERT INTO locations (lat, lng, name, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [location.lat, location.lng, location.name, location.type || null]
    );
    return result.rows[0];
  },

  async update(id: number, location: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>): Promise<Location | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (location.lat !== undefined) {
      fields.push(`lat = $${paramCount++}`);
      values.push(location.lat);
    }
    if (location.lng !== undefined) {
      fields.push(`lng = $${paramCount++}`);
      values.push(location.lng);
    }
    if (location.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(location.name);
    }
    if (location.type !== undefined) {
      fields.push(`type = $${paramCount++}`);
      values.push(location.type);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE locations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM locations WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

