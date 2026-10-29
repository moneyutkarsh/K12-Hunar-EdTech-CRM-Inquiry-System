import { loginAdmin, registerAdmin } from '../services/auth.service.js';

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

export default { login, signup, getMe };
