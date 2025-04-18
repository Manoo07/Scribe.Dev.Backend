import nodemailer from "nodemailer";
import { getPasswordResetHtml, PASSWORD_RESET_SUBJECT } from "../constants/EmailTemplate";
import { GMAIL_SERVICE, RESET_URL } from "../constants/constants";

export async function sendResetEmail(to: string, token: string) {

  const transporter = nodemailer.createTransport({
    service: GMAIL_SERVICE, 
    auth: {
      user: process.env.SMTP_GMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_GMAIL,
    subject: PASSWORD_RESET_SUBJECT,
    html: getPasswordResetHtml(RESET_URL(token))
  });
}
