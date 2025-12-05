import pool from '../config/database.js';

export interface HotelReview {
  id: number;
  room_number: string;
  guest_name: string;
  category_ratings: Array<{ category: string; rating: number }>;
  average_rating: number;
  comment?: string;
  timestamp: number;
  created_at: Date;
  updated_at: Date;
}

export const hotelReviewModel = {
  async getAll(): Promise<HotelReview[]> {
    const result = await pool.query(
      'SELECT * FROM hotel_reviews ORDER BY created_at DESC'
    );
    return result.rows.map(row => ({
      ...row,
      category_ratings: typeof row.category_ratings === 'string' 
        ? JSON.parse(row.category_ratings) 
        : row.category_ratings
    }));
  },

  async getByRoomNumber(roomNumber: string): Promise<HotelReview | null> {
    const result = await pool.query(
      'SELECT * FROM hotel_reviews WHERE room_number = $1',
      [roomNumber]
    );
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      ...row,
      category_ratings: typeof row.category_ratings === 'string' 
        ? JSON.parse(row.category_ratings) 
        : row.category_ratings
    };
  },

  async create(review: Omit<HotelReview, 'id' | 'created_at' | 'updated_at'>): Promise<HotelReview> {
    const result = await pool.query(
      `INSERT INTO hotel_reviews (room_number, guest_name, category_ratings, average_rating, comment, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (room_number) 
       DO UPDATE SET 
         guest_name = EXCLUDED.guest_name,
         category_ratings = EXCLUDED.category_ratings,
         average_rating = EXCLUDED.average_rating,
         comment = EXCLUDED.comment,
         timestamp = EXCLUDED.timestamp,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        review.room_number,
        review.guest_name,
        JSON.stringify(review.category_ratings),
        review.average_rating,
        review.comment || null,
        review.timestamp
      ]
    );
    const row = result.rows[0];
    return {
      ...row,
      category_ratings: typeof row.category_ratings === 'string' 
        ? JSON.parse(row.category_ratings) 
        : row.category_ratings
    };
  },

  async update(id: number, review: Partial<Omit<HotelReview, 'id' | 'created_at' | 'updated_at'>>): Promise<HotelReview | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (review.room_number !== undefined) {
      fields.push(`room_number = $${paramCount++}`);
      values.push(review.room_number);
    }
    if (review.guest_name !== undefined) {
      fields.push(`guest_name = $${paramCount++}`);
      values.push(review.guest_name);
    }
    if (review.category_ratings !== undefined) {
      fields.push(`category_ratings = $${paramCount++}`);
      values.push(JSON.stringify(review.category_ratings));
    }
    if (review.average_rating !== undefined) {
      fields.push(`average_rating = $${paramCount++}`);
      values.push(review.average_rating);
    }
    if (review.comment !== undefined) {
      fields.push(`comment = $${paramCount++}`);
      values.push(review.comment);
    }
    if (review.timestamp !== undefined) {
      fields.push(`timestamp = $${paramCount++}`);
      values.push(review.timestamp);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE hotel_reviews SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      ...row,
      category_ratings: typeof row.category_ratings === 'string' 
        ? JSON.parse(row.category_ratings) 
        : row.category_ratings
    };
  },

  async getById(id: number): Promise<HotelReview | null> {
    const result = await pool.query('SELECT * FROM hotel_reviews WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      ...row,
      category_ratings: typeof row.category_ratings === 'string' 
        ? JSON.parse(row.category_ratings) 
        : row.category_ratings
    };
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM hotel_reviews WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};



