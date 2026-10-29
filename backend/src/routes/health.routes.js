import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  let dbStatus = 'down';
  try {
    await query('SELECT 1');
    dbStatus = 'up';
  } catch (err) {
    dbStatus = 'down';
  }

  return res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
