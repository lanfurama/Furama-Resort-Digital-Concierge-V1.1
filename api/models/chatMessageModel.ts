import pool from '../config/database.js';

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
};

