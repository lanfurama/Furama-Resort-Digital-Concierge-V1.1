import { userModel } from '../_models/userModel.js';
import { notificationModel } from '../_models/notificationModel.js';
import { sendEmail } from './emailService.js';

// Configuration: Reminder times before check-out (in minutes)
const REMINDER_TIMES = [60, 30]; // 1 hour and 30 minutes before check-out

/**
 * Check for guests approaching check-out and send reminders
 * This should be called periodically (e.g., every 5-10 minutes)
 */
export const checkAndSendCheckoutReminders = async (): Promise<void> => {
  try {
    console.log('[CheckoutReminder] Checking for guests approaching check-out...');
    
    const allUsers = await userModel.getAll();
    const guests = allUsers.filter(u => u.role === 'GUEST' && u.check_out);
    
    if (guests.length === 0) {
      console.log('[CheckoutReminder] No guests with check-out dates found');
      return;
    }
    
    const now = new Date();
    let remindersSent = 0;
    
    for (const guest of guests) {
      if (!guest.check_out) continue;
      
      const checkOutDate = new Date(guest.check_out);
      
      // Skip if already checked out
      if (now > checkOutDate) {
        continue;
      }
      
      // Check each reminder time
      for (const reminderMinutes of REMINDER_TIMES) {
        const reminderTime = new Date(checkOutDate.getTime() - reminderMinutes * 60 * 1000);
        const timeDiff = now.getTime() - reminderTime.getTime();
        
        // Send reminder if we're within 5 minutes of the reminder time (to account for cron interval)
        if (timeDiff >= 0 && timeDiff < 5 * 60 * 1000) {
          // Check if we already sent this reminder (to avoid duplicates)
          const existingNotifications = await notificationModel.getByRecipientId(guest.room_number);
          const alreadySent = existingNotifications.some(
            n => n.message.includes(`${reminderMinutes} minutes`) && 
                 n.message.includes('check-out') &&
                 n.title === 'Check-out Reminder' &&
                 // Check if sent within last hour (to avoid spam)
                 (Date.now() - new Date(n.created_at).getTime()) < 60 * 60 * 1000
          );
          
          if (!alreadySent) {
            const hours = Math.floor(reminderMinutes / 60);
            const minutes = reminderMinutes % 60;
            const timeText = hours > 0 
              ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minutes` : ''}`
              : `${minutes} minutes`;
            
            const message = `Your check-out is in ${timeText}. Check-out time: ${checkOutDate.toLocaleString()}`;
            
            // Send in-app notification
            await notificationModel.create({
              recipient_id: guest.room_number,
              title: 'Check-out Reminder',
              message: message,
              type: 'WARNING',
              is_read: false
            });
            
            // Send email if available
            if (guest.email && guest.email.trim() !== '') {
              try {
                await sendCheckoutReminderEmail(
                  guest.email,
                  guest.last_name,
                  guest.room_number,
                  checkOutDate
                );
                console.log(`[CheckoutReminder] Email sent to ${guest.room_number} (${guest.email})`);
              } catch (emailError: any) {
                console.error(`[CheckoutReminder] Failed to send email to ${guest.room_number}:`, emailError);
              }
            }
            
            console.log(`[CheckoutReminder] ✅ Reminder sent to ${guest.room_number} (${timeText} before check-out)`);
            remindersSent++;
          }
        }
      }
    }
    
    if (remindersSent > 0) {
      console.log(`[CheckoutReminder] Sent ${remindersSent} checkout reminder(s)`);
    } else {
      console.log('[CheckoutReminder] No reminders needed at this time');
    }
  } catch (error: any) {
    console.error('[CheckoutReminder] Error checking checkout reminders:', error);
  }
};

/**
 * Send checkout reminder email to guest
 */
const sendCheckoutReminderEmail = async (
  email: string,
  guestName: string,
  roomNumber: string,
  checkOutDate: Date
): Promise<boolean> => {
  const subject = '⏰ Check-out Reminder - Furama Resort';
  const html = `
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
          <h2 style="margin: 0;">⏰ Check-out Reminder</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Furama Resort Danang</p>
        </div>
        <div class="content">
          <p>Dear ${guestName},</p>
          
          <p>This is a friendly reminder about your upcoming check-out:</p>
          
          <div class="info-box">
            <p><span class="label">Room Number:</span> ${roomNumber}</p>
            <p><span class="label">Check-out Time:</span> ${checkOutDate.toLocaleString()}</p>
          </div>
          
          <p>We hope you have enjoyed your stay with us. If you need to extend your stay, please contact reception.</p>
          
          <p style="margin-top: 20px;">
            <strong>Thank you for choosing Furama Resort Danang!</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated reminder from Furama Resort Digital Concierge System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: subject,
    html: html,
  });
};

