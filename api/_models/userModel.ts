import pool from '../_config/database.js';

export interface User {
  id: number;
  last_name: string;
  room_number: string;
  villa_type?: string;
  role: 'GUEST' | 'ADMIN' | 'DRIVER' | 'STAFF' | 'SUPERVISOR' | 'RECEPTION';
  password?: string;
  language?: string | null;
  notes?: string | null;
  current_lat?: number | null;
  current_lng?: number | null;
  location_updated_at?: Date | null;
  check_in?: Date | null;
  check_out?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const userModel = {
  async getAll(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  async getById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async getByRoomNumber(roomNumber: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE room_number = $1', [roomNumber]);
    return result.rows[0] || null;
  },

  async getByRoomNumberAndPassword(roomNumber: string, password: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE room_number = $1 AND password = $2',
      [roomNumber, password]
    );
    return result.rows[0] || null;
  },

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (last_name, room_number, villa_type, role, password, language, notes, check_in, check_out) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        user.last_name, 
        user.room_number, 
        user.villa_type || null, 
        user.role, 
        user.password || null, 
        user.language || 'English', 
        user.notes || null,
        user.check_in || null,
        user.check_out || null
      ]
    );
    return result.rows[0];
  },

  async update(id: number, user: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    console.log('userModel.update called with:', { id, user });

    if (user.last_name !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(user.last_name);
    }
    if (user.room_number !== undefined) {
      fields.push(`room_number = $${paramCount++}`);
      values.push(user.room_number);
    }
    if (user.villa_type !== undefined) {
      fields.push(`villa_type = $${paramCount++}`);
      values.push(user.villa_type);
    }
    if (user.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(user.role);
    }
    if (user.password !== undefined) {
      fields.push(`password = $${paramCount++}`);
      values.push(user.password);
    }
    if (user.language !== undefined && user.language !== null) {
      console.log('Adding language to update:', user.language);
      fields.push(`language = $${paramCount++}`);
      values.push(user.language);
    } else {
      console.log('Language is undefined or null, skipping update');
    }
    if (user.notes !== undefined) {
      console.log('Adding notes to update:', user.notes);
      fields.push(`notes = $${paramCount++}`);
      values.push(user.notes || null);
    }
    if (user.check_in !== undefined) {
      fields.push(`check_in = $${paramCount++}`);
      values.push(user.check_in || null);
    }
    if (user.check_out !== undefined) {
      fields.push(`check_out = $${paramCount++}`);
      values.push(user.check_out || null);
    }
    if (user.current_lat !== undefined) {
      fields.push(`current_lat = $${paramCount++}`);
      values.push(user.current_lat !== null ? user.current_lat : null);
    }
    if (user.current_lng !== undefined) {
      fields.push(`current_lng = $${paramCount++}`);
      values.push(user.current_lng !== null ? user.current_lng : null);
    }
    if (user.current_lat !== undefined || user.current_lng !== undefined) {
      // Update location_updated_at when location is updated
      fields.push(`location_updated_at = NOW()`);
    }

    // Always update updated_at timestamp, even if no other fields are being updated
    // This is useful for heartbeat/ping mechanisms
    // We explicitly set updated_at to NOW() to ensure it's always updated
    // If trigger is BEFORE UPDATE, we need to disable it temporarily or use a different approach
    if (fields.length === 0) {
      // Force an update by directly setting updated_at to NOW()
      // Temporarily disable trigger to ensure our value is used
      // Then re-enable it
      try {
        // Disable trigger temporarily
        await pool.query('ALTER TABLE users DISABLE TRIGGER update_users_updated_at');
        
        const query = `UPDATE users SET updated_at = NOW() WHERE id = $1 RETURNING *`;
        console.log('[userModel.update] Heartbeat query:', query);
        console.log('[userModel.update] Driver ID:', id);
        console.log('[userModel.update] Current timestamp:', new Date().toISOString());
        
        const result = await pool.query(query, [id]);
        const updatedUser = result.rows[0];
        
        // Re-enable trigger
        await pool.query('ALTER TABLE users ENABLE TRIGGER update_users_updated_at');
        
        console.log('[userModel.update] Heartbeat result updated_at:', updatedUser?.updated_at);
        console.log('[userModel.update] Heartbeat result full:', updatedUser);
        
        // Verify the timestamp is recent (within last minute)
        if (updatedUser?.updated_at) {
          const dbTime = new Date(updatedUser.updated_at);
          const now = new Date();
          const diffMs = now.getTime() - dbTime.getTime();
          console.log('[userModel.update] Time difference:', diffMs, 'ms');
          if (diffMs > 60000) {
            console.warn('[userModel.update] WARNING: updated_at is more than 1 minute old!');
          } else {
            console.log('[userModel.update] ✅ updated_at is fresh!');
          }
        } else {
          console.error('[userModel.update] ERROR: updated_at is missing from result!');
        }
        
        return updatedUser || null;
      } catch (error) {
        // Make sure to re-enable trigger even if there's an error
        try {
          await pool.query('ALTER TABLE users ENABLE TRIGGER update_users_updated_at');
        } catch (e) {
          console.error('[userModel.update] Failed to re-enable trigger:', e);
        }
        throw error;
      }
    }

    // Normal update with fields
    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    console.log('[userModel.update] Executing query:', query);
    console.log('[userModel.update] Query values:', values);
    console.log('[userModel.update] Current timestamp:', new Date().toISOString());
    
    const result = await pool.query(query, values);
    const updatedUser = result.rows[0];
    console.log('[userModel.update] Query result updated_at:', updatedUser?.updated_at);
    console.log('[userModel.update] Query result full:', updatedUser);
    return updatedUser || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  // Mark driver as offline by setting updated_at to a past timestamp (3 minutes ago)
  // This ensures the driver is immediately considered offline
  async markOffline(id: number): Promise<User | null> {
    try {
      // Disable trigger temporarily to set updated_at to a past time
      await pool.query('ALTER TABLE users DISABLE TRIGGER update_users_updated_at');
      
      // Set updated_at to 3 minutes ago to ensure driver is considered offline
      const query = `UPDATE users SET updated_at = NOW() - INTERVAL '3 minutes' WHERE id = $1 RETURNING *`;
      console.log('[userModel.markOffline] Marking driver offline:', id);
      
      const result = await pool.query(query, [id]);
      const updatedUser = result.rows[0];
      
      // Re-enable trigger
      await pool.query('ALTER TABLE users ENABLE TRIGGER update_users_updated_at');
      
      console.log('[userModel.markOffline] Driver marked offline, updated_at:', updatedUser?.updated_at);
      return updatedUser || null;
    } catch (error) {
      // Make sure to re-enable trigger even if there's an error
      try {
        await pool.query('ALTER TABLE users ENABLE TRIGGER update_users_updated_at');
      } catch (e) {
        console.error('[userModel.markOffline] Failed to re-enable trigger:', e);
      }
      throw error;
    }
  },

  // Update driver location (for DRIVER role only)
  async updateLocation(id: number, lat: number, lng: number): Promise<User | null> {
    try {
      const result = await pool.query(
        `UPDATE users 
         SET current_lat = $1, current_lng = $2, location_updated_at = NOW(), updated_at = NOW() 
         WHERE id = $3 AND role = 'DRIVER' 
         RETURNING *`,
        [lat, lng, id]
      );
      
      if (result.rows.length === 0) {
        console.warn(`[userModel.updateLocation] User ${id} not found or not a driver`);
        return null;
      }
      
      console.log(`[userModel.updateLocation] Updated location for driver ${id}:`, { lat, lng });
      return result.rows[0];
    } catch (error) {
      console.error('[userModel.updateLocation] Error updating driver location:', error);
      throw error;
    }
  },

  // Get all drivers with their current locations
  async getDriversWithLocations(): Promise<User[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE role = 'DRIVER' ORDER BY last_name`
      );
      return result.rows;
    } catch (error) {
      console.error('[userModel.getDriversWithLocations] Error fetching drivers:', error);
      throw error;
    }
  },
};

