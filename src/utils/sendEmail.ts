import nodemailer from "nodemailer";

export async function sendResetEmail(to: string, token: string) {
  const resetUrl = `https://your-app.com/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "Gmail", 
    auth: {
      user: process.env.MY_GMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.MY_GMAIL,
    to,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password (valid for 15 minutes):</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn’t request this, you can ignore this email.</p>
    `,
  });
}
