import pool from '../config/database.js';

export interface ResortEvent {
  id: number;
  title: string;
  date: string; // DATE type in DB
  time: string; // TIME type in DB
  location: string;
  description?: string;
  language?: string;
  created_at: Date;
  updated_at: Date;
}

export const resortEventModel = {
  async getAll(language?: string): Promise<ResortEvent[]> {
    let query = 'SELECT * FROM resort_events';
    const params: any[] = [];
    
    if (language) {
      query += ' WHERE language = $1';
      params.push(language);
    }
    
    query += ' ORDER BY date DESC, time DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async getById(id: number): Promise<ResortEvent | null> {
    const result = await pool.query('SELECT * FROM resort_events WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(resortEvent: Omit<ResortEvent, 'id' | 'created_at' | 'updated_at'>): Promise<ResortEvent> {
    const result = await pool.query(
      'INSERT INTO resort_events (title, date, time, location, description, language) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        resortEvent.title,
        resortEvent.date,
        resortEvent.time,
        resortEvent.location,
        resortEvent.description || null,
        resortEvent.language || 'English'
      ]
    );
    return result.rows[0];
  },

  async update(id: number, resortEvent: Partial<Omit<ResortEvent, 'id' | 'created_at' | 'updated_at'>>): Promise<ResortEvent | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (resortEvent.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(resortEvent.title);
    }
    if (resortEvent.date !== undefined) {
      fields.push(`date = $${paramCount++}`);
      values.push(resortEvent.date);
    }
    if (resortEvent.time !== undefined) {
      fields.push(`time = $${paramCount++}`);
      values.push(resortEvent.time);
    }
    if (resortEvent.location !== undefined) {
      fields.push(`location = $${paramCount++}`);
      values.push(resortEvent.location);
    }
    if (resortEvent.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(resortEvent.description);
    }
    if (resortEvent.language !== undefined) {
      fields.push(`language = $${paramCount++}`);
      values.push(resortEvent.language);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE resort_events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM resort_events WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

