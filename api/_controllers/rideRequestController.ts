import { Request, Response } from 'express';
import { rideRequestModel } from '../_models/rideRequestModel.js';
import { notificationModel } from '../_models/notificationModel.js';
import { userModel } from '../_models/userModel.js';
import { sendBuggyRequestEmail, sendBuggyRequestEmailToDriver } from '../_services/emailService.js';

export const rideRequestController = {
  async getAll(req: Request, res: Response) {
    try {
      const rides = await rideRequestModel.getAll();
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

  async getByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const rides = await rideRequestModel.getByRoomNumber(roomNumber);
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

  async getByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const rides = await rideRequestModel.getByStatus(status as any);
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
          
          // Notify admins, supervisors, and reception (in-app + email)
          for (const staff of adminsSupervisorsReception) {
            // In-app notification
            await notificationModel.create({
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
          
          // Notify online drivers (in-app + email)
          for (const driver of onlineDrivers) {
            // In-app notification
            await notificationModel.create({
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
          
          console.log(`[RideRequestController] Sent notifications: ${adminsSupervisorsReception.length} admins/supervisors/reception, ${onlineDrivers.length} online drivers`);
        } catch (notifError: any) {
          // Log error but don't fail the ride creation
          console.error('[RideRequestController] Error sending notifications:', notifError);
        }
      }
      
      res.status(201).json(ride);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
      res.status(400).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },
};

