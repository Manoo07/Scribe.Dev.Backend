import nodemailer from 'nodemailer';
import { getPasswordResetHtml, PASSWORD_RESET_SUBJECT } from '@constants/EmailTemplate';
import { GMAIL_SERVICE, RESET_URL } from '@constants/constants';
import { logger } from '@services/logService';

export async function sendResetEmail(to: string, token: string) {
  logger.info(`Attempting to send password reset email to ${to}`);

  const transporter = nodemailer.createTransport({
    service: GMAIL_SERVICE,
    auth: {
      user: process.env.SMTP_GMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_GMAIL,
      to,
      subject: PASSWORD_RESET_SUBJECT,
      html: getPasswordResetHtml(RESET_URL(token)),
    });
    logger.info(`Password reset email sent successfully to ${to}`);
  } catch (error: any) {
    logger.error(`Error sending password reset email to ${to}: ${error.message}`);
    throw new Error(`Error sending password reset email: ${error.message}`);
  }
}
