import pool from '../_config/database.js';

export interface Promotion {
  id: number;
  title: string;
  description?: string;
  discount?: string;
  valid_until?: string;
  image_color?: string;
  image_url?: string;
  language?: string;
  created_at: Date;
  updated_at: Date;
}

export const promotionModel = {
  async getAll(language?: string): Promise<Promotion[]> {
    let query = 'SELECT * FROM promotions';
    const params: any[] = [];
    
    if (language) {
      query += ' WHERE language = $1';
      params.push(language);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async getById(id: number): Promise<Promotion | null> {
    const result = await pool.query('SELECT * FROM promotions WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>): Promise<Promotion> {
    const result = await pool.query(
      'INSERT INTO promotions (title, description, discount, valid_until, image_color, image_url, language) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        promotion.title,
        promotion.description || null,
        promotion.discount || null,
        promotion.valid_until || null,
        promotion.image_color || null,
        promotion.image_url || null,
        promotion.language || 'English'
      ]
    );
    return result.rows[0];
  },

  async update(id: number, promotion: Partial<Omit<Promotion, 'id' | 'created_at' | 'updated_at'>>): Promise<Promotion | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (promotion.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(promotion.title);
    }
    if (promotion.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(promotion.description);
    }
    if (promotion.discount !== undefined) {
      fields.push(`discount = $${paramCount++}`);
      values.push(promotion.discount);
    }
    if (promotion.valid_until !== undefined) {
      fields.push(`valid_until = $${paramCount++}`);
      values.push(promotion.valid_until);
    }
    if (promotion.image_color !== undefined) {
      fields.push(`image_color = $${paramCount++}`);
      values.push(promotion.image_color);
    }
    if (promotion.image_url !== undefined) {
      fields.push(`image_url = $${paramCount++}`);
      values.push(promotion.image_url);
    }
    if (promotion.language !== undefined) {
      fields.push(`language = $${paramCount++}`);
      values.push(promotion.language);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE promotions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM promotions WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

