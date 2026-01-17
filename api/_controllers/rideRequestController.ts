import { Request, Response } from 'express';
import { rideRequestModel } from '../_models/rideRequestModel.js';
import { notificationModel } from '../_models/notificationModel.js';
import { userModel } from '../_models/userModel.js';
import { sendBuggyRequestEmail, sendBuggyRequestEmailToDriver } from '../_services/emailService.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';

export const rideRequestController = {
  async getAll(req: Request, res: Response) {
    try {
      const rides = await rideRequestModel.getAll();
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'ride') });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const ride = await rideRequestModel.getById(id);
      if (!ride) {
        return res.status(404).json({ error: 'Ride request not found' });
      }
      res.json(ride);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'ride') });
    }
  },

  async getByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const rides = await rideRequestModel.getByRoomNumber(roomNumber);
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'ride') });
    }
  },

  async getActiveByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const ride = await rideRequestModel.getActiveByRoomNumber(roomNumber);
      if (!ride) {
        return res.status(404).json({ error: 'No active ride found' });
      }
      res.json(ride);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'ride') });
    }
  },

  async getByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const rides = await rideRequestModel.getByStatus(status as any);
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'ride') });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const ride = await rideRequestModel.create(req.body);

      // Send notifications when a new ride request is created (status = SEARCHING)
      if (ride.status === 'SEARCHING') {
        try {
          // Get all admins, supervisors, and reception staff
          const allUsers = await userModel.getAll();
          const adminsSupervisorsReception = allUsers.filter(
            u => u.role === 'ADMIN' || u.role === 'SUPERVISOR' || u.role === 'RECEPTION'
          );

          // Get all online drivers (updated_at within last 3 minutes)
          const onlineDrivers = allUsers.filter(
            u => u.role === 'DRIVER' &&
              u.updated_at &&
              (Date.now() - new Date(u.updated_at).getTime()) < 3 * 60 * 1000
          );

          // Notification message
          const message = `New buggy request: Room ${ride.room_number} (${ride.guest_name}) from ${ride.pickup} to ${ride.destination}`;

          console.log(`[RideRequestController] Found ${adminsSupervisorsReception.length} staff (Admin/Reception/Supervisor) to notify`);
          console.log(`[RideRequestController] Found ${onlineDrivers.length} online drivers to notify`);

          const notificationsToCreate = [];

          // Notifications for admins, supervisors, and reception
          for (const staff of adminsSupervisorsReception) {
            notificationsToCreate.push({
              recipient_id: staff.room_number,
              title: 'New Buggy Request',
              message: message,
              type: 'INFO',
              is_read: false
            });

            // Email notification (only if email is available and valid)
            if (staff.email && staff.email.trim() !== '') {
              try {
                await sendBuggyRequestEmail(
                  staff.email,
                  ride.guest_name,
                  ride.room_number,
                  ride.pickup,
                  ride.destination
                );
                console.log(`[RideRequestController] ✅ Email sent to ${staff.role} ${staff.room_number} (${staff.email})`);
              } catch (emailError: any) {
                console.error(`[RideRequestController] Failed to send email to ${staff.room_number}:`, emailError);
              }
            } else {
              console.log(`[RideRequestController] Skipping email for ${staff.role} ${staff.room_number} (no email address)`);
            }
          }

          // Notifications for online drivers
          for (const driver of onlineDrivers) {
            notificationsToCreate.push({
              recipient_id: driver.room_number,
              title: 'New Buggy Request Available',
              message: message,
              type: 'INFO',
              is_read: false
            });

            // Email notification (only if email is available and valid)
            if (driver.email && driver.email.trim() !== '') {
              try {
                await sendBuggyRequestEmailToDriver(
                  driver.email,
                  ride.guest_name,
                  ride.room_number,
                  ride.pickup,
                  ride.destination
                );
                console.log(`[RideRequestController] ✅ Email sent to driver ${driver.room_number} (${driver.email})`);
              } catch (emailError: any) {
                console.error(`[RideRequestController] Failed to send email to driver ${driver.room_number}:`, emailError);
              }
            } else {
              console.log(`[RideRequestController] Skipping email for driver ${driver.room_number} (no email address)`);
            }
          }

          // Bulk create notifications
          if (notificationsToCreate.length > 0) {
            await notificationModel.createMany(notificationsToCreate as any);
          }

          console.log(`[RideRequestController] Sent notifications: ${adminsSupervisorsReception.length} admins/supervisors/reception, ${onlineDrivers.length} online drivers`);
        } catch (notifError: any) {
          // Log error but don't fail the ride creation
          console.error('[RideRequestController] Error sending notifications:', notifError);
        }
      }

      res.status(201).json(ride);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'ride', 'create') });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      console.log(`[RideRequestController] UPDATE request received:`, {
        id,
        rideId: req.params.id,
        body: req.body,
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl
      });

      const ride = await rideRequestModel.update(id, req.body);
      if (!ride) {
        console.log(`[RideRequestController] Ride ${id} not found`);
        return res.status(404).json({ error: 'Ride request not found' });
      }

      console.log(`[RideRequestController] Ride ${id} updated successfully:`, ride);
      res.json(ride);
    } catch (error: any) {
      console.error(`[RideRequestController] Error updating ride:`, {
        id: req.params.id,
        error: error.message,
        stack: error.stack
      });
      res.status(400).json({ error: getUserFriendlyError(error, 'ride', 'update') });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await rideRequestModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Ride request not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'ride', 'delete') });
    }
  },

  async getHistoricalReports(req: Request, res: Response) {
    try {
      const { startDate, endDate, period, driverId, status } = req.query;

      const params: {
        startDate?: Date;
        endDate?: Date;
        period?: 'day' | 'week' | 'month';
        driverId?: number;
        status?: any;
      } = {};

      if (startDate && typeof startDate === 'string') {
        params.startDate = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        params.endDate = new Date(endDate);
      }
      if (period && (period === 'day' || period === 'week' || period === 'month')) {
        params.period = period;
      }
      if (driverId) {
        const driverIdNum = parseInt(driverId as string);
        if (!isNaN(driverIdNum)) {
          params.driverId = driverIdNum;
        }
      }
      if (status) {
        params.status = status as any;
      }

      const rides = await rideRequestModel.getHistoricalReports(params);
      res.json(rides);
    } catch (error: any) {
      console.error('Error fetching historical reports:', error);
      res.status(500).json({ error: getUserFriendlyError(error, 'ride') });
    }
  },

  async getReportStatistics(req: Request, res: Response) {
    try {
      const { startDate, endDate, period, driverId } = req.query;

      const params: {
        startDate?: Date;
        endDate?: Date;
        period?: 'day' | 'week' | 'month';
        driverId?: number;
      } = {};

      if (startDate && typeof startDate === 'string') {
        params.startDate = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        params.endDate = new Date(endDate);
      }
      if (period && (period === 'day' || period === 'week' || period === 'month')) {
        params.period = period;
      }
      if (driverId) {
        const driverIdNum = parseInt(driverId as string);
        if (!isNaN(driverIdNum)) {
          params.driverId = driverIdNum;
        }
      }

      const stats = await rideRequestModel.getReportStatistics(params);

      // Enrich driver names
      if (stats.ridesByDriver.length > 0) {
        const allUsers = await userModel.getAll();
        stats.ridesByDriver = stats.ridesByDriver.map(driverStat => {
          const driver = allUsers.find(u => u.id === driverStat.driver_id);
          return {
            ...driverStat,
            driver_name: driver ? (`${driver.last_name || ''}`.trim() || `Driver ${driverStat.driver_id}`) : driverStat.driver_name
          };
        });
      }

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching report statistics:', error);
      res.status(500).json({ error: getUserFriendlyError(error, 'ride') });
    }
  },

  async getDriverPerformanceStats(req: Request, res: Response) {
    try {
      const { startDate, endDate, period, driverId } = req.query;

      const params: {
        startDate?: Date;
        endDate?: Date;
        period?: 'day' | 'week' | 'month';
        driverId?: number;
      } = {};

      if (startDate && typeof startDate === 'string') {
        params.startDate = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        params.endDate = new Date(endDate);
      }
      if (period && (period === 'day' || period === 'week' || period === 'month')) {
        params.period = period;
      }
      if (driverId) {
        const driverIdNum = parseInt(driverId as string);
        if (!isNaN(driverIdNum)) {
          params.driverId = driverIdNum;
        }
      }

      const stats = await rideRequestModel.getDriverPerformanceStats(params);
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching driver performance stats:', error);
      res.status(500).json({ error: getUserFriendlyError(error, 'ride') });
    }
  },
};

