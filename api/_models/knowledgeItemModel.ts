import pool from '../_config/database.js';

export interface KnowledgeItem {
  id: number;
  question: string;
  answer: string;
  created_at: Date;
  updated_at: Date;
}

export const knowledgeItemModel = {
  async getAll(): Promise<KnowledgeItem[]> {
    const result = await pool.query('SELECT * FROM knowledge_items ORDER BY question');
    return result.rows;
  },

  async getById(id: number): Promise<KnowledgeItem | null> {
    const result = await pool.query('SELECT * FROM knowledge_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(knowledgeItem: Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>): Promise<KnowledgeItem> {
    const result = await pool.query(
      'INSERT INTO knowledge_items (question, answer) VALUES ($1, $2) RETURNING *',
      [knowledgeItem.question, knowledgeItem.answer]
    );
    return result.rows[0];
  },

  async update(id: number, knowledgeItem: Partial<Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>>): Promise<KnowledgeItem | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (knowledgeItem.question !== undefined) {
      fields.push(`question = $${paramCount++}`);
      values.push(knowledgeItem.question);
    }
    if (knowledgeItem.answer !== undefined) {
      fields.push(`answer = $${paramCount++}`);
      values.push(knowledgeItem.answer);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE knowledge_items SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM knowledge_items WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

