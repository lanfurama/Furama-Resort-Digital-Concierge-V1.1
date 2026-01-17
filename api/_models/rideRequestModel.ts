import pool from '../_config/database.js';

export interface RideRequest {
  id: number;
  guest_name: string;
  room_number: string;
  pickup: string;
  destination: string;
  status: 'IDLE' | 'SEARCHING' | 'ASSIGNED' | 'ARRIVING' | 'ON_TRIP' | 'COMPLETED';
  timestamp: number;
  driver_id?: number;
  eta?: number;
  rating?: number | null;
  feedback?: string | null;
  guest_count?: number; // Number of guests (1-7, default 1)
  notes?: string | null; // General notes: luggage info, lost items, special instructions
  created_at: Date;
  updated_at: Date;
  assigned_timestamp?: Date;
  pick_timestamp?: Date;
  drop_timestamp?: Date;
}

export const rideRequestModel = {
  async getAll(): Promise<RideRequest[]> {
    const result = await pool.query(`
      SELECT r.*, u.last_name as driver_name 
      FROM ride_requests r
      LEFT JOIN users u ON r.driver_id = u.id
      ORDER BY r.timestamp DESC
    `);
    return result.rows;
  },

  async getById(id: number): Promise<RideRequest | null> {
    const result = await pool.query(`
      SELECT r.*, u.last_name as driver_name 
      FROM ride_requests r
      LEFT JOIN users u ON r.driver_id = u.id
      WHERE r.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async getByRoomNumber(roomNumber: string): Promise<RideRequest[]> {
    const result = await pool.query(`
      SELECT r.*, u.last_name as driver_name 
      FROM ride_requests r
      LEFT JOIN users u ON r.driver_id = u.id
      WHERE r.room_number = $1 
      ORDER BY r.timestamp DESC
    `, [roomNumber]);
    return result.rows;
  },

  async getActiveByRoomNumber(roomNumber: string): Promise<RideRequest | null> {
    const result = await pool.query(`
      SELECT r.*, u.last_name as driver_name 
      FROM ride_requests r
      LEFT JOIN users u ON r.driver_id = u.id
      WHERE r.room_number = $1 AND r.status != 'COMPLETED' 
      ORDER BY r.timestamp DESC LIMIT 1
    `, [roomNumber]);
    return result.rows[0] || null;
  },

  async getByStatus(status: RideRequest['status']): Promise<RideRequest[]> {
    const result = await pool.query(`
      SELECT r.*, u.last_name as driver_name 
      FROM ride_requests r
      LEFT JOIN users u ON r.driver_id = u.id
      WHERE r.status = $1 
      ORDER BY r.timestamp DESC
    `, [status]);
    return result.rows;
  },

  async create(rideRequest: Omit<RideRequest, 'id' | 'created_at' | 'updated_at'>): Promise<RideRequest> {
    // Check for duplicate pending ride by guest_name (not room_number)
    // Only check duplicate if guest_name is provided
    if (rideRequest.guest_name && rideRequest.guest_name.trim() !== '') {
      const duplicateCheck = await pool.query(
        `SELECT * FROM ride_requests 
         WHERE LOWER(guest_name) = LOWER($1) 
         AND status != 'COMPLETED'
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [rideRequest.guest_name]
      );

      if (duplicateCheck.rows.length > 0) {
        const duplicate = duplicateCheck.rows[0];
        throw new Error(
          `Duplicate ride request: ${rideRequest.guest_name} already has an active ride request (${duplicate.pickup} → ${duplicate.destination}, Status: ${duplicate.status}). Please wait for it to complete or cancel it first.`
        );
      }
    }

    const result = await pool.query(
      'INSERT INTO ride_requests (guest_name, room_number, pickup, destination, status, timestamp, driver_id, eta, guest_count, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        rideRequest.guest_name,
        rideRequest.room_number,
        rideRequest.pickup,
        rideRequest.destination,
        rideRequest.status,
        rideRequest.timestamp,
        rideRequest.driver_id || null,
        rideRequest.eta || null,
        rideRequest.guest_count || 1,
        rideRequest.notes || null
      ]
    );
    return result.rows[0];
  },

  async update(id: number, rideRequest: Partial<Omit<RideRequest, 'id' | 'created_at' | 'updated_at'>>): Promise<RideRequest | null> {
    // First, get the current ride to check status change
    const currentRide = await this.getById(id);
    if (!currentRide) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (rideRequest.guest_name !== undefined) {
      fields.push(`guest_name = $${paramCount++}`);
      values.push(rideRequest.guest_name);
    }
    if (rideRequest.room_number !== undefined) {
      fields.push(`room_number = $${paramCount++}`);
      values.push(rideRequest.room_number);
    }
    if (rideRequest.pickup !== undefined) {
      fields.push(`pickup = $${paramCount++}`);
      values.push(rideRequest.pickup);
    }
    if (rideRequest.destination !== undefined) {
      fields.push(`destination = $${paramCount++}`);
      values.push(rideRequest.destination);
    }

    // Handle status change and set timestamps automatically
    if (rideRequest.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(rideRequest.status);

      // Set timestamps based on status change
      const newStatus = rideRequest.status;
      const oldStatus = currentRide.status;

      // When driver accepts ride (ASSIGNED or ARRIVING)
      if ((newStatus === 'ASSIGNED' || newStatus === 'ARRIVING') && oldStatus !== 'ASSIGNED' && oldStatus !== 'ARRIVING') {
        fields.push(`assigned_timestamp = CURRENT_TIMESTAMP`);
      }

      // When driver picks up guest (ON_TRIP)
      if (newStatus === 'ON_TRIP' && oldStatus !== 'ON_TRIP') {
        fields.push(`pick_timestamp = CURRENT_TIMESTAMP`);
      }

      // When ride is completed (COMPLETED)
      if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
        fields.push(`drop_timestamp = CURRENT_TIMESTAMP`);
      }

      // Note: updated_at is automatically updated by database trigger
    }

    if (rideRequest.timestamp !== undefined) {
      fields.push(`timestamp = $${paramCount++}`);
      values.push(rideRequest.timestamp);
    }
    if (rideRequest.driver_id !== undefined) {
      fields.push(`driver_id = $${paramCount++}`);
      values.push(rideRequest.driver_id);
    }
    if (rideRequest.eta !== undefined) {
      fields.push(`eta = $${paramCount++}`);
      values.push(rideRequest.eta);
    }
    if (rideRequest.rating !== undefined) {
      fields.push(`rating = $${paramCount++}`);
      values.push(rideRequest.rating || null);
    }
    if (rideRequest.feedback !== undefined) {
      fields.push(`feedback = $${paramCount++}`);
      values.push(rideRequest.feedback || null);
    }
    if (rideRequest.guest_count !== undefined) {
      fields.push(`guest_count = $${paramCount++}`);
      values.push(rideRequest.guest_count);
    }
    if (rideRequest.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(rideRequest.notes || null);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE ride_requests SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM ride_requests WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async getHistoricalReports(params: {
    startDate?: Date;
    endDate?: Date;
    period?: 'day' | 'week' | 'month';
    driverId?: number;
    status?: RideRequest['status'];
  }): Promise<RideRequest[]> {
    let query = 'SELECT * FROM ride_requests WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    // Filter by date range
    if (params.startDate) {
      query += ` AND (drop_timestamp >= $${paramCount} OR (drop_timestamp IS NULL AND created_at >= $${paramCount}))`;
      values.push(params.startDate);
      paramCount++;
    }

    if (params.endDate) {
      query += ` AND (drop_timestamp <= $${paramCount} OR (drop_timestamp IS NULL AND created_at <= $${paramCount}))`;
      values.push(params.endDate);
      paramCount++;
    }

    // Filter by period (if no explicit date range provided)
    if (!params.startDate && !params.endDate && params.period) {
      const now = new Date();
      let startDate: Date;

      if (params.period === 'day') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (params.period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else {
        // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
      }

      query += ` AND (drop_timestamp >= $${paramCount} OR (drop_timestamp IS NULL AND created_at >= $${paramCount}))`;
      values.push(startDate);
      paramCount++;
    }

    // Filter by driver
    if (params.driverId) {
      query += ` AND driver_id = $${paramCount}`;
      values.push(params.driverId);
      paramCount++;
    }

    // Filter by status (default to COMPLETED for historical reports)
    if (params.status) {
      query += ` AND status = $${paramCount}`;
      values.push(params.status);
      paramCount++;
    } else {
      // Default: only show completed rides for historical reports
      query += ` AND status = 'COMPLETED'`;
    }

    query += ' ORDER BY drop_timestamp DESC, created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  },

  async getReportStatistics(params: {
    startDate?: Date;
    endDate?: Date;
    period?: 'day' | 'week' | 'month';
    driverId?: number;
  }): Promise<{
    totalRides: number;
    totalGuests: number;
    avgRating: number;
    totalRatings: number;
    avgResponseTime: number; // Average time from SEARCHING to ASSIGNED (ms)
    avgTripTime: number; // Average time from ON_TRIP to COMPLETED (ms)
    ridesByStatus: Record<string, number>;
    ridesByDriver: Array<{ driver_id: number; driver_name: string; ride_count: number }>;
  }> {
    // Get rides for statistics
    const rides = await this.getHistoricalReports({
      ...params,
      status: 'COMPLETED'
    });

    // Calculate statistics
    const totalRides = rides.length;
    const totalGuests = rides.reduce((sum, r) => sum + (r.guest_count || 1), 0);

    const ratedRides = rides.filter(r => r.rating !== null && r.rating !== undefined);
    const totalRatings = ratedRides.length;
    const avgRating = totalRatings > 0
      ? ratedRides.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRatings
      : 0;

    // Calculate average response time (SEARCHING to ASSIGNED)
    const ridesWithResponseTime = rides.filter(r => r.assigned_timestamp && r.timestamp);
    const totalResponseTime = ridesWithResponseTime.reduce((sum, r) => {
      const responseTime = new Date(r.assigned_timestamp!).getTime() - r.timestamp;
      return sum + (responseTime > 0 ? responseTime : 0);
    }, 0);
    const avgResponseTime = ridesWithResponseTime.length > 0
      ? totalResponseTime / ridesWithResponseTime.length
      : 0;

    // Calculate average trip time (ON_TRIP to COMPLETED)
    const ridesWithTripTime = rides.filter(r => r.drop_timestamp && r.pick_timestamp);
    const totalTripTime = ridesWithTripTime.reduce((sum, r) => {
      const tripTime = new Date(r.drop_timestamp!).getTime() - new Date(r.pick_timestamp!).getTime();
      return sum + (tripTime > 0 ? tripTime : 0);
    }, 0);
    const avgTripTime = ridesWithTripTime.length > 0
      ? totalTripTime / ridesWithTripTime.length
      : 0;

    // Count rides by status
    const ridesByStatus: Record<string, number> = {};
    rides.forEach(r => {
      ridesByStatus[r.status] = (ridesByStatus[r.status] || 0) + 1;
    });

    // Count rides by driver
    const driverMap = new Map<number, { driver_id: number; driver_name: string; ride_count: number }>();
    rides.forEach(r => {
      if (r.driver_id) {
        const existing = driverMap.get(r.driver_id);
        if (existing) {
          existing.ride_count++;
        } else {
          driverMap.set(r.driver_id, {
            driver_id: r.driver_id,
            driver_name: `Driver ${r.driver_id}`, // Will be enriched with actual name in controller
            ride_count: 1
          });
        }
      }
    });

    return {
      totalRides,
      totalGuests,
      avgRating,
      totalRatings,
      avgResponseTime,
      avgTripTime,
      ridesByStatus,
      ridesByDriver: Array.from(driverMap.values())
    };
  },

  async getDriverPerformanceStats(params: {
    startDate?: Date;
    endDate?: Date;
    period?: 'day' | 'week' | 'month';
    driverId?: number;
  }): Promise<Array<{
    driver_id: number;
    driver_name: string;
    total_rides: number;
    avg_rating: number;
    rating_count: number;
    avg_response_time: number; // ms
    avg_trip_time: number; // ms
    performance_score: number;
  }>> {
    // Get completed rides for the period
    const rides = await this.getHistoricalReports({
      ...params,
      status: 'COMPLETED'
    });

    // Get all drivers
    const { userModel } = await import('./userModel.js');
    const allUsers = await userModel.getAll();
    const drivers = allUsers.filter(u => u.role === 'DRIVER');

    // Create driver stats map
    const driverStatsMap = new Map<number, {
      driver_id: number;
      driver_name: string;
      total_rides: number;
      total_rating: number;
      rating_count: number;
      total_response_time: number;
      response_time_count: number;
      total_trip_time: number;
      trip_time_count: number;
    }>();

    // Initialize all drivers
    drivers.forEach(driver => {
      driverStatsMap.set(driver.id, {
        driver_id: driver.id,
        driver_name: `${driver.last_name || ''}`.trim() || `Driver ${driver.id}`,
        total_rides: 0,
        total_rating: 0,
        rating_count: 0,
        total_response_time: 0,
        response_time_count: 0,
        total_trip_time: 0,
        trip_time_count: 0,
      });
    });

    // Process rides
    rides.forEach(ride => {
      if (!ride.driver_id) return;

      const stats = driverStatsMap.get(ride.driver_id);
      if (!stats) return;

      stats.total_rides++;

      // Rating
      if (ride.rating !== null && ride.rating !== undefined) {
        stats.total_rating += ride.rating;
        stats.rating_count++;
      }

      // Response time (SEARCHING to ASSIGNED)
      if (ride.assigned_timestamp && ride.timestamp) {
        const responseTime = new Date(ride.assigned_timestamp).getTime() - ride.timestamp;
        if (responseTime > 0) {
          stats.total_response_time += responseTime;
          stats.response_time_count++;
        }
      }

      // Trip time (ON_TRIP to COMPLETED)
      if (ride.drop_timestamp && ride.pick_timestamp) {
        const tripTime = new Date(ride.drop_timestamp).getTime() - new Date(ride.pick_timestamp).getTime();
        if (tripTime > 0) {
          stats.total_trip_time += tripTime;
          stats.trip_time_count++;
        }
      }
    });

    // Calculate averages and performance scores
    const driverStatsArray = Array.from(driverStatsMap.values()).map(stats => {
      const avg_rating = stats.rating_count > 0 ? stats.total_rating / stats.rating_count : 0;
      const avg_response_time = stats.response_time_count > 0
        ? stats.total_response_time / stats.response_time_count
        : 0;
      const avg_trip_time = stats.trip_time_count > 0
        ? stats.total_trip_time / stats.trip_time_count
        : 0;

      // Calculate performance score (higher is better)
      // Formula: (rides * 0.4) + (rating * 20 * 0.3) + (response speed * 0.2) + (trip efficiency * 0.1)
      const normalizedRides = Math.min(stats.total_rides / 50, 1) * 100;
      const normalizedRating = avg_rating * 20; // 0-5 rating -> 0-100
      const normalizedResponse = avg_response_time > 0
        ? Math.max(0, 100 - (avg_response_time / 60000) * 10) // Faster = better, max 10 min
        : 50; // Default if no data
      const normalizedTrip = avg_trip_time > 0
        ? Math.max(0, 100 - (avg_trip_time / 600000) * 5) // Faster = better, max 10 min
        : 50; // Default if no data

      const performance_score =
        normalizedRides * 0.4 +
        normalizedRating * 0.3 +
        normalizedResponse * 0.2 +
        normalizedTrip * 0.1;

      return {
        driver_id: stats.driver_id,
        driver_name: stats.driver_name,
        total_rides: stats.total_rides,
        avg_rating,
        rating_count: stats.rating_count,
        avg_response_time,
        avg_trip_time,
        performance_score,
      };
    });

    // Sort by performance score (descending)
    driverStatsArray.sort((a, b) => b.performance_score - a.performance_score);

    return driverStatsArray;
  },
};

