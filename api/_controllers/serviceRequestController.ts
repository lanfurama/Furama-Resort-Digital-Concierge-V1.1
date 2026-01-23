import { Request, Response } from 'express';
import { serviceRequestModel } from '../_models/serviceRequestModel.js';
import { userModel } from '../_models/userModel.js';
import { notificationModel } from '../_models/notificationModel.js';
import { sendEmail } from '../_services/emailService.js';
import { getUserFriendlyError } from '../_utils/errorUtils.js';
import logger from '../_utils/logger.js';

export const serviceRequestController = {
  async getAll(req: Request, res: Response) {
    try {
      const services = await serviceRequestModel.getAll();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'service') });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const service = await serviceRequestModel.getById(id);
      if (!service) {
        return res.status(404).json({ error: 'Service request not found' });
      }
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'service') });
    }
  },

  async getByRoomNumber(req: Request, res: Response) {
    try {
      const { roomNumber } = req.params;
      const services = await serviceRequestModel.getByRoomNumber(roomNumber);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'service') });
    }
  },

  async getByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      const services = await serviceRequestModel.getByStatus(status as any);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'service') });
    }
  },

  async getByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const services = await serviceRequestModel.getByType(type as any);
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'service') });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const service = await serviceRequestModel.create(req.body);

      // Send notifications for EXTEND_STAY requests
      if (service.type === 'EXTEND_STAY') {
        try {
          const allUsers = await userModel.getAll();
          const receptionAndAdmins = allUsers.filter(
            u => u.role === 'RECEPTION' || u.role === 'ADMIN' || u.role === 'SUPERVISOR'
          );

          const message = `Room ${service.room_number} requests to extend stay: ${service.details}`;

          const notificationsToCreate = [];

          // Notifications for reception and admins
          for (const staff of receptionAndAdmins) {
            notificationsToCreate.push({
              recipient_id: staff.room_number,
              title: 'Extend Stay Request',
              message: message,
              type: 'INFO',
              is_read: false
            });

            // Send email if available
            if (staff.email && staff.email.trim() !== '') {
              try {
                await sendEmail({
                  to: staff.email,
                  subject: '📅 Extend Stay Request - Furama Resort',
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                        .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #f59e0b; }
                        .label { font-weight: bold; color: #f59e0b; }
                        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          <h2 style="margin: 0;">📅 Extend Stay Request</h2>
                          <p style="margin: 10px 0 0 0; opacity: 0.9;">Furama Resort Danang</p>
                        </div>
                        <div class="content">
                          <p>A guest has requested to extend their stay:</p>
                          <div class="info-box">
                            <p><span class="label">Room Number:</span> ${service.room_number}</p>
                            <p><span class="label">Request Details:</span> ${service.details.replace(/\[NEW_CHECKOUT_DATE:.+?\]/, '')}</p>
                          </div>
                          <p style="margin-top: 20px;">
                            <strong>Please review and confirm this request in the system.</strong>
                          </p>
                        </div>
                        <div class="footer">
                          <p>This is an automated notification from Furama Resort Digital Concierge System.</p>
                        </div>
                      </div>
                    </body>
                    </html>
                  `
                });
                logger.info({ role: staff.role, roomNumber: staff.room_number, email: staff.email }, `[ServiceRequestController] Email sent`);
              } catch (emailError: any) {
                logger.error({ err: emailError, role: staff.role, roomNumber: staff.room_number }, `[ServiceRequestController] Failed to send email`);
              }
            }
          }

          if (notificationsToCreate.length > 0) {
            await notificationModel.createMany(notificationsToCreate as any);
          }

          logger.info({ count: receptionAndAdmins.length }, `[ServiceRequestController] Sent extend stay notifications to ${receptionAndAdmins.length} staff members`);
        } catch (notifError: any) {
          logger.error({ err: notifError }, '[ServiceRequestController] Error sending extend stay notifications');
        }
      }

      res.status(201).json(service);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'service', 'create') });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);

      // Get current service request to check type and status
      const currentService = await serviceRequestModel.getById(id);
      if (!currentService) {
        return res.status(404).json({ error: 'Service request not found' });
      }

      const service = await serviceRequestModel.update(id, req.body);
      if (!service) {
        return res.status(404).json({ error: 'Service request not found' });
      }

      // Handle EXTEND_STAY confirmation: Update user's check_out date
      if (service.type === 'EXTEND_STAY' &&
        service.status === 'CONFIRMED' &&
        currentService.status !== 'CONFIRMED') {
        try {
          // Parse new check-out date from details
          // Format: "... [NEW_CHECKOUT_DATE:ISO_DATE]"
          const details = service.details;
          const dateMatch = details.match(/\[NEW_CHECKOUT_DATE:(.+?)\]/);

          if (dateMatch) {
            const isoDate = dateMatch[1];
            const newCheckOutDate = new Date(isoDate);
            newCheckOutDate.setHours(12, 0, 0, 0); // Set to noon

            // Update user's check_out date
            const user = await userModel.getByRoomNumber(service.room_number);
            if (user) {
              await userModel.update(user.id, { check_out: newCheckOutDate });

              // Send notification to guest
              await notificationModel.create({
                recipient_id: service.room_number,
                title: 'Stay Extended',
                message: `Your stay has been extended. New check-out date: ${newCheckOutDate.toLocaleDateString()}`,
                type: 'SUCCESS',
                is_read: false
              });

              // Send email if available
              if (user.email && user.email.trim() !== '') {
                try {
                  await sendEmail({
                    to: user.email,
                    subject: '✅ Stay Extension Confirmed - Furama Resort',
                    html: `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="utf-8">
                        <style>
                          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                          .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                          .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #059669; }
                          .label { font-weight: bold; color: #059669; }
                          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <div class="header">
                            <h2 style="margin: 0;">✅ Stay Extension Confirmed</h2>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Furama Resort Danang</p>
                          </div>
                          <div class="content">
                            <p>Dear ${user.last_name},</p>
                            
                            <p>We are pleased to confirm that your stay extension request has been approved:</p>
                            
                            <div class="info-box">
                              <p><span class="label">Room Number:</span> ${service.room_number}</p>
                              <p><span class="label">New Check-out Date:</span> ${newCheckOutDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            
                            <p>We hope you continue to enjoy your stay with us!</p>
                          </div>
                          <div class="footer">
                            <p>This is an automated notification from Furama Resort Digital Concierge System.</p>
                          </div>
                        </div>
                      </body>
                      </html>
                    `
                  });
                  logger.info({ roomNumber: service.room_number, email: user.email }, `[ServiceRequestController] Email sent`);
                } catch (emailError: any) {
                  logger.error({ err: emailError, roomNumber: service.room_number }, `[ServiceRequestController] Failed to send email`);
                }
              }

              logger.info({ roomNumber: service.room_number, newCheckOutDate: newCheckOutDate.toLocaleDateString() }, `[ServiceRequestController] ✅ Extended stay for Room ${service.room_number}`);
            }
          }
        } catch (extendError: any) {
          logger.error({ err: extendError }, '[ServiceRequestController] Error processing extend stay');
          // Don't fail the update, just log the error
        }
      }

      res.json(service);
    } catch (error: any) {
      res.status(400).json({ error: getUserFriendlyError(error, 'service', 'update') });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await serviceRequestModel.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Service request not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: getUserFriendlyError(error, 'service', 'delete') });
    }
  },
};

