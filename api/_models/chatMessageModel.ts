import pool from '../_config/database.js';

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  text: string;
  user_id?: number;
  room_number?: string;
  service_type?: string;
  created_at: Date;
}

export const chatMessageModel = {
  async getAll(): Promise<ChatMessage[]> {
    const result = await pool.query('SELECT * FROM chat_messages ORDER BY created_at DESC');
    return result.rows;
  },

  async getById(id: number): Promise<ChatMessage | null> {
    const result = await pool.query('SELECT * FROM chat_messages WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async getByUserId(userId: number): Promise<ChatMessage[]> {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    return result.rows;
  },

  async getByRoomNumber(roomNumber: string): Promise<ChatMessage[]> {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE room_number = $1 ORDER BY created_at ASC',
      [roomNumber]
    );
    return result.rows;
  },

  async getByRoomNumberAndService(roomNumber: string, serviceType: string): Promise<ChatMessage[]> {
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE room_number = $1 AND service_type = $2 ORDER BY created_at ASC',
      [roomNumber, serviceType]
    );
    return result.rows;
  },

  async create(chatMessage: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const result = await pool.query(
      'INSERT INTO chat_messages (role, text, user_id, room_number, service_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        chatMessage.role,
        chatMessage.text,
        chatMessage.user_id || null,
        chatMessage.room_number || null,
        chatMessage.service_type || null
      ]
    );
    return result.rows[0];
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM chat_messages WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  // Get last read message ID for a user in a service chat
  async getLastReadMessageId(roomNumber: string, serviceType: string, userRole: 'user' | 'staff'): Promise<number | null> {
    const identifier = userRole === 'user' ? roomNumber : `staff_${serviceType}`;
    const result = await pool.query(
      `SELECT last_read_message_id FROM user_read_messages 
       WHERE identifier = $1 AND service_type = $2`,
      [identifier, serviceType]
    );
    return result.rows[0]?.last_read_message_id || null;
  },

  // Mark messages as read (update last read message ID)
  async markAsRead(roomNumber: string, serviceType: string, messageId: number, userRole: 'user' | 'staff'): Promise<void> {
    const identifier = userRole === 'user' ? roomNumber : `staff_${serviceType}`;
    await pool.query(
      `INSERT INTO user_read_messages (identifier, service_type, last_read_message_id, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (identifier, service_type) 
       DO UPDATE SET last_read_message_id = $3, updated_at = CURRENT_TIMESTAMP`,
      [identifier, serviceType, messageId]
    );
  },

  // Get unread count for a user in a service chat
  async getUnreadCount(roomNumber: string, serviceType: string, userRole: 'user' | 'staff'): Promise<number> {
    const lastReadId = await this.getLastReadMessageId(roomNumber, serviceType, userRole);
    // Map userRole to database role: 'user' -> 'user', 'staff' -> 'model'
    const otherRole = userRole === 'user' ? 'model' : 'user';
    
    if (lastReadId === null) {
      // If never read, count all messages from other person
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM chat_messages 
         WHERE room_number = $1 AND service_type = $2 AND role = $3`,
        [roomNumber, serviceType, otherRole]
      );
      return parseInt(result.rows[0].count) || 0;
    } else {
      // Count messages from other person after last read
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM chat_messages 
         WHERE room_number = $1 AND service_type = $2 AND role = $3 AND id > $4`,
        [roomNumber, serviceType, otherRole, lastReadId]
      );
      return parseInt(result.rows[0].count) || 0;
    }
  },
};

