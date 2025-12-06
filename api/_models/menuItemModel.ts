import pool from '../_config/database.js';

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
  language?: string;
  created_at: Date;
  updated_at: Date;
}

export const menuItemModel = {
  async getAll(category?: string, language?: string): Promise<MenuItem[]> {
    let query = 'SELECT * FROM menu_items';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }
    
    if (language) {
      conditions.push(`language = $${params.length + 1}`);
      params.push(language);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY category, name';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async getById(id: number): Promise<MenuItem | null> {
    const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(menuItem: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const result = await pool.query(
      'INSERT INTO menu_items (name, price, category, description, language) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [menuItem.name, menuItem.price, menuItem.category, menuItem.description || null, menuItem.language || 'English']
    );
    return result.rows[0];
  },

  async update(id: number, menuItem: Partial<Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>>): Promise<MenuItem | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (menuItem.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(menuItem.name);
    }
    if (menuItem.price !== undefined) {
      fields.push(`price = $${paramCount++}`);
      values.push(menuItem.price);
    }
    if (menuItem.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(menuItem.category);
    }
    if (menuItem.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(menuItem.description);
    }
    if (menuItem.language !== undefined) {
      fields.push(`language = $${paramCount++}`);
      values.push(menuItem.language);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

