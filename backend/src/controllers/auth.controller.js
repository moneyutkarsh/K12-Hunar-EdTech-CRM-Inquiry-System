import { loginAdmin } from '../services/auth.service.js';

export async function login(req, res) {
  const { email, password } = req.body;
  const result = await loginAdmin({
    email,
    password,
    clientIp: req.ip,
  });

  return res.status(200).json({
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

export default { login, getMe };
