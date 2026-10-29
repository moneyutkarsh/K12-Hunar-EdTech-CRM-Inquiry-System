import {
  loginAdmin,
  registerAdmin,
  changeAdminPassword,
  logoutAllSessions,
} from '../services/auth.service.js';

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

export default { login, signup, getMe, changePassword, logoutAll };

