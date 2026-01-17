import pool from '../_config/database.js';

export interface Notification {
  id: number;
  recipient_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export const notificationModel = {
  async getAll(): Promise<Notification[]> {
    const result = await pool.query(
      'SELECT * FROM notifications ORDER BY created_at DESC'
    );
    return result.rows;
  },

  async getById(id: number): Promise<Notification | null> {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async getByRecipientId(recipientId: string): Promise<Notification[]> {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC',
      [recipientId]
    );
    return result.rows;
  },

  async getUnreadByRecipientId(recipientId: string): Promise<Notification[]> {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE recipient_id = $1 AND is_read = FALSE ORDER BY created_at DESC',
      [recipientId]
    );
    return result.rows;
  },

  async create(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification> {
    const result = await pool.query(
      'INSERT INTO notifications (recipient_id, title, message, type, is_read) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [notification.recipient_id, notification.title, notification.message, notification.type, notification.is_read || false]
    );
    return result.rows[0];
  },

  async createMany(notifications: Omit<Notification, 'id' | 'created_at' | 'updated_at'>[]): Promise<Notification[]> {
    if (notifications.length === 0) return [];

    const values: any[] = [];
    const placeholders: string[] = [];
    let paramCount = 1;

    notifications.forEach((n, index) => {
      placeholders.push(`($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++})`);
      values.push(n.recipient_id, n.title, n.message, n.type, n.is_read || false);
    });

    const query = `
      INSERT INTO notifications (recipient_id, title, message, type, is_read) 
      VALUES ${placeholders.join(', ')} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows;
  },

  async update(id: number, notification: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>): Promise<Notification | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (notification.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(notification.title);
    }
    if (notification.message !== undefined) {
      fields.push(`message = $${paramCount++}`);
      values.push(notification.message);
    }
    if (notification.type !== undefined) {
      fields.push(`type = $${paramCount++}`);
      values.push(notification.type);
    }
    if (notification.is_read !== undefined) {
      fields.push(`is_read = $${paramCount++}`);
      values.push(notification.is_read);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const result = await pool.query(
      `UPDATE notifications SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async markAsRead(id: number): Promise<Notification | null> {
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP WHERE recipient_id = $1 AND is_read = FALSE RETURNING *',
      [recipientId]
    );
    return result.rowCount || 0;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

