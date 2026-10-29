import {
  loginAdmin,
  registerAdmin,
  changeAdminPassword,
  logoutAllSessions,
  authenticateOAuth,
} from '../services/auth.service.js';
import { sendOtp, verifyOtp } from '../services/otp.service.js';

export async function login(req, res) {
  const { email, password } = req.body;
  const result = await loginAdmin({
    email,
    password,
    clientIp: req.ip,
  });

  return res.status(200).json({
    token: result.token,
    expiresAt: result.expiresAt,
    admin: result.admin,
    data: result,
  });
}

export async function signup(req, res) {
  const { email, password } = req.body;
  const result = await registerAdmin({
    email,
    password,
  });

  return res.status(201).json({
    message: 'Admin account created successfully',
    token: result.token,
    expiresAt: result.expiresAt,
    admin: result.admin,
    data: result,
  });
}

export async function getMe(req, res) {
  return res.status(200).json({
    data: {
      admin: req.admin,
    },
  });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const result = await changeAdminPassword({
    adminId: req.admin.id,
    currentPassword,
    newPassword,
  });

  return res.status(200).json({
    message: result.message,
    token: result.token,
    expiresAt: result.expiresAt,
    tokenVersion: result.tokenVersion,
  });
}

export async function logoutAll(req, res) {
  const result = await logoutAllSessions(req.admin.id);
  return res.status(200).json(result);
}

export async function oauthGoogle(req, res) {
  const { credential, email, name, avatarUrl } = req.body;
  let resolvedEmail = email;
  let resolvedName = name;
  let resolvedAvatar = avatarUrl;

  if (credential && credential.includes('.')) {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const parsed = JSON.parse(payloadJson);
        if (parsed.email) {
          resolvedEmail = parsed.email;
          resolvedName = parsed.name || resolvedName;
          resolvedAvatar = parsed.picture || resolvedAvatar;
        }
      }
    } catch {
      // fallback
    }
  }

  if (!resolvedEmail) {
    return res.status(400).json({ error: { message: 'Google account email is required' } });
  }

  const result = await authenticateOAuth({
    provider: 'google',
    email: resolvedEmail,
    name: resolvedName,
    avatarUrl: resolvedAvatar,
    clientIp: req.ip,
  });

  return res.status(200).json({
    message: 'Google authentication successful',
    token: result.token,
    expiresAt: result.expiresAt,
    admin: result.admin,
    data: result,
  });
}

export async function oauthMicrosoft(req, res) {
  const { email, name, avatarUrl } = req.body;
  if (!email) {
    return res.status(400).json({ error: { message: 'Microsoft 365 account email is required' } });
  }

  const result = await authenticateOAuth({
    provider: 'microsoft',
    email,
    name: name || email.split('@')[0],
    avatarUrl: avatarUrl || null,
    clientIp: req.ip,
  });

  return res.status(200).json({
    message: 'Microsoft 365 authentication successful',
    token: result.token,
    expiresAt: result.expiresAt,
    admin: result.admin,
    data: result,
  });
}

export async function sendVerificationOtp(req, res) {
  const { email, provider } = req.body;
  const result = await sendOtp({ email, provider });
  return res.status(200).json(result);
}

export async function verifyVerificationOtp(req, res) {
  const { email, code } = req.body;
  const result = await verifyOtp({ email, code, clientIp: req.ip });
  return res.status(200).json({
    message: result.message,
    token: result.token,
    expiresAt: result.expiresAt,
    admin: result.admin,
    data: result,
  });
}

export default {
  login,
  signup,
  getMe,
  changePassword,
  logoutAll,
  oauthGoogle,
  oauthMicrosoft,
  sendVerificationOtp,
  verifyVerificationOtp,
};


