import crypto from 'crypto';
import { query } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { authenticateOAuth } from './auth.service.js';

export async function sendOtp({ email, provider = 'email' }) {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw HttpError.badRequest('Valid email address is required.');
  }

  // Generate cryptographically secure 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate previous OTPs for this email
  await query('DELETE FROM auth_otps WHERE LOWER(email) = $1', [normalizedEmail]);

  // Store new OTP
  await query(
    `INSERT INTO auth_otps (email, code, provider, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [normalizedEmail, code, provider, expiresAt]
  );

  // Email Notification & Console Dispatch
  console.log(`\n======================================================`);
  console.log(`✉️ [EMAIL VERIFICATION CODE]`);
  console.log(`   To:       ${normalizedEmail}`);
  console.log(`   Provider: ${provider.toUpperCase()}`);
  console.log(`   Code:     🔑 ${code}`);
  console.log(`   Expires:  ${expiresAt.toLocaleTimeString()} (10 mins)`);
  console.log(`======================================================\n`);

  // Try optional SMTP if configured in environment
    let emailSent = false;
  // Try optional SMTP if configured in environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"K12 Hunar Security" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: `Your K12 Hunar Verification Code: ${code}`,
        text: `Your verification code is: ${code}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; background: #050505; color: #f5f5f5; padding: 32px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
            <div style="margin-bottom: 24px;">
              <span style="font-weight: 800; font-size: 20px; color: #ffffff;">K12 <span style="color: #FFD60A;">Hunar</span></span>
            </div>
            <h2 style="color: #F5F5F5; font-size: 18px; margin-bottom: 8px;">Verification Code</h2>
            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.5;">Enter the following 6-digit code in K12 Hunar to complete your verification:</p>
            <div style="background: #141414; border: 1px solid rgba(255, 214, 10, 0.4); padding: 18px 24px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FFD60A; text-align: center; margin: 24px 0; font-family: monospace;">
              ${code}
            </div>
            <p style="color: #737373; font-size: 12px; line-height: 1.4;">This code is valid for 10 minutes. If you did not request this verification code, please ignore this email.</p>
          </div>
        `,
      });
      emailSent = true;
      console.log(`[Real email dispatched to ${normalizedEmail}]`);
    } catch (smtpErr) {
      console.warn('SMTP dispatch failed:', smtpErr.message);
    }
  }

  return {
    success: true,
    message: `Verification code sent to ${normalizedEmail}`,
    email: normalizedEmail,
    // Only return previewCode if SMTP is not configured or failed (fallback)
    previewCode: emailSent ? undefined : code,
  };
}

export async function verifyOtp({ email, code, clientIp }) {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = (code || '').toString().trim();

  if (!normalizedEmail || !cleanCode) {
    throw HttpError.badRequest('Email and 6-digit verification code are required.');
  }

  const res = await query(
    `SELECT * FROM auth_otps WHERE LOWER(email) = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
    [normalizedEmail]
  );
  const row = res.rows[0];

  if (!row) {
    throw HttpError.badRequest('Verification code has expired or is invalid. Please request a new one.');
  }

  if (row.attempts >= 5) {
    await query('DELETE FROM auth_otps WHERE LOWER(email) = $1', [normalizedEmail]);
    throw HttpError.badRequest('Too many failed attempts. Please request a fresh code.');
  }

  if (row.code !== cleanCode) {
    await query('UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1', [row.id]);
    throw HttpError.badRequest('Invalid verification code. Please check and try again.');
  }

  // Code verified! Remove used OTP
  await query('DELETE FROM auth_otps WHERE LOWER(email) = $1', [normalizedEmail]);

  // Authenticate / provision the administrator
  const authResult = await authenticateOAuth({
    provider: row.provider || 'email_otp',
    email: normalizedEmail,
    clientIp,
  });

  return {
    message: 'Verification code confirmed. Access granted.',
    ...authResult,
  };
}

export default { sendOtp, verifyOtp };
