import { listAdminOptions } from '../repositories/admins.repo.js';

export async function getAdminOptions(req, res, next) {
  try {
    const options = await listAdminOptions();
    res.json(options);
  } catch (err) {
    next(err);
  }
}

export default {
  getAdminOptions,
};
