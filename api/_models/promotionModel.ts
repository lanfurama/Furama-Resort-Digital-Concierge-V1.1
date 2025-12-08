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
    // First, get the current promotion to find matching promotions in other languages
    const currentPromo = await this.getById(id);
    if (!currentPromo) {
      return null;
    }

    // Separate fields: text fields (language-specific) vs shared fields (all languages)
    const textFields: string[] = []; // title, description - only update current language
    const sharedFields: string[] = []; // discount, valid_until, image_color, image_url - update all languages
    const textValues: any[] = [];
    const sharedValues: any[] = [];
    let textParamCount = 1;
    let sharedParamCount = 1;

    // Text fields (language-specific) - only update current promotion
    if (promotion.title !== undefined) {
      textFields.push(`title = $${textParamCount++}`);
      textValues.push(promotion.title);
    }
    if (promotion.description !== undefined) {
      textFields.push(`description = $${textParamCount++}`);
      textValues.push(promotion.description);
    }
    if (promotion.language !== undefined) {
      textFields.push(`language = $${textParamCount++}`);
      textValues.push(promotion.language);
    }

    // Shared fields (update all languages) - update all promotions with matching shared fields
    if (promotion.discount !== undefined) {
      sharedFields.push(`discount = $${sharedParamCount++}`);
      sharedValues.push(promotion.discount);
    }
    if (promotion.valid_until !== undefined) {
      sharedFields.push(`valid_until = $${sharedParamCount++}`);
      sharedValues.push(promotion.valid_until);
    }
    if (promotion.image_color !== undefined) {
      sharedFields.push(`image_color = $${sharedParamCount++}`);
      sharedValues.push(promotion.image_color);
    }
    if (promotion.image_url !== undefined) {
      sharedFields.push(`image_url = $${sharedParamCount++}`);
      sharedValues.push(promotion.image_url);
    }

    // Update current promotion with text fields
    if (textFields.length > 0) {
      textValues.push(id);
      await pool.query(
        `UPDATE promotions SET ${textFields.join(', ')} WHERE id = $${textParamCount} RETURNING *`,
        textValues
      );
    }

    // Update all matching promotions (all languages) with shared fields
    // Match by current promotion's shared fields to find all language versions
    if (sharedFields.length > 0) {
      // Build query to find promotions with matching shared fields
      const matchConditions: string[] = [];
      const matchValues: any[] = [];
      let matchParamCount = 1;

      // Match by current promotion's shared fields (before update)
      if (currentPromo.discount !== null && currentPromo.discount !== undefined) {
        matchConditions.push(`discount = $${matchParamCount++}`);
        matchValues.push(currentPromo.discount);
      } else {
        matchConditions.push(`(discount IS NULL OR discount = '')`);
      }
      
      if (currentPromo.valid_until !== null && currentPromo.valid_until !== undefined) {
        matchConditions.push(`valid_until = $${matchParamCount++}`);
        matchValues.push(currentPromo.valid_until);
      } else {
        matchConditions.push(`(valid_until IS NULL OR valid_until = '')`);
    }

      if (currentPromo.image_color !== null && currentPromo.image_color !== undefined) {
        matchConditions.push(`image_color = $${matchParamCount++}`);
        matchValues.push(currentPromo.image_color);
      } else {
        matchConditions.push(`(image_color IS NULL OR image_color = '')`);
    }

      if (currentPromo.image_url !== null && currentPromo.image_url !== undefined) {
        matchConditions.push(`image_url = $${matchParamCount++}`);
        matchValues.push(currentPromo.image_url);
      } else {
        matchConditions.push(`(image_url IS NULL OR image_url = '')`);
      }

      // Find all promotions matching these shared fields
      const matchQuery = `SELECT id FROM promotions WHERE ${matchConditions.join(' AND ')}`;
      const allPromos = await pool.query(matchQuery, matchValues);
      
      // Update all matching promotions with new shared field values
      if (allPromos.rows.length > 0) {
        const promoIds = allPromos.rows.map((r: any) => r.id);
        const placeholders = promoIds.map((_: any, i: number) => `$${sharedParamCount + i}`).join(',');
        const updateQuery = `UPDATE promotions SET ${sharedFields.join(', ')} WHERE id IN (${placeholders})`;
        await pool.query(updateQuery, [...sharedValues, ...promoIds]);
        console.log(`Updated ${allPromos.rows.length} promotion(s) across all languages with shared fields`);
      }
    }

    // Return updated promotion
    return this.getById(id);
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM promotions WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

