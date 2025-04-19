export const PASSWORD_RESET_SUBJECT = 'Password Reset Request';

export const getPasswordResetHtml = (resetUrl: string): string =>
  `<p>You requested a password reset.</p>
  <p>Click the link below to reset your password (valid for 15 minutes):</p>
  <a href="${resetUrl}">${resetUrl}</a>
  <p>If you didn’t request this, you can ignore this email.</p>
`;
