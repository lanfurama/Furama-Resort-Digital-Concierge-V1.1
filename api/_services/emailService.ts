import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../_utils/logger.js';

dotenv.config();

// Check if email credentials are available
const hasEmailConfig = !!(process.env.EMAIL_HOST_USER && process.env.EMAIL_HOST_PASSWORD);

// Email configuration from environment variables
const emailConfig = hasEmailConfig ? {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
} : null;

// Create transporter only if credentials are available
let transporter: nodemailer.Transporter | null = null;

if (hasEmailConfig && emailConfig) {
  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      logger.error({ err: error }, '❌ Email service configuration error');
    } else {
      logger.info('✅ Email service is ready to send emails');
    }
  });
} else {
  logger.warn('⚠️ Email service not configured. EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are required.');
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email notification
 * @param options Email options (to, subject, html, text)
 * @returns Promise<boolean> - true if email sent successfully
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Check if email config is available
    if (!transporter || !hasEmailConfig) {
      logger.warn('⚠️ Email service not configured. Skipping email send.');
      return false;
    }

    const mailOptions = {
      from: process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text version
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to: options.to }, '✅ Email sent successfully');
    return true;
  } catch (error: any) {
    logger.error({ err: error, to: options.to }, '❌ Error sending email');
    return false;
  }
};

/**
 * Send buggy request notification email to staff
 * @param email Email address of recipient
 * @param guestName Guest name
 * @param roomNumber Room number
 * @param pickup Pickup location
 * @param destination Destination location
 * @returns Promise<boolean>
 */
export const sendBuggyRequestEmail = async (
  email: string,
  guestName: string,
  roomNumber: string,
  pickup: string,
  destination: string
): Promise<boolean> => {
  const subject = '🚗 New Buggy Request - Furama Resort';
  const html = `
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
          <h2 style="margin: 0;">🚗 New Buggy Request</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Furama Digital Concierge</p>
        </div>
        <div class="content">
          <p>You have received a new buggy service request:</p>
          
          <div class="info-box">
            <p><span class="label">Guest Name:</span> ${guestName}</p>
            <p><span class="label">Room Number:</span> ${roomNumber}</p>
            <p><span class="label">Pickup Location:</span> ${pickup}</p>
            <p><span class="label">Destination:</span> ${destination}</p>
          </div>
          
          <p style="margin-top: 20px;">
            <strong>Please check the system to assign a driver or respond to this request.</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Furama Digital Concierge System.</p>
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

/**
 * Send buggy request notification email to driver
 * @param email Email address of driver
 * @param guestName Guest name
 * @param roomNumber Room number
 * @param pickup Pickup location
 * @param destination Destination location
 * @returns Promise<boolean>
 */
export const sendBuggyRequestEmailToDriver = async (
  email: string,
  guestName: string,
  roomNumber: string,
  pickup: string,
  destination: string
): Promise<boolean> => {
  const subject = '🚗 New Buggy Request Available - Accept Now';
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
        .cta { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">🚗 New Buggy Request Available</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Accept this request now!</p>
        </div>
        <div class="content">
          <p>A new buggy service request is waiting for you:</p>
          
          <div class="info-box">
            <p><span class="label">Guest Name:</span> ${guestName}</p>
            <p><span class="label">Room Number:</span> ${roomNumber}</p>
            <p><span class="label">Pickup Location:</span> ${pickup}</p>
            <p><span class="label">Destination:</span> ${destination}</p>
          </div>
          
          <p style="margin-top: 20px;">
            <strong>Please open the Driver Portal to accept this request.</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Furama Digital Concierge System.</p>
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

